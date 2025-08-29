import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const rsvps = pgTable("rsvps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  guestCount: text("guest_count").notNull(),
  guestNames: text("guest_names"),
  attendance: text("attendance").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertRsvpSchema = createInsertSchema(rsvps).omit({
  id: true,
  createdAt: true,
}).extend({
  firstName: z.string().min(1, "Անունը պարտադիր է"),
  lastName: z.string().min(1, "Ազգանունը պարտադիր է"),
  email: z.string().email("Էլ․ հասցեն ճիշտ չէ"),
  guestCount: z.string().min(1, "Հյուրերի քանակը պարտադիր է"),
  guestNames: z.string().optional(),
  attendance: z.enum(["attending", "not-attending"], {
    errorMap: () => ({ message: "Խնդրում ենք ընտրել մասնակցության տարբերակը" })
  }),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertRsvp = z.infer<typeof insertRsvpSchema>;
export type Rsvp = typeof rsvps.$inferSelect;
