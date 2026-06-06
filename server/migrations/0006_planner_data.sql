-- ============================================================
-- Migration 0006: DB-backed planner guests, tables, seats,
--                 budget items, and planner settings.
-- ============================================================

CREATE TABLE IF NOT EXISTS planner_tables (
  id          VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     VARCHAR NOT NULL REFERENCES management_users(id) ON DELETE CASCADE,
  template_id VARCHAR NOT NULL REFERENCES templates(id)         ON DELETE CASCADE,
  name        TEXT    NOT NULL,
  shape       TEXT    NOT NULL DEFAULT 'circle',
  capacity    INTEGER NOT NULL DEFAULT 10,
  x           INTEGER,
  y           INTEGER,
  rotation    INTEGER,
  size        INTEGER,
  locked      BOOLEAN NOT NULL DEFAULT FALSE,
  color       TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS planner_tables_user_template_idx
  ON planner_tables(user_id, template_id);

CREATE TABLE IF NOT EXISTS planner_guests (
  id            VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       VARCHAR NOT NULL REFERENCES management_users(id) ON DELETE CASCADE,
  template_id   VARCHAR NOT NULL REFERENCES templates(id)         ON DELETE CASCADE,
  rsvp_id       VARCHAR REFERENCES rsvps(id) ON DELETE SET NULL,
  source        TEXT    NOT NULL DEFAULT 'manual',
  full_name     TEXT    NOT NULL,
  first_name    TEXT,
  last_name     TEXT,
  phone         TEXT,
  email         TEXT,
  rsvp_status   TEXT    NOT NULL DEFAULT 'invited',
  guest_side    TEXT    NOT NULL DEFAULT 'both',
  guest_count   INTEGER NOT NULL DEFAULT 1,
  group_name    TEXT,
  dietary_notes TEXT,
  notes         TEXT,
  table_id      VARCHAR REFERENCES planner_tables(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT planner_guests_user_template_rsvp_unique UNIQUE (user_id, template_id, rsvp_id)
);

CREATE INDEX IF NOT EXISTS planner_guests_user_template_idx
  ON planner_guests(user_id, template_id);

CREATE INDEX IF NOT EXISTS planner_guests_rsvp_idx
  ON planner_guests(rsvp_id);

CREATE TABLE IF NOT EXISTS planner_seats (
  id           VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      VARCHAR NOT NULL REFERENCES management_users(id) ON DELETE CASCADE,
  template_id  VARCHAR NOT NULL REFERENCES templates(id)         ON DELETE CASCADE,
  table_id     VARCHAR NOT NULL REFERENCES planner_tables(id)    ON DELETE CASCADE,
  seat_number  INTEGER NOT NULL,
  guest_id     VARCHAR REFERENCES planner_guests(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT planner_seats_table_number_unique UNIQUE (table_id, seat_number),
  CONSTRAINT planner_seats_user_template_guest_unique UNIQUE (user_id, template_id, guest_id)
);

CREATE INDEX IF NOT EXISTS planner_seats_user_template_idx
  ON planner_seats(user_id, template_id);

CREATE TABLE IF NOT EXISTS planner_budget_items (
  id                   VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              VARCHAR NOT NULL REFERENCES management_users(id) ON DELETE CASCADE,
  template_id          VARCHAR NOT NULL REFERENCES templates(id)         ON DELETE CASCADE,
  category             TEXT    NOT NULL DEFAULT 'other',
  custom_category_name TEXT,
  title                TEXT    NOT NULL,
  vendor_name          TEXT,
  planned_cost         NUMERIC(12, 2) NOT NULL DEFAULT 0,
  actual_cost          NUMERIC(12, 2) NOT NULL DEFAULT 0,
  paid_amount          NUMERIC(12, 2) NOT NULL DEFAULT 0,
  due_date             TEXT,
  status               TEXT    NOT NULL DEFAULT 'planned',
  notes                TEXT,
  receipt_data_url     TEXT,
  receipt_file_name    TEXT,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS planner_budget_items_user_template_idx
  ON planner_budget_items(user_id, template_id);

CREATE TABLE IF NOT EXISTS planner_settings (
  id          VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     VARCHAR NOT NULL REFERENCES management_users(id) ON DELETE CASCADE,
  template_id VARCHAR NOT NULL REFERENCES templates(id)         ON DELETE CASCADE,
  settings    JSONB   NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT planner_settings_user_template_unique UNIQUE (user_id, template_id)
);

CREATE INDEX IF NOT EXISTS planner_settings_user_template_idx
  ON planner_settings(user_id, template_id);
