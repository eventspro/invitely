import { type User, type InsertUser, type Rsvp, type InsertRsvp, users, rsvps, settings } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createRsvp(rsvp: InsertRsvp): Promise<Rsvp>;
  getAllRsvps(): Promise<Rsvp[]>;
  getRsvpByEmail(email: string): Promise<Rsvp | undefined>;
  getMaintenanceStatus(): Promise<boolean>;
  setMaintenanceStatus(enabled: boolean): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createRsvp(insertRsvp: InsertRsvp): Promise<Rsvp> {
    const [rsvp] = await db
      .insert(rsvps)
      .values({
        ...insertRsvp,
        guestNames: insertRsvp.guestNames || null,
      })
      .returning();
    return rsvp;
  }

  async getAllRsvps(): Promise<Rsvp[]> {
    return await db.select().from(rsvps).orderBy(desc(rsvps.createdAt));
  }

  async getRsvpByEmail(email: string): Promise<Rsvp | undefined> {
    const [rsvp] = await db.select().from(rsvps).where(eq(rsvps.email, email));
    return rsvp || undefined;
  }

  async getMaintenanceStatus(): Promise<boolean> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, 'maintenance_enabled'));
    return setting ? setting.value === 'true' : false;
  }

  async setMaintenanceStatus(enabled: boolean): Promise<void> {
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

export const storage = new DatabaseStorage();
