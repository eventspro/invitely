import { Router } from "express";
import { db } from "../db.js";
import { platformSettings } from "@shared/schema.js";
import { eq } from "drizzle-orm";
import { authenticateUser } from "../middleware/auth.js";

const router = Router();
const SETTINGS_KEY = "homepage_content";

// Public — all visitors need this to render the correct homepage content
router.get("/", async (_req, res) => {
  try {
    const [row] = await db
      .select()
      .from(platformSettings)
      .where(eq(platformSettings.key, SETTINGS_KEY))
      .limit(1);

    if (!row) return res.status(404).json({ content: null });
    res.json({ content: row.value });
  } catch (err: any) {
    console.error("homepage-content GET error:", err);
    res.status(500).json({ error: "Failed to load homepage content" });
  }
});

// Admin-only — only the logged-in admin can publish content changes
router.put("/", authenticateUser, async (req, res) => {
  try {
    const content = req.body;
    if (!content || typeof content !== "object") {
      return res.status(400).json({ error: "Request body must be the HomepageContent JSON object" });
    }

    const [existing] = await db
      .select({ key: platformSettings.key })
      .from(platformSettings)
      .where(eq(platformSettings.key, SETTINGS_KEY))
      .limit(1);

    if (existing) {
      await db
        .update(platformSettings)
        .set({ value: content, updatedAt: new Date() })
        .where(eq(platformSettings.key, SETTINGS_KEY));
    } else {
      await db.insert(platformSettings).values({
        key: SETTINGS_KEY,
        value: content,
        description: "Homepage prototype content (managed via /translations-prototype)",
      });
    }

    res.json({ ok: true });
  } catch (err: any) {
    console.error("homepage-content PUT error:", err);
    res.status(500).json({ error: "Failed to save homepage content" });
  }
});

export default router;
