/**
 * Regression Test Suite
 *
 * Covers: RSVP (valid, not-attending, duplicate, invalid), template clone,
 * text change, color change, single image upload, multi-image upload,
 * music upload, image delete, maintenance mode toggle.
 *
 * Each browser project gets its own unique test-clone slug so projects can
 * run in parallel without slug collisions.
 *
 * Run:  npx playwright test tests/e2e/regression.spec.ts
 * Dev server must be running on localhost:5001 (or will be auto-started via webServer config).
 */

import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5001';

// ── Platform-admin credentials (development defaults) ─────────────────────
const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'haruttev2025admin';

// ── Unique slug per parallel run to avoid collisions ─────────────────────
const RUN_ID = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const TEST_SLUG = `reg-test-${RUN_ID}`;

// ── Minimal test assets generated in-memory (no fixture files needed) ────

// 1×1 transparent PNG (68 bytes, well-formed)
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScAAAAAElFTkSuQmCC',
  'base64'
);

// 128-byte buffer accepted as audio/mpeg (content check is on MIME type, not magic bytes)
const TINY_MP3 = (() => {
  const buf = Buffer.alloc(128, 0);
  // ID3v2.3 header: magic + version + flags + synchsafe size
  buf.write('ID3', 0, 'ascii');
  buf[3] = 3; buf[4] = 0; buf[5] = 0;
  buf[6] = 0; buf[7] = 0; buf[8] = 0; buf[9] = 10;
  // MPEG frame sync hint after header block
  buf[20] = 0xff; buf[21] = 0xfb;
  return buf;
})();

// ── Shared state (filled in beforeAll, used across tests) ─────────────────
let adminToken = '';
let testTemplateId = '';

