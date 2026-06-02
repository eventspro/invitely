/**
 * Integration tests for Telegram inline-button callbacks (✅ Done / 🔕 Stop reminders)
 *
 * Spins up a minimal Express app with just the telegram router — no full server
 * IIFE, no listen(). Uses the real DB with cleanup after each test.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import telegramRouter from "../../server/routes/telegram.js";
import { db } from "../../server/db.js";
import {
  managementUsers,
  templates,
  orders,
  userAdminPanels,
  plannerTasks,
  telegramCallbackTokens,
} from "../../shared/schema.js";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

// ─── Test app (no listen, no IIFE) ────────────────────────────────────────────

const app = express();
app.use(express.json());
app.use("/api/telegram", telegramRouter);

// ─── Test fixture IDs (populated in beforeAll) ────────────────────────────────

let testUserId: string;
let testTemplateId: string;
let testOrderId: string;
let testPanelId: string;

const TEST_CHAT_ID = "999888777"; // fake Telegram chat ID
const WEBHOOK_SECRET = "test-webhook-secret";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeCallbackQuery(callbackData: string, chatId = TEST_CHAT_ID) {
  return {
    update_id: 100000001,
    callback_query: {
      id: crypto.randomBytes(8).toString("hex"),
      from: { id: Number(chatId), first_name: "Test", is_bot: false },
      message: {
        message_id: 42,
        chat: { id: Number(chatId), type: "private" },
        text: "🔔 Wedding Planner Reminder",
      },
      data: callbackData,
    },
  };
}

async function createTask(overrides: Record<string, unknown> = {}) {
  const [task] = await db
    .insert(plannerTasks)
    .values({
      userId: testUserId,
      templateId: testTemplateId,
      title: "Book the florist",
      priority: "medium",
      status: "pending",
      reminderEnabled: true,
      telegramReminderState: "scheduled",
      dueAtUtc: new Date(Date.now() + 60_000),
      nextReminderAtUtc: new Date(Date.now() + 60_000),
      timezone: "Asia/Yerevan",
      ...overrides,
    })
    .returning();
  return task;
}

async function createTokenPair(
  taskId: string,
  opts: { expiredDone?: boolean; expiredStop?: boolean } = {}
) {
  const doneToken = crypto.randomBytes(6).toString("base64url").slice(0, 8);
  const stopToken = crypto.randomBytes(6).toString("base64url").slice(0, 8);
  const futureExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const pastExpiry = new Date(Date.now() - 1000);

  await db.insert(telegramCallbackTokens).values([
    {
      token: doneToken,
      taskId,
      action: "done",
      expiresAt: opts.expiredDone ? pastExpiry : futureExpiry,
    },
    {
      token: stopToken,
      taskId,
      action: "stop",
      expiresAt: opts.expiredStop ? pastExpiry : futureExpiry,
    },
  ]);

  return { doneToken, stopToken };
}

// ─── Setup / teardown ─────────────────────────────────────────────────────────

beforeAll(async () => {
  // Set a known webhook secret so our test requests pass verification
  process.env.TELEGRAM_WEBHOOK_SECRET = WEBHOOK_SECRET;

  // Create test user
  const [user] = await db
    .insert(managementUsers)
    .values({
      email: `tg-test-${Date.now()}@example.com`,
      passwordHash: "irrelevant-for-test",
      firstName: "Test",
    })
    .returning();
  testUserId = user.id;

  // Create test template
  const [tmpl] = await db
    .insert(templates)
    .values({
      name: "TG Callback Test Template",
      slug: `tg-test-${Date.now()}`,
      templateKey: "test",
      config: {},
    })
    .returning();
  testTemplateId = tmpl.id;

  // Create order (required FK for admin panel)
  const [order] = await db
    .insert(orders)
    .values({
      orderNumber: `ORD-TG-TEST-${Date.now()}`,
      userId: testUserId,
      templateId: testTemplateId,
      templatePlan: "ultimate",
      amount: "0",
      paymentMethod: "test",
      status: "completed",
      adminAccessGranted: true,
    })
    .returning();
  testOrderId = order.id;

  // Create admin panel with Telegram connected
  const [panel] = await db
    .insert(userAdminPanels)
    .values({
      userId: testUserId,
      templateId: testTemplateId,
      templateSlug: `tg-test-panel-${Date.now()}`,
      orderId: testOrderId,
      isActive: true,
      settings: {
        telegramChatId: TEST_CHAT_ID,
        telegramEnabled: true,
      },
    })
    .returning();
  testPanelId = panel.id;
});

afterAll(async () => {
  // Delete all test data in FK-safe order
  await db.delete(telegramCallbackTokens).where(
    eq(telegramCallbackTokens.taskId,
      // sub-select not supported easily — delete via plannerTasks cleanup cascade
      // cascade delete handles it when plannerTasks are deleted
      "never-matches-just-for-type" as any
    )
  ).catch(() => {});

  await db.delete(plannerTasks).where(
    and(eq(plannerTasks.userId, testUserId), eq(plannerTasks.templateId, testTemplateId))
  ).catch(() => {});
  await db.delete(userAdminPanels).where(eq(userAdminPanels.id, testPanelId)).catch(() => {});
  await db.delete(orders).where(eq(orders.id, testOrderId)).catch(() => {});
  await db.delete(templates).where(eq(templates.id, testTemplateId)).catch(() => {});
  await db.delete(managementUsers).where(eq(managementUsers.id, testUserId)).catch(() => {});

  // Restore env
  delete process.env.TELEGRAM_WEBHOOK_SECRET;
});

// Clean up tasks between tests (tokens cascade-delete with tasks)
beforeEach(async () => {
  await db.delete(plannerTasks).where(
    and(eq(plannerTasks.userId, testUserId), eq(plannerTasks.templateId, testTemplateId))
  );
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/telegram/webhook — callback_query handling", () => {
  it("✅ Done button marks task as done", async () => {
    const task = await createTask();
    const { doneToken } = await createTokenPair(task.id);

    const res = await request(app)
      .post("/api/telegram/webhook")
      .set("X-Telegram-Bot-Api-Secret-Token", WEBHOOK_SECRET)
      .send(makeCallbackQuery(`td:${doneToken}`))
      .expect(200);

    // Verify task is now "done" in DB
    const [updated] = await db
      .select({ status: plannerTasks.status, telegramReminderState: plannerTasks.telegramReminderState })
      .from(plannerTasks)
      .where(eq(plannerTasks.id, task.id))
      .limit(1);

    expect(updated?.status).toBe("done");
    expect(updated?.telegramReminderState).toBe("completed");
  });

  it("🔕 Stop button stops reminders, task stays pending", async () => {
    const task = await createTask();
    const { stopToken } = await createTokenPair(task.id);

    await request(app)
      .post("/api/telegram/webhook")
      .set("X-Telegram-Bot-Api-Secret-Token", WEBHOOK_SECRET)
      .send(makeCallbackQuery(`ts:${stopToken}`))
      .expect(200);

    const [updated] = await db
      .select({ status: plannerTasks.status, telegramReminderState: plannerTasks.telegramReminderState })
      .from(plannerTasks)
      .where(eq(plannerTasks.id, task.id))
      .limit(1);

    expect(updated?.status).toBe("pending");
    expect(updated?.telegramReminderState).toBe("stopped");
  });

  it("Expired token is rejected — task unchanged", async () => {
    const task = await createTask();
    const { doneToken } = await createTokenPair(task.id, { expiredDone: true });

    await request(app)
      .post("/api/telegram/webhook")
      .set("X-Telegram-Bot-Api-Secret-Token", WEBHOOK_SECRET)
      .send(makeCallbackQuery(`td:${doneToken}`))
      .expect(200); // webhook always returns 200

    const [unchanged] = await db
      .select({ status: plannerTasks.status })
      .from(plannerTasks)
      .where(eq(plannerTasks.id, task.id))
      .limit(1);

    expect(unchanged?.status).toBe("pending");
  });

  it("Unknown token is rejected — task unchanged", async () => {
    const task = await createTask();

    await request(app)
      .post("/api/telegram/webhook")
      .set("X-Telegram-Bot-Api-Secret-Token", WEBHOOK_SECRET)
      .send(makeCallbackQuery("td:nonexistent"))
      .expect(200);

    const [unchanged] = await db
      .select({ status: plannerTasks.status })
      .from(plannerTasks)
      .where(eq(plannerTasks.id, task.id))
      .limit(1);

    expect(unchanged?.status).toBe("pending");
  });

  it("Token already used is idempotent — second press does nothing", async () => {
    const task = await createTask();
    const { doneToken } = await createTokenPair(task.id);

    // First press
    await request(app)
      .post("/api/telegram/webhook")
      .set("X-Telegram-Bot-Api-Secret-Token", WEBHOOK_SECRET)
      .send(makeCallbackQuery(`td:${doneToken}`))
      .expect(200);

    // Second press with same token
    await request(app)
      .post("/api/telegram/webhook")
      .set("X-Telegram-Bot-Api-Secret-Token", WEBHOOK_SECRET)
      .send(makeCallbackQuery(`td:${doneToken}`))
      .expect(200);

    const [updated] = await db
      .select({ status: plannerTasks.status })
      .from(plannerTasks)
      .where(eq(plannerTasks.id, task.id))
      .limit(1);

    expect(updated?.status).toBe("done");
  });

  it("Wrong chatId is rejected — auth check blocks action", async () => {
    const task = await createTask();
    const { doneToken } = await createTokenPair(task.id);

    await request(app)
      .post("/api/telegram/webhook")
      .set("X-Telegram-Bot-Api-Secret-Token", WEBHOOK_SECRET)
      .send(makeCallbackQuery(`td:${doneToken}`, "111222333")) // wrong chatId
      .expect(200);

    const [unchanged] = await db
      .select({ status: plannerTasks.status })
      .from(plannerTasks)
      .where(eq(plannerTasks.id, task.id))
      .limit(1);

    expect(unchanged?.status).toBe("pending");
  });

  it("Wrong webhook secret is silently ignored", async () => {
    const task = await createTask();
    const { doneToken } = await createTokenPair(task.id);

    await request(app)
      .post("/api/telegram/webhook")
      .set("X-Telegram-Bot-Api-Secret-Token", "wrong-secret")
      .send(makeCallbackQuery(`td:${doneToken}`))
      .expect(200);

    const [unchanged] = await db
      .select({ status: plannerTasks.status })
      .from(plannerTasks)
      .where(eq(plannerTasks.id, task.id))
      .limit(1);

    expect(unchanged?.status).toBe("pending");
  });
});
