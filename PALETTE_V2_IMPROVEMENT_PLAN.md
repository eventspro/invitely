# Builder V2 — Professional Palette System Improvement
## Phase 0 Inspection Report & Implementation Plan
_Date: 2026-05-06_

---

## 1. Inspection Findings

### Files Changed in v1 Palette Implementation

| File | Role |
|---|---|
| `client/src/pages/builder-v2/manifest-types.ts` | `TemplatePalette`, `TemplateColorRoleMap` types; optional fields on `V2TemplateManifest` |
| `client/src/pages/builder-v2/components/BuilderRightPanel.tsx` | `PalettePickerControl` component inside `GlobalThemeInspector` |
| `client/src/templates/florence/palettes.ts` | 5 palettes + `FLORENCE_COLOR_ROLE_MAP` |
| `client/src/templates/florence/manifest.ts` | Imports and registers palettes |

### Where `themePalettes` and `colorRoleConfigPaths` Are Defined

- **Types**: `client/src/pages/builder-v2/manifest-types.ts`
- **Values**: `client/src/templates/florence/palettes.ts` — exported as `FLORENCE_PALETTES` and `FLORENCE_COLOR_ROLE_MAP`
- **Registered**: `client/src/templates/florence/manifest.ts` — added as `themePalettes` and `colorRoleConfigPaths` fields on `florenceManifest`
- **Consumed**: `client/src/pages/builder-v2/components/BuilderRightPanel.tsx` — `PalettePickerControl` reads from `manifest.themePalettes` and `manifest.colorRoleConfigPaths`

### Current Palette Role Map (4 roles)

```ts
primary:    "theme.colors.primary"      → C.gold, C.goldLight
secondary:  "theme.colors.secondary"    → C.darkOlive, C.midOlive
background: "theme.colors.background"   → C.ivory, C.ivoryWarm
text:       "theme.colors.textColor"    → C.whiteText, C.grayText  ← ROOT CAUSE
```

---

## 2. Root Cause of Poor Readability

**One line causes all readability failures:**

```ts
// FlorenceTemplate.tsx — current broken C block (line ~111)
...(th.colors?.textColor ? { whiteText: th.colors.textColor, grayText: th.colors.textColor } : {}),
```

`C.whiteText` and `C.grayText` are two **completely different use cases** being assigned the **same value** from a single `textColor` role:

| Variable | Used where | Required contrast |
|---|---|---|
| `C.whiteText` | Hero names, countdown numbers, RSVP labels, form input text, wedding details cards, footer text — all on **dark olive backgrounds** | Must be **light** |
| `C.grayText` | Story paragraph, venue description, journey subtitles — all on **light ivory backgrounds** | Should be a **muted mid-tone** |

### Botanical Gold failure

| Setting | Value |
|---|---|
| `text` in palette | `#1D1B16` (near-black) |
| `C.whiteText` becomes | `#1D1B16` |
| Hero background | `linear-gradient(darkOlive=#28301F, midOlive=#28301F)` |
| Contrast ratio | ~1.2:1 → **invisible** |

Hero names, countdown numbers, RSVP section, footer become unreadable.

### Classic Noir failure

| Setting | Value |
|---|---|
| `text` in palette | `#181816` (near-black charcoal) |
| `C.whiteText` becomes | `#181816` |
| Hero/nav/countdown/footer background | `#1F1F1D` (near-black) |
| Contrast ratio | ~1.0:1 → **completely invisible** |

---

## 3. Which Sections Become Unreadable

| Section | BG source | Affected elements |
|---|---|---|
| **Hero** | `darkOlive → midOlive` gradient | Names, subtitle, date, location (`C.whiteText`) |
| **Nav (scrolled/mobile)** | `C.darkOlive` | Nav links, hamburger bars (`C.whiteText`) |
| **Countdown** | `darkOlive → midOlive` gradient | Numbers, unit labels (`C.whiteText`) |
| **Wedding Details** | `midOlive → darkOlive` gradient | Card title, venue name, description (`C.whiteText`) |
| **RSVP** | `midOlive → darkOlive` gradient | Section heading, form labels, input text, submission button (`C.whiteText`) |
| **Footer** | `C.darkOlive` | Tagline, social links, copyright (`C.whiteText` with alpha) |

