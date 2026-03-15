/**
 * Vercel Cron Job endpoint for automated database backups
 *
 * Configured in vercel.json → crons to run daily at 02:00 UTC
 * Endpoint: POST /api/cron/backup
 *
 * Authentication: Vercel calls this with the Authorization header automatically,
 * checked against BACKUP_CRON_SECRET environment variable.
 *
 * On Vercel this runs in a serverless context — writes backup to /tmp/,
 * then uploads to R2/S3. The /tmp file is automatically discarded after the
 * function completes; the durable copy lives in Cloudflare R2.
 *
 * Local usage (for testing):
 *   curl -X POST http://localhost:5001/api/cron/backup \
 *     -H "Authorization: Bearer <BACKUP_CRON_SECRET>"
 */

import type { Express, Request, Response } from 'express';
import pg from 'pg';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { stat, unlink } from 'fs/promises';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createReadStream } from 'fs';

const { Pool } = pg;

// ─── Tables exported by the cron backup ──────────────────────────────────────
const CRON_BACKUP_TABLES = [
  'management_users',
  'pricing_plans',
  'plan_features',
  'plan_feature_associations',
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
];

// ─── SQL export helpers ───────────────────────────────────────────────────────

async function exportTableSQL(pool: pg.Pool, tableName: string): Promise<string> {
  const colRes = await pool.query<{ column_name: string }>(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1
     ORDER BY ordinal_position`,
    [tableName]
  );

  if (colRes.rows.length === 0) return `-- Table "${tableName}" not found, skipped\n`;

  const columns  = colRes.rows.map(r => r.column_name);
  const colList  = columns.map(c => `"${c}"`).join(', ');
  const countRes = await pool.query<{ count: string }>(`SELECT COUNT(*) FROM "${tableName}"`);
  const rowCount = parseInt(countRes.rows[0].count, 10);

  const lines: string[] = [`-- Table: ${tableName} (${rowCount} rows)`];
  if (rowCount === 0) return lines.join('\n') + '\n';

  lines.push(`ALTER TABLE "${tableName}" DISABLE TRIGGER ALL;`);

  const BATCH = 500;
  for (let offset = 0; offset < rowCount; offset += BATCH) {
    const rows = await pool.query(`SELECT * FROM "${tableName}" ORDER BY 1 LIMIT $1 OFFSET $2`, [BATCH, offset]);
    for (const row of rows.rows) {
      const values = columns.map(col => {
        const val = row[col];
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
        if (typeof val === 'number') return String(val);
        if (val instanceof Date) return `'${val.toISOString()}'`;
        if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
        return `'${String(val).replace(/'/g, "''")}'`;
      });
      lines.push(`INSERT INTO "${tableName}" (${colList}) VALUES (${values.join(', ')}) ON CONFLICT DO NOTHING;`);
    }
  }

  lines.push(`ALTER TABLE "${tableName}" ENABLE TRIGGER ALL;`);
  lines.push('');
  return lines.join('\n');
}

// ─── S3/R2 client ─────────────────────────────────────────────────────────────

