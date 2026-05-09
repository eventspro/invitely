# V2 Builder — Phase 0 Inspection Evidence + Remaining Work Plan

**Date:** 2026-05-04  
**TypeScript status:** 0 errors (confirmed: `npx tsc --noEmit` exit 0)  
**Inspection method:** `grep_search` across `client/**/*.{ts,tsx}` + `read_file` on each named file  

---

## Phase 0 — Explicit Inspection Evidence

### 1. BuilderRightPanel has zero Florence-specific logic

**File read:** `client/src/pages/builder-v2/components/BuilderRightPanel.tsx` (full 550 lines)

**Imports block (lines 1–27):** No Florence import, no `V2_FLORENCE_ELEMENTS`, no `V2_FLORENCE_LAYERS`.
Only imports: React, `useBuilderV2`, `InspectorControls` fields, `InspectorTab` type, `WeddingConfig` type,
`getElementValue`/`setElementValue` from `manifest-types.ts`.

**Section dispatch (lines 448–462):**
```tsx
} else if (selectedSection) {
  // Manifest custom inspector takes priority; fall back to generic
  const SectionInspector = manifest?.sectionInspectors?.[selectedSection];
  if (SectionInspector) {
    contentInspector = <SectionInspector />;
  } else {
    contentInspector = <GenericSectionInspector sectionId={selectedSection} />;
  }
}
```
No `switch(selectedSection)`, no hardcoded Florence section IDs.

**contextLabel (lines 430–437):**
```tsx
const contextLabel = elementDef
  ? `Element: ${elementDef.label}`
  : sectionDef
  ? `Section: ${sectionDef.label}`
  : selectedSection
  ? `Section: ${selectedSection}`
  : "Global Theme";
```
Uses `manifest?.sections.find()` — fully generic.

**StyleTab (lines 197–240):** Uses `manifest?.elements[selectedElement]?.label` only.  
**AdvancedTab (lines 242–298):** Uses `manifest?.sections.find((s) => s.id === selectedSection)` only.  
**ElementContentControls (lines 300–400):** Uses `manifest?.elements[elementId]` only; no Florence fallback.

**Verdict: CONFIRMED — zero Florence-specific code in BuilderRightPanel.tsx.**

---

### 2. `BUILTIN_SECTION_INSPECTORS` exists nowhere in source

**Grep command:** `query: "BUILTIN_SECTION_INSPECTORS"` across entire workspace

**Results — 5 matches, ALL in documentation MD files:**
- `V2_BUILDER_GENERIFICATION_REPORT.md` line 232 — prose description
- `V2_BUILDER_GENERIFICATION_REPORT.md` line 236 — section heading
- `V2_BUILDER_GENERIFICATION_REPORT.md` line 238 — code example in report
- `V2_BUILDER_GENERIFICATION_REPORT.md` line 348 — status table
- `V2_BUILDER_GENERIFICATION_REPORT.md` line 371 — limitations note

**Zero matches in any `.ts` or `.tsx` file.**

**Verdict: CONFIRMED — `BUILTIN_SECTION_INSPECTORS` does not exist in any source file.**

---

### 3. `V2_FLORENCE_ELEMENTS` is not imported or referenced in source

**Grep 1:** `query: "V2_FLORENCE_ELEMENTS"` in `client/**/*.{ts,tsx}` — **2 matches:**
- `client/src/pages/builder-v2/types.ts` line 73: the `export const V2_FLORENCE_ELEMENTS = { ... }` definition
- `client/src/templates/florence/manifest.ts` line 128: comment only — `// ─── Element definitions (mirrors former V2_FLORENCE_ELEMENTS) ─`

**Grep 2:** `query: "import.*V2_FLORENCE"` in `client/**/*.{ts,tsx}` — **0 matches.**

**Also confirmed dead:** `V2_FLORENCE_LAYERS` (defined at `types.ts` line 137) appears only as a comment in `florence/manifest.ts` line 38 — also never imported.

**Verdict: CONFIRMED — `V2_FLORENCE_ELEMENTS` and `V2_FLORENCE_LAYERS` are defined but never imported anywhere. Both are dead exports.**

---

### 4. How section reordering updates `draftConfig.sectionOrder`

**File:** `client/src/pages/builder-v2/components/BuilderLeftPanel.tsx`

