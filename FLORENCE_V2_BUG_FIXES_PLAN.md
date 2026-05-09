# Florence V2 Builder — Bug Fix Implementation Plan
## Phase 0 Inspection Report + Proposed Changes

> Status: **AWAITING APPROVAL** — no files have been edited yet.

---

## 1. Files Inspected

| File | Lines Read | Status |
|------|-----------|--------|
| `client/src/templates/florence/manifest.ts` | 1–260 (full) | ✅ Complete |
| `client/src/templates/florence/inspectors.tsx` | 1–450 (full) | ✅ Complete |
| `client/src/templates/florence/FlorenceTemplate.tsx` | 1–1160 (partial) | ✅ Key sections read |
| `client/src/templates/florence/config.ts` | 1–160 (full) | ✅ Complete |
| `client/src/pages/builder-v2/components/BuilderCanvas.tsx` | key handlers | ✅ Key handlers read |
| `client/src/pages/builder-v2/components/InspectorControls.tsx` | MilestoneEditor section | ✅ Complete |

---

## 2. Bug Root Cause Analysis

### Bug 1 — Groom Name not editable in hero

**Root cause (3 parts):**

A. `HeroInspector` (`inspectors.tsx` lines 100–196) has these fields: heroIntro, heroSub, heroLocation, background image — **no groomName or brideName fields**.

B. In `FlorenceTemplate.tsx` around line 556, `groomName` h1 has `data-v2-element="hero-title"` ✅ — but the **brideName h1 (line ~563) has NO `data-v2-element` attribute** at all.

C. `manifest.ts` has `"hero-title"` element pointing to `c.couple?.groomName` — but **no `hero-bride` element** for `brideName`.

**Click path:** clicking groomName works (selects element, shows HeroInspector) but HeroInspector has no name field. Clicking brideName does nothing (no `data-v2-element`).

---

### Bug 2 — Subtitle line not separately clickable

**Root cause (2 parts):**

A. The `heroSub` `<p>` element in `FlorenceTemplate.tsx` (~line 578) **has no `data-v2-element` attribute**. Clicking it falls through to the section, not an element.

B. `manifest.ts` **has no `hero-sub` element** defined.

**Note:** `HeroInspector` already has the `heroSub` TextField (lines 129–134) — that field is already wired. It just can't be triggered by clicking the element in canvas because the attribute and manifest entry are missing.

---

### Bug 3 — Date does not affect countdown

**Root cause:**

`CountdownInspector` (`inspectors.tsx` lines 270–310) only edits `countdown.subtitle` and `countdown.labels`. **No date field.**

The countdown `useEffect` in `FlorenceTemplate.tsx` line ~138 correctly re-runs when `cfg.wedding.date` changes:
```ts
}, [cfg.wedding.date]);
```
So the countdown logic IS reactive — the only missing piece is a date input in the inspector.

The `GlobalThemeInspector` in `BuilderRightPanel.tsx` does have a `DateField` for `wedding.date`, but it only appears when **no section is selected**. This is unintuitive — user clicks Countdown section, expects to edit the date there.

---

### Bug 4 — "Our Story" title not editable

**Root cause (most likely target):**

The small uppercase "OUR STORY" section label rendered above the big italic heading (`FlorenceTemplate.tsx` ~line 680) is **hardcoded** plain text:
```tsx
<p style={{ ... color: C.gold, ... }}>
  OUR STORY
</p>
```
No `data-v2-element`, no config field, no inspector control.

**Secondary note on big storyTitle:** The big italic heading (`h2`) **does** have `data-v2-element="story-title"` and `StoryInspector` has a matching field — this should be working. However, double-click inline edit will show an **empty** initial value if `storyTitle` has never been saved to config (default comes from `ext.storyTitle || "Two paths. One forever."` at render time, but `getElementValue` returns `(c as any).storyTitle ?? ""` which is `""` for a fresh template). A fix is to initialise `getElementValue` with the render-time fallback.

---

### Bug 5 — "A/R" monogram not editable, image blocks

**Monogram root cause:**
```tsx
// FlorenceTemplate.tsx ~line 316
{groomName[0]} <span>/</span> {brideName[0]}
```
The monogram **auto-derives from couple names** — it has no independent config path and no `data-v2-element`. **Once Bug 1 is fixed (names editable), monogram auto-updates.** No extra wiring is needed.

