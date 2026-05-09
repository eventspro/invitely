# V2 Builder — Implementation Report

**Date:** 2026-05-05  
**TypeScript status:** 0 errors (confirmed before and after all changes)

---

## Changes Made

### 1. Hero section ordering bug fixed

**File:** `client/src/templates/florence/FlorenceTemplate.tsx`  
**Line:** 496 (inside `<section id="flo-hero">` style object)

Added the missing `order` spread, making `flo-hero` participate in CSS flex ordering identically to the other 8 sections:

```tsx
// Before
...heroAnim.style,

// After
...heroAnim.style,
...(getSectionOrder ? { order: getSectionOrder("flo-hero") } : {}),
```

**Effect:** Dragging the "Home" layer in the builder left panel now visually reorders the hero section on the canvas. The fix also applies to the public/preview runtime — since `sectionOrder` is persisted in JSONB and the GET endpoint preserves it, a saved reorder now correctly positions hero on the live wedding site.

---

### 2. `sectionInspectors` authoring stub added

**File:** `client/src/templates/v2-template-example/manifest.example.ts`  
**Location:** Inside the `irisManifest` object, after `getComponent:`

Added a commented-out `sectionInspectors` block so future template authors have a copy-paste starting point:

```ts
// ── Optional: custom right-panel inspector per section ────────────────────────
// Create client/src/templates/iris/inspectors.tsx that exports one React
// component per section you want to customise. Import them at the top of
// this file, then add the map below. Any section NOT listed here falls back
// to the generic element-type inspector — so this is fully opt-in.
//
// sectionInspectors: {
//   "iris-hero":  HeroInspector,
//   "iris-story": StoryInspector,
//   "iris-rsvp":  RsvpInspector,
// },
```

No functional change — comments only.

---

### 3. Dead exports removed

**File:** `client/src/pages/builder-v2/types.ts`

Removed two exports that were never imported anywhere (confirmed by `grep "import.*V2_FLORENCE"` → 0 matches):

| Removed export | Lines removed | Why |
|---|---|---|
| `V2_FLORENCE_ELEMENTS` | ~60 lines | Pre-manifest hardcoded element map; fully superseded by `florence/manifest.ts` elements |
| `V2_FLORENCE_LAYERS` | ~90 lines | Pre-manifest hardcoded layer tree; fully superseded by `FLORENCE_SECTIONS` in `florence/manifest.ts` |
| `V2LayerNode` interface | 9 lines | Only existed to type `V2_FLORENCE_LAYERS`; also unused |

Total: ~160 lines of dead code removed.

---

## Final State

| File | Status |
|---|---|
| `BuilderRightPanel.tsx` | ✅ Fully generic — zero Florence code |
| `BuilderLeftPanel.tsx` | ✅ Generic, reads `sectionOrder` from `draftConfig` |
| `BuilderCanvas.tsx` | ✅ Generic, manifest-driven |
| `BuilderV2Context.tsx` | ✅ Generic, `getV2Manifest(templateKey)` |
| `manifest-types.ts` | ✅ Complete |
| `manifest-registry.ts` | ✅ Complete |
| `florence/manifest.ts` | ✅ Full `sectionInspectors` map for all 9 sections |
| `florence/inspectors.tsx` | ✅ All 9 inspector components |
| `FlorenceTemplate.tsx` | ✅ All 9 sections have `order` spread |
| `manifest.example.ts` | ✅ `sectionInspectors` stub documented |
| `types.ts` | ✅ Dead exports removed |

---

## Known Pre-existing Limitations (not addressed, not regressions)

- **Left panel undo/redo visual desync:** After undo/redo, the builder canvas correctly reverts to the previous section order, but the left panel `layerOrder` local state does not update (it only syncs on `manifest?.templateKey` change). This is a pre-existing UI-only issue with no data loss.
- **`sectionOrder` not typed in `WeddingConfig`:** Stored as `(cfg as any).sectionOrder` — intentional JSONB design choice, no runtime impact.
- **`V2SectionId`, `V2ElementId`, `V2ElementMeta`, `V2_SECTIONS`** remain in `types.ts` — these are also unused in source but were not in scope for this task.
