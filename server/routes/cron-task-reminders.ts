/**
 * Task reminder cron endpoint
 *
 * Called by external cron services (cron-job.org primary, GitHub Actions backup).
 * Vercel Hobby does not allow sub-daily cron schedules, so Vercel's built-in
 * cron is NOT used for this endpoint. See docs/task-reminders-cron-setup.md.
 *
 * Endpoints:
 *   GET  /api/cron/task-reminders          — trigger reminder run
 *   POST /api/cron/task-reminders          — trigger reminder run (same)
 *   GET  /api/cron/task-reminders/health   — health check
 *
 * Auth (CRON_SECRET env var required):
 *   Header:      Authorization: Bearer <CRON_SECRET>
 *   Query param: ?secret=<CRON_SECRET>
 */

import express, { type Request, type Response } from "express";
import { db } from "../db.js";
import {
  plannerTasks,
  taskReminderLogs,
  telegramCallbackTokens,
  userAdminPanels,
  managementUsers,
  cronHealth,
} from "../../shared/schema.js";
import { eq, and, lte, or, isNull, lt, sql } from "drizzle-orm";
import crypto from "crypto";
import { sendTaskReminderMessage } from "../telegram.js";

const router = express.Router();

const JOB_NAME = "task-reminders";
const RETRY_BACKOFF_MINUTES = [5, 15, 60];
const MAX_RETRIES = 3;
const BATCH_LIMIT = 20;
const DUPLICATE_GUARD_SECONDS = 50;
// Health: warn after 5 min, unhealthy after 10 min without a successful run
const HEALTH_WARN_MINUTES = 5;
const HEALTH_UNHEALTHY_MINUTES = 10;

// ─── Auth ─────────────────────────────────────────────────────────────────────

function isAuthorized(req: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.warn("[cron-reminders] CRON_SECRET not set — all requests allowed");
    return true;
  }
  const authHeader = req.headers.authorization ?? "";
  if (authHeader === `Bearer ${cronSecret}`) return true;
  const querySecret = req.query.secret;
  if (typeof querySecret === "string" && querySecret === cronSecret) return true;
  return false;
}

// ─── Health upsert ────────────────────────────────────────────────────────────

async function recordRun(
  runAt: Date,
  result:
    | { ok: true; processed: number; sent: number; failed: number; skipped: number; retrying: number }
    | { ok: false; error: string },
): Promise<void> {
  try {
    if (result.ok) {
      await db
        .insert(cronHealth)
        .values({
          jobName: JOB_NAME,
          lastRunAt: runAt,
          lastSuccessAt: runAt,
          lastProcessedCount: result.processed,
          lastSentCount: result.sent,
          lastFailedCount: result.failed,
          lastSkippedCount: result.skipped,
          lastRetryingCount: result.retrying,
          updatedAt: runAt,
        })
        .onConflictDoUpdate({
          target: cronHealth.jobName,
          set: {
            lastRunAt: runAt,
            lastSuccessAt: runAt,
            lastProcessedCount: result.processed,
            lastSentCount: result.sent,
            lastFailedCount: result.failed,
            lastSkippedCount: result.skipped,
            lastRetryingCount: result.retrying,
            updatedAt: runAt,
          },
        });
    } else {
      await db
        .insert(cronHealth)
        .values({
          jobName: JOB_NAME,
          lastRunAt: runAt,
          lastErrorAt: runAt,
          lastError: result.error,
          updatedAt: runAt,
        })
        .onConflictDoUpdate({
          target: cronHealth.jobName,
          set: {
            lastRunAt: runAt,
            lastErrorAt: runAt,
            lastError: result.error,
            updatedAt: runAt,
          },
        });
    }
  } catch (err) {
    console.error("[cron-reminders] health upsert error:", err);
  }
}

// ─── Token helpers ────────────────────────────────────────────────────────────

function generateCallbackToken(): string {
  return crypto.randomBytes(6).toString("base64url").slice(0, 8);
}

// ─── Core logic ───────────────────────────────────────────────────────────────

