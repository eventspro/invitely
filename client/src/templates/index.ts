// Template Registry System
// This file exports all available wedding templates for the platform

import { lazy } from "react";
import type { WeddingConfig } from "./types";

export interface TemplateDefinition {
  key: string;
  name: string;
  description: string;
  defaultConfig: WeddingConfig;
  // Lazy-loaded template component
  component: React.LazyExoticComponent<React.ComponentType<{ config: WeddingConfig; templateId?: string }>>;
  // Preview image for admin selection
  previewImage?: string;
  // Template features/capabilities
  features: string[];
}

// Template registry - add new templates here
export const templates: Record<string, TemplateDefinition> = {
  pro: {
    key: "pro",
    name: "Pro Wedding Template",
    description: "Elegant Armenian wedding template with full features",
    defaultConfig: {} as WeddingConfig, // Will be loaded from pro/config.ts
    component: lazy(() => import("./pro/ProTemplate")),
    previewImage: "/templates/pro-preview.jpg",
    features: [
      "Hero Section with Background Music",
      "Real-time Countdown Timer", 
      "Interactive Calendar",
      "Locations with Map Integration",
      "Timeline/Schedule Display",
      "RSVP Form with Email Notifications",
      "Photo Upload & Gallery",
      "Armenian & English Support",
      "Maintenance Mode",
      "Admin Panel"
    ]
  },
  classic: {
    key: "classic",
    name: "Classic Wedding Template",
    description: "Clean and simple design with elegant styling",
    defaultConfig: {} as WeddingConfig, // Will be loaded from classic/config.ts
    component: lazy(() => import("./classic/ClassicTemplate")),
    previewImage: "/templates/classic-preview.jpg",
    features: [
      "Clean Elegant Design",
      "Countdown Timer",
      "Wedding Details Section",
      "Timeline Schedule",
      "RSVP Form",
      "Responsive Mobile Design",
      "Easy Customization",
      "Multiple Color Themes"
    ]
  },
  elegant: {
    key: "elegant",
    name: "Elegant Blue Template",
    description: "Pro template with sophisticated blue and gold color scheme",
    defaultConfig: {} as WeddingConfig, // Will be loaded from elegant/config.ts
    component: lazy(() => import("./elegant/ElegantTemplate")),
    previewImage: "/templates/elegant-preview.jpg",
    features: [
      "Pro Template Layout",
      "Blue & Gold Color Scheme",
      "All Pro Features",
      "Elegant Design",
      "Fully Customizable"
    ]
  },
  romantic: {
    key: "romantic",
    name: "Romantic Pink Template",
    description: "Pro template with romantic pink and rose color scheme",
    defaultConfig: {} as WeddingConfig, // Will be loaded from romantic/config.ts
    component: lazy(() => import("./romantic/RomanticTemplate")),
    previewImage: "/templates/romantic-preview.jpg",
    features: [
      "Pro Template Layout",
      "Pink & Rose Color Scheme",
      "All Pro Features",
      "Romantic Design",
      "Fully Customizable"
    ]
  },
  nature: {
    key: "nature",
    name: "Nature Green Template",
    description: "Pro template with natural green and earth tone color scheme",
    defaultConfig: {} as WeddingConfig, // Will be loaded from nature/config.ts
    component: lazy(() => import("./nature/NatureTemplate")),
    previewImage: "/templates/nature-preview.jpg",
    features: [
      "Pro Template Layout",
      "Green & Earth Tone Colors",
      "All Pro Features",
      "Nature-Inspired Design",
      "Fully Customizable"
    ]
  }
  // Future templates can be added here:
  // minimal: { ... },
};

// Helper functions
export const getTemplate = (key: string): TemplateDefinition | null => {
  return templates[key] || null;
};

export const getTemplateKeys = (): string[] => {
  return Object.keys(templates);
};

export const getTemplateList = (): TemplateDefinition[] => {
  return Object.values(templates);
};

// Load template default config dynamically
export const loadTemplateConfig = async (templateKey: string): Promise<WeddingConfig | null> => {
  try {
    switch (templateKey) {
      case "pro":
        const proConfig = await import("./pro/config");
        return proConfig.defaultConfig;
      case "classic":
        const classicConfig = await import("./classic/config");
        return classicConfig.defaultConfig;
      case "elegant":
        const elegantConfig = await import("./elegant/config");
        return elegantConfig.defaultConfig;
      case "romantic":
        const romanticConfig = await import("./romantic/config");
        return romanticConfig.defaultConfig;
      case "nature":
        const natureConfig = await import("./nature/config");
        return natureConfig.defaultConfig;
      default:
        return null;
    }
  } catch (error) {
    console.error(`Failed to load config for template: ${templateKey}`, error);
    return null;
  }
};
