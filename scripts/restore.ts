#!/usr/bin/env tsx
/**
 * Database restore script
 *
 * Usage:
 *   tsx scripts/restore.ts --file backups/database/backup-2025-06-10-02.sql.gz
 *   tsx scripts/restore.ts --file backup-2025-06-10-02.sql.gz   # searches backups/ dir
 *   tsx scripts/restore.ts --list                                # list available backups
 *   tsx scripts/restore.ts --file <...> --dry-run               # parse without executing
 *   tsx scripts/restore.ts --file <...> --tables=rsvps,templates  # restore specific tables only
 *
 * Safety:
 *   - Never drops or truncates tables — only inserts (ON CONFLICT DO NOTHING)
 *   - Prompts for confirmation before writing to database
 *   - Dry-run mode shows all statements that would be executed
 *   - Only executes INSERT statements and ALTER TABLE DISABLE/ENABLE TRIGGER
 *   - Rejects any statement containing DROP, TRUNCATE, or DELETE
 */

import 'dotenv/config';
import { createReadStream, existsSync, readdirSync, statSync } from 'fs';
import { appendFile, mkdir } from 'fs/promises';
import { createGunzip } from 'zlib';
import { createInterface } from 'readline';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const BACKUP_DIR = path.join(ROOT, 'backups', 'database');
const LOG_FILE   = path.join(ROOT, 'logs', 'restore.log');

// ─── Parse CLI args ───────────────────────────────────────────────────────────

const args = process.argv.slice(2);

function getArg(name: string): string | undefined {
  // Support both --file=value and --file value formats
  const eqIdx = args.findIndex(a => a === `--${name}`);
  if (eqIdx !== -1 && args[eqIdx + 1] && !args[eqIdx + 1].startsWith('--')) {
    return args[eqIdx + 1];
  }
  const a = args.find(a => a.startsWith(`--${name}=`));
  return a?.split('=').slice(1).join('=');
}

const FILE_ARG    = getArg('file');
const DRY_RUN     = args.includes('--dry-run');
const LIST_MODE   = args.includes('--list');
const TABLES_ARG  = getArg('tables')?.split(',').filter(Boolean);

// ─── Logging ─────────────────────────────────────────────────────────────────

async function log(msg: string, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO') {
  const line = `[${new Date().toISOString()}] [${level}] [restore] ${msg}`;
  console.log(line);
  try {
    await mkdir(path.dirname(LOG_FILE), { recursive: true });
    await appendFile(LOG_FILE, line + '\n');
  } catch { /* non-fatal */ }
}

// ─── List backups ────────────────────────────────────────────────────────────

function listBackups() {
  if (!existsSync(BACKUP_DIR)) {
    console.log('No backups directory found at:', BACKUP_DIR);
    process.exit(0);
  }

  const files = readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.sql.gz'))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.log('No backup files found in:', BACKUP_DIR);
    process.exit(0);
  }

  console.log('\nAvailable database backups:\n');
  for (const f of files) {
    const fullPath = path.join(BACKUP_DIR, f);
    const size     = statSync(fullPath).size;
    const sizeMB   = (size / 1024 / 1024).toFixed(2);
    console.log(`  ${f}  (${sizeMB} MB)`);
  }
  console.log(`\nTo restore: tsx scripts/restore.ts --file ${files[0]}\n`);
  process.exit(0);
}

// ─── Resolve file path ───────────────────────────────────────────────────────

function resolveBackupFile(input: string): string {
  if (path.isAbsolute(input) || input.startsWith('.')) {
    return path.resolve(ROOT, input);
  }
  // Try the backup dir
  const candidate = path.join(BACKUP_DIR, input);
  if (existsSync(candidate)) return candidate;
  // Try relative to cwd
  const rel = path.resolve(process.cwd(), input);
  if (existsSync(rel)) return rel;
  throw new Error(`Backup file not found: ${input}`);
}

// ─── Parse SQL from gzip stream ──────────────────────────────────────────────

async function parseSQL(filePath: string): Promise<string[]> {
  const lines: string[] = [];

  const fileStream = createReadStream(filePath);
  const gunzip     = createGunzip();
  const rl         = createInterface({ input: fileStream.pipe(gunzip) });

  for await (const line of rl) {
    lines.push(line);
  }

  return lines;
}

// ─── Safety check ─────────────────────────────────────────────────────────────

const FORBIDDEN_PATTERNS = [/\bDROP\b/i, /\bTRUNCATE\b/i, /\bDELETE\s+FROM\b/i, /\bALTER\s+TABLE\b.*\bDROP\b/i];
const ALLOWED_PATTERNS   = [/^--/, /^SET\s+session_replication_role/i, /^INSERT\s+INTO/i, /^ALTER\s+TABLE\s+".+"\s+(DISABLE|ENABLE)\s+TRIGGER/i, /^\s*$/];

function isSafeStatement(stmt: string): boolean {
  const trimmed = stmt.trim();
  if (!trimmed || trimmed.startsWith('--')) return true;

  // Reject anything with forbidden keywords
  for (const pat of FORBIDDEN_PATTERNS) {
    if (pat.test(trimmed)) return false;
  }

  // Must match an allowed pattern
  for (const pat of ALLOWED_PATTERNS) {
    if (pat.test(trimmed)) return true;
  }

  return false; // unknown statement type — reject
}

