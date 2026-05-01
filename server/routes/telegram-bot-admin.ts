/**
 * Telegram Bot Admin Routes
 *
 * All routes require platform-admin authentication (Bearer token in Authorization header).
 * These endpoints manage configurable bot commands and buttons only.
 *
 * The CONNECT token flow and RSVP notification flow are NOT touched here.
 *
 * Routes:
 *   GET    /api/platform-admin/telegram-bot/commands            — list all commands
 *   POST   /api/platform-admin/telegram-bot/commands            — create command
 *   PUT    /api/platform-admin/telegram-bot/commands/:id        — update command
 *   DELETE /api/platform-admin/telegram-bot/commands/:id        — delete command
 *   GET    /api/platform-admin/telegram-bot/settings            — get fallback message
 *   PUT    /api/platform-admin/telegram-bot/settings            — update fallback message
 *   PUT    /api/platform-admin/telegram-bot/commands/:id/buttons — replace buttons for a command
 */

import { Router } from "express";
import { db } from "../db.js";
import {
  telegramBotCommands,
  telegramBotButtons,
  platformSettings,
  telegramBotUsers,
  managementUsers,
  templates,
  insertTelegramBotCommandSchema,
  updateTelegramBotCommandSchema,
} from "../../shared/schema.js";
import { eq, asc, sql, desc, ilike, or, and } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { z } from "zod";

const router = Router();

// ─── Auth middleware (same pattern as platform-admin.ts) ──────────────────────
const authenticatePlatformAdmin = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Authentication required" });
  try {
    jwt.verify(token, process.env.JWT_SECRET || "fallback-secret");
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

router.use(authenticatePlatformAdmin);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const FALLBACK_SETTINGS_KEY = "telegram_bot_fallback";

async function getFallbackMessage(): Promise<string> {
  try {
    const [row] = await db
      .select()
      .from(platformSettings)
      .where(eq(platformSettings.key, FALLBACK_SETTINGS_KEY))
      .limit(1);
    const v = row?.value as any;
    return typeof v?.message === "string" ? v.message : DEFAULT_FALLBACK;
  } catch {
    return DEFAULT_FALLBACK;
  }
}

const DEFAULT_FALLBACK =
  "Ողջույն! Ես չճանաչեցի ձեր հարցումը։\n\nՕգտագործեք /help հրամանը հասանելի հրամանների ցուցակը տեսնելու համար։";

// ─── GET /commands ─────────────────────────────────────────────────────────────
router.get("/commands", async (_req, res) => {
  try {
    const commands = await db
      .select()
      .from(telegramBotCommands)
      .orderBy(asc(telegramBotCommands.orderIndex), asc(telegramBotCommands.createdAt));

    const buttons = await db
      .select()
      .from(telegramBotButtons)
      .orderBy(asc(telegramBotButtons.orderIndex));

    const result = commands.map((cmd) => ({
      ...cmd,
      buttons: buttons.filter((b) => b.commandId === cmd.id),
    }));

    return res.json(result);
  } catch (err) {
    console.error("[TG Bot Admin] list commands error:", err);
    return res.status(500).json({ error: "Failed to fetch commands" });
  }
});

// ─── POST /commands ────────────────────────────────────────────────────────────
router.post("/commands", async (req, res) => {
  try {
    const parsed = insertTelegramBotCommandSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    }

    const [created] = await db
      .insert(telegramBotCommands)
      .values(parsed.data)
      .returning();

    return res.status(201).json(created);
  } catch (err: any) {
    // Unique constraint on command
    if (err?.code === "23505") {
      return res.status(409).json({ error: "A command with this name already exists" });
    }
    console.error("[TG Bot Admin] create command error:", err);
    return res.status(500).json({ error: "Failed to create command" });
  }
});

// ─── PUT /commands/:id ─────────────────────────────────────────────────────────
router.put("/commands/:id", async (req, res) => {
  try {
    const parsed = updateTelegramBotCommandSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    }

    const [updated] = await db
      .update(telegramBotCommands)
      .set({ ...parsed.data, updatedAt: sql`now()` })
      .where(eq(telegramBotCommands.id, req.params.id))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Command not found" });
    }

    return res.json(updated);
  } catch (err: any) {
    if (err?.code === "23505") {
      return res.status(409).json({ error: "A command with this name already exists" });
    }
    console.error("[TG Bot Admin] update command error:", err);
    return res.status(500).json({ error: "Failed to update command" });
  }
});

