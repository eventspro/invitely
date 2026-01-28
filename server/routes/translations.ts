import { Router } from 'express';
import { db } from '../db.js';
import { translations, insertTranslationSchema, updateTranslationSchema } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';
import { authenticateUser } from '../middleware/auth.js';

export const translationsRouter = Router();

// Get all translations
translationsRouter.get('/', async (_req, res) => {
  try {
    const allTranslations = await db.select().from(translations);
    res.json(allTranslations);
  } catch (error) {
    console.error('Error fetching translations:', error);
    res.status(500).json({ message: 'Failed to fetch translations' });
  }
});

// Get translation by language
translationsRouter.get('/:language', async (req, res) => {
  try {
    const { language } = req.params;
    const translation = await db
      .select()
      .from(translations)
      .where(eq(translations.language, language))
      .limit(1);

    if (!translation.length) {
      return res.status(404).json({ message: `Translation for language '${language}' not found` });
    }

    res.json(translation[0]);
  } catch (error) {
    console.error('Error fetching translation:', error);
    res.status(500).json({ message: 'Failed to fetch translation' });
  }
});

// Create new translation (authenticated - platform admin only)
translationsRouter.post('/', authenticateUser, async (req, res) => {
  try {
    const validatedData = insertTranslationSchema.parse(req.body);

    const newTranslation = await db.insert(translations).values({
      language: validatedData.language,
      config: validatedData.config,
      isActive: validatedData.isActive ?? true,
      version: validatedData.version ?? 1,
    }).returning();

    res.status(201).json(newTranslation[0]);
  } catch (error: any) {
    console.error('Error creating translation:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Invalid translation data', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to create translation' });
  }
});

// Update translation by language (authenticated - platform admin only)
translationsRouter.patch('/:language', authenticateUser, async (req, res) => {
  try {
    const { language } = req.params;
    const validatedData = updateTranslationSchema.parse(req.body);

    const updatedTranslation = await db
      .update(translations)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(translations.language, language))
      .returning();

    if (!updatedTranslation.length) {
      return res.status(404).json({ message: `Translation for language '${language}' not found` });
    }

    res.json(updatedTranslation[0]);
  } catch (error: any) {
    console.error('Error updating translation:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Invalid translation data', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to update translation' });
  }
});

// Delete translation by language (authenticated - platform admin only)
translationsRouter.delete('/:language', authenticateUser, async (req, res) => {
  try {
    const { language } = req.params;

    const deletedTranslation = await db
      .delete(translations)
      .where(eq(translations.language, language))
      .returning();

    if (!deletedTranslation.length) {
      return res.status(404).json({ message: `Translation for language '${language}' not found` });
    }

    res.json({ message: `Translation for language '${language}' deleted successfully` });
  } catch (error) {
    console.error('Error deleting translation:', error);
    res.status(500).json({ message: 'Failed to delete translation' });
  }
});

export function registerTranslationsRoutes(app: Router) {
  app.use('/api/translations', translationsRouter);
}
