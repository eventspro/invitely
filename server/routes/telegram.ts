/**
 * Telegram Routes
 *
 * Admin endpoints (require auth + admin panel access):
 *   GET    /api/telegram/:templateId/status        — connection status
 *   POST   /api/telegram/:templateId/connect-code  — generate pairing code
 *   POST   /api/telegram/:templateId/test          — send test message
 *   DELETE /api/telegram/:templateId/disconnect    — remove chat link
 *
 * Webhook (Telegram → our server, verified by secret header):
 *   POST   /api/telegram/webhook                   — receive Telegram updates
 */

import express, { type Request, type Response } from "express";
import { db } from "../db.js";
import {
  telegramConnectionTokens,
  userAdminPanels,
  templates,
  managementUsers,
} from "../../shared/schema.js";
import { eq, and, lt } from "drizzle-orm";
import crypto from "crypto";
import {
  authenticateUser,
  requireAdminPanelAccess,
  type AuthenticatedRequest,
} from "../middleware/auth.js";
import { sendTelegramMessage } from "../telegram.js";

const router = express.Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Generate a short, human-readable connection code (16 uppercase hex chars). */
function generateConnectionCode(): string {
  return crypto.randomBytes(8).toString("hex").toUpperCase();
}

/** Expiry window for connection tokens: 15 minutes. */
const TOKEN_TTL_MS = 15 * 60 * 1000;

/** Purge expired, unused tokens (best-effort, non-blocking). */
async function purgeExpiredTokens(): Promise<void> {
  try {
    await db
      .delete(telegramConnectionTokens)
      .where(
        and(
          lt(telegramConnectionTokens.expiresAt, new Date()),
          eq(telegramConnectionTokens.usedAt, null as any),
        ),
      );
  } catch {
    // Non-critical cleanup — swallow
  }
}

