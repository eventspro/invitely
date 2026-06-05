# 4ever.am Wedding Platform — AI Development Guide

## Architecture Overview

**Multi-tenant Armenian wedding platform** for creating customized wedding websites with a visual builder.

- **Backend**: Express.js + Drizzle ORM (PostgreSQL) deployed as Vercel serverless functions
- **Frontend**: React SPA, Wouter routing, TanStack Query, Context for app state
- **Templates V2**: Manifest-driven Builder V2 system — Aurelia, Florence (dark teal/gold and light floral)
- **Database**: Template-scoped JSONB configs, PostgreSQL via Neon
- **Storage**: Cloudflare R2 (primary), presigned URL upload flow
- **Email**: Brevo for RSVP notifications
- **Auth**: JWT-based, separate systems for template owners vs. platform admin
- **Planner**: Wedding planner with guests, budget, tasks, seating — Telegram reminders via external cron

---

## Builder V2 System

The core editing experience. Every template has a **manifest** that registers sections and elements. The builder reads the manifest to build the left-panel section tree and inline click-to-edit overlays.

### Key files
| File | Role |
|---|---|
| `client/src/pages/builder-v2/` | Builder V2 page, toolbar, section panel |
| `client/src/pages/builder-v2/BuilderV2Page.tsx` | Main builder shell |
| `client/src/pages/builder-v2/components/InspectorControls.tsx` | Shared editor components: `TextField`, `TextareaField`, `MilestoneEditor`, `VenueCardEditor`, etc. |
| `client/src/templates/aurelia/manifest.ts` | Aurelia section + element registry |
| `client/src/templates/aurelia/inspectors.tsx` | Per-section inspector panels for Aurelia |
| `client/src/templates/florence/manifest.ts` | Florence manifest |
| `client/src/templates/florence/inspectors.tsx` | Florence inspectors |

### Manifest contract
```typescript
// Section shape
{ id: string; label: string; icon: string; hideable?: boolean; configKey?: string;
  children?: { id, label, icon, sectionId, elementId? }[] }

// Element shape (for inline click-to-edit)
{ id, sectionId, label, type: "text"|"textarea"|"image",
  getValue: (config) => string,
  setValue: (config, value) => Partial<WeddingConfig> }

// Template manifest shape
{ sections: Section[]; elements: Record<string, Element>;
  sectionInspectors: Record<string, React.ComponentType> }
```

### Template contract
- Every template receives `config: WeddingConfig` and `templateId?: string` and `builderMode?: boolean`
- `builderMode=true` disables scroll animations, enables `data-v2-section` and `data-v2-element` attributes for inline editing
- All user-visible text must come from `config` (no hardcoded visible strings)
- Aurelia extended fields (e.g. `heroTagline`, `storyBody`, `routeInstruction`) are stored as flat JSONB keys and cast via `AureliaExtendedConfig`

### Rules
- Every visible text, image, background, color, font, icon, list item must be editable in Builder V2
- Repeated items (venues, milestones, gallery images) use add/remove/reorder editors
- Inspector panels render in the right panel when a section is selected
- Armenian text must NOT be auto-generated — use English defaults, allow manual edit

---

## Template System (V2)

### Active V2 Templates
| Template | Directory | Description |
|---|---|---|
| Aurelia | `client/src/templates/aurelia/` | Cinematic dark teal + gold, animated wedding-car route map |
| Florence | `client/src/templates/florence/` | Light floral, editorial, Amalfi Coast style |

### Template file structure
```
client/src/templates/{name}/
├── {Name}Template.tsx   # Main component
├── config.ts            # defaultConfig: WeddingConfig + optional extended interface
├── manifest.ts          # Section/element registry + sectionInspectors map
├── inspectors.tsx       # Per-section React inspector panels
└── components/          # Template-specific sub-components
```

### WeddingConfig
Defined in `client/src/templates/types.ts` — shared across all templates. Extended per-template fields (Aurelia, Florence) are stored as flat JSONB keys and typed via template-specific interface extensions in `config.ts`.

### Adding a new V2 template
1. Create directory, add `{Name}Template.tsx`, `config.ts`, `manifest.ts`, `inspectors.tsx`
2. Register in `client/src/templates/index.ts` (lazy import + `loadTemplateConfig` switch)
3. Seed a DB instance via script if needed

