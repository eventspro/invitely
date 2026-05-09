# Aurelia Template V2 — Full Pixel-Perfect Rebuild Report

**Date:** May 9, 2026  
**Files Modified:**
- `client/src/templates/aurelia/AureliaTemplate.tsx` — **complete rewrite** (1,617 lines)
- `client/src/templates/aurelia/config.ts` — theme colors + font + extended interface

**TypeScript status after rebuild:** ✅ 0 errors (`npx tsc --noEmit --skipLibCheck`)

---

## 1. Why a Full Rewrite Was Necessary

The previous version (`e386366` "cinematic rewrite") had used the wrong visual identity:
- Palette: warm champagne `#C4A97D` / warm ivory backgrounds
- Font stack: `Raleway` (body)
- Countdown: centered in hero content flow
- Story section: split two-column grid (text left, image right)
- Journey: straight vertical timeline line, no SVG curve, no car marker
- Gallery: basic CSS grid of thumbnails
- Venue panel: left-aligned, not centered
- RSVP: single-column centered form

The pixel-perfect spec (`AURELIA_PIXEL_PERFECT_SPEC.md`) and all 10 reference images confirmed a completely different identity: **deep dark teal `#081212` + antique gold `#D7B777`**, editorial glass-morphism panels, SVG animated route, layered cinematic gallery, and strict two-column RSVP layout.

---

## 2. Colour System — New vs. Old

### 2.1 Old palette (discarded)
| Token | Value | Used for |
|---|---|---|
| `primary` | `#C4A97D` | Warm champagne gold |
| `secondary` | `#1C1917` | Near-black warm |
| `background` | `#FAF8F4` | Warm ivory page bg |
| `textColor` | `#44403C` | Warm dark text |
| body font | `Raleway` | All body copy |

### 2.2 New palette (spec-accurate)
| Constant | Value | Used for |
|---|---|---|
| `bgDark` | `#081212` | Root page background, RSVP/roadmap section backgrounds |
| `bgDeep` | `#0C1412` | Footer background — slightly deeper than root |
| `panelDark` | `rgba(8,14,12,0.72)` | Reserved for deep overlay panels |
| `panelGlass` | `rgba(12,18,15,0.62)` | Reserved for lighter glass panels |
| `gold` | `#D7B777` | Primary accent: borders, eyebrows, icons, CTAs, SVG strokes |
| `goldSoft` | `#F1D8A1` | Hero couple names, RSVP heading, footer couple names — softer highlight |
| `ivory` | `#F7F0E3` | Details section background (the one intentionally light section) |
| `ivoryMuted` | `#D6C8B0` | Details section secondary text, RSVP deadline text |
| `textLight` | `#FFF7EA` | Body text on dark backgrounds, headings on dark |
| `textMuted` | `#CBBEA8` | Supporting body copy, descriptions, venue feature text |
| `borderGold` | `rgba(215,183,119,0.55)` | Glass panel borders (countdown, story, venue, RSVP form) |
| `shadowDark` | `rgba(0,0,0,0.45)` | Box shadows |
| `overlayDark` | `rgba(0,0,0,0.46)` | Fallback dark overlay |

### 2.3 Dynamic theme override
The `C` object is built at runtime inside the component:
```ts
const C: Record<keyof typeof C_DEFAULT, string> = {
  ...C_DEFAULT,
  gold:       colors.primary          ?? C_DEFAULT.gold,
  goldSoft:   colors.primary          ?? C_DEFAULT.goldSoft,
  bgDark:     colors.background       ?? C_DEFAULT.bgDark,
  bgDeep:     colors.sectionDarkBg    ?? C_DEFAULT.bgDeep,
  textLight:  colors.lightText        ?? C_DEFAULT.textLight,
  textMuted:  colors.mutedText        ?? C_DEFAULT.textMuted,
  ivory:      colors.sectionLightBg   ?? C_DEFAULT.ivory,
  ivoryMuted: colors.sectionLightText ?? C_DEFAULT.ivoryMuted,
};
```
This means every `C.gold`, `C.bgDark`, etc. reference in JSX will automatically reflect any per-template database config override. The type was changed from `typeof C_DEFAULT` (literal string union) to `Record<keyof typeof C_DEFAULT, string>` to allow the runtime string assignments without TypeScript errors.

---

## 3. Typography System

### 3.1 Font stack constants (module-level)
```ts
const SERIF_DEFAULT = "'Cormorant Garamond', 'Playfair Display', Georgia, serif";
const SANS_DEFAULT  = "'Montserrat', 'Inter', 'system-ui', sans-serif";
```
These are then overridden per template instance via:
```ts
const SERIF = cfg.theme?.fonts?.heading || SERIF_DEFAULT;
const SANS  = cfg.theme?.fonts?.body    || SANS_DEFAULT;
```

### 3.2 Font loading — `AureliaFonts()` component
A separate zero-render component appends a `<link>` tag to `document.head` exactly once:
```ts
function AureliaFonts() {
  useEffect(() => {
    const id = "aurelia-gfonts";
    if (document.getElementById(id)) return; // idempotent
    const link = document.createElement("link");
    link.id   = id;
    link.rel  = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Montserrat:wght@300;400;500;600&display=swap";
    document.head.appendChild(link);
  }, []);
  return null;
}
```
**Change from old version:** Old version loaded `Raleway`. New version loads `Montserrat` + `Cormorant Garamond` (with italic variants at 300/400/500 weight).

### 3.3 Size scale
| Element | Size | Notes |
|---|---|---|
| Hero couple names | `clamp(4rem, 8vw, 8.8rem)` | Class `.aur-hero-names` |
| Hero names on mobile (≤520px) | `clamp(3rem, 11vw, 5rem)` | Override via media query |
| Section headings | `clamp(2.2rem, 4vw, 3.6–4.8rem)` | Per-section variation |
| RSVP big heading | `clamp(4.5rem, 9vw, 9rem)` | Bold editorial serif |
| Eyebrow labels | `0.57rem` | `letter-spacing: 0.30–0.36em`, uppercase |
| Nav links | `0.62rem` | `letter-spacing: 0.14em`, uppercase |
| Body copy | `0.82–0.9rem` | `line-height: 1.7–1.92` |
| Countdown values | `clamp(1.5rem, 2.4vw, 2.1rem)` | Serif, weight 300 |
| Countdown labels | `0.42rem` | `letter-spacing: 0.18em` |

---

## 4. Hooks — Detailed Specification

### 4.1 `useSectionAnim(animType, builderMode)`
**Purpose:** Attaches an `IntersectionObserver` to a section element and fires a one-time CSS animation when it enters the viewport.

**Parameters:**
- `animType: string` — matches the `aur-{animType}` CSS keyframe name (e.g. `"fade-up"`, `"fade-in"`)
- `builderMode: boolean` — when true, skips animation entirely (returns empty style so Builder V2 sees final state)

**Behaviour:**
- Observer fires at `threshold: 0.06` with `rootMargin: "0px 0px -48px 0px"` (triggers slightly before element fully visible from bottom)
- Once triggered, disconnects itself (fires exactly once)
- Pre-animation state: `opacity: 0; transform: translateY(36px)` for `fade-up`; just `opacity: 0` for `fade-in`
- Post-animation: CSS animation at `0.9s cubic-bezier(0.25,0.46,0.45,0.94)`

