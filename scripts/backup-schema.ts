#!/usr/bin/env tsx
/**
 * Database schema backup script
 *
 * Exports the full database structure (tables, columns, constraints, indexes)
 * WITHOUT any data. The resulting file can be used to recreate the schema from
 * scratch on any PostgreSQL database — even if the Drizzle migration files are
 * lost.
 *
 * Works entirely through SELECT queries against pg_catalog and information_schema,
 * so it is compatible with Neon serverless (no pg_dump binary required).
 *
 * Usage (standalone):
 *   tsx scripts/backup-schema.ts                  # Export schema
 *   tsx scripts/backup-schema.ts --dry-run        # Show what would be exported, no files written
 *   tsx scripts/backup-schema.ts --skip-offsite   # Write locally only, skip R2/S3 upload
 *
 * Usage (called from backup.ts):
 *   import { runSchemaBackup } from './backup-schema.ts';
 *   await runSchemaBackup(pool, { dateStr, dryRun, skipOffsite });
 *
 * Output: backups/schema/schema-YYYY-MM-DD-HH.sql.gz
 * Offsite: uploads to Cloudflare R2 under schema-backups/ (if env vars present)
 * Retention: 14 daily + 8 weekly schema backups kept, older deleted automatically
 * Logs: logs/backup.log
 */

import 'dotenv/config';
import { createWriteStream, mkdirSync, readdirSync, statSync, unlinkSync, existsSync } from 'fs';
import { appendFile, mkdir, stat } from 'fs/promises';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const { Pool } = pg;
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const SCHEMA_BACKUP_DIR = path.join(ROOT, 'backups', 'schema');
const LOG_FILE          = path.join(ROOT, 'logs', 'backup.log');

const DAILY_RETENTION  = 14;
const WEEKLY_RETENTION = 8;

// ─── Logging ─────────────────────────────────────────────────────────────────

async function log(msg: string, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO') {
  const line = `[${new Date().toISOString()}] [${level}] [schema] ${msg}`;
  console.log(line);
  try {
    await mkdir(path.dirname(LOG_FILE), { recursive: true });
    await appendFile(LOG_FILE, line + '\n');
  } catch { /* non-fatal */ }
}

// ─── Offsite upload (duplicated from backup.ts to keep scripts independent) ───

function buildS3Client(): { client: S3Client; bucket: string } | null {
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
  const s3 = buildS3Client();
  if (!s3) {
    await log('No offsite storage configured — skipping offsite schema upload.', 'WARN');
    return false;
  }

  const { createReadStream } = await import('fs');
  const fileStream = createReadStream(localPath);
  const fileSize   = (await stat(localPath)).size;

  await log(`Uploading ${path.basename(localPath)} (${(fileSize / 1024 / 1024).toFixed(2)} MB) to offsite storage...`);

  await s3.client.send(new PutObjectCommand({
    Bucket: s3.bucket,
    Key: remoteKey,
    Body: fileStream,
    ContentType: 'application/gzip',
    Metadata: {
      'backup-date': new Date().toISOString(),
      'backup-type': 'schema',
      'source': 'invitely-backup-schema-script',
    },
  }));

  await log(`✅ Offsite upload complete: ${s3.bucket}/${remoteKey}`);
  return true;
}

// ─── Retention management ─────────────────────────────────────────────────────

function parseSchemaBackupDate(filename: string): Date | null {
  const m = filename.match(/schema-(\d{4}-\d{2}-\d{2})-(\d{2})\.sql\.gz$/);
  if (!m) return null;
  return new Date(`${m[1]}T${m[2]}:00:00.000Z`);
}

function isWeeklyBackup(date: Date): boolean {
  return date.getUTCDay() === 0; // Sunday
}

async function applySchemaRetention(backupDir: string, dryRun: boolean) {
  if (!existsSync(backupDir)) return;

  const files = readdirSync(backupDir)
    .filter(f => f.match(/^schema-\d{4}-\d{2}-\d{2}-\d{2}\.sql\.gz$/))
    .map(f => ({ name: f, date: parseSchemaBackupDate(f), fullPath: path.join(backupDir, f) }))
    .filter(f => f.date !== null)
    .sort((a, b) => b.date!.getTime() - a.date!.getTime()); // newest first

  const dailies  = files.filter(f => !isWeeklyBackup(f.date!));
  const weeklies = files.filter(f => isWeeklyBackup(f.date!));

  const toDelete = [
    ...dailies.slice(DAILY_RETENTION),
    ...weeklies.slice(WEEKLY_RETENTION),
  ];

  for (const f of toDelete) {
    await log(`Removing old schema backup (retention): ${f.name}`, 'WARN');
    if (!dryRun) unlinkSync(f.fullPath);
  }

  await log(`Schema retention: kept ${Math.min(dailies.length, DAILY_RETENTION)} daily, ${Math.min(weeklies.length, WEEKLY_RETENTION)} weekly schema backups.`);
}

