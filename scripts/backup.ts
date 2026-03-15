#!/usr/bin/env tsx
/**
 * Production-grade database backup script
 *
 * Usage:
 *   tsx scripts/backup.ts                     # Run full backup
 *   tsx scripts/backup.ts --dry-run           # Show what would happen, no writes
 *   tsx scripts/backup.ts --table=templates   # Backup specific table only
 *
 * Output: backups/database/backup-YYYY-MM-DD-HH.sql.gz
 * Offsite: uploads to Cloudflare R2 if env vars are present
 * Retention: 14 daily + 8 weekly backups kept, older deleted automatically
 * Logs: logs/backup.log
 */

import 'dotenv/config';
import { createWriteStream, mkdirSync, readdirSync, statSync, unlinkSync, existsSync } from 'fs';
import { writeFile, appendFile, mkdir } from 'fs/promises';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { runSchemaBackup } from './backup-schema.ts';

const { Pool } = pg;
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ─── Configuration ───────────────────────────────────────────────────────────

const BACKUP_DIR = path.join(ROOT, 'backups', 'database');
const LOG_FILE   = path.join(ROOT, 'logs', 'backup.log');

const DRY_RUN      = process.argv.includes('--dry-run');
const TABLE_ARG    = process.argv.find(a => a.startsWith('--table='))?.split('=')[1];
const SKIP_OFFSITE = process.argv.includes('--skip-offsite');

// Tables to back up, in dependency order (parents before children)
const TABLES_TO_BACKUP = [
  'management_users',
  'users',
  'pricing_plans',
  'plan_features',
  'plan_feature_associations',
  'configurable_pricing_plans',
  'configurable_plan_features',
  'platform_settings',
  'templates',
  'orders',
  'user_admin_panels',
  'rsvps',
  'guest_photos',
  'images',
  'settings',
  'translation_keys',
  'translation_values',
  'translations',
  'google_drive_integrations',
  'activity_logs',
];

// Retention policy
const DAILY_RETENTION  = 14; // Keep 14 daily backups
const WEEKLY_RETENTION = 8;  // Keep 8 weekly backups

// ─── Logging ─────────────────────────────────────────────────────────────────

async function ensureLogDir() {
  await mkdir(path.dirname(LOG_FILE), { recursive: true });
}

async function log(msg: string, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO') {
  const line = `[${new Date().toISOString()}] [${level}] ${msg}`;
  console.log(line);
  try {
    await appendFile(LOG_FILE, line + '\n');
  } catch {
    // Non-fatal if log write fails
  }
}

// ─── Database helpers ─────────────────────────────────────────────────────────

async function exportTableToSQL(pool: pg.Pool, tableName: string): Promise<string[]> {
  const lines: string[] = [];

  // Get column names
  const colRes = await pool.query<{ column_name: string; data_type: string }>(
    `SELECT column_name, data_type
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1
     ORDER BY ordinal_position`,
    [tableName]
  );

  if (colRes.rows.length === 0) {
    await log(`Table "${tableName}" not found in public schema, skipping.`, 'WARN');
    return [];
  }

  const columns = colRes.rows.map(r => r.column_name);
  const colList = columns.map(c => `"${c}"`).join(', ');

  // Count rows
  const countRes = await pool.query<{ count: string }>(`SELECT COUNT(*) FROM "${tableName}"`);
  const rowCount = parseInt(countRes.rows[0].count, 10);

  lines.push(`-- Table: ${tableName} (${rowCount} rows)`);
  lines.push(`ALTER TABLE "${tableName}" DISABLE TRIGGER ALL;`);

  if (rowCount === 0) {
    lines.push(`-- (no rows)`);
    lines.push(`ALTER TABLE "${tableName}" ENABLE TRIGGER ALL;`);
    lines.push('');
    return lines;
  }

  // Stream rows in batches of 500 to avoid memory issues
  const BATCH_SIZE = 500;
  let offset = 0;

  while (offset < rowCount) {
    const rows = await pool.query(`SELECT * FROM "${tableName}" ORDER BY 1 LIMIT $1 OFFSET $2`, [BATCH_SIZE, offset]);

    for (const row of rows.rows) {
      const values = columns.map(col => {
        const val = row[col];
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
        if (typeof val === 'number') return String(val);
        if (val instanceof Date) return `'${val.toISOString()}'`;
        if (typeof val === 'object') {
          // JSONB — serialize and escape
          return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
        }
        // String — escape single quotes
        return `'${String(val).replace(/'/g, "''")}'`;
      });

      lines.push(`INSERT INTO "${tableName}" (${colList}) VALUES (${values.join(', ')}) ON CONFLICT DO NOTHING;`);
    }

    offset += rows.rows.length;
    if (rows.rows.length < BATCH_SIZE) break;
  }

  lines.push(`ALTER TABLE "${tableName}" ENABLE TRIGGER ALL;`);
  lines.push('');
  return lines;
}

