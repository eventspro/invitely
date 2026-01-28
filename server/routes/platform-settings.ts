import { Router } from "express";
import { db } from "../db.js";
import { 
  platformSettings,
  insertPlatformSettingSchema
} from "@shared/schema.js";
import { eq } from "drizzle-orm";
import { authenticateUser } from "../middleware/auth.js";

const router = Router();

// Get all platform settings
router.get("/platform-settings", async (req, res) => {
  try {
    const settings = await db
      .select()
      .from(platformSettings)
      .orderBy(platformSettings.key);

    // Convert to key-value object for easier consumption
    const settingsObject: Record<string, any> = {};
    settings.forEach(setting => {
      settingsObject[setting.key] = setting.value;
    });

    res.json({
      settings: settingsObject,
      raw: settings // Include raw data with descriptions
    });
  } catch (error: any) {
    console.error("Error fetching platform settings:", error);
    res.status(500).json({ 
      error: "Failed to fetch platform settings",
      details: error.message 
    });
  }
});

// Get single platform setting by key
router.get("/platform-settings/:key", async (req, res) => {
  try {
    const [setting] = await db
      .select()
      .from(platformSettings)
      .where(eq(platformSettings.key, req.params.key))
      .limit(1);

    if (!setting) {
      return res.status(404).json({ error: "Platform setting not found" });
    }

    res.json(setting);
  } catch (error: any) {
    console.error("Error fetching platform setting:", error);
    res.status(500).json({ 
      error: "Failed to fetch platform setting",
      details: error.message 
    });
  }
});

// Create platform setting (authenticated)
router.post("/platform-settings", authenticateUser, async (req, res) => {
  try {
    const validatedData = insertPlatformSettingSchema.parse(req.body);

    // Check if key already exists
    const [existing] = await db
      .select()
      .from(platformSettings)
      .where(eq(platformSettings.key, validatedData.key))
      .limit(1);

    if (existing) {
      return res.status(409).json({ 
        error: "Platform setting with this key already exists",
        suggestion: "Use PATCH /platform-settings/:key to update"
      });
    }

    const [newSetting] = await db
      .insert(platformSettings)
      .values(validatedData)
      .returning();

    res.status(201).json(newSetting);
  } catch (error: any) {
    console.error("Error creating platform setting:", error);
    res.status(400).json({ 
      error: "Failed to create platform setting",
      details: error.message 
    });
  }
});

// Update platform setting (authenticated)
router.patch("/platform-settings/:key", authenticateUser, async (req, res) => {
  try {
    const [updatedSetting] = await db
      .update(platformSettings)
      .set({
        value: req.body.value,
        description: req.body.description,
        updatedAt: new Date()
      })
      .where(eq(platformSettings.key, req.params.key))
      .returning();

    if (!updatedSetting) {
      return res.status(404).json({ error: "Platform setting not found" });
    }

    res.json(updatedSetting);
  } catch (error: any) {
    console.error("Error updating platform setting:", error);
    res.status(400).json({ 
      error: "Failed to update platform setting",
      details: error.message 
    });
  }
});

// Delete platform setting (authenticated)
router.delete("/platform-settings/:key", authenticateUser, async (req, res) => {
  try {
    const [deletedSetting] = await db
      .delete(platformSettings)
      .where(eq(platformSettings.key, req.params.key))
      .returning();

    if (!deletedSetting) {
      return res.status(404).json({ error: "Platform setting not found" });
    }

    res.json({ message: "Platform setting deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting platform setting:", error);
    res.status(500).json({ 
      error: "Failed to delete platform setting",
      details: error.message 
    });
  }
});

// Bulk update settings (authenticated)
router.put("/platform-settings/bulk", authenticateUser, async (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: "Invalid settings object" });
    }

    const updates = [];

    for (const [key, value] of Object.entries(settings)) {
      const [existing] = await db
        .select()
        .from(platformSettings)
        .where(eq(platformSettings.key, key))
        .limit(1);

      if (existing) {
        const [updated] = await db
          .update(platformSettings)
          .set({
            value: value,
            updatedAt: new Date()
          })
          .where(eq(platformSettings.key, key))
          .returning();
        updates.push(updated);
      } else {
        const [created] = await db
          .insert(platformSettings)
          .values({
            key,
            value: value,
            description: `Auto-created setting for ${key}`
          })
          .returning();
        updates.push(created);
      }
    }

    res.json({
      message: `Updated ${updates.length} settings`,
      settings: updates
    });
  } catch (error: any) {
    console.error("Error bulk updating platform settings:", error);
    res.status(500).json({ 
      error: "Failed to bulk update platform settings",
      details: error.message 
    });
  }
});

export function registerPlatformSettingsRoutes(app: Router) {
  app.use("/api", router);
}
