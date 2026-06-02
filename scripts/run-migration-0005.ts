import "dotenv/config";
import { db } from "../server/db.js";
import { sql } from 'drizzle-orm';

try {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS cron_health (
      id                   VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      job_name             TEXT NOT NULL UNIQUE,
      last_run_at          TIMESTAMPTZ,
      last_success_at      TIMESTAMPTZ,
      last_error_at        TIMESTAMPTZ,
      last_error           TEXT,
      last_processed_count INTEGER NOT NULL DEFAULT 0,
      last_sent_count      INTEGER NOT NULL DEFAULT 0,
      last_failed_count    INTEGER NOT NULL DEFAULT 0,
      last_skipped_count   INTEGER NOT NULL DEFAULT 0,
      last_retrying_count  INTEGER NOT NULL DEFAULT 0,
      updated_at           TIMESTAMPTZ DEFAULT now()
    )
  `);
  console.log('OK: cron_health table created');
} catch (e: any) {
  console.error('ERROR:', e.message);
}
process.exit(0);
