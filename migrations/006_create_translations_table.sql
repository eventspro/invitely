-- Migration: Create translations table
-- Date: 2026-01-31

CREATE TABLE IF NOT EXISTS translations (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  language TEXT NOT NULL,
  translation_key TEXT NOT NULL,
  value TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_translations_language ON translations(language);
CREATE INDEX IF NOT EXISTS idx_translations_key ON translations(translation_key);
CREATE INDEX IF NOT EXISTS idx_translations_language_key ON translations(language, translation_key);
