# Disaster Recovery Guide — Invitely Platform

> Last updated: 2025  
> Applies to: Production + Staging deployments

---

## Table of Contents

1. [Overview](#overview)
2. [Backup System Architecture](#backup-system-architecture)
3. [Environment Variables Required](#environment-variables-required)
4. [Running Backups Manually](#running-backups-manually)
5. [Automated Backups (Vercel Cron)](#automated-backups-vercel-cron)
6. [Backup File Locations](#backup-file-locations)
7. [Restore Procedures](#restore-procedures)
8. [Retention Policy](#retention-policy)
9. [Recovery Time Objectives (RTO/RPO)](#recovery-time-objectives-rtorpo)
10. [Incident Response Checklist](#incident-response-checklist)
11. [Testing the Backup System](#testing-the-backup-system)

---

## Overview

Invitely uses a **multi-layer backup strategy**:

| Layer | What | Where | Retention |
|-------|------|--------|-----------|
| Database | All PostgreSQL tables as SQL INSERT dumps | Local `backups/database/` + Cloudflare R2 | 14 daily, 8 weekly |
| Media (local) | `uploads/` directory | Local `backups/storage/` as `.tar.gz` | 7 copies |
| Media (R2) | Cloudflare R2 object inventory | `backups/storage/r2-inventory-*.json` | 7 copies |

Key design decisions:
- **Read-only operations** — backups only SELECT data; no DROP/TRUNCATE ever runs
- **`ON CONFLICT DO NOTHING`** — restore is idempotent; safe to run against live DB
- **Programmatic SQL export** — works in serverless (Neon/Vercel) without `pg_dump` binary
- **Offsite upload** — backup files are pushed to Cloudflare R2 for durability

---

## Backup System Architecture

```
scripts/backup.ts         ← npm run backup
  ├── Connects to DATABASE_URL (PostgreSQL/Neon)
  ├── SELECT-exports 20 tables as INSERT statements
  ├── Gzips output → backups/database/backup-YYYY-MM-DD-HH.sql.gz
  ├── Uploads to Cloudflare R2 (database-backups/ prefix)
  └── Applies retention (delete oldest > 14 daily, 8 weekly)

scripts/backup-storage.ts ← npm run backup:storage
  ├── Archives uploads/ → backups/storage/storage-YYYY-MM-DD.tar.gz
  ├── Lists Cloudflare R2 bucket → r2-inventory-YYYY-MM-DD.json
  └── Applies retention (keeps 7 archives)

scripts/restore.ts        ← npm run restore
  ├── Parses .sql.gz backup file
  ├── Safety filter: rejects DROP/TRUNCATE/DELETE statements
  ├── Shows confirmation prompt before executing
  └── Executes INSERT statements within a transaction

server/routes/cron-backup.ts ← POST /api/cron/backup (Vercel Cron)
  ├── Runs every night at 02:00 UTC
  ├── Authenticated via BACKUP_CRON_SECRET bearer token
  ├── Writes to /tmp, then uploads to R2
  └── Returns JSON result for Vercel dashboard visibility
```

---

## Environment Variables Required

### Required for backups to run

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (already required by app) |

### Required for offsite upload (at least one set)

| Variable | Description |
|----------|-------------|
| `CLOUDFLARE_R2_ACCOUNT_ID` | Cloudflare account ID |
| `CLOUDFLARE_R2_ACCESS_KEY` | R2 access key (recommend dedicated backup key) |
| `CLOUDFLARE_R2_SECRET_KEY` | R2 secret key |
| `CLOUDFLARE_R2_BACKUP_BUCKET` | Target R2 bucket name for backups (can differ from main media bucket) |

OR (AWS S3 fallback):

| Variable | Description |
|----------|-------------|
| `AWS_BACKUP_ACCESS_KEY_ID` | AWS access key ID |
| `AWS_BACKUP_SECRET_ACCESS_KEY` | AWS secret key |
| `AWS_BACKUP_BUCKET` | S3 bucket name for backups |
| `AWS_BACKUP_REGION` | AWS region (default: `us-east-1`) |

### Required for Vercel Cron authentication

| Variable | Description |
|----------|-------------|
| `BACKUP_CRON_SECRET` | Secret bearer token; set same value in Vercel env vars and your Vercel Cron config |

---

## Running Backups Manually

```bash
# Full database backup (all 20 tables)
npm run backup

# Dry run — shows what would be exported, no files written
npm run backup:dry

# Backup specific table only
tsx scripts/backup.ts --table=templates

# Skip offsite upload (local only)
tsx scripts/backup.ts --skip-offsite

# Media/storage backup
npm run backup:storage

# Storage dry run
tsx scripts/backup-storage.ts --dry-run
```

Backups are written to:
- `backups/database/backup-YYYY-MM-DD-HH.sql.gz`
- `backups/storage/storage-YYYY-MM-DD.tar.gz`

Logs are appended to `logs/backup.log`.

---

## Automated Backups (Vercel Cron)

Configured in `vercel.json`:

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

This triggers a POST to `/api/cron/backup` every day at **02:00 UTC**.

The endpoint:
1. Authenticates via `Authorization: Bearer <BACKUP_CRON_SECRET>`
2. Exports all critical tables
3. Gzips and writes to `/tmp/` (serverless ephemeral storage)
4. Uploads the `.sql.gz` to Cloudflare R2 under `database-backups/`
5. Returns a JSON summary visible in Vercel's Cron dashboard

**To test the cron manually:**
```bash
curl -X POST https://your-production-domain.com/api/cron/backup \
  -H "Authorization: Bearer <BACKUP_CRON_SECRET>"
```

---

## Backup File Locations

### Local (development / staging)

```
backups/
├── database/
│   ├── backup-2025-06-10-02.sql.gz   ← Daily at 02:00 UTC
│   ├── backup-2025-06-09-02.sql.gz
│   └── ...
└── storage/
    ├── storage-2025-06-10.tar.gz
    ├── r2-inventory-2025-06-10.json  ← R2 object list
    └── ...

logs/
├── backup.log    ← DB + storage backup logs
└── restore.log   ← Restore operation logs
```

### Offsite (Cloudflare R2)

```
<bucket>/
└── database-backups/
    ├── backup-2025-06-10-02.sql.gz
    ├── backup-2025-06-09-02.sql.gz
    └── ...
```

---

## Restore Procedures

### ① List available backups

```bash
npm run restore:list
# or
tsx scripts/restore.ts --list
```

### ② Restore full database (recommended for disaster recovery)

```bash
npm run restore -- --file backups/database/backup-2025-06-10-02.sql.gz
```

You will see a summary and be prompted to type `yes` to confirm.

### ③ Restore specific tables only

```bash
tsx scripts/restore.ts \
  --file backups/database/backup-2025-06-10-02.sql.gz \
  --tables=templates,rsvps
```

### ④ Dry run (safe preview)

```bash
tsx scripts/restore.ts \
  --file backups/database/backup-2025-06-10-02.sql.gz \
  --dry-run
```

### ⑤ Restore from R2 backup

1. Download the file from R2 (via Cloudflare dashboard or `aws s3 cp` using the R2 credentials)
2. Run restore locally pointing at the downloaded file

```bash
# Using AWS CLI with R2 endpoint
aws s3 cp s3://<bucket>/database-backups/backup-2025-06-10-02.sql.gz ./backup.sql.gz \
  --endpoint-url https://<ACCOUNT_ID>.r2.cloudflarestorage.com

tsx scripts/restore.ts --file ./backup.sql.gz
```

### Safety guarantees

- The restore script **only executes** `INSERT ... ON CONFLICT DO NOTHING` statements
- Any `DROP`, `TRUNCATE`, or `DELETE FROM` statements found in the file are **rejected and logged**
- All inserts run inside a single **transaction** — if it fails, everything rolls back
- `--dry-run` mode shows all statements without executing any

---

## Retention Policy

| Backup type | Kept | Auto-deleted after |
|-------------|------|--------------------|
| Daily database | 14 | >14 days |
| Weekly database (Sundays) | 8 | >8 weeks |
| Storage archives | 7 | Beyond 7 copies |

Retention is applied automatically after each backup run.  
Offsite R2 retention must be configured via **R2 Lifecycle Rules** in the Cloudflare dashboard (recommended: 90-day object expiry on `database-backups/` prefix).

---

## Recovery Time Objectives (RTO/RPO)

| Metric | Target | Notes |
|--------|--------|-------|
| **RPO** (data loss window) | ≤ 24 hours | Automated daily backups at 02:00 UTC |
| **RTO** (recovery time) | ≤ 2 hours | Restore script + Vercel redeploy |
| **Database restore** | ~15–30 min | Depends on DB size |
| **Media restore** | Variable | From local archive or R2 re-sync |

To reduce RPO to < 1 hour, consider running `npm run backup` every 6 hours via external cron (GitHub Actions, cron-job.org, etc.).

---

## Incident Response Checklist

### Data corruption / accidental deletion

- [ ] 1. Identify affected tables and timeframe from `logs/backup.log`
- [ ] 2. Run `npm run restore:list` to find the most recent clean backup
- [ ] 3. Use `--dry-run` to preview what will be restored
- [ ] 4. Use `--tables=<table>` to restore only the affected table(s)
- [ ] 5. Verify data in production after restore
- [ ] 6. Document the incident in `incidents/resolved/`

### Complete database loss

- [ ] 1. Provision new PostgreSQL database (Neon or compatible)
- [ ] 2. Update `DATABASE_URL` environment variable
- [ ] 3. Run `npm run db:migrate` to recreate the schema
- [ ] 4. Download latest backup from R2 if local copy unavailable
- [ ] 5. Run `npm run restore -- --file <backup>`
- [ ] 6. Verify all critical data: templates, rsvps, orders, users
- [ ] 7. Redeploy to Vercel with updated env vars

### Media/image loss

- [ ] 1. Check if files are in Cloudflare R2 (primary storage)
- [ ] 2. If R2 was affected, restore from `backups/storage/*.tar.gz` to `uploads/`
- [ ] 3. Database `images` table records will still point to R2 URLs — re-upload files to match existing URLs if possible

---

## Testing the Backup System

### Verify backup creates a valid file

```bash
npm run backup -- --skip-offsite
ls -lh backups/database/
```

### Verify gzip is valid

```bash
gzip -t backups/database/backup-*.sql.gz && echo "✅ Valid gzip"
```

### Dry-run restore to confirm parsability

```bash
tsx scripts/restore.ts \
  --file backups/database/backup-$(date +%Y-%m-%d).sql.gz \
  --dry-run
```

### Full round-trip test (non-destructive)

Since restore uses `ON CONFLICT DO NOTHING`, running restore against the live DB is safe — it will simply skip rows that already exist. This can be used to verify the restore flow without standing up a separate DB.

```bash
# 1. Create backup
npm run backup -- --skip-offsite

# 2. Dry-run the restore
npm run restore -- --file backups/database/backup-$(date +%Y-%m-%d-%H).sql.gz --dry-run

# 3. (Optional) Full restore against live DB — idempotent, safe
npm run restore -- --file backups/database/backup-$(date +%Y-%m-%d-%H).sql.gz
# Type "yes" when prompted
```

---

## Contacts & Escalation

| Role | Responsibility |
|------|---------------|
| Platform Admin | Run restore procedures, manage R2 bucket |
| Developer On-Call | Debug restore failures, schema mismatches |

For critical incidents affecting customer data (RSVPs, wedding configs), prioritize restoring the `templates` and `rsvps` tables first.
