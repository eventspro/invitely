import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, jsonb, decimal, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Legacy users table for backwards compatibility
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// New user management system table
export const managementUsers = pgTable("management_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  status: text("status").default("active"), // active, suspended, deleted
  emailVerified: boolean("email_verified").default(false),
  emailVerificationToken: text("email_verification_token"),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

// Orders table for tracking template purchases
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull().unique(),
  userId: varchar("user_id").references(() => managementUsers.id, { onDelete: "set null" }),
  templateId: varchar("template_id").references(() => templates.id, { onDelete: "cascade" }),
  templatePlan: text("template_plan").notNull(), // basic, standard, premium, deluxe, ultimate
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("AMD"),
  status: text("status").default("pending"), // pending, completed, cancelled, refunded
  paymentMethod: text("payment_method"),
  paymentIntentId: text("payment_intent_id"),
  adminAccessGranted: boolean("admin_access_granted").default(false),
  customerDetails: jsonb("customer_details"), // name, email, phone, address
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

// User admin panels for Ultimate template customers
export const userAdminPanels = pgTable("user_admin_panels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => managementUsers.id, { onDelete: "cascade" }),
  templateId: varchar("template_id").notNull().references(() => templates.id, { onDelete: "cascade" }),
  templateSlug: text("template_slug").notNull().unique(), // URL slug for customer access
  orderId: varchar("order_id").references(() => orders.id, { onDelete: "cascade" }),
  isActive: boolean("is_active").default(true),
  googleDriveFolderId: text("google_drive_folder_id"),
  settings: jsonb("settings"), // custom admin panel settings
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

// Guest photos uploaded by wedding attendees
export const guestPhotos = pgTable("guest_photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull().references(() => templates.id, { onDelete: "cascade" }),
  uploaderName: text("uploader_name").notNull(),
  uploaderEmail: text("uploader_email"),
  photoUrl: text("photo_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  isApproved: boolean("is_approved").default(false),
  isFeatured: boolean("is_featured").default(false),
  uploadedAt: timestamp("uploaded_at").default(sql`now()`),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

// Google Drive integrations for sharing photos with special guests
export const googleDriveIntegrations = pgTable("google_drive_integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userAdminPanelId: varchar("user_admin_panel_id").notNull().references(() => userAdminPanels.id, { onDelete: "cascade" }),
  folderId: text("folder_id").notNull(),
  folderName: text("folder_name").notNull(),
  folderUrl: text("folder_url").notNull(),
  accessType: text("access_type").default("view"), // view, edit, comment
  specialGuestEmails: jsonb("special_guest_emails"), // array of emails with special access
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

// Activity logs for admin panel actions
export const activityLogs = pgTable("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => managementUsers.id, { onDelete: "cascade" }),
  templateId: varchar("template_id").references(() => templates.id, { onDelete: "cascade" }),
  action: text("action").notNull(), // login, approve_photo, export_rsvps, configure_drive, etc.
  entityType: text("entity_type"), // rsvp, photo, guest_photo, google_drive, etc.
  entityId: varchar("entity_id"),
  details: jsonb("details"), // additional context about the action
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Translations table for multi-language support (key-value approach for production)
export const translations = pgTable("translations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  language: text("language").notNull(), // e.g., 'hy' for Armenian, 'en' for English
  translationKey: text("translation_key").notNull(), // Dot-notation key like 'hero.title'
  value: text("value").notNull(), // The translated text
  category: text("category"), // Section like 'hero', 'pricing', etc.
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

// Production translation system tables (granular key-value approach)
export const translationKeys = pgTable("translation_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(), // e.g., 'hero.title', 'pricing.basic.name'
  section: text("section"), // e.g., 'hero', 'pricing', 'faq'
  description: text("description"), // Human-readable description
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const translationValues = pgTable("translation_values", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  keyId: varchar("key_id").notNull().references(() => translationKeys.id, { onDelete: "cascade" }),
  language: text("language").notNull(), // 'hy', 'en', etc.
  value: text("value").notNull(), // The translated text
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

// Pricing plans table
export const pricingPlans = pgTable("pricing_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // 'basic', 'essential', 'professional', etc.
  displayName: text("display_name").notNull(), // Human-readable name
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("AMD"),
  badge: text("badge"), // 'Most Popular', 'Best Value', etc.
  description: text("description"),
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

// Plan features table
export const planFeatures = pgTable("plan_features", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(), // 'rsvpFunctionality', 'photoGallery', etc.
  displayName: text("display_name").notNull(),
  description: text("description"),
  category: text("category"), // 'core', 'media', 'admin', etc.
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

// Association table: which features belong to which plans
export const planFeatureAssociations = pgTable("plan_feature_associations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  planId: varchar("plan_id").references(() => pricingPlans.id, { onDelete: "cascade" }),
  featureId: varchar("feature_id").references(() => planFeatures.id, { onDelete: "cascade" }),
  isIncluded: boolean("is_included").default(true),
  value: text("value"), // For features with specific values (e.g., "50 cards", "100 cards")
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Platform settings table
export const platformSettings = pgTable("platform_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(), // 'maintenance_mode', 'default_language', etc.
  value: jsonb("value").notNull(), // Flexible JSON value
  description: text("description"),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const templates = pgTable("templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  templateKey: text("template_key").notNull(),
  ownerEmail: text("owner_email"),
  config: jsonb("config").notNull(),
  maintenance: boolean("maintenance").default(false),
  maintenancePassword: text("maintenance_password"),
  sourceTemplateId: varchar("source_template_id"),
  isMain: boolean("is_main").default(false),
  templateVersion: integer("template_version").default(1), // Version for template configs
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const rsvps = pgTable("rsvps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull().references(() => templates.id, { onDelete: "cascade" }),
  name: text("name"), // Combined name field for compatibility
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  guestEmail: text("guest_email").notNull(), // Updated to match migration
  guestPhone: text("guest_phone"),
  attending: boolean("attending"), // Updated to boolean for proper filtering
  guests: integer("guests").default(1), // Number of guests
  dietaryRestrictions: text("dietary_restrictions"),
  plusOneName: text("plus_one_name"),
  specialRequests: text("special_requests"),
  submittedAt: timestamp("submitted_at").default(sql`now()`), // Updated field name
  // Legacy fields for backwards compatibility
  email: text("email").notNull(),
  guestCount: text("guest_count").notNull(),
  guestNames: text("guest_names"),
  attendance: text("attendance").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  templateId: varchar("template_id").references(() => templates.id, { onDelete: "cascade" }),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const images = pgTable("images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull().references(() => templates.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  name: text("name").notNull(),
  category: text("category").default("gallery"), // gallery, hero, background, etc.
  size: text("size"), // file size in bytes as string
  mimeType: text("mime_type"),
  order: text("order").default("0"), // for ordering images
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const insertUserSchema = createInsertSchema(managementUsers).pick({
  email: true,
  passwordHash: true,
  firstName: true,
  lastName: true,
  phone: true,
}).extend({
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export const insertLegacyUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  templatePlan: z.enum(["basic", "standard", "premium", "deluxe", "ultimate"]),
  amount: z.string().transform(val => parseFloat(val)),
  currency: z.string().default("AMD"),
});

export const insertUserAdminPanelSchema = createInsertSchema(userAdminPanels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGuestPhotoSchema = createInsertSchema(guestPhotos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  uploaderName: z.string().min(1, "Uploader name is required"),
  photoUrl: z.string().url("Valid photo URL is required"),
});

export const insertGoogleDriveIntegrationSchema = createInsertSchema(googleDriveIntegrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  folderName: z.string().min(1, "Folder name is required"),
  accessType: z.enum(["view", "edit", "comment"]).default("view"),
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});

export const insertTemplateSchema = createInsertSchema(templates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1, "Template name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be URL-friendly"),
  templateKey: z.string().min(1, "Template key is required"),
  ownerEmail: z.string().email().optional(),
  config: z.record(z.any()), // Wedding config object
  maintenance: z.boolean().optional(),
  maintenancePassword: z.string().optional(),
});

export const updateTemplateSchema = createInsertSchema(templates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export const insertRsvpSchema = createInsertSchema(rsvps).omit({
  id: true,
  createdAt: true,
  submittedAt: true,
}).extend({
  templateId: z.string().min(1, "Template ID is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  guestEmail: z.string().email("Email address is invalid").or(z.literal("")).optional(),
  guests: z.number().min(1, "Number of guests is required").optional(),
  attending: z.boolean().nullable().optional(),
  // Legacy compatibility fields - required for backward compatibility
  email: z.string().email("Email address is invalid"),
  guestCount: z.string().min(1, "Number of guests is required"),
  guestNames: z.string().optional(),
  attendance: z.enum(["attending", "not-attending"], {
    errorMap: () => ({ message: "Please select attendance status" })
  }),
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof managementUsers.$inferSelect;
export type LegacyUser = typeof users.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type UserAdminPanel = typeof userAdminPanels.$inferSelect;
export type InsertUserAdminPanel = z.infer<typeof insertUserAdminPanelSchema>;
export type GuestPhoto = typeof guestPhotos.$inferSelect;
export type Translation = typeof translations.$inferSelect;
export type InsertGuestPhoto = z.infer<typeof insertGuestPhotoSchema>;
export type GoogleDriveIntegration = typeof googleDriveIntegrations.$inferSelect;
export type InsertGoogleDriveIntegration = z.infer<typeof insertGoogleDriveIntegrationSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type Template = typeof templates.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type UpdateTemplate = z.infer<typeof updateTemplateSchema>;
export type InsertRsvp = z.infer<typeof insertRsvpSchema>;
export type Rsvp = typeof rsvps.$inferSelect;
export type Image = typeof images.$inferSelect;
