# Builder V2 — Professional Color Palette Generator
## Phase 0 Inspection Report & Implementation Plan
_Date: 2026-05-05_

---

## 1. Inspection Findings

### 1.1 Where are Builder V2 theme/color controls currently implemented?

`client/src/pages/builder-v2/components/BuilderRightPanel.tsx`  
Function: `GlobalThemeInspector()` — rendered on the **Content tab** when nothing is selected in the canvas.

Current color pickers (4 total):

| Label | Config path |
|---|---|
| Gold / Primary | `cfg.theme.colors.primary` |
| Dark Olive / Secondary | `cfg.theme.colors.secondary` |
| Ivory / Background | `cfg.theme.colors.background` |
| Text Color | `cfg.theme.colors.textColor` |

The same 4 appear partially in `StyleTab` as well.

---

### 1.2 Which file renders the global/theme controls?

`BuilderRightPanel.tsx` → `GlobalThemeInspector()`.  
Shown when `!selectedSection && !selectedElement` on the Content tab.

---

### 1.3 How does Builder V2 update template config?

`updateConfig(updater: (cfg: WeddingConfig) => WeddingConfig)` from `useBuilderV2()`.  
→ Dispatches `UPDATE_CONFIG` to the reducer in `BuilderV2Context.tsx`.  
→ Reducer pushes current `draftConfig` onto `past`, replaces with new config.  
→ Sets `hasUnsavedChanges = true`, clears `future`.  
→ Save Draft calls `PUT /api/templates/:id/config` with the full `draftConfig`.

---

### 1.4 How does undo/redo work?

Classic past/future stacks inside `builderReducer` (`BuilderV2Context.tsx`):

- `UPDATE_CONFIG` → current pushed to `past`, `future` cleared
- `UNDO` → pop from `past`, push current to `future`
- `REDO` → pop from `future`, push current to `past`
- `MAX_HISTORY` constant caps stack depth

**Conclusion:** Any palette applied via `updateConfig(...)` automatically participates in undo/redo — no extra wiring needed.

---

### 1.5 Where are Florence V2 colors defined in config?

`client/src/templates/florence/config.ts` (`defaultConfig`) has **no `theme` key** — colors are absent from the default config.  
The template falls back to `C_DEFAULT` module-level constants in `FlorenceTemplate.tsx` when `cfg.theme.colors` keys are missing.  
When a user picks a color in the builder, it is written to `cfg.theme.colors.*`.

---

### 1.6 Where are Florence V2 colors rendered in the template?

`client/src/templates/florence/FlorenceTemplate.tsx`, inside the component body (~line 101):

```ts
const C = {
  ...C_DEFAULT,
  ...(th.colors?.primary    ? { gold:      th.colors.primary,    goldLight:  th.colors.primary    } : {}),
  ...(th.colors?.secondary  ? { darkOlive: th.colors.secondary,  midOlive:   th.colors.secondary  } : {}),
  ...(th.colors?.background ? { ivory:     th.colors.background, ivoryWarm:  th.colors.background } : {}),
  ...(th.colors?.textColor  ? { whiteText: th.colors.textColor,  grayText:   th.colors.textColor  } : {}),
};
```

`C` is consumed by 200+ inline style props across all sections. Updating the 4 config keys causes the entire template to recolor instantly.

---

### 1.7 Does Florence V2 manifest have a theme section or color roles?

**No.** `manifest.ts` currently contains only sections, elements, sectionInspectors, and elementInspectors.  
No `themePalettes`, no `colorRoleConfigPaths`, no color-related fields.

---

### 1.8 What config keys must be updated for palette application?

Only 4 keys are currently wired through to the renderer:

| Config path | Florence color role |
|---|---|
| `theme.colors.primary` | Gold, accent, button highlights |
| `theme.colors.secondary` | Dark olive, dark backgrounds |
| `theme.colors.background` | Ivory, warm light background |
| `theme.colors.textColor` | Hero names text, body text |

These 4 keys are sufficient to produce visually distinct, professionally distinct palettes. Richer roles (border, buttonBg, overlay, surface) are not wired in the current template — adding them would require template changes outside this scope.

---

### 1.9 Where should the color generator UI live?

Inside `GlobalThemeInspector` in `BuilderRightPanel.tsx`, **after** the existing "Theme Colors" `FieldGroup`.

The control is manifest-driven:
- If `manifest?.themePalettes` is undefined → renders nothing (no crash, fully backward-compatible)
- If present → renders a palette picker grid

This keeps the generic builder completely template-agnostic.

---

### 1.10 Where should palette definitions live?

| Location | Contents |
|---|---|
| `client/src/templates/florence/palettes.ts` *(new file)* | Florence curated palettes + color role config map |
| `client/src/templates/florence/manifest.ts` | Import and register palettes |
| `client/src/pages/builder-v2/manifest-types.ts` | New optional types on `V2TemplateManifest` |
| `client/src/pages/builder-v2/components/BuilderRightPanel.tsx` | Generic palette picker UI |

