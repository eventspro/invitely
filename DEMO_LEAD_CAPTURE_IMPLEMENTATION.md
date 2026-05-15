# Demo Lead Capture Flow — Implementation Report
**Date:** 2026-05-13  
**Status:** Complete (pending `npm run db:push`)

---

## Overview

Replaced the localStorage-only demo editor with a **backend-tracked, 5-step lead-capture wizard**. Every demo session creates a `customerEdits` record in the database, visible to platform admins via a new "Demo Leads" panel.

---

## Architecture

```
DemoLandingPage  →  POST /api/demo/customer-edits  →  DB record created
     ↓
/demo/david-rose-romantic/edit/:editId   (5-step wizard)
     ↓
PATCH /api/demo/customer-edits/:editId   (each step auto-saves)
POST  /api/demo/customer-edits/:editId/upload-hero
POST  /api/demo/customer-edits/:editId/upload-gallery
     ↓
/demo/david-rose-romantic/edit/:editId/done   (DemoFinalPage)
     ↓
Platform Admin → "Demo Leads" tab → CustomerEditsAdmin
```

---

## Files Changed

### New Files

| File | Purpose |
|------|---------|
| `server/routes/customer-demo.ts` | All demo API routes (public + admin) |
| `client/src/features/demo-editor/demoPalettes.ts` | 25 curated wedding color palettes |
| `client/src/pages/demo/DemoFinalPage.tsx` | Confirmation/share screen after wizard |
| `client/src/components/platform-admin/CustomerEditsAdmin.tsx` | Admin leads panel (list + detail modal) |

### Modified Files

| File | Changes |
|------|---------|
| `shared/schema.ts` | Added `customerEdits` table + `insertCustomerEditSchema` + `updateCustomerEditSchema` |
| `server/routes.ts` | Registered `customerDemoPublicRouter` at `/api/demo/customer-edits` and `customerDemoAdminRouter` at `/api/platform-admin/customer-edits` |
| `client/src/pages/demo/DemoEditorPage.tsx` | Replaced with 5-step backend-tracked wizard (558 lines) |
| `client/src/pages/demo/DemoLandingPage.tsx` | CTA calls `POST /api/demo/customer-edits`, redirects to `/:editId` |
| `client/src/App.tsx` | Added routes for `/:editId` and `/:editId/done` |
| `client/src/components/platform-admin/PlatformAdminPanel.tsx` | Added "Demo Leads 🎯" tab |

---

## Database Schema

```ts
customerEdits: pgTable("customer_edits", {
  id:                  uuid (PK, default random)
  sourceTemplateSlug:  text (default "david-rose-romantic")
  groomName:           text (nullable)
  brideName:           text (nullable)
  weddingDate:         text (nullable)
  paletteId:           text (nullable)
  customerEmail:       text (nullable)
  customerPhone:       text (nullable)
  customerInstagram:   text (nullable)
  heroImageUrl:        text (nullable)
  galleryImageUrls:    jsonb string[] (default [])
  config:              jsonb (nullable, full WeddingConfig override)
  status:              "demo" | "contacted" | "converted" | "archived" (default "demo")
  notes:               text (nullable, admin-only)
  createdAt:           timestamp (default now)
  updatedAt:           timestamp (default now)
})
```

---

## API Routes

### Public (`/api/demo/customer-edits`)

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/images/:filename` | Serve uploaded demo images |
| `POST` | `/` | Create new demo record → returns `{ editId, createdAt }` |
| `GET`  | `/:editId` | Fetch record by UUID |
| `PATCH`| `/:editId` | Update fields (status field stripped — admin only) |
| `POST` | `/:editId/upload-hero` | Upload hero photo (field: `photo`, 10 MB limit) |
| `POST` | `/:editId/upload-gallery` | Upload gallery photos (field: `photos`, max 10, 10 MB each) |

### Admin (`/api/platform-admin/customer-edits`) — JWT required

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/` | List all demo leads (ordered by `createdAt` desc) |
| `GET`  | `/:id` | Get single record |
| `PATCH`| `/:id/status` | Update status + notes |

---

## 5-Step Wizard

| Step | Name | Fields | Backend action |
|------|------|--------|----------------|
| 1 | Names & Date | Groom name, bride name, wedding date | `PATCH /:editId` |
| 2 | Photos | Hero photo, gallery photos (up to 10) | `POST /:editId/upload-hero`, `POST /:editId/upload-gallery` |
| 3 | Colors | Palette picker (25 options) | `PATCH /:editId { paletteId }` |
| 4 | Preview | Live preview of the Romantic template | (read-only) |
| 5 | Contact | Email, phone, Instagram | `PATCH /:editId { customerEmail, … }` → navigate to `/done` |

---

## Color Palettes (25 total)

Romantic Rose · Classic Ivory · Sage Garden · Luxury Dark · Gold Beige · Blush Pearl · Champagne Cream · Dusty Blue · Lavender Mist · Olive Gold · Burgundy Blush · Pearl Navy · Terracotta Linen · Emerald Ivory · Soft Peach · Rosewood · Midnight Gold · Warm Sand · Silver Sage · Cocoa Cream · Ivory Garden · Mauve Romance · Antique Gold · Wine Velvet · Forest Cream

---

## Admin Panel: Demo Leads Tab

**Location:** Platform Admin → "Demo Leads 🎯" tab

**Features:**
- Stats row: Total / With email / Contacted / Converted
- Search by name, email, or phone
- Filter by status
- Table: Couple · Contact · Wedding date · Palette · Status · Submitted · View
- Status pills: Demo (stone) · Contacted (blue) · Converted (green) · Archived (red)
- Detail modal: hero image, gallery thumbnails, all fields, status dropdown, notes, save

---

## Image Storage

- Uploaded files saved to `uploads/demo-images/` (or `/tmp/uploads/demo-images/` on Vercel)
- Served via `GET /api/demo/customer-edits/images/:filename`
- Multer config: 10 MB limit, images only (jpeg/png/webp/gif)
- Path traversal protection: rejects filenames containing `..`, `/`, or `\`

---

## Security Notes

- `status` and `notes` fields are stripped from public `PATCH /:editId` — only admins can set them via `/status` endpoint
- Admin routes protected by `authenticatePlatformAdmin` JWT middleware
- Image filenames sanitized before serving
- editId is a UUIDv4 — acts as an unguessable access token for the session

---

## Remaining Action Required

```bash
npm run db:push
```

Pushes the `customerEdits` table to the PostgreSQL database. The feature will not work until this command is run.
