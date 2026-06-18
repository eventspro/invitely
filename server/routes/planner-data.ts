/**
 * Planner Data API — bulk read/write for guests, tables, seats, budget items, settings.
 *
 * GET  /api/planner/data/:templateId        — fetch all planner data for the authenticated user
 * PUT  /api/planner/data/:templateId        — replace all planner data (full sync)
 * POST /api/planner/data/:templateId/import — merge legacy localStorage data into DB
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
      const data = await replacePlannerData(userId, templateId, req.body ?? {});
      return res.json(data);
    } catch (err) {
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

export default router;