**Usage per section:**
```ts
const storyAnim   = useSectionAnim("fade-up", builderMode);
const roadmapAnim = useSectionAnim("fade-up", builderMode);
const detailsAnim = useSectionAnim("fade-up", builderMode);
const venueAnim   = useSectionAnim("fade-up", builderMode);
const galleryAnim = useSectionAnim("fade-up", builderMode);
const rsvpAnim    = useSectionAnim("fade-in", builderMode);  // no translate for RSVP
const footerAnim  = useSectionAnim("fade-in", builderMode);
```

### 4.2 `useRoadmapProgress(builderMode)`
**Purpose:** Tracks scroll position relative to the Journey section and produces a `progress` value `0 → 1` used to drive the SVG route animation and car marker position.

**Mechanism:**
```ts
const start = winH * 0.8 - rect.top;   // pixels scrolled past 80% viewport line
const total = el.offsetHeight * 0.85;  // 85% of section height = full progress
setProgress(Math.max(0, Math.min(1, start / total)));
```
- Uses `requestAnimationFrame` throttling via `rafRef` to avoid layout thrash
- `passive: true` scroll listener
- Falls back to `progress = 1` (fully revealed) in `builderMode` or `prefers-reduced-motion`
- Returns `{ sectionRef, progress }`

### 4.3 `useParallax(factor, builderMode)`
**Purpose:** Calculates a vertical `offset` (in px) for background images to create depth parallax as the user scrolls.

**Formula:**
```ts
setOffset((rect.top + rect.height / 2 - winH / 2) * factor);
```
- `factor` controls intensity. Values used: Hero=0.25, Story=0.18, Venue=0.20, RSVP=0.15
- Applied as `transform: translateY(${offset}px)` on a background `<div>` with `inset: "-15% 0"` (extended 15% top/bottom to prevent gaps)
- Disabled for `builderMode` and `prefers-reduced-motion`
- Returns `{ ref, offset }`

### 4.4 `useMilestoneReveal(count, builderMode)`
**Purpose:** Creates an array of `visible: boolean[]` flags for milestone cards. Each card gets its own `IntersectionObserver` and reveals with a 120ms stagger delay between each.

**Stagger timing:**
```ts
setTimeout(
  () => setVisible(prev => { const n = [...prev]; n[i] = true; return n; }),
  i * 120  // card 0 = 0ms, card 1 = 120ms, card 2 = 240ms, card 3 = 360ms
);
```
- Observer threshold: `0.18` with `rootMargin: "0px 0px -40px 0px"`
- Bypass conditions: `builderMode`, `prefers-reduced-motion`, or `window.innerWidth < 768` (mobile shows all immediately)
- Returns `{ containerRef, visible }`

The `visible[i]` flag controls CSS directly on each milestone `<div>`:
```tsx
opacity:   milestoneVisible[i] ? 1 : 0,
transform: milestoneVisible[i] ? "none" : `translateX(${i % 2 === 0 ? "-32px" : "32px"})`,
transition: "opacity 0.65s ease, transform 0.65s ease",
```
Left-side cards slide in from `-32px` (rightward), right-side cards from `+32px` (leftward).

---

## 5. Section-by-Section Implementation

### 5.1 Navbar

**HTML ID / data attributes:** `data-v2-section="aur-nav"`  
**Position:** `position: fixed` (normal) / `position: sticky` (builderMode)  
**Height:** `64px`  
**Z-index:** `1000`

**Scroll transition:**  
State `scrolled` flips to `true` when `window.scrollY > 72px`.
```
scrolled=false:  background: transparent, no blur, no border
scrolled=true:   background: rgba(6,14,10,0.94), backdropFilter: blur(18px),
                 borderBottom: 1px solid rgba(215,183,119,0.16)
```
Transition: `0.35s ease` on both background and border-bottom.

**Brand mark (top-left):**
- `data-v2-element="aur-nav-brand"`, `data-v2-type="text"`
- An inline SVG leaf/teardrop path: `M6.5 1 C4.5 3.5 2.5 5.5 2.5 7.5 C2.5 10 4.2 12 6.5 12 C8.8 12 10.5 10 10.5 7.5 C10.5 5.5 8.5 3.5 6.5 1Z` — a pointed leaf shape
- Stem line below: `x1=6.5 y1=12` to `x2=6.5 y2=14.5`
- Leaf SVG: `13×15px`, stroke `C.gold`, strokeWidth `0.85`, no fill
- "AURELIA" text: `SERIF` font, `0.82rem`, weight 400, letter-spacing `0.26em`, uppercase, `C.goldSoft`

**Navigation links (desktop):**  
Six links: `Our Story`, `The Journey`, `Details`, `Venue`, `Gallery`, `RSVP`  
Scroll targets: `#aur-story`, `#aur-roadmap`, `#aur-details`, `#aur-venue`, `#aur-gallery`, `#aur-rsvp`  
Hidden at `≤860px` via `.aur-nav-desktop { display: none !important }`

**Mobile hamburger:**  
- Shown at `≤860px` via `.aur-hamburger { display: block !important }`
- Three horizontal SVG lines (`20×14px`)
- Opens full-screen overlay with `position: fixed; inset: 0; zIndex: 1999`
- Overlay shows the same 6 nav links as large serif (`2.2rem`, weight 300)
- Close button: absolute top-right `×` character

### 5.2 Hero Section

**HTML ID:** `#aur-hero`  
**Data attribute:** `data-v2-section="aur-hero"`  
**Min-height:** `100vh`  
**Layout:** `flexDirection: column`, overflow hidden

#### 5.2.1 Background Image
The background lives in a child `<div>` (not `background-image` on the section) so parallax can work without clipping:
```tsx
<div
  ref={heroParallax.ref}
  style={{
    position: "absolute",
    inset: "-15% 0",            // extends 15% beyond top/bottom for parallax travel
    backgroundImage: `url(${heroImage})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    transform: `translateY(${heroParallax.offset}px)`,
    zIndex: 0,
    animation: "aur-hero-scale 2s cubic-bezier(0.25,0.46,0.45,0.94) both",
    willChange: "transform",
  }}
/>
```
`aur-hero-scale` keyframe: `scale(1.04) → scale(1)` over 2s — subtle Ken Burns effect on load.

#### 5.2.2 Dual Overlay System
Two separate `position: absolute; inset: 0` divs at `zIndex: 1`:
1. **Radial gradient**: `radial-gradient(circle at 42% 50%, rgba(0,0,0,0.10), rgba(0,0,0,0.68))` — adds circular lightness at 42% from left, darkens edges
2. **Linear gradient**: `linear-gradient(90deg, rgba(0,0,0,0.62), rgba(0,0,0,0.18), rgba(0,0,0,0.55))` — darkens left edge (62%), lightens centre (18%), darkens right (55%)

Combined effect: left-weighted cinematic look, brighter window in the centre-right for photograph.

#### 5.2.3 Hero Content Block
```
padding: clamp(100px, 14vh, 160px)  [top]
         clamp(24px, 8vw, 96px)     [sides]
         100px                       [bottom]