// ─── GET /api/telegram/:templateId/status ─────────────────────────────────────
router.get(
  "/:templateId/status",
  authenticateUser,
  requireAdminPanelAccess,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { templateId } = req.params;
      const [panel] = await db
        .select({ settings: userAdminPanels.settings })
        .from(userAdminPanels)
        .where(
          and(
            eq(userAdminPanels.templateId, templateId),
            eq(userAdminPanels.userId, req.user!.id),
            eq(userAdminPanels.isActive, true),
          ),
        )
        .limit(1);

      if (!panel) {
        return res.status(404).json({ error: "Not found" });
      }

      const s = (panel.settings ?? {}) as Record<string, unknown>;
      return res.json({
        connected: !!s.telegramChatId,
        enabled: !!s.telegramEnabled,
        connectedAt: s.telegramConnectedAt ?? null,
        lastTestAt: s.telegramLastTestAt ?? null,
      });
    } catch (err) {
      console.error("Telegram status error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  },
);

// ─── POST /api/telegram/:templateId/connect-code ──────────────────────────────
router.post(
  "/:templateId/connect-code",
  authenticateUser,
  requireAdminPanelAccess,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { templateId } = req.params;

      // Purge stale tokens (fire-and-forget)
      purgeExpiredTokens().catch(() => {});

      const code = generateConnectionCode();
      const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

      await db.insert(telegramConnectionTokens).values({
        templateId,
        userId: req.user!.id,
        token: code,
        expiresAt,
      });

      const botUsername =
        process.env.TELEGRAM_BOT_USERNAME ?? "YourBotName";

      return res.json({
        code,
        botUsername,
        expiresInMinutes: 15,
        instruction: `Send the following message to @${botUsername} on Telegram:\n\nCONNECT ${code}`,
      });
    } catch (err) {
      console.error("Telegram connect-code error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  },
);

// ─── POST /api/telegram/:templateId/test ──────────────────────────────────────
router.post(
  "/:templateId/test",
  authenticateUser,
  requireAdminPanelAccess,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { templateId } = req.params;

      const [panel] = await db
        .select({ id: userAdminPanels.id, settings: userAdminPanels.settings })
        .from(userAdminPanels)
        .where(
          and(
            eq(userAdminPanels.templateId, templateId),
            eq(userAdminPanels.userId, req.user!.id),
            eq(userAdminPanels.isActive, true),
          ),
        )
        .limit(1);

      if (!panel) {
        return res.status(404).json({ error: "Not found" });
      }

      const s = (panel.settings ?? {}) as Record<string, unknown>;
      if (!s.telegramChatId) {
        return res.status(400).json({ error: "Telegram not connected" });
      }

      const sent = await sendTelegramMessage(
        String(s.telegramChatId),
        "✅ <b>Telegram notifications are working!</b>\n\nYou will receive RSVP notifications here.",
      );

      if (!sent) {
        return res
          .status(502)
          .json({ error: "Failed to send test message — check TELEGRAM_BOT_TOKEN" });
      }

      // Record last test time
      const updatedSettings = { ...s, telegramLastTestAt: new Date().toISOString() };
      await db
        .update(userAdminPanels)
        .set({ settings: updatedSettings, updatedAt: new Date() })
        .where(eq(userAdminPanels.id, panel.id));

      return res.json({ success: true });
    } catch (err) {
      console.error("Telegram test error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  },
);

// ─── DELETE /api/telegram/:templateId/disconnect ──────────────────────────────
router.delete(
  "/:templateId/disconnect",
  authenticateUser,
  requireAdminPanelAccess,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { templateId } = req.params;

      const [panel] = await db
        .select({ id: userAdminPanels.id, settings: userAdminPanels.settings })
        .from(userAdminPanels)
        .where(
          and(
            eq(userAdminPanels.templateId, templateId),
            eq(userAdminPanels.userId, req.user!.id),
            eq(userAdminPanels.isActive, true),
          ),
        )
        .limit(1);

      if (!panel) {
        return res.status(404).json({ error: "Not found" });
      }

      const s = (panel.settings ?? {}) as Record<string, unknown>;
      const updatedSettings: Record<string, unknown> = { ...s };
      delete updatedSettings.telegramChatId;
      delete updatedSettings.telegramEnabled;
      delete updatedSettings.telegramConnectedAt;
      delete updatedSettings.telegramLastTestAt;

      await db
        .update(userAdminPanels)
        .set({ settings: updatedSettings, updatedAt: new Date() })
        .where(eq(userAdminPanels.id, panel.id));

      return res.json({ success: true });
    } catch (err) {
      console.error("Telegram disconnect error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  },
);

// ─── PATCH /api/telegram/:templateId/enabled ──────────────────────────────────
// Toggle enable/disable without disconnecting
router.patch(
  "/:templateId/enabled",
  authenticateUser,
  requireAdminPanelAccess,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { templateId } = req.params;
      const { enabled } = req.body;

      if (typeof enabled !== "boolean") {
        return res.status(400).json({ error: "enabled must be a boolean" });
      }

      const [panel] = await db
        .select({ id: userAdminPanels.id, settings: userAdminPanels.settings })
        .from(userAdminPanels)
        .where(
          and(
            eq(userAdminPanels.templateId, templateId),
            eq(userAdminPanels.userId, req.user!.id),
            eq(userAdminPanels.isActive, true),
          ),
        )
        .limit(1);

      if (!panel) {
        return res.status(404).json({ error: "Not found" });
      }

      const updatedSettings = {
        ...((panel.settings ?? {}) as Record<string, unknown>),
        telegramEnabled: enabled,
      };

      await db
        .update(userAdminPanels)
        .set({ settings: updatedSettings, updatedAt: new Date() })
        .where(eq(userAdminPanels.id, panel.id));

      return res.json({ success: true, enabled });
    } catch (err) {
      console.error("Telegram enabled toggle error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  },
);

// ─── POST /api/telegram/webhook ───────────────────────────────────────────────
// Telegram sends updates here. Verified via X-Telegram-Bot-Api-Secret-Token header.
router.post("/webhook", async (req: Request, res: Response) => {
  // Always respond 200 to Telegram immediately — any non-200 causes retries
  res.status(200).end();

  try {
    // Verify webhook secret if configured
    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (expectedSecret) {
      const receivedSecret = req.headers["x-telegram-bot-api-secret-token"];
      if (receivedSecret !== expectedSecret) {
        console.warn("Telegram webhook: invalid secret token — ignoring update");
        return;
      }
    }

    const update = req.body;
    const message = update?.message;
    if (!message?.text || !message?.chat?.id) return;

    const chatId = String(message.chat.id);
    const text: string = message.text.trim();

    // Expected format: "CONNECT ABCDEF1234567890"
    const match = text.match(/^CONNECT\s+([A-Fa-f0-9]{16})$/i);
    if (!match) return; // Not a connection attempt — ignore silently

    const code = match[1].toUpperCase();
    const now = new Date();

    // Look up the token
    const [tokenRow] = await db
      .select()
      .from(telegramConnectionTokens)
      .where(eq(telegramConnectionTokens.token, code))
      .limit(1);

    if (!tokenRow) {
      await sendTelegramMessage(
        chatId,
        "❌ Invalid or unknown connection code. Please generate a new code from your admin panel.",
      );
      return;
    }

    if (tokenRow.usedAt !== null) {
      await sendTelegramMessage(
        chatId,
        "❌ This code has already been used. Please generate a new code from your admin panel.",
      );
      return;
    }

    if (tokenRow.expiresAt < now) {
      await sendTelegramMessage(
        chatId,
        "❌ This code has expired (15-minute limit). Please generate a new code from your admin panel.",
      );
      return;
    }

    // Find the customer's admin panel for this template
    const [panel] = await db
      .select({ id: userAdminPanels.id, settings: userAdminPanels.settings })
      .from(userAdminPanels)
      .where(
        and(
          eq(userAdminPanels.templateId, tokenRow.templateId),
          eq(userAdminPanels.userId, tokenRow.userId),
          eq(userAdminPanels.isActive, true),
        ),
      )
      .limit(1);

    if (!panel) {
      await sendTelegramMessage(
        chatId,
        "❌ Could not find your admin panel. Please contact support.",
      );
      return;
    }

    // Fetch template name for confirmation message
    const [tmpl] = await db
      .select({ name: templates.name })
      .from(templates)
      .where(eq(templates.id, tokenRow.templateId))
      .limit(1);

    // Save chatId + mark enabled + record connected time
    const updatedSettings: Record<string, unknown> = {
      ...((panel.settings ?? {}) as Record<string, unknown>),
      telegramChatId: chatId,
      telegramEnabled: true,
      telegramConnectedAt: now.toISOString(),
    };

    await db
      .update(userAdminPanels)
      .set({ settings: updatedSettings, updatedAt: now })
      .where(eq(userAdminPanels.id, panel.id));

    // Mark token as used
    await db
      .update(telegramConnectionTokens)
      .set({ usedAt: now })
      .where(eq(telegramConnectionTokens.id, tokenRow.id));

    const templateName = tmpl?.name ?? "your template";
    await sendTelegramMessage(
      chatId,
      `✅ <b>Connected successfully!</b>\n\nYou will now receive RSVP notifications for <b>${templateName}</b> in this chat.\n\nTo disable, go to your admin panel → Settings → Telegram.`,
    );

    console.log(
      `✅ Telegram connected: templateId=${tokenRow.templateId} chatId=${chatId}`,
    );
  } catch (err) {
    console.error("Telegram webhook processing error:", err);
    // We already sent 200, so no further action
  }
});

export default router;
