-- ============================================================
-- Migration 0007: customer_edits
--
-- Creates the customer_edits table used by the demo lead-capture
-- flow at /demo/david-rose-romantic.
--
-- This migration is idempotent (CREATE TABLE IF NOT EXISTS).
-- It is also bootstrapped automatically on server startup in
-- server/index.ts so it will self-heal in deployed environments.
--
-- Run manually if needed:
--   psql $DATABASE_URL -f server/migrations/0007_customer_edits.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS customer_edits (
  id                  VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  source_template_slug TEXT NOT NULL DEFAULT 'david-rose-romantic',
  groom_name          TEXT,
  bride_name          TEXT,
  wedding_date        TEXT,
  palette_id          TEXT,
  customer_email      TEXT,
  customer_phone      TEXT,
  customer_instagram  TEXT,
  hero_image_url      TEXT,
  gallery_image_urls  JSONB DEFAULT '[]'::jsonb,
  config              JSONB,
  status              TEXT NOT NULL DEFAULT 'demo',
  notes               TEXT,
  created_at          TIMESTAMP DEFAULT now(),
  updated_at          TIMESTAMP DEFAULT now()
);

-- Index for listing by newest first (used in platform-admin list view)
CREATE INDEX IF NOT EXISTS idx_customer_edits_created_at
  ON customer_edits (created_at DESC);