maxWidth: 860px
animation: aur-hero-content 1.4s 0.3s   (delay 0.3s after load)
```
`aur-hero-content` keyframe: `translateY(28px) + opacity:0 → normal` — staggered slide-up after background settles.

**Eyebrow line:**
```
"WE'RE GETTING MARRIED"
font: SANS, 0.57rem, weight 500, letter-spacing 0.34em, uppercase
color: C.gold, opacity: 0.92
data-v2-element: aur-hero-intro
```

**Couple names `<h1>`:**
```
font: SERIF, clamp(4rem, 8vw, 8.8rem), weight 300, letter-spacing 0.08em
color: C.goldSoft (#F1D8A1)
lineHeight: 1.0
textShadow: 0 20px 60px rgba(0,0,0,0.55)
class: aur-hero-names (responsive override to clamp(3rem,11vw,5rem) at ≤520px)
data-v2-element: aur-hero-names
```
Separator rendered as italic `C.gold` with `margin: 0 0.2em`.

**Decorative divider:** Two 50px gold lines flanking a 7×7px diamond SVG (`M3.5 0L7 3.5L3.5 7L0 3.5Z`, fill `C.gold` at 82% opacity).

**Date line:** `SERIF`, `clamp(1.1rem, 2vw, 1.55rem)`, weight 300, italic, `C.ivoryMuted`  
**Location line:** `SANS`, `0.56rem`, `letter-spacing: 0.24em`, uppercase, `C.textLight` at 52% opacity

**CTA button:**
```
"RSVP NOW" + right arrow SVG
background: linear-gradient(135deg, C.goldSoft 0%, C.gold 100%)
color: C.bgDark (dark text on gold background)
padding: 14px 34px
font: SANS, 0.62rem, weight 600, letter-spacing 0.22em, uppercase
alignSelf: flex-start (left-aligned within flex column)
```

#### 5.2.4 Countdown Card (bottom-right)
**This is the most precisely spec'd element in the hero.**

Position:
```css
position: absolute;
bottom: 40px;
right: 40px;
```
On mobile (≤520px): `bottom: 16px; right: 12px; padding: 14px 18px` via media query override.

Glass morphism styling:
```css
backdropFilter: blur(18px);
WebkitBackdropFilter: blur(18px);
background: rgba(10,16,13,0.58);
border: 1px solid rgba(215,183,119,0.62);
borderRadius: 18px;
boxShadow: 0 26px 70px rgba(0,0,0,0.55);
padding: 20px 26px;
```

Entry animation: `aur-countdown-slide 1.4s 0.9s cubic-bezier(0.25,0.46,0.45,0.94) both`  
Keyframe: `translateX(44px) + opacity:0 → normal` — slides in from the right, delayed 0.9s after page load.

**Internal layout:**  
Subtitle (e.g. "UNTIL WE SAY I DO"): `SANS`, `0.50rem`, `letter-spacing: 0.26em`, `C.gold`, centered  
Four time units in a flex row, separated by vertical dividers:
```
Each unit:
  minWidth: 60px, padding: 0 10px
  borderRight: 1px solid rgba(215,183,119,0.18)  [last one: none]
  
Value: SERIF, clamp(1.5rem, 2.4vw, 2.1rem), weight 300, C.goldSoft, lineHeight 1
Label: SANS, 0.42rem, letter-spacing 0.18em, C.textMuted, uppercase, marginTop 5px
```
Values padded to 2 digits with `String(value).padStart(2, "0")`.

Countdown uses `setInterval(tick, 1000)` targeting `new Date(cfg.wedding.date)`. Clears interval on unmount.

**Visibility:** Controlled by `cfg.sections?.countdown?.enabled !== false`.

#### 5.2.5 Scroll Indicator (bottom-center)
```
position: absolute; bottom: 32px; left: 50%
opacity: 0.40
animation: aur-scroll-bob 2.8s ease-in-out infinite
```
`aur-scroll-bob` keyframe: `translateX(-50%)translateY(0) → translateX(-50%)translateY(9px) → back` — includes the -50% X offset to keep it centered throughout the bob.  
Contains "Scroll" text + a 12×22px SVG downward arrow (vertical line + chevron).

---

### 5.3 Our Story Section

**HTML ID:** `#aur-story`  
**Data attribute:** `data-v2-section="aur-story"`  
**Min-height:** `100vh`  
**Section entrance:** `storyAnim` (fade-up)

#### 5.3.1 Full-Section Background with Parallax
```tsx
<div
  ref={storyParallax.ref}
  style={{
    position: "absolute",
    inset: "-15% 0",
    backgroundImage: `url(${storyImage || "fallback Unsplash URL"})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    transform: `translateY(${storyParallax.offset}px)`,
    willChange: "transform",
  }}
/>
```
Fallback image: `https://images.unsplash.com/photo-1511285560929-80b456fea0bc` (wedding/forest scene)

**Left-weighted dark overlay:**
```css
background: linear-gradient(100deg,
  rgba(6,10,9,0.85) 0%,    /* deep opacity left edge */
  rgba(6,10,9,0.58) 52%,   /* mid opacity center */
  rgba(6,10,9,0.18) 100%   /* near transparent right */
);
```
Creates cinematic depth — dark left where the panel sits, reveals image on right.

#### 5.3.2 Glass Panel (floating left)
```
class: aur-story-panel
animation: aur-panel-reveal 1.1s 0.35s
```
`aur-panel-reveal` keyframe:
```css
from { opacity: 0; transform: translateY(36px); filter: blur(10px); }
to   { opacity: 1; transform: translateY(0);    filter: blur(0);    }
```
This is a three-property simultaneous animation: fade + slide + blur-in.

Panel position and sizing:
```css
marginLeft: clamp(24px, 8vw, 110px)   /* responsive left margin */
marginTop/Bottom: 80px                 /* breathing room from section edges */
maxWidth: 490px
```

Panel glass morphism:
```css
background: rgba(8,18,14,0.74)
backdropFilter: blur(22px)
border: 1px solid rgba(215,183,119,0.38)
borderRadius: 16px
boxShadow: 0 32px 80px rgba(0,0,0,0.55)
padding: 52px 44px 48px
```

Panel internal content (top to bottom):
1. **Eyebrow "OUR STORY"** — SANS, 0.57rem, 500 weight, letter-spacing 0.32em, `C.gold`
2. **32px gold divider line** — `width: 32px; height: 1px; background: C.gold; opacity: 0.48`
3. **Heading** (`data-v2-element="aur-story-heading"`) — SERIF, `clamp(2rem, 3.5vw, 3.2rem)`, weight 300, `C.textLight`
4. **Body paragraph** (`data-v2-element="aur-story-body"`) — SANS, 0.9rem, weight 300, `C.textMuted`, `lineHeight: 1.88`
5. **CTA row** (`data-v2-element="aur-story-cta"`) — "READ OUR STORY" + right arrow SVG, `C.gold`, bottom-border underline style
6. **Pagination** — `01 — 02 — 03` micro-text, `0.52rem`, gold for active (`01`), muted for others, separated by 18px lines

