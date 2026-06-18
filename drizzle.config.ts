import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

// drizzle-kit push/generate requires a direct (non-pooled) Neon connection.
// Neon pooler (PgBouncer transaction mode) drops session-level SET commands,
// causing "relation does not exist" errors during DDL. Strip -pooler if present.
const directUrl = process.env.DIRECT_DATABASE_URL
  ?? process.env.DATABASE_URL.replace(/-pooler\./, ".");

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: directUrl,
  },
});
