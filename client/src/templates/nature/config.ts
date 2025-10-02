// Nature Template Default Configuration
// Green/Earth tone color scheme variant of the Pro template

import { weddingConfig } from "@/config/wedding-config";
import type { WeddingConfig } from "../types";

// Export config with nature green/earth theme
export const defaultConfig: WeddingConfig = {
  ...weddingConfig,
  
  // Override countdown to remove background image for nature theme
  countdown: {
    ...weddingConfig.countdown,
    backgroundImage: "", // No background image for nature template
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

  // Nature sage/forest theme
  theme: {
    colors: {
      primary: "#166534",      // Deep forest green
      secondary: "#15803d",    // Forest green  
      accent: "#a3a3a3",       // Warm gray
      background: "#f7f8f7",   // Very light sage
      textColor: "#2c3e2d",    // Dark forest green for text
    },
    fonts: {
      heading: "Playfair Display, serif",
      body: "Inter, sans-serif",
    },
  },
} as WeddingConfig;