Light sections (Story, Journey, Venue, Gallery) have acceptable readability — `grayText` being too dark just saturates body text, it does not cause invisibility.

---

## 4. Proposed Expanded Color Roles

The minimum viable fix requires only **2 new critical roles** + **2 refinement roles**:

| New role | Maps to C.* | What it controls |
|---|---|---|
| `lightText` | `C.whiteText` | Text on dark section backgrounds (hero, nav, countdown, details, RSVP, footer) |
| `mutedText` | `C.grayText` | Muted body text on light sections (story paragraph, venue description) |
| `cardBorder` | `C.borderCard` | Details card borders, footer top border |
| `cardBackground` | `C.beige` | Address card bg, monogram card border, venue map button bg, gallery placeholder |

**Total: 8 roles** (4 existing + 4 new):

```
primary          → theme.colors.primary        (existing)
secondary        → theme.colors.secondary       (existing)
background       → theme.colors.background      (existing)
text             → theme.colors.textColor       (existing — now fallback for mutedText only, no longer touches whiteText)
lightText        → theme.colors.lightText       NEW — text on dark backgrounds
mutedText        → theme.colors.mutedText       NEW — muted body text on light backgrounds
cardBorder       → theme.colors.cardBorder      NEW — card borders
cardBackground   → theme.colors.cardBackground  NEW — light card backgrounds
```

Roles **not added** (over-engineering for actual template usage):
- `navBackground` — nav bg reads from `secondary` (already covered)
- `buttonBg` / `buttonText` — all buttons use `primary` bg + `secondary` text (already covered)
- `sectionDarkBg` / `sectionLightBg` — sections read from `secondary` / `background` (already covered)
- `inputBackground` — RSVP inputs use `C.whiteText` (covered by `lightText`)
- `overlay` — hardcoded gradient in template, not role-driven

---

## 5. Exact Files Planned to Change

| File | What changes |
|---|---|
| `client/src/templates/florence/FlorenceTemplate.tsx` | Replace 4-spread C block with fallback-chain C block (12 assignments) |
| `client/src/templates/florence/palettes.ts` | New 8-role map; update 5 existing palettes; add 7 new palettes |
| `client/src/pages/builder-v2/components/BuilderRightPanel.tsx` | `slice(0, 4)` → `slice(0, 6)` in swatch row |

**Not changed:**
- `manifest-types.ts` — generic types already support arbitrary roles
- `manifest.ts` — automatically picks up new roles from palettes.ts
- All V1 files, existing live templates, schema, auth, RSVP, Telegram, music, etc.

---

## 6. Exact Config Keys to Add/Use

```
theme.colors.primary          existing, unchanged
theme.colors.secondary        existing, unchanged
theme.colors.background       existing, unchanged
theme.colors.textColor        existing — now fallback for mutedText only (no longer sets whiteText)
theme.colors.lightText        NEW
theme.colors.mutedText        NEW
theme.colors.cardBorder       NEW
theme.colors.cardBackground   NEW
```

---

## 7. New FlorenceTemplate C Block

Replace the current:

```ts
const th = cfg.theme || {};
const C = {
  ...C_DEFAULT,
  ...(th.colors?.primary    ? { gold: th.colors.primary, goldLight: th.colors.primary } : {}),
  ...(th.colors?.secondary  ? { darkOlive: th.colors.secondary, midOlive: th.colors.secondary } : {}),
  ...(th.colors?.background ? { ivory: th.colors.background, ivoryWarm: th.colors.background } : {}),
  ...(th.colors?.textColor  ? { whiteText: th.colors.textColor, grayText: th.colors.textColor } : {}),
} as typeof C_DEFAULT;
```

With:

