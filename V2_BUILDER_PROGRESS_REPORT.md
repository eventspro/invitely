# V2 Builder — Full Progress Report

**Date:** May 2, 2026  
**Status:** Phase 1 + Phase 2 + Phase 3–6 Complete  
**TypeScript:** 0 errors  
**Constraint:** V1 builder, V1 templates, RSVP logic, auth, and production data are untouched.

---

## Overview

A fully isolated, professional-grade **Wedding Website Builder V2** has been implemented from scratch inside the existing platform. It is accessible at `/platform/builder-v2/:templateId` and is completely separate from the legacy V1 builder (`/platform/templates/:templateId`).

The builder supports the **Florence Eternal** template (the first and only V2 template), which is a luxury wedding website with a dark-gold aesthetic.

---

## Architecture

### Route & Entry Point
- **Route:** `/platform/builder-v2/:templateId`
- **Component:** `client/src/pages/builder-v2/BuilderV2Page.tsx`
- **Registered in:** `client/src/App.tsx`
- **Linked from:** `client/src/pages/platform-dashboard.tsx` — shows an indigo "Builder V2" button for templates where `templateVersion === 2`

### State Management
- React Context + `useReducer` pattern (no external lib)
- **Provider:** `BuilderV2Provider` in `BuilderV2Context.tsx`
- **Hook:** `useBuilderV2()` — consumed by all builder sub-components
- **Save:** `PUT /api/templates/:templateId/config` with JWT auth from `localStorage["admin-token"]`
- **Undo/Redo:** Immutable history stack, up to 50 snapshots (`MAX_HISTORY = 50`)

### Layout Shell
Three-panel layout, full-viewport (`100vh`), dark slate theme:
```
┌────────────────────────────────────────────────────────────┐
│  BuilderTopBar  (52px fixed height)                         │
├──────────────┬───────────────────────────┬─────────────────┤
│              │                           │                 │
│ BuilderLeft  │      BuilderCanvas        │  BuilderRight   │
│ Panel        │  (iframe-like preview)    │  Panel /        │
│ (240px)      │                           │  Settings       │
│              │                           │  (280px)        │
└──────────────┴───────────────────────────┴─────────────────┘
```

---

## File Inventory

| File | Description |
|------|-------------|
| `client/src/pages/builder-v2/types.ts` | All shared TypeScript types, constants, element/layer definitions |
| `client/src/pages/builder-v2/BuilderV2Context.tsx` | Full builder state: reducer, provider, context value |
| `client/src/pages/builder-v2/BuilderV2Page.tsx` | Page shell: auth guard, config loader, layout, panel switcher |
| `client/src/pages/builder-v2/components/BuilderTopBar.tsx` | Top bar: name edit, device selector, undo/redo, preview, save, publish, settings |
| `client/src/pages/builder-v2/components/BuilderLeftPanel.tsx` | Hierarchical layers tree with drag-to-reorder |
| `client/src/pages/builder-v2/components/BuilderCanvas.tsx` | Preview iframe with click-to-select, inline editing, floating toolbar |
| `client/src/pages/builder-v2/components/BuilderRightPanel.tsx` | 3-tab inspector: Content / Style / Advanced |
| `client/src/pages/builder-v2/components/InspectorControls.tsx` | 15+ reusable control primitives |
| `client/src/pages/builder-v2/components/ProjectSettingsPanel.tsx` | Project settings: date, couple, venue, RSVP, music, SEO, social |
| `client/src/templates/florence/FlorenceTemplate.tsx` | Florence template with `data-v2-element` and `data-v2-section` attrs |
| `client/src/templates/florence/config.ts` | Default WeddingConfig for Florence |
| `client/src/templates/index.ts` | Florence registered in lazy-loading template registry |

---

## Feature Documentation

---

### 1. Florence Eternal Template

**Files:** `client/src/templates/florence/`

