/**
 * Florence Eternal — Curated Professional Palettes
 *
 * Defines the color role map (role → config dot-path) and the curated palette
 * list used by the generic Builder V2 palette picker.
 *
 * ── Color role overview ──────────────────────────────────────────────────────
 *   primary         → gold / accent color, button highlights
 *   secondary       → dark backgrounds (hero, nav, countdown, RSVP, footer)
 *   background      → ivory / light section background
 *   lightText       → text on dark sections (hero names, countdown numbers,
 *                     RSVP labels, footer links, wedding details cards)
 *   mutedText       → body text on light sections (story paragraph, venue
 *                     description, journey subtitles)
 *   cardBorder      → details card borders, footer top border
 *   cardBackground  → address card bg, monogram card accent, gallery placeholder
 *   textColor       → manual "Text Color" picker — fallback for mutedText only
 *                     (palettes do not set this; kept for backward compat)
 *
 * ── Adding a palette ──────────────────────────────────────────────────────────
 * Add an entry to FLORENCE_PALETTES. Provide all 7 role keys listed in
 * FLORENCE_COLOR_ROLE_MAP (do NOT set textColor — handled by manual picker).
 * FlorenceTemplate.tsx reads these keys through the fallback-chain C block.
 *
 * ── Architecture note ────────────────────────────────────────────────────────
 * This file is Florence-specific. The generic BuilderRightPanel reads
 * manifest.themePalettes / manifest.colorRoleConfigPaths and never imports
 * from this file directly.
 */

import type { TemplatePalette, TemplateColorRoleMap } from "../../pages/builder-v2/manifest-types";

// ─── Color role → WeddingConfig dot-path mapping ─────────────────────────────
export const FLORENCE_COLOR_ROLE_MAP: TemplateColorRoleMap = {
  primary:        "theme.colors.primary",
  secondary:      "theme.colors.secondary",
  background:     "theme.colors.background",
  lightText:      "theme.colors.lightText",
  mutedText:      "theme.colors.mutedText",
  cardBorder:     "theme.colors.cardBorder",
  cardBackground: "theme.colors.cardBackground",
};