function buildOffsiteClient(): { client: S3Client; bucket: string } | null {
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

// ─── Core backup logic ────────────────────────────────────────────────────────

async function runBackup(databaseUrl: string): Promise<{
  filename: string;
  tables: number;
  offsite: boolean;
  sizeMB: string;
}> {
  const pool = new Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });

  try {
    // Build SQL
    const now      = new Date();
    const dateStr  = now.toISOString().slice(0, 13).replace('T', '-');
    const filename = `backup-${dateStr}.sql.gz`;

    const header = [
      `-- Invitely Database Backup (Vercel Cron)`,
      `-- Generated: ${now.toISOString()}`,
      ``,
      `SET session_replication_role = replica;`,
      ``,
    ].join('\n');

    const footer = `\nSET session_replication_role = DEFAULT;\n-- Backup complete\n`;

    let sqlBody = header;
    for (const table of CRON_BACKUP_TABLES) {
      try {
        sqlBody += await exportTableSQL(pool, table);
      } catch (err) {
        sqlBody += `-- WARNING: export failed for "${table}": ${err}\n`;
      }
    }
    sqlBody += footer;

    // Write to /tmp (available on Vercel Serverless, auto-cleaned after invocation)
    const tmpDir  = process.env.VERCEL ? '/tmp' : path.resolve('backups/database');
    if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });
    const tmpPath = path.join(tmpDir, filename);

    const readable = Readable.from([sqlBody]);
    const gzip     = createGzip({ level: 9 });
    const output   = createWriteStream(tmpPath);
    await pipeline(readable, gzip, output);

    const fileStat = await stat(tmpPath);
    const sizeMB   = (fileStat.size / 1024 / 1024).toFixed(3);

    // Offsite upload
    let offsite = false;
    const s3 = buildOffsiteClient();
    if (s3) {
      const fileStream = createReadStream(tmpPath);
      await s3.client.send(new PutObjectCommand({
        Bucket: s3.bucket,
        Key: `database-backups/${filename}`,
        Body: fileStream,
        ContentType: 'application/gzip',
        Metadata: { 'backup-date': now.toISOString(), source: 'vercel-cron' },
      }));
      offsite = true;
    }

    // Clean up temp file on Vercel (it'll vanish anyway but good hygiene)
    if (process.env.VERCEL) {
      await unlink(tmpPath).catch(() => {});
    }

    return { filename, tables: CRON_BACKUP_TABLES.length, offsite, sizeMB };
  } finally {
    await pool.end();
  }
}

export function registerCronBackupRoute(app: Express) {
  // Vercel Cron Jobs use GET; also allow POST for manual triggers
  const handler = async (req: Request, res: Response) => {
    const startMs = Date.now();

    // Authentication — Vercel automatically sends CRON_SECRET (auto-generated) as bearer token.
    // BACKUP_CRON_SECRET is our own fallback for manual POST triggers.
    const cronSecret = process.env.CRON_SECRET || process.env.BACKUP_CRON_SECRET;
    if (cronSecret) {
      const authHeader = req.headers.authorization ?? '';
      const provided   = authHeader.replace(/^Bearer\s+/i, '').trim();

      if (provided !== cronSecret) {
        console.warn(`[cron-backup] Unauthorized attempt from ${req.ip}`);
        return res.status(401).json({ error: 'Unauthorized' });
      }
    } else {
      // No secret configured — only allow in development to avoid being open in prod
      const isDev = process.env.NODE_ENV === 'development' || !process.env.VERCEL;
      if (!isDev) {
        return res.status(503).json({ error: 'CRON_SECRET not configured' });
      }
    }

    if (!process.env.DATABASE_URL) {
      return res.status(503).json({ error: 'DATABASE_URL not configured' });
    }

    console.log(`[cron-backup] Starting backup at ${new Date().toISOString()}`);

    try {
      const result  = await runBackup(process.env.DATABASE_URL);
      const elapsed = ((Date.now() - startMs) / 1000).toFixed(1);

      console.log(`[cron-backup] ✅ Backup complete in ${elapsed}s: ${result.filename} (${result.sizeMB} MB, offsite=${result.offsite})`);

      return res.status(200).json({
        success: true,
        filename: result.filename,
        tables: result.tables,
        sizeMB: result.sizeMB,
        offsite: result.offsite,
        elapsedSeconds: parseFloat(elapsed),
      });
    } catch (err: any) {
      console.error('[cron-backup] ❌ Backup failed:', err);
      return res.status(500).json({ error: 'Backup failed', detail: String(err?.message ?? err) });
    }
  };

  app.get('/api/cron/backup', handler);   // Vercel Cron uses GET
  app.post('/api/cron/backup', handler);  // Allow POST for manual curl triggers

  console.log('✅ Cron backup route registered: GET|POST /api/cron/backup');
}
