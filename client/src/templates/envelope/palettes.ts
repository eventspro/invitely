/**
 * Envelope Romance — Curated Color Palettes
 *
 * 10 luxury palettes for the bright envelope opening template.
 * 8 color roles map directly to config paths via ENVELOPE_COLOR_ROLE_MAP.
 */

import type {
  TemplatePalette,
  TemplateColorRoleMap,
} from "../../pages/builder-v2/manifest-types";

// ─── Color role → config path map ─────────────────────────────────────────────
export const ENVELOPE_COLOR_ROLE_MAP: TemplateColorRoleMap = {
  primary:        "theme.colors.primary",         // gold accent / wax seal
  secondary:      "theme.colors.secondary",        // footer / dark text
  background:     "theme.colors.background",       // page background
  textColor:      "theme.colors.textColor",        // main body text
  lightText:      "theme.colors.lightText",        // text on dark footer
  mutedText:      "theme.colors.mutedText",        // secondary text
  cardBorder:     "theme.colors.cardBorder",       // card / detail borders
  cardBackground: "theme.colors.cardBackground",   // card backgrounds
};

// ─── Curated palettes ──────────────────────────────────────────────────────────
export const ENVELOPE_PALETTES: TemplatePalette[] = [
  {
    id:    "gold-ivory",
    label: "Gold & Ivory",
    mood:  "luxury",
    colors: {
      primary:        "#C9A45C",
      secondary:      "#1F2933",
      background:     "#FBFAF7",
      textColor:      "#1F2933",
      lightText:      "#FFF9EF",
      mutedText:      "#8B7E6F",
      cardBorder:     "rgba(201,164,92,0.22)",
      cardBackground: "#FFFFFF",
    },
  },
  {
    id:    "champagne-blush",
    label: "Champagne Blush",
    mood:  "romantic",
    colors: {
      primary:        "#C4927A",
      secondary:      "#2A1F1A",
      background:     "#FDF9F7",
      textColor:      "#2A1F1A",
      lightText:      "#FFF3EE",
      mutedText:      "#9B7A6C",
      cardBorder:     "rgba(196,146,122,0.22)",
      cardBackground: "#FFFFFF",
    },
  },
  {
    id:    "sage-gold",
    label: "Sage & Gold",
    mood:  "botanical",
    colors: {
      primary:        "#9A8B6A",
      secondary:      "#1E2318",
      background:     "#F7F5EF",
      textColor:      "#1E2318",
      lightText:      "#F2F0E8",
      mutedText:      "#7A7460",
      cardBorder:     "rgba(154,139,106,0.2)",
      cardBackground: "#FFFFFF",
    },
  },
  {
    id:    "ivory-noir",
    label: "Ivory & Noir",
    mood:  "classic",
    colors: {
      primary:        "#B8A082",
      secondary:      "#111111",
      background:     "#FAF9F6",
      textColor:      "#111111",
      lightText:      "#F5F4F0",
      mutedText:      "#7A7268",
      cardBorder:     "rgba(184,160,130,0.22)",
      cardBackground: "#FFFFFF",
    },
  },
  {
    id:    "dusty-rose",
    label: "Dusty Rose",
    mood:  "romantic",
    colors: {
      primary:        "#C4899A",
      secondary:      "#2A1820",
      background:     "#FDF8F9",
      textColor:      "#2A1820",
      lightText:      "#FFF0F4",
      mutedText:      "#9B7080",
      cardBorder:     "rgba(196,137,154,0.2)",
      cardBackground: "#FFFFFF",
    },
  },
  {
    id:    "powder-blue",
    label: "Powder Blue & Gold",
    mood:  "elegant",
    colors: {
      primary:        "#C4A45C",
      secondary:      "#1A2535",
      background:     "#F6F8FB",
      textColor:      "#1A2535",
      lightText:      "#EEF3F9",
      mutedText:      "#617080",
      cardBorder:     "rgba(139,167,190,0.22)",
      cardBackground: "#FFFFFF",
    },
  },
  {
    id:    "terracotta-ivory",
    label: "Terracotta & Ivory",
    mood:  "warm",
    colors: {
      primary:        "#C47A55",
      secondary:      "#231A14",
      background:     "#FAF5F0",
      textColor:      "#231A14",
      lightText:      "#FDF0E8",
      mutedText:      "#8B6550",
      cardBorder:     "rgba(196,122,85,0.2)",
      cardBackground: "#FFFFFF",
    },
  },
  {
    id:    "emerald-champagne",
    label: "Emerald & Champagne",
    mood:  "luxury",
    colors: {
      primary:        "#C4A940",
      secondary:      "#0F2018",
      background:     "#F5FAF6",
      textColor:      "#0F2018",
      lightText:      "#EFF8F2",
      mutedText:      "#4A6B58",
      cardBorder:     "rgba(196,169,64,0.2)",
      cardBackground: "#FFFFFF",
    },
  },
  {
    id:    "lavender-gold",
    label: "Lavender & Gold",
    mood:  "romantic",
    colors: {
      primary:        "#A08BC0",
      secondary:      "#1E1B2E",
      background:     "#FAF9FD",
      textColor:      "#1E1B2E",
      lightText:      "#F2EFF8",
      mutedText:      "#7B6E9A",
      cardBorder:     "rgba(160,139,192,0.2)",
      cardBackground: "#FFFFFF",
    },
  },
  {
    id:    "warm-minimal",
    label: "Warm Minimal",
    mood:  "minimal",
    colors: {
      primary:        "#B8A07A",
      secondary:      "#201E1C",
      background:     "#FDFCFB",
      textColor:      "#201E1C",
      lightText:      "#FAF9F7",
      mutedText:      "#7C7368",
      cardBorder:     "rgba(184,160,122,0.2)",
      cardBackground: "#FFFFFF",
    },
  },
];