// ─── Extract statements ───────────────────────────────────────────────────────

function extractStatements(lines: string[], filterTables?: string[]): { safe: string[]; skipped: string[]; rejected: string[] } {
  const safe: string[] = [];
  const skipped: string[] = [];
  const rejected: string[] = [];

  // Current table context (for table filtering)
  let currentTable: string | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('--')) {
      // Extract current table from comment: -- Table: xyz
      const m = trimmed.match(/^--\s+Table:\s+(\S+)/);
      if (m) currentTable = m[1];
      continue;
    }

    // Table filtering
    if (filterTables && filterTables.length > 0) {
      if (currentTable && !filterTables.includes(currentTable)) {
        skipped.push(trimmed);
        continue;
      }
    }

    if (isSafeStatement(trimmed)) {
      safe.push(trimmed);
    } else {
      rejected.push(trimmed);
    }
  }

  return { safe, skipped, rejected };
}

// ─── Interactive confirmation ─────────────────────────────────────────────────

async function confirm(prompt: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(`${prompt} [yes/no]: `, answer => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'yes');
    });
  });
}

// ─── Execute restore ──────────────────────────────────────────────────────────

async function executeSQLStatements(pool: pg.Pool, statements: string[]): Promise<{ ok: number; failed: number }> {
  let ok = 0;
  let failed = 0;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const stmt of statements) {
      try {
        await client.query(stmt);
        ok++;
      } catch (err: any) {
        // Non-fatal: ON CONFLICT DO NOTHING handles most duplicate issues
        // but FK violations or other errors are logged as warnings
        await log(`Statement warning: ${err.message} — "${stmt.slice(0, 80)}..."`, 'WARN');
        failed++;
      }
    }

    await client.query('COMMIT');
    await log(`Transaction committed: ${ok} succeeded, ${failed} warned.`);
  } catch (err) {
    await client.query('ROLLBACK');
    await log(`Transaction rolled back due to fatal error: ${err}`, 'ERROR');
    throw err;
  } finally {
    client.release();
  }

  return { ok, failed };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (LIST_MODE) {
    listBackups();
    return;
  }

  if (!FILE_ARG) {
    console.error('Usage: tsx scripts/restore.ts --file <backup-file.sql.gz> [--dry-run] [--tables=t1,t2]');
    console.error('       tsx scripts/restore.ts --list');
    process.exit(1);
  }

  await log('═══════════════════════════════════════════════');
  await log(`Starting restore${DRY_RUN ? ' [DRY RUN]' : ''} from: ${FILE_ARG}`);

  const filePath = resolveBackupFile(FILE_ARG);
  await log(`Resolved backup file: ${filePath}`);

  if (!existsSync(filePath)) {
    await log(`File not found: ${filePath}`, 'ERROR');
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    await log('DATABASE_URL environment variable is not set.', 'ERROR');
    process.exit(1);
  }

  // Parse the backup
  await log('Parsing backup file...');
  const lines = await parseSQL(filePath);
  await log(`Read ${lines.length} lines from backup.`);

  const { safe, skipped, rejected } = extractStatements(lines, TABLES_ARG);

  await log(`Statements: ${safe.length} safe, ${skipped.length} skipped (table filter), ${rejected.length} rejected (unsafe)`);

  if (rejected.length > 0) {
    await log(`⚠️  REJECTED statements (will not execute):`, 'WARN');
    for (const s of rejected) {
      await log(`   REJECTED: ${s.slice(0, 120)}`, 'WARN');
    }
  }

  const insertCount = safe.filter(s => /^INSERT/i.test(s.trim())).length;
  await log(`Will execute ${insertCount} INSERT statements.`);

  if (DRY_RUN) {
    await log('[DRY RUN] Showing first 20 safe statements:');
    safe.slice(0, 20).forEach(s => console.log('  ', s));
    if (safe.length > 20) console.log(`  ... and ${safe.length - 20} more`);
    await log('[DRY RUN] Done — no changes made to database.');
    return;
  }

  if (safe.length === 0) {
    await log('No safe statements to execute. Aborting.', 'WARN');
    process.exit(0);
  }

  // Confirmation
  const fileSize = statSync(filePath).size;
  const sizeMB   = (fileSize / 1024 / 1024).toFixed(2);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Backup file : ${path.basename(filePath)} (${sizeMB} MB)`);
  console.log(`  Insert rows : ${insertCount}`);
  console.log(`  Tables      : ${TABLES_ARG ? TABLES_ARG.join(', ') : 'all'}`);
  console.log(`  Database    : ${process.env.DATABASE_URL?.replace(/:[^@]+@/, ':***@')}`);
  console.log('  Mode        : INSERT with ON CONFLICT DO NOTHING (safe, non-destructive)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const proceed = await confirm('⚠️  Proceed with restore?');
  if (!proceed) {
    await log('Restore cancelled by user.');
    process.exit(0);
  }

  // Execute
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

  try {
    const { ok, failed } = await executeSQLStatements(pool, safe);
    await log(`✅ Restore complete: ${ok} rows inserted, ${failed} warnings.`);
  } finally {
    await pool.end();
  }

  await log('Restore finished.');
  await log('═══════════════════════════════════════════════');
}

main().catch(async err => {
  await log(`Fatal error: ${err}`, 'ERROR').catch(() => {});
  console.error(err);
  process.exit(1);
});