```ts
const colors = cfg.theme?.colors ?? {};
const C = {
  ...C_DEFAULT,
  gold:       colors.primary        ?? C_DEFAULT.gold,
  goldLight:  colors.primary        ?? C_DEFAULT.goldLight,
  darkOlive:  colors.secondary      ?? C_DEFAULT.darkOlive,
  midOlive:   colors.secondary      ?? C_DEFAULT.midOlive,
  lightOlive: colors.secondary      ?? C_DEFAULT.lightOlive,
  borderCard: colors.cardBorder     ?? C_DEFAULT.borderCard,
  ivory:      colors.background     ?? C_DEFAULT.ivory,
  ivoryWarm:  colors.background     ?? C_DEFAULT.ivoryWarm,
  beige:      colors.cardBackground ?? C_DEFAULT.beige,
  grayText:   colors.mutedText      ?? colors.textColor   ?? C_DEFAULT.grayText,
  whiteText:  colors.lightText      ?? C_DEFAULT.whiteText,
} as typeof C_DEFAULT;
```

**Key invariants:**
- `whiteText` reads **only** from `lightText` — never from `textColor`
- `grayText` falls back through `mutedText → textColor → default` — existing manual "Text Color" picker still controls body text
- `lightOlive` now follows `secondary` (was hardcoded) — details card overlay stays cohesive
- `C.white` stays `#FFFFFF` unconditionally (used only for the "/" separator in nav monogram)

---

## 8. Palette List

### Updated Palettes (5 existing — add 4 new roles each)

| Palette | primary | secondary | background | lightText | mutedText | cardBorder | cardBackground |
|---|---|---|---|---|---|---|---|
| Botanical Gold | `#CFAF66` | `#28301F` | `#F8F4EC` | `#F5F1E6` | `#6D6659` | `#3E4730` | `#EDE6DA` |
| Rose Ivory | `#6F4548` | `#4A2E30` | `#FFF7F4` | `#FAF0EE` | `#7A6262` | `#C8A5A5` | `#F5E5E2` |
| Classic Noir | `#C2A15A` | `#1F1F1D` | `#FAF7F0` | `#F2EDE0` | `#706A5E` | `#3A3A36` | `#EEE8D8` |
| Sage Minimal | `#B8A77A` | `#6F7A5C` | `#F7F5EF` | `#F2F0E8` | `#6D705F` | `#A8B090` | `#E8E4D8` |
| Champagne Cream | `#D6B56D` | `#8A6A3D` | `#FFF9ED` | `#FAF4E0` | `#78694F` | `#C8A870` | `#F2E4C0` |

### New Palettes (7)

**Pearl & Navy** _(elegant)_
```
primary:         #A8956A   warm pearl gold
secondary:       #1A2744   deep navy
background:      #F8F6F0   pearl white
lightText:       #EEF2F8   cool white
mutedText:       #5A6070   blue-grey muted
cardBorder:      #2E3E60   navy-tinted border
cardBackground:  #E8EAF0   cool pearl
```

**Dusty Blue** _(cool)_
```
primary:         #8AABB0   dusty teal
secondary:       #2A3C4A   dark slate blue
background:      #F5F7FA   cool white
lightText:       #EEF2F5   near-white cool
mutedText:       #607080   slate muted
cardBorder:      #4A6070   slate border
cardBackground:  #E0E8EE   cool blueish
```

**Terracotta Linen** _(warm)_
```
primary:         #C4785A   terracotta
secondary:       #3C2820   dark espresso
background:      #FBF5EE   warm linen
lightText:       #F8EEE0   warm off-white
mutedText:       #7A6050   warm taupe
cardBorder:      #C0856A   terracotta border
cardBackground:  #F0DDD0   blush terracotta
```

**Lavender Mist** _(elegant)_
```
primary:         #9A8AB0   soft lavender
secondary:       #2A2438   deep plum
background:      #F8F5FC   lavender mist
lightText:       #EEE8F8   lavender white
mutedText:       #70607A   plum muted
cardBorder:      #B0A0C8   lavender border
cardBackground:  #EDE0F5   soft lilac
```

**Emerald Ivory** _(luxury)_
```
primary:         #A8C89A   sage emerald
secondary:       #1C3028   deep emerald
background:      #F5FAF6   fresh ivory
lightText:       #E8F5EC   green-tinted white
mutedText:       #5A7060   green muted
cardBorder:      #2E5040   emerald border
cardBackground:  #D8EEE0   light emerald
```

