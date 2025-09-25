# Wedding Platform — Inspection, Full Requirements & Refactor Plan

**Repository inspected:** `InviteSite.zip` (extracted root: `InviteSite/`)

**Date:** 2025-09-11 (Asia/Yerevan timezone)

---

## 1) Quick inspection summary (what I found)

Files and key paths discovered inside the archive:

- `InviteSite/` (project root)
  - `InviteSite/client/` — frontend project
    - `client/src/config/wedding-config.ts` — single-source-of-truth configuration for the current template.
    - `public/audio/wedding-music.mp3` — background music file.
    - `public/wedding-photos-qr.png` — static asset.
  - `InviteSite/package.json` — top-level scripts for server build/dev.
  - `InviteSite/client/package.json` — frontend dependencies and scripts (Vite, React/Tailwind assumed).
  - `InviteSite/drizzle.config.ts` — Drizzle ORM config (DB migrations/tools present).
  - `InviteSite/tailwind.config.ts` — Tailwind setup.
  - `InviteSite/vite.config.ts` — Vite configuration.
  - `InviteSite/WEDDING_CUSTOMIZATION_GUIDE.md` — guide for editing `wedding-config.ts`.
  - `.git/` — full git history included in the zip (large repository contents).

Notable single-template implementation details found: `client/src/config/wedding-config.ts` contains:
- Couple information (groom/bride names)
- Wedding date/time and display strings
- All Armenian strings used on the site
- Email recipients: `["harutavetisyan0@gmail.com", "tatevhovsepyan22@gmail.com"]`
- Maintenance mode settings and password: `haruttev2025`

The codebase already includes:
- RSVP system (frontend + server)
- Photo upload system (Google Cloud Storage integration)
- Admin panel and maintenance mode
- PostgreSQL + Drizzle ORM setup
- Zod validation usage
- Service-worker/offline upload support (present in code)

This repository is a **complete, production-ready single-template wedding site** — great starting point for a multi-template platform.

---

## 2) High-level goal (restated)

Transform the existing single-template wedding site into a **multi-template platform**. The platform will:

- Host *multiple distinct wedding templates* (the current project will become the `pro`/premium template).
- Let a single platform admin log in and **clone / create / manage** template instances for customers.
- Provide a per-template Admin Panel for each customer (separate management view) so the platform admin can customize content (text, images, fonts, colors, enable/disable sections) and manage RSVP/photo uploads.
- No customer self-registration is required. Only the platform admin logs in.
- Everything should be **config-driven**, stored in PostgreSQL (template config JSONB) with the ability to revert or export.

---

## 3) Required files & locations to add / modify

> _Note: most changes should be non-invasive — keep the current template intact inside `client/` and add a `templates/` system that references it._

### Recommended repository layout (new/modified)

```
InviteSite/
 ├─ client/                     # existing frontend (Vite)
 │   ├─ src/
 │   │   ├─ templates/          # NEW: template registry + template wrappers
 │   │   │   └─ pro/             # move current single-template components/config as a template
 │   │   │       └─ config.ts    # wrapper that imports original client/src/config/wedding-config.ts
 │   │   ├─ admin/              # admin UI components (global + per-template)
 │   │   ├─ components/         # make components template-agnostic (props + themeable)
 │   │   └─ config/             # keep default fallback configs
 │   └─ public/
 ├─ server/                     # existing server code
 │   ├─ routes/                 # add template-aware endpoints (template_id param)
 │   ├─ db/                     # drizzle migrations + new templates table
 │   └─ index.ts
 ├─ prisma/ or drizzle/         # keep Drizzle ORM
 ├─ scripts/                    # helper scripts for cloning templates / migration
 ├─ package.json
 └─ README.md
```

### Key new files

- `client/src/templates/index.ts` — registry of templates (lazy imports)
- `client/src/templates/pro/config.ts` — wraps existing `client/src/config/wedding-config.ts` (or move that file under templates/pro)
- `server/db/migrations/xxxx_create_templates_table.sql` or Drizzle migration — creates `templates` table
- `server/routes/templates.ts` — REST endpoints: list templates, create (clone), update config, delete
- `server/routes/admin-auth.ts` — single admin login endpoint (JWT or secure session)
- `client/src/admin/PlatformDashboard.tsx` — list templates, create/clone/delete
- `client/src/admin/TemplateAdminPanel.tsx` — per-template admin panel for editing config (images, texts, sections)
- `client/src/admin/CustomEditor/*` — WYSIWYG simple editor for texts, theme picker, image upload control

