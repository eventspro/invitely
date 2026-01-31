// Translation Management API Routes
import type { Express } from "express";
import { db } from "../db.js";
import { translations } from "../../shared/schema.js";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

// Import default translations for initialization
import { en } from "../../client/src/config/languages/en.js";
import { hy } from "../../client/src/config/languages/hy.js";
import { ru } from "../../client/src/config/languages/ru.js";

const defaultTranslations = { en, hy, ru };

const updateTranslationSchema = z.object({
  language: z.enum(['en', 'hy', 'ru']),
  key: z.string(),
  value: z.string()
});

// Helper to flatten nested objects into dot-notation keys
function flattenObject(obj: any, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  
  for (const key in obj) {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'string') {
      result[newKey] = value;
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, newKey));
    }
  }
  
  return result;
}

// Helper to unflatten dot-notation keys back to nested objects
function unflattenObject(flat: Record<string, string>): any {
  const result: any = {};
  
  for (const key in flat) {
    const keys = key.split('.');
    let current = result;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = flat[key];
  }
  
  return result;
}

// Initialize translations in database from defaults
async function initializeTranslations() {
  try {
    // Check if translations exist
    const existingCount = await db.select().from(translations).limit(1);
    
    if (existingCount.length === 0) {
      console.log('🔄 Initializing translations database...');
      
      for (const [lang, config] of Object.entries(defaultTranslations)) {
        const flattened = flattenObject(config);
        
        for (const [key, value] of Object.entries(flattened)) {
          await db.insert(translations).values({
            language: lang,
            translationKey: key,
            value: value,
            category: key.split('.')[0]
          });
        }
      }
      
      console.log('✅ Translations initialized');
    }
  } catch (error) {
    console.error('❌ Failed to initialize translations:', error);
  }
}