// ─── Offsite upload (Cloudflare R2 or AWS S3) ────────────────────────────────

function buildS3Client(): { client: S3Client; bucket: string } | null {
  // Cloudflare R2 takes priority
  const r2AccountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  const r2AccessKey = process.env.CLOUDFLARE_R2_ACCESS_KEY || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const r2SecretKey = process.env.CLOUDFLARE_R2_SECRET_KEY || process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const r2Bucket    = process.env.CLOUDFLARE_R2_BACKUP_BUCKET || process.env.CLOUDFLARE_R2_BUCKET_NAME;

  if (r2AccountId && r2AccessKey && r2SecretKey && r2Bucket) {
    return {
      client: new S3Client({
        region: 'auto',
        endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId: r2AccessKey, secretAccessKey: r2SecretKey },
      }),
      bucket: r2Bucket,
    };
  }

  // Fallback: AWS S3
  const awsKey    = process.env.AWS_BACKUP_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const awsSecret = process.env.AWS_BACKUP_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
  const awsBucket = process.env.AWS_BACKUP_BUCKET || process.env.S3_BACKUP_BUCKET;
  const awsRegion = process.env.AWS_BACKUP_REGION || process.env.AWS_REGION || 'us-east-1';

  if (awsKey && awsSecret && awsBucket) {
    return {
      client: new S3Client({
        region: awsRegion,
        credentials: { accessKeyId: awsKey, secretAccessKey: awsSecret },
      }),
      bucket: awsBucket,
    };
  }

  return null;
}

async function uploadToOffsite(localPath: string, remoteKey: string): Promise<boolean> {
  if (SKIP_OFFSITE) return false;

  const s3 = buildS3Client();
  if (!s3) {
    await log('No offsite storage configured (CLOUDFLARE_R2_* or AWS_BACKUP_* env vars not set). Skipping offsite upload.', 'WARN');
    return false;
  }

  const { createReadStream } = await import('fs');
  const fileStream = createReadStream(localPath);
  const { stat } = await import('fs/promises');
  const fileSize = (await stat(localPath)).size;

  await log(`Uploading ${path.basename(localPath)} (${(fileSize / 1024 / 1024).toFixed(2)} MB) to offsite storage...`);

  await s3.client.send(new PutObjectCommand({
    Bucket: s3.bucket,
    Key: remoteKey,
    Body: fileStream,
    ContentType: 'application/gzip',
    Metadata: {
      'backup-date': new Date().toISOString(),
      'source': 'invitely-backup-script',
    },
  }));

  await log(`✅ Offsite upload complete: ${s3.bucket}/${remoteKey}`);
  return true;
}

// ─── Retention management ─────────────────────────────────────────────────────

function parseBackupDate(filename: string): Date | null {
  // Expected format: backup-YYYY-MM-DD-HH.sql.gz
  const m = filename.match(/backup-(\d{4}-\d{2}-\d{2})-(\d{2})\.sql\.gz$/);
  if (!m) return null;
  return new Date(`${m[1]}T${m[2]}:00:00.000Z`);
}

function isWeeklyBackup(date: Date): boolean {
  // Keep Sunday (day 0) backups as weekly
  return date.getUTCDay() === 0;
}

