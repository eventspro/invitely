# Builder V2 Generification — Technical Report
**Date:** May 3, 2026  
**TypeScript result:** ✅ 0 errors  
**Scope:** Builder V2 only — V1 builder, V1 templates, RSVP, auth, Telegram, music untouched

---

## 1. Objective

Refactor the Builder V2 (`/platform/builder-v2/:templateId`) from a Florence-specific hardcoded system into a **generic, manifest-driven engine** capable of hosting any V2 template without modifying builder source files.

**Before:** Left panel, canvas, and right panel all directly imported Florence constants (`V2_FLORENCE_ELEMENTS`, `V2_FLORENCE_LAYERS`), used `replace("flo-", "")` string hacks, and had a hardcoded `switch (selectedSection)` with 9 Florence-specific cases.

**After:** Builder reads from a `V2TemplateManifest` stored in a central registry. Florence registers itself. Any future template registers itself the same way — the builder code never changes.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    BuilderV2Page.tsx                        │
│  imports "@/templates/v2-templates"  (triggers all         │
│  self-registrations before first render)                    │
│  passes templateKey={data.templateKey} → BuilderV2Provider  │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 BuilderV2Context.tsx                        │
│  useMemo: manifest = getV2Manifest(templateKey)             │
│  Exposes manifest in context value                          │
└──────┬────────────────────┬────────────────────┬────────────┘
       │                    │                    │
┌──────▼──────┐  ┌──────────▼──────┐  ┌─────────▼──────────┐
│  LeftPanel  │  │    Canvas       │  │    RightPanel       │
│  manifest   │  │  manifest       │  │  manifest           │
│  .sections  │  │  .elements      │  │  .elements          │
│  (layer     │  │  getOrCreate    │  │  .sections          │
│   tree)     │  │  Lazy(manifest) │  │  .sectionInspectors │
└─────────────┘  └─────────────────┘  └────────────────────-┘
                      ▲
         ┌────────────┴──────────────┐
         │   manifest-registry.ts    │
         │   registerV2Manifest()    │
         │   getV2Manifest(key)      │
         └────────────┬──────────────┘
                      │ (self-registers on import)
         ┌────────────▼──────────────┐
         │  florence/manifest.ts     │
         │  florenceManifest         │
         │  9 sections, 12 elements  │
         └───────────────────────────┘