---

### 5.4 Journey / Roadmap Section

**HTML ID:** `#aur-roadmap`  
**Data attribute:** `data-v2-section="aur-roadmap"`  
**Min-height:** `140vh` (taller than viewport to allow meaningful scroll progress)  
**Padding:** `120px 24px 100px`

#### 5.4.1 Background
Static aerial/lake image (no parallax on roadmap — the SVG animation provides motion):
```
url: https://images.unsplash.com/photo-1506905925346-21bda4d32df4 (aerial mountain lake)
overlay: rgba(4,8,8,0.74)
```

#### 5.4.2 Section Header
Three elements centered:
- Eyebrow "OUR JOURNEY" — SANS, 0.57rem, letter-spacing 0.30em, `C.gold`
- `<h2>` heading from `roadmapHeading` config — SERIF, `clamp(2.2rem, 4.5vw, 3.8rem)`, weight 300
- Supporting text — "Every great love story has a beginning" — SANS, 0.88rem, `C.textMuted`

#### 5.4.3 SVG Curved Route — Full Specification

The SVG route sits in a `div` centered at 50% horizontal:
```css
class: aur-ms-rail
position: absolute;
left: 50%;
top: 0; bottom: 0;
transform: translateX(-50%);
width: 300px;
z-index: 1;
pointer-events: none;
```

The `<svg>` element:
```tsx
<svg viewBox="0 0 300 1200" preserveAspectRatio="none"
     style={{ width: "100%", height: "100%" }}>
```
`preserveAspectRatio="none"` allows the SVG to stretch vertically to match the section height regardless of content.

**Two paths are drawn, sharing the same curve equation:**

Path 1 — Ghost base (always visible, dim):
```tsx
<path
  d="M150 0 C80 180 220 300 150 460 C80 640 220 780 150 1200"
  stroke="rgba(215,183,119,0.14)"
  strokeWidth="3"
  fill="none"
/>
```

Path 2 — Animated fill (reveals as you scroll):
```tsx
<path
  ref={routePathRef}
  d="M150 0 C80 180 220 300 150 460 C80 640 220 780 150 1200"
  stroke={C.gold}
  strokeWidth="3"
  fill="none"
  strokeDasharray={pathLength > 0 ? pathLength : 1600}
  strokeDashoffset={(pathLength > 0 ? pathLength : 1600) * (1 - progress)}
  style={{
    filter: "drop-shadow(0 0 7px rgba(215,183,119,0.62))",
    transition: "stroke-dashoffset 0.12s linear",
  }}
/>
```

**The cubic bezier curve anatomy:**
```
M150 0              — starts at top center (x=150 in 300-wide viewport)
C80 180 220 300     — first S-curve: swings left to x=80 at y=180, back to x=220 at y=300
150 460             — first S-curve anchor point at x=150, y=460
C80 640 220 780     — second S-curve: mirrors the first, swings left again
150 1200            — ends at bottom center, y=1200
```
The path creates two complete S-curve oscillations: center→left→center→right→center×2, giving a realistic winding road feel.

**Path length measurement:**
```ts
const routePathRef = useRef<SVGPathElement>(null);
const [pathLength, setPathLength] = useState(0);
useEffect(() => {
  if (routePathRef.current) {
    setPathLength(routePathRef.current.getTotalLength());
  }
}, []);
```
`getTotalLength()` is called once on mount. The actual SVG path length (in SVG user units) is stored in state. Fallback `1600` prevents divide-by-zero before measurement.

**Dash-offset animation formula:**
```
strokeDasharray  = pathLength         (one dash the entire length)
strokeDashoffset = pathLength * (1 - progress)
```
At `progress=0`: offset = pathLength → entire path is hidden (dash offset hides it all)  
At `progress=0.5`: offset = pathLength/2 → half the path is drawn  
At `progress=1`: offset = 0 → entire path is drawn (fully gold)

The `0.12s linear` CSS transition smooths out the per-frame `progress` jumps from the scroll listener.

**Glow effect:** `drop-shadow(0 0 7px rgba(215,183,119,0.62))` applied via CSS `filter` to the entire SVG `<path>`. This creates a soft golden halo around the drawn portion.

#### 5.4.4 Car Marker — Full Specification

```ts
const carPt = (pathLength > 0 && routePathRef.current)
  ? routePathRef.current.getPointAtLength(progress * pathLength)
  : null;
```

`getPointAtLength(distance)` returns a `DOMPoint` with `{ x, y }` coordinates in SVG user units. Multiplied by `progress * pathLength` so the car tracks exactly at the tip of the gold drawn line.

The car SVG group:
```tsx
{carPt && (
  <g
    transform={`translate(${carPt.x - 13}, ${carPt.y - 10})`}
    style={{ filter: "drop-shadow(0 0 10px rgba(215,183,119,0.82))" }}
  >
    {/* Car body rectangle */}
    <rect x="3" y="7" width="20" height="10" rx="2"
          fill={C.gold} fillOpacity="0.92"/>
    {/* Car roof trapezoid */}
    <path d="M7 7L9.5 3H16.5L19 7"
          fill={C.gold} fillOpacity="0.72"/>
    {/* Front wheel */}
    <circle cx="8"  cy="18" r="2.5"
            fill={C.bgDark} stroke={C.gold} strokeWidth="1.2"/>
    {/* Rear wheel */}
    <circle cx="18" cy="18" r="2.5"
            fill={C.bgDark} stroke={C.gold} strokeWidth="1.2"/>
  </g>
)}
```

**Car dimensions (in SVG user units):** approximately 26×18 units  
**Centering offset:** `translate(carPt.x - 13, carPt.y - 10)` — offsets by half the car width/height  
**Car body:** `<rect>` at `x=3 y=7`, `width=20 height=10`, `rx=2` (rounded corners), `fill C.gold` at 92%  
**Car roof:** Trapezoid path `M7 7 L9.5 3 H16.5 L19 7` — narrower at top (windscreen line), wider at bottom  
**Wheels:** Two `<circle>` elements at `cx=8/18`, `cy=18`, `r=2.5`. Filled with `C.bgDark` (dark centre), stroked with `C.gold` (gold rim)  
**Glow:** `drop-shadow(0 0 10px rgba(215,183,119,0.82))` — stronger than the path glow, making the car the focal point  
**Visibility:** Only rendered when `carPt !== null` (after `getTotalLength()` resolves and `progress > 0`)

#### 5.4.5 Milestone Cards

Each card is a `<div>` with `data-aur-ms={i}` attribute (used by `useMilestoneReveal` to attach observers).

**Alternating left/right positioning:**
```tsx
className={i % 2 === 0 ? "aur-ms-left" : "aur-ms-right"}
```
CSS classes:
```css
.aur-ms-left  { margin-right: calc(50% + 44px); text-align: right; }
.aur-ms-right { margin-left:  calc(50% + 44px); }
```
The `44px` provides clearance from the centered SVG route (which is 300px wide, so 150px either side, plus 44px gap to card edge).

**Card structure:** glass dark container, overflow hidden
```css
background: rgba(8,18,14,0.80)
border: 1px solid rgba(215,183,119,0.22)
borderRadius: 10px
backdropFilter: blur(12px)
boxShadow: 0 12px 48px rgba(0,0,0,0.45)
```

