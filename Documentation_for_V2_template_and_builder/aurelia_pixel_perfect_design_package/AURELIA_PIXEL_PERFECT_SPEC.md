# Aurelia V2 Template — Pixel-Perfect Design Specification

## Purpose

This package contains high-resolution visual references and a detailed implementation specification for the **Aurelia** V2 wedding template.

Aurelia must be a **cinematic, immersive, image-heavy, animation-first** template. It should not look like a standard static wedding page. The main design principle is:

> Large emotional background imagery + layered foreground content + elegant scroll motion + premium editorial typography.

The template must work inside **Builder V2**, and Builder V2 should be adjusted only where needed to make all V2 templates more customizable in a reusable, manifest-driven way.

---

## Included reference images

| File | Purpose | Resolution |
|---|---:|---:|
| `romantic_lakeside_wedding_celebration_design.png` | Visual reference | 1672 × 941 |
| `our_journey_through_timeless_love.png` | Visual reference | 1122 × 1402 |
| `romantic_lakeside_love_story_reveal.png` | Visual reference | 1122 × 1402 |
| `elegant_wedding_details_infographic_design.png` | Visual reference | 1448 × 1086 |
| `luxury_lakeside_villa_wedding_venue.png` | Visual reference | 1672 × 941 |
| `romantic_wedding_gallery_interface.png` | Visual reference | 1672 × 941 |
| `elegant_wedding_rsvp_under_a_sunset_sky.png` | Visual reference | 1122 × 1402 |
| `elegant_animation_and_interaction_showcase.png` | Visual reference | 1672 × 941 |
| `elegant_wedding_palette_design_showcase.png` | Visual reference | 1672 × 941 |
| `elegant_wedding_ui_feature_list.png` | Visual reference | 941 × 1672 |

---

# 1. Global Design Direction

## Visual style

Aurelia should feel:

- cinematic
- luxury editorial
- immersive
- romantic
- high-contrast
- image-led
- animated but refined
- premium, not playful

Avoid:

- flat beige placeholder blocks
- generic section stacks
- emoji-style icons
- empty gallery states as the final design
- plain dark sections without photography
- simple side-by-side layouts where the reference expects layered content

## Color system

Default palette should be close to:

```ts
const AURELIA_DEFAULT_COLORS = {
  backgroundDark: "#081212",
  backgroundDeep: "#0C1412",
  panelDark: "rgba(8, 14, 12, 0.72)",
  panelGlass: "rgba(12, 18, 15, 0.62)",
  gold: "#D7B777",
  goldSoft: "#F1D8A1",
  ivory: "#F7F0E3",
  ivoryMuted: "#D6C8B0",
  textLight: "#FFF7EA",
  textMuted: "#CBBEA8",
  borderGold: "rgba(215, 183, 119, 0.55)",
  shadowDark: "rgba(0, 0, 0, 0.45)",
  overlayDark: "rgba(0, 0, 0, 0.46)"
};
```

The design must support multiple palettes, but palette changes must preserve contrast.

Required palette roles for Builder V2 theme mapping:

```ts
theme.colors.primary
theme.colors.secondary
theme.colors.background
theme.colors.textColor
theme.colors.lightText
theme.colors.darkText
theme.colors.mutedText
theme.colors.navBackground
theme.colors.navText
theme.colors.buttonBg
theme.colors.buttonText
theme.colors.panelBackground
theme.colors.panelText
theme.colors.panelBorder
theme.colors.sectionDarkBg
theme.colors.sectionDarkText
theme.colors.sectionLightBg
theme.colors.sectionLightText
theme.colors.overlay
theme.colors.inputBackground
theme.colors.inputText
theme.colors.inputBorder
theme.colors.accentGlow
```

Missing values must fall back safely.

## Typography

Use a premium serif for hero and major headings, and a refined sans-serif for labels/body.

Recommended:

```ts
headingFont: "Cormorant Garamond", "Playfair Display", "Georgia", serif
bodyFont: "Montserrat", "Inter", "system-ui", sans-serif
scriptFont: "Cormorant Garamond Italic", "Playfair Display", serif
```

