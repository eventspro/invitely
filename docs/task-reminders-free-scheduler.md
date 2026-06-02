# Task Reminders — Free Scheduler Setup

## 1. Why Vercel Hobby cron cannot be used for every-minute reminders

Vercel Hobby (free) plan restricts cron jobs to **at most once per day**. Wedding planner
task reminders must fire at specific times throughout the day — sometimes every minute, or
every 10–60 minutes per task. A once-per-day trigger is completely unusable for this.

Adding `"schedule": "* * * * *"` to `vercel.json` causes the Vercel deployment to **fail**
with a plan restriction error. There is no workaround within Hobby.

---

## 2. Why the frequent cron entry was removed from `vercel.json`

The entry below was removed:

```json
{
  "path": "/api/cron/task-reminders",
  "schedule": "* * * * *"
}
```

This was the cause of all deployment failures on Hobby. Vercel rejects it at build time.
Only the existing daily backup cron (`0 2 * * *`) is kept in `vercel.json`, which is within
Hobby's allowed limits.

---

## 3. Why the endpoint itself remains

Removing the Vercel cron entry does **not** remove the backend functionality. The route:

```
GET  /api/cron/task-reminders
POST /api/cron/task-reminders
```

remains fully deployed on Vercel. It will be triggered by **external** free cron services
instead of Vercel's built-in cron. The endpoint does not care who calls it.

---

## 4. How external cron works

```
[cron-job.org]     every 1 min  ──┐
[GitHub Actions]   every 5 min  ──┼──▶  POST /api/cron/task-reminders
                                  │
                          ┌───────▼──────────────────────────────────────┐
                          │  processReminders()                           │
                          │  • query: nextReminderAtUtc <= now            │
                          │  • atomic claim to prevent duplicate sends    │
                          │  • send Telegram message + Done/Stop buttons  │
                          │  • retry with backoff on Telegram failure     │
                          │  • update cron_health table                   │
                          └──────────────────────────────────────────────┘
```

Two services run at different intervals so that if one is temporarily down the other
catches up within 5 minutes.

---

## 5. How overdue reminder catch-up works

The query condition is:

```sql
next_reminder_at_utc <= NOW()
```

This means **all** reminders that became due while cron was down are processed on the
next successful run. Example:

| Time  | Event |
|-------|-------|
| 15:00 | Task was due |
| 14:59 | cron-job.org went down |
| 15:08 | cron-job.org came back up |
| 15:09 | endpoint called — task processed and Telegram sent |

The reminder was 9 minutes late but **not silently missed**. Overdue catch-up is automatic.

---

## 6. Why duplicate external calls are safe

Two services calling the endpoint at the same second cannot send two Telegram messages
for the same task because of the **atomic claim** pattern:

```sql
UPDATE planner_tasks
SET last_reminder_sent_at = NOW()
WHERE id = ?
  AND (last_reminder_sent_at IS NULL OR last_reminder_sent_at < NOW() - INTERVAL '50 seconds')
```

If two DB connections race on the same task, only one wins. The other sees 0 rows updated
and skips that task. This is safe against:

- Two cron services firing in the same second
- cron-job.org retrying after a timeout
- GitHub Actions running slightly early or late

The **50-second duplicate guard** (`DUPLICATE_GUARD_SECONDS = 50`) also prevents
re-processing a task that was just handled less than a minute ago.

---

## 7. How to configure cron-job.org (primary — every 1 minute)

1. Create a free account at **https://cron-job.org**
2. Click **Create cronjob**
3. Fill in:

| Field | Value |
|-------|-------|
| Title | invitely task-reminders |
| URL | `https://4ever.am/api/cron/task-reminders` |
| Schedule | Every 1 minute |
| Request method | GET (or POST) |
| Request headers | `Authorization: Bearer YOUR_CRON_SECRET` |

> **Alternative** (if headers are not supported): use the query param URL:
> `https://4ever.am/api/cron/task-reminders?secret=YOUR_CRON_SECRET`

4. Save and enable the job.
5. After the first run, verify health:

```
GET https://4ever.am/api/cron/task-reminders/health?secret=YOUR_CRON_SECRET
```

Expected response includes `"healthy": true` and `"status": "healthy"` within the
first 5 minutes of the job running.

---

## 8. How to configure GitHub Actions backup (every 5 minutes)

GitHub Actions is a **backup only**. Its schedule timing is not guaranteed — GitHub may
delay scheduled workflows by several minutes under load. It serves as a catch-up safety
net if cron-job.org is temporarily down.

> **Do not add this file without explicit approval.**

Create `.github/workflows/task-reminders-backup-cron.yml`:

```yaml
name: Task reminders backup cron

on:
  schedule:
    - cron: "*/5 * * * *"
  workflow_dispatch:

jobs:
  ping-task-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger task reminders
        run: |
          curl -fsS \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            "https://4ever.am/api/cron/task-reminders"
```

Add the secret to GitHub: **Settings → Secrets and variables → Actions → New repository
secret**, name `CRON_SECRET`, value: same secret as in Vercel.

---

## 9. How to check the health endpoint

```
GET /api/cron/task-reminders/health?secret=YOUR_CRON_SECRET
```

