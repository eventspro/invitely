// Romantic Template Default Configuration
// Pink/Rose color scheme variant of the Pro template

import { weddingConfig } from "@/config/wedding-config";
import type { WeddingConfig } from "../types";

// Export config with romantic pink/rose theme
export const defaultConfig: WeddingConfig = {
  ...weddingConfig,
  
  // Override countdown to remove background image for romantic theme
  countdown: {
    ...weddingConfig.countdown,
    backgroundImage: "", // No background image for romantic template
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

  // Romantic dusty rose/mauve theme
  theme: {
    colors: {
      primary: "#9f1239",      // Deep rose
      secondary: "#be123c",    // Muted crimson  
      accent: "#a855f7",       // Soft purple
      background: "#fdf2f8",   // Very light rose
      textColor: "#3c1a3c",    // Dark rose for text
    },
    fonts: {
      heading: "Playfair Display, serif",
      body: "Inter, sans-serif",
    },
  },
} as WeddingConfig;