// ─── DELETE /commands/:id ─────────────────────────────────────────────────────
router.delete("/commands/:id", async (req, res) => {
  try {
    const [deleted] = await db
      .delete(telegramBotCommands)
      .where(eq(telegramBotCommands.id, req.params.id))
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: "Command not found" });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("[TG Bot Admin] delete command error:", err);
    return res.status(500).json({ error: "Failed to delete command" });
  }
});

// ─── PUT /commands/:id/buttons — replace all buttons for a command ─────────────
router.put("/commands/:id/buttons", async (req, res) => {
  try {
    const { buttons } = req.body;
    if (!Array.isArray(buttons)) {
      return res.status(400).json({ error: "buttons must be an array" });
    }

    // Validate each button
    // Note: insertTelegramBotButtonSchema has .superRefine() applied which returns ZodEffects
    // and ZodEffects does not support .omit(). Define the per-button schema inline instead.
    const singleButtonSchema = z.object({
      label: z.string().min(1, "Label is required").max(64, "Label too long"),
      type: z.enum(["url", "command"]),
      value: z.string().min(1, "Value is required").max(200),
      orderIndex: z.number().int().min(0).default(0),
    }).superRefine((data, ctx) => {
      if (data.type === "url") {
        try {
          const url = new URL(data.value);
          if (url.protocol !== "http:" && url.protocol !== "https:") {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "URL must use http or https", path: ["value"] });
          }
        } catch {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid URL", path: ["value"] });
        }
      } else if (data.type === "command") {
        if (!/^\/[a-zA-Z0-9_]+$/.test(data.value)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Command value must start with / and contain only letters, digits, or underscores", path: ["value"] });
        }
      }
    });
    const buttonSchema = z.array(singleButtonSchema);
    const parsed = buttonSchema.safeParse(buttons);
    if (!parsed.success) {
      return res.status(400).json({ error: "Button validation failed", details: parsed.error.flatten() });
    }

    // Verify command exists
    const [cmd] = await db
      .select({ id: telegramBotCommands.id })
      .from(telegramBotCommands)
      .where(eq(telegramBotCommands.id, req.params.id))
      .limit(1);

    if (!cmd) {
      return res.status(404).json({ error: "Command not found" });
    }

    // Replace buttons atomically
    await db.transaction(async (tx) => {
      await tx.delete(telegramBotButtons).where(eq(telegramBotButtons.commandId, req.params.id));

      if (parsed.data.length > 0) {
        await tx.insert(telegramBotButtons).values(
          parsed.data.map((b, i) => ({
            ...b,
            commandId: req.params.id,
            orderIndex: b.orderIndex ?? i,
          })),
        );
      }
    });

    const updated = await db
      .select()
      .from(telegramBotButtons)
      .where(eq(telegramBotButtons.commandId, req.params.id))
      .orderBy(asc(telegramBotButtons.orderIndex));

    return res.json(updated);
  } catch (err) {
    console.error("[TG Bot Admin] update buttons error:", err);
    return res.status(500).json({ error: "Failed to update buttons" });
  }
});

// ─── GET /settings ─────────────────────────────────────────────────────────────
router.get("/settings", async (_req, res) => {
  try {
    const message = await getFallbackMessage();
    return res.json({ fallbackMessage: message });
  } catch (err) {
    console.error("[TG Bot Admin] get settings error:", err);
    return res.status(500).json({ error: "Failed to fetch settings" });
  }
});

