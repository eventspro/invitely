# Customer Demo Flow — Implementation Plan

**Date:** May 13, 2026  
**Status:** Awaiting approval before implementation  
**Scope:** Replace localStorage-only demo editor with backend-tracked lead-capture demo flow

---

## 1. Current State Analysis

### How the current demo editor works

- Route: `/demo/david-rose-romantic/edit`
- **100% client-side / localStorage-only**
- `DemoEditorContext` loads/saves to localStorage key `demo_david_rose_romantic_v1`
- `demoConfig.ts` holds a hard-coded `DEMO_DEFAULT_CONFIG` (English placeholder values)
- `DemoPreview.tsx` renders `RomanticTemplate` with demo config — correct component, safe
- **No backend record is created. No email captured. Admin sees nothing.**
- The wizard has 7 steps (names, photos, details, story, RSVP, style, preview) — too many, too broad

### Live template safety

The live `/david-rose-romantic` template is served via `GET /api/templates/:identifier/config` (read-only).  
**Nothing in the current demo editor touches the database or the live template.**  
This safety property will be preserved.

### Why preview already shows correct template

`DemoPreview.tsx` already renders `RomanticTemplate` — the same component used on the live site.  
The visual gap is only placeholder data (e.g. `/attached_assets/couple11.jpg`).  
**No change needed to `RomanticTemplate.tsx`.**

---

## 2. Proposed Architecture

```
Customer clicks "Try Now"
        │
        ▼
POST /api/demo/customer-edits
Creates a customerEdits DB row (status: "demo")
Returns { editId }
        │
        ▼
Redirect → /demo/david-rose-romantic/edit/:editId
        │
        ▼
5-step wizard (server-backed)
  Step 1: Names + date          → PATCH /api/demo/customer-edits/:editId
  Step 2: Photos (local preview) → stored in React state; URL not persisted (Phase 1)
  Step 3: Palette selection      → PATCH
  Step 4: Email (required)       → PATCH + status stays "demo"
  Step 5: Final screen           → redirect to /demo/david-rose-romantic/edit/:editId/done
        │
        ▼
/demo/david-rose-romantic/edit/:editId/done
DemoFinalPage — social contact buttons, no Publish/Share
        │
        ▼
Platform Admin → /platform-admin → "Demo Leads" tab
Admin sees email, names, date, palette, status
Admin can change status: demo → contacted → converted → archived
```

---

## 3. Database Schema Change

**File:** `shared/schema.ts` — append only, no existing tables modified.

```ts
export const customerEdits = pgTable("customer_edits", {
  id:                 varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceTemplateSlug: text("source_template_slug").notNull().default("david-rose-romantic"),
  groomName:          text("groom_name"),
  brideName:          text("bride_name"),
  weddingDate:        text("wedding_date"),
  paletteId:          text("palette_id"),
  customerEmail:      text("customer_email"),
  heroImageUrl:       text("hero_image_url"),          // Phase 2 only
  galleryImageUrls:   jsonb("gallery_image_urls").default(sql`'[]'::jsonb`),
  config:             jsonb("config"),                  // full WeddingConfig snapshot at save
  status:             text("status").notNull().default("demo"),
  notes:              text("notes"),                    // admin-only internal notes
  createdAt:          timestamp("created_at").default(sql`now()`),
  updatedAt:          timestamp("updated_at").default(sql`now()`),
});
```

**Status values:** `demo` | `contacted` | `converted` | `archived`

**Migration:** `npm run db:push` (additive-only, zero risk to existing data).  
> ⚠️ Will not be run without explicit user confirmation.

---

## 4. API Routes

### New file: `server/routes/customer-demo.ts`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `POST` | `/api/demo/customer-edits` | Create new demo edit record | Public |
| `GET` | `/api/demo/customer-edits/:editId` | Fetch demo edit by id | Public |
| `PATCH` | `/api/demo/customer-edits/:editId` | Update fields (names, date, palette, email, config) | Public |

> Public routes use the `editId` UUID as the "access token" — acceptable for a demo lead tool with no sensitive data beyond email.

### Added to `server/routes/platform-admin.ts`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/platform-admin/customer-edits` | List all demo leads (paginated, sortable) | Admin JWT |
| `GET` | `/api/platform-admin/customer-edits/:id` | Get full detail | Admin JWT |
| `PATCH` | `/api/platform-admin/customer-edits/:id/status` | Update status | Admin JWT |