export function registerTranslationRoutes(app: Express) {
  
  // Initialize on startup
  initializeTranslations();
  
  // Get all translations for all languages (returns nested structure)
  app.get("/api/translations", async (req, res) => {
    try {
      const allTranslations = await db.select().from(translations);
      
      // Initialize empty structure for all languages
      const grouped: Record<string, any> = { 
        en: {}, 
        hy: {}, 
        ru: {} 
      };
      
      // If no translations exist, return empty structure (valid response)
      if (!allTranslations || allTranslations.length === 0) {
        console.log("⚠️ No translations found in database, returning empty structure");
        return res.json(grouped);
      }
      
      // Group by language and unflatten (with proper array support)
      for (const t of allTranslations) {
        if (!t.language || !t.translationKey || !t.value) {
          console.warn("⚠️ Invalid translation entry:", t);
          continue;
        }
        
        if (!grouped[t.language]) {
          console.warn(`⚠️ Unknown language: ${t.language}, skipping`);
          continue;
        }
        
        const keys = t.translationKey.split('.');
        let current = grouped[t.language];
        
        try {
          for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            const nextKey = keys[i + 1];
            
            // Check if current key is a number (we're in an array)
            const isCurrentKeyNumeric = /^\d+$/.test(key);
            // Check if next key is a number (next level should be array)
            const isNextKeyNumeric = /^\d+$/.test(nextKey);
            
            if (isCurrentKeyNumeric) {
              // We're setting an array element
              const index = parseInt(key, 10);
              if (!current[index]) {
                current[index] = isNextKeyNumeric ? [] : {};
              }
              current = current[index];
            } else {
              // We're setting an object property
              if (!current[key]) {
                current[key] = isNextKeyNumeric ? [] : {};
              }
              current = current[key];
            }
          }
          
          const finalKey = keys[keys.length - 1];
          const isFinalKeyNumeric = /^\d+$/.test(finalKey);
          
          if (isFinalKeyNumeric) {
            current[parseInt(finalKey, 10)] = t.value;
          } else {
            current[finalKey] = t.value;
          }
        } catch (err) {
          console.error(`⚠️ Error processing translation key ${t.translationKey}:`, err);
          continue;
        }
      }
      
      console.log(`✅ Loaded ${allTranslations.length} translations for ${Object.keys(grouped).length} languages`);
      
      // Debug: Log templatesPage.faqItems structure
      if (grouped.en?.templatesPage?.faqItems) {
        console.log('🐛 faqItems type:', Array.isArray(grouped.en.templatesPage.faqItems) ? 'Array' : 'Object');
        console.log('🐛 faqItems:', JSON.stringify(grouped.en.templatesPage.faqItems).substring(0, 200));
      }
      
      res.json(grouped);
    } catch (error) {
      console.error("❌ Get translations error:", error);
      
      // NEVER propagate errors to client - return empty valid structure
      const emptyStructure = { 
        en: {}, 
        hy: {}, 
        ru: {} 
      };
      
      console.log("⚠️ Returning empty structure due to error");
      res.status(200).json(emptyStructure);
    }
  });

  // Get translations for specific language
  app.get("/api/translations/:language", async (req, res) => {
    try {
      const { language } = req.params;
      
      const langTranslations = await db
        .select()
        .from(translations)
        .where(eq(translations.language, language));
      
      // Unflatten to nested structure
      const flat: Record<string, string> = {};
      for (const t of langTranslations) {
        flat[t.translationKey] = t.value;
      }
      
      res.json(unflattenObject(flat));
    } catch (error) {
      console.error("Get language translations error:", error);
      res.status(500).json({ message: "Failed to get translations" });
    }
  });

  // Get all translation keys with their values across all languages (flat structure for editor)
  app.get("/api/translations/flat/all", async (req, res) => {
    try {
      const allTranslations = await db.select().from(translations);
      
      // Group by key, then by language
      const byKey: Record<string, Record<string, string>> = {};
      
      for (const t of allTranslations) {
        if (!byKey[t.translationKey]) {
          byKey[t.translationKey] = {};
        }
        byKey[t.translationKey][t.language] = t.value;
      }
      
      res.json(byKey);
    } catch (error) {
      console.error("Get flat translations error:", error);
      res.status(500).json({ message: "Failed to get flat translations" });
    }
  });

  // Update a translation key
  app.put("/api/translations", async (req, res) => {
    try {
      const validated = updateTranslationSchema.parse(req.body);
      const { language, key, value } = validated;
      
      // Check if translation exists
      const existing = await db
        .select()
        .from(translations)
        .where(
          and(
            eq(translations.language, language),
            eq(translations.translationKey, key)
          )
        )
        .limit(1);
      
      if (existing.length > 0) {
        // Update existing
        await db
          .update(translations)
          .set({ value, updatedAt: new Date() })
          .where(
            and(
              eq(translations.language, language),
              eq(translations.translationKey, key)
            )
          );
      } else {
        // Insert new
        await db.insert(translations).values({
          language,
          translationKey: key,
          value,
          category: key.split('.')[0]
        });
      }
      
      console.log(`✅ Updated translation: ${language}.${key} = ${value}`);
      
      // Return updated translations for this language
      const updated = await db
        .select()
        .from(translations)
        .where(eq(translations.language, language));
      
      const flat: Record<string, string> = {};
      for (const t of updated) {
        flat[t.translationKey] = t.value;
      }
      
      res.json({ 
        success: true, 
        message: "Translation updated",
        translations: unflattenObject(flat)
      });
    } catch (error) {
      console.error("Update translation error:", error);
      res.status(500).json({ message: "Failed to update translation" });
    }
  });

  // Bulk update translations
  app.post("/api/translations/bulk", async (req, res) => {
    try {
      const { language, updates } = req.body;
      
      if (!['en', 'hy', 'ru'].includes(language)) {
        return res.status(400).json({ message: "Invalid language" });
      }
      
      // Apply all updates
      for (const [key, value] of Object.entries(updates) as [string, string][]) {
        const existing = await db
          .select()
          .from(translations)
          .where(
            and(
              eq(translations.language, language),
              eq(translations.translationKey, key)
            )
          )
          .limit(1);
        
        if (existing.length > 0) {
          await db
            .update(translations)
            .set({ value, updatedAt: new Date() })
            .where(
              and(
                eq(translations.language, language),
                eq(translations.translationKey, key)
              )
            );
        } else {
          await db.insert(translations).values({
            language,
            translationKey: key,
            value,
            category: key.split('.')[0]
          });
        }
      }
      
      console.log(`✅ Bulk updated ${Object.keys(updates).length} translations for ${language}`);
      
      // Return updated translations
      const updated = await db
        .select()
        .from(translations)
        .where(eq(translations.language, language));
      
      const flat: Record<string, string> = {};
      for (const t of updated) {
        flat[t.translationKey] = t.value;
      }
      
      res.json({ 
        success: true, 
        message: "Translations updated",
        translations: unflattenObject(flat)
      });
    } catch (error) {
      console.error("Bulk update translations error:", error);
      res.status(500).json({ message: "Failed to bulk update translations" });
    }
  });

  // Reset translations to defaults
  app.post("/api/translations/reset", async (req, res) => {
    try {
      // Delete all translations
      await db.delete(translations);
      
      // Reinitialize
      await initializeTranslations();
      
      console.log(`✅ Reset all translations to defaults`);
      
      // Return all translations
      const allTranslations = await db.select().from(translations);
      const grouped: Record<string, any> = { en: {}, hy: {}, ru: {} };
      
      for (const t of allTranslations) {
        if (!grouped[t.language]) grouped[t.language] = {};
        
        const keys = t.translationKey.split('.');
        let current = grouped[t.language];
        
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) current[keys[i]] = {};
          current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = t.value;
      }
      
      res.json({ 
        success: true, 
        message: "Translations reset to defaults",
        translations: grouped
      });
    } catch (error) {
      console.error("Reset translations error:", error);
      res.status(500).json({ message: "Failed to reset translations" });
    }
  });

  // Validate translation coverage (detect missing keys)
  app.get("/api/translations/validate", async (req, res) => {
    try {
      const allKeys = new Set<string>();
      const byLanguage: Record<string, Set<string>> = {
        en: new Set(),
        hy: new Set(),
        ru: new Set()
      };
      
      const allTranslations = await db.select().from(translations);
      
      for (const t of allTranslations) {
        allKeys.add(t.translationKey);
        byLanguage[t.language].add(t.translationKey);
      }
      
      // Find missing keys per language
      const missing: Record<string, string[]> = {};
      for (const [lang, keys] of Object.entries(byLanguage)) {
        missing[lang] = Array.from(allKeys).filter(key => !keys.has(key));
      }
      
      // Count empty values
      const empty: Record<string, number> = { en: 0, hy: 0, ru: 0 };
      for (const t of allTranslations) {
        if (!t.value || t.value.trim() === '') {
          empty[t.language]++;
        }
      }
      
      res.json({
        totalKeys: allKeys.size,
        byLanguage: Object.fromEntries(
          Object.entries(byLanguage).map(([lang, keys]) => [lang, keys.size])
        ),
        missing,
        empty,
        isComplete: Object.values(missing).every(arr => arr.length === 0) && 
                    Object.values(empty).every(count => count === 0)
      });
    } catch (error) {
      console.error("Validate translations error:", error);
      res.status(500).json({ message: "Failed to validate translations" });
    }
  });
}
