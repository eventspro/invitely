-- Migration: Create templates table and add template_id to existing tables
-- Date: 2025-09-11
-- Description: Transform single-template site into multi-template platform

-- Create templates table
CREATE TABLE templates (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- e.g. "Pro - Harut & Tatev"
  slug TEXT UNIQUE NOT NULL, -- e.g. "harut-tatev-2025" (URL-friendly)
  template_key TEXT NOT NULL, -- which base template: "pro", "elegant", etc.
  owner_email TEXT, -- optional: customer email
  config JSONB NOT NULL, -- full weddingConfig object
  maintenance BOOLEAN DEFAULT false,
  maintenance_password TEXT, -- hashed password for template-specific bypass
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add template_id to existing tables
ALTER TABLE rsvps ADD COLUMN template_id VARCHAR REFERENCES templates(id) ON DELETE CASCADE;
ALTER TABLE settings ADD COLUMN template_id VARCHAR REFERENCES templates(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX idx_templates_slug ON templates(slug);
CREATE INDEX idx_templates_template_key ON templates(template_key);
CREATE INDEX idx_rsvps_template_id ON rsvps(template_id);
CREATE INDEX idx_settings_template_id ON settings(template_id);

-- Insert default template (migrate existing data)
INSERT INTO templates (
  id,
  name,
  slug,
  template_key,
  config,
  maintenance
) VALUES (
  'default-harut-tatev',
  'Pro - Harut & Tatev',
  'harut-tatev-2025',
  'pro',
  '{}', -- Will be populated by migration script
  false
);

-- Update existing RSVPs to belong to default template
UPDATE rsvps SET template_id = 'default-harut-tatev' WHERE template_id IS NULL;
UPDATE settings SET template_id = 'default-harut-tatev' WHERE template_id IS NULL;

-- Make template_id required after migration
ALTER TABLE rsvps ALTER COLUMN template_id SET NOT NULL;
