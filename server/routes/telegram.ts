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
  telegramCallbackTokens,
  plannerTasks,
  userAdminPanels,
  templates,
  managementUsers,
  orders,
} from "../../shared/schema.js";
import { eq, and, lt, sql } from "drizzle-orm";
import crypto from "crypto";
import {
  authenticateUser,
  requireAdminPanelAccess,
  type AuthenticatedRequest,
} from "../middleware/auth.js";
import {
  sendTelegramMessage,
  answerCallbackQuery,
  editTelegramMessageText,
} from "../telegram.js";

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
// IMPORTANT: We do ALL processing first, then send 200.
// In Vercel serverless, sending the response early can cause the function to be
// killed before async work (DB writes, sendTelegramMessage) completes.
router.post("/webhook", async (req: Request, res: Response) => {
  console.log("[TG webhook] Received request");

  try {
    // Verify webhook secret
    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (expectedSecret) {
      const receivedSecret = req.headers["x-telegram-bot-api-secret-token"];
      if (receivedSecret !== expectedSecret) {
        console.warn(
          `[TG webhook] Secret mismatch — received="${String(receivedSecret).slice(0, 8)}..." expected="${expectedSecret.slice(0, 8)}..."`,
        );
        return res.status(200).end(); // still 200 to avoid Telegram retries
      }
    } else {
      console.warn("[TG webhook] TELEGRAM_WEBHOOK_SECRET not configured — skipping secret check");
    }

    const update = req.body;

    // ─── Handle inline button callbacks (task reminders) ────────────────────
    if (update?.callback_query) {
      await handleTaskCallbackQuery(update.callback_query);
      return res.status(200).end();
    }

    console.log(
      `[TG webhook] update_id=${update?.update_id} text="${update?.message?.text}" chat_id=${update?.message?.chat?.id}`,
    );

    const message = update?.message;
    if (!message?.text || !message?.chat?.id) {
      console.log("[TG webhook] No message text or chat.id — ignoring");
      return res.status(200).end();
    }

    const chatId = String(message.chat.id);
    // Robust: trim, case-insensitive, collapse whitespace
    const text: string = message.text.trim().replace(/\s+/g, " ");

    // Parse CONNECT command
    const match = text.match(/^CONNECT\s+([A-Fa-f0-9]{16})\s*$/i);
    console.log(`[TG webhook] CONNECT match: ${match ? match[1] : "none"} (text="${text}")`);

    if (!match) {
      return res.status(200).end(); // Not a CONNECT command — ignore silently
    }

    const code = match[1].toUpperCase();
    const now = new Date();

    // Look up the token
    const [tokenRow] = await db
      .select()
      .from(telegramConnectionTokens)
      .where(eq(telegramConnectionTokens.token, code))
      .limit(1);

    console.log(
      `[TG webhook] Token lookup code=${code}: found=${!!tokenRow} usedAt=${tokenRow?.usedAt ?? "null"} expiresAt=${tokenRow?.expiresAt}`,
    );

    if (!tokenRow || tokenRow.usedAt !== null || tokenRow.expiresAt < now) {
      const sent = await sendTelegramMessage(
        chatId,
        "This connection code is invalid or expired. Please generate a new one.",
        undefined,
      );
      console.log(`[TG webhook] Sent invalid/expired reply: ${sent}`);
      return res.status(200).end();
    }

    // Find the customer's admin panel
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

    console.log(
      `[TG webhook] Panel lookup templateId=${tokenRow.templateId} userId=${tokenRow.userId}: found=${!!panel}`,
    );

    if (!panel) {
      // Check if the token owner is a project owner — if so, auto-provision their panel row
      const [ownerUser] = await db
        .select({ id: managementUsers.id, isOwner: managementUsers.isOwner })
        .from(managementUsers)
        .where(eq(managementUsers.id, tokenRow.userId))
        .limit(1);

      if (ownerUser?.isOwner) {
        console.log(`[TG webhook] Owner user ${tokenRow.userId} has no panel row — auto-provisioning`);

        const [tmplRow] = await db
          .select({ slug: templates.slug })
          .from(templates)
          .where(eq(templates.id, tokenRow.templateId))
          .limit(1);

        const orderNumber = `ORD-OWNER-${Date.now()}`;
        let newPanelId: string;

        await db.transaction(async (tx) => {
          const [order] = await tx
            .insert(orders)
            .values({
              orderNumber,
              userId: tokenRow.userId,
              templateId: tokenRow.templateId,
              templatePlan: "ultimate",
              amount: "0.00",
              paymentMethod: "cash",
              status: "completed",
              adminAccessGranted: true,
            })
            .returning();

          const [newPanel] = await tx
            .insert(userAdminPanels)
            .values({
              userId: tokenRow.userId,
              templateId: tokenRow.templateId,
              templateSlug: tmplRow?.slug ?? tokenRow.templateId,
              orderId: order.id,
              isActive: true,
            })
            .returning({ id: userAdminPanels.id });

          newPanelId = newPanel.id;
        });

        // Re-fetch the panel we just created
        const [freshPanel] = await db
          .select({ id: userAdminPanels.id, settings: userAdminPanels.settings })
          .from(userAdminPanels)
          .where(eq(userAdminPanels.id, newPanelId!))
          .limit(1);

        if (freshPanel) {
          // Reassign for the code below
          Object.assign(panel ?? {}, freshPanel);
          // Use freshPanel directly by falling through — reassign the binding
          const updatedSettings: Record<string, unknown> = {
            ...((freshPanel.settings ?? {}) as Record<string, unknown>),
            telegramChatId: chatId,
            telegramEnabled: true,
            telegramConnectedAt: now.toISOString(),
          };
          await db
            .update(userAdminPanels)
            .set({ settings: updatedSettings, updatedAt: now })
            .where(eq(userAdminPanels.id, freshPanel.id));

          await db
            .update(telegramConnectionTokens)
            .set({ usedAt: now })
            .where(eq(telegramConnectionTokens.id, tokenRow.id));

          const [tmplName] = await db
            .select({ name: templates.name })
            .from(templates)
            .where(eq(templates.id, tokenRow.templateId))
            .limit(1);

          await sendTelegramMessage(
            chatId,
            `✅ Telegram connected to <b>${tmplName?.name ?? "your wedding site"}</b>!\n\nYou will receive RSVP notifications here.`,
            "HTML",
          );
          console.log(`[TG webhook] Owner panel auto-provisioned and Telegram connected`);
          return res.status(200).end();
        }
      }

      const sent = await sendTelegramMessage(
        chatId,
        "❌ Could not find your admin panel. Please contact support.",
        undefined,
      );
      console.log(`[TG webhook] Sent no-panel reply: ${sent}`);
      return res.status(200).end();
    }

    // Fetch template name
    const [tmpl] = await db
      .select({ name: templates.name })
      .from(templates)
      .where(eq(templates.id, tokenRow.templateId))
      .limit(1);

    // Save chatId + enable + record connected time
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

    await db
      .update(telegramConnectionTokens)
      .set({ usedAt: now })
      .where(eq(telegramConnectionTokens.id, tokenRow.id));

    const templateName = tmpl?.name ?? "your template";
    const sent = await sendTelegramMessage(
      chatId,
      `✅ Connected! You will now receive RSVP notifications for <b>${templateName}</b>.`,
    );

    console.log(
      `✅ [TG webhook] Connected templateId=${tokenRow.templateId} chatId=${chatId} messageSent=${sent}`,
    );

    return res.status(200).end();
  } catch (err) {
    console.error("[TG webhook] Processing error:", err);
    return res.status(200).end(); // always 200 to prevent Telegram retries
  }
});

