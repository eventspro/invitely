import { type User, type InsertUser, type Rsvp, type InsertRsvp } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createRsvp(rsvp: InsertRsvp): Promise<Rsvp>;
  getAllRsvps(): Promise<Rsvp[]>;
  getRsvpByEmail(email: string): Promise<Rsvp | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private rsvps: Map<string, Rsvp>;

  constructor() {
    this.users = new Map();
    this.rsvps = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createRsvp(insertRsvp: InsertRsvp): Promise<Rsvp> {
    const id = randomUUID();
    const rsvp: Rsvp = { 
      ...insertRsvp, 
      id,
      guestNames: insertRsvp.guestNames || null,
      createdAt: new Date()
    };
    this.rsvps.set(id, rsvp);
    return rsvp;
  }

  async getAllRsvps(): Promise<Rsvp[]> {
    return Array.from(this.rsvps.values());
  }

  async getRsvpByEmail(email: string): Promise<Rsvp | undefined> {
    return Array.from(this.rsvps.values()).find(
      (rsvp) => rsvp.email === email,
    );
  }
}

export const storage = new MemStorage();
