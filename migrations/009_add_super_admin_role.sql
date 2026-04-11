-- Migration: Add super_admin role support to user_admin_panels
-- This adds a role column that defaults to 'customer'.
-- Allowed values: 'customer' (default), 'super_admin'
ALTER TABLE user_admin_panels
  ADD COLUMN IF NOT EXISTS "role" text NOT NULL DEFAULT 'customer';