async function applyRetention(backupDir: string) {
  if (!existsSync(backupDir)) return;

  const files = readdirSync(backupDir)
    .filter(f => f.endsWith('.sql.gz'))
    .map(f => ({ name: f, date: parseBackupDate(f), fullPath: path.join(backupDir, f) }))
    .filter(f => f.date !== null)
    .sort((a, b) => b.date!.getTime() - a.date!.getTime()); // newest first

  const dailies  = files.filter(f => !isWeeklyBackup(f.date!));
  const weeklies = files.filter(f => isWeeklyBackup(f.date!));

  const toDelete: typeof files = [
    ...dailies.slice(DAILY_RETENTION),
    ...weeklies.slice(WEEKLY_RETENTION),
  ];

  for (const f of toDelete) {
    await log(`Removing old backup (retention): ${f.name}`, 'WARN');
    if (!DRY_RUN) unlinkSync(f.fullPath);
  }

  await log(`Retention check: kept ${Math.min(dailies.length, DAILY_RETENTION)} daily, ${Math.min(weeklies.length, WEEKLY_RETENTION)} weekly backups.`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  await ensureLogDir();
  await log('═══════════════════════════════════════════════');
  await log(`Starting database backup${DRY_RUN ? ' [DRY RUN]' : ''}...`);

  if (!process.env.DATABASE_URL) {
    await log('DATABASE_URL environment variable is not set.', 'ERROR');
    process.exit(1);
  }

  if (!DRY_RUN) {
    mkdirSync(BACKUP_DIR, { recursive: true });
  }

  // Connect
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

  try {
    await pool.query('SELECT 1'); // connectivity test
    await log('Database connection established.');
  } catch (err) {
    await log(`Cannot connect to database: ${err}`, 'ERROR');
    await pool.end();
    process.exit(1);
  }

  // ── Step 1: Schema backup (runs before data, even if a specific table is targeted) ──
  // A full schema export is always useful regardless of whether we're doing a
  // partial (--table=) or full data backup.  Skip during dry-run so the schema
  // dry-run path still shows the right summary without creating files.
  if (!TABLE_ARG) {
    try {
      await runSchemaBackup(pool, { dateStr: new Date().toISOString().slice(0, 13).replace('T', '-'), dryRun: DRY_RUN, skipOffsite: SKIP_OFFSITE });
    } catch (err) {
      await log(`Schema backup failed (non-fatal, continuing with data backup): ${err}`, 'WARN');
    }
  }

  const tables = TABLE_ARG ? [TABLE_ARG] : TABLES_TO_BACKUP;

  // Build SQL content
  const now     = new Date();
  const dateStr = now.toISOString().slice(0, 13).replace('T', '-'); // YYYY-MM-DD-HH
  const filename = `backup-${dateStr}.sql.gz`;
  const localPath = path.join(BACKUP_DIR, filename);

  await log(`Exporting ${tables.length} tables → ${filename}`);

  const headerLines = [
    `-- Invitely Database Backup`,
    `-- Generated: ${now.toISOString()}`,
    `-- Tables: ${tables.join(', ')}`,
    `-- DO NOT MODIFY THIS FILE MANUALLY`,
    ``,
    `SET session_replication_role = replica; -- disable FK checks`,
    ``,
  ];

  const footerLines = [
    ``,
    `SET session_replication_role = DEFAULT; -- re-enable FK checks`,
    `-- Backup complete`,
  ];

  if (DRY_RUN) {
    await log('[DRY RUN] Would write:');
    for (const t of tables) {
      const colRes = await pool.query<{ count: string }>(`SELECT COUNT(*) FROM "${t}"`).catch(() => ({ rows: [{ count: '?' }] }));
      await log(`  ${t}: ${colRes.rows[0].count} rows`);
    }
    await pool.end();
    await log('[DRY RUN] Done — no files written.');
    return;
  }

  // Stream SQL → gzip → file
  const allLines: string[] = [...headerLines];

  for (const table of tables) {
    await log(`  Exporting table: ${table}`);
    try {
      const tableLines = await exportTableToSQL(pool, table);
      allLines.push(...tableLines);
    } catch (err) {
      await log(`  Failed to export table "${table}": ${err}`, 'WARN');
    }
  }

  allLines.push(...footerLines);

  // Write gzipped file
  const sqlContent = allLines.join('\n');
  const readable = Readable.from([sqlContent]);
  const gzip = createGzip({ level: 9 });
  const output = createWriteStream(localPath);

  await pipeline(readable, gzip, output);

  const { stat } = await import('fs/promises');
  const fileStat = await stat(localPath);
  const sizeMB = (fileStat.size / 1024 / 1024).toFixed(3);

  await log(`✅ Backup written: ${localPath} (${sizeMB} MB)`);

  // Offsite upload
  const remoteKey = `database-backups/${filename}`;
  await uploadToOffsite(localPath, remoteKey);

  // Retention
  await applyRetention(BACKUP_DIR);

  await pool.end();
  await log('Database backup complete.');
  await log('═══════════════════════════════════════════════');
}

main().catch(async err => {
  await log(`Fatal error: ${err}`, 'ERROR').catch(() => {});
  console.error(err);
  process.exit(1);
});
