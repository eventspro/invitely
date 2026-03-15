# Backup and Disaster Recovery System

> **Audience:** Developers new to the project  
> **Last updated:** March 2026  
> **Applies to:** Production, Staging, and local development environments

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Backup Process](#3-backup-process)
4. [Storage and Offsite Backup](#4-storage-and-offsite-backup)
5. [Commands for Developers](#5-commands-for-developers)
6. [Restore Process](#6-restore-process)
7. [Logging and Monitoring](#7-logging-and-monitoring)
8. [Failure Handling](#8-failure-handling)
9. [Safety Rules](#9-safety-rules)
10. [Disaster Recovery Scenario](#10-disaster-recovery-scenario)
11. [Maintenance](#11-maintenance)

---

## 1. Overview

### What the backup system does

The Invitely platform backup system automatically exports a complete copy of the PostgreSQL database to compressed `.sql.gz` files on a daily schedule. These files contain safe `INSERT` statements that can recreate all data on any compatible PostgreSQL database. In addition, uploaded media files (photos, audio) stored locally in `uploads/` are archived separately, and an inventory of files stored in Cloudflare R2 is generated.

Backups can also be uploaded to a remote object storage bucket (Cloudflare R2 or AWS S3) so that a copy exists independently of the server.

### Why it exists

Wedding websites built on Invitely represent irreplaceable moments in people's lives — guest RSVPs, couple photos, event timelines, and personal messages. If this data is lost due to a technical failure, it cannot be recovered from any other source. The backup system exists to ensure that, no matter what happens to the server or database, a recent copy of all data can be recovered.

### What problems it protects against

| Problem | Protection |
|---------|------------|
| Server crash or hardware failure | Daily backups stored locally and offsite |
| Accidental deletion of a template or RSVP | Point-in-time restore from any saved backup |
| Database corruption | Clean SQL export unaffected by internal DB state |
| Botched deployment or migration | Restore to pre-deployment state |
| Cloud storage (R2/S3) object loss | Local archive of `uploads/` as `.tar.gz` |
| Human error (wrong query, wrong table) | Selective table restore (`--tables=rsvps`) |

---

## 2. Architecture

### How the system works

The backup system consists of three independent scripts and one HTTP endpoint:

```
scripts/backup.ts
  Connects to the PostgreSQL database
  Reads every row from 20 critical tables using SELECT queries
  Formats rows as SQL INSERT statements
  Compresses the output with gzip (level 9)
  Writes to: backups/database/backup-YYYY-MM-DD-HH.sql.gz
  Uploads to Cloudflare R2 or AWS S3 (if env vars are configured)
  Deletes old backups according to the retention policy
  Logs every action to: logs/backup.log

scripts/backup-storage.ts
  Archives the local uploads/ directory to a .tar.gz file
  Lists all objects in the Cloudflare R2 bucket (inventory)
  Writes to: backups/storage/storage-YYYY-MM-DD.tar.gz
              backups/storage/r2-inventory-YYYY-MM-DD.json
  Logs to: logs/backup.log

scripts/restore.ts
  Reads a .sql.gz backup file
  Decompresses and parses the SQL
  Rejects any unsafe statements (DROP, TRUNCATE, DELETE)
  Prompts for confirmation
  Executes approved INSERT statements inside a database transaction
  Logs to: logs/restore.log

server/routes/cron-backup.ts  →  GET /api/cron/backup
  Called automatically by Vercel Cron every night at 02:00 UTC
  Runs the same export logic as scripts/backup.ts
  Writes to /tmp/ (serverless ephemeral storage)
  Uploads the result to Cloudflare R2
  Returns a JSON summary
```

### What data is included

All 20 database tables are backed up, covering every category of platform data:

| Category | Tables |
|----------|--------|
| **Users** | `management_users`, `users` |
| **Wedding templates** | `templates` |
| **Orders / purchases** | `orders`, `user_admin_panels` |
| **Guest RSVPs** | `rsvps` |
| **Uploaded media** | `images`, `guest_photos` |
| **Pricing** | `pricing_plans`, `plan_features`, `plan_feature_associations`, `configurable_pricing_plans`, `configurable_plan_features` |
| **Translations** | `translations`, `translation_keys`, `translation_values` |
| **Platform config** | `platform_settings`, `settings` |
| **Integrations** | `google_drive_integrations` |
| **Audit** | `activity_logs` |

Tables are exported in dependency order (parent tables before child tables) to avoid foreign key errors on restore.

### Backup folder structure

```
project-root/
├── backups/
│   ├── schema/
│   │   ├── schema-2026-03-15-02.sql.gz    ← Full DDL: tables, indexes, constraints
│   │   ├── schema-2026-03-14-02.sql.gz
│   │   └── ...                            (up to 14 daily + 8 weekly)
│   ├── database/
│   │   ├── backup-2026-03-15-02.sql.gz   ← Full DB backup from 02:00 UTC, March 15
│   │   ├── backup-2026-03-14-02.sql.gz
│   │   ├── backup-2026-03-13-02.sql.gz
│   │   └── ...                            (up to 14 daily + 8 weekly)
│   └── storage/
│       ├── storage-2026-03-15.tar.gz      ← Archive of uploads/ directory
│       ├── storage-2026-03-14.tar.gz
│       └── r2-inventory-2026-03-15.json   ← List of all objects in R2 bucket
└── logs/
    ├── backup.log    ← All backup activity (database, schema, storage)
    └── restore.log                         ← All restore activity
```

> **Note:** `backups/` and `logs/` are listed in `.gitignore` and are never committed to the repository. They contain sensitive database content.

### File naming format

- Schema backups: `schema-YYYY-MM-DD-HH.sql.gz`
  - Example: `schema-2026-03-15-02.sql.gz` = schema captured on March 15, 2026 at 02:00 UTC
  - Contains: `CREATE TABLE`, `CREATE INDEX`, `ALTER TABLE ADD CONSTRAINT`, sequences — no data
- Database backups: `backup-YYYY-MM-DD-HH.sql.gz`
  - Example: `backup-2026-03-15-02.sql.gz` = data backup taken on March 15, 2026 at 02:00 UTC
- Storage archives: `storage-YYYY-MM-DD.tar.gz`
  - Example: `storage-2026-03-15.tar.gz`
- R2 inventory: `r2-inventory-YYYY-MM-DD.json`

The hour component in all backup filenames allows multiple backups per day (e.g. manually triggered backups before a risky deployment). A schema backup and its matching data backup share the same `YYYY-MM-DD-HH` timestamp, making them easy to identify as a matched pair.

---

## 3. Backup Process

### Execution order within a full backup

When `npm run backup` runs, it always performs the schema export **first**, then the data export. This ordering is intentional: if the data backup fails partway through, you still have a freshly exported schema file that captures the current table structure.

```
npm run backup
  │
  ├── 1. Schema backup  →  backups/schema/schema-YYYY-MM-DD-HH.sql.gz
  └── 2. Data backup    →  backups/database/backup-YYYY-MM-DD-HH.sql.gz
```

### Automatic backups (Vercel Cron)

On production, backups run automatically every night. Vercel's built-in cron scheduler triggers a GET request to the `/api/cron/backup` endpoint at **02:00 UTC** every day. The schedule is defined in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/backup",
      "schedule": "0 2 * * *"
    }
  ]
}
```

The endpoint is protected by an authentication token. Vercel automatically sends a `CRON_SECRET` bearer token with every cron request.

### Backup frequency

| Type | Frequency | Trigger |
|------|-----------|---------|
| Automatic (production) | Daily at 02:00 UTC | Vercel Cron |
| Manual | On-demand | Developer runs `npm run backup` |
| Pre-deployment | Recommended before any migration | Developer runs `npm run backup` |

### Retention policy

Old backups are automatically deleted after each backup run:

| Backup type | Kept | Deleted after |
|-------------|------|---------------|
| Daily schema backups | 14 most recent | Older than 14 days |
| Weekly schema backups (Sundays) | 8 most recent | Older than 8 weeks |
| Daily data backups | 14 most recent | Older than 14 days |
| Weekly data backups (Sundays) | 8 most recent | Older than 8 weeks |
| Storage archives | 7 most recent | Beyond 7 copies |

**How weekly detection works:** Any backup taken on a Sunday is classified as a "weekly" backup and subject to the longer 8-week retention. Daily and weekly retention are tracked independently, so both can coexist.

> Offsite retention (files stored in Cloudflare R2) must be managed separately via R2 Lifecycle Rules in the Cloudflare dashboard. Recommended setting: 90-day expiry on the `database-backups/` prefix.

### What happens after a backup is created

1. The `.sql.gz` file is written to `backups/database/` locally
2. If remote storage env vars are configured, the file is uploaded to the `database-backups/` prefix in R2 or S3
3. The retention policy runs and removes any backups older than the allowed limits
4. All steps are logged to `logs/backup.log` with timestamps and file sizes

---

## 4. Storage and Offsite Backup

### Local storage

Backups are written to the `backups/` directory inside the project root, organised by type:

| Directory | Contents |
|-----------|----------|
| `backups/schema/` | SQL DDL files — table structure, indexes, constraints |
| `backups/database/` | SQL INSERT files — all table data |
| `backups/storage/` | `.tar.gz` archives of `uploads/`, plus R2 inventory JSON |

On Vercel (serverless), the scripts write to `/tmp/` which is ephemeral — the file is discarded after the function completes, so the offsite upload to R2 is the only durable copy in that environment.

### Remote / offsite upload

After creating each local file, the backup script uploads it to a remote object storage bucket. Both schema and data backups are uploaded separately:

| Backup type | Remote prefix |
|-------------|---------------|
| Schema backups | `schema-backups/` |
| Data backups | `database-backups/` |

Two providers are supported, tried in this order:

**1. Cloudflare R2 (preferred)**

Set these environment variables to enable R2 offsite backups:

```
CLOUDFLARE_R2_ACCOUNT_ID      Your Cloudflare account ID
CLOUDFLARE_R2_ACCESS_KEY      R2 access key (recommend a dedicated key for backups)
CLOUDFLARE_R2_SECRET_KEY      R2 secret key
CLOUDFLARE_R2_BACKUP_BUCKET   Name of the R2 bucket to store backups in
                               (can be the same bucket used for media, or a separate one)
```

**2. AWS S3 (fallback)**

If R2 env vars are not set, the script checks for AWS S3 credentials:

```
AWS_BACKUP_ACCESS_KEY_ID      AWS IAM access key
AWS_BACKUP_SECRET_ACCESS_KEY  AWS IAM secret key
AWS_BACKUP_BUCKET             S3 bucket name
AWS_BACKUP_REGION             AWS region (default: us-east-1)
```

**If neither is configured**, the backup still runs and saves locally, but a `WARN` message is written to the log indicating that no offsite copy was made. This is acceptable for local development but should be resolved for production.

### Required environment variables summary

| Variable | Required for | Where to set |
|----------|-------------|--------------|
| `DATABASE_URL` | All backups (database access) | Already required by the app |
| `CRON_SECRET` | Vercel Cron authentication | Vercel dashboard → Environment Variables |
| `CLOUDFLARE_R2_ACCOUNT_ID` | R2 offsite upload | Vercel dashboard |
| `CLOUDFLARE_R2_ACCESS_KEY` | R2 offsite upload | Vercel dashboard |
| `CLOUDFLARE_R2_SECRET_KEY` | R2 offsite upload | Vercel dashboard |
| `CLOUDFLARE_R2_BACKUP_BUCKET` | R2 offsite upload | Vercel dashboard |

---

## 5. Commands for Developers

### `npm run backup` — Full backup (schema + data)

```bash
npm run backup
```

**What it does:**
- Step 1: Connects to the database and exports the full schema (DDL) to `backups/schema/schema-YYYY-MM-DD-HH.sql.gz`
- Step 2: Exports all 20 tables as SQL INSERT statements to `backups/database/backup-YYYY-MM-DD-HH.sql.gz`
- Uploads both files to R2 or S3 if configured
- Applies retention on both schema and data backup directories
- Logs everything to `logs/backup.log`

**When to use it:**
- Before running a risky database migration (captures both structure and data)
- Before deploying a major code change
- On-demand at any time to create a fresh snapshot
- When verifying the backup system is functional

**Additional flags:**

```bash
# Preview what would be exported without writing any files
npm run backup:dry

# Export only one specific data table (schema export is skipped for targeted table runs)
npx tsx scripts/backup.ts --table=templates

# Skip the offsite upload (write locally only)
npx tsx scripts/backup.ts --skip-offsite
```

---

### `npm run backup:schema` — Schema-only backup

```bash
npm run backup:schema
```

**What it does:**
- Queries the PostgreSQL catalog (`pg_catalog`, `information_schema`) to extract the live database structure
- Generates `CREATE TABLE`, `CREATE INDEX`, `ALTER TABLE ADD CONSTRAINT`, sequence, and extension statements
- Compresses the output to `backups/schema/schema-YYYY-MM-DD-HH.sql.gz`
- Uploads to R2/S3 under `schema-backups/` if configured
- Contains **no data** — only structure

**When to use it:**
- After a migration to capture the updated schema
- Before experimenting with schema changes on a dev database
- Standalone: when you only need structure without exporting all data
- To verify the current live schema matches what you expect

**Additional flags:**

```bash
# Preview without writing files
npm run backup:schema:dry

# Skip offsite upload
npx tsx scripts/backup-schema.ts --skip-offsite
```

---

### `npm run backup:storage` — Media file backup

```bash
npm run backup:storage
```

**What it does:**
- Compresses the entire `uploads/` directory into `backups/storage/storage-YYYY-MM-DD.tar.gz`
- Connects to Cloudflare R2 and generates an inventory of all stored objects (saved as `r2-inventory-YYYY-MM-DD.json`)
- Applies retention (keeps the 7 most recent archives)
- Logs to `logs/backup.log`

**When to use it:**
- Periodically to ensure local media files are archived (weekly is sufficient for most cases)
- Before storage migrations or changes to file-serving infrastructure
- To verify what files exist in R2

**Additional flags:**

```bash
# Preview without writing any files
npx tsx scripts/backup-storage.ts --dry-run

# Skip local uploads, generate R2 inventory only
npx tsx scripts/backup-storage.ts --skip-local
```

---

### `npm run restore` — Restore database from backup

```bash
npm run restore -- --file backups/database/backup-2026-03-15-02.sql.gz
```

**What it does:**
- Parses the compressed backup file
- Runs a safety check — any statement containing `DROP`, `TRUNCATE`, or `DELETE FROM` is rejected and will not execute
- Displays a summary of what will be restored and asks for confirmation
- Executes all approved `INSERT` statements inside a single database transaction
- If any statement fails fatally, the entire transaction is rolled back — the database is left unchanged

**When to use it:**
- To recover from accidental data deletion
- After a catastrophic failure (see [Disaster Recovery Scenario](#10-disaster-recovery-scenario))
- To restore a specific table after a bad migration

**Additional flags:**

```bash
# List all available backup files
npm run restore:list

# Preview all statements without executing anything (safe to run anytime)
npx tsx scripts/restore.ts --file backup-2026-03-15-02.sql.gz --dry-run

# Restore only specific tables
npx tsx scripts/restore.ts \
  --file backup-2026-03-15-02.sql.gz \
  --tables=templates,rsvps
```

---

## 6. Restore Process

### Before restoring

1. **Identify the problem first** — understand which data is missing or corrupted and when it happened. This determines which backup to restore from.
2. **Find the right backup** using `npm run restore:list`. Choose the most recent backup that predates the data loss event. Look for a matching schema backup with the same timestamp in `backups/schema/`.
3. **Do a dry run first** — always run the data restore with `--dry-run` before executing. This shows every statement that will run without touching the database.
4. **Consider restoring only the affected tables** — if only RSVPs were affected, use `--tables=rsvps` to avoid overwriting unrelated data.

### Step-by-step restore

**Step 1 — Restore the schema (if tables are missing or structure is corrupted)**

If the database tables still exist and only data is missing, skip this step and go directly to Step 2.

If the schema needs to be restored (empty database after `npm run db:migrate` failed, or tables were dropped), decompress the schema backup and pipe it into `psql`:

```bash
# Decompress the schema backup
gzip -d -k backups/schema/schema-2026-03-15-02.sql.gz -c > /tmp/schema.sql

# On Windows (PowerShell)
$bytes = [System.IO.File]::ReadAllBytes('backups\schema\schema-2026-03-15-02.sql.gz')
$ms = [System.IO.MemoryStream]::new($bytes)
$gz = [System.IO.Compression.GzipStream]::new($ms, [System.IO.Compression.CompressionMode]::Decompress)
$sr = [System.IO.StreamReader]::new($gz)
$sr.ReadToEnd() | Set-Content /tmp/schema.sql

# Restore schema into database
psql $env:DATABASE_URL -f /tmp/schema.sql
```

The schema file contains `CREATE TABLE IF NOT EXISTS` and `ADD CONSTRAINT IF NOT EXISTS` statements, so it is safe to run even if some tables already exist.

**Step 2 — List available data backups**

```bash
npm run restore:list
```

Output example:
```
Available database backups:

  backup-2026-03-15-02.sql.gz   (0.09 MB)
  backup-2026-03-14-02.sql.gz   (0.09 MB)
  backup-2026-03-13-02.sql.gz   (0.09 MB)

To restore: tsx scripts/restore.ts --file backup-2026-03-15-02.sql.gz
```

**Step 3 — Preview the data restore (dry run)**

```bash
npx tsx scripts/restore.ts \
  --file backup-2026-03-15-02.sql.gz \
  --dry-run
```

Review the output. Confirm the statement count looks reasonable and that no unexpected tables are included.

**Step 4 — Run the data restore**

```bash
npm run restore -- --file backup-2026-03-15-02.sql.gz
```

The script shows a confirmation prompt:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Backup file : backup-2026-03-15-02.sql.gz (0.09 MB)
  Insert rows : 1373
  Tables      : all
  Database    : postgresql://***@***.neon.tech/neondb
  Mode        : INSERT with ON CONFLICT DO NOTHING (safe, non-destructive)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  Proceed with restore? [yes/no]:
```

Type `yes` and press Enter to continue.

**Step 5 — Verify the result**

After restore, check that the expected data is present:
- Log into the admin panel and verify templates are present
- Check that RSVPs appear for the affected template
- Review `logs/restore.log` for any warnings

### Restoring from a remote R2 backup

If the local `backups/` directory is unavailable (e.g., server was lost), download the file from R2 first:

```bash
# Using AWS CLI configured with your R2 credentials
aws s3 cp s3://<bucket-name>/database-backups/backup-2026-03-15-02.sql.gz ./restore.sql.gz \
  --endpoint-url https://<CLOUDFLARE_ACCOUNT_ID>.r2.cloudflarestorage.com

# Then restore from the downloaded file
npx tsx scripts/restore.ts --file ./restore.sql.gz
```

### Why restore is safe to run against a live database

The restore script uses `INSERT ... ON CONFLICT DO NOTHING`. This means:
- Rows that already exist (same primary key) are **skipped silently**
- No existing data is modified or deleted
- Running restore twice has no ill effect
- You can safely restore to a running production database

---

## 7. Logging and Monitoring

### Log file locations

| Log file | Contents |
|----------|----------|
| `logs/backup.log` | All backup activity: database exports, storage archives, offsite uploads, retention deletions |
| `logs/restore.log` | All restore activity: file parsing, statement counts, execution results, warnings |

Both files are appended to (never overwritten), so they accumulate a full history.

### What is logged

Every log entry has this format:
```
[2026-03-15T02:00:01.234Z] [INFO] Starting database backup...
[2026-03-15T02:00:01.850Z] [INFO] Database connection established.
[2026-03-15T02:00:02.100Z] [INFO]   Exporting table: templates
[2026-03-15T02:00:08.432Z] [INFO] ✅ Backup written: backups/database/backup-2026-03-15-02.sql.gz (0.089 MB)
[2026-03-15T02:00:09.001Z] [INFO] ✅ Offsite upload complete: my-bucket/database-backups/backup-2026-03-15-02.sql.gz
[2026-03-15T02:00:09.100Z] [INFO] Retention check: kept 14 daily, 4 weekly backups.
[2026-03-15T02:00:09.200Z] [INFO] Database backup complete.
```

Each entry records:
- **Timestamp** in ISO 8601 UTC format
- **Level**: `INFO`, `WARN`, or `ERROR`
- **Component** (`[restore]` prefix added for restore logs)
- **Message**: description of the action or error

### Verifying backups ran on Vercel

1. Go to the **Vercel dashboard** → your project → **Deployments** → **Cron Jobs** tab
2. Each cron execution shows the HTTP status code and response
3. A `200` response with `"success": true` confirms the backup completed
4. The response body also includes `filename`, `sizeMB`, `tables`, and `offsite` fields

---

## 8. Failure Handling

### What happens if a backup fails

The backup scripts exit with a non-zero exit code and write an `[ERROR]` entry to `logs/backup.log`. The Vercel Cron job will show a non-`200` response in its dashboard, which makes failures visible.

The system does **not** have automatic retry logic — if a backup fails, the next automatic attempt will be 24 hours later. For critical situations, run `npm run backup` manually to force an immediate retry.

### Common failure causes and fixes

| Error message | Likely cause | Fix |
|--------------|-------------|-----|
| `DATABASE_URL environment variable is not set` | Missing env var | Add `DATABASE_URL` to `.env` or Vercel environment variables |
| `Cannot connect to database` | Network issue or wrong URL | Verify `DATABASE_URL` is correct and the database is reachable |
| `Table "xyz" not found in public schema, skipping` | Table doesn't exist in this DB | Update `TABLES_TO_BACKUP` in `scripts/backup.ts` if schema changed |
| `R2 upload failed` | Wrong R2 credentials or bucket doesn't exist | Verify `CLOUDFLARE_R2_*` env vars and that the bucket exists |
| `CRON_SECRET not configured` | Missing Vercel env var | Add `CRON_SECRET` to Vercel project settings |

### What to check when a backup fails

1. Read `logs/backup.log` — the `[ERROR]` line explains what went wrong
2. Verify environment variables are set correctly (`npm run dev` and check `/api/env-check`)
3. Test database connectivity: `npx tsx -e "import pg from 'pg'; const p = new pg.Pool({connectionString: process.env.DATABASE_URL}); p.query('SELECT 1').then(() => { console.log('OK'); p.end(); })"`
4. Run the backup manually to see live output: `npm run backup:dry`

---

## 9. Safety Rules

The backup system was designed with strict safety constraints to ensure it can never accidentally harm the platform.

### Backups are strictly read-only

The backup scripts only execute `SELECT` queries against the database. They never issue `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, or any data-modifying statement during the backup phase. The database is treated as read-only throughout the entire export.

### Restore is non-destructive by design

The restore script uses `INSERT ... ON CONFLICT DO NOTHING`. This is intentional:
- Existing rows are never overwritten
- No `TRUNCATE` or `DELETE` is ever issued
- The only effect is adding rows that are missing
- Running restore on a fully intact database is a no-op

### Unsafe statements are rejected

The restore script contains a safety filter that inspects every line of the backup file before execution. Any line matching these patterns is **rejected** and will never be executed:

- `DROP` (any form)
- `TRUNCATE`
- `DELETE FROM`
- `ALTER TABLE ... DROP`

Rejected statements are logged as `[WARN]` entries so you can audit them.

### No application code was modified

Implementing the backup system required no changes to:
- Any React component or frontend code
- Any existing API route logic
- Any database schema (no new tables, no column changes)
- Any Drizzle ORM models or Zod validation schemas
- Any existing middleware or authentication logic

The only changes to the existing codebase were:
1. Adding `import { registerCronBackupRoute }` and its call in `server/index.ts`
2. Adding `crons` and npm scripts to `vercel.json` and `package.json`
3. Adding `backups/` and `logs/` to `.gitignore`

---

## 10. Disaster Recovery Scenario

### Scenario: The database is unrecoverable

This is the worst-case scenario — the database is either deleted, fully corrupted, or the Neon project is lost. Here is the complete recovery procedure.

---

**Step 1 — Provision a new database**

Create a new PostgreSQL database. Neon (already used by this project) is recommended:
1. Go to [neon.tech](https://neon.tech) and create a new project
2. Copy the connection string (`DATABASE_URL`)

---

**Step 2 — Update environment variables**

Update `DATABASE_URL` in:
- Your local `.env` file (for running restore locally)
- Vercel project settings (for production)

---

**Step 3 — Restore the schema**

Instead of running `npm run db:migrate` (which requires the Drizzle migration files), restore the schema from the backup. This recreates all tables, indexes, foreign keys, and sequences exactly as they were at backup time.

```bash
# Option A: Restore schema from backup (preferred — exact match to production state)
gzip -d -c backups/schema/schema-2026-03-15-02.sql.gz | psql <new-DATABASE_URL>

# Option B: Fallback — run Drizzle migrations (use if schema backup is unavailable)
npm run db:migrate
```

If you are on Windows without `psql` installed, use the PowerShell approach:
```powershell
$gz = [System.IO.Compression.GzipFile]::OpenRead('backups\schema\schema-2026-03-15-02.sql.gz')
$sr = [System.IO.StreamReader]::new($gz)
$sql = $sr.ReadToEnd()
$sr.Dispose(); $gz.Dispose()
# Then pipe $sql to psql or paste into a SQL client
$sql | psql $env:DATABASE_URL
```

---

**Step 4 — Download the latest backup**

If you have local copies in `backups/schema/` and `backups/database/`, use them directly.

If the server was lost and local files are gone, download both from R2:

```bash
# List available backups in R2
aws s3 ls s3://<BACKUP_BUCKET>/schema-backups/ \
  --endpoint-url https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com

aws s3 ls s3://<BACKUP_BUCKET>/database-backups/ \
  --endpoint-url https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com

# Download the most recent schema and data backups (same timestamp is a matched pair)
aws s3 cp s3://<BACKUP_BUCKET>/schema-backups/schema-2026-03-15-02.sql.gz ./recovery-schema.sql.gz \
  --endpoint-url https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com

aws s3 cp s3://<BACKUP_BUCKET>/database-backups/backup-2026-03-15-02.sql.gz ./recovery-data.sql.gz \
  --endpoint-url https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com
```

---

**Step 5 — Preview the data restore**

```bash
npx tsx scripts/restore.ts --file ./recovery-data.sql.gz --dry-run
```

Confirm the row counts look correct (you should see thousands of rows across translations, templates, rsvps, etc.).

---

**Step 6 — Execute the data restore**

```bash
npx tsx scripts/restore.ts --file ./recovery-data.sql.gz
```

Type `yes` when prompted.

---

**Step 7 — Verify critical data**

After restore, spot-check:
```bash
# Quick verification (requires psql or similar)
SELECT COUNT(*) FROM templates;          -- Should match what you saw pre-incident
SELECT COUNT(*) FROM rsvps;              -- Guest RSVPs restored
SELECT COUNT(*) FROM management_users;  -- User accounts restored

-- Verify schema is intact
\dt public.*   -- Should list all 20 tables
\di public.*   -- Should list all indexes
```

Or log into the application admin panel and verify:
- Wedding templates are visible
- RSVP lists are intact
- User accounts can log in

---

**Step 8 — Redeploy the application**

```bash
npm run deploy:production
```

The application will reconnect to the restored database automatically.

---

**Step 9 — Restore media files (if needed)**

If uploaded images or audio were stored locally in `uploads/` and that directory is lost:

```bash
# Extract the most recent storage archive
tar -xzf backups/storage/storage-2026-03-15.tar.gz
# 'uploads/' will be recreated in the current directory
```

If files were in Cloudflare R2, they are likely still there (R2 has independent redundancy). Check the R2 inventory file to confirm:
```bash
cat backups/storage/r2-inventory-2026-03-15.json | grep totalObjects
```

---

**Expected total recovery time:** 30–60 minutes for a full database restore, depending on database size and network speed.

---

## 11. Maintenance

### Recommended maintenance tasks

#### Weekly — Verify recent backups exist

```bash
npm run restore:list
```

Confirm that backup files from the last 7 days are present. If the most recent file is more than 48 hours old, the automated cron may have failed. Check the Vercel Cron dashboard and `logs/backup.log`.

#### Weekly — Verify a backup is parseable

```bash
# Replace the filename with the most recent one from restore:list
npx tsx scripts/restore.ts \
  --file backups/database/backup-YYYY-MM-DD-HH.sql.gz \
  --dry-run
```

A healthy backup will report something like:
```
Statements: 1415 safe, 0 skipped, 0 rejected
Will execute 1373 INSERT statements.
```

If you see `0 INSERT statements` or many `rejected` statements, the backup file may be corrupt. Run `npm run backup` immediately to create a fresh copy.

#### Monthly — Verify gzip integrity

```bash
# On macOS/Linux
gzip -t backups/database/backup-*.sql.gz && echo "All backups: OK"

# On Windows (PowerShell)
Get-ChildItem backups\database\*.sql.gz | ForEach-Object {
  try { $null = [System.IO.Compression.GzipStream]::new([System.IO.File]::OpenRead($_.FullName), [System.IO.Compression.CompressionMode]::Decompress); Write-Host "OK: $($_.Name)" }
  catch { Write-Warning "CORRUPT: $($_.Name)" }
}
```

#### Monthly — Check disk space

Backups accumulate over time. Each backup file is approximately 100 KB–5 MB depending on database size. At 14 daily + 8 weekly this is roughly 22 files at peak. Monitor `backups/` directory size:

```bash
# On Windows (PowerShell)
Get-ChildItem backups\ -Recurse | Measure-Object -Property Length -Sum |
  Select-Object @{n='Total MB';e={[math]::Round($_.Sum/1MB, 2)}}
```

#### Quarterly — Test a full restore to a staging database

To confirm the restore process actually works end-to-end, restore a recent backup to the staging environment:

```bash
# Set staging DATABASE_URL temporarily
$env:DATABASE_URL = "<staging-connection-string>"

# Run restore against staging
npx tsx scripts/restore.ts \
  --file backups/database/backup-$(Get-Date -Format 'yyyy-MM-dd')-02.sql.gz
```

Verify the staging environment reflects the restored data, then reset the staging environment when done.

### Cleaning old backups manually

The retention policy runs automatically after each backup. If you need to clean manually:

```bash
# On Windows (PowerShell) — remove backups older than 30 days
Get-ChildItem backups\database\*.sql.gz |
  Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } |
  Remove-Item -WhatIf   # Remove -WhatIf to actually delete
```

### Checking for cron job health on Vercel

1. Open the [Vercel dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Cron Jobs**
4. Review the execution history — each entry shows the HTTP status, response time, and whether it succeeded
5. A `200` with `"success": true` in the response body means the backup completed correctly

If cron jobs show failures consistently, check:
- Is `CRON_SECRET` set in Vercel environment variables?
- Is `DATABASE_URL` still valid (Neon databases have connection limits)?
- Are the `CLOUDFLARE_R2_*` variables still correct?