// ═════════════════════════════════════════════════════════════════════════════
// Serial suite — tests share a single cloned template and must run in order
// ═════════════════════════════════════════════════════════════════════════════
test.describe.serial('Regression — localhost:5001 / fresh test-clone template', () => {

  // ── SETUP: admin login + clone main template ────────────────────────────
  test.beforeAll(async ({ request }) => {
    // 1. Log in as platform admin
    const loginRes = await request.post(`${BASE}/api/admin/login`, {
      data: { username: ADMIN_USERNAME, password: ADMIN_PASSWORD },
    });
    expect(loginRes.ok(), `Admin login failed (${loginRes.status()}): ${await loginRes.text()}`).toBeTruthy();
    adminToken = (await loginRes.json()).token;
    expect(adminToken).toBeTruthy();

    // 2. Discover main / first template to use as clone source
    const listRes = await request.get(`${BASE}/api/admin/templates`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(listRes.ok()).toBeTruthy();
    const templates: any[] = await listRes.json();
    expect(templates.length, 'At least one template must exist in the database').toBeGreaterThan(0);
    const sourceId: string = (templates.find((t: any) => t.isMain) ?? templates[0]).id;

    // 3. Clone into a fresh test template
    const cloneRes = await request.post(`${BASE}/api/admin/templates`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        sourceTemplateId: sourceId,
        slug: TEST_SLUG,
        name: `Regression Test — ${RUN_ID}`,
      },
    });
    expect(cloneRes.ok(), `Clone failed (${cloneRes.status()}): ${await cloneRes.text()}`).toBeTruthy();
    testTemplateId = (await cloneRes.json()).id;
    expect(testTemplateId, 'Cloned template must have an ID').toBeTruthy();
  });

  // ── TEARDOWN: delete the test template ────────────────────────────────
  test.afterAll(async ({ request }) => {
    if (!testTemplateId) return;
    await request.delete(`${BASE}/api/admin/templates/${testTemplateId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
  });

  // ───────────────────────────────────────────────────────────────────────
  // 1. TEMPLATE CLONE
  // ───────────────────────────────────────────────────────────────────────
  test('clone — public config endpoint returns correct slug and template ID', async ({ request }) => {
    const res = await request.get(`${BASE}/api/templates/${TEST_SLUG}/config`);
    expect(res.ok(), `Config by slug failed: ${await res.text()}`).toBeTruthy();

    const data = await res.json();
    expect(data.slug).toBe(TEST_SLUG);
    expect(data.templateId).toBe(testTemplateId);
    expect(data.config, 'Config object must be present').toBeTruthy();
  });

  test('clone — config is also accessible by template ID', async ({ request }) => {
    const res = await request.get(`${BASE}/api/templates/${testTemplateId}/config`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.templateId).toBe(testTemplateId);
  });

  // ───────────────────────────────────────────────────────────────────────
  // 2. RSVP — valid attending
  // ───────────────────────────────────────────────────────────────────────
  test('rsvp — submits an attending RSVP successfully', async ({ request }) => {
    const res = await request.post(`${BASE}/api/templates/${testTemplateId}/rsvp`, {
      data: {
        templateId: testTemplateId,
        firstName: 'Armen',
        lastName: 'Testyan',
        email: `armen.${RUN_ID}@example.com`,
        guestEmail: `armen.${RUN_ID}@example.com`,
        guestCount: '2',
        attendance: 'attending',
        guests: 2,
      },
    });
    expect(res.ok(), `Attending RSVP failed: ${await res.text()}`).toBeTruthy();
    const data = await res.json();
    expect(data.rsvp).toBeTruthy();
    expect(data.rsvp.attendance).toBe('attending');
    expect(data.message).toBeTruthy();
  });

  // ───────────────────────────────────────────────────────────────────────
  // 3. RSVP — not-attending
  // ───────────────────────────────────────────────────────────────────────
  test('rsvp — submits a not-attending RSVP successfully', async ({ request }) => {
    const res = await request.post(`${BASE}/api/templates/${testTemplateId}/rsvp`, {
      data: {
        templateId: testTemplateId,
        firstName: 'Ani',
        lastName: 'Decline',
        email: `ani.decline.${RUN_ID}@example.com`,
        guestEmail: `ani.decline.${RUN_ID}@example.com`,
        guestCount: '1',
        attendance: 'not-attending',
        guests: 1,
      },
    });
    expect(res.ok(), `Not-attending RSVP failed: ${await res.text()}`).toBeTruthy();
    const data = await res.json();
    expect(data.rsvp.attendance).toBe('not-attending');
  });

  // ───────────────────────────────────────────────────────────────────────
  // 4. RSVP — duplicate email is rejected
  // ───────────────────────────────────────────────────────────────────────
  test('rsvp — rejects a duplicate email submission with 400', async ({ request }) => {
    // Re-use the same email from test #2 (attending)
    const res = await request.post(`${BASE}/api/templates/${testTemplateId}/rsvp`, {
      data: {
        templateId: testTemplateId,
        firstName: 'Armen',
        lastName: 'Again',
        email: `armen.${RUN_ID}@example.com`,
        guestEmail: `armen.${RUN_ID}@example.com`,
        guestCount: '1',
        attendance: 'attending',
        guests: 1,
      },
    });
    expect(res.status()).toBe(400);
    const data = await res.json();
    expect(data.message).toBeTruthy();
  });

  // ───────────────────────────────────────────────────────────────────────
  // 5. RSVP — invalid body is rejected
  // ───────────────────────────────────────────────────────────────────────
  test('rsvp — rejects invalid body with 400 (missing required fields)', async ({ request }) => {
    const res = await request.post(`${BASE}/api/templates/${testTemplateId}/rsvp`, {
      data: { templateId: testTemplateId }, // missing firstName, lastName, email, guestCount, attendance
    });
    expect(res.status()).toBe(400);
  });

  // ───────────────────────────────────────────────────────────────────────
  // 6. CHANGE TEXT — couple names and venue
  // ───────────────────────────────────────────────────────────────────────
  test('config — updates couple names and venue text', async ({ request }) => {
    const res = await request.put(`${BASE}/api/admin/templates/${testTemplateId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        config: {
          coupleName: 'Aram & Nare',
          groomName: 'Aram',
          brideName: 'Nare',
          venue: 'Regression Hall',
          venueAddress: '42 Test Street, Yerevan',
        },
      },
    });
    expect(res.ok(), `Text update failed: ${await res.text()}`).toBeTruthy();
  });

  test('config — text changes are persisted after update', async ({ request }) => {
    // Read back the config and verify the update took effect
    const cfgRes = await request.get(`${BASE}/api/templates/${testTemplateId}/config`);
    expect(cfgRes.ok()).toBeTruthy();
    const cfg = await cfgRes.json();
    // The returned config must be an object (merges defaults + overrides)
    expect(typeof cfg.config).toBe('object');
    expect(cfg.config).not.toBeNull();
    // Verify at least one of the written fields is persisted
    const hasCoupleName =
      cfg.config.coupleName === 'Aram & Nare' ||
      cfg.config.groomName === 'Aram' ||
      cfg.config.brideName === 'Nare';
    expect(hasCoupleName, 'At least one couple name field must be persisted').toBeTruthy();
  });

  // ───────────────────────────────────────────────────────────────────────
  // 7. CHANGE COLORS — primary, secondary, accent
  // ───────────────────────────────────────────────────────────────────────
  test('config — updates primary, secondary and accent colors', async ({ request }) => {
    const res = await request.put(`${BASE}/api/admin/templates/${testTemplateId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        config: {
          primaryColor: '#FF5733',
          secondaryColor: '#C70039',
          accentColor: '#900C3F',
        },
      },
    });
    expect(res.ok(), `Color update failed: ${await res.text()}`).toBeTruthy();
  });

  test('config — color changes are persisted after update', async ({ request }) => {
    const cfgRes = await request.get(`${BASE}/api/templates/${testTemplateId}/config`);
    expect(cfgRes.ok()).toBeTruthy();
    const cfg = await cfgRes.json();
    expect(cfg.config.primaryColor).toBe('#FF5733');
    expect(cfg.config.secondaryColor).toBe('#C70039');
    expect(cfg.config.accentColor).toBe('#900C3F');
  });

  // ───────────────────────────────────────────────────────────────────────
  // 8. IMAGE UPLOAD — single image
  // ───────────────────────────────────────────────────────────────────────
  test('images — uploads a single PNG to the gallery', async ({ request }) => {
    const res = await request.post(
      `${BASE}/api/templates/${testTemplateId}/photos/upload`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
        multipart: {
          image: { name: 'single-test.png', mimeType: 'image/png', buffer: TINY_PNG },
          category: 'gallery',
        },
      }
    );
    expect(res.ok(), `Single image upload failed: ${await res.text()}`).toBeTruthy();
    const data = await res.json();
    // Response may have url, id, or both
    expect(data.url ?? data.id, 'Upload response must contain url or id').toBeTruthy();
  });

  // ───────────────────────────────────────────────────────────────────────
  // 9. IMAGE UPLOAD — multiple images (3 in sequence, simulates batch upload)
  // ───────────────────────────────────────────────────────────────────────
  test('images — uploads 3 images in sequence and all appear in listing', async ({ request }) => {
    for (let i = 1; i <= 3; i++) {
      const res = await request.post(
        `${BASE}/api/templates/${testTemplateId}/photos/upload`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
          multipart: {
            image: { name: `multi-${i}.png`, mimeType: 'image/png', buffer: TINY_PNG },
            category: 'gallery',
          },
        }
      );
      expect(res.ok(), `Image ${i}/3 upload failed: ${await res.text()}`).toBeTruthy();
    }

    // Verify the image listing reflects all uploads (1 from previous test + 3 from this)
    const listRes = await request.get(
      `${BASE}/api/templates/${testTemplateId}/images`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    expect(listRes.ok(), `Image list failed: ${await listRes.text()}`).toBeTruthy();
    const images = await listRes.json();
    expect(Array.isArray(images)).toBeTruthy();
    expect(images.length, 'Should have at least 4 images after uploads').toBeGreaterThanOrEqual(4);
  });

  // ───────────────────────────────────────────────────────────────────────
  // 10. MUSIC UPLOAD
  // ───────────────────────────────────────────────────────────────────────
  test('music — uploads an MP3 audio file', async ({ request }) => {
    const res = await request.post(
      `${BASE}/api/templates/${testTemplateId}/music/upload`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
        multipart: {
          music: { name: 'test-track.mp3', mimeType: 'audio/mpeg', buffer: TINY_MP3 },
        },
      }
    );
    expect(res.ok(), `Music upload failed: ${await res.text()}`).toBeTruthy();
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.url).toContain('/api/audio/serve/');
    expect(data.name).toBe('test-track.mp3');
  });

  // ───────────────────────────────────────────────────────────────────────
  // 11. IMAGE DELETE — can remove an uploaded image
  // ───────────────────────────────────────────────────────────────────────
  test('images — can delete an uploaded image', async ({ request }) => {
    // Fetch current list and pick the first image
    const listRes = await request.get(
      `${BASE}/api/templates/${testTemplateId}/images`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const images: any[] = await listRes.json();
    expect(images.length, 'Must have images to delete').toBeGreaterThan(0);
    const target = images[0];

    const delRes = await request.delete(
      `${BASE}/api/templates/${testTemplateId}/images/${target.id}`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    expect(delRes.ok(), `Image delete failed: ${await delRes.text()}`).toBeTruthy();
    const result = await delRes.json();
    expect(result.success ?? result.message).toBeTruthy();

    // Confirm it no longer appears in the list
    const afterRes = await request.get(
      `${BASE}/api/templates/${testTemplateId}/images`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const remaining: any[] = await afterRes.json();
    expect(remaining.find((img: any) => img.id === target.id)).toBeUndefined();
  });

  // ───────────────────────────────────────────────────────────────────────
  // 12. RSVP LIST — admin sees both RSVPs with correct attendance values
  // ───────────────────────────────────────────────────────────────────────
  test('rsvps — admin panel lists all submitted RSVPs with correct attendance', async ({ request }) => {
    const res = await request.get(
      `${BASE}/api/admin-panel/${testTemplateId}/rsvps`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    expect(res.ok(), `RSVP list failed: ${await res.text()}`).toBeTruthy();
    const data = await res.json();
    const list: any[] = data.rsvps ?? data;
    expect(Array.isArray(list)).toBeTruthy();
    // Tests #2 and #3 each submitted one RSVP; #4 was rejected as duplicate
    expect(list.length, 'Should have at least 2 RSVPs').toBeGreaterThanOrEqual(2);
    const attendances = list.map((r: any) => r.attendance);
    expect(attendances).toContain('attending');
    expect(attendances).toContain('not-attending');
  });

  // ───────────────────────────────────────────────────────────────────────
  // 13. MAINTENANCE MODE — toggle on and off
  // ───────────────────────────────────────────────────────────────────────
  test('maintenance — can enable maintenance mode', async ({ request }) => {
    const res = await request.post(
      `${BASE}/api/templates/${testTemplateId}/maintenance`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: { enabled: true },
      }
    );
    expect(res.ok(), `Enable maintenance failed: ${await res.text()}`).toBeTruthy();
    expect((await res.json()).enabled).toBe(true);
  });

  test('maintenance — can disable maintenance mode', async ({ request }) => {
    const res = await request.post(
      `${BASE}/api/templates/${testTemplateId}/maintenance`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: { enabled: false },
      }
    );
    expect(res.ok(), `Disable maintenance failed: ${await res.text()}`).toBeTruthy();
    expect((await res.json()).enabled).toBe(false);
  });

  // ───────────────────────────────────────────────────────────────────────
  // 14. HEALTH CHECK — server is healthy
  // ───────────────────────────────────────────────────────────────────────
  test('server — /health endpoint returns ok', async ({ request }) => {
    const res = await request.get(`${BASE}/health`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.status).toBe('ok');
  });

});