// ─── Schema export via pg_catalog ────────────────────────────────────────────

/** Row returned for each column by the catalog query */
interface CatalogColumn {
  attname: string;
  formatted_type: string;
  not_null: boolean;
  column_default: string | null;
}

/** Row returned for each constraint */
interface CatalogConstraint {
  conname: string;
  contype: string; // p=primary, u=unique, f=foreign, c=check
  condef: string;
}

/** Row returned for each index */
interface CatalogIndex {
  indexname: string;
  indexdef: string;
  indisprimary: boolean;
}

/** Row returned for sequences */
interface CatalogSequence {
  sequence_name: string;
  data_type: string;
  start_value: string;
  increment: string;
  maximum_value: string;
  minimum_value: string;
  cycle_option: string;
}

async function getPublicTables(pool: pg.Pool): Promise<string[]> {
  const res = await pool.query<{ tablename: string }>(
    `SELECT tablename FROM pg_tables
     WHERE schemaname = 'public'
     ORDER BY tablename`
  );
  return res.rows.map(r => r.tablename);
}

async function getSequences(pool: pg.Pool): Promise<CatalogSequence[]> {
  const res = await pool.query<CatalogSequence>(
    `SELECT sequence_name, data_type, start_value::text, increment::text,
            maximum_value::text, minimum_value::text,
            CASE WHEN cycle_option = 'YES' THEN 'YES' ELSE 'NO' END AS cycle_option
     FROM information_schema.sequences
     WHERE sequence_schema = 'public'
     ORDER BY sequence_name`
  );
  return res.rows;
}

async function getTableColumns(pool: pg.Pool, tableName: string): Promise<CatalogColumn[]> {
  const res = await pool.query<CatalogColumn>(
    `SELECT
       a.attname,
       pg_catalog.format_type(a.atttypid, a.atttypmod) AS formatted_type,
       a.attnotnull AS not_null,
       pg_catalog.pg_get_expr(d.adbin, d.adrelid) AS column_default
     FROM pg_catalog.pg_attribute a
     LEFT JOIN pg_catalog.pg_attrdef d
       ON a.attrelid = d.adrelid AND a.attnum = d.adnum
     WHERE a.attrelid = $1::regclass
       AND a.attnum > 0
       AND NOT a.attisdropped
     ORDER BY a.attnum`,
    [tableName]
  );
  return res.rows;
}

async function getTableConstraints(pool: pg.Pool, tableName: string): Promise<CatalogConstraint[]> {
  const res = await pool.query<CatalogConstraint>(
    `SELECT
       c.conname,
       c.contype,
       pg_catalog.pg_get_constraintdef(c.oid, true) AS condef
     FROM pg_catalog.pg_constraint c
     JOIN pg_catalog.pg_class t ON t.oid = c.conrelid
     JOIN pg_catalog.pg_namespace n ON n.oid = t.relnamespace
     WHERE t.relname = $1
       AND n.nspname = 'public'
     ORDER BY c.contype, c.conname`,
    [tableName]
  );
  return res.rows;
}

async function getTableIndexes(pool: pg.Pool, tableName: string): Promise<CatalogIndex[]> {
  const res = await pool.query<CatalogIndex>(
    `SELECT
       i.relname AS indexname,
       pg_catalog.pg_get_indexdef(ix.indexrelid) AS indexdef,
       ix.indisprimary
     FROM pg_catalog.pg_index ix
     JOIN pg_catalog.pg_class i ON i.oid = ix.indexrelid
     JOIN pg_catalog.pg_class t ON t.oid = ix.indrelid
     JOIN pg_catalog.pg_namespace n ON n.oid = t.relnamespace
     WHERE t.relname = $1
       AND n.nspname = 'public'
     ORDER BY i.relname`,
    [tableName]
  );
  return res.rows;
}

