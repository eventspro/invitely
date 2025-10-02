// Nature Template Component
// Based on Pro template structure with green/earth tone color scheme

import React, { useEffect } from "react";
import type { WeddingConfig } from "../types";
import { defaultConfig as natureDefaultConfig } from "./config";
import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import CountdownTimer from "@/components/countdown-timer";
import CalendarSection from "@/components/calendar-section";
import LocationsSection from "@/components/locations-section";
import TimelineSection from "@/components/timeline-section";
import RsvpSection from "@/components/rsvp-section";
import PhotoSection from "@/components/photo-section";
import MapModal from "@/components/map-modal";

interface NatureTemplateProps {
  config: WeddingConfig;
  templateId?: string;
}

export default function NatureTemplate({ config, templateId }: NatureTemplateProps) {
  const sections = config.sections || {};

  // Merge database config with default nature config, prioritizing database/admin config for theme
  const safeConfig: WeddingConfig = {
    ...config,
    couple: config.couple || { groomName: "Groom", brideName: "Bride" },
    footer: config.footer || { thankYouMessage: "Thank you for celebrating with us" },
    wedding: config.wedding || { displayDate: "Wedding Day" },
    // Use admin panel theme colors if available, otherwise fall back to nature defaults
    theme: {
      ...natureDefaultConfig.theme,
      ...config.theme,
      colors: config.theme?.colors || natureDefaultConfig.theme?.colors || {},
      fonts: config.theme?.fonts || natureDefaultConfig.theme?.fonts || {}
    }
  };

  // Set CSS variables for dynamic color overrides
  useEffect(() => {
    const textColor = safeConfig.theme?.colors?.textColor;
    if (textColor) {
      document.documentElement.style.setProperty('--dynamic-text-color', textColor);
    }
  }, [safeConfig.theme?.colors?.textColor]);

  return (
    <div className="min-h-screen text-gray-800" style={{
      background: `linear-gradient(135deg, ${config.theme?.colors?.background || safeConfig.theme?.colors?.background || '#f7f8f7'} 0%, ${config.theme?.colors?.background || safeConfig.theme?.colors?.background || '#f7f8f7'} 100%)`
    }}>
      <Navigation config={safeConfig} />
      <main>
        {sections.hero?.enabled !== false && <HeroSection config={safeConfig} />}
        {sections.countdown?.enabled !== false && <CountdownTimer config={safeConfig} />}
        {sections.calendar?.enabled !== false && <CalendarSection config={safeConfig} />}
        {sections.locations?.enabled !== false && <LocationsSection config={safeConfig} />}
        {sections.timeline?.enabled !== false && <TimelineSection config={safeConfig} />}
        {sections.rsvp?.enabled !== false && <RsvpSection config={safeConfig} templateId={templateId} />}
        {sections.photos?.enabled !== false && <PhotoSection config={safeConfig} templateId={templateId} />}
      </main>
      
      {/* Footer */}
      <footer className="py-12" style={{
        background: `linear-gradient(135deg, ${config.theme?.colors?.primary || safeConfig.theme?.colors?.primary || '#4A3F35'} 0%, ${config.theme?.colors?.secondary || safeConfig.theme?.colors?.secondary || '#B8A99A'} 100%)`,
        color: 'white'
      }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="ornament w-full h-8 mb-8 opacity-50"></div>
          <h3 className="text-2xl font-serif font-bold mb-4 flex items-center justify-center gap-3">
            <span>{safeConfig.couple.groomName}</span>
            <span className="mx-1" style={{ color: config.theme?.colors?.accent || '#a3a3a3' }}>🌿</span>
            <span>{safeConfig.couple.brideName}</span>
          </h3>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto leading-relaxed">
            {safeConfig.footer.thankYouMessage}
          </p>
          <div className="text-sm opacity-75">
            {safeConfig.wedding.displayDate}
          </div>
        </div>
      </footer>
      
      <MapModal config={safeConfig} />
    </div>
  );
}