Future V2 templates add their own `palettes.ts` and register them without touching any generic builder file.

---

### 1.11 Generic manifest type changes needed?

Yes — minimal and fully backward-compatible (all optional):

```ts
// manifest-types.ts — additions

export type TemplatePalette = {
  id: string;
  label: string;
  mood?: "elegant" | "romantic" | "luxury" | "botanical" | "minimal" | "classic" | "warm" | "cool";
  colors: Record<string, string>;
};

/** Maps palette color role names to dot-paths into WeddingConfig */
export type TemplateColorRoleMap = Record<string, string>;

// Added to V2TemplateManifest (both optional):
themePalettes?: TemplatePalette[];
colorRoleConfigPaths?: TemplateColorRoleMap;
```

No existing manifest fields are changed. All existing templates continue to work without modification.

---

## 2. Recommended Architecture

```
manifest-types.ts
  └── TemplatePalette, TemplateColorRoleMap (generic types)
  └── V2TemplateManifest.themePalettes? / colorRoleConfigPaths?

florence/palettes.ts  (new)
  └── FLORENCE_PALETTES: TemplatePalette[]    (5 curated palettes)
  └── FLORENCE_COLOR_ROLE_MAP: TemplateColorRoleMap

florence/manifest.ts
  └── imports FLORENCE_PALETTES + FLORENCE_COLOR_ROLE_MAP
  └── registers on manifest object

BuilderRightPanel.tsx → GlobalThemeInspector()
  └── reads manifest?.themePalettes + manifest?.colorRoleConfigPaths
  └── renders palette cards grid if present
  └── Apply → updateConfig() via setByPath (already in manifest-types.ts)
```

**Key invariant:** `BuilderRightPanel.tsx` has zero Florence-specific imports. It only reads from the manifest interface.

---

## 3. Files Planned to Change

| File | Change | Scope |
|---|---|---|
| `client/src/pages/builder-v2/manifest-types.ts` | Add 2 types + 2 optional manifest fields | ~15 lines |
| `client/src/pages/builder-v2/components/BuilderRightPanel.tsx` | Add palette picker UI in `GlobalThemeInspector` | ~70 lines |
| `client/src/templates/florence/palettes.ts` | **New file** — 5 curated palettes + role map | ~90 lines |
| `client/src/templates/florence/manifest.ts` | Import + register palettes | ~3 lines |

**Not touched:**
- All V1 builder files
- All V1 templates
- All existing live templates
- `shared/schema.ts`
- Auth, RSVP, Telegram, music, sale wheel, upload infra, image editor
- Any unrelated platform files

---

## 4. Exact Config Keys and Color Roles for Florence

### Color Role Map (stored in `palettes.ts`)

```ts
export const FLORENCE_COLOR_ROLE_MAP: TemplateColorRoleMap = {
  primary:    "theme.colors.primary",
  secondary:  "theme.colors.secondary",
  background: "theme.colors.background",
  text:       "theme.colors.textColor",
};
```

### Florence Palette Definitions

Each palette defines only the 4 keys currently wired in `FlorenceTemplate.tsx`:

#### Botanical Gold _(mood: botanical)_
```
primary:    #CFAF66   → gold, accents, buttons
secondary:  #28301F   → dark olive backgrounds
background: #F8F4EC   → ivory warm base
text:       #1D1B16   → hero names, body text
```

#### Rose Ivory _(mood: romantic)_
```
primary:    #6F4548   → dusty rose
secondary:  #D8A7A7   → soft blush secondary
background: #FFF7F4   → warm white
text:       #352424   → deep rose-brown text
```

#### Classic Noir _(mood: classic)_
```
primary:    #C2A15A   → burnished gold
secondary:  #1F1F1D   → near-black
background: #FAF7F0   → warm cream
text:       #181816   → deep charcoal
```

#### Sage Minimal _(mood: minimal)_
```
primary:    #B8A77A   → warm khaki
secondary:  #6F7A5C   → sage green
background: #F7F5EF   → soft linen
text:       #25281F   → dark forest
```

#### Champagne Cream _(mood: warm)_
```
primary:    #D6B56D   → champagne gold
secondary:  #8A6A3D   → warm brown
background: #FFF9ED   → champagne white
text:       #302514   → rich brown
```

---

## 5. Whether Generic Manifest Types Need to Change

**Yes, but minimally.** Two new exported types and two optional fields on the existing `V2TemplateManifest` interface. All additions are optional — the change is fully backward-compatible. No existing code paths are altered.

---

## 6. Exact Implementation Plan

### Step 1 — `manifest-types.ts`
Add at the end of the file, before the utility functions:

```ts
export type TemplatePalette = {
  id: string;
  label: string;
  mood?: "elegant" | "romantic" | "luxury" | "botanical" | "minimal" | "classic" | "warm" | "cool";
  colors: Record<string, string>;
};

export type TemplateColorRoleMap = Record<string, string>;
```

