import { config } from 'dotenv';
import pg from 'pg';
config();
const { Pool } = pg;
const p = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const r = await p.query("SELECT id, name, slug FROM templates ORDER BY id LIMIT 30");
console.log(JSON.stringify(r.rows, null, 2));
await p.end();
