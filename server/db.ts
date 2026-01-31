import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "../shared/schema.js";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log('🔗 Connecting to database with URL:', process.env.DATABASE_URL?.substring(0, 30) + '...');
console.log('🔧 Environment check - VERCEL:', process.env.VERCEL, 'NODE_ENV:', process.env.NODE_ENV);

// Detect if running on Vercel (multiple possible values)
const isVercel = !!process.env.VERCEL;
const isProduction = process.env.NODE_ENV === 'production';

console.log('🔧 Connection settings - isVercel:', isVercel, 'isProduction:', isProduction);

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction || isVercel ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: isVercel ? 5000 : 10000,
  idleTimeoutMillis: isVercel ? 10000 : 30000,
  max: isVercel ? 1 : 10, // Serverless functions should use minimal connections
});
export const db = drizzle({ client: pool, schema });