**Image blocks:** The `makeUploader` helper is defined and `HeroInspector`/`StoryInspector` both have image upload UI. This is likely a **live environment issue** (upload API requires authenticated session; dev mode bypasses auth). Cannot confirm from code inspection alone. No code change proposed for this sub-bug.

---

### Bug 6 — Header navbar not editable

**Root cause:**

`navLinks` in `FlorenceTemplate.tsx` lines ~262–269 is a **fully hardcoded array**:
```ts
const navLinks = [
  { label: "HOME",       id: "flo-hero" },
  { label: "OUR STORY",  id: "flo-story" },
  { label: "WEDDING",    id: "flo-details" },
  { label: "DETAILS",    id: "flo-venue" },
  { label: "GALLERY",    id: "flo-gallery" },
  { label: "RSVP",       id: "flo-rsvp" },
];
```
No config path. No inspector fields. No manifest elements. Nav items cannot be changed.

---

### Bug 7 — Journey last item visual inconsistency + duplicate slider dots

**Duplicate slider dots (confirmed):**
The horizontal journey layout ends with a hardcoded 2-dot pagination indicator:
```tsx
{[0,1].map(i => (
  <div key={i} style={{ width: i === 0 ? 20 : 8, height: 8, ... }} />
))}
```
These dots always render as exactly 2, regardless of milestone count. They appear **below** the inline milestone dots that are already shown in the timeline grid. Result: users see two separate sets of dots = "duplicate dots." These decorative pagination dots serve no functional purpose.

**Last item visual inconsistency (confirmed):**
Non-last items in the horizontal layout have `marginTop: "8px"` on their dot to align with the connecting line at `top: "16px"`. The last item (32×32 ♥) has **no marginTop** — its center falls at 16px naturally (correct), but the size difference (32px vs 16px) makes it visually stand out and can appear misaligned when the grid has items of varying widths.

**"Crashes":** No code-level JavaScript crash was found via static inspection for the last item. The visual anomalies above may be what users describe as a "crash." If there is a true runtime exception, it needs live reproduction — a guard for empty `time`/`title` fields is a safe addition.

---

### Task 1 — Journey dots should support uploaded icons

**Current state:**
- `Milestone` interface in `InspectorControls.tsx` (line 788): `{ id?, time, title, description }` — no icon field
- `MilestoneEditor` shows: time, title, description — no icon/upload field
- `FlorenceTemplate.tsx` journey dot render: colored CSS circle OR ♥ (last item) — no custom icon support

---

## 3. Files to Change

| File | Changes | Bugs |
|------|---------|------|
| `manifest.ts` | Add `hero-bride`, `hero-sub`, `story-label` elements | 1, 2, 4 |
| `inspectors.tsx` | HeroInspector: add name fields + nav labels; CountdownInspector: add date; StoryInspector: add section label; JourneyInspector: pass icon prop | 1, 2, 3, 4, 6, Task 1 |
| `FlorenceTemplate.tsx` | Add `data-v2-element` attrs; config-drive navLinks; fix "OUR STORY" label; fix journey dots | 1, 2, 4, 6, 7 |
| `InspectorControls.tsx` | Add optional `iconUrl` + `showIconUpload` to MilestoneEditor | Task 1 |

**NOT touched:** V1 templates, V1 builder panels, `shared/schema.ts`, auth/email/upload infrastructure, RSVP logic.

---

## 4. Proposed Changes (Detailed)

### 4.1 `manifest.ts` — 3 new element entries

```ts
// Add to FLORENCE_ELEMENTS:

"hero-bride": {
  id: "hero-bride", sectionId: "flo-hero", label: "Bride Name", type: "text",
  getValue: (c) => c.couple?.brideName     ?? "",
  setValue: (c, v) => ({ ...c, couple: { ...c.couple, brideName: v } }),
},

"hero-sub": {
  id: "hero-sub", sectionId: "flo-hero", label: "Subtitle Line", type: "text",
  getValue: (c) => (c as any).heroSub || "",
  setValue: (c, v) => ({ ...c, heroSub: v }),
},

"story-label": {
  id: "story-label", sectionId: "flo-story", label: "Section Label", type: "text",
  getValue: (c) => (c as any).storySectionLabel || "",
  setValue: (c, v) => ({ ...c, storySectionLabel: v }),
},
```

