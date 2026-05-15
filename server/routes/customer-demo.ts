/**
 * customer-demo.ts
 *
 * Public-facing demo lead capture routes + platform-admin management routes.
 *
 * Public  (no auth):
 *   POST  /api/demo/customer-edits              — create a new demo record
 *   GET   /api/demo/customer-edits/:editId      — fetch a demo record by id
 *   PATCH /api/demo/customer-edits/:editId      — update fields during wizard
 *   POST  /api/demo/customer-edits/:editId/upload-hero     — upload hero image
 *   POST  /api/demo/customer-edits/:editId/upload-gallery  — upload gallery images
 *
 * Platform-admin (Bearer JWT):
 *   GET   /api/platform-admin/customer-edits         — list all demo leads
 *   GET   /api/platform-admin/customer-edits/:id     — get detail
 *   PATCH /api/platform-admin/customer-edits/:id/status — update status
 *
 * SAFETY: Nothing in this file reads or modifies the live templates table or
 * any existing template config.  All writes go to the `customer_edits` table.
 */
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { db } from "../db.js";
import { customerEdits, updateCustomerEditSchema } from "../../shared/schema.js";
import { eq, desc } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { z } from "zod";

// ─── Multer for demo image uploads ────────────────────────────────────────────
const demoUploadDir = path.join(process.cwd(), "uploads", "demo-images");
fs.mkdirSync(demoUploadDir, { recursive: true });

const demoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, demoUploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    cb(null, `demo-${Date.now()}-${randomUUID()}${ext}`);
  },
});

const demoUpload = multer({
  storage: demoStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowedMime = /jpeg|jpg|png|gif|webp/;
    const allowedExt = /\.(jpeg|jpg|jfif|jpe|png|gif|webp)$/i;
    if (allowedMime.test(file.mimetype) || allowedExt.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (jpeg, jpg, png, gif, webp) are allowed"));
    }
  },
});

// ─── Auth middleware (reuses same JWT_SECRET as platform-admin) ───────────────
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

// ─── Routers ──────────────────────────────────────────────────────────────────
export const customerDemoPublicRouter = express.Router();
export const customerDemoAdminRouter = express.Router();

// Apply admin auth to the entire admin router
customerDemoAdminRouter.use(authenticatePlatformAdmin);

// ─── Helper: image URL from filename ─────────────────────────────────────────
function demoImageUrl(filename: string): string {
  return `/api/demo/customer-edits/images/${filename}`;
}

/**
 * GET /api/demo/customer-edits/images/:filename
 * Serves demo-uploaded images safely (no directory traversal).
 */
customerDemoPublicRouter.get("/images/:filename", (req, res) => {
  const { filename } = req.params;
  if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return res.status(400).json({ error: "Invalid filename" });
  }
  const filePath = path.join(demoUploadDir, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Image not found" });

  const ext = path.extname(filename).toLowerCase();
  const mime: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".jfif": "image/jpeg", ".jpe": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif" };
  res.setHeader("Content-Type", mime[ext] ?? "image/jpeg");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.sendFile(filePath);
});

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/demo/customer-edits
 * Creates a new empty demo record and returns its id.
 * Called when customer clicks "Try Now" on the landing page.
 */
customerDemoPublicRouter.post("/", async (_req, res) => {
  try {
    const [record] = await db
      .insert(customerEdits)
      .values({ sourceTemplateSlug: "david-rose-romantic", status: "demo" })
      .returning();
    res.status(201).json({ editId: record.id, createdAt: record.createdAt });
  } catch (err) {
    console.error("[CustomerDemo] POST / error:", err);
    res.status(500).json({ error: "Failed to create demo record" });
  }
});

/**
 * GET /api/demo/customer-edits/:editId
 * Fetch an existing demo record (used on page reload to restore wizard state).
 */
customerDemoPublicRouter.get("/:editId", async (req, res) => {
  try {
    const { editId } = req.params;
    if (!/^[0-9a-f-]{36}$/i.test(editId)) {
      return res.status(400).json({ error: "Invalid editId" });
    }
    const [record] = await db
      .select()
      .from(customerEdits)
      .where(eq(customerEdits.id, editId))
      .limit(1);
    if (!record) return res.status(404).json({ error: "Demo record not found" });
    res.json(record);
  } catch (err) {
    console.error("[CustomerDemo] GET /:editId error:", err);
    res.status(500).json({ error: "Failed to fetch demo record" });
  }
});

/**
 * PATCH /api/demo/customer-edits/:editId
 * Incrementally updates the demo record as the customer progresses through steps.
 */
