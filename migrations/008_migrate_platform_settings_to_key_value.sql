-- Migrate platform_settings from specific columns to key-value structure
-- Step 1: Add new columns
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS key TEXT;
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS value JSONB;
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

-- Step 2: Migrate existing data from old columns to new key-value format
-- Note: This assumes there's only one row in platform_settings (common pattern)

-- Migrate maintenance_mode
UPDATE platform_settings 
SET key = 'maintenance_mode', 
    value = to_jsonb(maintenance_mode),
    description = 'Enable/disable maintenance mode for the platform',
    created_at = COALESCE(updated_at, NOW())
WHERE maintenance_mode IS NOT NULL AND key IS NULL;

-- For other settings, we need to insert new rows since key must be unique
-- Insert maintenance_password if it exists
INSERT INTO platform_settings (id, key, value, description, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'maintenance_password',
  to_jsonb(maintenance_password),
  'Password required to access the site during maintenance mode',
  COALESCE(updated_at, NOW()),
  updated_at
FROM platform_settings 
WHERE maintenance_password IS NOT NULL AND maintenance_password != ''
  AND NOT EXISTS (SELECT 1 FROM platform_settings WHERE key = 'maintenance_password')
LIMIT 1;

-- Insert coming_soon_title if it exists
INSERT INTO platform_settings (id, key, value, description, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'coming_soon_title',
  to_jsonb(coming_soon_title),
  'Title for coming soon page',
  COALESCE(updated_at, NOW()),
  updated_at
FROM platform_settings 
WHERE coming_soon_title IS NOT NULL AND coming_soon_title != ''
  AND NOT EXISTS (SELECT 1 FROM platform_settings WHERE key = 'coming_soon_title')
LIMIT 1;

-- Insert coming_soon_message if it exists
INSERT INTO platform_settings (id, key, value, description, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'coming_soon_message',
  to_jsonb(coming_soon_message),
  'Message for coming soon page',
  COALESCE(updated_at, NOW()),
  updated_at
FROM platform_settings 
WHERE coming_soon_message IS NOT NULL AND coming_soon_message != ''
  AND NOT EXISTS (SELECT 1 FROM platform_settings WHERE key = 'coming_soon_message')
LIMIT 1;

-- Step 3: Drop old columns
ALTER TABLE platform_settings DROP COLUMN IF EXISTS maintenance_mode;
ALTER TABLE platform_settings DROP COLUMN IF EXISTS maintenance_password;
ALTER TABLE platform_settings DROP COLUMN IF EXISTS coming_soon_title;
ALTER TABLE platform_settings DROP COLUMN IF EXISTS coming_soon_message;

-- Step 4: Make key required and unique
ALTER TABLE platform_settings ALTER COLUMN key SET NOT NULL;
ALTER TABLE platform_settings ADD CONSTRAINT platform_settings_key_unique UNIQUE (key);

-- Step 5: Make value required
ALTER TABLE platform_settings ALTER COLUMN value SET NOT NULL;
