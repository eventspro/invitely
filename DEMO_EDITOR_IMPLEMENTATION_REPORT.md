# Demo Mode Editor — Implementation Report
**Date:** May 13, 2026  
**Scope:** Customer-facing demo editor for the David & Rose Romantic template  
**Safety constraint:** Zero changes to live templates, Builder V1/V2, Template V2, or Aurelia

---

## Routes Added

| Route | Component | Purpose |
|-------|-----------|---------|
| `/demo/david-rose-romantic` | `DemoLandingPage` | Showcase + CTA |
| `/demo/david-rose-romantic/setup` | `DemoSetupPage` | Quick onboarding form |
| `/demo/david-rose-romantic/edit` | `DemoEditorPage` | Full live editor |

All three routes are registered in `client/src/App.tsx` **before** the `/:templateIdentifier` catch-all, so they never conflict with live template URLs.

---

## Files Created

### Feature Layer — `client/src/features/demo-editor/`

| File | Purpose |
|------|---------|
| `demoConfig.ts` | Default English starter config + 6 colour palette presets |
| `demoStorage.ts` | `loadDemoConfig` / `saveDemoConfig` / `resetDemoConfig` via `localStorage` |
| `demoUtils.ts` | `deepMergeConfig` helper (deep-merges partial patches into full config) |
| `DemoEditorContext.tsx` | React context — holds config state, autosave (800 ms debounce), preview mode, active section |
| `DemoPreview.tsx` | Lazy-loads `RomanticTemplate` with demo config; supports desktop / mobile sizing |

### Editor Panels — `client/src/features/demo-editor/panels/`

| Panel | Editable fields |
|-------|----------------|
| `DesignPanel` | 6 palette presets, custom hex colour pickers for all 6 theme colours, heading/body font selectors |
| `InvitationPanel` | Groom & bride names, combined names, wedding date, hero invitation/welcome text, countdown subtitle |
| `VenuesPanel` | Section title, add/edit/remove venues (title, name, description, address, GPS lat/lng) |
| `SchedulePanel` | Section title, add/edit/remove timeline events (time, title, description), closing message & notes |
| `GalleryPanel` | Section title/description, local-only `FileReader` image uploads (no server or R2 calls) |
| `RsvpPanel` | Section title/description, all form labels, button text, success/error messages |
| `FooterPanel` | Thank-you message, separator symbol, all 7 navigation labels |
| `shared/Field.tsx` | Shared labelled field wrapper used by all panels |

### Pages — `client/src/pages/demo/`

| Page | Key features |
|------|-------------|
| `DemoLandingPage` | Full read-only template preview, feature strip, sticky mobile CTA |
| `DemoSetupPage` | Names, date, venue name form → saves to `localStorage` → navigates to `/edit` |
| `DemoEditorPage` | Desktop: 3-column layout (section nav ∣ live preview ∣ editor panel). Mobile: full-screen preview + bottom sheet with section grid |

---

## Architecture Decisions

### Storage
- All demo data lives in `localStorage` key `demo_david_rose_romantic_v1`
- Deep-merge on load ensures new config keys added in future are always present
- Autosave fires 800 ms after the last change; explicit **Save** button also available
- **Reset** wipes the key and restores the hardcoded defaults

### Image uploads (Gallery panel)
- Uses `FileReader.readAsDataURL()` — images become base64 data URLs stored in `localStorage`
- No calls to the object storage providers (Cloudflare R2, GCS, S3)
- Suitable for demo purposes; data URLs are cleared on reset

### Live preview
- `RomanticTemplate` is lazy-loaded via `React.lazy()` to keep initial bundle small
- Passes `templateId="demo"` so the RSVP section will not submit real RSVPs
- Preview re-renders on every config change (no throttle needed — React batches state updates)

### Colour palette presets
Six built-in presets: Rose, Blush, Ivory & Gold, Sage Garden, Midnight Blue, Lavender. Applying a preset overwrites all 6 theme colour slots simultaneously.

---

## What Was NOT Changed

- `client/src/templates/romantic/RomanticTemplate.tsx` — untouched
- `client/src/templates/romantic/config.ts` — untouched
- All other templates (pro, classic, elegant, nature, aurelia, florence) — untouched
- Builder V1 (`client/src/components/builder/`) — untouched
- Builder V2 (`client/src/pages/builder-v2/`) — untouched
- Template V2 — untouched
- Aurelia template — untouched
- All server routes — untouched
- Database schema — untouched

---

## TypeScript Status

```
npx tsc --noEmit  →  Exit: 0  (no errors)
```