**Photo thumbnail (if milestone has `.image`):**
```tsx
{!!(m as Record<string, unknown>).image && (
  <div style={{ height: "140px", overflow: "hidden", position: "relative" }}>
    <img src={...} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    <div style={{ /* bottom gradient overlay */ }} />
  </div>
)}
```
The `!!` cast converts `unknown` to `boolean` — required because `WeddingConfig.timeline.events` does not include an `image` field in the type, so it's accessed via `(m as Record<string, unknown>).image`.

**Card inner content:**
- **Time label** — `SERIF`, `0.70rem`, letter-spacing `0.18em`, `C.gold`
- **Title `<h3>`** — `SERIF`, `1.35rem`, weight 400, `C.textLight`
- **Description** — `SANS`, `0.82rem`, weight 300, `C.textMuted`, lineHeight 1.68

**Timeline dot connector:**
```tsx
<div
  style={{
    position: "absolute",
    top: "24px",
    ...(i % 2 === 0 ? { right: "-48px" } : { left: "-48px" }),
    width: "10px", height: "10px", borderRadius: "50%",
    background: C.gold,
    border: `2.5px solid ${C.bgDark}`,
    zIndex: 4,
    boxShadow: "0 0 14px rgba(215,183,119,0.65)",
  }}
/>
```
The dot sits on the card at `top: 24px`, positioned `48px` outside the card edge toward the route — placing it visually on the SVG path.

**Mobile responsive:** At `≤768px`, all milestone cards collapse to single column left-aligned starting at 56px from left. The rail is repositioned to `left: 28px; transform: none`.

---

### 5.5 Wedding Details Section

**HTML ID:** `#aur-details`  
**Data attribute:** `data-v2-section="aur-details"`  
**Background:** `C.ivory` = `#F7F0E3` — intentionally the only light section  
**Padding:** `110px 40px 100px`

#### 5.5.1 Section Header (centered)
- Eyebrow "JOIN US" — SANS, `0.57rem`, `C.gold`
- `<h2>` from `detailsLabel` (defaults: "THE CELEBRATION") — SERIF, `clamp(2.2rem, 4vw, 3.6rem)`, weight 300, `color: #1a140e`
- Diamond divider: two 40px lines + 7×7px diamond SVG

#### 5.5.2 Four-Column Card Grid
```tsx
<div className="aur-details-grid"
     style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
```
Responsive breakpoints:
- `≤768px`: `grid-template-columns: repeat(2,1fr)` — 2×2 grid
- `≤520px`: `grid-template-columns: 1fr` — single column stacked

Each card:
```css
background: rgba(247,240,227,0.88)    /* translucent ivory */
border: 1px solid rgba(175,140,75,0.28)
borderRadius: 4px                     /* very subtle rounding */
padding: 40px 28px 36px
textAlign: center
class: aur-detail-card
```

`.aur-detail-card:hover`:
```css
transform: translateY(-6px);
border-color: rgba(180,145,80,0.70) !important;
box-shadow: 0 20px 56px rgba(0,0,0,0.13) !important;
```
Transition: `0.3s ease` on transform, box-shadow, border-color.

#### 5.5.3 Detail Card Icons — Line Art SVGs (38×38px each)

All icons use `fill="none"`, `stroke=C.gold`, `strokeWidth="1.1"`, `strokeLinecap="round"`, `strokeLinejoin="round"`.

**Icon 0 — Ceremony (Building/Arch):**
```
M9 34V21H29V34     — two pillars rising to horizontal beam (doorway arch base)
M5 21h28           — horizontal lintel spanning full width
M19 4v8            — central spire
M16 8h6            — horizontal cross-beam on spire
M15 21V14h8v7      — central entrance door arch
```

**Icon 1 — Cocktail Hour (Two Champagne Glasses):**
```
Left glass:  M12 4l4 14H8L12 4z  — triangular glass body
             M12 18v14             — stem
             M8 32h8               — base
Right glass: M26 4l4 14H22L26 4z — same mirrored
             M26 18v14
             M22 32h8
Cross-link:  M16 10l6 2           — diagonal line connecting glasses (toast!)
```

**Icon 2 — Reception (Music Note):**
```
circle cx=5 cy=12 r=2    — left note head (filled by stroke)
circle cx=11 cy=10 r=2   — right note head
M7 12V6l6-2v4            — stems + beam connecting both notes
```

**Icon 3 — Dress Code (Tuxedo/Bowtie):**
```
rect x=6 y=10 width=26 height=21 rx=1   — calendar-like rectangle
M6 17h26                                  — horizontal line (collar line)
M13 10V6                                  — left shoulder strap
M25 10V6                                  — right shoulder strap
```

Card internal content (top to bottom):
1. Icon (38×38, centred)
2. 26px gold divider line
3. Eyebrow from `venue.title` — SANS, `0.53rem`, `C.gold`
4. Name from `venue.name` — SERIF, `1.55rem`, weight 400, `#1a140e`
5. Description from `venue.description` — SANS, `0.82rem`, `#6b5e4e`, `white-space: pre-line`
6. Optional map link if `venue.mapButton && venue.address`

---

### 5.6 Venue Section

**HTML ID:** `#aur-venue`  
**Data attribute:** `data-v2-section="aur-venue"`  
**Min-height:** `700px`  
**Layout:** flex, `alignItems: center`, `justifyContent: center`

#### 5.6.1 Background with Parallax
Fallback image: `https://images.unsplash.com/photo-1578774295889-02bc12c28e3a` (Italian villa)  
Overlay: `rgba(4,8,8,0.56)` — moderate dark overlay, lighter than other sections to show venue

#### 5.6.2 Centred Glass Panel
The panel is centred using flex on the section (`justifyContent: center`), not absolute positioning:
```css
background: rgba(8,18,14,0.74)
backdropFilter: blur(22px)
border: 1px solid rgba(215,183,119,0.42)
borderRadius: 24px                    /* larger radius than other panels */
boxShadow: 0 40px 100px rgba(0,0,0,0.55)
padding: 52px 56px
maxWidth: 760px
width: calc(100% - 48px)
margin: 80px 24px                     /* keeps breathing room top/bottom */
```

**Panel header (centered):**
- Eyebrow "THE VENUE" — SANS, `0.57rem`, `C.gold`
- Title from `venueTitle` — SERIF, `clamp(2.4rem, 4.5vw, 4rem)`, weight 300, `C.textLight`
- Location from `venueLocation` — SANS, `0.60rem`, letter-spacing `0.18em`, uppercase, `C.gold` at 72%

**38px divider line** centered, `rgba(215,183,119,0.40)`.

**Description paragraph** from `venueDescription` — SANS, `0.88rem`, weight 300, `C.textMuted`, `lineHeight: 1.92`, centered.

#### 5.6.3 Two-Column Feature Grid
```tsx
<div className="aur-venue-feats"
     style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px" }}>
```
Collapses to single column at `≤768px` via `.aur-venue-feats { grid-template-columns: 1fr !important }`.