**`handleDrop` function (lines 124–142):**
```ts
const handleDrop = (targetId: string) => {
  const srcId = dragSrcId.current;
  if (!srcId || srcId === targetId) { ... return; }
  const newOrder = [...layerOrder];
  const srcIdx = newOrder.indexOf(srcId);
  const tgtIdx = newOrder.indexOf(targetId);
  if (srcIdx !== -1 && tgtIdx !== -1) {
    newOrder.splice(srcIdx, 1);
    newOrder.splice(tgtIdx, 0, srcId);
  }
  setLayerOrder(newOrder);                                          // ← local React state
  updateConfig((cfg) => ({ ...cfg, sectionOrder: newOrder } as any)); // ← pushes to draftConfig
  ...
};
```

**`updateConfig`** dispatches `{ type: "UPDATE_CONFIG", updater }` to `BuilderV2Context`.

**Reducer `UPDATE_CONFIG` case** (`BuilderV2Context.tsx` lines 23–32):
```ts
case "UPDATE_CONFIG": {
  const newDraft = action.updater(state.draftConfig);   // applies sectionOrder
  const newPast = [state.draftConfig, ...state.past].slice(0, MAX_HISTORY);
  return {
    ...state,
    draftConfig: newDraft,         // ← draftConfig now has sectionOrder: newOrder
    past: newPast,                  // ← old config (without/with old sectionOrder) saved to history
    future: [],
    hasUnsavedChanges: true,
  };
}
```

**Downstream:** `BuilderCanvas` renders `FlorenceTemplate` with the new `draftConfig` via context. FlorenceTemplate reads `(cfg as any).sectionOrder` and applies CSS `order` values.

---

### 5. How undo/redo handles reorder

**Reducer `UNDO` case** (`BuilderV2Context.tsx` lines 58–65):
```ts
case "UNDO": {
  if (state.past.length === 0) return state;
  const [prev, ...newPast] = state.past;
  return {
    ...state,
    draftConfig: prev,                            // ← restored config (old sectionOrder or undefined)
    past: newPast,
    future: [state.draftConfig, ...state.future], // ← current pushed to redo stack
    hasUnsavedChanges: true,
  };
}
```
`REDO` is symmetric. Because `sectionOrder` is just another field inside `draftConfig`, undo/redo correctly travel through ordering changes.

**Known limitation (pre-existing, not introduced by this work):**  
`BuilderLeftPanel` has its own local `layerOrder` React state that syncs via `useEffect` only when `manifest?.templateKey` changes (line 36–47), NOT when `draftConfig.sectionOrder` changes. After undo/redo:
- The canvas **correctly reverts** (FlorenceTemplate re-reads `cfg.sectionOrder`)
- The left panel layers list **does NOT visually revert** (local `layerOrder` state remains stale)

This undo/redo left-panel visual desync is pre-existing and is not part of the hero ordering bug being fixed.

---

### 6. Where config is saved for Save Draft / Publish

**`save()` function** (`BuilderV2Context.tsx` lines ~210–232):
```ts
const save = useCallback(async () => {
  dispatch({ type: "SAVE_START" });
  const token = localStorage.getItem("admin-token");
  const res = await fetch(`/api/templates/${templateId}/config`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(state.draftConfig),   // ← full draftConfig incl. sectionOrder
  });
  if (!res.ok) throw new Error("Save failed");
  dispatch({ type: "SAVE_SUCCESS", config: state.draftConfig });
}, [templateId, state.draftConfig]);
```

`publish()` calls the same `PUT` then additionally dispatches `PUBLISH_SUCCESS`.

**Server endpoint:** `server/routes.ts` line 986 — `PUT /api/templates/:templateId/config`:
```ts
const config = req.body;               // entire draftConfig JSON
await storage.updateTemplate(template.id, { config });  // saves as JSONB
```
`sectionOrder` is inside `req.body` → saved to the `templates.config` JSONB column.

**On next load:** The `GET /api/templates/:id/config` endpoint (routes.ts line 886) creates `enrichedConfig`:
```ts
const enrichedConfig = {
  ...config,                          // preserves sectionOrder
  hero:   { ...config.hero,   images: heroImages.length > 0 ? ... },
  photos: { ...config.photos, images: mergedGalleryImages },
};
```
`sectionOrder` is preserved in the spread and returned to both the builder and public view.

---

### 7. How FlorenceTemplate reads and renders `sectionOrder`

**File:** `client/src/templates/florence/FlorenceTemplate.tsx`

