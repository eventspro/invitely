# Task Reminders — External Cron Setup

## Why Vercel's built-in cron is not used

Vercel Hobby (free) plan allows cron jobs that run **at most once per day**.  
Task reminders need to fire every **1 minute** so users receive timely notifications
(e.g. "call musicians at 15:00", "pay florist at 14:30").

A once-per-day trigger is useless for this feature.

The `* * * * *` cron entry has been **removed from `vercel.json`** to keep
Vercel Hobby deployments passing. The endpoint itself remains fully functional
and is triggered by free external cron services instead.

---

## Architecture

```
[cron-job.org]       every 1 min  ──┐
[GitHub Actions]     every 5 min  ──┼──▶  POST /api/cron/task-reminders
                                    │
                             ┌──────▼──────────────────────────────────┐
                             │  processReminders()                      │
                             │  • find overdue tasks (nextAt <= now)    │
                             │  • atomic claim (duplicate-safe)         │
                             │  • send Telegram message + buttons       │
                             │  • retry with backoff on failure         │
                             │  • update cron_health table              │
                             └─────────────────────────────────────────┘
```

Two services are used so that if one fails, the other catches up within 5 minutes.
The endpoint is **idempotent** — calling it twice in the same second is safe.

---

## Endpoint reference

### `GET /POST /api/cron/task-reminders`

Triggers a reminder processing run. Finds all tasks with `nextReminderAtUtc <= now`
and sends Telegram messages for each.

**Auth (required if `CRON_SECRET` env var is set):**

```
Authorization: Bearer YOUR_CRON_SECRET
```

or query param:

```
GET /api/cron/task-reminders?secret=YOUR_CRON_SECRET
```

**Success response:**

```json
{
  "ok": true,
  "processed": 3,
  "sent": 2,
  "failed": 0,
  "skipped": 0,
  "retrying": 1
}
```

**Unauthorized:**

```json
{ "ok": false, "error": "Unauthorized" }
```

---

### `GET /api/cron/task-reminders/health`

Returns health status of the reminder worker. Same auth as above.

**Response:**

```json
{
  "ok": true,
  "jobName": "task-reminders",
  "healthy": true,
  "lastRunAt": "2026-06-03T10:00:00.000Z",
  "lastSuccessAt": "2026-06-03T10:00:00.000Z",
  "minutesSinceLastSuccess": 0.8,
  "lastProcessedCount": 4,
  "lastSentCount": 2,
  "lastFailedCount": 0,
  "lastSkippedCount": 1,
  "lastError": null
}
```

`healthy: true` = last success within 5 minutes  
`warning: true` = last success 5–10 minutes ago  
`healthy: false` = last success > 10 minutes ago, or no runs yet

---

## Setting up cron-job.org (primary, every 1 minute)

1. Create a free account at **https://cron-job.org**
2. Click **Create cronjob**
3. Fill in:

| Field | Value |
|-------|-------|
| Title | invitely task-reminders |
| URL | `https://4ever.am/api/cron/task-reminders` |
| Schedule | Every 1 minute |
| Request method | GET (or POST) |
| Headers | `Authorization: Bearer YOUR_CRON_SECRET` |

4. Save and enable the job.
5. After the first run, verify with:

```
GET https://4ever.am/api/cron/task-reminders/health?secret=YOUR_CRON_SECRET
```

**Alternative (no headers support):** use the query param URL:

```
https://4ever.am/api/cron/task-reminders?secret=YOUR_CRON_SECRET
```

---

## Setting up GitHub Actions (backup, every 5 minutes)

Add the `CRON_SECRET` to your repository secrets:  
**Settings → Secrets and variables → Actions → New repository secret**  
Name: `CRON_SECRET`, Value: your secret.

Create the workflow file:

**`.github/workflows/task-reminders-backup-cron.yml`**

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

> Note: GitHub's scheduled workflows can be delayed by several minutes under load.
> They serve as a catch-up safety net, not a precise timer.

---

## Manual testing

**1. Unauthorized call should return 401:**
```sh
curl -s https://4ever.am/api/cron/task-reminders
# {"ok":false,"error":"Unauthorized"}
```

**2. Authorized via header:**
```sh
curl -s -H "Authorization: Bearer $CRON_SECRET" \
  https://4ever.am/api/cron/task-reminders
# {"ok":true,"processed":0,"sent":0,...}
```

**3. Authorized via query param:**
```sh
curl -s "https://4ever.am/api/cron/task-reminders?secret=$CRON_SECRET"
# {"ok":true,"processed":0,"sent":0,...}
```

**4. Health check:**
```sh
curl -s "https://4ever.am/api/cron/task-reminders/health?secret=$CRON_SECRET"
```

**5. Test overdue reminder catch-up:**  
Set a task's `next_reminder_at_utc` to 10 minutes in the past in the DB,
then call the endpoint. The task should be processed and a Telegram message sent.

---

## Expected delays and limitations

| Scenario | Expected delay |
|----------|---------------|
| Normal operation | < 1 minute (cron-job.org) |
| cron-job.org down, GH Actions backup | < 5 minutes |
| Both down simultaneously | Reminders queue until next run; overdue catch-up fires them all |
| Vercel cold start | +1–3 seconds on first invocation |

Reminders that were missed while cron was down will fire on the **next successful
call**, because the query uses `nextReminderAtUtc <= now` (not an exact match).

---

## Duplicate protection

The endpoint is safe to call multiple times simultaneously:

- Tasks are **atomically claimed** with a `lastReminderSentAt` update before sending.
- A 50-second **duplicate guard** prevents the same task being processed twice in under a minute.
- If two invocations race on the same task, only one will win the atomic claim; the other skips it.

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CRON_SECRET` | **Yes** | Shared secret for cron endpoint auth |
| `TELEGRAM_BOT_TOKEN` | Yes | Telegram Bot API token |

Set `CRON_SECRET` in:
- Vercel project settings → Environment Variables
- cron-job.org job headers
- GitHub Actions secrets