**Burgundy Blush** _(romantic)_
```
primary:         #8C3A48   burgundy
secondary:       #2C1418   deep wine
background:      #FDF5F5   blush white
lightText:       #F8ECE8   warm blush white
mutedText:       #7A5055   wine muted
cardBorder:      #C07080   blush border
cardBackground:  #F0D8D8   soft blush
```

**Black Tie Gold** _(luxury)_
```
primary:         #D4A84B   bright gold
secondary:       #111111   pure black
background:      #FAFAF8   cool white
lightText:       #F5F5F0   near-white
mutedText:       #666660   neutral muted
cardBorder:      #333330   dark border
cardBackground:  #F0EFE8   warm white
```

---

## 9. Step-by-Step Implementation Plan

### Step 1 — `FlorenceTemplate.tsx`
Replace the old 4-spread `C` block (lines ~103–112) with the new 12-assignment fallback block.  
No other changes to the template — layout, content, RSVP logic untouched.

### Step 2 — `florence/palettes.ts`
Rewrite completely:
- New 8-role `FLORENCE_COLOR_ROLE_MAP`
- 5 updated existing palettes (add `lightText`, `mutedText`, `cardBorder`, `cardBackground` to each)
- 7 new palettes (12 total)

### Step 3 — `BuilderRightPanel.tsx`
Change `slice(0, 4)` → `slice(0, 6)` so `lightText` and `mutedText` appear as swatches in palette preview cards.

### Step 4 — `npx tsc --noEmit`
Verify 0 errors.

---

## 10. Risks and Assumptions

| Risk | Mitigation |
|---|---|
| `textColor` no longer affects hero/dark-section text | Intentional fix. Old behavior was broken. Manual "Text Color" picker still works via `mutedText ?? textColor` fallback chain |
| `as typeof C_DEFAULT` cast requires all keys to exist in C_DEFAULT | Verified: gold, goldLight, darkOlive, midOlive, lightOlive, borderCard, ivory, ivoryWarm, beige, grayText, whiteText — all exist in C_DEFAULT |
| `lightOlive` now follows `secondary` | Correct — dark palettes should supply a dark secondary; details card overlay stays coherent |
| New config keys not in `WeddingConfig["theme"]["colors"]` TypeScript type | Template accesses via optional chaining on `colors` object which is typed broadly. No schema change needed |
| Gallery arrows use `C.midOlive` — now follows `secondary` | All palettes define a dark secondary → arrows remain visible |
| 12-palette list makes the picker tall | Picker is inside a scrollable panel (`overflowY: auto`) — no layout issue |
| Manual color pickers in BuilderRightPanel hardcode 4 fields | The 4 existing pickers (primary/secondary/background/textColor) continue to work. New roles only set by palettes; could add more pickers later |

---

## 11. Questions / Blockers

None. Ready to implement on approval.

---

## 12. Regression Checklist (post-implementation)

- [ ] `npx tsc --noEmit` returns 0 errors
- [ ] Builder V2 opens Florence without errors
- [ ] Default Florence colors unchanged before any palette applied
- [ ] Botanical Gold: hero, nav, countdown, RSVP, footer text all readable
- [ ] Classic Noir: hero, nav, countdown, RSVP, footer text all readable
- [ ] All 12 palettes apply without crash
- [ ] Each palette produces visually distinct, professional look
- [ ] Text readable in all sections for each palette
- [ ] Manual color pickers (primary / secondary / background / textColor) still work
- [ ] Palette Apply updates canvas immediately
- [ ] Undo reverts palette
- [ ] Redo reapplies palette
- [ ] Save Draft persists palette
- [ ] Reload shows saved palette
- [ ] Public/preview V2 renders saved palette
- [ ] Template without palette support does not crash (palette picker hidden)
- [ ] V1 builder files unchanged
- [ ] V1 templates unchanged
- [ ] Existing live templates unchanged
- [ ] RSVP submit logic unchanged
- [ ] Auth, Telegram, music, sale wheel, upload infra, image editor, DB schema unchanged
- [ ] No unrelated files changed
