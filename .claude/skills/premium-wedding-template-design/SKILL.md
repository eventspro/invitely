---
name: premium-wedding-template-design
description: Create and refine premium, mobile-first wedding invitation templates with elegant visuals, responsive layout, Builder V2 compatibility, and no hardcoded content.
---

# Premium Wedding Template Design Skill

## Purpose

Guide creation and refinement of V2 wedding templates (Aurelia, Florence, and future ones) on the 4ever.am platform. All templates must be mobile-first, visually premium, Builder V2 compatible, and free of hardcoded visible text.

---

## Template Structure

Every V2 template lives in `client/src/templates/{name}/` and requires:

```
{name}/
├── {Name}Template.tsx    # Main React component
├── config.ts             # defaultConfig: WeddingConfig + optional extended interface
├── manifest.ts           # Section/element/inspector registry
├── inspectors.tsx        # Per-section Builder V2 inspector panels
└── components/           # Optional sub-components (e.g. WeddingCarMapMarker)
```

Register in `client/src/templates/index.ts` via `React.lazy()` and `loadTemplateConfig()`.

---

## Design Principles

### Visual Identity
- **Dark templates** (Aurelia): deep teal/forest background (`#081212`), gold (`#D7B777`) accents, serif headings (Cormorant Garamond), sans body (Montserrat)
- **Light templates** (Florence): ivory/cream background, champagne gold accents, editorial floral feel
- Avoid: bright colors, cartoonish icons, clip art, playful rounded shapes
- Prefer: glass panels, subtle overlays, editorial typography, cinematic imagery

### Typography scale (Aurelia)
- Section eyebrow: `0.55–0.60rem`, `letter-spacing: 0.28–0.32em`, uppercase, gold, opacity 0.85
- Section heading: `clamp(2.2rem, 4.5vw, 3.8rem)`, Cormorant Garamond, weight 300
- Body text: `0.82–0.88rem`, Montserrat, weight 300, line-height 1.68–1.8
- Muted labels: gold at 55% opacity for stop numbers, timestamps, etc.

### Spacing
- Section padding: `120px 24px 100px` (desktop), `80px 20px 70px` (mobile)
- Card gap: `72px` desktop, `28px` mobile
- Card inner padding: `22px 24px 24px` desktop, `16px 18px 18px` mobile

---

## Mobile-First Rules

- **390px** is the primary mobile breakpoint. Test all sections at this width.
- Use CSS class pairs: `.aur-ms-desktop { display: block }` / `.aur-ms-mobile { display: none }` toggled via `@media (max-width: 767px)`.
- No horizontal overflow. Cards must not exceed viewport width. Avoid `position: absolute` with `left: 50%` offset unless carefully bounded.
- Touch-swipe gallery: use `onTouchStart`/`onTouchEnd` with 42px threshold.
- Mobile SVG rail: vertical straight line on left edge (`paddingLeft: 52px`), cards stack to the right.
- Font sizes should never go below `0.55rem` on mobile.
- Tap targets (buttons, links) min height `40px`.

---

## No Hardcoded Content Rule

Every visible string must come from `config`:

```tsx
// WRONG
<h2>Your Wedding Day Roadmap</h2>

// RIGHT
const roadmapHeading = (ext.roadmapHeading as string | undefined) ?? "Your Wedding Day Roadmap";
<h2>{roadmapHeading}</h2>
```

- Template-specific extended fields go in `AureliaExtendedConfig` (or equivalent) in `config.ts`
- Access via: `const ext = cfg as unknown as AureliaExtendedConfig & WeddingConfig & Record<string, unknown>`
- Always provide a sensible English default with `?? "Default Text"`

---

## Section Patterns

### Standard section shell
```tsx
<section
  id="aur-{name}"
  data-v2-section="aur-{name}"
  ref={sectionAnim.ref as React.RefObject<HTMLElement>}
  style={{ position: "relative", padding: "120px 24px 100px", ...sectionAnim.style }}
>
  {/* Background layer */}
  <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: "cover", zIndex: 0 }} />
  <div style={{ position: "absolute", inset: 0, background: "rgba(4,8,8,0.74)", zIndex: 1 }} />

  {/* Content */}
  <div style={{ position: "relative", zIndex: 2 }}>
    {/* eyebrow */}
    <p style={{ fontFamily: SANS, fontSize: "0.57rem", letterSpacing: "0.30em", textTransform: "uppercase", color: C.gold, marginBottom: "16px", opacity: 0.85 }}>
      {sectionEyebrow}
    </p>
    {/* heading */}
    <h2 data-v2-element="aur-{name}-heading" data-v2-type="text"
        style={{ fontFamily: SERIF, fontSize: "clamp(2.2rem, 4.5vw, 3.8rem)", fontWeight: 300, color: C.textLight }}>
      {sectionHeading}
    </h2>
  </div>
</section>
```

