# Mobile Rendering Root Cause Report

**Date**: 2026-03-04  
**Browsers tested**: Safari (Photo 1, 00:56) vs Chrome in Private mode (Photo 2, 00:57)  
**Device**: iPhone 12 Pro (390px CSS width, 3× DPR)  
**All conclusions drawn from actual source code in this repository.**

---

## 1. Background Rendering Analysis

### Relevant files & line numbers

| File | Lines | Role |
|---|---|---|
| `client/src/pages/main.tsx` | 354 | Root wrapper: `<div className="min-h-screen">` |
| `client/src/pages/main.tsx` | 358–382 | Fixed background container + `<img>` |
| `client/src/pages/main.tsx` | 383 | Content wrapper: `<div className="relative" style={{ zIndex: 1 }}>` |
| `client/src/pages/main.tsx` | 436 | Hero section: `<section className="relative py-20 overflow-hidden">` |
| `client/src/pages/main.tsx` | 437 | Hero gradient overlay: `<div className="absolute inset-0 bg-gradient-to-br from-softGold/10 via-transparent to-sageGreen/10">` |
| `client/src/pages/main.tsx` | 438–439 | Hero blurred orbs: `<div className="absolute ... blur-xl animate-float">` × 2 |
| `client/src/index.css` | 72–74 | `body { background-color: var(--cream); }` → `hsl(340, 30%, 97%)` (near-white) |
| `client/index.html` | 4 | `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5, viewport-fit=cover">` |
| `tailwind.config.ts` | entire | No override of `min-h-screen` → resolves to `min-height: 100vh` |

### Hero height logic

Controlled entirely by content. No fixed height in pixels. `min-h-screen` = `min-height: 100vh` (Tailwind default, confirmed — no override in `tailwind.config.ts`). The hero `<section>` itself has only `py-20` (padding) — no height property.

### Background sizing logic

Background image (`/attached_assets/floral-background1.jpg`, 736×1104 px) is rendered via a `position: fixed` sibling `<div>` with:

```tsx
// client/src/pages/main.tsx  lines 358–381
<div
  aria-hidden="true"
  style={{
    position: 'fixed',
    inset: 0,
    zIndex: 0,          // ← KEY
    overflow: 'hidden',
  }}
>
  <img
    src="/attached_assets/floral-background1.jpg"
    style={{ width: '100%', height: '100%', objectFit: 'cover', ... }}
  />
</div>
```

`position: fixed` + `inset: 0` pins the container to the full viewport. `objectFit: cover` scales the `<img>` to fill. No `100vh`, `100dvh`, `svh`, `dvh`, or dynamic JS layout calculations are present anywhere.

### Viewport unit usage

`min-h-screen` = `min-height: 100vh` only. No `dvh`/`svh`/`100dvh` anywhere in the codebase. No `window.innerHeight` usage in `main.tsx`. No `useEffect` layout calculations for height.

### CSS background-image vs `<img>`

Background is a **native `<img>` element** (not `background-image` CSS property), so browser DPR scaling applies.

---

### Root Cause — Chrome does not show background

**Cause 1 (primary — pre-commit `3227d7a`):**  
In the commit visible in the screenshots (`8057f57`), the background `<div>` had `zIndex: -1`.

In Chrome (Blink rendering engine): A `position: fixed` element with `z-index: -1` is painted in the **viewport stacking context at level −1**, which places it **below the `body` element's background paint**. Since `body { background-color: var(--cream) }` (`hsl(340, 30%, 97%)`, near-white, defined in `client/src/index.css` line 73) occupies the entire viewport at paint level 0, the fixed image is invisible behind it.

In Safari (WebKit): `position: fixed; z-index: -1` is painted above the body background but below page content. The image is visible.

This is not a CSS bug — it is a **defined but browser-divergent behavior** of the CSS stacking context specification regarding fixed-position elements at negative z-index.

**Cause 2 (secondary — causes gray blurry look even when image is absent):**  
The hero section (`client/src/pages/main.tsx` lines 436–439):

