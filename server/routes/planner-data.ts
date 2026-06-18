/**
 * Planner Data API — bulk read/write for guests, tables, seats, budget items, settings.
 *
 * GET  /api/planner/data/:templateId             — fetch all planner data for the authenticated user
 * PUT  /api/planner/data/:templateId             — replace all planner data (full sync)
 * POST /api/planner/data/:templateId/import      — merge legacy localStorage data into DB
 * POST /api/planner/data/:templateId/sync-rsvps  — explicitly re-import guests from RSVP submissions
 */

import express, { type Response } from "express";
import {
  authenticateUser,
  requireAdminPanelAccess,
  type AuthenticatedRequest,
} from "../middleware/auth.js";
import {
  getPlannerData,
  replacePlannerData,
  importLegacyPlannerData,
  syncPlannerGuestsFromRsvps,
} from "../plannerData.js";

const router = express.Router();

// ─── GET /data/:templateId ────────────────────────────────────────────────────

router.get(
  "/data/:templateId",
  authenticateUser,
  requireAdminPanelAccess,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { templateId } = req.params;
      const userId = req.user!.id;
      const data = await getPlannerData(userId, templateId);
      return res.json(data);
    } catch (err) {
      console.error("[planner-data] GET error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  },
);

// ─── PUT /data/:templateId ────────────────────────────────────────────────────

router.put(
  "/data/:templateId",
  authenticateUser,
  requireAdminPanelAccess,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { templateId } = req.params;
      const userId = req.user!.id;
      const body = req.body ?? {};
      const expectedVersion = typeof body.plannerVersion === "string" ? body.plannerVersion : undefined;
      const data = await replacePlannerData(userId, templateId, body, { expectedVersion });
      return res.json(data);
    } catch (err: unknown) {
      if (err instanceof Error && (err as NodeJS.ErrnoException).code === "PLANNER_VERSION_CONFLICT") {
        return res.status(409).json({ error: "conflict" });
      }
      console.error("[planner-data] PUT error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  },
);

// ─── POST /data/:templateId/import ───────────────────────────────────────────

router.post(
  "/data/:templateId/import",
  authenticateUser,
  requireAdminPanelAccess,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { templateId } = req.params;
      const userId = req.user!.id;
      const data = await importLegacyPlannerData(userId, templateId, req.body ?? {});
      return res.json(data);
    } catch (err) {
      console.error("[planner-data] import error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  },
);

// ─── POST /data/:templateId/sync-rsvps ───────────────────────────────────────

router.post(
  "/data/:templateId/sync-rsvps",
  authenticateUser,
  requireAdminPanelAccess,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { templateId } = req.params;
      const userId = req.user!.id;
      await syncPlannerGuestsFromRsvps(userId, templateId);
      const data = await getPlannerData(userId, templateId);
      return res.json(data);
    } catch (err) {
      console.error("[planner-data] sync-rsvps error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  },
);

export default router;