Add to `V2TemplateManifest` interface:
```ts
themePalettes?: TemplatePalette[];
colorRoleConfigPaths?: TemplateColorRoleMap;
```

### Step 2 — `client/src/templates/florence/palettes.ts` (new)

```ts
import type { TemplatePalette, TemplateColorRoleMap } from "../../pages/builder-v2/manifest-types";

export const FLORENCE_COLOR_ROLE_MAP: TemplateColorRoleMap = {
  primary:    "theme.colors.primary",
  secondary:  "theme.colors.secondary",
  background: "theme.colors.background",
  text:       "theme.colors.textColor",
};

export const FLORENCE_PALETTES: TemplatePalette[] = [
  { id: "botanical-gold",   label: "Botanical Gold",   mood: "botanical", colors: { primary: "#CFAF66", secondary: "#28301F", background: "#F8F4EC", text: "#1D1B16" } },
  { id: "rose-ivory",       label: "Rose Ivory",       mood: "romantic",  colors: { primary: "#6F4548", secondary: "#D8A7A7", background: "#FFF7F4", text: "#352424" } },
  { id: "classic-noir",     label: "Classic Noir",     mood: "classic",   colors: { primary: "#C2A15A", secondary: "#1F1F1D", background: "#FAF7F0", text: "#181816" } },
  { id: "sage-minimal",     label: "Sage Minimal",     mood: "minimal",   colors: { primary: "#B8A77A", secondary: "#6F7A5C", background: "#F7F5EF", text: "#25281F" } },
  { id: "champagne-cream",  label: "Champagne Cream",  mood: "warm",      colors: { primary: "#D6B56D", secondary: "#8A6A3D", background: "#FFF9ED", text: "#302514" } },
];
```

### Step 3 — `florence/manifest.ts`

Import and register:
```ts
import { FLORENCE_PALETTES, FLORENCE_COLOR_ROLE_MAP } from "./palettes";

// Inside the manifest object:
themePalettes: FLORENCE_PALETTES,
colorRoleConfigPaths: FLORENCE_COLOR_ROLE_MAP,
```

### Step 4 — `BuilderRightPanel.tsx` — `GlobalThemeInspector()`

After the existing "Theme Colors" `FieldGroup`, add:

```tsx
{/* Palette picker — only rendered if template manifest provides palettes */}
{manifest?.themePalettes && manifest.colorRoleConfigPaths && (
  <PalettePickerControl
    palettes={manifest.themePalettes}
    roleMap={manifest.colorRoleConfigPaths}
  />
)}
```

`PalettePickerControl` (local component, same file):
- Renders a grid of palette cards
- Each card shows: label, mood tag, 4 color swatches, "Apply" button
- Apply calls `updateConfig(c => applyPalette(c, palette, roleMap))`
- `applyPalette` is a 5-line utility using `setByPath` (already in `manifest-types.ts`)
- No state, no external deps, pure `updateConfig` call

---

## 7. Risks and Assumptions

| Risk | Mitigation |
|---|---|
| Florence only reads 4 color roles — extra palette roles won't appear visually | Palette definitions scoped to the 4 wired keys only |
| `setByPath` used for `"theme.colors.primary"` nested paths | Already tested in `manifest-types.ts`; handles 3-level nesting |
| Palette UI added to generic `BuilderRightPanel.tsx` | Guarded by `manifest?.themePalettes` — templates without palettes see nothing |
| User clicks palette then manually changes a color — divergence | Expected; no "active palette" tracking needed for v1 |
| TypeScript strict mode — no `any` | `Record<string, string>` types are clean; `setByPath` accepts `unknown` value |
| Undo after palette apply | Free — palette applied via single `updateConfig` call = single undo step |
| Save/reload persists palette | Free — palette written into `draftConfig.theme.colors.*` which is saved by `PUT /api/templates/:id/config` |

---

## 8. Questions / Blockers

None. Architecture is fully determined from inspection. Ready to implement on approval.

---

## 9. Regression Checklist (post-implementation)

- [ ] `npx tsc --noEmit` — 0 errors
- [ ] Builder V2 opens Florence without errors
- [ ] Florence default colors unchanged before clicking palette
- [ ] Clicking a palette card applies all 4 color roles instantly
- [ ] Canvas re-renders with new palette colors
- [ ] Palette looks visually compatible (not random)
- [ ] Text readable after palette apply
- [ ] Buttons readable after palette apply
- [ ] Undo reverts palette to previous colors
- [ ] Redo reapplies palette
- [ ] Save Draft persists palette colors
- [ ] Reload shows saved palette colors
- [ ] Public/preview V2 renders saved palette colors
- [ ] Template without palette support (no `themePalettes` in manifest) — no crash, no UI shown
- [ ] V1 builder files unchanged
- [ ] V1 templates unchanged
- [ ] Existing live templates unchanged
- [ ] RSVP submit logic unchanged
- [ ] Auth, Telegram, music, upload infra unchanged