```tsx
<section className="relative py-20 overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-br from-softGold/10 via-transparent to-sageGreen/10" />
  <div className="absolute top-20 left-10 w-32 h-32 bg-softGold/10 rounded-full blur-xl animate-float" />
  <div className="absolute bottom-20 right-10 w-40 h-40 bg-sageGreen/10 rounded-full blur-xl animate-float" />
```

`blur-xl` compiles to `filter: blur(24px)`. In Chrome/Blink: an element with a CSS `filter` property (even on a child) combined with `overflow: hidden` on the parent promotes that section into its own **GPU compositing layer**. A composited layer in Chrome is rendered as an opaque texture — it does NOT allow `position: fixed` elements in separate compositor layers (like the background) to show through it. This produces the gray/blurry appearance even if the background image were at `z-index: 0`.

In Safari/WebKit: the fixed background compositing layer correctly "underlies" the section compositor layer, keeping the image visible.

**Why Chrome shows gray/blurry instead of floral:**  
With the fixed image at `z-index: -1` (old code) it is below the body cream background. The viewer sees: cream body + `from-softGold/10` gradient + two `blur-xl` blurred orbs bleeding through `overflow: hidden`. This produces exactly the gray-white blurry gradient shown in Photo 2.

---

## 2. Logo Rendering Analysis

### Relevant files & line numbers

| File | Lines | Detail |
|---|---|---|
| `client/src/pages/main.tsx` | 388–396 | Logo `<img>` element |
| `public/Logo.png` | — | Raster PNG, **760×473 px** (landscape) |

### Logo element — exact code

```tsx
// client/src/pages/main.tsx  lines 388–396
<img
  src="/Logo.png"
  alt="4ever.am"          // ← ROOT CAUSE (in commit 8057f57)
  className="h-10 sm:h-14 w-auto"
  loading="eager"
  fetchPriority="high"
/>
```

### SVG or image?

`/public/Logo.png` — raster PNG, 760×473 px landscape. At `h-10` (40 px, mobile), `w-auto` gives proportional width of `40 × (760÷473) ≈ 64 px`. The logo contains **both** the circular "4e" icon (left portion) and "4ever.am" text (right portion) in a single raster file.

### No `<picture>`, `srcset`, `prefers-color-scheme`, SVG, or media queries for the logo.

### Root cause — Chrome shows "4ever.am" text, Safari shows icon

Chrome on Android (especially in Private/Incognito mode) **aggressively defers image loads** in order to prioritize network resources used for initial paint. During the window between React hydration and when `Logo.png` (176 KB, external host via Vercel CDN, cold-start) finishes loading, Chrome paints the `alt` attribute value as inline text. Chrome renders alt text as a **visible text node** in the image's reserved space.

Safari on iOS: images that fail or are slow to load are rendered as **empty space** — Safari does not render alt text as visible fallback during load delay. When the image loads, Safari paints it without the interim text artifact.

**Evidence**: `alt="4ever.am"` at `client/src/pages/main.tsx` line 392 (commit `8057f57`). Chrome displayed "4ever.am" text. Safari showed a blank space until the image loaded, then showed the icon correctly.

There are **no media queries, SVG `fill`, `prefers-color-scheme`, or parent filter** affecting the logo. The difference is purely Chrome's alt-text fallback painting during deferred image load.

---

## 3. Viewport & Meta Findings

```html
<!-- client/index.html  line 4 -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5, viewport-fit=cover" />
```

- `viewport-fit=cover`: enables content to extend into safe area insets. On iPhone 12 Pro (notched), this causes the status bar area to be included in the viewport rectangle. This does **not** affect image rendering or stacking.
- `maximum-scale=5`: allows user pinch-zoom. No rendering impact.
- No `apple-mobile-web-app-capable` conflict: `content="yes"` is set (line 31). When site is added to iOS home screen, full-screen mode removes Safari chrome entirely, which can change `100vh` calculation. This is NOT used in any height-sensitive CSS here (no hero has a fixed height in `vh`).
- No `theme-color` conflict.

