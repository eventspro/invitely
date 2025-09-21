-- User Management System Migration
-- Date: 2025-09-20
-- Description: Add user management for Ultimate template customers with admin panels

-- Create management_users table  
CREATE TABLE IF NOT EXISTS "management_users" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" text UNIQUE NOT NULL,
  "password_hash" text NOT NULL,
  "first_name" text,
  "last_name" text,
  "phone" text,
  "status" text DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  "email_verified" boolean DEFAULT false,
  "email_verification_token" text,
  "password_reset_token" text,
  "password_reset_expires" timestamp,
  "last_login" timestamp,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Create user sessions table
CREATE TABLE IF NOT EXISTS "user_sessions" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar NOT NULL REFERENCES management_users(id) ON DELETE CASCADE,
  "token" text UNIQUE NOT NULL,
  "expires_at" timestamp NOT NULL,
  "ip_address" text,
  "user_agent" text,
  "created_at" timestamp DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS "orders" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar NOT NULL REFERENCES management_users(id) ON DELETE CASCADE,
  "template_id" varchar REFERENCES templates(id) ON DELETE SET NULL,
  "order_number" text UNIQUE NOT NULL,
  "template_plan" text NOT NULL CHECK (template_plan IN ('basic', 'essential', 'professional', 'premium', 'ultimate')),
  "amount" integer NOT NULL, -- amount in smallest currency unit (e.g., cents)
  "currency" text DEFAULT 'AMD',
  "status" text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'refunded')),
  "payment_method" text,
  "payment_transaction_id" text,
  "billing_email" text,
  "billing_name" text,
  "billing_address" jsonb,
  "wedding_date" date,
  "wedding_venue" text,
  "special_requests" text,
  "admin_access_granted" boolean DEFAULT false,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Create user_admin_panels table for Ultimate template customers
CREATE TABLE IF NOT EXISTS "user_admin_panels" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar NOT NULL REFERENCES management_users(id) ON DELETE CASCADE,
  "template_id" varchar NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  "order_id" varchar NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  "panel_settings" jsonb DEFAULT '{}',
  "google_drive_folder_id" text,
  "google_drive_credentials" text, -- encrypted
  "rsvp_export_settings" jsonb DEFAULT '{}',
  "photo_management_settings" jsonb DEFAULT '{}',
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  UNIQUE(user_id, template_id)
);

-- Enhance RSVP table for better management
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS "guest_email" text;
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS "guest_phone" text;
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS "dietary_restrictions" text;
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS "plus_one_name" text;
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS "special_requests" text;
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS "rsvp_code" text UNIQUE;
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS "submitted_at" timestamp DEFAULT now();
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now();

-- Create guest_photos table for photo uploads by guests
CREATE TABLE IF NOT EXISTS "guest_photos" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "template_id" varchar NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  "rsvp_id" varchar REFERENCES rsvps(id) ON DELETE SET NULL,
  "uploader_name" text NOT NULL,
  "uploader_email" text,
  "photo_url" text NOT NULL,
  "original_filename" text,
  "file_size" integer,
  "mime_type" text,
  "description" text,
  "is_approved" boolean DEFAULT false,
  "is_featured" boolean DEFAULT false,
  "google_drive_file_id" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Create google_drive_integrations table
CREATE TABLE IF NOT EXISTS "google_drive_integrations" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_admin_panel_id" varchar NOT NULL REFERENCES user_admin_panels(id) ON DELETE CASCADE,
  "folder_id" text NOT NULL,
  "folder_name" text NOT NULL,
  "folder_url" text NOT NULL,
  "access_type" text DEFAULT 'view' CHECK (access_type IN ('view', 'download', 'upload')),
  "special_guests_only" boolean DEFAULT false,
  "special_guest_emails" jsonb DEFAULT '[]',
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Create activity_logs for admin panel actions
CREATE TABLE IF NOT EXISTS "activity_logs" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar NOT NULL REFERENCES management_users(id) ON DELETE CASCADE,
  "template_id" varchar REFERENCES templates(id) ON DELETE CASCADE,
  "action" text NOT NULL,
  "entity_type" text NOT NULL,
  "entity_id" text,
  "details" jsonb DEFAULT '{}',
  "ip_address" text,
  "user_agent" text,
  "created_at" timestamp DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "idx_management_users_email" ON "management_users"("email");
CREATE INDEX IF NOT EXISTS "idx_management_users_status" ON "management_users"("status");
CREATE INDEX IF NOT EXISTS "idx_user_sessions_user_id" ON "user_sessions"("user_id");
CREATE INDEX IF NOT EXISTS "idx_user_sessions_token" ON "user_sessions"("token");
CREATE INDEX IF NOT EXISTS "idx_user_sessions_expires_at" ON "user_sessions"("expires_at");
CREATE INDEX IF NOT EXISTS "idx_orders_user_id" ON "orders"("user_id");
CREATE INDEX IF NOT EXISTS "idx_orders_status" ON "orders"("status");
CREATE INDEX IF NOT EXISTS "idx_orders_template_plan" ON "orders"("template_plan");
CREATE INDEX IF NOT EXISTS "idx_user_admin_panels_user_id" ON "user_admin_panels"("user_id");
CREATE INDEX IF NOT EXISTS "idx_user_admin_panels_template_id" ON "user_admin_panels"("template_id");
CREATE INDEX IF NOT EXISTS "idx_guest_photos_template_id" ON "guest_photos"("template_id");
CREATE INDEX IF NOT EXISTS "idx_guest_photos_is_approved" ON "guest_photos"("is_approved");
CREATE INDEX IF NOT EXISTS "idx_rsvps_guest_email" ON "rsvps"("guest_email");
CREATE INDEX IF NOT EXISTS "idx_rsvps_rsvp_code" ON "rsvps"("rsvp_code");
CREATE INDEX IF NOT EXISTS "idx_activity_logs_user_id" ON "activity_logs"("user_id");
CREATE INDEX IF NOT EXISTS "idx_activity_logs_template_id" ON "activity_logs"("template_id");
CREATE INDEX IF NOT EXISTS "idx_activity_logs_created_at" ON "activity_logs"("created_at");

-- Update templates table to support user ownership
ALTER TABLE templates ADD COLUMN IF NOT EXISTS "user_id" varchar REFERENCES management_users(id) ON DELETE SET NULL;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS "order_id" varchar REFERENCES orders(id) ON DELETE SET NULL;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS "template_plan" text;
CREATE INDEX IF NOT EXISTS "idx_templates_user_id" ON "templates"("user_id");
CREATE INDEX IF NOT EXISTS "idx_templates_template_plan" ON "templates"("template_plan");
