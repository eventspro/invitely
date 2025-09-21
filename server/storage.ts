import { 
  type User, 
  type InsertUser, 
  type Rsvp, 
  type InsertRsvp,
  type Template,
  type InsertTemplate,
  type UpdateTemplate,
  type Image,
  type LegacyUser,
  users, 
  managementUsers,
  rsvps, 
  settings,
  templates,
  images
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Template management
  getAllTemplates(): Promise<Template[]>;
  getTemplate(id: string): Promise<Template | undefined>;
  getTemplateBySlug(slug: string): Promise<Template | undefined>;
  createTemplate(template: InsertTemplate): Promise<Template>;
  updateTemplate(id: string, updates: UpdateTemplate): Promise<Template | undefined>;
  deleteTemplate(id: string): Promise<boolean>;
  
  // RSVP management (template-scoped)
  createRsvp(rsvp: InsertRsvp): Promise<Rsvp>;
  getAllRsvps(templateId?: string): Promise<Rsvp[]>;
  getRsvpByEmail(email: string, templateId: string): Promise<Rsvp | undefined>;
  
  // Image management
  createImage(image: {
    templateId: string;
    url: string;
    name: string;
    category?: string;
    size?: string;
    mimeType?: string;
    order?: string;
  }): Promise<Image>;
  getImages(templateId: string, category?: string): Promise<Image[]>;
  deleteImage(id: string): Promise<boolean>;
  
  // Settings (template-scoped)
  getMaintenanceStatus(templateId?: string): Promise<boolean>;
  setMaintenanceStatus(enabled: boolean, templateId?: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User management
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(managementUsers).where(eq(managementUsers.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(managementUsers).where(eq(managementUsers.email, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(managementUsers)
      .values(insertUser as any)
      .returning();
    return user;
  }

  // Template management
  async getAllTemplates(): Promise<Template[]> {
    return await db.select().from(templates).orderBy(desc(templates.createdAt));
  }

  async getTemplate(id: string): Promise<Template | undefined> {
    const [template] = await db.select().from(templates).where(eq(templates.id, id));
    return template || undefined;
  }

  async getTemplateBySlug(slug: string): Promise<Template | undefined> {
    const [template] = await db.select().from(templates).where(eq(templates.slug, slug));
    return template || undefined;
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const [template] = await db
      .insert(templates)
      .values(insertTemplate as any)
      .returning();
    return template;
  }

  async updateTemplate(id: string, updates: UpdateTemplate): Promise<Template | undefined> {
    const [template] = await db
      .update(templates)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(templates.id, id))
      .returning();
    return template || undefined;
  }

  async deleteTemplate(id: string): Promise<boolean> {
    const result = await db.delete(templates).where(eq(templates.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // RSVP management (template-scoped)
  async createRsvp(insertRsvp: InsertRsvp): Promise<Rsvp> {
    const [rsvp] = await db
      .insert(rsvps)
      .values(insertRsvp as any)
      .returning();
    return rsvp;
  }

  async getAllRsvps(templateId?: string): Promise<Rsvp[]> {
    if (templateId) {
      return await db
        .select()
        .from(rsvps)
        .where(eq(rsvps.templateId, templateId))
        .orderBy(desc(rsvps.createdAt));
    }
    return await db.select().from(rsvps).orderBy(desc(rsvps.createdAt));
  }

  async getRsvpByEmail(email: string, templateId: string): Promise<Rsvp | undefined> {
    const [rsvp] = await db
      .select()
      .from(rsvps)
      .where(and(eq(rsvps.email, email), eq(rsvps.templateId, templateId)));
    return rsvp || undefined;
  }

  // Image management
  async createImage(imageData: {
    templateId: string;
    url: string;
    name: string;
    category?: string;
    size?: string;
    mimeType?: string;
    order?: string;
  }): Promise<Image> {
    const [image] = await db
      .insert(images)
      .values({
        templateId: imageData.templateId,
        url: imageData.url,
        name: imageData.name,
        category: imageData.category || 'gallery',
        size: imageData.size,
        mimeType: imageData.mimeType,
        order: imageData.order || '0',
      })
      .returning();
    return image;
  }

  async getImages(templateId: string, category?: string): Promise<Image[]> {
    const conditions = category 
      ? and(eq(images.templateId, templateId), eq(images.category, category))
      : eq(images.templateId, templateId);
      
    return await db
      .select()
      .from(images)
      .where(conditions)
      .orderBy(images.order, images.createdAt);
  }

  async deleteImage(id: string): Promise<boolean> {
    const result = await db.delete(images).where(eq(images.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Settings (template-scoped)
  async getMaintenanceStatus(templateId?: string): Promise<boolean> {
    try {
      if (templateId) {
        // Check template-specific maintenance
        const template = await this.getTemplate(templateId);
        return template?.maintenance || false;
      }
      
      // Global maintenance check (legacy) - simplified to always return false
      return false;
    } catch (error) {
      console.warn('Maintenance status check failed, defaulting to false:', error);
      return false;
    }
  }

  async setMaintenanceStatus(enabled: boolean, templateId?: string): Promise<void> {
    if (templateId) {
      // Set template-specific maintenance
      await this.updateTemplate(templateId, { maintenance: enabled });
    } else {
      // Global maintenance (legacy)
      await db
        .insert(settings)
        .values({
          key: 'maintenance_enabled',
          value: enabled.toString(),
        })
        .onConflictDoUpdate({
          target: settings.key,
          set: {
            value: enabled.toString(),
            updatedAt: new Date(),
          },
        });
    }
  }
}

export const storage = new DatabaseStorage();