or with header:

```
Authorization: Bearer YOUR_CRON_SECRET
GET /api/cron/task-reminders/health
```

Response when healthy:

```json
{
  "ok": true,
  "jobName": "task-reminders",
  "healthy": true,
  "status": "healthy",
  "lastRunAt": "2026-06-03T10:00:00.000Z",
  "lastSuccessAt": "2026-06-03T10:00:00.000Z",
  "minutesSinceLastSuccess": 0.8,
  "lastProcessedCount": 4,
  "lastSentCount": 2,
  "lastFailedCount": 0,
  "lastSkippedCount": 1,
  "lastRetryingCount": 1,
  "lastError": null
}
```

| `status` | Meaning |
|----------|---------|
| `"healthy"` | Last success within 5 minutes |
| `"warning"` | Last success 5–10 minutes ago |
| `"unhealthy"` | Last success > 10 minutes ago, or no runs yet |

---

## 10. Limitations of the free setup

| Limitation | Impact |
|------------|--------|
| cron-job.org free tier rate limits | None expected for 1 request/min |
| GitHub Actions schedule delay | Up to ~10 min under load — acceptable as backup |
| Vercel Hobby cold start | +1–3 s on first request after idle period |
| Batch limit of 20 per run | If > 20 reminders are due, excess processed on next run (~1 min later) |
| Telegram API rate limits | Unlikely at current user counts; monitor if > 500 active users |
| Both external crons down simultaneously | Reminders queue; all sent on next successful run |

Small delays are acceptable per design. Silent missed reminders are not acceptable, which
is why overdue catch-up with `nextReminderAtUtc <= now` is critical.

---

## 11. Future upgrade options

| Option | When to consider |
|--------|-----------------|
| Vercel Pro plan | When revenue justifies cost; enables Vercel-native minute-level cron |
| Dedicated worker (Fly.io free tier) | If external cron reliability becomes a concern |
| BullMQ / Redis queue | If task volume grows to thousands per day |
| Multiple cron-job.org jobs (staggered) | Immediate free improvement — add a second job at 30-second offset |

---

## 12. What the owner must do manually (step by step)

### A. Before first deployment

1. **Confirm `CRON_SECRET` is set in Vercel**
   - Go to [vercel.com](https://vercel.com) → your project → Settings → Environment Variables
   - Add `CRON_SECRET` with a long random value (e.g. `openssl rand -hex 32`)
   - Make sure it's enabled for Production environment

2. **Deploy the fixed code**
   - Push the latest commits to `main`
   - Wait for Vercel to finish deployment (no cron errors should appear)

### B. Verify the endpoint is live

3. **Test unauthorized access (expect 401):**

```bash
curl -s https://4ever.am/api/cron/task-reminders
# Expected: {"ok":false,"error":"Unauthorized"}
```

4. **Test authorized access via query param (expect 200):**

```bash
curl -s "https://4ever.am/api/cron/task-reminders?secret=YOUR_CRON_SECRET"
# Expected: {"ok":true,"processed":0,"sent":0,"failed":0,"skipped":0,"retrying":0}
```

5. **Test authorized access via header (expect 200):**

```bash
curl -s -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://4ever.am/api/cron/task-reminders
# Expected: {"ok":true,...}
```

### C. Set up cron-job.org

6. Create a free account at **https://cron-job.org**
7. Create a new cron job:
   - **Title:** invitely task-reminders
   - **URL:** `https://4ever.am/api/cron/task-reminders`
   - **Schedule:** Every 1 minute
   - **Method:** GET
   - **Header:** `Authorization: Bearer YOUR_CRON_SECRET`
     *(or use the `?secret=` URL if headers are not supported)*
8. Enable the job and click **Run now** (manual trigger)

### D. Verify health tracking

9. **Check health endpoint after first run:**

```bash
curl -s "https://4ever.am/api/cron/task-reminders/health?secret=YOUR_CRON_SECRET"
# Expected: {"ok":true,"healthy":true,"status":"healthy",...}
```

If `healthy` is `false`, wait 1–2 minutes for cron-job.org to fire again.

### E. End-to-end test

10. **Create a test task in the planner** with a reminder set 2–3 minutes in the future.
    Make sure Telegram is connected for that user panel.

11. **Wait for the reminder time** and confirm the Telegram message arrives (with Done and
    Stop reminders buttons).

12. **Click Done** on the message and confirm:
    - Task status changes to `done` in the planner
    - No further Telegram reminders arrive

13. **Create another test task** and when the reminder fires, **click Stop reminders**:
    - Task status should remain `pending` in the planner
    - No further Telegram reminders arrive for that task

---

## Environment variables reference

| Variable | Where to set | Description |
|----------|-------------|-------------|
| `CRON_SECRET` | Vercel env vars + cron-job.org header + GitHub Actions secret | Shared secret for cron endpoint auth |
| `TELEGRAM_BOT_TOKEN` | Vercel env vars | Telegram Bot API token |

Both must be set in Vercel Production environment. `CRON_SECRET` must also be added to
cron-job.org (as a header value) and optionally to GitHub Actions secrets.