### Route/itinerary cards (Aurelia roadmap pattern)
Cards should feel like elegant itinerary cards with:
1. Optional image strip (120px desktop / 100px mobile) with gradient fade-to-dark
2. Content area: stop number (muted gold) → time → title → description → address row → map button
3. Address row: pin SVG + address text, only if address is non-empty and non-placeholder
4. Map button: external arrow icon, only rendered when `mapHref` exists

```tsx
// Map href logic
const stopAddress = (m as any).address as string | undefined;
const stopMapUrl  = (m as any).mapUrl as string | undefined;
const stopBtnTxt  = (m as any).buttonText as string | undefined ?? "Open in Maps";
const placeholder = "Add address here";
const addrClean   = stopAddress?.trim() && stopAddress !== placeholder ? stopAddress.trim() : null;
const mapHref     = stopMapUrl
  ? stopMapUrl
  : addrClean
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addrClean)}`
    : null;
```

### SVG route animation (Aurelia car)
- Desktop: curved SVG path `"M150 0 C80 180 220 300 150 460 C80 640 220 780 150 1200"`, 300px wide centered rail
- Mobile: straight vertical line `"M22 0 L22 1400"`, 44px wide strip on left
- Progress hook: `useRoadmapProgress(builderMode)` → 0–1 value based on section scroll position
- `strokeDashoffset = pathLength * (1 - progress)` creates fill animation
- Car: `<WeddingCarMapMarker>` at `routePathRef.current.getPointAtLength(progress * pathLength)`
- In `builderMode`: set `progress = 1` immediately, skip scroll listeners
- Respect `prefers-reduced-motion`: set `progress = 1` immediately

### Detail/info cards (Wedding Notes pattern)
4-column grid (→ 2-col → 1-col on mobile) for non-location info:
- Dress Code, Gifts, Parking, RSVP By
- Icon (inline SVG 38×38), divider, eyebrow label, serif name, body description
- No map buttons — purely informational

---

## Animation Hooks

```typescript
// Section entrance
useSectionAnim(type: "fade-up"|"fade-in", builderMode: boolean)
// → returns { ref, style } — applies CSS keyframe animation on IntersectionObserver trigger

// Scroll-based roadmap progress
useRoadmapProgress(builderMode: boolean)
// → returns { sectionRef, progress: 0–1 }

// Mobile roadmap progress (same API)
useMobileRoadmapProgress(builderMode: boolean)

// Staggered card reveal
useMilestoneReveal(count: number, builderMode: boolean)
// → returns { desktopRef, mobileRef, visible: boolean[] }

// Background parallax
useParallax(factor: number, builderMode: boolean)
// → returns { ref, offset }
```

All hooks must:
- Set final/visible state immediately in `builderMode`
- Respect `window.matchMedia("(prefers-reduced-motion: reduce)")`
- Clean up event listeners in `useEffect` return

---

## Dynamic Theme

Templates must support runtime theme overrides from `cfg.theme`:

```typescript
const C: Record<keyof typeof C_DEFAULT, string> = {
  ...C_DEFAULT,
  gold:      colors.primary       ?? C_DEFAULT.gold,
  bgDark:    colors.background    ?? C_DEFAULT.bgDark,
  textLight: colors.lightText     ?? C_DEFAULT.textLight,
  // etc.
};
const SERIF = cfg.theme?.fonts?.heading || SERIF_DEFAULT;
const SANS  = cfg.theme?.fonts?.body    || SANS_DEFAULT;
```

---

## Inline SVG Icons

Prefer inline SVG over emoji or icon libraries:
- `viewBox="0 0 38 38"` for detail card icons (38×38)
- `viewBox="0 0 24 24"` for UI inline icons (12–16px rendered)
- `stroke={C.gold}`, `fill="none"`, `strokeWidth="1.1"`, `strokeLinecap="round"`, `strokeLinejoin="round"`
- Keep paths simple — 2–3 path elements max per icon

---

## Scoped CSS

All CSS is scoped inside a `<style>` block rendered within the component. Use `.aur-*` prefixes:

```tsx
<style>{`
  .aur-detail-card {
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  .aur-detail-card:hover {
    transform: translateY(-6px);
    border-color: rgba(180,145,80,0.70) !important;
  }
  @media (max-width: 767px) {
    .aur-ms-desktop { display: none; }
    .aur-ms-mobile  { display: block; }
  }
`}</style>
```

Zero global style pollution — never use bare element selectors like `h2 { }` or `p { }`.

---

## Quality Checklist

Before reporting a template change complete:

- [ ] No hardcoded visible strings in JSX
- [ ] All new fields accessible from `config` with English defaults
- [ ] Mobile 390px: no horizontal overflow, readable font sizes, adequate tap targets
- [ ] Desktop: premium cinematic feel maintained
- [ ] `builderMode=true`: animations skip to final state, no scroll listeners
- [ ] `prefers-reduced-motion`: respected in all animation hooks
- [ ] `data-v2-section` and `data-v2-element` attributes on all editable regions
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] No Armenian text auto-generated
- [ ] No touches to unrelated templates (Florence, planner, homepage, cron)
