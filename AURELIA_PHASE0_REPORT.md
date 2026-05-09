# Aurelia V2 Template — Phase 0 Inspection Report

> Template key: `aurelia` | Template label: `Aurelia`
> Status: **INSPECTION COMPLETE — awaiting approval before implementation**

---

## Q1 — What files are needed to add a brand new V2 template?

**5 files to create + 2 one-line edits in existing files:**

| File | Purpose |
|---|---|
| `client/src/templates/aurelia/AureliaTemplate.tsx` | React component — receives `config: WeddingConfig` + optional `templateId`, `builderMode` props |
| `client/src/templates/aurelia/config.ts` | `defaultConfig: WeddingConfig` + `AureliaExtendedConfig` interface |
| `client/src/templates/aurelia/manifest.ts` | Registers template with `registerV2Manifest()` |
| `client/src/templates/aurelia/inspectors.tsx` | Custom right-panel inspector components per section |
| `client/src/templates/aurelia/palettes.ts` | `AURELIA_PALETTES` + `AURELIA_COLOR_ROLE_MAP` |
| `scripts/create-aurelia-template.ts` | DB seed script to create the template row |

**One-line edits in existing files:**
- `client/src/templates/v2-templates.ts` — add `import "./aurelia/manifest";`
- No builder files need to change (BuilderRightPanel, BuilderCanvas, etc.)

---

## Q2 — Which existing V2 template is the best structural starting point?

**Florence** (`client/src/templates/florence/`) is the only production V2 template and is the direct starting point. It has:
- All 9 section patterns Aurelia needs (hero → story → details → journey → venue → gallery → rsvp → footer)
- The `useSectionAnim` hook (IntersectionObserver + CSS keyframes pattern)
- The `FlorenceExtendedConfig` pattern for template-specific JSONB fields
- The full manifest/inspector/palettes file structure to copy

---

## Q3 — What manifest/inspector/renderer files are required?

- **manifest.ts** — defines `AURELIA_SECTIONS` (array of `V2SectionManifest`) + `AURELIA_ELEMENTS` (record of `V2ElementManifest`) + calls `registerV2Manifest()`. Includes `sectionInspectors` pointing to the inspector components.
- **inspectors.tsx** — one React component per section (9 sections = 9 inspectors), consumes `useBuilderV2()` and reusable controls from `InspectorControls.tsx`
- **AureliaTemplate.tsx** — the renderer. Must have `data-v2-section="aur-{name}"`, `data-v2-element="aur-{name}-{field}"`, and `data-v2-type="text"` on all editable nodes.
- **palettes.ts** — `AURELIA_PALETTES: TemplatePalette[]` + `AURELIA_COLOR_ROLE_MAP: TemplateColorRoleMap` (same 8-role pattern as Florence)

---

## Q4 — What reusable Builder V2 capabilities exist?

All of the following work out of the box with zero builder changes:

| Capability | How it works |
|---|---|
| Editable text (single line) | `data-v2-type="text"` on any JSX node → inline double-click edit |
| Editable textarea | `data-v2-type="textarea"` |
| Image picker | `ImageField` + `UploadImageButton` in `InspectorControls.tsx` |
| Button label/link editor | `ButtonLinkField` in `InspectorControls.tsx` |
| Toggle (show/hide) | `ToggleField` in `InspectorControls.tsx` |
| Section visibility | `hideable: true` in manifest + `sections[key].enabled` in config |
| Color picker | `ColorField` in `InspectorControls.tsx` |
| Palette picker | `themePalettes` + `colorRoleConfigPaths` in manifest → auto-shown in GlobalThemeInspector |
| Date field | `DateField` in `InspectorControls.tsx` |
| Repeatable list editor | `MilestoneEditor` in `InspectorControls.tsx` (add/remove/reorder) |
| Venue/card editor | `VenueCardEditor` in `InspectorControls.tsx` |
| Slider | `SliderField` |
| Select dropdown | `SelectField` |
| Entrance animation selector | `AnimationField` → `sections[key].animation` config path |
| Undo/redo | Automatic — every `updateConfig()` call participates |
| Device preview | Automatic — mobile/tablet/desktop frame in BuilderCanvas |

---

## Q5 — What animation libraries/utilities already exist?