Each `.aur-venue-feat` row:
```css
display: flex; gap: 14px; align-items: flex-start;
padding: 14px 0;
border-bottom: 1px solid rgba(215,183,119,0.12);
/* last-child: no border */
```

Icon circle: `32×32px`, border `1px solid rgba(215,183,119,0.26)`, `borderRadius: 50%`  
Four features: Ceremony (arch), Cocktail Hour (glass), Reception (notes), Dress Code (tux) — same SVGs as detail cards but at `16×16px`.

**CTA button:** `linear-gradient(135deg, C.goldSoft, C.gold)`, same style as hero CTA.

---

### 5.7 Gallery Section

**HTML ID:** `#aur-gallery`  
**Data attribute:** `data-v2-section="aur-gallery"`  
**Background:** `C.bgDark` with floral texture overlay at `opacity: 0.05`  
**Padding:** `110px 40px 100px`

#### 5.7.1 Editorial Layered Carousel — Full Specification

Container:
```tsx
<div style={{ position: "relative", height: "520px",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
```

The outer container wrapping the gallery uses `padding: 0 80px` to provide space for the protruding side images.

Each image card (370×490px):
```tsx
<div
  className={cls}        // aur-gal-center | aur-gal-left | aur-gal-right | aur-gal-hidden
  style={{ position: "absolute", width: "370px", height: "490px",
           borderRadius: "8px", overflow: "hidden", cursor: "pointer" }}
  onClick={() => setGalleryIndex(i)}
>
```

**Position class calculation:**
```ts
const rawOffset = ((i - galleryIndex) % total + total) % total;
// normalizes to range [0, total-1]

const centeredOffset = rawOffset <= Math.floor(total / 2)
  ? rawOffset          // 0,1,2 for array with 5 items
  : rawOffset - total; // -2,-1 for array with 5 items
// result: centered range [-2,-1, 0, 1, 2] for a 5-image gallery

if (centeredOffset === 0)  cls = "aur-gal-center";
if (centeredOffset === -1) cls = "aur-gal-left";
if (centeredOffset ===  1) cls = "aur-gal-right";
// everything else:         cls = "aur-gal-hidden"
```

**CSS class definitions:**

| Class | transform | z-index | filter | box-shadow |
|---|---|---|---|---|
| `aur-gal-center` | `scale(1) rotate(0deg)` | 10 | `brightness(1)` | `0 40px 80px rgba(0,0,0,0.62)` |
| `aur-gal-left` | `translateX(-58%) scale(0.80) rotate(-5deg)` | 5 | `brightness(0.60)` | `0 20px 48px rgba(0,0,0,0.42)` |
| `aur-gal-right` | `translateX(58%) scale(0.80) rotate(5deg)` | 5 | `brightness(0.60)` | `0 20px 48px rgba(0,0,0,0.42)` |
| `aur-gal-hidden` | `scale(0.65)` | — | — | — |

All classes share: `transition: all 0.55s cubic-bezier(0.25,0.46,0.45,0.94)`

The result: center image at full scale and brightness, side images pulled 58% off-center, scaled to 80%, darkened to 60% brightness, and tilted ±5 degrees. This creates the editorial "stacked" depth illusion.

**Arrow buttons (`.aur-gal-arrow`):**
```css
width: 52px; height: 52px; border-radius: 50%;
border: 1px solid rgba(215,183,119,0.38);
background: rgba(8,18,14,0.55);
color: C.gold;
backdrop-filter: blur(8px);
```
Hover:
```css
border-color: C.gold;
background: rgba(8,18,14,0.88);
box-shadow: 0 0 28px rgba(215,183,119,0.38);
```
Arrows use 16×16px SVGs with chevron paths.