A luxury wedding website template with:
- Dark green / gold color palette (`#2E3427` background, `#C9A86A` gold accent)
- Playfair Display (serif headings) + Montserrat (body)
- 9 sections: Hero, Our Story, Countdown, Journey, Wedding Details, Venue, Gallery, RSVP, Footer

**Template registration:**
- `templateVersion: 2`, `isMain: true`
- DB ID: `5df55473-219d-4106-a493-1f7214903491`
- Slug: `florence-eternal`
- Template key: `florence`

**Data attributes added to all editable elements** (enables canvas click-to-select):
- `data-v2-element="hero-intro"` / `data-v2-type="text"`
- `data-v2-element="hero-title"` — couple names
- `data-v2-element="hero-date"` — wedding date
- `data-v2-element="hero-location"` — location line
- `data-v2-element="story-title"` — story heading
- `data-v2-element="story-text"` — story paragraph
- `data-v2-element="story-cta"` — CTA button
- `data-v2-element="countdown-title"` — countdown heading
- `data-v2-element="venue-subtitle"` — venue section label
- `data-v2-element="venue-title"` — venue name
- `data-v2-element="venue-desc"` — venue description
- `data-v2-element="footer-tagline"` — footer tagline

Each section has `data-v2-section="flo-{name}"` for section-level selection.

---

### 2. Builder Types System

**File:** `client/src/pages/builder-v2/types.ts`

#### Section IDs (`V2SectionId`)
9 sections: `flo-hero`, `flo-story`, `flo-countdown`, `flo-journey`, `flo-details`, `flo-venue`, `flo-gallery`, `flo-rsvp`, `flo-footer`

#### Element IDs (`V2ElementId`)
12 inline-editable elements (see Florence template section above).

#### Element Meta (`V2ElementMeta`)
Each element has:
- `id`, `sectionId`, `label`, `type` (`"text" | "image" | "button" | "form" | "list"`)
- `getValue(cfg: WeddingConfig): string` — reads current value from config
- `setValue(cfg, value): WeddingConfig` — returns updated config immutably

#### Layer Tree (`V2LayerNode` / `V2_FLORENCE_LAYERS`)
Hierarchical tree of 9 sections, each with child elements. Used by the left panel to render the layers list. Supports `locked`, `hideable`, `elementId` per node.

#### Builder State (`BuilderV2State`)
```typescript
{
  templateId, templateName,
  savedConfig, draftConfig,       // immutable config snapshots
  selectedSection, selectedElement,
  inspectorTab,                   // "content" | "style" | "advanced"
  builderMode,                    // "editing" | "preview"
  builderPanel,                   // "inspector" | "settings"
  devicePreview,                  // "desktop" | "tablet" | "mobile"
  hasUnsavedChanges,
  isSaving, isPublishing,
  lastSaved,
  past, future                    // undo/redo stacks
}
```

#### Actions (`BuilderV2Action`)
`UPDATE_CONFIG`, `SELECT_SECTION`, `SELECT_ELEMENT`, `SET_DEVICE`, `SET_TAB`, `SET_MODE`, `SET_PANEL`, `SET_NAME`, `UNDO`, `REDO`, `SAVE_START/SUCCESS/ERROR`, `PUBLISH_START/SUCCESS/ERROR`, `DISCARD`

---

### 3. Builder Top Bar

**File:** `client/src/pages/builder-v2/components/BuilderTopBar.tsx`

Left to right:
- **← Templates V2** — back link to `/platform`
- **Template name** — click to enter inline edit mode (pencil icon); press Enter or blur to commit; Escape cancels
- **Unsaved indicator** — amber `● Unsaved` dot when `hasUnsavedChanges`; green `✓ Saved HH:MM` after last save
- **Device selector** (hidden in preview mode) — Desktop / Tablet / Mobile, controls canvas `max-width`
- **Undo / Redo** buttons (hidden in preview mode) — disabled when stack is empty
- **Preview toggle** — switches `builderMode` between `"editing"` and `"preview"`; button turns blue in preview mode with "← Exit Preview" label
- **Discard button** — shown only when there are unsaved changes; shows `confirm()` before discarding
- **Save Draft** — indigo button, disabled when nothing to save; shows `"Saving…"` spinner
- **⚙ Settings** — blue button, toggles right panel between inspector and project settings
- **Publish** — amber button, saves config and marks published; shows `"Publishing…"` spinner

