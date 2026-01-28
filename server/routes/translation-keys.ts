import { Router } from "express";
import { db } from "../db.js";
import { 
  translationKeys, 
  translationValues,
  insertTranslationKeySchema,
  insertTranslationValueSchema
} from "@shared/schema.js";
import { eq, sql, and } from "drizzle-orm";
import { authenticateUser } from "../middleware/auth.js";

const router = Router();

// Get all translation keys with values
router.get("/translation-keys", async (req, res) => {
  try {
    const keys = await db
      .select()
      .from(translationKeys)
      .orderBy(translationKeys.section, translationKeys.key);

    const values = await db
      .select()
      .from(translationValues);

    // Build keys with all language values
    const keysWithValues = keys.map(key => {
      const keyValues = values.filter(v => v.keyId === key.id);
      const translations: Record<string, string> = {};
      
      keyValues.forEach(v => {
        translations[v.language] = v.value;
      });

      return {
        ...key,
        translations
      };
    });

    res.json(keysWithValues);
  } catch (error: any) {
    console.error("Error fetching translation keys:", error);
    res.status(500).json({ 
      error: "Failed to fetch translation keys",
      details: error.message 
    });
  }
});

// Get translations by language
router.get("/translation-keys/language/:language", async (req, res) => {
  try {
    const keys = await db
      .select()
      .from(translationKeys);

    const values = await db
      .select()
      .from(translationValues)
      .where(eq(translationValues.language, req.params.language));

    const translations: Record<string, string> = {};
    
    values.forEach(v => {
      const key = keys.find(k => k.id === v.keyId);
      if (key) {
        translations[key.key] = v.value;
      }
    });

    res.json({
      language: req.params.language,
      translations
    });
  } catch (error: any) {
    console.error("Error fetching translations:", error);
    res.status(500).json({ 
      error: "Failed to fetch translations",
      details: error.message 
    });
  }
});

// Get single translation key
router.get("/translation-keys/:id", async (req, res) => {
  try {
    const [key] = await db
      .select()
      .from(translationKeys)
      .where(eq(translationKeys.id, req.params.id))
      .limit(1);

    if (!key) {
      return res.status(404).json({ error: "Translation key not found" });
    }

    const values = await db
      .select()
      .from(translationValues)
      .where(eq(translationValues.keyId, key.id));

    const translations: Record<string, string> = {};
    values.forEach(v => {
      translations[v.language] = v.value;
    });

    res.json({
      ...key,
      translations
    });
  } catch (error: any) {
    console.error("Error fetching translation key:", error);
    res.status(500).json({ 
      error: "Failed to fetch translation key",
      details: error.message 
    });
  }
});

// Create translation key (authenticated)
router.post("/translation-keys", authenticateUser, async (req, res) => {
  try {
    const validatedData = insertTranslationKeySchema.parse(req.body);

    const [newKey] = await db
      .insert(translationKeys)
      .values(validatedData)
      .returning();

    res.status(201).json(newKey);
  } catch (error: any) {
    console.error("Error creating translation key:", error);
    res.status(400).json({ 
      error: "Failed to create translation key",
      details: error.message 
    });
  }
});

// Update translation key (authenticated)
router.patch("/translation-keys/:id", authenticateUser, async (req, res) => {
  try {
    const [updatedKey] = await db
      .update(translationKeys)
      .set({
        ...req.body,
        updatedAt: new Date()
      })
      .where(eq(translationKeys.id, req.params.id))
      .returning();

    if (!updatedKey) {
      return res.status(404).json({ error: "Translation key not found" });
    }

    res.json(updatedKey);
  } catch (error: any) {
    console.error("Error updating translation key:", error);
    res.status(400).json({ 
      error: "Failed to update translation key",
      details: error.message 
    });
  }
});

// Delete translation key (authenticated)
router.delete("/translation-keys/:id", authenticateUser, async (req, res) => {
  try {
    const [deletedKey] = await db
      .delete(translationKeys)
      .where(eq(translationKeys.id, req.params.id))
      .returning();

    if (!deletedKey) {
      return res.status(404).json({ error: "Translation key not found" });
    }

    res.json({ message: "Translation key deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting translation key:", error);
    res.status(500).json({ 
      error: "Failed to delete translation key",
      details: error.message 
    });
  }
});

// Create or update translation value (authenticated)
router.post("/translation-values", authenticateUser, async (req, res) => {
  try {
    const validatedData = insertTranslationValueSchema.parse(req.body);

    // Validate keyId is present
    if (!validatedData.keyId) {
      return res.status(400).json({ error: "keyId is required" });
    }

    // Check if value already exists
    const [existing] = await db
      .select()
      .from(translationValues)
      .where(
        and(
          eq(translationValues.keyId, validatedData.keyId),
          eq(translationValues.language, validatedData.language)
        )
      )
      .limit(1);

    if (existing) {
      // Update existing value
      const [updatedValue] = await db
        .update(translationValues)
        .set({
          value: validatedData.value,
          updatedAt: new Date()
        })
        .where(eq(translationValues.id, existing.id))
        .returning();

      return res.json(updatedValue);
    }

    // Create new value
    const [newValue] = await db
      .insert(translationValues)
      .values(validatedData)
      .returning();

    res.status(201).json(newValue);
  } catch (error: any) {
    console.error("Error creating translation value:", error);
    res.status(400).json({ 
      error: "Failed to create translation value",
      details: error.message 
    });
  }
});

export function registerTranslationKeysRoutes(app: Router) {
  app.use("/api", router);
}
