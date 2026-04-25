/**
 * Telegram Notification Service
 *
 * Bot token is server-side only (TELEGRAM_BOT_TOKEN env var) — never sent to the frontend.
 * All notification routing is done server-side by looking up the customer's panel settings.
 */

import type { Rsvp } from "../shared/schema.js";
import { db } from "./db.js";
import { userAdminPanels } from "../shared/schema.js";
import { eq, and } from "drizzle-orm";

const TELEGRAM_API_BASE = "https://api.telegram.org";

function getBotToken(): string | null {
  return process.env.TELEGRAM_BOT_TOKEN ?? null;
}

/** Send a plain or HTML-formatted Telegram message to a chat. Returns true on success. */
export async function sendTelegramMessage(
  chatId: string,
  text: string,
  parseMode: "HTML" | "MarkdownV2" | undefined = "HTML",
): Promise<boolean> {
  const token = getBotToken();
  if (!token) {
    console.warn(
      "⚠️ TELEGRAM_BOT_TOKEN not configured — skipping Telegram notification",
    );
    return false;
  }
  try {
    const url = `${TELEGRAM_API_BASE}/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(
        `Telegram sendMessage failed [${res.status}]: ${body.slice(0, 200)}`,
      );
      return false;
    }
    console.log(`✅ Telegram message sent to chat ${chatId}`);
    return true;
  } catch (err) {
    console.error("Telegram sendMessage error:", err);
    return false;
  }
}

/** Escape HTML special characters for Telegram HTML mode. */
function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Format an RSVP record into a Telegram notification message. */
export function formatRsvpNotification(rsvp: Rsvp, templateName: string): string {
  const attendance =
    rsvp.attendance === "attending"
      ? "✅ Գալիս է"
      : rsvp.attendance === "not-attending"
        ? "❌ Չի գա"
        : "⏳ Հնարավոր է";

  const lines: string[] = [
    "💌 <b>Նոր RSVP հաստատում</b>",
    "",
    `🎊 Կայք: ${escapeHtml(templateName)}`,
    `👤 Հյուր: ${escapeHtml(rsvp.firstName)} ${escapeHtml(rsvp.lastName)}`,
    `📋 Մասնակցություն: ${attendance}`,
  ];

  if (rsvp.guestCount) {
    lines.push(`👥 Հյուրերի թիվ: ${escapeHtml(rsvp.guestCount)}`);
  }
  if (rsvp.guestEmail) {
    lines.push(`📧 Էլ-փոստ: ${escapeHtml(rsvp.guestEmail)}`);
  }
  if (rsvp.guestPhone) {
    lines.push(`📞 Հեռախոս: ${escapeHtml(rsvp.guestPhone)}`);
  }
  if (rsvp.specialRequests) {
    lines.push(`💬 Հաղորդագրություն: ${escapeHtml(rsvp.specialRequests)}`);
  }

  lines.push("");
  try {
    lines.push(
      `🕐 Ուղարկվել է: ${new Date().toLocaleString("hy-AM", {
        timeZone: "Asia/Yerevan",
        dateStyle: "medium",
        timeStyle: "short",
      } as Intl.DateTimeFormatOptions)}`,
    );
  } catch {
    lines.push(`🕐 Ուղարկվել է: ${new Date().toISOString()}`);
  }

  return lines.join("\n");
}

/**
 * Called after RSVP is saved. Looks up the template's assigned customer panel,
 * checks if Telegram is connected and enabled, and sends a notification.
 *
 * Never throws — Telegram failure must NOT block RSVP submission.
 */
export async function sendRsvpTelegramNotification(
  rsvp: Rsvp,
  templateId: string,
  templateName: string,
): Promise<void> {
  try {
    const [panel] = await db
      .select({ settings: userAdminPanels.settings })
      .from(userAdminPanels)
      .where(
        and(
          eq(userAdminPanels.templateId, templateId),
          eq(userAdminPanels.isActive, true),
        ),
      )
      .limit(1);

    if (!panel?.settings) return;
    const s = panel.settings as Record<string, unknown>;
    if (!s.telegramEnabled || !s.telegramChatId) return;

    const text = formatRsvpNotification(rsvp, templateName);
    await sendTelegramMessage(String(s.telegramChatId), text);
  } catch (err) {
    // Log but never propagate — RSVP is already saved
    console.error("sendRsvpTelegramNotification error:", err);
  }
}
