import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "../shared/schema.js";

if (!process.env.DATABASE_URL) {
  // Log but do NOT throw — module-level throws crash ALL Vercel routes,
  // including public ones. DB-dependent routes will error individually.
  console.error('[db] CRITICAL: DATABASE_URL is not set. All database queries will fail. Check Vercel environment variables.');
}

console.log('🔗 Connecting to database with URL:', process.env.DATABASE_URL?.substring(0, 30) + '...');
console.log('🔧 Environment check - VERCEL:', process.env.VERCEL, 'NODE_ENV:', process.env.NODE_ENV);

// Detect if running on Vercel (multiple possible values)
const isVercel = !!process.env.VERCEL;
const isProduction = process.env.NODE_ENV === 'production';

console.log('🔧 Connection settings - isVercel:', isVercel, 'isProduction:', isProduction);

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@localhost/placeholder',
  ssl: isProduction || isVercel ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: isVercel ? 5000 : 10000,
  idleTimeoutMillis: isVercel ? 10000 : 30000,
  max: isVercel ? 1 : 10, // Serverless functions should use minimal connections
});
export const db = drizzle({ client: pool, schema });