**Label:** "DRAG OR SCROLL TO EXPLORE" — SANS, `0.49rem`, `letter-spacing: 0.28em`, uppercase, `C.textMuted` at 58% opacity. (Label only; actual drag is not implemented — it's decorative copy per spec.)

**Dot indicators:**
```tsx
<button style={{
  width: i === galleryIndex ? "20px" : "6px",  // active dot expands to pill
  height: "6px",
  borderRadius: "3px",
  background: i === galleryIndex ? C.gold : "rgba(215,183,119,0.26)",
  transition: "all 0.3s ease",
}} />
```

**Fallback images (5 Unsplash wedding URLs):**
```
photo-1465495976277  — wedding rings
photo-1519741497674  — couple ceremony
photo-1511285560929  — wedding reception
photo-1507504031003  — bouquet
photo-1606216794074  — vows
```
Used when `cfg.photos.galleryImages` is empty.

**Navigation functions:**
```ts
const galleryPrev = useCallback(() =>
  setGalleryIndex(i => (i - 1 + allGalleryImages.length) % allGalleryImages.length),
  [allGalleryImages.length]
);
const galleryNext = useCallback(() =>
  setGalleryIndex(i => (i + 1) % allGalleryImages.length),
  [allGalleryImages.length]
);
```
Wrapped in `useCallback` with `allGalleryImages.length` dependency to prevent re-creation on every render.

---

### 5.8 RSVP Section

**HTML ID:** `#aur-rsvp`  
**Data attribute:** `data-v2-section="aur-rsvp"`  
**Min-height:** `100vh`  
**Section entrance:** `rsvpAnim` (fade-in — no translate)

#### 5.8.1 Background
Full-screen parallax background with `factor=0.15` (gentler than other sections).  
Fallback image: `https://images.unsplash.com/photo-1519741497674-611481863552` (ceremony)

**Left-weighted overlay:**
```css
background: linear-gradient(100deg,
  rgba(4,8,8,0.76) 0%,
  rgba(4,8,8,0.65) 52%,
  rgba(4,8,8,0.45) 100%
);
```

#### 5.8.2 Two-Column Grid Layout
```tsx
<div className="aur-rsvp-cols"
     style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px",
              maxWidth: "1100px", width: "calc(100% - 48px)",
              margin: "0 auto", padding: "100px 0",
              alignItems: "center" }}>
```
At `≤900px`: `grid-template-columns: 1fr` (single column), left text column hidden (`.aur-rsvp-left { display: none !important }`).

**Left column — text:**
- Envelope SVG icon (`26×20px`) — gold stroke, rectangular envelope with flap `V`
- `<h2>` "RSVP" — SERIF, `clamp(4.5rem, 9vw, 9rem)`, weight 300, `C.goldSoft` — this is the largest text in the entire template
- Gold divider (22px line + diamond)
- Deadline from `cfg.rsvp.description` first line — SERIF, `clamp(1rem, 2vw, 1.4rem)`, italic, `C.ivoryMuted`
- Note from `rsvpNote` — SANS, `0.88rem`, weight 300, `C.textMuted`, `lineHeight: 1.88`

**Right column — glass form panel:**
```css
background: rgba(8,18,14,0.74)
backdropFilter: blur(22px)
border: 1px solid rgba(215,183,119,0.38)
borderRadius: 16px
boxShadow: 0 32px 80px rgba(0,0,0,0.55)
padding: 44px 40px
```

#### 5.8.3 RSVP Form — Exact Field Specification

**The RSVP submission logic was intentionally preserved unchanged.** Only visual styling was updated.

Form setup:
```ts
const form = useForm<InsertRsvp>({
  resolver: zodResolver(insertRsvpSchema),
  defaultValues: {
    templateId: templateId || "",
    firstName: "", lastName: "", email: "",
    guestEmail: "", guestCount: "1", guestNames: "",
    attendance: "attending", attending: true, guests: 1,
  },
});
```

Mutation:
```ts
const rsvpMutation = useMutation({
  mutationFn: async (data: InsertRsvp) => {
    const endpoint = templateId
      ? `/api/templates/${templateId}/rsvp`
      : "/api/rsvp";
    const res = await apiRequest("POST", endpoint, data);
    return res.json();
  },
  onSuccess: () => { setRsvpSuccess(true); form.reset(); },
});
```

Submit handler:
```ts
const onSubmit = (data: InsertRsvp) => {
  rsvpMutation.mutate({
    ...data,
    templateId: templateId || data.templateId,
    guestEmail: data.email,
    attending:  data.attendance === "attending",
    guests:     parseInt(data.guestCount as string, 10),
  });
};
```

**Field 1 — Full Name:**  
Two-column sub-grid (`1fr 1fr`, gap `10px`)  
`firstName` input + `lastName` input  
Inline error messages from `form.formState.errors.*`

**Field 2 — Attendance radio buttons:**  
Two-column sub-grid, options: `"attending"` / `"not-attending"`  
Custom radio UI (hidden `<input type="radio">`, custom ring + dot):
```
selected border: C.gold
selected background: rgba(215,183,119,0.09)
selected text: C.gold
unselected border: rgba(215,183,119,0.20)
unselected text: C.textMuted
```
Dot: `7px` filled `C.gold` circle inside `14px` outer ring.

**Field 3 — Guest count select:**  
Native `<select>` with options from `cfg.rsvp.guestOptions` (1–4 guests)  
`option` bg set to `#081212` to match dark theme

**Field 4 — Dietary textarea:**  
`rows=3`, `resize: vertical`, `lineHeight: 1.55`  
Label shows "(OPTIONAL)" in smaller, muted text

**Submit button:**
```tsx
background: rsvpMutation.isPending
  ? "rgba(215,183,119,0.45)"
  : `linear-gradient(135deg, ${C.goldSoft} 0%, ${C.gold} 100%)`
color: C.bgDark
font: SANS, 0.65rem, weight 700, letter-spacing 0.22em, uppercase
```
Right arrow SVG hidden during pending state.

**Input / label helper functions (module-level):**
```ts
function rsvpLabel(sans: string): React.CSSProperties {
  return {
    display: "block",
    fontFamily: sans,
    fontSize: "0.55rem",
    fontWeight: 500,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "#CBBEA8",
    marginBottom: "8px",
  };
}

function rsvpInput(C: Record<keyof typeof C_DEFAULT, string>, sans: string): React.CSSProperties {
  return {
    width: "100%",
    background: "rgba(4,10,8,0.72)",
    border: "1px solid rgba(215,183,119,0.20)",
    borderRadius: "4px",
    padding: "11px 14px",
    fontFamily: sans,
    fontSize: "0.84rem",
    color: C.textLight,
    outline: "none",
    boxSizing: "border-box",
    appearance: "none",
  };
}
```
Note: The type was changed from `typeof C_DEFAULT` to `Record<keyof typeof C_DEFAULT, string>` to match the runtime `C` object type (which accepts runtime string assignments).

**Success state:** Replaces form with `cfg.rsvp.messages.success` in italic gold SERIF.  
**Error state:** Renders `cfg.rsvp.messages.error` in `#EF4444` below the submit button.

---

### 5.9 Footer

**Data attribute:** `data-v2-section="aur-footer"`  
**Background:** `C.bgDeep` = `#0C1412`  
**Border-top:** `1px solid rgba(215,183,119,0.10)`  
**Padding:** `80px 40px 48px`

Content (centered):
1. Small leaf SVG mark (same as nav, opacity 0.38)
2. Couple names — SERIF, `clamp(2rem, 5vw, 3.6rem)`, weight 300, `C.gold`; separator as italic at 68% opacity
3. Tagline from `footerTagline` — SANS, `0.56rem`, letter-spacing `0.28em`, uppercase, `C.textMuted` at 72%
4. 44px gold divider line (opacity 0.26)
5. Optional social links (Instagram / Facebook / Email) if configured
6. Copyright line — `© YEAR Groom & Bride. All rights reserved.` — `0.56rem`, `C.textMuted` at 35%

---

## 6. Scoped CSS — All Classes and Keyframes

### 6.1 Keyframes (in `<style>` block)
| Name | Animation | Notes |
|---|---|---|
| `aur-fade-in` | opacity 0→1 | Used by RSVP, Footer sections |
| `aur-fade-up` | opacity 0 + translateY(36px) → normal | Used by most sections |
| `aur-hero-scale` | scale(1.04)→scale(1) | Hero background Ken Burns |
| `aur-hero-content` | opacity 0 + translateY(28px) → normal | Hero text block entry |
| `aur-countdown-slide` | opacity 0 + translateX(44px) → normal | Countdown card slide-in from right |
| `aur-scroll-bob` | translateY(0) → translateY(9px) → back | Scroll indicator bob |
| `aur-panel-reveal` | opacity 0 + translateY(36px) + blur(10px) → normal | Story glass panel three-way reveal |

### 6.2 Utility classes
| Class | Purpose |
|---|---|
| `.aur-nav-link` | Nav anchor styling, `0.62rem`, hover color transition |
| `.aur-story-panel` | Attaches `aur-panel-reveal` animation |
| `.aur-detail-card` | Hover lift/glow transition |
| `.aur-gal-center` | Gallery center image: full scale, z-index 10 |
| `.aur-gal-left` | Gallery left image: translateX(-58%) scale(0.80) rotate(-5deg) |
| `.aur-gal-right` | Gallery right image: translateX(58%) scale(0.80) rotate(5deg) |
| `.aur-gal-hidden` | Gallery off-screen images: opacity 0, scale 0.65 |
| `.aur-gal-arrow` | Gallery arrow button circular glass style |
| `.aur-venue-feat` | Venue feature row with bottom border |
| `.aur-input:focus` | Gold focus ring on RSVP inputs |
| `.aur-ms-left` | Milestone card positioned left of route |
| `.aur-ms-right` | Milestone card positioned right of route |
| `.aur-ms-rail` | SVG route container, centered at 50% |
| `.aur-hamburger` | Mobile hamburger (display:none on desktop) |
| `.aur-nav-desktop` | Desktop nav links (display:none on mobile) |
| `.aur-rsvp-cols` | RSVP two-column grid |
| `.aur-rsvp-left` | RSVP left text column |
| `.aur-details-grid` | Details 4-column card grid |
| `.aur-venue-feats` | Venue 2-column feature grid |
| `.aur-hero-names` | Hero names h1 with responsive font override |
| `.aur-countdown-card` | Countdown card with responsive position override |

### 6.3 Responsive breakpoints
| Breakpoint | Changes |
|---|---|
| `≤860px` | Hamburger shown, desktop nav hidden |
| `≤900px` | RSVP collapses to 1 column, left text column hidden |
| `≤768px` | Details grid → 2 columns; milestones → single column; venue feats → 1 col |
| `≤520px` | Details grid → 1 column; hero names shrink; countdown card repositioned; gallery side images hidden |
| `prefers-reduced-motion` | All animations and transitions disabled globally |

---

## 7. Builder V2 Support

### 7.1 Data attribute schema
Every meaningful element carries `data-v2-section`, `data-v2-element`, and `data-v2-type`:

| Attribute | Values used | Meaning |
|---|---|---|
| `data-v2-section` | `aur-nav`, `aur-hero`, `aur-story`, `aur-roadmap`, `aur-details`, `aur-venue`, `aur-gallery`, `aur-rsvp`, `aur-footer` | Section container |
| `data-v2-element` | `aur-nav-brand`, `aur-hero-intro`, `aur-hero-names`, `aur-hero-date`, `aur-hero-location`, `aur-hero-cta`, `aur-hero-countdown`, `aur-story-panel`, `aur-story-heading`, `aur-story-body`, `aur-story-cta`, `aur-roadmap-heading`, `aur-details-title`, `aur-detail-card-{0–3}`, `aur-venue-panel`, `aur-venue-title`, `aur-venue-location`, `aur-venue-desc`, `aur-venue-cta`, `aur-gallery-title`, `aur-rsvp-heading`, `aur-rsvp-deadline`, `aur-rsvp-note`, `aur-footer-tagline` | Specific editable element |
| `data-v2-type` | `text`, `textarea`, `image` | Editor widget type hint |

### 7.2 Section visibility
```ts
const showHero    = cfg.sections?.hero?.enabled     !== false;
const showStory   = (cfg.sections as Record<...>)?.story?.enabled   !== false;
const showRoadmap = cfg.sections?.timeline?.enabled !== false;
const showDetails = cfg.sections?.locations?.enabled !== false;
const showVenue   = (cfg.sections as Record<...>)?.venue?.enabled   !== false;
const showGallery = cfg.sections?.photos?.enabled   !== false;
const showRsvp    = cfg.sections?.rsvp?.enabled     !== false;
```
Sections not in base `WeddingConfig.sections` type (story, venue) use type assertion to access dynamically.

### 7.3 `builderMode` prop effects
| Behaviour | Normal | builderMode=true |
|---|---|---|
| Navbar position | `fixed` | `sticky` |
| Animations | IntersectionObserver | All at final state (active=true immediately) |
| Scroll progress | Tracks scroll | `progress = 1` (route fully drawn) |
| Milestones | Sequential reveal | All visible immediately |
| Parallax | Active | Disabled (offset stays 0) |
| Scroll bob | Animates | — |

---

## 8. `config.ts` Changes

### 8.1 Theme colors
```ts
// BEFORE
primary: "#C4A97D",
secondary: "#1C1917",
accent: "#C4A97D",
background: "#FAF8F4",
textColor: "#44403C",

// AFTER
primary: "#D7B777",
secondary: "#0C1412",
accent: "#D7B777",
background: "#081212",
textColor: "#FFF7EA",
```

### 8.2 Body font
```ts
// BEFORE
body: "Raleway, Inter, sans-serif",

// AFTER
body: "Montserrat, Inter, sans-serif",
```

### 8.3 `AureliaExtendedConfig` interface additions
Three new optional fields added:
```ts
rsvpBgImage?: string;    // Custom background image URL for RSVP section
rsvpNote?: string;       // Short message below deadline in RSVP left column
venueLocation?: string;  // Location line below venue title (e.g. "Ravello, Amalfi Coast")
```
These fields are read from the database JSONB config and exposed via the `ext` cast:
```ts
const ext = cfg as unknown as AureliaExtendedConfig & WeddingConfig & Record<string, unknown>;
```

---

## 9. TypeScript Fixes Applied During Build

Three categories of TS errors were encountered and resolved:

### 9.1 `C_DEFAULT` literal type constraint
**Error:** `Type 'string' is not assignable to type '"#D7B777"'`  
**Cause:** `as const` on `C_DEFAULT` makes all values literal types. Using `const C: typeof C_DEFAULT` then assigning `colors.primary ?? C_DEFAULT.gold` (which returns `string`) fails.  
**Fix:** Change type annotation to `Record<keyof typeof C_DEFAULT, string>` — accepts `string` while enforcing the correct keys.

### 9.2 `unknown` in JSX short-circuit
**Error:** `Type 'unknown' is not assignable to type 'ReactNode'` at milestone image check  
**Cause:** `(m as Record<string, unknown>).image && <JSX>` — TypeScript infers the left operand as `unknown`, which can't be a ReactNode.  
**Fix:** Changed to `!!(m as Record<string, unknown>).image && <JSX>` — double negation coerces to `boolean`, which is valid in JSX short-circuit.

### 9.3 Helper function parameter type
**Error:** `Argument of type 'Record<...string>' is not assignable to parameter of type '{readonly bgDark: "#081212"; ...}'`  
**Cause:** `rsvpInput(C, SANS)` passed the mutable `Record` `C` to a function typed as `(C: typeof C_DEFAULT)`.  
**Fix:** Changed function signature to `(C: Record<keyof typeof C_DEFAULT, string>)` to match the calling type.

---

## 10. File Statistics

| Metric | Value |
|---|---|
| Total lines | 1,617 |
| Component lines (hooks + JSX) | ~1,540 |
| Helper function lines (AureliaFonts, rsvpLabel, rsvpInput, RSVP_ERR) | ~50 |
| `<style>` block lines | ~100 |
| TypeScript errors | 0 |
| ESLint-style issues | 0 (all `useCallback` deps explicit) |
| Global style pollution | None (all styles in `.aur-*` namespace or inline) |
| External dependencies used | react-hook-form, @hookform/resolvers/zod, @tanstack/react-query, @shared/schema |

---

## 11. Content Defaults (when no DB config provided)

| Field | Default value |
|---|---|
| Groom name | Matteo |
| Bride name | Sophia |
| Wedding date | 2026-09-20T17:00:00 |
| Display date | 20 • 09 • 2026 |
| Hero location | Amalfi Coast, Italy |
| Story heading | Our Love Story |
| Story body | "We crossed paths on a warm summer evening in Rome…" |
| Story CTA | READ OUR STORY |
| Roadmap heading | The Road That Led Us Here |
| Venue title | Villa Cimbrone |
| Venue location | Ravello, Amalfi Coast |
| Venue description | "A timeless Italian villa perched on the clifftops…" |
| Venue CTA | EXPLORE THE VENUE |
| Gallery title | OUR MOMENTS |
| RSVP note | "We can't wait to celebrate with you…" |
| Footer tagline | FOREVER BEGINS HERE |
| Section separator | & |

Timeline default events (4):
1. **2020** — First Meeting — "A chance encounter in Rome that changed everything"
2. **2021** — First Trip Together — "Wandering the streets of Positano hand in hand"
3. **2023** — The Proposal — "A sunset over the Amalfi Coast — she said yes"
4. **2026** — Forever Begins — "Our greatest adventure starts here"
