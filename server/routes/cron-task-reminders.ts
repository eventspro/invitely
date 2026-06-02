/**
 * Vercel Cron Job endpoint for task reminder notifications
 *
 * Schedule: every minute (* * * * *)
 * Endpoint: POST /api/cron/task-reminders
 *
 * Authentication: Authorization: Bearer <CRON_SECRET>
 * Also callable by external cron services using the same header.
 */

import express, { type Request, type Response } from "express";
import { db } from "../db.js";
import {
  plannerTasks,
  taskReminderLogs,
  telegramCallbackTokens,
  userAdminPanels,
  managementUsers,
} from "../../shared/schema.js";
import { eq, and, lte, or, isNull, lt, sql } from "drizzle-orm";
import crypto from "crypto";
import { sendTaskReminderMessage } from "../telegram.js";

const router = express.Router();

// Retry backoff in minutes for failed send attempts (attempt 2, 3, 4)
const RETRY_BACKOFF_MINUTES = [5, 15, 60];
const MAX_RETRIES = 3;
const BATCH_LIMIT = 20;
const DUPLICATE_GUARD_SECONDS = 50;

function generateCallbackToken(): string {
  return crypto.randomBytes(6).toString("base64url").slice(0, 8);
}

async function processReminders(): Promise<{
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
  retrying: number;
}> {
  const now = new Date();

  // Clean up expired or already-used callback tokens (best-effort)
  try {
    await db
      .delete(telegramCallbackTokens)
      .where(
        or(
          lt(telegramCallbackTokens.expiresAt, now),
          sql`${telegramCallbackTokens.usedAt} IS NOT NULL`,
        ),
      );
  } catch (err) {
    console.warn("[cron-reminders] token cleanup error:", err);
  }

  // Calculate duplicate-guard cutoff
  const guardCutoff = new Date(now.getTime() - DUPLICATE_GUARD_SECONDS * 1000);

  // Query tasks due for reminder
  const tasks = await db
    .select()
    .from(plannerTasks)
    .where(
      and(
        eq(plannerTasks.status, "pending"),
        eq(plannerTasks.reminderEnabled, true),
        sql`${plannerTasks.telegramReminderState} IN ('scheduled', 'repeating')`,
        lte(plannerTasks.nextReminderAtUtc, now),
        or(
          isNull(plannerTasks.lastReminderSentAt),
          lt(plannerTasks.lastReminderSentAt, guardCutoff),
        ),
      ),
    )
    .limit(BATCH_LIMIT);

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  let retrying = 0;

  for (const task of tasks) {
    // Atomic claim via duplicate-guard update
    const claimed = await db
      .update(plannerTasks)
      .set({ lastReminderSentAt: now })
      .where(
        and(
          eq(plannerTasks.id, task.id),
          or(
            isNull(plannerTasks.lastReminderSentAt),
            lt(plannerTasks.lastReminderSentAt, guardCutoff),
          ),
        ),
      )
      .returning({ id: plannerTasks.id });

    if (claimed.length === 0) {
      // Another invocation claimed this task — skip
      continue;
    }

    // Load customer panel (chatId + first_name)
    const [panelRow] = await db
      .select({
        settings: userAdminPanels.settings,
        firstName: managementUsers.firstName,
      })
      .from(userAdminPanels)
      .innerJoin(managementUsers, eq(managementUsers.id, userAdminPanels.userId))
      .where(
        and(
          eq(userAdminPanels.userId, task.userId),
          eq(userAdminPanels.templateId, task.templateId),
          eq(userAdminPanels.isActive, true),
        ),
      )
      .limit(1);

    const s = (panelRow?.settings ?? {}) as Record<string, unknown>;
    const chatId = s.telegramChatId ? String(s.telegramChatId) : null;
    const telegramEnabled = !!s.telegramEnabled;

    if (!chatId || !telegramEnabled) {
      // No Telegram connection — retry or fail
      const retryCount = task.sendRetryCount ?? 0;
      if (retryCount >= MAX_RETRIES) {
        await db
          .update(plannerTasks)
          .set({
            telegramReminderState: "failed",
            nextReminderAtUtc: null,
            sendLastError: "no_telegram",
            updatedAt: now,
          })
          .where(eq(plannerTasks.id, task.id));
        failed++;
      } else {
        const backoffMs = RETRY_BACKOFF_MINUTES[retryCount] * 60 * 1000;
        await db
          .update(plannerTasks)
          .set({
            sendRetryCount: retryCount + 1,
            sendLastError: "no_telegram",
            nextReminderAtUtc: new Date(now.getTime() + backoffMs),
            updatedAt: now,
          })
          .where(eq(plannerTasks.id, task.id));
        retrying++;
      }

      await db.insert(taskReminderLogs).values({
        taskId: task.id,
        userId: task.userId,
        templateId: task.templateId,
        channel: "telegram",
        status: "skipped",
        errorMessage: "no_telegram",
      });
      skipped++;
      continue;
    }

    // Generate callback tokens
    const doneToken = generateCallbackToken();
    const stopToken = generateCallbackToken();
    const tokenExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    await db.insert(telegramCallbackTokens).values([
      { token: doneToken, taskId: task.id, action: "done", expiresAt: tokenExpiry },
      { token: stopToken, taskId: task.id, action: "stop", expiresAt: tokenExpiry },
    ]);

    // Send reminder
    const firstName = panelRow?.firstName ?? "there";
    const result = await sendTaskReminderMessage({
      chatId,
      firstName,
      taskTitle: task.title,
      dueAtUtc: task.dueAtUtc ?? now,
      timezone: task.timezone ?? "Asia/Yerevan",
      doneCallbackData: `td:${doneToken}`,
      stopCallbackData: `ts:${stopToken}`,
    });

    if (result.success) {
      // Success — advance schedule
      let nextState: string;
      let nextAt: Date | null;

      if (task.repeatIntervalMinutes) {
        nextState = "repeating";
        nextAt = new Date(now.getTime() + task.repeatIntervalMinutes * 60 * 1000);
      } else {
        nextState = "sent";
        nextAt = null;
      }

      await db
        .update(plannerTasks)
        .set({
          telegramReminderState: nextState,
          nextReminderAtUtc: nextAt,
          sendRetryCount: 0,
          sendLastError: null,
          updatedAt: now,
        })
        .where(eq(plannerTasks.id, task.id));

      await db.insert(taskReminderLogs).values({
        taskId: task.id,
        userId: task.userId,
        templateId: task.templateId,
        channel: "telegram",
        status: "sent",
        telegramMessageId: result.messageId ?? null,
      });

      sent++;
    } else {
      // Failure — retry or final fail
      const retryCount = (task.sendRetryCount ?? 0);
      if (retryCount >= MAX_RETRIES) {
        await db
          .update(plannerTasks)
          .set({
            telegramReminderState: "failed",
            nextReminderAtUtc: null,
            sendLastError: "send_failed",
            updatedAt: now,
          })
          .where(eq(plannerTasks.id, task.id));
        failed++;
      } else {
        const backoffMs = RETRY_BACKOFF_MINUTES[retryCount] * 60 * 1000;
        await db
          .update(plannerTasks)
          .set({
            sendRetryCount: retryCount + 1,
            sendLastError: "send_failed",
            nextReminderAtUtc: new Date(now.getTime() + backoffMs),
            updatedAt: now,
          })
          .where(eq(plannerTasks.id, task.id));
        retrying++;
      }

      await db.insert(taskReminderLogs).values({
        taskId: task.id,
        userId: task.userId,
        templateId: task.templateId,
        channel: "telegram",
        status: "failed",
        errorMessage: "send_failed",
      });
    }
  }

  return { processed: tasks.length, sent, failed, skipped, retrying };
}

// ─── POST /api/cron/task-reminders ────────────────────────────────────────────

router.post("/task-reminders", async (req: Request, res: Response) => {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.authorization ?? "";
    if (auth !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  try {
    const result = await processReminders();
    console.log("[cron-reminders] run complete:", result);
    return res.json(result);
  } catch (err) {
    console.error("[cron-reminders] fatal error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Also accept GET for Vercel cron compatibility
router.get("/task-reminders", async (req: Request, res: Response) => {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.authorization ?? "";
    if (auth !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  try {
    const result = await processReminders();
    console.log("[cron-reminders] run complete:", result);
    return res.json(result);
  } catch (err) {
    console.error("[cron-reminders] fatal error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export { processReminders };
export default router;
