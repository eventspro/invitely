/**
 * Precise reminder scheduler using setTimeout.
 * Fires reminders at exactly nextReminderAtUtc — 0 delay.
 * Only meaningful in long-running Node process (local dev).
 * On Vercel the cron endpoint handles scheduling instead.
 */

import { db } from "./db.js";
import { plannerTasks } from "../shared/schema.js";
import { eq, and, sql } from "drizzle-orm";
import { processReminders } from "./routes/cron-task-reminders.js";

const activeTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

export function scheduleReminder(taskId: string, nextAtUtc: Date): void {
  cancelReminder(taskId);
  const delay = Math.max(0, nextAtUtc.getTime() - Date.now());
  const timer = setTimeout(() => {
    activeTimeouts.delete(taskId);
    void fireAndReschedule(taskId);
  }, delay);
  activeTimeouts.set(taskId, timer);
}

export function cancelReminder(taskId: string): void {
  const t = activeTimeouts.get(taskId);
  if (t !== undefined) {
    clearTimeout(t);
    activeTimeouts.delete(taskId);
  }
}

async function fireAndReschedule(taskId: string): Promise<void> {
  try {
    await processReminders();
  } catch (err) {
    console.error("[scheduler] processReminders error:", err);
  }
  try {
    const [task] = await db
      .select({
        telegramReminderState: plannerTasks.telegramReminderState,
        nextReminderAtUtc: plannerTasks.nextReminderAtUtc,
      })
      .from(plannerTasks)
      .where(eq(plannerTasks.id, taskId))
      .limit(1);

    if (task?.telegramReminderState === "repeating" && task.nextReminderAtUtc) {
      scheduleReminder(taskId, task.nextReminderAtUtc);
    }
  } catch (err) {
    console.error("[scheduler] re-schedule error:", err);
  }
}

export async function bootstrapReminders(): Promise<void> {
  try {
    const tasks = await db
      .select({
        id: plannerTasks.id,
        nextReminderAtUtc: plannerTasks.nextReminderAtUtc,
      })
      .from(plannerTasks)
      .where(
        and(
          eq(plannerTasks.status, "pending"),
          eq(plannerTasks.reminderEnabled, true),
          sql`${plannerTasks.telegramReminderState} IN ('scheduled', 'repeating')`,
        ),
      );

    let count = 0;
    for (const t of tasks) {
      if (t.nextReminderAtUtc) {
        scheduleReminder(t.id, t.nextReminderAtUtc);
        count++;
      }
    }
    console.log(`[scheduler] bootstrapped ${count} pending reminder(s)`);
  } catch (err) {
    console.error("[scheduler] bootstrap error:", err);
  }
}
