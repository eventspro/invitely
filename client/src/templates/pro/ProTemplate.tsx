// Pro Template Component
// Wraps the existing home page components in a template structure

import React from "react";
import type { WeddingConfig } from "../types";
import { defaultConfig as proDefaultConfig } from "./config";
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

  // Merge database config with default pro config, prioritizing file config for theme
  const safeConfig: WeddingConfig = {
    ...config,
    couple: config.couple || { groomName: "Groom", brideName: "Bride" },
    footer: config.footer || { thankYouMessage: "Thank you for celebrating with us" },
    wedding: config.wedding || { displayDate: "Wedding Day" },
    // Use admin panel theme colors if available, otherwise fall back to pro defaults
    theme: {
      ...proDefaultConfig.theme,
      ...config.theme,
      colors: config.theme?.colors || proDefaultConfig.theme?.colors || {},
      fonts: config.theme?.fonts || proDefaultConfig.theme?.fonts || {}
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
      
      {/* Footer */}
      <footer className="bg-charcoal text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="ornament w-full h-8 mb-8 opacity-50"></div>
          <h3 className="text-2xl font-serif font-bold mb-4 flex items-center justify-center gap-3">
            <span>{safeConfig.couple.groomName}</span>
            <span className="mx-1" style={{ color: config.theme?.colors?.accent || config.theme?.colors?.primary || '#831843' }}>∞</span>
            <span>{safeConfig.couple.brideName}</span>
          </h3>
          <p className="text-white/70 mb-6">{safeConfig.footer.thankYouMessage}</p>
          <p className="text-white/50 text-sm">{safeConfig.wedding.displayDate}</p>
        </div>
      </footer>

      <MapModal config={safeConfig} />
    </div>
  );
}