---

### 4. Left Panel — Hierarchical Layers Tree

**File:** `client/src/pages/builder-v2/components/BuilderLeftPanel.tsx`

#### Tree Structure
- 9 top-level section nodes, each expandable via click
- Each section shows its child elements when expanded
- Child elements are individually clickable to select in canvas + inspector

#### Selection State
- Selected section: highlighted with left indigo border + darker background
- Selected element (child): highlighted with left violet border + deeper dark background
- Scrolls canvas to the selected section/element on click

#### Visibility Toggle
- Each section has an `ON`/`OFF` badge (eye toggle)
- Clicking toggles `config.sections[key].enabled`
- Hidden sections render at 45% opacity in the tree

#### Locked Elements
- Nodes marked `locked: true` (e.g. RSVP submit logic, footer copyright) show `LOCK` badge and are unclickable

#### Drag-to-Reorder Sections
- Every section row is `draggable`
- HTML5 drag API: `dragstart` → `dragover` → `drop` → `dragend`
- Drop target shows a blue top border during hover
- On drop: reorders the `layerOrder` state array
- Persists the new order to `draftConfig.sectionOrder` via `updateConfig` (saved with next Save/Publish)
- A `=` symbol drag handle is visible on each row

#### Hidden in Preview Mode
The entire panel hides when `builderMode === "preview"`.

---

### 5. Builder Canvas

**File:** `client/src/pages/builder-v2/components/BuilderCanvas.tsx`

#### Responsive Preview Frame
- Wraps the Florence template in a scrollable container
- Device widths: Desktop = 100%, Tablet = 768px, Mobile = 390px (centered)
- Smooth width transition (`transition: max-width 0.3s ease`)

#### Click-to-Select (Element Level)
- Canvas intercepts all clicks via event handler
- Walks up from `event.target` looking for `[data-v2-element]` first, then `[data-v2-section]`
- Fires `selectElement(elementId, sectionId)` or `selectSection(sectionId)` accordingly
- Selected element gets a CSS outline (`2px solid #6366F1`) via injected `<style>`

#### Double-Click Inline Text Editing
- Double-clicking a `[data-v2-type="text"]` element opens an overlay `<textarea>`
- Textarea is positioned `position: fixed` near the element, pre-filled from `V2_FLORENCE_ELEMENTS[id].getValue(config)`
- On `blur` or `Enter`: commits via `updateConfig((c) => meta.setValue(c, newValue))`
- On `Escape`: cancels without saving
- Auto-resizes to element dimensions

#### Floating Mini-Toolbar
- Appears `position: fixed` near the selected element or section
- Shows three buttons: `Edit` (switches to Content tab), `Style` (switches to Style tab), `Advanced`
- Disappears in preview mode

#### Preview Mode
- Canvas CSS overrides are cleared (no selection outlines)
- Click handlers are disabled
- A `"Preview Mode — click Exit Preview to edit"` banner appears at the top of the canvas
- Left panel and right panel both hide

---

### 6. Right Inspector Panel — 3 Tabs

**File:** `client/src/pages/builder-v2/components/BuilderRightPanel.tsx`

#### Tab Strip
Three tabs at top: **Content** | **Style** | **Advanced**  
Active tab has an indigo bottom border. Tabs driven by `state.inspectorTab`.

A context label above the tabs shows what is selected (e.g. `Element: hero-title` or `Section: hero` or `Global Theme`).

Hidden entirely in preview mode.

---

#### Content Tab

**When an element is selected:**  
Renders `ElementContentControls`:
- **Text type:** `TextField` with current text value + `InfoNote` tip about inline editing
- **Button type:** `ButtonLinkField` — label text, href URL (with security blocking), new-tab toggle
- **Image type:** `ImageField` — preview thumbnail, URL input, clear button

