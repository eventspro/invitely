/**
 * Integration tests for /api/cron/task-reminders and /health
 *
 * Uses a minimal Express app (no full server IIFE) + real DB.
 * cron_health rows are cleaned up after each test.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import cronRouter from "../../server/routes/cron-task-reminders.js";
import { db } from "../../server/db.js";
import {
  managementUsers,
  templates,
  orders,
  userAdminPanels,
  plannerTasks,
  telegramCallbackTokens,
  cronHealth,
} from "../../shared/schema.js";
import { eq, and } from "drizzle-orm";

const app = express();
app.use(express.json());
app.use("/api/cron", cronRouter);

// ─── Fixtures ─────────────────────────────────────────────────────────────────

let testUserId: string;
let testTemplateId: string;
let testOrderId: string;
let testPanelId: string;
const TEST_SECRET = "test-cron-secret-xyz";
const TEST_CHAT_ID = "777111222";

beforeAll(async () => {
  process.env.CRON_SECRET = TEST_SECRET;

  const [user] = await db.insert(managementUsers).values({ email: `cron-test-${Date.now()}@example.com`, passwordHash: "irrelevant", firstName: "Test" }).returning();
  testUserId = user.id;

  const [tmpl] = await db.insert(templates).values({ name: "Cron Test Template", slug: `cron-test-${Date.now()}`, templateKey: "test", config: {} }).returning();
  testTemplateId = tmpl.id;

  const [order] = await db.insert(orders).values({ orderNumber: `ORD-CRON-${Date.now()}`, userId: testUserId, templateId: testTemplateId, templatePlan: "ultimate", amount: "0", paymentMethod: "test", status: "completed", adminAccessGranted: true }).returning();
  testOrderId = order.id;

  const [panel] = await db.insert(userAdminPanels).values({ userId: testUserId, templateId: testTemplateId, templateSlug: `cron-panel-${Date.now()}`, orderId: testOrderId, isActive: true, settings: { telegramChatId: TEST_CHAT_ID, telegramEnabled: true } }).returning();
  testPanelId = panel.id;
});

afterAll(async () => {
  await db.delete(plannerTasks).where(and(eq(plannerTasks.userId, testUserId), eq(plannerTasks.templateId, testTemplateId))).catch(() => {});
  await db.delete(cronHealth).where(eq(cronHealth.jobName, "task-reminders")).catch(() => {});
  await db.delete(userAdminPanels).where(eq(userAdminPanels.id, testPanelId)).catch(() => {});
  await db.delete(orders).where(eq(orders.id, testOrderId)).catch(() => {});
  await db.delete(templates).where(eq(templates.id, testTemplateId)).catch(() => {});
  await db.delete(managementUsers).where(eq(managementUsers.id, testUserId)).catch(() => {});
  delete process.env.CRON_SECRET;
});

beforeEach(async () => {
  await db.delete(plannerTasks).where(and(eq(plannerTasks.userId, testUserId), eq(plannerTasks.templateId, testTemplateId))).catch(() => {});
  await db.delete(cronHealth).where(eq(cronHealth.jobName, "task-reminders")).catch(() => {});
});

// ─── Auth tests ───────────────────────────────────────────────────────────────

describe("GET /api/cron/task-reminders — auth", () => {
  it("returns 401 with no credentials", async () => {
    await request(app).get("/api/cron/task-reminders").expect(401).then(r => {
      expect(r.body.ok).toBe(false);
      expect(r.body.error).toBe("Unauthorized");
    });
  });

  it("returns 401 with wrong header secret", async () => {
    await request(app).get("/api/cron/task-reminders").set("Authorization", "Bearer wrong").expect(401);
  });

  it("returns 401 with wrong query secret", async () => {
    await request(app).get("/api/cron/task-reminders?secret=wrong").expect(401);
  });

  it("accepts valid Authorization header", async () => {
    const res = await request(app)
      .get("/api/cron/task-reminders")
      .set("Authorization", `Bearer ${TEST_SECRET}`)
      .expect(200);
    expect(res.body.ok).toBe(true);
    expect(typeof res.body.processed).toBe("number");
  });

  it("accepts valid ?secret= query param", async () => {
    const res = await request(app)
      .get(`/api/cron/task-reminders?secret=${TEST_SECRET}`)
      .expect(200);
    expect(res.body.ok).toBe(true);
  });

  it("POST also accepts valid header", async () => {
    const res = await request(app)
      .post("/api/cron/task-reminders")
      .set("Authorization", `Bearer ${TEST_SECRET}`)
      .expect(200);
    expect(res.body.ok).toBe(true);
  });
});

// ─── Overdue catch-up ─────────────────────────────────────────────────────────

describe("GET /api/cron/task-reminders — overdue catch-up", () => {
  it("processes a task whose nextReminderAtUtc is in the past", async () => {
    // Insert a task that was due 10 minutes ago
    await db.insert(plannerTasks).values({
      userId: testUserId,
      templateId: testTemplateId,
      title: "Overdue task",
      priority: "medium",
      status: "pending",
      reminderEnabled: true,
      telegramReminderState: "scheduled",
      dueAtUtc: new Date(Date.now() - 10 * 60_000),
      nextReminderAtUtc: new Date(Date.now() - 10 * 60_000),
      timezone: "Asia/Yerevan",
    });

    const res = await request(app)
      .get("/api/cron/task-reminders")
      .set("Authorization", `Bearer ${TEST_SECRET}`)
      .expect(200);

    // processed ≥ 1 (the overdue task was found)
    expect(res.body.ok).toBe(true);
    expect(res.body.processed).toBeGreaterThanOrEqual(1);
    // sent or skipped/retrying depending on Telegram connectivity
    expect(res.body.sent + res.body.skipped + res.body.retrying + res.body.failed).toBeGreaterThanOrEqual(1);
  });
});

// ─── Idempotency ──────────────────────────────────────────────────────────────

describe("GET /api/cron/task-reminders — duplicate safety", () => {
  it("two back-to-back calls do not double-process the same task", async () => {
    await db.insert(plannerTasks).values({
      userId: testUserId,
      templateId: testTemplateId,
      title: "Duplicate test task",
      priority: "medium",
      status: "pending",
      reminderEnabled: true,
      telegramReminderState: "scheduled",
      dueAtUtc: new Date(Date.now() - 5 * 60_000),
      nextReminderAtUtc: new Date(Date.now() - 5 * 60_000),
      timezone: "Asia/Yerevan",
    });

    const [r1, r2] = await Promise.all([
      request(app).get("/api/cron/task-reminders").set("Authorization", `Bearer ${TEST_SECRET}`),
      request(app).get("/api/cron/task-reminders").set("Authorization", `Bearer ${TEST_SECRET}`),
    ]);

    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    // Combined processed should be exactly 1, not 2
    expect(r1.body.processed + r2.body.processed).toBe(1);
  });
});

// ─── Health tracking ──────────────────────────────────────────────────────────

describe("GET /api/cron/task-reminders/health", () => {
  it("returns 401 without auth", async () => {
    await request(app).get("/api/cron/task-reminders/health").expect(401);
  });

  it("returns healthy: false before any run", async () => {
    const res = await request(app)
      .get(`/api/cron/task-reminders/health?secret=${TEST_SECRET}`)
      .expect(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.healthy).toBe(false);
    expect(res.body.lastSuccessAt).toBeNull();
  });

  it("shows healthy: true immediately after a successful run", async () => {
    await request(app)
      .get("/api/cron/task-reminders")
      .set("Authorization", `Bearer ${TEST_SECRET}`);

    const res = await request(app)
      .get(`/api/cron/task-reminders/health?secret=${TEST_SECRET}`)
      .expect(200);

    expect(res.body.ok).toBe(true);
    expect(res.body.healthy).toBe(true);
    expect(res.body.lastSuccessAt).toBeTruthy();
    expect(res.body.minutesSinceLastSuccess).toBeLessThan(1);
    expect(typeof res.body.lastProcessedCount).toBe("number");
  });
});