```

---

## 3. New Files Created

### `client/src/pages/builder-v2/manifest-types.ts`
Core type system for the manifest engine.

**Exports:**
| Symbol | Purpose |
|---|---|
| `V2GenericElementType` | Union of all supported element types: `text \| textarea \| image \| button \| section \| countdown \| roadmap \| timeline \| location \| gallery \| rsvp \| form \| list \| icon \| socialLinks \| theme \| custom` |
| `V2ElementManifest` | Per-element descriptor: `id`, `label`, `icon?`, `sectionId`, `type`, `configPath?`, `locked?`, `getValue?`, `setValue?` |
| `V2LayerChildManifest` | Layer tree child row: `id`, `label`, `icon?`, `sectionId`, `elementId?`, `locked?` |
| `V2SectionManifest` | Per-section descriptor: `id`, `label`, `icon`, `configKey?`, `hideable?`, `reorderable?`, `locked?`, `children` |
| `V2TemplateManifest` | Top-level manifest: `templateKey`, `displayName`, `sections`, `elements`, `getComponent`, `sectionInspectors?` |
| `getByPath(obj, path)` | Safe dot-path read: `getByPath(cfg, "couple.groomName")` → value or `undefined` |
| `setByPath(obj, path, value)` | Immutable dot-path write — creates nested objects as needed |
| `getElementValue(element, cfg)` | Reads value: prefers `element.getValue(cfg)`, falls back to `getByPath(cfg, element.configPath)` |
| `setElementValue(element, cfg, value)` | Writes value: prefers `element.setValue(cfg, value)`, falls back to `setByPath(cfg, element.configPath, value)` |

**Key design decision — dual read/write strategy:**  
Elements can define custom `getValue`/`setValue` functions (like Florence does, with arbitrary config key mappings), OR they can use a simple `configPath: "hero.title"` dot-path string. Generic templates can use configPath exclusively and never write custom functions.

---

### `client/src/pages/builder-v2/manifest-registry.ts`
Central singleton registry. Imported by `BuilderV2Context` to look up manifests at runtime.

```ts
registerV2Manifest(manifest: V2TemplateManifest): void
getV2Manifest(templateKey: string): V2TemplateManifest | null
getV2TemplateRegistry(): Record<string, V2TemplateManifest>
```

Implemented as a plain `Record<string, V2TemplateManifest>` module-level map — no React, no side effects, safe to import anywhere.

---

### `client/src/templates/florence/manifest.ts`
Florence Eternal's self-registering manifest.

**Sections (9):**
| ID | Label | configKey |
|---|---|---|
| `flo-hero` | Hero | `hero` |
| `flo-story` | Our Story | `story` |
| `flo-countdown` | Countdown | `countdown` |
| `flo-journey` | Our Journey | `journey` |
| `flo-details` | Details | `details` |
| `flo-venue` | Venue | `venue` |
| `flo-gallery` | Gallery | `gallery` |
| `flo-rsvp` | RSVP | `rsvp` |
| `flo-footer` | Footer | `footer` |

**Elements (12):**
| ID | Section | Label | Strategy |
|---|---|---|---|
| `hero-intro` | flo-hero | Top Intro | getValue/setValue |
| `hero-title` | flo-hero | Couple Names | getValue/setValue |
| `hero-date` | flo-hero | Wedding Date | getValue/setValue |
| `hero-location` | flo-hero | Location | getValue/setValue |
| `story-title` | flo-story | Story Heading | getValue/setValue |
| `story-text` | flo-story | Story Body | getValue/setValue |
| `story-cta` | flo-story | CTA Button | getValue/setValue |
| `countdown-title` | flo-countdown | Countdown Label | getValue/setValue |
| `venue-subtitle` | flo-venue | Venue Subtitle | getValue/setValue |
| `venue-title` | flo-venue | Venue Name | getValue/setValue |
| `venue-desc` | flo-venue | Venue Description | getValue/setValue |
| `footer-tagline` | flo-footer | Footer Tagline | getValue/setValue |

`getComponent` returns a dynamic import of `FlorenceTemplate.tsx`.  
File ends with `registerV2Manifest(florenceManifest)` — registration is a side effect of importing the file.

---

### `client/src/templates/v2-templates.ts`
Registration index — the single file that triggers all V2 template registrations.

```ts
// Import each V2 template manifest to trigger self-registration
import "./florence/manifest";
// Future: import "./iris/manifest";
// Future: import "./opal/manifest";
```

Imported once in `BuilderV2Page.tsx` before the provider mounts, guaranteeing the registry is populated before any manifest lookup occurs.

---

### `client/src/templates/v2-template-example/manifest.example.ts`
A documented stub showing how to add a new template. Uses only `configPath` (no custom functions) to demonstrate the generic pattern. Intentionally **not** imported anywhere — it's documentation.

```ts
// Pattern shown:
{
  id: "iris-title",
  label: "Couple Names",
  type: "text",
  configPath: "couple.names",   // ← generic approach
  sectionId: "iris-hero",
}
```

---

## 4. Modified Files

### `client/src/pages/builder-v2/types.ts`
- `BuilderV2State.selectedSection`: `V2SectionId | null` → **`string | null`**
- `BuilderV2State.selectedElement`: `V2ElementId | null` → **`string | null`**
- `SELECT_SECTION` action `sectionId`: `V2SectionId | null` → **`string | null`**
- `SELECT_ELEMENT` action `elementId`: `V2ElementId | null` → **`string | null`**, `sectionId?`: `V2SectionId` → **`string`**
- `BuilderV2ContextValue.selectSection`: `(id: V2SectionId | null)` → **`(id: string | null)`**
- `BuilderV2ContextValue.selectElement`: signature relaxed to `string`
- Added `manifest: V2TemplateManifest | null` field to `BuilderV2ContextValue`
- **Legacy kept:** `V2SectionId`, `V2ElementId`, `V2_SECTIONS`, `V2_FLORENCE_ELEMENTS`, `V2_FLORENCE_LAYERS` (backward compat for inspectors and style tab)

---

### `client/src/pages/builder-v2/BuilderV2Context.tsx`
- Added `templateKey: string` to `ProviderProps`
- Added `useMemo` import
- Computes `manifest` via `useMemo(() => getV2Manifest(templateKey), [templateKey])`
- Exposes `manifest` in context value
- `selectSection` / `selectElement` signatures relaxed to `string`

---

### `client/src/pages/builder-v2/BuilderV2Page.tsx`
- Added `import "@/templates/v2-templates"` at top (side-effect import — runs all `registerV2Manifest()` calls)
- Passes `templateKey={data.templateKey}` to `<BuilderV2Provider>`

---

### `client/src/pages/builder-v2/components/BuilderLeftPanel.tsx`
Fully rewritten to be template-agnostic.

**Before:** Rendered `V2_FLORENCE_LAYERS` (hardcoded array), used `replace("flo-", "")` to derive config keys, had Florence-specific section IDs hardcoded in visibility/animation logic.

**After:**
- Renders `manifest?.sections` — works for any registered template
- `layerOrder` state initialized from `manifest.sections` with `useEffect` sync on `manifest.templateKey`
- `getSectionConfigKey(sectionId)` helper: reads `section.configKey ?? sectionId` — no string munging
- `isSectionEnabled(id)` and `toggleVisibility(id)` use `getSectionConfigKey`
- `handleSectionClick(section: V2SectionManifest)` and `handleChildClick(child: V2LayerChildManifest)` take typed manifest objects
- `isSectionSelected` and `isChildSelected` are generic predicates
- "No manifest loaded" fallback message if registry lookup fails

---

### `client/src/pages/builder-v2/components/BuilderCanvas.tsx`
Fully rewritten to be template-agnostic.

**Before:** Imported `FlorenceTemplate` directly with `React.lazy()`, used `V2_FLORENCE_ELEMENTS[elementId]` for inline editing, typed IDs as `V2ElementId`.

**After:**
- Module-level `_lazyComponentCache: Record<string, React.LazyExoticComponent<any>>` prevents recreating lazy components on re-render
- `getOrCreateLazy(manifest)` reads `manifest.getComponent` (a dynamic import factory) and wraps it in `React.lazy()` once per `templateKey`
- `TemplateComponent` derived via `useMemo(() => manifest ? getOrCreateLazy(manifest) : null, [manifest?.templateKey])`
- Renders `TemplateComponent` via `React.createElement(TemplateComponent as ComponentType<any>, props)` — avoids JSX generic component prop type errors
- `handleCanvasDblClick`: uses `manifest?.elements[elementId]` + `getElementValue(elementMeta, draftConfig)`
- `commitInlineEdit`: uses `manifest?.elements[elementId]` + `setElementValue(elementMeta, cfg, value)`
- Section badge reads `manifest?.elements[selectedElement]?.label` and `manifest?.sections.find(...)`
- Error state shown if `TemplateComponent` is null (unregistered template)

---

### `client/src/pages/builder-v2/components/BuilderRightPanel.tsx`
Fully rewritten dispatch logic.

**Before:** `switch (selectedSection)` with 9 hardcoded Florence cases; `contextLabel` used `replace("flo-", "").replace("-", " ")`; `ElementContentControls` called `meta.getValue(cfg)` directly.

**After:**

**Section inspector dispatch — 3-tier priority:**
```
1. manifest.sectionInspectors?.[selectedSection]   ← template-specific custom override
2. BUILTIN_SECTION_INSPECTORS[selectedSection]      ← Florence's 9 built-in inspectors
3. <GenericSectionInspector sectionId={...} />      ← safe fallback for any unknown section
```

**`BUILTIN_SECTION_INSPECTORS` map** (replaces switch):
```ts
const BUILTIN_SECTION_INSPECTORS: Record<string, React.ComponentType> = {
  "flo-hero":      HeroInspector,
  "flo-story":     StoryInspector,
  "flo-countdown": CountdownInspector,
  "flo-journey":   JourneyInspector,
  "flo-details":   DetailsInspector,
  "flo-venue":     VenueInspector,
  "flo-gallery":   GalleryInspector,
  "flo-rsvp":      RsvpInspector,
  "flo-footer":    FooterInspector,
};
```

**`contextLabel`** — reads manifest:
```ts
const sectionDef   = manifest?.sections.find((s) => s.id === selectedSection);
const elementDef   = selectedElement ? manifest?.elements[selectedElement] : null;
const contextLabel = elementDef?.label ?? sectionDef?.label ?? selectedSection ?? "Global Theme";
```

**`ElementContentControls`** — uses `getElementValue`/`setElementValue` from `manifest-types.ts`; falls back to legacy `V2_FLORENCE_ELEMENTS` for safety during transition.

**`AdvancedTab`** — uses `manifest?.sections.find(s => s.id === selectedSection)?.configKey ?? selectedSection` instead of `replace("flo-", "")`.

---

### `client/src/pages/builder-v2/manifest-types.ts` (post-creation fix)
Added `"form"` and `"list"` to `V2GenericElementType` to ensure structural compatibility when the legacy `V2ElementMeta` (which uses `V2ElementType = "text" | "image" | "button" | "form" | "list"`) is used as a fallback alongside `V2ElementManifest`.

---

## 5. How to Add a Future V2 Template

1. **Create template directory:**
   ```
   client/src/templates/iris/
   ├── IrisTemplate.tsx       ← receives config: WeddingConfig, templateId: string, builderMode: boolean
   ├── config.ts              ← exports defaultConfig: WeddingConfig
   └── manifest.ts            ← defines and self-registers irisManifest
   ```

2. **Write manifest.ts:**
   ```ts
   import { registerV2Manifest } from "@/pages/builder-v2/manifest-registry";
   import type { V2TemplateManifest } from "@/pages/builder-v2/manifest-types";

   export const irisManifest: V2TemplateManifest = {
     templateKey: "iris",
     displayName: "Iris Bloom",
     sections: [
       { id: "iris-hero", label: "Hero", icon: "🌸", configKey: "hero", hideable: false, children: [] },
       // ...more sections
     ],
     elements: {
       "iris-title": {
         id: "iris-title", label: "Couple Names", sectionId: "iris-hero",
         type: "text",
         configPath: "couple.names",   // ← simple dot-path, no custom functions needed
       },
     },
     getComponent: () => import("@/templates/iris/IrisTemplate"),
   };

   registerV2Manifest(irisManifest);
   ```

3. **Register in `v2-templates.ts`:**
   ```ts
   import "./florence/manifest";
   import "./iris/manifest";   // ← add this line
   ```

4. **Seed database:** `tsx scripts/create-iris-template.ts`

5. **Done.** The builder will load Iris automatically for any DB template with `templateKey: "iris"`.

---

## 6. TypeScript Result

```
npx tsc --noEmit
(no output)
Exit code: 0
```

All errors resolved:
| Error | Fix |
|---|---|
| `Cannot find name 'V2ElementId'` in BuilderCanvas | Replaced stale `handleCanvasDblClick`/`commitInlineEdit` with manifest-based versions |
| `Cannot find name 'V2_FLORENCE_ELEMENTS'` in BuilderCanvas | Same — removed old inline edit functions |
| `Property 'config' does not exist on type 'IntrinsicAttributes'` | Switched to `React.createElement(TemplateComponent as ComponentType<any>, props)` |
| `'string' can't index Record<V2ElementId, V2ElementMeta>` in StyleTab | Cast `V2_FLORENCE_ELEMENTS` as `Record<string, { label?: string }>` |
| `'V2ElementMeta' not assignable to 'V2ElementManifest'` (type mismatch on `.type`) | Added `"form"` and `"list"` to `V2GenericElementType` |