function buildCreateTableSQL(
  tableName: string,
  columns: CatalogColumn[],
  constraints: CatalogConstraint[]
): string {
  const lines: string[] = [];

  // Column definitions
  const colDefs = columns.map(col => {
    let def = `    "${col.attname}" ${col.formatted_type}`;
    if (col.column_default !== null) def += ` DEFAULT ${col.column_default}`;
    if (col.not_null) def += ' NOT NULL';
    return def;
  });

  // Inline constraints: PK and UNIQUE only (FKs added separately to handle ordering)
  const inlineConstraints = constraints
    .filter(c => c.contype === 'p' || c.contype === 'u')
    .map(c => `    CONSTRAINT "${c.conname}" ${c.condef}`);

  const allParts = [...colDefs, ...inlineConstraints];

  lines.push(`CREATE TABLE IF NOT EXISTS "${tableName}" (`);
  lines.push(allParts.join(',\n'));
  lines.push(');');

  return lines.join('\n');
}

/**
 * Export the full public schema as a SQL string.
 * Returns the complete DDL without any INSERT/data statements.
 */
export async function exportSchema(pool: pg.Pool): Promise<string> {
  const sections: string[] = [];

  const header = [
    `-- Invitely Database Schema Backup`,
    `-- Generated: ${new Date().toISOString()}`,
    `-- Restore with: psql $DATABASE_URL < schema.sql`,
    `-- NOTE: This file contains structure only. Restore data separately using`,
    `--       the companion database backup (.sql.gz from backups/database/).`,
    ``,
    `-- Extensions`,
    `CREATE EXTENSION IF NOT EXISTS "pgcrypto";`,
    ``,
  ].join('\n');
  sections.push(header);

  // ── Sequences ──────────────────────────────────────────────────────────────
  const sequences = await getSequences(pool);
  if (sequences.length > 0) {
    const seqLines: string[] = ['-- Sequences'];
    for (const seq of sequences) {
      const cycle = seq.cycle_option === 'YES' ? 'CYCLE' : 'NO CYCLE';
      seqLines.push(
        `CREATE SEQUENCE IF NOT EXISTS "${seq.sequence_name}"` +
        ` AS ${seq.data_type}` +
        ` START WITH ${seq.start_value}` +
        ` INCREMENT BY ${seq.increment}` +
        ` MINVALUE ${seq.minimum_value}` +
        ` MAXVALUE ${seq.maximum_value}` +
        ` ${cycle};`
      );
    }
    sections.push(seqLines.join('\n'));
  }

  // ── Tables ─────────────────────────────────────────────────────────────────
  const tables = await getPublicTables(pool);
  const tableConstraintsMap = new Map<string, CatalogConstraint[]>();

  const tableLines: string[] = ['-- Tables'];
  for (const tableName of tables) {
    const columns     = await getTableColumns(pool, tableName);
    const constraints = await getTableConstraints(pool, tableName);
    tableConstraintsMap.set(tableName, constraints);

    tableLines.push('');
    tableLines.push(`-- Table: ${tableName}`);
    tableLines.push(buildCreateTableSQL(tableName, columns, constraints));
  }
  sections.push(tableLines.join('\n'));

  // ── Indexes (non-primary) ──────────────────────────────────────────────────
  const indexLines: string[] = ['-- Indexes'];
  for (const tableName of tables) {
    const indexes = await getTableIndexes(pool, tableName);
    for (const idx of indexes) {
      if (idx.indisprimary) continue; // Already covered by PK constraint in CREATE TABLE
      // Rewrite as CREATE INDEX IF NOT EXISTS
      const idxDef = idx.indexdef.replace(/^CREATE (UNIQUE )?INDEX /, `CREATE $1INDEX IF NOT EXISTS `);
      indexLines.push(idxDef + ';');
    }
  }
  if (indexLines.length > 1) {
    sections.push(indexLines.join('\n'));
  }

  // ── Foreign key constraints (after all tables) ─────────────────────────────
  const fkLines: string[] = ['-- Foreign key constraints'];
  for (const tableName of tables) {
    const constraints = tableConstraintsMap.get(tableName) ?? [];
    for (const c of constraints) {
      if (c.contype !== 'f') continue;
      fkLines.push(
        `ALTER TABLE IF EXISTS "${tableName}"` +
        ` ADD CONSTRAINT IF NOT EXISTS "${c.conname}" ${c.condef};`
      );
    }
  }
  if (fkLines.length > 1) {
    sections.push(fkLines.join('\n'));
  }

  // ── Check constraints ──────────────────────────────────────────────────────
  const checkLines: string[] = ['-- Check constraints'];
  for (const tableName of tables) {
    const constraints = tableConstraintsMap.get(tableName) ?? [];
    for (const c of constraints) {
      if (c.contype !== 'c') continue;
      checkLines.push(
        `ALTER TABLE IF EXISTS "${tableName}"` +
        ` ADD CONSTRAINT IF NOT EXISTS "${c.conname}" ${c.condef};`
      );
    }
  }
  if (checkLines.length > 1) {
    sections.push(checkLines.join('\n'));
  }

  sections.push('-- Schema backup complete');
  return sections.join('\n\n');
}

