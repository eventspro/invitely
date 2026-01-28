import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "../shared/schema.js";

// Don't check DATABASE_URL at import time for serverless compatibility
const getDatabaseUrl = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }
  return process.env.DATABASE_URL;
};

// Lazy initialization for serverless
let pool: Pool | null = null;
const getPool = () => {
  if (!pool) {
    const databaseUrl = getDatabaseUrl();
    console.log('🔗 Connecting to database with URL:', databaseUrl.substring(0, 30) + '...');
    pool = new Pool({ 
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      max: 10
    });
  }
  return pool;
};

export { getPool as pool };
export const db = drizzle({ client: getPool(), schema });