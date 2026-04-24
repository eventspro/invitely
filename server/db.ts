import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "../shared/schema.js";

if (!process.env.DATABASE_URL) {
  // Log but do NOT throw — module-level throws crash ALL Vercel routes,
  // including public ones. DB-dependent routes will error individually.
  console.error('[db] CRITICAL: DATABASE_URL is not set. All database queries will fail. Check Vercel environment variables.');
}

// ─── Dev vs Production DB guard ───────────────────────────────────────────────
// If running locally (not on Vercel) and DATABASE_URL points to the production
// Neon instance, emit a loud warning so developers know writes affect prod.
const isVercel = !!process.env.VERCEL;
const isProduction = process.env.NODE_ENV === 'production';
const dbUrl = process.env.DATABASE_URL ?? '';

if (!isVercel && !isProduction) {
  const isProdDb =
    dbUrl.includes('neon.tech') &&
    !dbUrl.includes('localhost') &&
    !dbUrl.includes('127.0.0.1');

  if (isProdDb) {
    const devDbUrl = process.env.DEV_DATABASE_URL;
    if (devDbUrl) {
      // Silently prefer DEV_DATABASE_URL when running locally
      process.env.DATABASE_URL = devDbUrl;
      console.warn('⚠️  [db] LOCAL DEV: Using DEV_DATABASE_URL to avoid writing to production database.');
    } else {
      console.warn('');
      console.warn('╔══════════════════════════════════════════════════════════════════╗');
      console.warn('║  ⚠️  WARNING: localhost is connected to the PRODUCTION database! ║');
      console.warn('║                                                                  ║');
      console.warn('║  Any changes (uploads, config saves, RSVPs) will affect the      ║');
      console.warn('║  live website at 4ever.am immediately.                           ║');
      console.warn('║                                                                  ║');
      console.warn('║  To use a dev database, add to .env:                             ║');
      console.warn('║    DEV_DATABASE_URL=<your-neon-branch-connection-string>         ║');
      console.warn('║                                                                  ║');
      console.warn('║  Create a Neon branch at: https://console.neon.tech              ║');
      console.warn('╚══════════════════════════════════════════════════════════════════╝');
      console.warn('');
    }
  }
}
// ──────────────────────────────────────────────────────────────────────────────

console.log('🔗 Connecting to database with URL:', process.env.DATABASE_URL?.substring(0, 30) + '...');
console.log('🔧 Environment check - VERCEL:', process.env.VERCEL, 'NODE_ENV:', process.env.NODE_ENV);

console.log('🔧 Connection settings - isVercel:', isVercel, 'isProduction:', isProduction);

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@localhost/placeholder',
  ssl: isProduction || isVercel ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: isVercel ? 5000 : 10000,
  idleTimeoutMillis: isVercel ? 10000 : 30000,
  max: isVercel ? 1 : 10, // Serverless functions should use minimal connections
});
export const db = drizzle({ client: pool, schema });