**When a section is selected (no element):**  
Renders section-specific inspector components:

| Section | Controls |
|---------|----------|
| `flo-hero` | `HeroInspector` — couple names, wedding date, location, intro, background color, show/hide elements |
| `flo-story` | `StoryInspector` — heading, story text, CTA label |
| `flo-countdown` | `CountdownInspector` — subtitle text |
| `flo-journey` | `JourneyInspector` — section label, subheading, milestone list editor |
| `flo-details` | `DetailsInspector` — 4 detail card editors (label, value, description) |
| `flo-venue` | `VenueInspector` — venue name, address, description |
| `flo-gallery` | `GalleryInspector` — title, description |
| `flo-rsvp` | `RsvpInspector` — title, description, deadline, locked submit logic note |
| `flo-footer` | `FooterInspector` — tagline, social links |
| (none) | `GlobalThemeInspector` — primary/accent/background colors, heading/body fonts |

---

#### Style Tab

Renders `StyleTab`:
- **For text elements:** font size slider, font weight selector, color picker, alignment (left/center/right), text shadow toggle with X/Y/blur/color controls
- **For sections:** background color, padding spacing (T/R/B/L)

---

#### Advanced Tab

Renders `AdvancedTab`:
- **Entrance animation** selector (None / Fade In / Fade Up / Slide In / Zoom In)
- **Responsive info note** explaining device preview behavior
- **Custom CSS** textarea (monospace, resizable) for raw style overrides

---

### 7. Project Settings Panel

**File:** `client/src/pages/builder-v2/components/ProjectSettingsPanel.tsx`

Replaces the right panel when **⚙ Settings** is toggled in the top bar.

#### Sections

**Wedding Date (Canonical)**
- `<input type="date">` with dark theme (`colorScheme: "dark"`)
- On change: updates all 4 date fields simultaneously:
  - `wedding.date` — ISO string (for countdown timer)
  - `wedding.displayDate` — formatted as `DD • MM • YYYY` (for hero display)
  - `wedding.day` — numeric day string
  - `wedding.month` — month name (e.g. `"July"`)
- Shows live preview of formatted date below the picker

**Couple**
- Groom / Partner 1 name — auto-updates `couple.combinedNames`
- Bride / Partner 2 name — auto-updates `couple.combinedNames`
- Combined display name (override)

**Hero Copy**
- Intro line (above couple names)
- Subtitle (below couple names)
- Hero location line

**Venue**
- Venue name
- Venue address (textarea, for Google Maps link)

**RSVP**
- RSVP section title
- RSVP description
- RSVP deadline text

**Notification Email**
- Single RSVP notification email address
- Updates `email.recipients[0]`
- Note: does not change RSVP submission logic

**Background Music**
- Toggle switch to enable/disable
- URL field (appears only when enabled)

**Footer**
- Footer tagline text

**Social Links**
- Instagram URL
- Twitter / X URL

**SEO / Sharing**
- Page title (meta `<title>`)
- Meta description

All changes flow through `updateConfig()` and are saved with Save Draft / Publish.

---

### 8. Inspector Control Primitives

**File:** `client/src/pages/builder-v2/components/InspectorControls.tsx`

15+ reusable controls for the inspector:

| Component | Description |
|-----------|-------------|
| `FieldGroup` | Section wrapper with indigo divider label |
| `TextField` | Single-line text input |
| `TextareaField` | Multi-line textarea, optional `monospace` mode |
| `ColorField` | Color picker + hex text input side by side |
| `SelectField` | Styled `<select>` dropdown with chevron |
| `ToggleField` | iOS-style toggle switch with optional help text |
| `SectionDivider` | Thin horizontal rule |
| `InfoNote` | Dark callout box for tips/warnings |
| `SliderField` | Range slider with live value display + unit |
| `NumberField` | Numeric input with optional unit label |
| `SpacingField` | 4-box T/R/B/L padding/margin editor |
| `AlignmentField` | Left / Center / Right 3-button selector |
| `FontWeightField` | Font weight selector (300–700) |
| `ShadowField` | Text shadow toggle + X/Y/blur/color controls |
| `AnimationField` | Entrance animation selector |
| `MilestoneEditor` | Repeatable list editor for journey milestones |
| `VenueCardEditor` | Repeatable list editor for detail/venue cards |
| `ImageField` | Image URL input with preview thumbnail + clear button |
| `ButtonLinkField` | Button label + href (security-validated) + new-tab toggle |