Also add children entries to the appropriate sections in `FLORENCE_SECTIONS`:
- `flo-hero` children: add `hero-bride` (Bride Name) and `hero-sub` (Subtitle)
- `flo-story` children: add `story-label` (Section Label)

Also fix `hero-title` `getValue` fallback to return the display value (not empty string) so inline edit pre-fills correctly:
```ts
getValue: (c) => c.couple?.groomName || "Alexander",   // was: ?? ""
```
Same for `hero-bride`:
```ts
getValue: (c) => c.couple?.brideName || "Rosalie",
```

---

### 4.2 `FlorenceTemplate.tsx` — 6 targeted changes

**Change A — brideName h1: add `data-v2-element` (Bug 1)**

Location: the second `<h1 className="flo-hero-names">` (~line 563)

```tsx
// BEFORE — no v2 attributes
<h1 className="flo-hero-names" style={{ ... }}>
  <span ...>&amp;</span> {brideName.toUpperCase()}
</h1>

// AFTER
<h1
  className="flo-hero-names"
  data-v2-element="hero-bride"
  data-v2-type="text"
  style={{ ... }}
>
  <span ...>&amp;</span> {brideName.toUpperCase()}
</h1>
```

**Change B — heroSub `<p>`: add `data-v2-element` (Bug 2)**

Location: the `<p>` that renders `{heroSub}` (~line 578)

```tsx
// BEFORE
<p style={{ ... }}>
  {heroSub}
</p>

// AFTER
<p
  data-v2-element="hero-sub"
  data-v2-type="text"
  style={{ ... }}
>
  {heroSub}
</p>
```

**Change C — storySectionLabel: replace hardcoded "OUR STORY" (Bug 4)**

Location: the small `<p>` label above the storyTitle h2 (~line 680)

```tsx
// BEFORE
<p style={{ ... }}>
  OUR STORY
</p>

// AFTER
const storySectionLabel = ext.storySectionLabel || "OUR STORY";  // add near other ext vars

<p
  data-v2-element="story-label"
  data-v2-type="text"
  style={{ ... }}
>
  {storySectionLabel}
</p>
```

**Change D — config-driven navLinks (Bug 6)**

Location: replace hardcoded `navLinks` array (~line 262)

```tsx
// BEFORE
const navLinks = [
  { label: "HOME",       id: "flo-hero" },
  ...
];

// AFTER — use ext.navLinks with fallback to defaults
const DEFAULT_NAV_LINKS = [
  { label: "HOME",       id: "flo-hero" },
  { label: "OUR STORY",  id: "flo-story" },
  { label: "WEDDING",    id: "flo-details" },
  { label: "DETAILS",    id: "flo-venue" },
  { label: "GALLERY",    id: "flo-gallery" },
  { label: "RSVP",       id: "flo-rsvp" },
];
const navLinks: { label: string; id: string }[] = (ext as any).navLinks || DEFAULT_NAV_LINKS;
```

**Change E — remove static pagination dots (Bug 7 — duplicate dots)**

Location: horizontal journey layout, the `[0,1].map(...)` block at the bottom

```tsx
// REMOVE this entire block:
<div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "2.5rem" }}>
  {[0,1].map(i => (
    <div key={i} style={{ ... }} />
  ))}
</div>
```

**Change F — render milestone icon if provided (Task 1)**

In both vertical and horizontal journey renders, update the dot render:

```tsx
// Horizontal — non-last item dot:
// BEFORE
<div style={{ width: 16, height: 16, borderRadius: "50%", ..., marginTop: "8px" }} />

// AFTER
<div style={{ width: 16, height: 16, borderRadius: "50%", ..., marginTop: "8px", overflow: "hidden" }}>
  {(m as any).iconUrl && <img src={(m as any).iconUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />}
</div>

// Horizontal — last item dot (32px ♥):
// AFTER (fallback to ♥ if no iconUrl):
<div style={{ width: 32, height: 32, ..., overflow: "hidden" }}>
  {(m as any).iconUrl
    ? <img src={(m as any).iconUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
    : "♥"}
</div>
```

Apply same pattern to the vertical layout dot.

---