---

## 4) Database schema (required changes)

Add a `templates` table to store template instances and their runtime configuration.

Example (PostgreSQL / Drizzle-friendly schema):

```sql
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- e.g. "pro-harut-tatev"
  slug TEXT UNIQUE NOT NULL, -- e.g. "harut-tatev-2025"
  template_key TEXT NOT NULL, -- which base template: "pro", "elegant", ...
  owner_email TEXT, -- optional: if you want to associate a customer
  config JSONB NOT NULL, -- full weddingConfig object
  maintenance BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

Also keep RSVP, photos, guests tables but add `template_id` foreign key to each to scope data to a template instance.

Example additions:
```sql
ALTER TABLE rsvps ADD COLUMN template_id UUID REFERENCES templates(id);
ALTER TABLE photos ADD COLUMN template_id UUID REFERENCES templates(id);
```

---

## 5) API endpoints (server) — template-aware

All existing endpoints (RSVP, uploads, admin actions, CSV export) must accept a `templateId` or derive the template from the request path.

Suggested route structure:

**Public frontend** (rendered client side but API calls need template context)
- `GET /api/templates/:templateId/config` — returns config JSON for the template
- `POST /api/templates/:templateId/rsvp` — create RSVP (validate & deduplicate by email scoped to templateId)
- `GET /api/templates/:templateId/rsvps` — admin-protected: list RSVPs for template
- `POST /api/templates/:templateId/photos` — upload photo (GCS) — includes `uploaderName` and `templateId`
- `GET /api/templates/:templateId/photos` — list photos for gallery

**Platform admin (protected)**
- `POST /api/admin/login` — platform admin login (single admin)
- `GET /api/admin/templates` — list template instances
- `POST /api/admin/templates` — create new template instance (clone existing or create from base)
- `PUT /api/admin/templates/:id` — update config or maintenance flag
- `DELETE /api/admin/templates/:id` — delete template instance
- `POST /api/admin/templates/:id/export/csv` — export RSVPs CSV

Security: admin endpoints must use JWT (short lived) or session cookies, HTTPS only. Rate-limit public endpoints.

---

## 6) Frontend changes — overview

### 6.1 Template registry & loader
- Implement `client/src/templates/index.ts` registry that maps `template_key` to a module that exports `defaultConfig` and optionally UI components.
- On the public site path `/:slug` or `/:templateId` the client fetches `/api/templates/:id/config` and hydrates the UI using the config.
- Keep `wedding-config.ts` for the `pro` template, but move it to `client/src/templates/pro/config.ts` and make a thin wrapper to maintain backward compatibility.

### 6.2 Componentizing & theming
- Convert components to be **config-driven** via props and CSS variables.
- Theme variables (colors, fonts) should be applied via CSS custom properties or Tailwind CSS theme extension at runtime using a small inlined style block.
- All sections must be togglable via `config.sections.*.enabled`.

### 6.3 Admin UI
- Platform Dashboard: list template instances (name, slug, template_key, created_at, maintenance status) with actions: open, clone, delete, edit config.
- Template Admin Panel: WYSIWYG-like editor with tabs:
  - Content: text fields for headings, invitation text, timeline items.
  - Media: Upload/replace hero image, gallery images, background music (upload to GCS)
  - Theme: color pickers + font selector (Playfair / Inter default) + preview
  - Features: toggle sections (rsvp, photos, timeline, map)
  - Settings: email recipients, timezone, date/time, maintenance password
- Changes save to `/api/admin/templates/:id` and update DB. Provide undo/backup or version history if possible.

### 6.4 Cloning flow
- Platform admin clicks `Clone` on a base template (e.g., `pro`) or an existing instance.
- Server-side clone: duplicate config JSON, create new `templates` row with new slug and name.
- Optionally copy uploaded assets (GCS) or point the new instance to same assets until replaced.

---

## 7) Photo upload & storage considerations

- Continue using Google Cloud Storage; add `template_id` prefixed folders for organization: e.g. `photos/{templateId}/{filename}`.
- When cloning, you can either:
  1. Share asset pointers (fast, smaller storage) — but editing/deleting affects original
  2. Deep-copy assets in GCS into the new template's folder (cost & time)

- Retain per-guest 25-photo limit, 10MB file size limit, and offline upload queue.

---

## 8) Email & Notifications

- Email templates should be stored as part of `config.email.templates` (HTML + placeholders) so platform admin can edit localized Armenian notifications.
- Maintain automatic notifications to couple (emails from `config.email.recipients`) and confirmation emails to guests.
- Use a transactional email provider or the existing SMTP/GMail integration with retry & exponential backoff.

---

## 9) Security & Validation

- Keep Zod schemas for all inputs; include `templateId` in schema validation.
- Use parameterized queries with Drizzle ORM to prevent SQL injection.
- Rate-limit public endpoints (e.g., RSVP & photo uploads) by IP + `templateId`.
- Admin endpoints protected by JWT or secure session; store admin password as env var hashed (don’t hardcode).
- Ensure maintenance passwords are stored hashed in DB (not plaintext in config), or keep per-template bypass token.

---

## 10) Dev and deployment notes

- Keep Vite build and server bundling scripts. Modify build to include dynamic template assets if needed.
- Environment variables to add:
  - `ADMIN_USERNAME` (or just `ADMIN_EMAIL`)
  - `ADMIN_PASSWORD_HASH` (never store plaintext in repo)
  - `DATABASE_URL`
  - `GCS_BUCKET_NAME`, `GCS_KEYFILE` or use workload identity
  - `SMTP_URL` or mail provider creds
- Add health-check endpoint `/healthz` on server.

---

## 11) Step-by-step refactor tasks (priority order)

1. **Move current template config into template folder**
   - Move `client/src/config/wedding-config.ts` → `client/src/templates/pro/config.ts` and export it as `defaultConfig`.
   - Add `client/src/templates/index.ts` and register `pro`.

2. **Create `templates` DB table** and migration using Drizzle
   - Add `template_id` foreign keys to `rsvps` and `photos` tables.

3. **Implement `GET /api/templates/:id/config`** to serve template config from DB (fallback to static default)

4. **Modify frontend to fetch template config at runtime** and render
   - App entry should accept URL `/:slug` or query `?templateId=` to select which template to render.

5. **Build platform admin auth** (single admin login)
   - `POST /api/admin/login` → return JWT, set cookie
   - Protect admin routes on frontend and server

6. **Platform Dashboard** (admin) — list & create/clone templates

7. **Template Admin Panel** — WYSIWYG editor, image uploads (GCS), theme picker

8. **Make components config-driven** (enable/disable sections, theme support)

9. **Add per-template maintenance toggle** stored in `templates.maintenance` or in `config`.

10. **Update RSVP/photo endpoints** to require `templateId` and scope operations

11. **Testing & QA** — run unit tests, integration tests, and manual tests (RSVP, photo upload, admin edits, cloning)

---

## 12) Copilot prompts & examples (use these in Copilot Pro)

### A. Create template registry

```
// Copilot task: create client/src/templates/index.ts
// - Export a `templates` registry that supports lazy-loading.
```

### B. Add templates table migration

```
-- Drizzle SQL: create templates table with JSONB config and timestamps
```

### C. Create admin dashboard page

```
// Copilot task: generate PlatformDashboard.tsx: fetch /api/admin/templates, render table with actions (open, clone, delete).
```

### D. Clone endpoint

```
// Copilot: create POST /api/admin/templates that accepts { sourceTemplateId, name, slug }
// It duplicates config JSON, inserts row, returns new template id
```

Include smaller tasks as separate prompts for Copilot: updating components to receive `config` prop, wiring theme CSS variables, adding `template_id` to RSVP API, etc.

---

## 13) Testing checklist (what to test after changes)

- [ ] Public page for a template loads and shows correct localized texts
- [ ] RSVP submission creates record scoped to template
- [ ] Duplicate RSVP prevention works per-template
- [ ] Photo upload works & appears in gallery (limits enforced)
- [ ] Platform admin login works; JWT/session protected
- [ ] Clone operation creates a new template instance and returns editable config
- [ ] Admin edits persist to DB and render immediately
- [ ] Maintenance mode toggles per-template
- [ ] Email notifications are sent to recipients defined in template config

---

## 14) Deliverables I created for you right now

- A detailed refactor & requirements document (this file) describing inspection findings and step-by-step plan.

If you want, I can now:
- (A) generate the Drizzle migration SQL for the `templates` table,
- (B) generate example server route handlers (`/api/admin/templates`, `/api/templates/:id/config`),
- (C) generate the React components scaffolding for `PlatformDashboard` and `TemplateAdminPanel`, or
- (D) produce a ready-to-run Copilot prompt bundle (one prompt per task) so you can paste them into GitHub Copilot Pro.

Tell me which of A/B/C/D you'd like next and I will produce the code-ready files in this repo format.

