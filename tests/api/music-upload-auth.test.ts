/**
 * Regression tests for music upload auth bug fixes (April 2026).
 *
 * Covers:
 *  1. Platform admin can obtain a management-user token via /api/auth/template-login
 *  2. Management-user token passes authenticateUser (GET /api/templates/:id/rsvps)
 *  3. Management-user token passes authenticateUser + requireAdminPanelAccess
 *     (POST /api/templates/:id/music/stream-upload)
 *  4. Management-user token passes DELETE /api/templates/:id/music/:filename
 *  5. Platform admin JWT (no userId) is correctly rejected by authenticateUser endpoints
 *  6. Missing token is correctly rejected
 *  7. RSVP public submission still works without any auth token
 *
 * Prerequisites: dev server running on http://localhost:5001
 *   npm run dev
 * Then in another terminal:
 *   npx vitest run tests/api/music-upload-auth.test.ts
 */

import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import fs from 'fs';

const BASE = 'http://localhost:5001';

// Template that exists in the local DB (seeded by create-management-admin.ts)
const TEMPLATE_ID = '7377a3e4-6c54-4725-aac9-a8b3ad90ae05';

// Platform admin credentials (validated by /api/admin/login)
const PLATFORM_ADMIN = { username: 'harut', password: 'wedding25' };

// ─── Token holders populated in beforeAll ───────────────────────────────────
let platformAdminToken = '';   // JWT with { username, role:"admin" } — no userId
let managementUserToken = '';  // JWT with { userId, email } from /api/auth/template-login

// ─── Helpers ────────────────────────────────────────────────────────────────
async function json(res: Response) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

// ─── Setup ──────────────────────────────────────────────────────────────────
beforeAll(async () => {
  // 1. Get platform admin JWT
  const adminRes = await fetch(`${BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(PLATFORM_ADMIN),
  });
  expect(adminRes.status, 'platform admin login should succeed').toBe(200);
  const adminData = await json(adminRes);
  platformAdminToken = adminData.token;
  expect(platformAdminToken, 'platform admin token must be present').toBeTruthy();

  // 2. Get management-user JWT (the token that contains userId)
  const mgmtRes = await fetch(`${BASE}/api/auth/template-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: PLATFORM_ADMIN.username, password: PLATFORM_ADMIN.password }),
  });
  expect(mgmtRes.status, 'management user login should succeed').toBe(200);
  const mgmtData = await json(mgmtRes);
  managementUserToken = mgmtData.token;
  expect(managementUserToken, 'management user token must be present').toBeTruthy();
});

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('Auth token distinction', () => {
  it('platform admin token should NOT contain userId (regression guard)', () => {
    // Decode payload without verification — we just check the shape
    const payload = JSON.parse(Buffer.from(platformAdminToken.split('.')[1], 'base64').toString());
    expect(payload.userId, 'platform admin JWT must not have userId').toBeUndefined();
    expect(payload.username).toBe('harut');
    expect(payload.role).toBe('admin');
  });

  it('management user token should contain userId (regression guard)', () => {
    const payload = JSON.parse(Buffer.from(managementUserToken.split('.')[1], 'base64').toString());
    expect(payload.userId, 'management user JWT must have userId').toBeTruthy();
    expect(payload.email).toBe('harut');
  });
});

describe('GET /api/templates/:id/rsvps — authenticateUser guard', () => {
  const url = `${BASE}/api/templates/${TEMPLATE_ID}/rsvps`;

  it('returns 404 with no token (endpoint enumeration protection)', async () => {
    // authenticateUser deliberately returns 404 — not 401 — on missing token
    // to prevent unauthenticated callers from discovering protected endpoint paths.
    const res = await fetch(url);
    expect(res.status).toBe(404);
  });

  it('returns 401 with platform admin token (no userId)', async () => {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${platformAdminToken}` },
    });
    expect(res.status).toBe(401);
    const body = await json(res);
    expect(body.error).toMatch(/user not found|inactive/i);
  });

  it('returns 200 with management user token', async () => {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${managementUserToken}` },
    });
    expect(res.status).toBe(200);
    const body = await json(res);
    expect(Array.isArray(body)).toBe(true);
  });
});

