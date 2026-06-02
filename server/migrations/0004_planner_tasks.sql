-- ============================================================
-- Migration 0004: planner_tasks, task_reminder_logs,
--                 telegram_callback_tokens
--
-- Run with:
--   psql $DATABASE_URL -f server/migrations/0004_planner_tasks.sql
-- Or paste into Neon SQL console.
-- ============================================================

-- planner_tasks: persistent task + reminder storage per customer
CREATE TABLE IF NOT EXISTS planner_tasks (
  id                      VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 VARCHAR NOT NULL REFERENCES management_users(id) ON DELETE CASCADE,
  template_id             VARCHAR NOT NULL REFERENCES templates(id)         ON DELETE CASCADE,
  title                   TEXT    NOT NULL,
  description             TEXT,
  priority                TEXT    NOT NULL DEFAULT 'medium',
    -- high | medium | low
  status                  TEXT    NOT NULL DEFAULT 'pending',
    -- pending | done | cancelled
    -- NOTE: 'stopped' is NOT a valid status. Reminder-stop state lives in telegram_reminder_state.
  due_at_utc              TIMESTAMPTZ,
    -- NULL = no reminder; computed from due_at_local + timezone at save time
  timezone                TEXT    NOT NULL DEFAULT 'Asia/Yerevan',
    -- stored for display and rescheduling, e.g. 'Asia/Yerevan', 'Europe/Moscow', 'UTC'
  reminder_enabled        BOOLEAN NOT NULL DEFAULT FALSE,
  repeat_interval_minutes INTEGER,
    -- NULL = no repeat; 10 | 30 | 60 | 120 | 1440
  telegram_reminder_state TEXT    NOT NULL DEFAULT 'not_scheduled',
    -- not_scheduled | scheduled | sent | repeating | stopped | completed | failed
    -- 'stopped' here means reminders halted; task itself stays pending
  next_reminder_at_utc    TIMESTAMPTZ,
    -- polled by cron; set to due_at_utc on create, advanced on repeat/retry
  last_reminder_sent_at   TIMESTAMPTZ,
    -- used for atomic duplicate-send prevention (50-second guard)
  send_retry_count        INTEGER NOT NULL DEFAULT 0,
    -- incremented on each failed send; reaches 3 → state becomes 'failed'
  send_last_error         TEXT,
    -- last Telegram error message for debugging
  completed_at            TIMESTAMPTZ,
  -- no stopped_at: "Stop reminders" does not change task status, only telegram_reminder_state
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS planner_tasks_user_template_idx
  ON planner_tasks(user_id, template_id);

CREATE INDEX IF NOT EXISTS planner_tasks_reminder_idx
  ON planner_tasks(next_reminder_at_utc)
  WHERE status = 'pending'
    AND reminder_enabled = TRUE
    AND telegram_reminder_state IN ('scheduled', 'repeating');

-- task_reminder_logs: audit trail for every notification attempt
CREATE TABLE IF NOT EXISTS task_reminder_logs (
  id                  VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id             VARCHAR NOT NULL REFERENCES planner_tasks(id)    ON DELETE CASCADE,
  user_id             VARCHAR NOT NULL REFERENCES management_users(id) ON DELETE CASCADE,
  template_id         VARCHAR NOT NULL REFERENCES templates(id)        ON DELETE CASCADE,
  channel             TEXT NOT NULL DEFAULT 'telegram',
  status              TEXT NOT NULL,
    -- sent | failed | skipped
  telegram_message_id TEXT,
    -- Telegram message_id; used by editMessageText after callback action
  error_message       TEXT,
  sent_at             TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS task_reminder_logs_task_idx
  ON task_reminder_logs(task_id);

-- telegram_callback_tokens: short DB-backed tokens for inline button callbacks
-- callback_data format: "td:<token>" (done) or "ts:<token>" (stop)
-- total callback_data length = 11 bytes, well under Telegram's 64-byte limit
CREATE TABLE IF NOT EXISTS telegram_callback_tokens (
  id          VARCHAR    PRIMARY KEY DEFAULT gen_random_uuid(),
  token       VARCHAR(8) NOT NULL UNIQUE,
    -- 8 random base64url chars; e.g. "aB3xKq7R"
  task_id     VARCHAR    NOT NULL REFERENCES planner_tasks(id) ON DELETE CASCADE,
  action      TEXT       NOT NULL,
    -- 'done' | 'stop'
  used_at     TIMESTAMPTZ,
    -- NULL until clicked; set on first use to prevent replay
  expires_at  TIMESTAMPTZ NOT NULL,
    -- 24 hours from creation
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS telegram_callback_tokens_token_idx
  ON telegram_callback_tokens(token);

CREATE INDEX IF NOT EXISTS telegram_callback_tokens_task_idx
  ON telegram_callback_tokens(task_id);
