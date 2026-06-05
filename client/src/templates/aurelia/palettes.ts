/**
 * Aurelia — Curated Color Palettes
 *
 * 22 professionally curated palettes for the Aurelia cinematic template.
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
  // ── Dark / moody ──────────────────────────────────────────────────────────
  {
    id:    "champagne-ivory",
    label: "Champagne & Ivory",
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
    id:    "deep-forest",
    label: "Deep Forest",
    mood:  "luxury",
    colors: {
      primary:        "#C5A862",
      secondary:      "#0D1B14",
      background:     "#F5F8F5",
      textColor:      "#1C2E22",
      lightText:      "#EFF6F1",
      mutedText:      "#4E6A57",
      cardBorder:     "#AAC4B2",
      cardBackground: "#E2EDE5",
    },
  },
  {
    id:    "navy-gold",
    label: "Navy & Gold",
    mood:  "classic",
    colors: {
      primary:        "#C9A94A",
      secondary:      "#0F1B2D",
      background:     "#F8F7F2",
      textColor:      "#1A2035",
      lightText:      "#F2EFE4",
      mutedText:      "#4A5568",
      cardBorder:     "#C8BC96",
      cardBackground: "#EFEAD8",
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
    id:    "antique-rose",
    label: "Antique Rose",
    mood:  "classic",
    colors: {
      primary:        "#A8706E",
      secondary:      "#1D1215",
      background:     "#FAF4F3",
      textColor:      "#3A2020",
      lightText:      "#F8EEED",
      mutedText:      "#8B5E5C",
      cardBorder:     "#DFC4C2",
      cardBackground: "#F2E8E7",
    },
  },
  {
    id:    "midnight-silver",
    label: "Midnight & Silver",
    mood:  "elegant",
    colors: {
      primary:        "#B0BABE",
      secondary:      "#0E1218",
      background:     "#F5F6F8",
      textColor:      "#1C2130",
      lightText:      "#EDF0F4",
      mutedText:      "#5C6678",
      cardBorder:     "#C8CED6",
      cardBackground: "#E8ECF0",
    },
  },
  {
    id:    "plum-champagne",
    label: "Plum & Champagne",
    mood:  "romantic",
    colors: {
      primary:        "#C9A87A",
      secondary:      "#1A1220",
      background:     "#FAF8FB",
      textColor:      "#2E2438",
      lightText:      "#F5F0FA",
      mutedText:      "#7A6888",
      cardBorder:     "#D8CCEC",
      cardBackground: "#EDE8F5",
    },
  },
  // ── Light / airy ──────────────────────────────────────────────────────────
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
    id:    "blush-pearl",
    label: "Blush & Pearl",
    mood:  "romantic",
    colors: {
      primary:        "#D4A0A8",
      secondary:      "#1F1618",
      background:     "#FDF9FA",
      textColor:      "#3A2528",
      lightText:      "#FDF0F2",
      mutedText:      "#9A7880",
      cardBorder:     "#EDD4D8",
      cardBackground: "#F8EDEF",
    },
  },
  {
    id:    "celadon-gold",
    label: "Celadon & Gold",
    mood:  "elegant",
    colors: {
      primary:        "#C4A862",
      secondary:      "#121C18",
      background:     "#F5FBF6",
      textColor:      "#1C3028",
      lightText:      "#EEF8F0",
      mutedText:      "#4E6A58",
      cardBorder:     "#A8D0B4",
      cardBackground: "#E0F0E6",
    },
  },
  // ── Warm neutral ──────────────────────────────────────────────────────────
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
  {
    id:    "copper-cream",
    label: "Copper & Cream",
    mood:  "warm",
    colors: {
      primary:        "#B07D54",
      secondary:      "#1E1410",
      background:     "#FCF9F4",
      textColor:      "#3A2518",
      lightText:      "#FCF3EC",
      mutedText:      "#8A6248",
      cardBorder:     "#D8C0A8",
      cardBackground: "#F0E4D4",
    },
  },
  {
    id:    "amber-noir",
    label: "Amber & Noir",
    mood:  "warm",
    colors: {
      primary:        "#C08840",
      secondary:      "#120E0A",
      background:     "#FAF6EF",
      textColor:      "#2E2010",
      lightText:      "#FAF0E0",
      mutedText:      "#806040",
      cardBorder:     "#D8C090",
      cardBackground: "#EFE4CC",
    },
  },
  // ── Ultra refined ─────────────────────────────────────────────────────────
  {
    id:    "dove-platinum",
    label: "Dove & Platinum",
    mood:  "minimal",
    colors: {
      primary:        "#B4B4B4",
      secondary:      "#1A1A1A",
      background:     "#FAFAFA",
      textColor:      "#282828",
      lightText:      "#F5F5F5",
      mutedText:      "#808080",
      cardBorder:     "#D8D8D8",
      cardBackground: "#EFEFEF",
    },
  },
  {
    id:    "charcoal-blush",
    label: "Charcoal & Blush",
    mood:  "minimal",
    colors: {
      primary:        "#C8A0A8",
      secondary:      "#1C1C1E",
      background:     "#FAF8F8",
      textColor:      "#2E2830",
      lightText:      "#F8F4F5",
      mutedText:      "#887888",
      cardBorder:     "#E0CCD0",
      cardBackground: "#F4EEF0",
    },
  },
  {
    id:    "slate-rose",
    label: "Slate & Rose",
    mood:  "minimal",
    colors: {
      primary:        "#C49BA0",
      secondary:      "#1A1F2E",
      background:     "#FAF8F8",
      textColor:      "#282A38",
      lightText:      "#F2EEF0",
      mutedText:      "#6E7080",
      cardBorder:     "#D8C8CA",
      cardBackground: "#F0EAEC",
    },
  },
];