describe('POST /api/templates/:id/music/stream-upload — authenticateUser + requireAdminPanelAccess', () => {
  const url = `${BASE}/api/templates/${TEMPLATE_ID}/music/stream-upload`;

  it('returns 404 with no token', async () => {
    const fd = new FormData();
    fd.append('music', new Blob([''], { type: 'audio/mpeg' }), 'test.mp3');
    const res = await fetch(url, { method: 'POST', body: fd });
    // authenticateUser returns 404 on missing token to prevent endpoint enumeration
    expect(res.status).toBe(404);
  });

  it('returns 401 with platform admin token (no userId)', async () => {
    const fd = new FormData();
    fd.append('music', new Blob([''], { type: 'audio/mpeg' }), 'test.mp3');
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${platformAdminToken}` },
      body: fd,
    });
    expect(res.status).toBe(401);
    const body = await json(res);
    expect(body.error).toMatch(/user not found|inactive/i);
  });

  it('returns 400 (no file content) or 200 with management user token — auth passes', async () => {
    // We send an empty audio blob — the endpoint will accept it through auth
    // but may reject the empty file or accept it (depending on multer).
    // Either way, we must NOT get 401.
    const fd = new FormData();
    fd.append('music', new Blob([new Uint8Array(16)], { type: 'audio/mpeg' }), 'test.mp3');
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${managementUserToken}` },
      body: fd,
    });
    expect(res.status, 'must not be 401 with management user token').not.toBe(401);
    expect(res.status, 'must not be 403 with management user token').not.toBe(403);
  });
});

describe('DELETE /api/templates/:id/music/:filename — authenticateUser + requireAdminPanelAccess', () => {
  const fakeFilename = 'nonexistent-test-file.mp3';
  const url = `${BASE}/api/templates/${TEMPLATE_ID}/music/${fakeFilename}`;

  it('returns 401 with no token', async () => {
    const res = await fetch(url, { method: 'DELETE' });
    // No token → 404 from authenticateUser (endpoint enumeration protection)
    expect([401, 404]).toContain(res.status);
  });

  it('returns 401 with platform admin token (no userId)', async () => {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${platformAdminToken}` },
    });
    expect(res.status).toBe(401);
    const body = await json(res);
    expect(body.error).toMatch(/user not found|inactive/i);
  });

  it('does not return 401 or 403 with management user token — auth passes', async () => {
    // File doesn't exist in R2, so we expect 404/500 from storage — NOT 401/403
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${managementUserToken}` },
    });
    expect(res.status, 'must not be 401 with management user token').not.toBe(401);
    expect(res.status, 'must not be 403 with management user token').not.toBe(403);
  });
});

describe('RSVP public submission — no auth required (regression guard)', () => {
  it('POST /api/templates/:id/rsvp accepts requests without Authorization header', { timeout: 15000 }, async () => {
    const res = await fetch(`${BASE}/api/templates/${TEMPLATE_ID}/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Regression',
        lastName: 'Test',
        email: `regression-test-${Date.now()}@example.com`,
        guestEmail: `regression-test-${Date.now()}@example.com`,
        guestCount: '1',
        attendance: 'attending',
      }),
    });
    // 200 = success, 400 = validation/duplicate (still passed auth), 503 = maintenance
    // Any of these mean auth is not blocking public submissions
    expect([200, 400, 503], `unexpected status ${res.status}`).toContain(res.status);
  });
});

describe('Health check — server is up (baseline)', () => {
  it('GET /health returns 200', async () => {
    const res = await fetch(`${BASE}/health`);
    expect(res.status).toBe(200);
    const body = await json(res);
    expect(body.status).toBe('ok');
  });
});