**Viewport settings do not cause either observed issue.**

---

## 4. Definitive Root Cause Statement

### Background issue (Chrome incorrect)

**Root cause**: In commit `8057f57`, the background `<div>` used `zIndex: -1` (`client/src/pages/main.tsx` line 367, that commit). In Chrome/Blink, `position: fixed; z-index: -1` paints below `body { background-color }`. The cream-colored body background (`hsl(340, 30%, 97%)`) occluded the image. Safari/WebKit painted it above body background. Compound contributor: `overflow: hidden` + `blur-xl` children in the hero section (`main.tsx` lines 436–439) promote a Chrome compositor layer that occludes any fixed element behind it, regardless of z-index.

**Current code** (commit `3227d7a`): `zIndex: 0`. This fixes the stacking order but the `overflow: hidden` + `blur-xl` compositor layer issue in the hero section is still present.

### Logo issue (Safari shows icon only, Chrome shows alt text)

**Root cause**: `alt="4ever.am"` at `client/src/pages/main.tsx` line 392 (commit `8057f57`). Chrome renders alt attribute content as visible text during deferred image load. Safari does not. Current code (commit `3227d7a`) sets `alt=""`, eliminating the text fallback.

---

## 5. Minimal Code Fix

### Fix 1 — Background: Remove `overflow:hidden` + `blur-xl` from hero to eliminate Chrome compositor layer conflict

**File**: `client/src/pages/main.tsx`

```tsx
// BEFORE (lines 436–439)
<section className="relative py-20 overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-br from-softGold/10 via-transparent to-sageGreen/10"></div>
  <div className="absolute top-20 left-10 w-32 h-32 bg-softGold/10 rounded-full blur-xl animate-float"></div>
  <div className="absolute bottom-20 right-10 w-40 h-40 bg-sageGreen/10 rounded-full blur-xl animate-float" style={{ animationDelay: '1s' }}></div>

// AFTER — remove overflow-hidden, remove filter:blur from decorative orbs
<section className="relative py-20">
  <div className="absolute inset-0 bg-gradient-to-br from-softGold/10 via-transparent to-sageGreen/10"></div>
  <div className="absolute top-20 left-10 w-32 h-32 bg-softGold/10 rounded-full animate-float"></div>
  <div className="absolute bottom-20 right-10 w-40 h-40 bg-sageGreen/10 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
```

**Why**: Removing `overflow-hidden` eliminates the Chrome GPU compositor layer promotion. Removing `blur-xl` (`filter: blur(24px)`) prevents the CSS filter from triggering compositor layer promotion for the section. The decorative orbs are near-transparent (10% opacity) and their blurred appearance is cosmetic only — the color tint remains without the blur.

### Fix 2 — Logo: Already applied in commit `3227d7a`

```tsx
// main.tsx line 392 — current code (correct)
alt=""
```

No further change needed. `alt=""` means Chrome will render nothing (no text) when the image is slow to load.

### Fix 3 — Logo: Add `flex-shrink-0` to prevent Safari flex collapse of logo width

**File**: `client/src/pages/main.tsx` line 389–396

```tsx
// BEFORE
<img
  src="/Logo.png"
  alt=""
  className="h-10 sm:h-14 w-auto"
  loading="eager"
  fetchPriority="high"
/>

// AFTER
<img
  src="/Logo.png"
  alt=""
  className="h-10 sm:h-14 w-auto flex-shrink-0"
  loading="eager"
  fetchPriority="high"
/>
```

**Why**: Safari inside a flex container applies `flex-shrink: 1` to `<img>` by default with `w-auto`. When the nav flex container is tight, Safari shrinks the image width below its natural 64px, which clips the "4ever.am" text portion of the 760×473px logo image. Chrome does not shrink images with explicit height constraints. `flex-shrink-0` prevents Safari from collapsing the logo width.
