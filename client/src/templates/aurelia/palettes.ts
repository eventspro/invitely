/**
 * Aurelia — Curated Color Palettes
 *
 * 10 professionally curated palettes for the Aurelia cinematic template.
 * 8 color roles map directly to config paths via AURELIA_COLOR_ROLE_MAP.
 */

import type {
  TemplatePalette,
  TemplateColorRoleMap,
} from "../../pages/builder-v2/manifest-types";

// ─── Color role → config path map ─────────────────────────────────────────────
// These 8 roles are applied when a palette is selected in the Builder.
export const AURELIA_COLOR_ROLE_MAP: TemplateColorRoleMap = {
  primary:        "theme.colors.primary",         // champagne gold / accent
  secondary:      "theme.colors.secondary",        // dark section backgrounds
  background:     "theme.colors.background",       // light section backgrounds
  textColor:      "theme.colors.textColor",        // body text on light sections
  lightText:      "theme.colors.lightText",        // text on dark sections
  mutedText:      "theme.colors.mutedText",        // secondary body text
  cardBorder:     "theme.colors.cardBorder",       // card chrome borders
  cardBackground: "theme.colors.cardBackground",   // card backgrounds
};

// ─── Curated palettes ──────────────────────────────────────────────────────────
export const AURELIA_PALETTES: TemplatePalette[] = [
  {
    id:    "champagne-ivory",
    label: "Champagne Ivory",
    mood:  "luxury",
    colors: {
      primary:        "#C4A97D",
      secondary:      "#1C1917",
      background:     "#FAF8F4",
      textColor:      "#44403C",
      lightText:      "#FAFAF9",
      mutedText:      "#78716C",
      cardBorder:     "#D4C5A9",
      cardBackground: "#EDE8DF",
    },
  },
  {
    id:    "midnight-rose",
    label: "Midnight Rose",
    mood:  "romantic",
    colors: {
      primary:        "#C9768F",
      secondary:      "#1A1520",
      background:     "#FBF8F9",
      textColor:      "#3D2B35",
      lightText:      "#FFF0F4",
      mutedText:      "#8B6876",
      cardBorder:     "#E4C0CB",
      cardBackground: "#F5EBEF",
    },
  },
  {
    id:    "sage-linen",
    label: "Sage & Linen",
    mood:  "botanical",
    colors: {
      primary:        "#7A9A7E",
      secondary:      "#1E2420",
      background:     "#F7F5F0",
      textColor:      "#2F3B32",
      lightText:      "#F0F5F1",
      mutedText:      "#6B7A6D",
      cardBorder:     "#B8CCBA",
      cardBackground: "#EAF0EB",
    },
  },
  {
    id:    "pearl-noir",
    label: "Pearl & Noir",
    mood:  "classic",
    colors: {
      primary:        "#D4AF86",
      secondary:      "#111110",
      background:     "#FAFAF9",
      textColor:      "#28272B",
      lightText:      "#F5F5F0",
      mutedText:      "#71717A",
      cardBorder:     "#D4D4D0",
      cardBackground: "#EDEDEB",
    },
  },
  {
    id:    "dusty-blue-silk",
    label: "Dusty Blue & Silk",
    mood:  "elegant",
    colors: {
      primary:        "#8BA7BE",
      secondary:      "#1A2530",
      background:     "#F6F8FA",
      textColor:      "#263040",
      lightText:      "#EFF4F8",
      mutedText:      "#617080",
      cardBorder:     "#B8CDD9",
      cardBackground: "#E8EFF5",
    },
  },
  {
    id:    "terracotta-cream",
    label: "Terracotta & Cream",
    mood:  "warm",
    colors: {
      primary:        "#C47A55",
      secondary:      "#231A14",
      background:     "#FAF5F0",
      textColor:      "#3D2B1F",
      lightText:      "#FDF0E8",
      mutedText:      "#8B6650",
      cardBorder:     "#DFC5B2",
      cardBackground: "#F0E5DA",
    },
  },
  {
    id:    "lavender-mist",
    label: "Lavender Mist",
    mood:  "romantic",
    colors: {
      primary:        "#9B8BC0",
      secondary:      "#1E1B2E",
      background:     "#F9F8FC",
      textColor:      "#2D2840",
      lightText:      "#F0EDF8",
      mutedText:      "#7B6E9A",
      cardBorder:     "#D0C8E8",
      cardBackground: "#EDE9F5",
    },
  },
  {
    id:    "emerald-gold",
    label: "Emerald & Gold",
    mood:  "luxury",
    colors: {
      primary:        "#C4A940",
      secondary:      "#0F1F18",
      background:     "#F5FAF6",
      textColor:      "#1A3028",
      lightText:      "#F0F8F2",
      mutedText:      "#4A6B58",
      cardBorder:     "#A8C8B0",
      cardBackground: "#E4F0E8",
    },
  },
  {
    id:    "burgundy-parchment",
    label: "Burgundy & Parchment",
    mood:  "classic",
    colors: {
      primary:        "#8B2E3E",
      secondary:      "#1A0E12",
      background:     "#FAF5EE",
      textColor:      "#3A1820",
      lightText:      "#F8EEED",
      mutedText:      "#7A4850",
      cardBorder:     "#DBBCC4",
      cardBackground: "#F0E5E8",
    },
  },
  {
    id:    "warm-minimal",
    label: "Warm Minimal",
    mood:  "minimal",
    colors: {
      primary:        "#B5A08C",
      secondary:      "#201E1C",
      background:     "#FDFCFB",
      textColor:      "#3C3830",
      lightText:      "#FBFAF8",
      mutedText:      "#7C7368",
      cardBorder:     "#DAD4C8",
      cardBackground: "#F2EDE6",
    },
  },
];