Typography rules:

- Hero names: very large serif, 88–132px desktop, 46–64px mobile.
- Section titles: 48–76px desktop, 34–44px mobile.
- Eyebrows: uppercase, letter-spacing 0.24em–0.36em.
- Body: readable, 15–18px desktop, line-height 1.7–1.9.
- Buttons: uppercase, 0.18em–0.26em letter spacing.

---

# 2. Section-by-Section Pixel-Perfect Specification

## 2.1 Hero — `romantic_lakeside_wedding_celebration_design.png`

### Goal

The hero must be the strongest first impression: full-screen cinematic wedding image, couple centered/left, lake/mountain background, dark overlay, large names, CTA, countdown glass card.

### Layout

- Full viewport height: `min-height: 100vh`.
- Background image covers entire section.
- Dark radial/linear overlay for readability.
- Header overlays the top, transparent or very dark translucent.
- Brand on top-left: `AURELIA` with small leaf mark.
- Nav top-center/right.
- Menu button top-right with gold outline.
- Main hero content centered horizontally but visually weighted slightly left.
- Countdown glass card anchored bottom-right on desktop.

### Required elements

- Brand/monogram
- Nav links
- Intro line: “WE’RE GETTING MARRIED”
- Couple names
- Decorative divider
- Date and location
- CTA button
- Countdown card
- Scroll indicator

### Key styling

```css
.hero {
  min-height: 100vh;
  position: relative;
  background-size: cover;
  background-position: center;
  overflow: hidden;
}

.hero::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 42% 50%, rgba(0,0,0,.10), rgba(0,0,0,.68)),
    linear-gradient(90deg, rgba(0,0,0,.62), rgba(0,0,0,.18), rgba(0,0,0,.55));
}

.hero-title {
  font-size: clamp(4rem, 8vw, 8.8rem);
  letter-spacing: .08em;
  color: var(--gold-soft);
  text-shadow: 0 20px 60px rgba(0,0,0,.55);
}

.hero-countdown-card {
  backdrop-filter: blur(18px);
  background: rgba(10, 16, 13, .58);
  border: 1px solid rgba(215, 183, 119, .62);
  border-radius: 18px;
  box-shadow: 0 26px 70px rgba(0,0,0,.55);
}
```

### Animation

- Hero background: subtle scale from `1.04` to `1` on load.
- Hero content: fade-up staggered.
- Countdown card: fade-in from right.
- Scroll arrow: slow elegant bob.
- Optional parallax: background moves slower than scroll.

### Builder-editable fields

- Background image
- Brand text
- Nav labels and targets
- Intro line
- Bride/groom or couple names
- Date
- Location
- CTA label/link
- Countdown visibility
- Countdown date
- Scroll indicator visibility/style
- Overlay strength
- Hero alignment

---

## 2.2 Journey / Roadmap — `our_journey_through_timeless_love.png`

### Goal

This is the signature interaction. It must look like a cinematic route through a lakeside/mountain map, not a simple timeline.

### Layout

- Full-screen or tall section: `min-height: 140vh`.
- Background: aerial/lakeside route photo, dark overlay.
- Road/route line curves vertically through the section.
- Milestone cards alternate left/right.
- Each milestone has image thumbnail + text card.
- A small elegant car SVG travels along the glowing route while scrolling.

### Required elements

- Section number/eyebrow
- Title: “Our Journey”
- Subtitle paragraph
- Curved glowing route line
- Moving car SVG / route marker
- Milestones:
  - title
  - date
  - location
  - description
  - image thumbnail
- Closing line

### Animation

- Scroll progress controls route line draw.
- Car/marker travels along route according to scroll progress.
- Milestone cards reveal one by one.
- Route glow intensifies near active milestone.
- Reduced-motion: route fully visible, no moving car.

### Implementation notes

The current simple vertical line is not enough. Use an SVG path:

```tsx
<svg className="route-svg" viewBox="0 0 300 1200" preserveAspectRatio="none">
  <path ref={{routePathRef}} d="M150 0 C80 180 220 300 150 460 C80 640 220 780 150 1200" />
  <path
    d="same path"
    strokeDasharray={{pathLength}}
    strokeDashoffset={{pathLength * (1 - progress)}}
  />
</svg>
```

The car position should be calculated from `getPointAtLength(progress * pathLength)`.

If path math is too heavy, approximate with CSS transforms, but SVG path is preferred.

### Builder-editable fields

- Background image
- Section title/subtitle
- Milestone array
- Milestone image per item
- Milestone date/title/location/description
- Car/marker style
- Route line color
- Route animation on/off
- Section visibility

---

## 2.3 Story — `romantic_lakeside_love_story_reveal.png`

### Goal

A story section with large emotional background photography and a floating glass content panel.

### Layout

- Full-height or near full-height section.
- Background image fills entire section.
- Couple image visible behind panel.
- Glass panel floats left/bottom-left.
- Text is readable and large.

### Required elements

- Eyebrow: “OUR STORY”
- Large headline
- Decorative divider
- CTA link/button
- Optional pagination indicator `01 — 02 — 03`

### Styling

- Glass panel:
  - dark translucent background
  - blur 18–24px
  - gold border
  - rounded corners
  - soft shadow
- Background image should be warm, cinematic, and not overexposed.

### Animation

- Background subtle parallax.
- Panel fade-up + blur-in.
- CTA hover arrow slide.

### Builder-editable fields

- Background image
- Eyebrow
- Heading
- Paragraph/quote
- CTA label/link
- Pagination visibility
- Panel alignment

---

## 2.4 Wedding Details — `elegant_wedding_details_infographic_design.png`

### Goal

A bright, elegant details section with luxury line icons and structured cards.

### Layout

- Light ivory background.
- Centered title: “THE CELEBRATION”.
- Four cards in one row on desktop.
- Two-by-two on tablet.
- Single column on mobile.
- Thin gold borders.

### Required cards

- Ceremony
- Cocktail Hour
- Reception
- Dress Code

### Styling

- No emoji icons.
- Use line SVG icons in gold.
- Card background slightly translucent ivory.
- Thin dividers.
- Decorative separators.

### Animation

- Cards reveal in staggered fade-up.
- Hover: subtle lift and border glow.

### Builder-editable fields

- Section title/eyebrow
- Cards array
- Icon per card
- Time/title/location/details/link
- Card visibility/order

---

## 2.5 Venue — `luxury_lakeside_villa_wedding_venue.png`

### Goal

A dramatic venue image background with a floating glass panel.

### Layout

- Full-width image background.
- Dark overlay.
- Centered floating glass panel.
- Villa name large.
- Location below.
- Two-column feature grid inside panel.
- CTA button.

### Required elements

- Background venue image
- Venue title
- Venue location
- Ceremony/reception/cocktails/accommodation info
- CTA button

### Styling

- Glass panel dark green/black translucent.
- Rounded corners 24px.
- Gold border.
- Blur.
- Soft glow.
- Line icons.

### Animation

- Background slow parallax.
- Panel scale/fade-in.
- Feature items stagger.

### Builder-editable fields

- Background image
- Venue name/location
- Description
- Feature items
- CTA label/link
- Panel style/alignment

---

## 2.6 Gallery — `romantic_wedding_gallery_interface.png`

### Goal

A layered gallery that feels editorial and cinematic, not a plain grid.

### Layout

- Dark floral/image background.
- Main images overlap in a carousel/stack.
- Center image largest.
- Side images tilted and partially behind.
- Arrow buttons left/right.
- Instruction text: “DRAG OR SCROLL TO EXPLORE”.

### Required elements

- Section number/title
- Decorative divider
- Gallery image stack
- Left/right controls
- Optional drag/scroll hint

### Animation

- Images reveal and slide into layered positions.
- Hover: slight lift/tilt.
- Arrow hover glow.
- Optional scroll-driven horizontal shift.

### Builder-editable fields

- Gallery title/eyebrow
- Images array
- Alt text
- Gallery mode: layered / grid / carousel
- Controls visibility
- Background floral overlay/image