### 4.3 `inspectors.tsx` — 4 inspector changes

**HeroInspector — add couple name fields and nav editing (Bugs 1, 6)**

After the existing "Content" FieldGroup, add:

```tsx
<FieldGroup label="Couple Names">
  <TextField
    label="Groom Name"
    value={cfg.couple?.groomName || ""}
    onChange={(val) => updateConfig((c) => ({ ...c, couple: { ...c.couple, groomName: val } }))}
    placeholder="Alexander"
  />
  <TextField
    label="Bride Name"
    value={cfg.couple?.brideName || ""}
    onChange={(val) => updateConfig((c) => ({ ...c, couple: { ...c.couple, brideName: val } }))}
    placeholder="Rosalie"
  />
</FieldGroup>
<FieldGroup label="Navigation Labels">
  {(cfg.navLinks || DEFAULT_NAV_LINKS).map((link: { label: string; id: string }, idx: number) => (
    <TextField
      key={link.id}
      label={`Nav Item ${idx + 1}`}
      value={link.label}
      onChange={(val) => {
        const links = [...(cfg.navLinks || DEFAULT_NAV_LINKS)];
        links[idx] = { ...links[idx], label: val };
        updateConfig((c) => ({ ...c, navLinks: links }));
      }}
      placeholder={link.id}
    />
  ))}
</FieldGroup>
```

Note: `DEFAULT_NAV_LINKS` constant is copied from FlorenceTemplate.tsx or imported — kept in sync.

**CountdownInspector — add date field (Bug 3)**

Add a date input at the top of the inspector before existing fields:

```tsx
<FieldGroup label="Wedding Date">
  <TextField
    label="ISO Date (drives countdown)"
    value={cfg.wedding?.date || ""}
    onChange={(val) => updateConfig((c) => ({
      ...c,
      wedding: { ...c.wedding, date: val },
    }))}
    placeholder="2025-07-12T16:00:00"
    monospace
  />
  <p style={{ fontSize: "0.65rem", color: "#6B7280", marginTop: "4px" }}>
    Format: YYYY-MM-DDTHH:MM:SS — this controls the live countdown timer.
  </p>
</FieldGroup>
```

**StoryInspector — add section label field (Bug 4)**

Add a "Section Label" TextField before the existing "Story Title" field:

```tsx
<TextField
  label="Section Label"
  value={cfg.storySectionLabel || ""}
  onChange={(val) => updateConfig((c) => ({ ...c, storySectionLabel: val }))}
  placeholder="OUR STORY"
/>
```

**JourneyInspector — enable icon uploads (Task 1)**

Change the `<MilestoneEditor>` call:

```tsx
// BEFORE
<MilestoneEditor
  milestones={cfg.timeline?.events || []}
  onChange={(events) => updateConfig((c) => ({ ...c, timeline: { ...c.timeline, events } }))}
/>

// AFTER
<MilestoneEditor
  milestones={cfg.timeline?.events || []}
  onChange={(events) => updateConfig((c) => ({ ...c, timeline: { ...c.timeline, events } }))}
  showIconUpload
  templateId={state.templateId}
/>
```

---

### 4.4 `InspectorControls.tsx` — extend MilestoneEditor (Task 1)

**Minimal, backward-compatible changes:**

```ts
// Add iconUrl to Milestone interface (optional — won't break existing milestones without it)
interface Milestone {
  id?:          string;
  time:         string;
  title:        string;
  description:  string;
  iconUrl?:     string;  // NEW — optional uploaded dot icon
}

// Add optional props to MilestoneEditorProps
interface MilestoneEditorProps {
  milestones:      Milestone[];
  onChange:        (milestones: Milestone[]) => void;
  showIconUpload?: boolean;   // NEW — Florence passes true
  templateId?:     string;    // NEW — needed for upload
}
```

In the `MilestoneEditor` render, inside each milestone card, after the `description` input:

```tsx
{showIconUpload && (
  <>
    <input
      value={m.iconUrl || ""}
      onChange={(e) => update(idx, "iconUrl", e.target.value)}
      placeholder="Dot icon URL (paste image URL)"
      style={{ ...INPUT_BASE, fontSize: "0.75rem" }}
    />
    {/* Upload button — reuse existing UploadImageButton if templateId is available */}
    {templateId && (
      <UploadImageButton
        onUpload={async (file) => {
          const uploader = makeUploader(templateId, "milestone");
          const url = await uploader(file);
          update(idx, "iconUrl", url);
        }}
        label="Upload Dot Icon"
      />
    )}
  </>
)}
```