---

## 5. Customer Routes

| Route | Component | Notes |
|-------|-----------|-------|
| `/demo/david-rose-romantic` | `DemoLandingPage` | Minor edit: "Start Customizing" calls POST then redirects |
| `/demo/david-rose-romantic/edit/:editId` | `DemoEditorPage` *(new)* | 5-step wizard, server-state |
| `/demo/david-rose-romantic/edit/:editId/done` | `DemoFinalPage` *(new)* | Final screen, contact buttons |
| `/demo/david-rose-romantic/edit` | Redirect → landing | Old localStorage route gracefully retired |
| `/demo/david-rose-romantic/setup` | Redirect → landing | Existing setup redirect unchanged |

---

## 6. Platform Admin — "Demo Leads" Tab

**Change:** Add `'demo-leads'` to the `Tab` union type in `PlatformAdminPanel.tsx`  
**New component:** `client/src/components/platform-admin/CustomerEditsAdmin.tsx`

### List view columns
- Customer email
- Groom / bride names
- Wedding date
- Palette name
- Status pill (color-coded)
- Created date
- Actions: View detail, Change status

### Detail view
- Full field display
- Hero image preview *(Phase 2)*
- Gallery thumbnails *(Phase 2)*
- Status control dropdown
- Admin notes field
- Raw config (collapsed accordion)

---

## 7. Demo Steps — Customer Flow

### Step 1 — Names & Date
**Title:** Let's personalize your invitation  
**Fields:** Groom name, Bride name, Wedding date  
**CTA:** Continue

### Step 2 — Photos
**Title:** Add your favorite photos  
**Fields:** Hero image upload, Gallery images upload  
**Note (Phase 1):** Local FileReader preview only — images shown in preview but not stored to server  
**CTA:** Continue

### Step 3 — Color Palette
**Title:** Choose your style  
**UI:** 25 palette cards with name, mood label, and color swatches  
**CTA:** Continue

### Step 4 — Email
**Title:** Where should we send your demo details?  
**Fields:** Email address (required, validated)  
**On submit:** PATCH record with email + full config snapshot  
**CTA:** Save Demo

### Step 5 — Final Screen
**Title:** Your demo is ready  
**Message:** "You customized the main details of the David & Rose Romantic design. Other details like venue, locations, RSVP, schedule and final publishing can be completed with the 4ever.am team."  
**Buttons:**
- Contact us on Instagram
- Contact us on Facebook
- Contact us on WhatsApp / Messenger
- Continue editing  

**Not shown:** Publish, Share public link, Copy URL

---

## 8. Palette List (25 curated)

| # | Name | Mood |
|---|------|------|
| 1 | Romantic Rose | Classic romantic |
| 2 | Classic Ivory | Timeless elegant |
| 3 | Sage Garden | Fresh botanical |
| 4 | Luxury Dark | Dramatic modern |
| 5 | Gold Beige | Warm luxurious |
| 6 | Blush Pearl | Soft feminine |
| 7 | Champagne Cream | Understated elegant |
| 8 | Dusty Blue | Serene cool |
| 9 | Lavender Mist | Dreamy floral |
| 10 | Olive Gold | Earthy warm |
| 11 | Burgundy Blush | Deep romantic |
| 12 | Pearl Navy | Sophisticated |
| 13 | Terracotta Linen | Rustic warm |
| 14 | Emerald Ivory | Lush garden |
| 15 | Soft Peach | Gentle sunrise |
| 16 | Rosewood | Rich floral |
| 17 | Midnight Gold | Opulent evening |
| 18 | Warm Sand | Desert minimal |
| 19 | Silver Sage | Cool botanical |
| 20 | Cocoa Cream | Cozy elegant |
| 21 | Ivory Garden | Romantic natural |
| 22 | Mauve Romance | Dusty vintage |
| 23 | Antique Gold | Heritage luxury |
| 24 | Wine Velvet | Deep velvet |
| 25 | Forest Cream | Woodland fresh |

Each palette maps to `WeddingConfig` color keys: `primary`, `secondary`, `accent`, `background`, `text`, `buttonColor`, `buttonTextColor`.

---

## 9. Files to Create / Change

