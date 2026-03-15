#!/usr/bin/env tsx
/**
 * Storage/media backup script
 *
 * Backs up local upload files and (if configured) lists Cloudflare R2 objects.
 *
 * Usage:
 *   tsx scripts/backup-storage.ts              # Backup uploads/ directory
 *   tsx scripts/backup-storage.ts --dry-run    # Show what would happen
 *   tsx scripts/backup-storage.ts --skip-local # Skip local uploads (R2 inventory only)
 *
 * Output: backups/storage/storage-YYYY-MM-DD.tar.gz
 */

import 'dotenv/config';
import archiver from 'archiver';
import { createWriteStream, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs';
import { appendFile, mkdir, stat } from 'fs/promises';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const BACKUP_DIR   = path.join(ROOT, 'backups', 'storage');
const UPLOADS_DIR  = path.join(ROOT, 'uploads');
const LOG_FILE     = path.join(ROOT, 'logs', 'backup.log');

const DRY_RUN      = process.argv.includes('--dry-run');
const SKIP_LOCAL   = process.argv.includes('--skip-local');

const DAILY_RETENTION = 7; // Keep 7 storage backups

// ─── Logging ─────────────────────────────────────────────────────────────────

async function log(msg: string, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO') {
  const line = `[${new Date().toISOString()}] [${level}] [storage] ${msg}`;
  console.log(line);
  try {
    await mkdir(path.dirname(LOG_FILE), { recursive: true });
    await appendFile(LOG_FILE, line + '\n');
  } catch { /* non-fatal */ }
}

// ─── Archive local uploads ────────────────────────────────────────────────────

async function archiveUploads(outputPath: string): Promise<number> {
  if (!existsSync(UPLOADS_DIR)) {
    await log(`uploads/ directory not found at ${UPLOADS_DIR}, skipping local archive.`, 'WARN');
    return 0;
  }

  return new Promise((resolve, reject) => {
    const output  = createWriteStream(outputPath);
    const archive = archiver('tar', { gzip: true, gzipOptions: { level: 9 } });

    output.on('close', () => resolve(archive.pointer()));
    archive.on('error', reject);

    archive.pipe(output);
    archive.directory(UPLOADS_DIR, 'uploads');
    archive.finalize();
  });
}

// ─── R2 inventory ────────────────────────────────────────────────────────────

interface R2Object { key: string; size: number; lastModified: Date }

async function listR2Objects(): Promise<R2Object[]> {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  const accessKey = process.env.CLOUDFLARE_R2_ACCESS_KEY || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretKey = process.env.CLOUDFLARE_R2_SECRET_KEY || process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const bucket    = process.env.CLOUDFLARE_R2_BUCKET_NAME;

  if (!accountId || !accessKey || !secretKey || !bucket) {
    await log('R2 env vars not set — skipping R2 inventory.', 'WARN');
    return [];
  }

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  });

  const objects: R2Object[] = [];
  let continuationToken: string | undefined;

  do {
    const res = await client.send(new ListObjectsV2Command({
      Bucket: bucket,
      ContinuationToken: continuationToken,
    }));

    for (const obj of res.Contents ?? []) {
      if (obj.Key && obj.Size !== undefined && obj.LastModified) {
        objects.push({ key: obj.Key, size: obj.Size, lastModified: obj.LastModified });
      }
    }

    continuationToken = res.NextContinuationToken;
  } while (continuationToken);

  return objects;
}

// ─── Retention ───────────────────────────────────────────────────────────────

async function applyRetention(dir: string) {
  if (!existsSync(dir)) return;

  const files = readdirSync(dir)
    .filter(f => f.startsWith('storage-') && f.endsWith('.tar.gz'))
    .map(f => ({ name: f, fullPath: path.join(dir, f) }))
    .sort((a, b) => {
      const da = statSync(a.fullPath).mtimeMs;
      const db = statSync(b.fullPath).mtimeMs;
      return db - da; // newest first
    });

  const toDelete = files.slice(DAILY_RETENTION);
  for (const f of toDelete) {
    await log(`Removing old storage backup (retention): ${f.name}`, 'WARN');
    if (!DRY_RUN) unlinkSync(f.fullPath);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  await log('═══════════════════════════════════════════════');
  await log(`Starting storage backup${DRY_RUN ? ' [DRY RUN]' : ''}...`);

  if (!DRY_RUN) {
    mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const now      = new Date();
  const dateStr  = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const filename = `storage-${dateStr}.tar.gz`;
  const outPath  = path.join(BACKUP_DIR, filename);

  // — Local uploads archive —
  if (!SKIP_LOCAL) {
    if (DRY_RUN) {
      if (existsSync(UPLOADS_DIR)) {
        const files = readdirSync(UPLOADS_DIR).length;
        await log(`[DRY RUN] Would archive ${files} items from uploads/ → ${filename}`);
      } else {
        await log('[DRY RUN] uploads/ directory does not exist, would skip.');
      }
    } else {
      await log(`Archiving uploads/ → ${filename}`);
      const bytes = await archiveUploads(outPath);
      const fileStat = await stat(outPath);
      const sizeMB = (fileStat.size / 1024 / 1024).toFixed(3);
      await log(`✅ Storage archive created: ${outPath} (${sizeMB} MB, ${bytes} bytes archived)`);
    }
  }

  // — Cloudflare R2 inventory —
  await log('Generating R2 object inventory...');
  const r2Objects = await listR2Objects();

  if (r2Objects.length > 0) {
    const totalSizeMB = (r2Objects.reduce((sum, o) => sum + o.size, 0) / 1024 / 1024).toFixed(2);
    await log(`R2 inventory: ${r2Objects.length} objects, ${totalSizeMB} MB total`);

    if (!DRY_RUN) {
      // Write inventory manifest
      const manifestPath = path.join(BACKUP_DIR, `r2-inventory-${dateStr}.json`);
      const { writeFile } = await import('fs/promises');
      await writeFile(manifestPath, JSON.stringify({
        generated: now.toISOString(),
        totalObjects: r2Objects.length,
        totalBytes: r2Objects.reduce((sum, o) => sum + o.size, 0),
        objects: r2Objects,
      }, null, 2));
      await log(`R2 inventory written: ${manifestPath}`);
    }
  }

  // — Retention —
  if (!DRY_RUN) {
    await applyRetention(BACKUP_DIR);
  }

  await log('Storage backup complete.');
  await log('═══════════════════════════════════════════════');
}

main().catch(async err => {
  await log(`Fatal error: ${err}`, 'ERROR').catch(() => {});
  console.error(err);
  process.exit(1);
});