customerDemoPublicRouter.patch("/:editId", async (req, res) => {
  try {
    const { editId } = req.params;
    if (!/^[0-9a-f-]{36}$/i.test(editId)) {
      return res.status(400).json({ error: "Invalid editId" });
    }

    const parsed = updateCustomerEditSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    }

    // Prevent status escalation from public route (admin-only)
    const { status: _status, ...safeData } = parsed.data as any;

    const [updated] = await db
      .update(customerEdits)
      .set({ ...safeData, updatedAt: new Date() })
      .where(eq(customerEdits.id, editId))
      .returning();

    if (!updated) return res.status(404).json({ error: "Demo record not found" });
    res.json(updated);
  } catch (err) {
    console.error("[CustomerDemo] PATCH /:editId error:", err);
    res.status(500).json({ error: "Failed to update demo record" });
  }
});

/**
 * POST /api/demo/customer-edits/:editId/upload-hero
 * Uploads the hero image and stores the URL on the demo record.
 */
customerDemoPublicRouter.post(
  "/:editId/upload-hero",
  demoUpload.single("hero"),
  async (req, res) => {
    try {
      const { editId } = req.params;
      if (!/^[0-9a-f-]{36}$/i.test(editId)) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: "Invalid editId" });
      }
      if (!req.file) return res.status(400).json({ error: "No image file received" });

      const url = demoImageUrl(req.file.filename);
      const [updated] = await db
        .update(customerEdits)
        .set({ heroImageUrl: url, updatedAt: new Date() })
        .where(eq(customerEdits.id, editId))
        .returning({ id: customerEdits.id, heroImageUrl: customerEdits.heroImageUrl });

      if (!updated) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ error: "Demo record not found" });
      }

      res.json({ url });
    } catch (err) {
      console.error("[CustomerDemo] upload-hero error:", err);
      res.status(500).json({ error: "Failed to upload hero image" });
    }
  }
);

/**
 * POST /api/demo/customer-edits/:editId/upload-gallery
 * Uploads up to 10 gallery images and appends their URLs to the demo record.
 */
customerDemoPublicRouter.post(
  "/:editId/upload-gallery",
  demoUpload.array("gallery", 10),
  async (req, res) => {
    try {
      const { editId } = req.params;
      if (!/^[0-9a-f-]{36}$/i.test(editId)) {
        if (Array.isArray(req.files)) (req.files as Express.Multer.File[]).forEach(f => fs.unlinkSync(f.path));
        return res.status(400).json({ error: "Invalid editId" });
      }
      if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        return res.status(400).json({ error: "No image files received" });
      }

      const [existing] = await db
        .select({ galleryImageUrls: customerEdits.galleryImageUrls })
        .from(customerEdits)
        .where(eq(customerEdits.id, editId))
        .limit(1);

      if (!existing) {
        (req.files as Express.Multer.File[]).forEach(f => fs.unlinkSync(f.path));
        return res.status(404).json({ error: "Demo record not found" });
      }

      const newUrls = (req.files as Express.Multer.File[]).map(f => demoImageUrl(f.filename));
      const current: string[] = Array.isArray(existing.galleryImageUrls) ? existing.galleryImageUrls as string[] : [];
      const merged = [...current, ...newUrls].slice(0, 20); // cap at 20

      await db
        .update(customerEdits)
        .set({ galleryImageUrls: merged, updatedAt: new Date() })
        .where(eq(customerEdits.id, editId));

      res.json({ urls: newUrls, total: merged.length });
    } catch (err) {
      console.error("[CustomerDemo] upload-gallery error:", err);
      res.status(500).json({ error: "Failed to upload gallery images" });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// PLATFORM ADMIN ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/platform-admin/customer-edits
 * List all demo leads, newest first.
 */
customerDemoAdminRouter.get("/", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(customerEdits)
      .orderBy(desc(customerEdits.createdAt));
    res.json(rows);
  } catch (err) {
    console.error("[CustomerDemo Admin] GET / error:", err);
    res.status(500).json({ error: "Failed to fetch demo leads" });
  }
});

/**
 * GET /api/platform-admin/customer-edits/:id
 * Get full detail of one demo lead.
 */
customerDemoAdminRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [record] = await db
      .select()
      .from(customerEdits)
      .where(eq(customerEdits.id, id))
      .limit(1);
    if (!record) return res.status(404).json({ error: "Not found" });
    res.json(record);
  } catch (err) {
    console.error("[CustomerDemo Admin] GET /:id error:", err);
    res.status(500).json({ error: "Failed to fetch demo lead" });
  }
});

/**
 * PATCH /api/platform-admin/customer-edits/:id/status
 * Admin-only status update.
 */
customerDemoAdminRouter.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body as { status?: string; notes?: string };

    const validStatuses = ["demo", "contacted", "converted", "archived"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${validStatuses.join(", ")}` });
    }

    const patch: Partial<{ status: string; notes: string; updatedAt: Date }> = {
      updatedAt: new Date(),
    };
    if (status) patch.status = status;
    if (typeof notes === "string") patch.notes = notes;

    const [updated] = await db
      .update(customerEdits)
      .set(patch)
      .where(eq(customerEdits.id, id))
      .returning();

    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (err) {
    console.error("[CustomerDemo Admin] PATCH /:id/status error:", err);
    res.status(500).json({ error: "Failed to update status" });
  }
});