- **Framer Motion v11.18.2** — installed in `package.json`, but **not used anywhere in the templates or builder codebase**. No template file imports it. Available if needed for micro-interactions.
- **IntersectionObserver + CSS keyframes** — the sole animation pattern in Florence (see `useSectionAnim` hook, lines 41–72 of `FlorenceTemplate.tsx`)
- **No GSAP**, no AOS, no Lenis, no locomotive-scroll
- **CSS keyframes defined inline** in a `<style>` block at the bottom of the template component (e.g., `flo-fade-in`, `flo-fade-up`, `flo-arrow-bob`)
- **No shared scroll utility hooks** — Florence implements its own `useSectionAnim` locally; Aurelia will do the same

---

## Q6 — Safest way to implement the roadmap scroll animation?

Use **IntersectionObserver + CSS transforms + a `scrollY` listener** — same stack Florence uses, zero new dependencies:

1. A `useRoadmapProgress` hook (defined locally in `AureliaTemplate.tsx`) listens to `window.scroll` and measures how far the user has scrolled through the roadmap section using `getBoundingClientRect()`. Returns a `progress: number` (0–1).
2. The vertical line renders as a `<div>` with `height: ${progress * 100}%` and a CSS `transition: height 0.2s`.
3. The traveling marker (SVG diamond/ring) is a `position: absolute` element with `top: calc(${progress * 100}%)`.
4. Milestones use a local `IntersectionObserver` to `fade-up` each entry as it enters the viewport.

This is **100% native React + CSS** — no new dependencies, no bundle impact, same pattern as Florence.

---

## Q7 — How should the marker travel along the roadmap line on scroll?

- The roadmap `<section>` has a `ref`. On each `scroll` event: `progress = clamp((scrollY - sectionTop + windowHeight * 0.3) / sectionHeight, 0, 1)`.
- The vertical line contains a fill `<div style={{ height: `${progress * 100}%`, background: primaryColor, transition: "height 0.15s linear" }}>` — the colored fill "grows" downward.
- The marker `<div style={{ position: "absolute", top: `${progress * 100}%`, transform: "translateY(-50%)" }}>` contains an elegant SVG diamond or ring.
- Milestones each have their own `IntersectionObserver` entry — they `fade-in` + `slide-in-left/right` when they cross the viewport.
- In builder mode (`builderMode === true`) progress is fixed at `1` so the roadmap always shows fully filled.

---

## Q8 — How should reduced-motion fallback work?

In `useRoadmapProgress`, check `window.matchMedia('(prefers-reduced-motion: reduce)').matches`:
- If `true`: skip the scroll listener entirely, set `progress = 1` immediately, remove CSS transitions.
- For `useSectionAnim` equivalents: skip all `opacity/transform` initial states — render everything visible from the start.
- In the `<style>` block: include `@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }` as a last resort catch.

---

## Q9 — Mobile behavior for the animated roadmap?

- On mobile (< 768 px), the roadmap layout switches to **single-column** (milestone cards stack vertically; no left/right alternation).
- The vertical line and traveling marker remain visible and functional — same scroll-progress math works.
- The marker SVG is scaled down (`width: 16px` vs `24px` desktop).
- Milestone reveal animations are simplified: all `fade-in` (no `slide-in-left/right` on mobile to avoid horizontal overflow).
- Builder device preview already applies a mobile-width frame — the layout responds via inline width checks or CSS max-width in the template's `<style>` block.

---

## Q10 — Which changes are template-specific?

Everything below is 100% isolated to `client/src/templates/aurelia/`:

- `AureliaTemplate.tsx` — component, color system, all animation hooks, CSS keyframes
- `config.ts` — `defaultConfig` + `AureliaExtendedConfig`
- `manifest.ts` — sections, elements, component factory, inspector registration
- `inspectors.tsx` — all 9 section inspector components
- `palettes.ts` — palettes + color role map
- `scripts/create-aurelia-template.ts` — DB seed (one-time, local)

---

## Q11 — Which changes, if any, are generic Builder V2 improvements?

**None required.** The manifest/inspector/palette pattern is already fully generic. All necessary control primitives are in `InspectorControls.tsx`. The `V2GenericElementType` enum already includes `"roadmap"`. No changes needed to:
- `BuilderCanvas.tsx`
- `BuilderRightPanel.tsx`
- `BuilderLeftPanel.tsx`
- `BuilderTopBar.tsx`
- `BuilderV2Context.tsx`
- `manifest-types.ts`
- `manifest-registry.ts`

