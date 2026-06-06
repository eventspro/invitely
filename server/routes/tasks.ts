/**
 * Planner Tasks API
 *
 * All routes are scoped to (userId, templateId) — a customer can only
 * access their own tasks for their own template.
 *
 * GET    /api/planner/tasks/:templateId          — list tasks
 * POST   /api/planner/tasks/:templateId          — create task
 * PUT    /api/planner/tasks/:templateId/:taskId  — update task
 * DELETE /api/planner/tasks/:templateId/:taskId  — delete task
 */

import express, { type Response } from "express";
import { db } from "../db.js";
import {
  plannerTasks,
  userAdminPanels,
  type PlannerTask,
} from "../../shared/schema.js";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { fromZonedTime } from "date-fns-tz";
import {
  authenticateUser,
  requireAdminPanelAccess,
  type AuthenticatedRequest,
} from "../middleware/auth.js";
import { scheduleReminder, cancelReminder } from "../reminderScheduler.js";
import {
  getPlannerData,
  importLegacyPlannerData,
  replacePlannerData,
  type PlannerDataPayload,
} from "../plannerData.js";

const router = express.Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert a datetime-local string ("2026-06-15T15:00") + IANA timezone → UTC Date. */
function parseDueAtUtc(dueAtLocal: string, timezone: string): Date {
  try {
    return fromZonedTime(dueAtLocal, timezone);
  } catch {
    console.warn(`[tasks] Invalid timezone "${timezone}", falling back to UTC parse`);
    return new Date(dueAtLocal);
  }
}

/** Derive telegram_reminder_state for a newly created / rescheduled task. */
async function deriveTelegramState(
  userId: string,
  templateId: string,
  reminderEnabled: boolean,
): Promise<string> {
  if (!reminderEnabled) return "not_scheduled";

  const [panel] = await db
    .select({ settings: userAdminPanels.settings })
    .from(userAdminPanels)
    .where(
      and(
        eq(userAdminPanels.userId, userId),
        eq(userAdminPanels.templateId, templateId),
        eq(userAdminPanels.isActive, true),
      ),
    )
    .limit(1);

  const s = (panel?.settings ?? {}) as Record<string, unknown>;
  return s.telegramChatId && s.telegramEnabled ? "scheduled" : "not_scheduled";
}

// ─── Validation schema ────────────────────────────────────────────────────────

const taskInputSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional().nullable(),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
  // Reminder fields
  dueAtLocal: z.string().optional().nullable(),        // "2026-06-15T15:00"
  timezone: z.string().default("Asia/Yerevan"),
  reminderEnabled: z.boolean().default(false),
  repeatIntervalMinutes: z.number().int().positive().nullable().optional(),
  // Status update
  status: z.enum(["pending", "done", "cancelled"]).optional(),
});

type TaskInput = z.infer<typeof taskInputSchema>;

const plannerGuestSchema = z.object({
  id: z.string().min(1).optional(),
  rsvpId: z.string().min(1).optional().nullable(),
  source: z.enum(["manual", "rsvp"]).optional(),
  fullName: z.string().min(1).max(500),
  phone: z.string().max(100).optional().nullable(),
  email: z.string().max(320).optional().nullable(),
  rsvpStatus: z.enum(["invited", "coming", "not_coming", "waiting", "maybe"]).default("invited"),
  guestCount: z.number().int().min(1).max(100).default(1),
  side: z.enum(["bride", "groom", "both", "other"]).default("both"),
  groupName: z.string().max(300).optional().nullable(),
  tableId: z.string().min(1).optional().nullable(),
  seatId: z.string().min(1).optional().nullable(),
  dietaryNotes: z.string().max(2000).optional().nullable(),
  notes: z.string().max(3000).optional().nullable(),
});

const plannerTableSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(1).max(300),
  shape: z.string().min(1).max(50).default("circle"),
  capacity: z.number().int().min(1).max(200).default(10),
  x: z.number().optional().nullable(),
  y: z.number().optional().nullable(),
  rotation: z.number().optional().nullable(),
  size: z.number().optional().nullable(),
  locked: z.boolean().optional(),
  color: z.string().max(80).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

const plannerSeatSchema = z.object({
  id: z.string().min(1).optional(),
  tableId: z.string().min(1),
  seatNumber: z.number().int().min(1).max(500),
  guestId: z.string().min(1).optional().nullable(),
});

const plannerBudgetItemSchema = z.object({
  id: z.string().min(1).optional(),
  category: z.string().min(1).max(80).default("other"),
  customCategoryName: z.string().max(200).optional().nullable(),
  title: z.string().min(1).max(500),
  vendorName: z.string().max(500).optional().nullable(),
  plannedCost: z.number().min(0).default(0),
  actualCost: z.number().min(0).default(0),
  paidAmount: z.number().min(0).default(0),
  dueDate: z.string().max(50).optional().nullable(),
  status: z.string().min(1).max(80).default("planned"),
  notes: z.string().max(3000).optional().nullable(),
  receiptDataUrl: z.string().max(10_000_000).optional().nullable(),
  receiptFileName: z.string().max(500).optional().nullable(),
});

