-- Add template_slug field to user_admin_panels table for customer-specific URLs
ALTER TABLE user_admin_panels 
ADD COLUMN template_slug TEXT NOT NULL DEFAULT '';

-- Add unique constraint on template_slug
ALTER TABLE user_admin_panels 
ADD CONSTRAINT user_admin_panels_template_slug_unique UNIQUE (template_slug);

-- Remove the default value constraint after adding the column
ALTER TABLE user_admin_panels 
ALTER COLUMN template_slug DROP DEFAULT;