// ─── Curated palettes ─────────────────────────────────────────────────────────
export const FLORENCE_PALETTES: TemplatePalette[] = [

  // ── 1. Botanical Gold ───────────────────────────────────────────────────────
  {
    id:    "botanical-gold",
    label: "Botanical Gold",
    mood:  "botanical",
    colors: {
      primary:        "#CFAF66",  // warm gold
      secondary:      "#28301F",  // deep forest green
      background:     "#F8F4EC",  // parchment ivory
      lightText:      "#F5F1E6",  // warm off-white for dark sections
      mutedText:      "#6D6659",  // warm taupe for light sections
      cardBorder:     "#3E4730",  // olive-tinted border
      cardBackground: "#EDE6DA",  // warm linen card
    },
  },

  // ── 2. Rose Ivory ───────────────────────────────────────────────────────────
  {
    id:    "rose-ivory",
    label: "Rose Ivory",
    mood:  "romantic",
    colors: {
      primary:        "#6F4548",  // dusty rose
      secondary:      "#4A2E30",  // deep wine-rose
      background:     "#FFF7F4",  // warm blush white
      lightText:      "#FAF0EE",  // blush off-white for dark sections
      mutedText:      "#7A6262",  // muted rose-brown for light sections
      cardBorder:     "#C8A5A5",  // soft blush border
      cardBackground: "#F5E5E2",  // blush card
    },
  },

  // ── 3. Classic Noir ─────────────────────────────────────────────────────────
  {
    id:    "classic-noir",
    label: "Classic Noir",
    mood:  "classic",
    colors: {
      primary:        "#C2A15A",  // burnished gold
      secondary:      "#1F1F1D",  // near-black
      background:     "#FAF7F0",  // warm cream
      lightText:      "#F2EDE0",  // warm white for dark sections
      mutedText:      "#706A5E",  // warm grey-brown for light sections
      cardBorder:     "#3A3A36",  // near-black border
      cardBackground: "#EEE8D8",  // warm linen card
    },
  },

  // ── 4. Sage Minimal ─────────────────────────────────────────────────────────
  {
    id:    "sage-minimal",
    label: "Sage Minimal",
    mood:  "minimal",
    colors: {
      primary:        "#B8A77A",  // warm khaki
      secondary:      "#4A5440",  // dark sage
      background:     "#F7F5EF",  // soft linen
      lightText:      "#F2F0E8",  // linen white for dark sections
      mutedText:      "#6D705F",  // sage-tinted muted for light sections
      cardBorder:     "#A8B090",  // sage border
      cardBackground: "#E8E4D8",  // warm linen card
    },
  },

  // ── 5. Champagne Cream ──────────────────────────────────────────────────────
  {
    id:    "champagne-cream",
    label: "Champagne Cream",
    mood:  "warm",
    colors: {
      primary:        "#D6B56D",  // champagne gold
      secondary:      "#6B4E30",  // rich warm brown
      background:     "#FFF9ED",  // champagne white
      lightText:      "#FAF4E0",  // champagne off-white for dark sections
      mutedText:      "#78694F",  // warm taupe for light sections
      cardBorder:     "#C8A870",  // gold-brown border
      cardBackground: "#F2E4C0",  // champagne card
    },
  },

  // ── 6. Pearl & Navy ─────────────────────────────────────────────────────────
  {
    id:    "pearl-navy",
    label: "Pearl & Navy",
    mood:  "elegant",
    colors: {
      primary:        "#A8956A",  // warm pearl gold
      secondary:      "#1A2744",  // deep navy
      background:     "#F8F6F0",  // pearl white
      lightText:      "#EEF2F8",  // cool white for dark sections
      mutedText:      "#5A6070",  // blue-grey muted for light sections
      cardBorder:     "#2E3E60",  // navy-tinted border
      cardBackground: "#E8EAF0",  // cool pearl card
    },
  },

  // ── 7. Dusty Blue ───────────────────────────────────────────────────────────
  {
    id:    "dusty-blue",
    label: "Dusty Blue",
    mood:  "cool",
    colors: {
      primary:        "#8AABB0",  // dusty teal
      secondary:      "#2A3C4A",  // dark slate blue
      background:     "#F5F7FA",  // cool white
      lightText:      "#EEF2F5",  // near-white cool for dark sections
      mutedText:      "#607080",  // slate muted for light sections
      cardBorder:     "#4A6070",  // slate border
      cardBackground: "#E0E8EE",  // cool blueish card
    },
  },

  // ── 8. Terracotta Linen ─────────────────────────────────────────────────────
  {
    id:    "terracotta-linen",
    label: "Terracotta Linen",
    mood:  "warm",
    colors: {
      primary:        "#C4785A",  // terracotta
      secondary:      "#3C2820",  // dark espresso
      background:     "#FBF5EE",  // warm linen
      lightText:      "#F8EEE0",  // warm off-white for dark sections
      mutedText:      "#7A6050",  // warm taupe for light sections
      cardBorder:     "#C0856A",  // terracotta border
      cardBackground: "#F0DDD0",  // blush terracotta card
    },
  },

  // ── 9. Lavender Mist ────────────────────────────────────────────────────────
  {
    id:    "lavender-mist",
    label: "Lavender Mist",
    mood:  "elegant",
    colors: {
      primary:        "#9A8AB0",  // soft lavender
      secondary:      "#2A2438",  // deep plum
      background:     "#F8F5FC",  // lavender mist
      lightText:      "#EEE8F8",  // lavender white for dark sections
      mutedText:      "#70607A",  // plum muted for light sections
      cardBorder:     "#B0A0C8",  // lavender border
      cardBackground: "#EDE0F5",  // soft lilac card
    },
  },

  // ── 10. Emerald Ivory ───────────────────────────────────────────────────────
  {
    id:    "emerald-ivory",
    label: "Emerald Ivory",
    mood:  "luxury",
    colors: {
      primary:        "#A8C89A",  // sage emerald
      secondary:      "#1C3028",  // deep emerald
      background:     "#F5FAF6",  // fresh ivory
      lightText:      "#E8F5EC",  // green-tinted white for dark sections
      mutedText:      "#5A7060",  // green muted for light sections
      cardBorder:     "#2E5040",  // emerald border
      cardBackground: "#D8EEE0",  // light emerald card
    },
  },

  // ── 11. Burgundy Blush ──────────────────────────────────────────────────────
  {
    id:    "burgundy-blush",
    label: "Burgundy Blush",
    mood:  "romantic",
    colors: {
      primary:        "#8C3A48",  // burgundy
      secondary:      "#2C1418",  // deep wine
      background:     "#FDF5F5",  // blush white
      lightText:      "#F8ECE8",  // warm blush white for dark sections
      mutedText:      "#7A5055",  // wine muted for light sections
      cardBorder:     "#C07080",  // blush border
      cardBackground: "#F0D8D8",  // soft blush card
    },
  },

  // ── 12. Black Tie Gold ──────────────────────────────────────────────────────
  {
    id:    "black-tie-gold",
    label: "Black Tie Gold",
    mood:  "luxury",
    colors: {
      primary:        "#D4A84B",  // bright gold
      secondary:      "#111111",  // pure black
      background:     "#FAFAF8",  // cool white
      lightText:      "#F5F5F0",  // near-white for dark sections
      mutedText:      "#666660",  // neutral muted for light sections
      cardBorder:     "#333330",  // dark border
      cardBackground: "#F0EFE8",  // warm white card
    },
  },
];
