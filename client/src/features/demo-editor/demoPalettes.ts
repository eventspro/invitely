/**
 * demoPalettes.ts
 *
 * 25 curated wedding color palettes for the customer demo flow.
 * Each palette maps to WeddingConfig.theme.colors keys so it can be applied
 * directly with updateConfig({ theme: { colors: palette.colors } }).
 *
 * SAFE: This file is demo-only. It does not modify any live template or config.
 */

export interface DemoPalette {
  id: string;
  name: string;
  mood: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    textColor: string;
    buttonColor: string;
  };
}

export const DEMO_PALETTES: DemoPalette[] = [
  // ─── Dark / Moody ────────────────────────────────────────────────────────────
  {
    id: "david-rose",
    name: "David & Rose",
    mood: "Classic dark wine",
    colors: { primary: "#5B2333", secondary: "#a3917b", accent: "#b9b1a7", background: "#F9F7F6", textColor: "#2a0e18", buttonColor: "#5B2333" },
  },
  {
    id: "dark-velvet",
    name: "Dark Velvet",
    mood: "Deep burgundy noir",
    colors: { primary: "#c8a882", secondary: "#a3917b", accent: "#d4b896", background: "#1a0a0e", textColor: "#f5ede4", buttonColor: "#c8a882" },
  },
  {
    id: "black-onyx",
    name: "Black Onyx",
    mood: "Dramatic black & gold",
    colors: { primary: "#d4af37", secondary: "#b8960c", accent: "#f0c040", background: "#0d0d0d", textColor: "#f5f0e0", buttonColor: "#d4af37" },
  },
  {
    id: "obsidian-rose",
    name: "Obsidian Rose",
    mood: "Moody dark romance",
    colors: { primary: "#e8c4b8", secondary: "#c9a090", accent: "#f5ddd5", background: "#160d0b", textColor: "#f5ede4", buttonColor: "#c9a090" },
  },
  {
    id: "noir-plum",
    name: "Noir Plum",
    mood: "Dark purple evening",
    colors: { primary: "#c4a7d4", secondary: "#8b6b9e", accent: "#e0c8f0", background: "#100a14", textColor: "#f0e8f8", buttonColor: "#8b6b9e" },
  },
  {
    id: "dark-forest-gold",
    name: "Dark Forest",
    mood: "Deep woodland dusk",
    colors: { primary: "#c8b87a", secondary: "#7a6e52", accent: "#e0d09a", background: "#0d1208", textColor: "#f0ead8", buttonColor: "#c8b87a" },
  },
  {
    id: "espresso-cream",
    name: "Espresso Cream",
    mood: "Rich warm darkness",
    colors: { primary: "#d4b896", secondary: "#9c7c5c", accent: "#ecd8bc", background: "#1c1009", textColor: "#f5ede0", buttonColor: "#9c7c5c" },
  },
  {
    id: "slate-ivory",
    name: "Slate Ivory",
    mood: "Cool charcoal luxury",
    colors: { primary: "#e8e0d4", secondary: "#9a9488", accent: "#f0e8dc", background: "#1a1a1e", textColor: "#f0ece4", buttonColor: "#9a9488" },
  },
  {
    id: "deep-wine",
    name: "Deep Wine",
    mood: "Velvety dark crimson",
    colors: { primary: "#f5ddd5", secondary: "#c09080", accent: "#f8ece4", background: "#2a0a10", textColor: "#faf0ec", buttonColor: "#c09080" },
  },
  {
    id: "dark-sage",
    name: "Dark Sage",
    mood: "Dusky garden evening",
    colors: { primary: "#b8d4b0", secondary: "#7a9c74", accent: "#d0e8c8", background: "#0a140c", textColor: "#e8f4e4", buttonColor: "#7a9c74" },
  },
  // ─── Light / Romantic ────────────────────────────────────────────────────────
  {
    id: "romantic-rose",
    name: "Romantic Rose",
    mood: "Classic romantic",
    colors: { primary: "#9f1239", secondary: "#fda4af", accent: "#be185d", background: "#fff1f2", textColor: "#3b0a1f", buttonColor: "#9f1239" },
  },
  {
    id: "classic-ivory",
    name: "Classic Ivory",
    mood: "Timeless elegant",
    colors: { primary: "#78350f", secondary: "#fde68a", accent: "#d97706", background: "#fffbeb", textColor: "#1c1917", buttonColor: "#78350f" },
  },
  {
    id: "sage-garden",
    name: "Sage Garden",
    mood: "Fresh botanical",
    colors: { primary: "#3d6b4f", secondary: "#bbf7d0", accent: "#16a34a", background: "#f0fdf4", textColor: "#14532d", buttonColor: "#3d6b4f" },
  },
  {
    id: "luxury-dark",
    name: "Luxury Dark",
    mood: "Dramatic modern",
    colors: { primary: "#1e1b4b", secondary: "#c7d2fe", accent: "#7c3aed", background: "#0f0e17", textColor: "#e0e7ff", buttonColor: "#7c3aed" },
  },
  {
    id: "gold-beige",
    name: "Gold Beige",
    mood: "Warm luxurious",
    colors: { primary: "#92400e", secondary: "#fde68a", accent: "#b45309", background: "#fefce8", textColor: "#3d2b00", buttonColor: "#92400e" },
  },
  {
    id: "blush-pearl",
    name: "Blush Pearl",
    mood: "Soft feminine",
    colors: { primary: "#be185d", secondary: "#fce7f3", accent: "#ec4899", background: "#fdf2f8", textColor: "#4a1942", buttonColor: "#be185d" },
  },
  {
    id: "champagne-cream",
    name: "Champagne Cream",
    mood: "Understated elegant",
    colors: { primary: "#a16207", secondary: "#fef3c7", accent: "#ca8a04", background: "#fefdf9", textColor: "#292524", buttonColor: "#a16207" },
  },
  {
    id: "dusty-blue",
    name: "Dusty Blue",
    mood: "Serene cool",
    colors: { primary: "#1d4ed8", secondary: "#bfdbfe", accent: "#3b82f6", background: "#eff6ff", textColor: "#1e3a5f", buttonColor: "#1d4ed8" },
  },
  {
    id: "lavender-mist",
    name: "Lavender Mist",
    mood: "Dreamy floral",
    colors: { primary: "#7e22ce", secondary: "#e9d5ff", accent: "#9333ea", background: "#faf5ff", textColor: "#3b0764", buttonColor: "#7e22ce" },
  },
  {
    id: "olive-gold",
    name: "Olive Gold",
    mood: "Earthy warm",
    colors: { primary: "#3f6212", secondary: "#d9f99d", accent: "#65a30d", background: "#f7fee7", textColor: "#1a2e05", buttonColor: "#3f6212" },
  },
  {
    id: "burgundy-blush",
    name: "Burgundy Blush",
    mood: "Deep romantic",
    colors: { primary: "#7f1d1d", secondary: "#fecaca", accent: "#b91c1c", background: "#fff5f5", textColor: "#3b0606", buttonColor: "#7f1d1d" },
  },
  {
    id: "pearl-navy",
    name: "Pearl Navy",
    mood: "Sophisticated",
    colors: { primary: "#1e3a5f", secondary: "#e2e8f0", accent: "#334155", background: "#f8fafc", textColor: "#0f172a", buttonColor: "#1e3a5f" },
  },
  {
    id: "terracotta-linen",
    name: "Terracotta Linen",
    mood: "Rustic warm",
    colors: { primary: "#9a3412", secondary: "#fed7aa", accent: "#ea580c", background: "#fff7ed", textColor: "#431407", buttonColor: "#9a3412" },
  },
  {
    id: "emerald-ivory",
    name: "Emerald Ivory",
    mood: "Lush garden",
    colors: { primary: "#065f46", secondary: "#a7f3d0", accent: "#059669", background: "#ecfdf5", textColor: "#022c22", buttonColor: "#065f46" },
  },
  {
    id: "soft-peach",
    name: "Soft Peach",
    mood: "Gentle sunrise",
    colors: { primary: "#c2410c", secondary: "#fed7aa", accent: "#f97316", background: "#fff7ed", textColor: "#431407", buttonColor: "#c2410c" },
  },
  {
    id: "rosewood",
    name: "Rosewood",
    mood: "Rich floral",
    colors: { primary: "#881337", secondary: "#fecdd3", accent: "#e11d48", background: "#fff1f2", textColor: "#3b0a1f", buttonColor: "#881337" },
  },
  {
    id: "midnight-gold",
    name: "Midnight Gold",
    mood: "Opulent evening",
    colors: { primary: "#92400e", secondary: "#fbbf24", accent: "#d97706", background: "#1c1917", textColor: "#fef3c7", buttonColor: "#d97706" },
  },
  {
    id: "warm-sand",
    name: "Warm Sand",
    mood: "Desert minimal",
    colors: { primary: "#78350f", secondary: "#e7d5c1", accent: "#a16207", background: "#fdf8f2", textColor: "#1c1917", buttonColor: "#78350f" },
  },
  {
    id: "silver-sage",
    name: "Silver Sage",
    mood: "Cool botanical",
    colors: { primary: "#475569", secondary: "#cbd5e1", accent: "#64748b", background: "#f8fafc", textColor: "#0f172a", buttonColor: "#475569" },
  },
  {
    id: "cocoa-cream",
    name: "Cocoa Cream",
    mood: "Cozy elegant",
    colors: { primary: "#44403c", secondary: "#d6d3d1", accent: "#78716c", background: "#fafaf9", textColor: "#1c1917", buttonColor: "#44403c" },
  },
  {
    id: "ivory-garden",
    name: "Ivory Garden",
    mood: "Romantic natural",
    colors: { primary: "#166534", secondary: "#dcfce7", accent: "#15803d", background: "#fefffe", textColor: "#14532d", buttonColor: "#166534" },
  },
  {
    id: "mauve-romance",
    name: "Mauve Romance",
    mood: "Dusty vintage",
    colors: { primary: "#86198f", secondary: "#f5d0fe", accent: "#a21caf", background: "#fdf4ff", textColor: "#3b0764", buttonColor: "#86198f" },
  },
  {
    id: "antique-gold",
    name: "Antique Gold",
    mood: "Heritage luxury",
    colors: { primary: "#713f12", secondary: "#fef9c3", accent: "#ca8a04", background: "#fefce8", textColor: "#292524", buttonColor: "#713f12" },
  },
  {
    id: "wine-velvet",
    name: "Wine Velvet",
    mood: "Deep velvet",
    colors: { primary: "#4c1d95", secondary: "#ddd6fe", accent: "#7c3aed", background: "#f5f3ff", textColor: "#1e1b4b", buttonColor: "#4c1d95" },
  },
  {
    id: "forest-cream",
    name: "Forest Cream",
    mood: "Woodland fresh",
    colors: { primary: "#14532d", secondary: "#bbf7d0", accent: "#15803d", background: "#f0fdf4", textColor: "#052e16", buttonColor: "#14532d" },
  },
];

/** Look up a palette by id, returns undefined if not found */
export function getPaletteById(id: string): DemoPalette | undefined {
  return DEMO_PALETTES.find(p => p.id === id);
}
