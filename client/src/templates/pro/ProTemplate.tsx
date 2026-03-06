// Pro Template Component - the most comprehensive template with all existing home page components in a template structure

import React, { useEffect } from "react";
import type { WeddingConfig } from "../types";
import { defaultConfig } from "./config";
import { TemplateFooter } from "../shared/TemplateFooter";
import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import CountdownTimer from "@/components/countdown-timer";
import CalendarSection from "@/components/calendar-section";
import LocationsSection from "@/components/locations-section";
import TimelineSection from "@/components/timeline-section";
import RsvpSection from "@/components/rsvp-section";
import PhotoSection from "@/components/photo-section";
import MapModal from "@/components/map-modal";

interface ProTemplateProps {
  config: WeddingConfig;
  templateId?: string;
}

export default function ProTemplate({ config, templateId }: ProTemplateProps) {
  const sections = config.sections || {};
  
  // Set dynamic CSS variables for text colors
  useEffect(() => {
    const textColor = config.theme?.colors?.textColor || config.theme?.colors?.primary || defaultConfig.theme?.colors?.textColor || defaultConfig.theme?.colors?.primary;
    if (textColor) {
      document.documentElement.style.setProperty('--dynamic-text-color', textColor);
      document.documentElement.style.setProperty('--dynamic-text-color-70', textColor + 'B3');
      document.documentElement.style.setProperty('--dynamic-text-color-60', textColor + '99');
    }
  }, [config.theme?.colors?.textColor, config.theme?.colors?.primary]);

  // Merge database config with default pro config, prioritizing file config for theme
  const safeConfig: WeddingConfig = {
    ...config,
    couple: config.couple || { groomName: "Groom", brideName: "Bride", combinedNames: "Groom & Bride" },
    footer: config.footer || { thankYouMessage: "Thank you for celebrating with us" },
    wedding: config.wedding || { displayDate: "Wedding Day" },
    // Use admin panel theme colors if available, otherwise fall back to pro defaults
    theme: {
      ...defaultConfig.theme,
      ...config.theme,
      colors: config.theme?.colors || defaultConfig.theme?.colors || {},
      fonts: config.theme?.fonts || defaultConfig.theme?.fonts || {}
    }
  };

  // Define all available sections with their components
  const availableSections = [
    { 
      id: 'hero', 
      component: <HeroSection config={safeConfig} />, 
      order: sections.hero?.order ?? 0,
      enabled: sections.hero?.enabled !== false 
    },
    { 
      id: 'countdown', 
      component: <CountdownTimer config={safeConfig} />, 
      order: sections.countdown?.order ?? 1,
      enabled: sections.countdown?.enabled !== false 
    },
    { 
      id: 'calendar', 
      component: <CalendarSection config={safeConfig} />, 
      order: sections.calendar?.order ?? 2,
      enabled: sections.calendar?.enabled !== false 
    },
    { 
      id: 'locations', 
      component: <LocationsSection config={safeConfig} />, 
      order: sections.locations?.order ?? 3,
      enabled: sections.locations?.enabled !== false 
    },
    { 
      id: 'timeline', 
      component: <TimelineSection config={safeConfig} />, 
      order: sections.timeline?.order ?? 4,
      enabled: sections.timeline?.enabled !== false 
    },
    { 
      id: 'rsvp', 
      component: <RsvpSection config={safeConfig} templateId={templateId} />, 
      order: sections.rsvp?.order ?? 5,
      enabled: sections.rsvp?.enabled !== false 
    },
    { 
      id: 'photos', 
      component: <PhotoSection config={safeConfig} templateId={templateId} />, 
      order: sections.photos?.order ?? 6,
      enabled: sections.photos?.enabled !== false 
    },
  ];

  // Sort sections by order and filter enabled ones
  const orderedSections = availableSections
    .filter(section => section.enabled)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-cream text-charcoal">
      <Navigation config={safeConfig} />
      <main>
        {orderedSections.map((section, index) => (
          <React.Fragment key={section.id}>
            {section.component}
          </React.Fragment>
        ))}
      </main>
      
      {/* Footer — all content driven by config, editable in admin panel */}
      <TemplateFooter
        config={safeConfig}
        themeColors={{ accent: config.theme?.colors?.accent, primary: config.theme?.colors?.primary }}
        defaultSeparator="∞"
        footerClassName="bg-charcoal text-white py-12"
        thankYouClassName="text-white/70 mb-6"
        dateClassName="text-white/50 text-sm"
      />

      <MapModal config={safeConfig} />
    </div>
  );
}