**Read (lines 270–274):**
```ts
const _savedSectionOrder: string[] | undefined = (cfg as any).sectionOrder;
const getSectionOrder = _savedSectionOrder
  ? (id: string) => { const i = _savedSectionOrder.indexOf(id); return i === -1 ? 99 : i; }
  : null;
```
If `sectionOrder` is absent, `getSectionOrder` is `null` → no flex layout applied (template renders in normal DOM flow).

**Root container (line 282):** Becomes `display: flex; flex-direction: column` when `getSectionOrder` is non-null.

**Nav (line 287):** `order: -1` — hardcoded, always first regardless of `sectionOrder`.

**Sections with `order` spread (confirmed via grep `getSectionOrder` — 19 matches):**

| Section | File line | Order spread |
|---|---|---|
| `flo-story` | 666 | `order: getSectionOrder("flo-story")` ✅ |
| `flo-countdown` | 866 | `order: getSectionOrder("flo-countdown")` ✅ |
| `flo-journey` | 937 | `order: getSectionOrder("flo-journey")` ✅ |
| `flo-details` | 1130 | `order: getSectionOrder("flo-details")` ✅ |
| `flo-venue` | 1222 | `order: getSectionOrder("flo-venue")` ✅ |
| `flo-gallery` | 1380 | `order: getSectionOrder("flo-gallery")` ✅ |
| `flo-rsvp` | 1487 | `order: getSectionOrder("flo-rsvp")` ✅ |
| `flo-footer` | 1709 | `order: getSectionOrder("flo-footer")` ✅ |
| `flo-hero` | 481–498 | **missing** ❌ |

**Hero section style block (lines 485–498) — exact current code:**
```tsx
<section
  id="flo-hero"
  data-v2-section="flo-hero"
  ref={heroAnim.ref as React.Ref<HTMLElement>}
  style={{
    position:   "relative",
    minHeight:  "92vh",
    display:    "flex",
    alignItems: "center",
    background: heroImage
      ? `url(${heroImage}) center/cover no-repeat`
      : `linear-gradient(135deg, ${C.darkOlive} 0%, ${C.midOlive} 60%, #1E211A 100%)`,
    overflow:   "hidden",
    ...heroAnim.style,
    // ← NO order spread here
  }}
>
```

**Effect of the bug:** In a flex-column container, a child without an explicit `order` defaults to CSS `order: 0`.
This means `flo-hero` always renders at effective order 0, regardless of what position the user assigns in the builder.
Other sections with explicit `order: N` (from `getSectionOrder`) can move around hero but hero itself stays near the top.

---

### 8. Public/preview runtime uses saved `sectionOrder`

**Flow confirmed:**

1. User saves in builder → `PUT /api/templates/:id/config` → full `draftConfig` (with `sectionOrder`) saved as JSONB
2. Public visitor loads `/w/florence-eternal` → `TemplateRenderer` fetches `GET /api/templates/:id/config`
3. Server returns `{ config: enrichedConfig }` where `enrichedConfig = { ...config, hero: {...}, photos: {...} }` — `sectionOrder` is in the `...config` spread
4. `TemplateRenderer` (template-renderer.tsx line 133): `<TemplateComponent config={templateConfig.config} templateId={...} />`
5. FlorenceTemplate receives `config.sectionOrder` → applies flex ordering to all sections

**Conclusion:** `sectionOrder` IS live on public/preview after save. The hero ordering bug therefore also affects the public-facing site — if a user reorders sections and saves, hero's position won't be correctly reflected in the public view either.

---

### 9. Is the hero ordering bug the only persistence/rendering gap?

**Evidence from grep + read:**

**Ordering gaps:** Only `flo-hero` is missing the `order` spread. All other 8 manifest sections have it. 
The manifest (`florence/manifest.ts` lines 40–120) defines exactly 9 sections:
`flo-hero`, `flo-story`, `flo-countdown`, `flo-journey`, `flo-details`, `flo-venue`, `flo-gallery`, `flo-rsvp`, `flo-footer`.
Of these, 8 have order spreads and 1 (`flo-hero`) does not. **This is the only ordering/rendering gap.**

**Persistence gaps:** None found. `sectionOrder` round-trips correctly:
- Drag → `draftConfig.sectionOrder` set → builder canvas updates → Save → server JSONB saved → GET returns it → public view reflects it

**Pre-existing limitations (not gaps introduced by this work):**
- Left panel `layerOrder` local state doesn't sync on undo/redo (undo restores canvas correctly, left panel lags)
- `sectionOrder` is typed as `any` (not in `WeddingConfig` TS interface) — JSONB design choice, no runtime impact

---

### 10. Grep commands used

```
grep_search("BUILTIN_SECTION_INSPECTORS")                           → 5 MD-only matches
grep_search("V2_FLORENCE_ELEMENTS", client/**/*.{ts,tsx})           → 2 matches (definition + comment)
grep_search("import.*V2_FLORENCE", client/**/*.{ts,tsx})            → 0 matches
grep_search("V2_FLORENCE_LAYERS", client/**/*.{ts,tsx})             → 2 matches (definition + comment)
grep_search("getSectionOrder", FlorenceTemplate.tsx)                → 19 matches (see table above)
grep_search("sectionOrder", client/**/*.{ts,tsx})                   → 20+ matches (all traced)
grep_search("florence", client/**/*.{ts,tsx})                       → 20+ matches — none in builder source files
grep_search("GET.*templates.*config", client/**/*.{ts,tsx})         → 9 matches — confirmed route
grep_search("PUT.*templates.*config", server/**/*.{ts})             → 3 matches — confirmed save endpoint
read_file(BuilderRightPanel.tsx, 1–550)
read_file(BuilderLeftPanel.tsx, 1–180)
read_file(BuilderV2Context.tsx, 1–310)
read_file(FlorenceTemplate.tsx, 265–510, 658–680, 858–878)
read_file(server/routes.ts, 886–1020)
read_file(template-renderer.tsx, 1–175)
```

---

## Safe Implementation Plan

### Task 1 — Fix hero section ordering bug (Required)

**File:** `client/src/templates/florence/FlorenceTemplate.tsx`  
**Exact location:** `<section id="flo-hero">` style object, lines 485–498  
**Change:** Add one line after `...heroAnim.style,`

**Current (lines 491–498):**
```tsx
          overflow:   "hidden",
          ...heroAnim.style,
        }}