// ─── Core backup runner (exported for use by backup.ts) ──────────────────────

export interface SchemaBackupOptions {
  dateStr: string;        // YYYY-MM-DD-HH
  dryRun?: boolean;
  skipOffsite?: boolean;
}

export interface SchemaBackupResult {
  filename: string;
  localPath: string | null; // null on dry run
  sizeMB: string | null;
  offsite: boolean;
  tables: number;
}

/**
 * Run a schema-only backup.  This function is called both from the standalone
 * CLI entry point below and from scripts/backup.ts before the data export.
 *
 * @param pool      An already-connected pg.Pool
 * @param options   Backup configuration options
 */
export async function runSchemaBackup(
  pool: pg.Pool,
  options: SchemaBackupOptions
): Promise<SchemaBackupResult> {
  const { dateStr, dryRun = false, skipOffsite = false } = options;

  const filename  = `schema-${dateStr}.sql.gz`;
  const localPath = path.join(SCHEMA_BACKUP_DIR, filename);

  await log(`Starting schema backup → ${filename}`);

  if (dryRun) {
    const tables = await getPublicTables(pool);
    const seqs   = await getSequences(pool);
    await log(`[DRY RUN] Would export schema for ${tables.length} tables, ${seqs.length} sequences.`);
    await log('[DRY RUN] No schema backup file written.');
    return { filename, localPath: null, sizeMB: null, offsite: false, tables: tables.length };
  }

  mkdirSync(SCHEMA_BACKUP_DIR, { recursive: true });

  // Export schema SQL
  await log('Querying database catalog for schema DDL...');
  const sqlContent = await exportSchema(pool);
  const tables     = (sqlContent.match(/^CREATE TABLE/gm) ?? []).length;

  // Compress and write
  const readable = Readable.from([sqlContent]);
  const gzip     = createGzip({ level: 9 });
  const output   = createWriteStream(localPath);
  await pipeline(readable, gzip, output);

  const fileStat = await stat(localPath);
  const sizeMB   = (fileStat.size / 1024 / 1024).toFixed(3);

  await log(`✅ Schema backup created: ${localPath} (${sizeMB} MB, ${tables} tables)`);

  // Offsite upload
  let offsite = false;
  if (!skipOffsite) {
    try {
      offsite = await uploadToOffsite(localPath, `schema-backups/${filename}`);
    } catch (err) {
      await log(`Offsite schema upload failed (non-fatal): ${err}`, 'WARN');
    }
  }

  // Retention
  await applySchemaRetention(SCHEMA_BACKUP_DIR, dryRun);

  return { filename, localPath, sizeMB, offsite, tables };
}

// ─── Standalone CLI entry point ───────────────────────────────────────────────
// Only runs when this file is invoked directly (tsx scripts/backup-schema.ts)
// and is skipped when the file is imported as a module by backup.ts.

const isDirectlyInvoked = process.argv[1]
  ? path.resolve(process.argv[1]).includes('backup-schema')
  : false;

if (isDirectlyInvoked) {
  (async () => {
    const DRY_RUN      = process.argv.includes('--dry-run');
    const SKIP_OFFSITE = process.argv.includes('--skip-offsite');

    // Log header
    await log('═══════════════════════════════════════════════');
    await log(`Starting standalone schema backup${DRY_RUN ? ' [DRY RUN]' : ''}...`);

    if (!process.env.DATABASE_URL) {
      await log('DATABASE_URL environment variable is not set.', 'ERROR');
      process.exit(1);
    }

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    try {
      await pool.query('SELECT 1');
      await log('Database connection established.');
    } catch (err) {
      await log(`Cannot connect to database: ${err}`, 'ERROR');
      await pool.end();
      process.exit(1);
    }

    const now     = new Date();
    const dateStr = now.toISOString().slice(0, 13).replace('T', '-'); // YYYY-MM-DD-HH

    try {
      const result = await runSchemaBackup(pool, { dateStr, dryRun: DRY_RUN, skipOffsite: SKIP_OFFSITE });
      await log(`Schema backup finished: ${result.filename}${result.sizeMB ? ` (${result.sizeMB} MB)` : ''}`);
    } finally {
      await pool.end();
    }

    await log('═══════════════════════════════════════════════');
  })().catch(async err => {
    await log(`Fatal error: ${err}`, 'ERROR').catch(() => {});
    console.error(err);
    process.exit(1);
  });
}
