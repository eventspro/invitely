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
      primary: "", // --soft-gold converted to actual value
      secondary: "", // --sage-green converted to actual value
      accent: "", // --charcoal converted to actual value
      background: "", // --cream converted to actual value
      textColor: "", // Default charcoal text
    },
    fonts: {
      heading: "Playfair Display, serif",
      body: "Inter, sans-serif",
    },
  },
} as WeddingConfig;