```

**After fix:**
```tsx
          overflow:   "hidden",
          ...heroAnim.style,
          ...(getSectionOrder ? { order: getSectionOrder("flo-hero") } : {}),
        }}
```

**Risk:** Zero. Pattern is identical to the other 8 sections. No logic change.

---

### Task 2 — Add `sectionInspectors` code example to manifest.example.ts (Required)

**File:** `client/src/templates/v2-template-example/manifest.example.ts`  
**Exact location:** After `getComponent:` line in `irisManifest` (~line 100)

Add a commented-out `sectionInspectors` stub so future template authors have a copy-paste starting point. No functional code — comments only.

**Risk:** Zero. File is never imported in production (see the `// registerV2Manifest(irisManifest)` comment at the bottom).

---

### Task 3 — Remove dead `V2_FLORENCE_ELEMENTS` and `V2_FLORENCE_LAYERS` exports (Optional)

**File:** `client/src/pages/builder-v2/types.ts`  
**Lines:** ~73–135 (`V2_FLORENCE_ELEMENTS`), ~136–220 (`V2_FLORENCE_LAYERS`)

Both exports are never imported anywhere (grep confirmed 0 import matches). Removing them:
- Eliminates ~150 lines of dead code
- Prevents accidental use instead of the manifest
- TypeScript remains 0 errors (nothing depends on these exports)

**Risk:** Low. Only risk is if some runtime eval or string-based import references these names — confirmed no such usage.

---

## Regression Checklist (after implementation)

```
□ npx tsc --noEmit                       → 0 errors
□ Open /platform/builder-v2/<florence-id>
□ Drag "Home" (hero) layer to middle position in left panel
  → hero section physically moves on canvas    ← verifies Task 1
□ Drag hero back to top → hero returns to top
□ Click hero section → HeroInspector renders in right panel
□ Click story section → StoryInspector renders
□ Undo one drag → canvas reverts (note: left panel may not visually update — known pre-existing limitation)
□ Save Draft → reload page → section order persists
□ Visit public URL → section order matches saved order
□ FlorenceTemplate renders normally without builder (no sectionOrder in config)
□ No V1 builder or V1 template files modified
□ RSVP submit logic unchanged
```

---

## Implementation Order

1. **Task 1** (FlorenceTemplate.tsx — 1 line)
2. **Task 2** (manifest.example.ts — comments only)
3. *(optional)* **Task 3** (types.ts — delete two dead exports)
4. `npx tsc --noEmit` → confirm 0 errors
5. Manual smoke-test per checklist above
