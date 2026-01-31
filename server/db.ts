import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "../shared/schema.js";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log('🔗 Connecting to database with URL:', process.env.DATABASE_URL?.substring(0, 30) + '...');

// Detect if running on Vercel
const isVercel = process.env.VERCEL === '1';

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' || isVercel ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: isVercel ? 5000 : 10000,
  idleTimeoutMillis: isVercel ? 10000 : 30000,
  max: isVercel ? 1 : 10, // Serverless functions should use minimal connections
});
export const db = drizzle({ client: pool, schema });