---

## Q12 — What files do you propose to create/change?

### Create (6 new files)

| File | Size estimate |
|---|---|
| `client/src/templates/aurelia/AureliaTemplate.tsx` | ~1400–1700 lines |
| `client/src/templates/aurelia/config.ts` | ~200 lines |
| `client/src/templates/aurelia/manifest.ts` | ~200 lines |
| `client/src/templates/aurelia/inspectors.tsx` | ~400 lines |
| `client/src/templates/aurelia/palettes.ts` | ~150 lines |
| `scripts/create-aurelia-template.ts` | ~100 lines |

### Edit (1 existing file — 1 line added)

| File | Change |
|---|---|
| `client/src/templates/v2-templates.ts` | Add `import "./aurelia/manifest";` |

**Touch nothing else.** No builder files, no shared schema, no routes, no auth.

---

## Q13 — Smallest safe implementation plan

### Phase 1 — Skeleton (compile-safe, renders blank template)
1. Create `config.ts` with `defaultConfig` and `AureliaExtendedConfig`
2. Create `AureliaTemplate.tsx` — all sections rendered, all `data-v2-*` attributes present, minimal styling
3. Create `manifest.ts` — all 9 sections + elements defined, `getComponent` pointing at `AureliaTemplate`
4. Create `palettes.ts` — 8 roles, 8–12 palettes
5. Create `inspectors.tsx` — one inspector per section (core fields only)
6. Add `import "./aurelia/manifest"` to `v2-templates.ts`
7. Run `npx tsc --noEmit` → 0 errors

### Phase 2 — Visual polish
8. Add Aurelia color system (`C_DEFAULT`, `C` fallback chain), font constants
9. Apply cinematic styling: fullscreen hero, glass panels, backdrop blur, layered sections, warm luxury palette

### Phase 3 — Roadmap animation
10. Add `useRoadmapProgress` hook (scroll listener + `getBoundingClientRect`, `requestAnimationFrame` throttle)
11. Render animated vertical line + traveling SVG diamond marker
12. Add per-milestone `IntersectionObserver` reveal (`fade-up` staggered)
13. Add `prefers-reduced-motion` fallback

### Phase 4 — DB + testing
14. Write and run `scripts/create-aurelia-template.ts`
15. Open `/platform/builder-v2/{aurelia-id}` and verify all sections, palette picker, and roadmap animation

---

## Q14 — Risks and assumptions

| Risk | Mitigation |
|---|---|
| `WeddingConfig` lacks `sections.story` or `sections.roadmap` keys | Use existing `timeline` key for roadmap; template-specific fields live flat in `AureliaExtendedConfig` JSONB — same pattern as Florence's `storyTitle`, `venueTitle`, etc. |
| Framer Motion introduces bundle bloat if adopted | Use IntersectionObserver + CSS for all animations. Framer Motion available for micro-interactions only if clearly justified. |
| Scroll listener performance on mobile | Use `{ passive: true }` event listener; throttle with `requestAnimationFrame`; clean up on unmount. |
| Roadmap animation broken in builder mode | Guard: `if (builderMode) { setProgress(1); return; }` at top of `useRoadmapProgress`. |
| TypeScript strict mode errors from JSONB extended fields | Follow Florence pattern: cast `cfg as any as AureliaExtendedConfig & WeddingConfig`; always use `??` not `\|\|` for fallbacks. |
| Section ID collision with Florence in manifest registry | All Aurelia section IDs are prefixed `aur-` (e.g. `aur-hero`, `aur-roadmap`) — no collision possible. |
| DB seed script run against wrong environment | Script guards `if (!DATABASE_URL) process.exit(1)`; only runs locally on dev DB. |

---

## Summary

- **Zero builder file changes required**
- **6 new files + 1 line** in `v2-templates.ts`
- Animated roadmap is feasible using existing IntersectionObserver + `scrollY` pattern — no new dependencies
- Framer Motion is installed and available for micro-interactions if desired
- All 9 sections map cleanly to existing config keys or `AureliaExtendedConfig` extension fields

**Awaiting approval to begin Phase 1 implementation.**
