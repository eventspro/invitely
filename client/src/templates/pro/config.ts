// Pro Template Default Configuration
// This wraps the existing wedding-config.ts for the Pro template

import { weddingConfig } from "@/config/wedding-config";
import type { WeddingConfig } from "../types";

// Export the existing config as the default for Pro template
export const defaultConfig: WeddingConfig = {
  ...weddingConfig,
  
  // Add sections control (default: all enabled)
  sections: {
    hero: { enabled: true },
    countdown: { enabled: true },
    calendar: { enabled: true },
    locations: { enabled: true },
    timeline: { enabled: true },
    rsvp: { enabled: true },
    photos: { enabled: true },
  },

  // Add theme configuration
  theme: {
    colors: {
      primary: "var(--soft-gold)",
      secondary: "var(--sage-green)", 
      accent: "var(--charcoal)",
      background: "var(--cream)",
    },
    fonts: {
      heading: "Playfair Display, serif",
      body: "Inter, sans-serif",
    },
  },
} as WeddingConfig;