const plannerSettingsSchema = z.object({
  weddingDate: z.string().max(50).default(""),
  coupleName: z.string().max(300).default(""),
  currency: z.string().max(20).default("AMD"),
  defaultSeatsPerTable: z.number().int().min(1).max(200).default(10),
  restaurantPricePerGuest: z.number().min(0).default(150),
  totalBudget: z.number().min(0).default(0),
});

const plannerDataInputSchema = z.object({
  guests: z.array(plannerGuestSchema).default([]),
  tables: z.array(plannerTableSchema).default([]),
  seats: z.array(plannerSeatSchema).default([]),
  budgetItems: z.array(plannerBudgetItemSchema).default([]),
  tasks: z.array(z.unknown()).optional(),
  settings: plannerSettingsSchema.default({}),
});

type PlannerDataInput = z.infer<typeof plannerDataInputSchema>;

function toPlannerDataPayload(data: PlannerDataInput): Partial<PlannerDataPayload> {
  return data as Partial<PlannerDataPayload>;
}

router.get(
  "/data/:templateId",
  authenticateUser,
  requireAdminPanelAccess,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { templateId } = req.params;
      const userId = req.user!.id;
      return res.json(await getPlannerData(userId, templateId));
    } catch (err) {
      console.error("[planner-data] get error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  },
);

router.put(
  "/data/:templateId",
  authenticateUser,
  requireAdminPanelAccess,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { templateId } = req.params;
      const userId = req.user!.id;

      const parsed = plannerDataInputSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
      }

      return res.json(await replacePlannerData(userId, templateId, toPlannerDataPayload(parsed.data)));
    } catch (err) {
      console.error("[planner-data] save error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  },
);

router.post(
  "/data/:templateId/import",
  authenticateUser,
  requireAdminPanelAccess,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { templateId } = req.params;
      const userId = req.user!.id;

      const parsed = plannerDataInputSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
      }

      return res.json(await importLegacyPlannerData(userId, templateId, toPlannerDataPayload(parsed.data)));
    } catch (err) {
      console.error("[planner-data] import error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  },
);

// ─── GET /api/planner/tasks/:templateId ───────────────────────────────────────

router.get(
  "/tasks/:templateId",
  authenticateUser,
  requireAdminPanelAccess,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { templateId } = req.params;
      const userId = req.user!.id;

      const tasks = await db
        .select()
        .from(plannerTasks)
        .where(
          and(
            eq(plannerTasks.userId, userId),
            eq(plannerTasks.templateId, templateId),
          ),
        )
        .orderBy(desc(plannerTasks.createdAt));

      return res.json(tasks);
    } catch (err) {
      console.error("[tasks] list error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  },
);

// ─── POST /api/planner/tasks/:templateId ──────────────────────────────────────

router.post(
  "/tasks/:templateId",
  authenticateUser,
  requireAdminPanelAccess,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { templateId } = req.params;
      const userId = req.user!.id;

      const parsed = taskInputSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
      }
      const data: TaskInput = parsed.data;

      let dueAtUtc: Date | null = null;
      let nextReminderAtUtc: Date | null = null;

      if (data.dueAtLocal && data.reminderEnabled) {
        dueAtUtc = parseDueAtUtc(data.dueAtLocal, data.timezone);
        nextReminderAtUtc = dueAtUtc;
      } else if (data.dueAtLocal) {
        dueAtUtc = parseDueAtUtc(data.dueAtLocal, data.timezone);
      }

      const telegramReminderState = await deriveTelegramState(
        userId,
        templateId,
        data.reminderEnabled && !!nextReminderAtUtc,
      );

      const [task] = await db
        .insert(plannerTasks)
        .values({
          userId,
          templateId,
          title: data.title,
          description: data.description ?? null,
          priority: data.priority,
          status: "pending",
          dueAtUtc: dueAtUtc ?? undefined,
          timezone: data.timezone,
          reminderEnabled: data.reminderEnabled,
          repeatIntervalMinutes: data.repeatIntervalMinutes ?? null,
          telegramReminderState,
          nextReminderAtUtc: nextReminderAtUtc ?? undefined,
        })
        .returning();

      if (task.telegramReminderState === "scheduled" && task.nextReminderAtUtc) {
        scheduleReminder(task.id, task.nextReminderAtUtc);
      }

      return res.status(201).json(task);
    } catch (err) {
      console.error("[tasks] create error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  },
);

// ─── PUT /api/planner/tasks/:templateId/:taskId ───────────────────────────────

router.put(
  "/tasks/:templateId/:taskId",
  authenticateUser,
  requireAdminPanelAccess,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { templateId, taskId } = req.params;
      const userId = req.user!.id;

      // Verify ownership
      const [existing] = await db
        .select()
        .from(plannerTasks)
        .where(
          and(
            eq(plannerTasks.id, taskId),
            eq(plannerTasks.userId, userId),
            eq(plannerTasks.templateId, templateId),
          ),
        )
        .limit(1);

      if (!existing) {
        return res.status(404).json({ error: "Task not found" });
      }

      const parsed = taskInputSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
      }
      const data = parsed.data;

      const updates: Partial<PlannerTask> & { updatedAt: Date } = {
        updatedAt: new Date(),
      };

      // Apply simple field updates
      if (data.title !== undefined)       updates.title = data.title;
      if (data.description !== undefined) updates.description = data.description ?? null;
      if (data.priority !== undefined)    updates.priority = data.priority;

      // Status transition
      if (data.status !== undefined) {
        updates.status = data.status;
        if (data.status === "done" && !existing.completedAt) {
          updates.completedAt = new Date();
          updates.telegramReminderState = "completed";
          updates.nextReminderAtUtc = null;
        }
        if (data.status === "cancelled") {
          updates.telegramReminderState = "stopped";
          updates.nextReminderAtUtc = null;
        }
      }

      // Reminder fields update
      const timezoneToUse = data.timezone ?? existing.timezone;
      const reminderEnabledToUse = data.reminderEnabled ?? existing.reminderEnabled;

      if (data.reminderEnabled !== undefined) {
        updates.reminderEnabled = data.reminderEnabled;
      }
      if (data.repeatIntervalMinutes !== undefined) {
        updates.repeatIntervalMinutes = data.repeatIntervalMinutes ?? null;
      }
      if (data.timezone !== undefined) {
        updates.timezone = data.timezone;
      }

      // If due time changed, recompute UTC and reschedule
      const dueTimeChanged = data.dueAtLocal !== undefined;
      if (dueTimeChanged) {
        if (data.dueAtLocal) {
          const newDueUtc = parseDueAtUtc(data.dueAtLocal, timezoneToUse);
          updates.dueAtUtc = newDueUtc;

          if (reminderEnabledToUse && updates.status !== "done" && updates.status !== "cancelled") {
            updates.nextReminderAtUtc = newDueUtc;
            // Reset retry state on reschedule
            updates.sendRetryCount = 0;
            updates.sendLastError = null;
            updates.telegramReminderState = await deriveTelegramState(
              userId,
              templateId,
              true,
            );
          }
        } else {
          updates.dueAtUtc = null;
          updates.nextReminderAtUtc = null;
          updates.telegramReminderState = "not_scheduled";
        }
      }

      // If reminder toggled ON without changing time, schedule from existing dueAtUtc
      if (
        data.reminderEnabled === true &&
        !dueTimeChanged &&
        existing.dueAtUtc &&
        updates.status !== "done" &&
        updates.status !== "cancelled"
      ) {
        updates.nextReminderAtUtc = existing.dueAtUtc;
        updates.sendRetryCount = 0;
        updates.sendLastError = null;
        updates.telegramReminderState = await deriveTelegramState(
          userId,
          templateId,
          true,
        );
      }

      // If reminder toggled OFF, clear schedule
      if (data.reminderEnabled === false) {
        updates.nextReminderAtUtc = null;
        updates.telegramReminderState = "not_scheduled";
      }

      const [updated] = await db
        .update(plannerTasks)
        .set(updates as any)
        .where(eq(plannerTasks.id, taskId))
        .returning();

      cancelReminder(taskId);
      if (
        (updated.telegramReminderState === "scheduled" || updated.telegramReminderState === "repeating") &&
        updated.nextReminderAtUtc
      ) {
        scheduleReminder(updated.id, updated.nextReminderAtUtc);
      }

      return res.json(updated);
    } catch (err) {
      console.error("[tasks] update error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  },
);

// ─── DELETE /api/planner/tasks/:templateId/:taskId ────────────────────────────

router.delete(
  "/tasks/:templateId/:taskId",
  authenticateUser,
  requireAdminPanelAccess,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { templateId, taskId } = req.params;
      const userId = req.user!.id;

      const [deleted] = await db
        .delete(plannerTasks)
        .where(
          and(
            eq(plannerTasks.id, taskId),
            eq(plannerTasks.userId, userId),
            eq(plannerTasks.templateId, templateId),
          ),
        )
        .returning({ id: plannerTasks.id });

      if (!deleted) {
        return res.status(404).json({ error: "Task not found" });
      }

      cancelReminder(taskId);
      return res.json({ deleted: true });
    } catch (err) {
      console.error("[tasks] delete error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  },
);

// ─── GET /api/planner/telegram-status/:templateId ────────────────────────────

router.get(
  "/telegram-status/:templateId",
  authenticateUser,
  requireAdminPanelAccess,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { templateId } = req.params;
      const userId = req.user!.id;

      const [panel] = await db
        .select({ settings: userAdminPanels.settings })
        .from(userAdminPanels)
        .where(
          and(
            eq(userAdminPanels.userId, userId),
            eq(userAdminPanels.templateId, templateId),
            eq(userAdminPanels.isActive, true),
          ),
        )
        .limit(1);

      const s = (panel?.settings ?? {}) as Record<string, unknown>;
      return res.json({ telegramConnected: !!(s.telegramChatId && s.telegramEnabled) });
    } catch (err) {
      console.error("[tasks] telegram-status error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  },
);

export default router;
