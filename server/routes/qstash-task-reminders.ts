import type { Express, Request, Response } from "express";
import express from "express";
import { Receiver } from "@upstash/qstash";
import { and, eq, isNull } from "drizzle-orm";
import { format as formatTz, toZonedTime } from "date-fns-tz";
import { db } from "../db.js";
import { managementUsers, plannerTasks, userAdminPanels } from "../../shared/schema.js";
import { resolveQStashCallbackPath, resolveQStashCallbackUrl } from "../qstashReminders.js";
import { sendTelegramMessage } from "../telegram.js";

interface ReminderCallbackBody {
  taskId: string;
  reminderToken: string;
  reminderVersion: number;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderDueLine(dueAtUtc: Date | null, timezone: string): string {
  if (!dueAtUtc) return "";

  try {
    const zoned = toZonedTime(dueAtUtc, timezone);
    const tzAbbr = timezone.split("/").pop()?.replace(/_/g, " ") ?? timezone;
    return `\n📅 Due: ${formatTz(zoned, "MMM d, yyyy, HH:mm", { timeZone: timezone })} (${tzAbbr})`;
  } catch {
    return `\n📅 Due: ${dueAtUtc.toISOString()}`;
  }
}

export function registerQStashTaskReminderCallbackRoute(app: Express): void {
  const callbackPath = resolveQStashCallbackPath();
  const receiver = process.env.QSTASH_CURRENT_SIGNING_KEY && process.env.QSTASH_NEXT_SIGNING_KEY
    ? new Receiver({
      currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
      nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
    })
    : null;

  app.post(
    callbackPath,
    express.raw({ type: "application/json", limit: "64kb" }),
    async (req: Request, res: Response) => {
      try {
        if (!receiver) {
          console.error("[qstash] Callback receiver keys are not configured");
          return res.status(503).json({ error: "QStash callback unavailable" });
        }

        const signature = req.header("upstash-signature");
        if (!signature) {
          return res.status(401).json({ error: "Missing signature" });
        }

        const rawBody = Buffer.isBuffer(req.body)
          ? req.body.toString("utf8")
          : JSON.stringify(req.body ?? {});
        const callbackUrl = resolveQStashCallbackUrl()
          ?? `${req.protocol}://${req.get("host")}${req.originalUrl}`;

        await receiver.verify({
          signature,
          body: rawBody,
          url: callbackUrl,
        });

        const payload = JSON.parse(rawBody) as Partial<ReminderCallbackBody>;
        if (!payload.taskId || !payload.reminderToken || typeof payload.reminderVersion !== "number") {
          return res.status(400).json({ error: "Invalid payload" });
        }

        const now = new Date();

        const [claimed] = await db
          .update(plannerTasks)
          .set({
            reminderSentAt: now,
            lastReminderSentAt: now,
            telegramReminderState: "sent",
            nextReminderAtUtc: null,
            sendLastError: null,
            updatedAt: now,
          })
          .where(
            and(
              eq(plannerTasks.id, payload.taskId),
              eq(plannerTasks.reminderToken, payload.reminderToken),
              eq(plannerTasks.reminderVersion, payload.reminderVersion),
              isNull(plannerTasks.reminderSentAt),
              eq(plannerTasks.reminderEnabled, true),
              eq(plannerTasks.status, "pending"),
            ),
          )
          .returning({
            id: plannerTasks.id,
            title: plannerTasks.title,
            userId: plannerTasks.userId,
            templateId: plannerTasks.templateId,
            dueAtUtc: plannerTasks.dueAtUtc,
            timezone: plannerTasks.timezone,
          });

        if (!claimed) {
          return res.status(200).json({ status: "duplicate_or_stale" });
        }

        const [panel] = await db
          .select({ settings: userAdminPanels.settings })
          .from(userAdminPanels)
          .where(
            and(
              eq(userAdminPanels.userId, claimed.userId),
              eq(userAdminPanels.templateId, claimed.templateId),
              eq(userAdminPanels.isActive, true),
            ),
          )
          .limit(1);

        const [owner] = await db
          .select({ firstName: managementUsers.firstName })
          .from(managementUsers)
          .where(eq(managementUsers.id, claimed.userId))
          .limit(1);

        const settings = (panel?.settings ?? {}) as Record<string, unknown>;
        const telegramEnabled = Boolean(settings.telegramEnabled);
        const chatId = settings.telegramChatId ? String(settings.telegramChatId) : "";

        if (!telegramEnabled || !chatId) {
          await db
            .update(plannerTasks)
            .set({
              telegramReminderState: "failed",
              sendLastError: "Telegram is not connected",
              updatedAt: new Date(),
            })
            .where(eq(plannerTasks.id, claimed.id));

          return res.status(200).json({ status: "telegram_not_connected" });
        }

        const greetingName = (owner?.firstName || "there").trim();
        const dueLine = renderDueLine(claimed.dueAtUtc, claimed.timezone);
        const message = [
          "🔔 <b>Wedding Planner Reminder</b>",
          "",
          `Hi ${escapeHtml(greetingName)}, don't forget: <b>${escapeHtml(claimed.title)}</b>`,
          dueLine,
        ].join("\n");

        const sent = await sendTelegramMessage(chatId, message, "HTML");
        if (!sent) {
          await db
            .update(plannerTasks)
            .set({
              telegramReminderState: "failed",
              sendLastError: "Telegram send failed",
              updatedAt: new Date(),
            })
            .where(eq(plannerTasks.id, claimed.id));
          return res.status(200).json({ status: "send_failed" });
        }

        return res.status(200).json({ status: "sent" });
      } catch (err) {
        console.error("[qstash] reminder callback error:", err);
        return res.status(401).json({ error: "Invalid callback" });
      }
    },
  );

  console.log(`[qstash] Task reminder callback route registered at ${callbackPath}`);
}
