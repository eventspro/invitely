-- Migration 0005: cron job health tracking table
-- Used to monitor whether external cron services are successfully
-- calling /api/cron/task-reminders.

CREATE TABLE IF NOT EXISTS cron_health (
  id                  VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name            TEXT NOT NULL UNIQUE,
  last_run_at         TIMESTAMPTZ,
  last_success_at     TIMESTAMPTZ,
  last_error_at       TIMESTAMPTZ,
  last_error          TEXT,
  last_processed_count INTEGER NOT NULL DEFAULT 0,
  last_sent_count      INTEGER NOT NULL DEFAULT 0,
  last_failed_count    INTEGER NOT NULL DEFAULT 0,
  last_skipped_count   INTEGER NOT NULL DEFAULT 0,
  last_retrying_count  INTEGER NOT NULL DEFAULT 0,
  updated_at          TIMESTAMPTZ DEFAULT now()
);
