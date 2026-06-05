---
name: builder-v2-template-editability
description: Ensure every visible V2 template text, style, color, font, font-size, image, background image, background, icon, list item, and language value is editable in Builder V2 with live preview updates.
---

# Builder V2 Template Editability Skill

## Purpose

Ensure every user-visible element in a V2 template (Aurelia, Florence, etc.) is fully editable through Builder V2's section panel and inspector system — with live preview. No visible string, image, or style value may be hardcoded.

---

## Builder V2 Architecture

### How it works
1. User opens Builder V2 (`/builder-v2/:templateId`)
2. Left panel shows section tree from `manifest.sections`
3. Clicking a section opens its `sectionInspectors[sectionId]` in the right panel
4. Inspector calls `updateConfig(c => ({ ...c, field: value }))` → preview re-renders instantly
5. Inline click-to-edit: `data-v2-element` attrs on DOM nodes open a quick-edit overlay

### Key files
| File | Role |
|---|---|
| `client/src/pages/builder-v2/BuilderV2Page.tsx` | Builder shell, left panel, preview iframe |
| `client/src/pages/builder-v2/components/InspectorControls.tsx` | All shared editor primitives |
| `client/src/templates/aurelia/manifest.ts` | Aurelia section/element registry + inspector map |
| `client/src/templates/aurelia/inspectors.tsx` | Aurelia per-section inspector panels |
| `client/src/templates/florence/manifest.ts` | Florence manifest |
| `client/src/templates/florence/inspectors.tsx` | Florence inspectors |

---

## Manifest Structure

Every V2 template exports a manifest object:

```typescript
// manifest.ts
export const AURELIA_MANIFEST: TemplateManifest = {
  sections:          AURELIA_SECTIONS,    // left-panel tree
  elements:          AURELIA_ELEMENTS,    // inline click-to-edit registry
  sectionInspectors: {                    // right-panel panels
    "aur-hero":    HeroInspector,
    "aur-roadmap": RoadmapInspector,
    "aur-details": DetailsInspector,
    // ...
  },
};
```

### Section shape
```typescript
{
  id:        string;          // e.g. "aur-roadmap"
  label:     string;          // shown in left panel, e.g. "Wedding Route"
  icon:      string;          // small icon text/emoji
  hideable?: boolean;         // shows eye toggle in panel
  configKey?: string;         // maps to WeddingConfig key for enable/disable
  children?: Array<{
    id:         string;       // e.g. "aur-roadmap-milestones"
    label:      string;       // e.g. "Route Stops"
    icon:       string;
    sectionId:  string;
    elementId?: string;       // links to ELEMENTS registry for inline edit
  }>;
}
```

### Element shape (inline click-to-edit)
```typescript
{
  id:       string;           // e.g. "aur-roadmap-heading"
  sectionId: string;
  label:    string;
  type:     "text" | "textarea" | "image";
  getValue: (config: WeddingConfig) => string;
  setValue: (config: WeddingConfig, value: string) => Partial<WeddingConfig>;
}
```

---

## Inspector Panel Primitives

All inspector primitives are exported from `InspectorControls.tsx`:

### Text fields
```tsx
<TextField
  label="Section Heading"
  value={cfg.roadmapHeading ?? ""}
  onChange={(v) => updateConfig((c) => ({ ...c, roadmapHeading: v }))}
  placeholder="Your Wedding Day Roadmap"
/>

<TextareaField
  label="Subtitle"
  value={cfg.roadmapSubtitle ?? ""}
  onChange={(v) => updateConfig((c) => ({ ...c, roadmapSubtitle: v }))}
  rows={3}
  placeholder="Follow the route from the first stop..."
/>
```

### Image upload
```tsx
// Shows current image preview + remove button + upload + URL paste
<UploadImageButton onUpload={handleUpload} label="Upload Background" />
<TextField label="Or paste image URL" value={cfg.bgImage ?? ""} onChange={...} monospace />
```

Upload flow: `makeUploader(templateId, "section-name")(file)` → Cloudflare R2 → returns URL → `updateConfig`.

### List editors

**MilestoneEditor** — for route stops, timeline events:
```tsx
<MilestoneEditor
  milestones={milestones}
  onChange={(updated) => updateConfig((c) => ({ ...c, timeline: { ...c.timeline, events: updated } }))}
  onImageUpload={makeMilestoneImageUploader}
/>
```
Each item card exposes: time, title, description, address, mapUrl, buttonText, image URL + upload.

**VenueCardEditor** — for detail/info cards:
```tsx
<VenueCardEditor
  venues={venues}
  onChange={(updated) => updateConfig((c) => ({ ...c, locations: { ...c.locations, venues: updated } }))}
/>
```
Each card exposes: title, name, description, mapButton text.

### Field groups
```tsx
<FieldGroup label="Content">
  <TextField ... />
  <TextareaField ... />
</FieldGroup>

<FieldGroup label="Background Image">
  <UploadImageButton ... />
  <TextField ... />
</FieldGroup>
```

### Info note
```tsx
<InfoNote>
  Add route stops in order. Each stop can have an address and a map link.
</InfoNote>
```

### Inspector header
```tsx
<InspectorHeader title="Wedding Route" subtitle="Animated wedding-day route map" />
```

---

## Template-Side Requirements

### data-v2 attributes
Every editable region in the template JSX must have attributes so Builder V2 can identify and highlight them:

```tsx
// Section container
<section id="aur-roadmap" data-v2-section="aur-roadmap" ...>

// Inline-editable text
<h2
  data-v2-element="aur-roadmap-heading"
  data-v2-type="text"
>
  {roadmapHeading}
</h2>

// Image region
<div data-v2-element="aur-roadmap-bg" data-v2-type="image" ...>
```

### builderMode prop
When `builderMode=true`:
- Skip all scroll animations (set progress=1, visible=true immediately)
- Skip IntersectionObserver animations
- Keep `data-v2-*` attributes active
- Do NOT skip rendering sections

```typescript
if (builderMode || prefersReduced) { setProgress(1); return; }
```

### Config reading pattern
Extended per-template fields read from flat JSONB:

```typescript
const ext = cfg as unknown as AureliaExtendedConfig & WeddingConfig & Record<string, unknown>;
const roadmapHeading = (ext.roadmapHeading as string | undefined) ?? "Your Wedding Day Roadmap";
```

---

## What Must Be Editable

### Per section (minimum)
| Section | Must expose |
|---|---|
| Hero | Images, invitation text, welcome text, CTA, music button, background |
| Story | Heading, body text, CTA label, image, background |
| Roadmap/Route | Eyebrow, heading, subtitle, scroll instruction, background image, all route stops (title/time/desc/address/mapUrl/buttonText/image) |
| Details/Notes | Small label, section title, all cards (title/name/description) |
| Venue | Subtitle label, venue name, description, CTA, address, map URL, image |
| Gallery | Title, subtitle, background image, all gallery images |
| RSVP | Title, description, all form labels + placeholders, background image |
| Footer | Tagline, separator, social links |

### Always editable
- Background images (upload + URL paste)
- Section enable/disable toggles (hideable sections)
- Colors via `cfg.theme.colors`
- Fonts via `cfg.theme.fonts`

### Never hardcode
- Section titles, eyebrows, subtitles
- Button labels
- Placeholder text
- Image URLs
- Icon labels or descriptions

---

## Adding a New Editable Field

**Step 1** — Add to `AureliaExtendedConfig` in `config.ts`:
```typescript
export interface AureliaExtendedConfig {
  routeInstruction?: string;  // e.g. "Scroll to follow the route"
}
```

**Step 2** — Read in `AureliaTemplate.tsx` with fallback:
```typescript
const routeInstruction = (ext.routeInstruction as string | undefined) ?? "Scroll to follow the route";
```

**Step 3** — Render with `data-v2-element` if inline-editable:
```tsx
<p data-v2-element="aur-roadmap-instruction" data-v2-type="text">{routeInstruction}</p>
```

**Step 4** — Add to `AURELIA_ELEMENTS` in `manifest.ts`:
```typescript
"aur-roadmap-instruction": {
  id: "aur-roadmap-instruction", sectionId: "aur-roadmap", label: "Scroll Instruction", type: "text",
  getValue: (c) => (c as any).routeInstruction ?? "",
  setValue: (c, v) => ({ ...c, routeInstruction: v }),
},
```

**Step 5** — Add `TextField` to `RoadmapInspector` in `inspectors.tsx`:
```tsx
<TextField
  label="Scroll Instruction"
  value={cfg.routeInstruction ?? ""}
  onChange={(v) => updateConfig((c) => ({ ...c, routeInstruction: v }))}
  placeholder="Scroll to follow the route"
/>
```

**Step 6** — Optionally add to `manifest.sections[].children` for left-panel visibility.

---

## Adding a New List Item Field

When extending `MilestoneEditor` (e.g. adding `address` to route stops):

**Step 1** — Extend `Milestone` interface in `InspectorControls.tsx`:
```typescript
interface Milestone {
  // existing...
  address?:    string;
  mapUrl?:     string;
  buttonText?: string;
}
```

**Step 2** — Add input fields in the `MilestoneEditor` card JSX.

**Step 3** — Template reads via cast:
```typescript
const stopAddress = (m as Record<string, unknown>).address as string | undefined;
```

**Step 4** — Update the milestones type cast in `inspectors.tsx`.

---

## Live Preview Contract

`updateConfig` dispatches to `BuilderV2Page` context → triggers re-render of the preview iframe (or inline preview) → user sees changes instantly.

- Never use local state for content that should persist — always go through `updateConfig`
- `updateConfig` receives a function `(currentConfig) => partialUpdate` — always spread existing config
- Extended fields (flat JSONB) are set at root level: `{ ...c, myField: value }`
- Nested fields use spread: `{ ...c, timeline: { ...c.timeline, events: updated } }`

---

## Editability Checklist

Before reporting a Builder V2 editability task complete:

- [ ] Every visible text in the section has a corresponding `TextField` or `TextareaField` in the inspector
- [ ] Every image/background has an `UploadImageButton` + URL paste field
- [ ] List items (stops, venues, gallery) are add/remove/reorder-able
- [ ] Each list item's fields are individually editable
- [ ] `data-v2-section` on section container
- [ ] `data-v2-element` + `data-v2-type` on inline-editable nodes
- [ ] New fields added to `AURELIA_ELEMENTS` for inline click-to-edit
- [ ] Section label updated in `manifest.sections` if renamed
- [ ] `npx tsc --noEmit` passes
- [ ] Inspector panel renders without errors in builder mode
- [ ] `updateConfig` calls use correct spread pattern (no mutation)