This requires importing `makeUploader` and `UploadImageButton` inside `InspectorControls.tsx` — both are already defined in the same file, so no new imports needed.

---

## 5. What Is NOT Changing

| Concern | Status |
|---------|--------|
| V1 templates (classic, pro, elegant, romantic, nature) | ✅ Not touched |
| V1 builder panels (`BuilderPanel.tsx`, `BuilderRightPanel.tsx` V1) | ✅ Not touched |
| `shared/schema.ts` database schema | ✅ Not touched |
| RSVP submit logic | ✅ Not touched |
| Auth / JWT / middleware | ✅ Not touched |
| Music / sale wheel / Telegram integrations | ✅ Not touched |
| Upload infrastructure (API routes) | ✅ Not touched |
| Image editor | ✅ Not touched |
| `BuilderV2Context.tsx` — save/undo/redo logic | ✅ Not touched |
| `BuilderLeftPanel.tsx` — section drag/drop | ✅ Not touched |
| `BuilderRightPanel.tsx` — generic dispatch logic | ✅ Not touched |

---

## 6. Risks and Assumptions

| Risk | Mitigation |
|------|-----------|
| `navLinks` stored as `ext.navLinks` in JSONB — existing templates without this key fall back to hardcoded defaults | Fallback `|| DEFAULT_NAV_LINKS` is in place |
| `(m as any).iconUrl` cast bypasses TypeScript | Only used in template render; safe since JSONB can hold extra fields |
| Bug 7 "crash" not confirmed at code level | Added defensive `String(m.time \|\| "")` guards + visual fixes; if JS crash exists, needs live reproduction |
| `story-label` init value is `""` (fresh template shows "OUR STORY" from fallback, inline edit starts empty) | Same issue as storyTitle — consistent behavior; use display-time fallback in `getElementValue` |
| MilestoneEditor `showIconUpload` upload path creates files under `templateId/milestone/` — this path must be accepted by the upload API route | Uses same `makeUploader(templateId, category)` pattern as hero/story — should work |
| Bug 5 "image blocks" — not addressed in code | Needs live session with working auth to diagnose; not a code-level issue from inspection |

---

## 7. Change Summary Table

| Bug/Task | Root Cause | Files | Lines of Change |
|----------|-----------|-------|----------------|
| Bug 1 — Groom Name | Missing inspector fields + brideName lacks `data-v2-element` + no manifest element | manifest, inspectors, FlorenceTemplate | ~25 |
| Bug 2 — Subtitle clickable | Missing `data-v2-element` on heroSub + no manifest element | manifest, FlorenceTemplate | ~8 |
| Bug 3 — Date countdown | No date field in CountdownInspector | inspectors | ~10 |
| Bug 4 — Story label | "OUR STORY" hardcoded | manifest, inspectors, FlorenceTemplate | ~12 |
| Bug 5 — Monogram | Auto-derives; fixed by Bug 1 | (none) | 0 |
| Bug 6 — Navbar | navLinks hardcoded array | inspectors, FlorenceTemplate | ~30 |
| Bug 7 — Journey dots | Static pagination dots + visual alignment | FlorenceTemplate | ~8 |
| Task 1 — Dot icons | No iconUrl in Milestone type or MilestoneEditor | InspectorControls, inspectors, FlorenceTemplate | ~30 |

**Total estimated lines changed: ~123 across 4 files.**

---

## 8. Implementation Order (if approved)

1. `manifest.ts` — add 3 elements (self-contained, no risk)
2. `FlorenceTemplate.tsx` — add `data-v2-element` attributes (Changes A, B, C); config-drive navLinks (D); fix journey dots (E, F)
3. `inspectors.tsx` — add fields to HeroInspector, CountdownInspector, StoryInspector, JourneyInspector
4. `InspectorControls.tsx` — extend MilestoneEditor (last, so Florence inspector changes land first)
5. `npm run check` — verify TypeScript 0 errors

---

*This plan is ready for review. Reply "approved" or provide revision feedback before implementation begins.*