---

## 7. What Was NOT Changed

| Area | Status |
|---|---|
| V1 Builder (`/platform/templates/:templateId`) | ✅ Untouched |
| V1 templates (pro, classic, elegant, romantic, nature) | ✅ Untouched |
| RSVP submit logic | ✅ Untouched |
| Auth middleware | ✅ Untouched |
| Telegram integration | ✅ Untouched |
| Music / background audio | ✅ Untouched |
| Sale wheel | ✅ Untouched |
| Database schema | ✅ Untouched |
| Florence template component (`FlorenceTemplate.tsx`) | ✅ Untouched (journey section was done in prior session) |
| Florence inspector components (Hero/Story/etc.) | ✅ Untouched — still work via BUILTIN_SECTION_INSPECTORS map |

---

## 8. Regression Checklist

- [ ] Florence opens in Builder V2 at `/platform/builder-v2/5df55473-219d-4106-a493-1f7214903491`
- [ ] Left panel renders 9 Florence sections from manifest (not hardcoded)
- [ ] Click section in left panel → selects section, right panel shows section inspector
- [ ] Click element in left panel → selects element, right panel shows element controls
- [ ] Double-click text element in canvas → inline editor appears
- [ ] Inline edit commit → config updates in canvas
- [ ] Section visibility toggle (eye icon) → section hides/shows in canvas
- [ ] Right panel context label shows human-readable names (not `"flo-hero"` raw IDs)
- [ ] Undo/redo works
- [ ] Save config works
- [ ] Journey section horizontal/vertical layout toggle works
- [ ] Journey dot scroll animation works on vertical layout

---

## 9. Remaining Limitations

1. **Florence inspectors are still Florence-specific.** `HeroInspector`, `StoryInspector`, etc. reference Florence config keys directly. A truly new template with different config structure will get `GenericSectionInspector` (a safe fallback) until it either uses `BUILTIN_SECTION_INSPECTORS` keys or provides `manifest.sectionInspectors`.

2. **`V2_FLORENCE_ELEMENTS` still used as legacy fallback** in `ElementContentControls` and `StyleTab`. The plan was always to keep this during migration — once Florence fully migrates to manifest, these fallbacks can be removed.

3. **Section reordering** (`layerOrder` drag-and-drop) still stores order in component state only — no persistence to DB on reorder. This was pre-existing behavior.

4. **`sectionInspectors` on `V2TemplateManifest`** is typed and dispatch-ready but no template has used it yet. Florence uses the built-in map. First use will validate the override path end-to-end.

5. **No automatic template discovery** — `v2-templates.ts` must be manually updated when adding new templates. This is intentional (explicit registration > magic scanning).