### New files
| File | Purpose |
|------|---------|
| `server/routes/customer-demo.ts` | All demo CRUD API routes (public + admin) |
| `client/src/pages/demo/DemoEditorPage.tsx` | Replace existing — new 5-step wizard |
| `client/src/pages/demo/DemoFinalPage.tsx` | Step 5 final/thank-you screen |
| `client/src/components/platform-admin/CustomerEditsAdmin.tsx` | Admin list + detail |
| `client/src/features/demo-editor/demoPalettes.ts` | 25 curated palette definitions |

### Modified files (surgical, minimal)
| File | Change |
|------|--------|
| `shared/schema.ts` | Append `customerEdits` table + Zod schemas |
| `server/index.ts` | 1 import + 1 `app.use` for `customer-demo` router |
| `client/src/App.tsx` | Add 2 new demo routes (`/edit/:editId`, `/edit/:editId/done`) |
| `client/src/pages/demo/DemoLandingPage.tsx` | "Start Customizing" button → calls POST then redirects |
| `client/src/components/platform-admin/PlatformAdminPanel.tsx` | Add `'demo-leads'` tab + render `CustomerEditsAdmin` |

### Explicitly untouched
| File / System | Reason |
|---------------|--------|
| `RomanticTemplate.tsx` | Already renders correctly in demo preview |
| `server/routes/templates.ts` | No template data is read/written |
| All Builder V1 / V2 pages | Completely unrelated |
| All other template components (elegant, nature, classic, pro, aurelia) | Unrelated |
| `server/routes/admin-panel.ts` | Template owner admin, not touched |
| RSVP backend / submission logic | Unrelated |
| `DemoPreview.tsx` | Already correct |
| `DemoEditorContext.tsx` | Can be left in place (new wizard uses its own local state + API) |
| `demoConfig.ts` / `demoStorage.ts` | Kept as-is; old localStorage key unused but harmless |
| Telegram / music / sale-wheel / image editor | Completely unrelated |

---

## 10. Image Upload — Phase 1 vs Phase 2

### Phase 1 (this implementation)
- Customer uploads images → `FileReader` → `dataURL` stored in React state only
- Preview shows image correctly
- Image is NOT saved to server or database
- Admin sees "Images not persisted" notice in demo lead detail
- Zero risk to existing upload infrastructure

### Phase 2 (future — out of scope now)
- New endpoint `POST /api/demo/customer-edits/:editId/upload`
- Multer + disk storage to `uploads/demo-images/`
- Image URL stored in `customerEdits.heroImageUrl` / `galleryImageUrls`
- Admin can see image thumbnails in detail view

---

## 11. Risks & Assumptions

| Risk | Severity | Mitigation |
|------|----------|-----------|
| `db:push` modifies production DB | Medium | Will prompt user before running; change is additive-only |
| Anyone with an `editId` can PATCH that record | Low | Demo lead tool only; no sensitive data beyond email; UUID space large enough |
| Old `/demo/david-rose-romantic/edit` route (no editId) bookmarked | Low | Gracefully redirect to landing page |
| `PlatformAdminPanel.tsx` is ~1000 lines | Low | Change is 3–4 lines (Tab union + tab button + conditional render) |
| Replacing `DemoEditorPage.tsx` loses old flow | None | Old flow saved nothing to backend; localStorage key left intact |
| `DemoEditorContext` is no longer used by new flow | None | Can remain as dead code; will not be deleted to minimize risk |

---

## 12. Acceptance Criteria

- [ ] Clicking "Try Now" creates a separate `customerEdits` DB record
- [ ] The real `/david-rose-romantic` template remains unchanged after flow completion
- [ ] Customer can edit groom name, bride name, wedding date
- [ ] Customer can upload hero + gallery images (local preview Phase 1)
- [ ] Customer can choose from 25 curated palettes
- [ ] Customer must enter email before saving (Step 4)
- [ ] Final step explains remaining customization is done with 4ever.am team
- [ ] Final step shows social/contact buttons (Instagram, Facebook, WhatsApp)
- [ ] No Publish or public share link shown anywhere
- [ ] Customer edit appears in Platform Admin "Demo Leads" tab
- [ ] Admin can see email, names, date, palette, status
- [ ] Admin can change status (contacted / converted / archived)
- [ ] Builder V1 untouched
- [ ] Builder V2 untouched
- [ ] Aurelia / all other templates untouched
- [ ] Live RomanticTemplate behavior unchanged
- [ ] RSVP backend/submission logic untouched
- [ ] `npx tsc --noEmit` passes with zero errors

---

*Status: Plan complete — awaiting approval before implementation begins.*