---

## 2.7 RSVP — `elegant_wedding_rsvp_under_a_sunset_sky.png`

### Goal

A cinematic RSVP section with background image and floating form panel.

### Layout

- Full-height background image.
- Left side: large RSVP text, response date, short message.
- Right side: floating glass/dark form panel.
- Form must remain functional.

### Required fields

- Name
- Attendance
- Number attending
- Dietary restrictions
- Submit button

### Styling

- Dark translucent panel.
- Gold/ivory borders.
- Large serif RSVP heading.
- Warm candlelit image background.
- CTA button gold gradient.

### Animation

- Background parallax.
- Left copy fade-up.
- Form panel fade-in from right.
- Input focus gold border.

### Builder-editable fields

- Background image
- RSVP heading/subtext/deadline
- Form labels/placeholders
- Submit button label
- Form panel alignment/style

### Important

Do not modify RSVP submission logic. Only visual/layout wiring unless the V2 template requires safe config mapping.

---

## 2.8 Animation Features — `elegant_animation_and_interaction_showcase.png`

### Goal

Optional feature/showcase section explaining the template’s motion capabilities. This can also be omitted from public template if it is marketing-only, but it is useful as a design reference.

### Layout

- Dark luxury background.
- Six cards.
- Gold icons.
- Header centered.
- Decorative floral corners.

### Cards

- Parallax Backgrounds
- Fade-In Content
- Sticky Panels
- Reveal on Scroll
- Animated Route Line
- Elegant Interactions

### Builder-editable fields

- Section visibility
- Cards array
- Icons
- Text

---

## 2.9 Palette Showcase — `elegant_wedding_palette_design_showcase.png`

### Goal

Reference for Builder V2 palette previews. This should inform the builder palette UI and the template’s color system.

### Palettes

- Forest Gold
- Moonlight Ivory
- Rose Dusk
- Midnight Olive

### Builder V2 implication

The Builder V2 palette picker should be able to show:
- palette label
- mood/category
- swatches
- optional preview thumbnail
- apply button
- selected state

---

## 2.10 UI Feature List — `elegant_wedding_ui_feature_list.png`

### Goal

Reference for a compact feature navigation/marketing sidebar, not necessarily a public section.

Useful for:
- template marketplace preview
- internal QA reference
- builder template preview card

---

# 3. Builder V2 Requirements

Aurelia should not require hardcoded builder changes. However, Builder V2 must support reusable customization capabilities for all V2 templates.

## Required Builder V2 capabilities

### 3.1 Manifest-driven sections

Every V2 template must define:

```ts
sections: V2SectionManifest[]
elements: Record<string, V2ElementManifest>
sectionInspectors?: Record<string, React.ComponentType>
themePalettes?: TemplatePalette[]
colorRoleConfigPaths?: TemplateColorRoleMap
```

### 3.2 Section visibility

All major sections should be hideable:

- hero
- story
- journey
- details
- venue
- gallery
- RSVP
- footer

The left panel should expose eye icons for every section and meaningful element.

Visibility should be stored in config:

```ts
hidden?: {
  sections?: Record<string, boolean>
  elements?: Record<string, boolean>
}
```

Missing means visible.

### 3.3 Element visibility

Meaningful template details must be hideable:

- hero countdown
- CTA button
- scroll indicator
- story CTA
- roadmap thumbnails
- venue CTA
- gallery arrows
- RSVP intro text
- footer note

Do not expose every raw HTML div/span. Expose manifest-defined elements only.

### 3.4 Image controls

Builder V2 must support image upload/select for:

- hero background
- story background
- journey background
- journey milestone thumbnails
- venue background
- gallery images
- RSVP background
- decorative floral overlays if desired

### 3.5 Repeatable array editors

Builder V2 must support add/remove/reorder/edit for:

- roadmap milestones
- wedding detail cards
- gallery images
- venue feature items
- nav items

### 3.6 Style controls

For V2 templates, Builder should support at least:

- palette
- typography
- overlay opacity
- section spacing
- panel opacity/blur
- button style
- border radius
- animation intensity
- section layout variant where relevant

### 3.7 Animation controls

Do not make users write custom animation code. Provide controlled presets:

```ts
animationPreset: "none" | "subtle" | "cinematic" | "dramatic"
parallax: boolean
revealOnScroll: boolean
routeAnimation: boolean
reducedMotionSafe: boolean
```

### 3.8 Builder mode behavior

Animations must not make editing difficult.

In builder mode:

- scroll progress animations can default to final or stable state
- animated route can show fully drawn or previewed
- hover/selection outlines must remain usable
- pointer events must not be blocked by decorative overlays
- hidden items must be restorable from the left panel

### 3.9 Data attributes

Every editable/visible element must have stable IDs:

```tsx
data-v2-section="aur-hero"
data-v2-element="aur-hero-title"
data-v2-type="text"
```

Use prefix `aur-` for all Aurelia-specific IDs.

---

# 4. Aurelia Template Config Shape

Recommended extended config:

```ts
export interface AureliaExtendedConfig extends WeddingConfig {
  aurelia?: {
    hero?: {
      backgroundImage?: string;
      overlayOpacity?: number;
      showCountdown?: boolean;
      showScrollIndicator?: boolean;
      ctaLabel?: string;
      ctaHref?: string;
    };
    story?: {
      backgroundImage?: string;
      heading?: string;
      body?: string;
      ctaLabel?: string;
      ctaHref?: string;
      panelAlign?: "left" | "right";
    };
    journey?: {
      backgroundImage?: string;
      routeStyle?: "curved" | "straight";
      markerStyle?: "car" | "diamond" | "ring";
      milestones?: AureliaMilestone[];
    };
    details?: {
      cards?: AureliaDetailCard[];
    };
    venue?: {
      backgroundImage?: string;
      title?: string;
      location?: string;
      features?: AureliaVenueFeature[];
      ctaLabel?: string;
      ctaHref?: string;
    };
    gallery?: {
      backgroundImage?: string;
      layout?: "layered" | "carousel" | "grid";
      images?: AureliaGalleryImage[];
    };
    rsvp?: {
      backgroundImage?: string;
      heading?: string;
      deadlineText?: string;
      note?: string;
      panelAlign?: "left" | "right";
    };
  };
}
```

---

# 5. Acceptance Criteria

Aurelia is acceptable only when:

- Hero is full-screen and image-led.
- Story is layered over a strong image, not a plain split layout.
- Journey has visible scroll route animation and a moving car/marker.
- Details uses premium SVG line icons, not emoji.
- Venue uses a full image background and floating glass panel.
- Gallery is layered/editorial, not a basic grid.
- RSVP uses image background and floating form panel.
- All sections are editable in Builder V2.
- Key details are hideable/showable.
- Images are uploadable.
- Palettes apply without breaking readability.
- Save Draft, reload, preview/public render work.
- Mobile/tablet remain usable.
- Reduced motion is respected.
- V1 is untouched.

---

# 6. Copilot Implementation Instruction

Use the included images as the visual source of truth. Rebuild Aurelia section-by-section to match the references.

Do not produce a generic dark wedding site. Do not leave placeholders. Do not use flat empty blocks where the design requires image-backed layered composition.

Implementation should be done in passes:

1. Hero pixel-perfect pass
2. Story pixel-perfect pass
3. Journey animation pass
4. Details/venue pass
5. Gallery/RSVP pass
6. Builder V2 customization pass
7. Responsive/QA pass

After each pass, run:

```bash
npx tsc --noEmit
```

and compare against the corresponding reference image.

---

# 7. Scope and Safety

Allowed:

- `client/src/templates/aurelia/*`
- V2 manifest types only if a reusable capability is missing
- V2 builder controls only if needed generically for all V2 templates

Forbidden:

- V1 builder
- V1 templates
- live customer templates
- RSVP backend/submission logic
- auth
- Telegram
- music
- sale wheel
- upload infrastructure
- image editor
- database schema
- unrelated platform code

