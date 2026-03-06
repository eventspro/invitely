// Elegant Template Component
// Based on Pro template structure with blue/gold color scheme

import React, { useEffect } from "react";
import type { WeddingConfig } from "../types";
import { defaultConfig as elegantDefaultConfig } from "./config";
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

interface ElegantTemplateProps {
  config: WeddingConfig;
  templateId?: string;
}

export default function ElegantTemplate({ config, templateId }: ElegantTemplateProps) {
  const sections = config.sections || {};

  // Merge database config with default elegant config, prioritizing file config for theme
  const safeConfig: WeddingConfig = {
    ...config,
    couple: config.couple || { groomName: "Groom", brideName: "Bride" },
    footer: config.footer || { thankYouMessage: "Thank you for celebrating with us" },
    wedding: config.wedding || { displayDate: "Wedding Day" },
    // Use admin panel theme colors if available, otherwise fall back to elegant defaults
    theme: {
      ...elegantDefaultConfig.theme,
      ...config.theme,
      colors: config.theme?.colors || elegantDefaultConfig.theme?.colors || {},
      fonts: config.theme?.fonts || elegantDefaultConfig.theme?.fonts || {}
    }
  };

  // Set CSS variables for dynamic color overrides
  useEffect(() => {
    const textColor = config.theme?.colors?.textColor || config.theme?.colors?.primary || elegantDefaultConfig.theme?.colors?.textColor || elegantDefaultConfig.theme?.colors?.primary;
    if (textColor) {
      document.documentElement.style.setProperty('--dynamic-text-color', textColor);
    }
  }, [safeConfig.theme?.colors?.textColor, safeConfig.theme?.colors?.primary]);

  return (
    <div className="min-h-screen bg-slate-50" style={{
      background: config.theme?.colors?.background ? `linear-gradient(135deg, ${config.theme?.colors?.background} 0%, ${config.theme?.colors?.background}50 100%)` : undefined,
      color: safeConfig.theme?.colors?.textColor
    }}>
      <Navigation />
      <main>
        {sections.hero?.enabled !== false && <HeroSection config={safeConfig} />}
        {sections.countdown?.enabled !== false && <CountdownTimer config={safeConfig} />}
        {sections.calendar?.enabled !== false && <CalendarSection config={safeConfig} />}
        {sections.locations?.enabled !== false && <LocationsSection config={safeConfig} />}
        {sections.timeline?.enabled !== false && <TimelineSection config={safeConfig} />}
        {sections.rsvp?.enabled !== false && <RsvpSection config={safeConfig} templateId={templateId} />}
        {sections.photos?.enabled !== false && <PhotoSection config={safeConfig} templateId={templateId} />}
      </main>
      
      {/* Footer — all content driven by config, editable in admin panel */}
      <TemplateFooter
        config={safeConfig}
        themeColors={{ accent: config.theme?.colors?.accent, primary: config.theme?.colors?.primary }}
        defaultSeparator="∞"
        footerStyle={{
          background: (config.theme?.colors?.primary || safeConfig.theme?.colors?.primary) && (config.theme?.colors?.secondary || safeConfig.theme?.colors?.secondary) ? `linear-gradient(135deg, ${config.theme?.colors?.primary || safeConfig.theme?.colors?.primary} 0%, ${config.theme?.colors?.secondary || safeConfig.theme?.colors?.secondary} 100%)` : undefined,
          color: 'white'
        }}
      />
      
      <MapModal config={safeConfig} />
    </div>
  );
}