// ─── Task callback query handler ──────────────────────────────────────────────

async function handleTaskCallbackQuery(cq: {
  id: string;
  from: { id: number };
  message?: { message_id: number; chat?: { id: number } };
  data?: string;
}): Promise<void> {
  const callerChatId = String(cq.from.id);
  const msgChatId = cq.message?.chat?.id ?? cq.from.id;
  const msgId = cq.message?.message_id;

  const callbackData = cq.data ?? "";
  let action: "done" | "stop";
  let token: string;

  if (callbackData.startsWith("td:")) {
    action = "done";
    token = callbackData.slice(3);
  } else if (callbackData.startsWith("ts:")) {
    action = "stop";
    token = callbackData.slice(3);
  } else {
    console.log(`[TG callback] Unrecognised callback_data="${callbackData}" — ignoring`);
    await answerCallbackQuery(cq.id);
    return;
  }

  // Look up callback token
  const [tokenRow] = await db
    .select()
    .from(telegramCallbackTokens)
    .where(eq(telegramCallbackTokens.token, token))
    .limit(1);

  if (!tokenRow) {
    console.log(`[TG callback] Token not found: ${token}`);
    await answerCallbackQuery(cq.id, "This button is no longer valid.");
    return;
  }
  if (tokenRow.expiresAt && tokenRow.expiresAt < new Date()) {
    await answerCallbackQuery(cq.id, "This button has expired.");
    return;
  }
  if (tokenRow.usedAt !== null) {
    await answerCallbackQuery(cq.id, "Already actioned.");
    return;
  }

  // Load the task
  const [task] = await db
    .select()
    .from(plannerTasks)
    .where(eq(plannerTasks.id, tokenRow.taskId))
    .limit(1);

  if (!task) {
    console.log(`[TG callback] Task not found: ${tokenRow.taskId}`);
    await answerCallbackQuery(cq.id, "Task not found.");
    return;
  }

  // Verify caller owns this panel — look up with OR NULL to handle isActive=NULL rows
  const [panel] = await db
    .select({ settings: userAdminPanels.settings })
    .from(userAdminPanels)
    .where(
      and(
        eq(userAdminPanels.userId, task.userId),
        eq(userAdminPanels.templateId, task.templateId),
        sql`(${userAdminPanels.isActive} IS TRUE OR ${userAdminPanels.isActive} IS NULL)`,
      ),
    )
    .limit(1);

  const panelSettings = (panel?.settings ?? {}) as Record<string, unknown>;
  const panelChatId = panelSettings.telegramChatId != null
    ? String(panelSettings.telegramChatId)
    : "";

  if (!panel || panelChatId !== callerChatId) {
    console.warn(`[TG callback] Auth fail: caller=${callerChatId} panel=${panelChatId} found=${!!panel}`);
    await answerCallbackQuery(cq.id, "Authorization error. Please reconnect Telegram in the planner.");
    return;
  }

  // Mark token used
  await db
    .update(telegramCallbackTokens)
    .set({ usedAt: new Date() })
    .where(eq(telegramCallbackTokens.id, tokenRow.id));

  const now = new Date();

  if (action === "done") {
    await db
      .update(plannerTasks)
      .set({
        status: "done",
        completedAt: now,
        telegramReminderState: "completed",
        nextReminderAtUtc: null,
        updatedAt: now,
      })
      .where(eq(plannerTasks.id, task.id));

    await answerCallbackQuery(cq.id, "✅ Marked as done!");
    if (msgId) {
      await editTelegramMessageText(msgChatId, msgId, "✅ Task marked as done! Great job.");
    }
    console.log(`[TG callback] Task ${task.id} marked done via Telegram`);
  } else {
    await db
      .update(plannerTasks)
      .set({
        telegramReminderState: "stopped",
        nextReminderAtUtc: null,
        updatedAt: now,
      })
      .where(eq(plannerTasks.id, task.id));

    await answerCallbackQuery(cq.id, "🔕 Reminders stopped.");
    if (msgId) {
      await editTelegramMessageText(msgChatId, msgId, "🔕 Reminders stopped. Your task is still pending in the planner.");
    }
    console.log(`[TG callback] Task ${task.id} reminders stopped via Telegram`);
  }
}

export default router;