#### Security — URL Validation in `ButtonLinkField`
`javascript:` and `data:` URI schemes are blocked with a red error state. Allowed: `https://`, `http://`, `mailto:`, `tel:`, relative paths (`/`, `#`).

---

### 9. Undo / Redo System

- Every `UPDATE_CONFIG` action pushes the previous `draftConfig` onto the `past` stack
- `UNDO` pops from `past`, pushes current to `future`
- `REDO` pops from `future`, pushes current to `past`
- History limited to 50 entries (`MAX_HISTORY`)
- History is cleared on successful save (clean baseline)
- Undo/Redo buttons disabled when stacks are empty

---

### 10. Save & Publish Flow

#### Save Draft
1. Button enabled only when `hasUnsavedChanges && !isSaving`
2. Dispatches `SAVE_START` → button shows `"Saving…"`
3. `PUT /api/templates/${templateId}/config` with `Content-Type: application/json` + JWT auth header
4. On success: dispatches `SAVE_SUCCESS` — sets `savedConfig = draftConfig`, clears undo history, shows `"✓ Saved HH:MM"`
5. On error: dispatches `SAVE_ERROR` — re-enables button

#### Publish
1. Saves config to same API endpoint (identical to Save Draft)
2. On success: dispatches both `SAVE_SUCCESS` and `PUBLISH_SUCCESS`
3. Shows amber `"Publishing…"` spinner during operation

#### Discard
- Shows browser `confirm()` dialog
- Dispatches `DISCARD` — reverts `draftConfig` to `savedConfig`, clears both undo stacks

---

### 11. Preview Mode

- **Toggle:** Preview button in top bar
- When active:
  - Left panel hidden
  - Right panel hidden
  - Canvas click handlers disabled
  - Canvas selection outlines removed
  - "Preview Mode" banner shown at top of canvas
  - Top bar shows only "← Exit Preview" button (device selector, undo/redo, save, settings hidden)
- Template renders exactly as visitors would see it

---

### 12. Responsive Device Preview

Three modes (controlled by `devicePreview` in state):

| Mode | Canvas max-width |
|------|-----------------|
| Desktop | 100% of available space |
| Tablet | 768px (centered) |
| Mobile | 390px (centered) |

Canvas transitions smoothly between widths (`transition: max-width 0.3s ease`).

---

## Safety Constraints Maintained

- **V1 builder untouched** — `client/src/components/template-admin-panel.tsx` not modified
- **V1 templates untouched** — `pro`, `classic`, `elegant`, `romantic`, `nature` not modified
- **RSVP submission logic untouched** — `server/routes/templates.ts` RSVP endpoint not touched
- **Auth system untouched** — `server/middleware/auth.ts` not modified
- **No commits, no deployment**
- **No production data mutations** — builder only reads from the API; writes go through the existing config PUT endpoint

---

## Known Remaining Tasks

| Priority | Feature | Status |
|----------|---------|--------|
| Medium | Gallery image upload integration in builder | Pending |
| Medium | Roadmap / Journey full repeatable item editor with add/remove | Pending |
| Medium | Detail cards full repeatable editor with add/remove | Pending |
| Low | RSVP form visual labels editor (without touching submit logic) | Pending |
| Low | Hero background image upload (uses existing upload endpoint) | Pending |
| Low | Social links editor in footer inspector | Pending |
| Low | Responsive preview polish (scroll position sync between devices) | Pending |