export async function processReminders(): Promise<{
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
  retrying: number;
}> {
  const now = new Date();

  // Clean up expired / used callback tokens (best-effort)
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

  const guardCutoff = new Date(now.getTime() - DUPLICATE_GUARD_SECONDS * 1000);

  // Find all overdue tasks (nextReminderAtUtc <= now catches late runs too)
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

  let sent = 0, failed = 0, skipped = 0, retrying = 0;

  for (const task of tasks) {
    // Atomic claim — prevents duplicate sends when two invocations overlap
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

    if (claimed.length === 0) continue; // another invocation claimed this task

    // Load panel (chatId + first_name)
    const [panelRow] = await db
      .select({ settings: userAdminPanels.settings, firstName: managementUsers.firstName })
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

    if (!chatId || !s.telegramEnabled) {
      const retryCount = task.sendRetryCount ?? 0;
      if (retryCount >= MAX_RETRIES) {
        await db.update(plannerTasks).set({ telegramReminderState: "failed", nextReminderAtUtc: null, sendLastError: "no_telegram", updatedAt: now }).where(eq(plannerTasks.id, task.id));
        failed++;
      } else {
        const backoffMs = RETRY_BACKOFF_MINUTES[retryCount] * 60_000;
        await db.update(plannerTasks).set({ sendRetryCount: retryCount + 1, sendLastError: "no_telegram", nextReminderAtUtc: new Date(now.getTime() + backoffMs), updatedAt: now }).where(eq(plannerTasks.id, task.id));
        retrying++;
      }
      await db.insert(taskReminderLogs).values({ taskId: task.id, userId: task.userId, templateId: task.templateId, channel: "telegram", status: "skipped", errorMessage: "no_telegram" });
      skipped++;
      continue;
    }

    // Generate callback tokens
    const doneToken = generateCallbackToken();
    const stopToken = generateCallbackToken();
    const tokenExpiry = new Date(now.getTime() + 24 * 60 * 60_000);
    await db.insert(telegramCallbackTokens).values([
      { token: doneToken, taskId: task.id, action: "done", expiresAt: tokenExpiry },
      { token: stopToken, taskId: task.id, action: "stop", expiresAt: tokenExpiry },
    ]);

    const result = await sendTaskReminderMessage({
      chatId,
      firstName: panelRow?.firstName ?? "there",
      taskTitle: task.title,
      dueAtUtc: task.dueAtUtc ?? now,
      timezone: task.timezone ?? "Asia/Yerevan",
      doneCallbackData: `td:${doneToken}`,
      stopCallbackData: `ts:${stopToken}`,
    });

    if (result.success) {
      const nextState = task.repeatIntervalMinutes ? "repeating" : "sent";
      const nextAt = task.repeatIntervalMinutes ? new Date(now.getTime() + task.repeatIntervalMinutes * 60_000) : null;
      await db.update(plannerTasks).set({ telegramReminderState: nextState, nextReminderAtUtc: nextAt, sendRetryCount: 0, sendLastError: null, updatedAt: now }).where(eq(plannerTasks.id, task.id));
      await db.insert(taskReminderLogs).values({ taskId: task.id, userId: task.userId, templateId: task.templateId, channel: "telegram", status: "sent", telegramMessageId: result.messageId ?? null });
      sent++;
    } else {
      const retryCount = task.sendRetryCount ?? 0;
      if (retryCount >= MAX_RETRIES) {
        await db.update(plannerTasks).set({ telegramReminderState: "failed", nextReminderAtUtc: null, sendLastError: "send_failed", updatedAt: now }).where(eq(plannerTasks.id, task.id));
        failed++;
      } else {
        const backoffMs = RETRY_BACKOFF_MINUTES[retryCount] * 60_000;
        await db.update(plannerTasks).set({ sendRetryCount: retryCount + 1, sendLastError: "send_failed", nextReminderAtUtc: new Date(now.getTime() + backoffMs), updatedAt: now }).where(eq(plannerTasks.id, task.id));
        retrying++;
      }
      await db.insert(taskReminderLogs).values({ taskId: task.id, userId: task.userId, templateId: task.templateId, channel: "telegram", status: "failed", errorMessage: "send_failed" });
    }
  }

  return { processed: tasks.length, sent, failed, skipped, retrying };
}

// ─── GET/POST /api/cron/task-reminders ────────────────────────────────────────

async function handleRun(req: Request, res: Response): Promise<Response> {
  if (!isAuthorized(req)) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  const runAt = new Date();
  try {
    const result = await processReminders();
    console.log("[cron-reminders] run complete:", result);
    await recordRun(runAt, { ok: true, ...result });
    return res.json({ ok: true, ...result });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[cron-reminders] fatal error:", err);
    await recordRun(runAt, { ok: false, error: errMsg });
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}

router.get("/task-reminders", handleRun);
router.post("/task-reminders", handleRun);

// ─── GET /api/cron/task-reminders/health ──────────────────────────────────────

router.get("/task-reminders/health", async (req: Request, res: Response) => {
  if (!isAuthorized(req)) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  const [row] = await db
    .select()
    .from(cronHealth)
    .where(eq(cronHealth.jobName, JOB_NAME))
    .limit(1)
    .catch(() => [] as (typeof cronHealth.$inferSelect)[]);

  if (!row || !row.lastSuccessAt) {
    return res.json({
      ok: true,
      jobName: JOB_NAME,
      healthy: false,
      status: "unhealthy",
      error: "No successful reminder worker run recorded yet",
      lastRunAt: row?.lastRunAt ?? null,
      lastSuccessAt: null,
      minutesSinceLastSuccess: null,
      lastProcessedCount: 0,
      lastSentCount: 0,
      lastFailedCount: 0,
      lastSkippedCount: 0,
      lastRetryingCount: 0,
      lastError: row?.lastError ?? null,
    });
  }

  const minutesSince = (Date.now() - row.lastSuccessAt.getTime()) / 60_000;
  const healthy = minutesSince <= HEALTH_WARN_MINUTES;
  const warning = minutesSince > HEALTH_WARN_MINUTES && minutesSince <= HEALTH_UNHEALTHY_MINUTES;
  const status = healthy ? "healthy" : warning ? "warning" : "unhealthy";

  return res.json({
    ok: true,
    jobName: JOB_NAME,
    healthy,
    status,
    lastRunAt: row.lastRunAt,
    lastSuccessAt: row.lastSuccessAt,
    minutesSinceLastSuccess: Math.round(minutesSince * 10) / 10,
    lastProcessedCount: row.lastProcessedCount,
    lastSentCount: row.lastSentCount,
    lastFailedCount: row.lastFailedCount,
    lastSkippedCount: row.lastSkippedCount,
    lastRetryingCount: row.lastRetryingCount,
    lastError: row.lastError ?? null,
  });
});

export default router;