---

## Wedding Planner System

Standalone planner module at `/planner-prototype` (and customer-specific routes).

### Features
- **Guests**: list, RSVP status, seating assignment
- **Tables**: seating plan drag-and-drop
- **Budget**: expense tracking
- **Tasks**: checklist with due dates and categories
- **Telegram reminders**: external cron sends reminders via `POST /api/cron/task-reminders`

### Key files
| File | Role |
|---|---|
| `server/routes/plannerTasks.ts` | Tasks CRUD API |
| `server/routes/cronReminders.ts` | External cron endpoint (protected by `CRON_SECRET`) |
| `shared/schema.ts` → `plannerTasks` table | Task schema |
| `client/src/pages/planner-prototype/` | Planner UI |

### Vercel Hobby cron constraint
**CRITICAL**: Vercel Hobby does not support frequent cron. Task reminder scheduling uses an **external cron service** that calls `/api/cron/task-reminders` with `Authorization: Bearer {CRON_SECRET}`. Do NOT add frequent Vercel cron jobs (`vercel.json` cron). See `PLANNER_TASKS_TELEGRAM_PLAN.md` for architecture.

---

## Database

- ORM: Drizzle with PostgreSQL (Neon)
- Schema: `shared/schema.ts` — all tables, Zod validation schemas
- Key tables: `templates`, `managementUsers`, `orders`, `rsvps`, `guestPhotos`, `images`, `plannerTasks`
- All template data scoped by `templateId` foreign key
- Config stored as JSONB — no migrations needed for config shape changes

```bash
npm run db:push      # Apply schema to DB
npm run db:generate  # Generate migration files
npm run db:migrate   # Run migrations + seed
```

---

## API Route Patterns

| Route | Purpose |
|---|---|
| `GET /api/templates/:id/config` | Public — fetch template config |
| `POST /api/templates/:id/rsvp` | Public — submit RSVP |
| `GET /api/admin-panel/:id/dashboard` | Template owner — analytics |
| `GET /api/admin-panel/:id/rsvps` | Template owner — RSVP list |
| `POST /api/templates/:id/photos/upload` | Template owner — image upload |
| `POST /api/cron/task-reminders` | External cron — Telegram reminders (CRON_SECRET) |
| `GET /api/planner/:userId/tasks` | Planner tasks |

Auth middleware in `server/middleware/auth.ts`:
- `authenticateUser` — validates JWT
- `requireAdminPanelAccess` — verifies template ownership via orders table

---

## Homepage Content System

Multilingual homepage (hy/en/ru) driven by `DEFAULT_HOMEPAGE_CONTENT` in `client/src/content/homepage/defaultHomepageContent.ts`.

- All content uses `{ hy, en, ru }` locale objects (`LS` type)
- Types defined in `client/src/pages/translations-prototype/types.ts`
- **Armenian text (hy) must never be auto-generated** — extract from existing verified source files or leave as English fallback

---

## Development Workflow

```bash
npm run dev          # Express + Vite dev server on localhost:5001
npm run check        # TypeScript check — MUST pass before reporting done
npm run build        # Production build
npx tsc --noEmit     # Type check only
```

**Always run `npx tsc --noEmit` before reporting a task complete.**

---

## Key Conventions

- `builderMode` prop disables animations, enables `data-v2-*` attrs for inline editing
- Mobile is priority — all templates must look correct at 390px
- No Armenian Unicode auto-generation — always use English defaults
- No hardcoded visible template text — everything via `config`
- `AureliaExtendedConfig` fields are flat JSONB keys, accessed via `cfg as unknown as AureliaExtendedConfig & WeddingConfig`
- Aurelia's milestone/route-stop cards: `address`, `mapUrl`, `buttonText` now in `WeddingConfig.timeline.events[]`
- Map button logic: `mapUrl` → custom URL; `address` (non-empty, non-placeholder) → Google Maps search; neither → no button

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection (required) |
| `JWT_SECRET` | Token signing (required in production) |
| `BREVO_API_KEY` | RSVP email notifications |
| `CRON_SECRET` | External cron auth for task reminders |
| `R2_*` | Cloudflare R2 storage credentials |
| `NODE_ENV` | `development` / `production` |

Dev server port: **5001**
