// Elegant Template Default Configuration
// Blue/Gold color scheme variant of the Pro template

import { weddingConfig } from "@/config/wedding-config";
import type { WeddingConfig } from "../types";

// Export config with elegant blue/gold theme
export const defaultConfig: WeddingConfig = {
  ...weddingConfig,
  
  // Override countdown to remove background image for elegant theme
  countdown: {
    ...weddingConfig.countdown,
    backgroundImage: "", // No background image for elegant template
  },
  
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

  // Elegant navy/silver theme
  theme: {
    colors: {
      primary: "#1e3a8a",      // Deep navy blue
      secondary: "#475569",    // Slate gray  
      accent: "#94a3b8",       // Silver gray
      background: "#f1f5f9",   // Very light slate
    },
    fonts: {
      heading: "Playfair Display, serif",
      body: "Inter, sans-serif",
    },
  },
} as WeddingConfig;