// ─── PUT /settings ─────────────────────────────────────────────────────────────
router.put("/settings", async (req, res) => {
  try {
    const { fallbackMessage } = req.body;

    const settingsSchema = z.object({
      fallbackMessage: z.string().min(1, "Fallback message is required").max(4096),
    });
    const parsed = settingsSchema.safeParse({ fallbackMessage });
    if (!parsed.success) {
      return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    }

    const value = { message: parsed.data.fallbackMessage };

    const [existing] = await db
      .select()
      .from(platformSettings)
      .where(eq(platformSettings.key, FALLBACK_SETTINGS_KEY))
      .limit(1);

    if (existing) {
      await db
        .update(platformSettings)
        .set({ value, updatedAt: new Date() })
        .where(eq(platformSettings.key, FALLBACK_SETTINGS_KEY));
    } else {
      await db.insert(platformSettings).values({
        key: FALLBACK_SETTINGS_KEY,
        value,
        description: "Telegram bot fallback message for unknown commands",
      });
    }

    return res.json({ success: true, fallbackMessage: parsed.data.fallbackMessage });
  } catch (err) {
    console.error("[TG Bot Admin] update settings error:", err);
    return res.status(500).json({ error: "Failed to update settings" });
  }
});

// ─── GET /users ────────────────────────────────────────────────────────────────
// Returns bot user analytics: counts + paginated user list with optional filters.
// Query params:
//   search  — partial match on username, firstName, lastName, telegramUserId
//   status  — "all" | "connected" | "unconnected"  (default: "all")
//   limit   — max rows to return (default 50, max 200)
//   offset  — pagination offset (default 0)
router.get("/users", async (req, res) => {
  try {
    const { search, status, limit: limitParam, offset: offsetParam } = req.query as Record<string, string>;
    const limit = Math.min(Number(limitParam) || 50, 200);
    const offset = Number(offsetParam) || 0;

    // Build where clause for status filter
    const statusFilter =
      status === "connected"
        ? eq(telegramBotUsers.isConnectedCustomer, true)
        : status === "unconnected"
        ? eq(telegramBotUsers.isConnectedCustomer, false)
        : undefined;

    // Build where clause for search
    const searchFilter = search?.trim()
      ? or(
          ilike(telegramBotUsers.username, `%${search.trim()}%`),
          ilike(telegramBotUsers.firstName, `%${search.trim()}%`),
          ilike(telegramBotUsers.lastName, `%${search.trim()}%`),
          ilike(telegramBotUsers.telegramUserId, `%${search.trim()}%`),
        )
      : undefined;

    const whereClause =
      statusFilter && searchFilter
        ? and(statusFilter, searchFilter)
        : statusFilter ?? searchFilter;

    // Fetch counts (unfiltered by search, only by status for the totals)
    const [totals] = await db
      .select({
        total: sql<number>`count(*)::int`,
        connected: sql<number>`sum(case when ${telegramBotUsers.isConnectedCustomer} then 1 else 0 end)::int`,
      })
      .from(telegramBotUsers);

    // Fetch users with optional joins for customer name and template name
    const users = await db
      .select({
        id: telegramBotUsers.id,
        telegramUserId: telegramBotUsers.telegramUserId,
        telegramChatId: telegramBotUsers.telegramChatId,
        username: telegramBotUsers.username,
        firstName: telegramBotUsers.firstName,
        lastName: telegramBotUsers.lastName,
        languageCode: telegramBotUsers.languageCode,
        isConnectedCustomer: telegramBotUsers.isConnectedCustomer,
        customerId: telegramBotUsers.customerId,
        templateId: telegramBotUsers.templateId,
        firstSeenAt: telegramBotUsers.firstSeenAt,
        lastSeenAt: telegramBotUsers.lastSeenAt,
        customerEmail: managementUsers.email,
        customerFirstName: managementUsers.firstName,
        customerLastName: managementUsers.lastName,
        templateName: templates.name,
        templateSlug: templates.slug,
      })
      .from(telegramBotUsers)
      .leftJoin(managementUsers, eq(telegramBotUsers.customerId, managementUsers.id))
      .leftJoin(templates, eq(telegramBotUsers.templateId, templates.id))
      .where(whereClause)
      .orderBy(desc(telegramBotUsers.lastSeenAt))
      .limit(limit)
      .offset(offset);

    return res.json({
      total: totals?.total ?? 0,
      connected: totals?.connected ?? 0,
      unconnected: (totals?.total ?? 0) - (totals?.connected ?? 0),
      users,
    });
  } catch (err) {
    console.error("[TG Bot Admin] users error:", err);
    return res.status(500).json({ error: "Failed to fetch bot users" });
  }
});

export default router;
