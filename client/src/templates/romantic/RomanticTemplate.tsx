// Romantic Template Component
// Based on Pro template structure with pink/rose color scheme

import React, { useEffect } from "react";
import type { WeddingConfig } from "../types";
import { defaultConfig as romanticDefaultConfig } from "./config";
import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import CountdownTimer from "@/components/countdown-timer";
import CalendarSection from "@/components/calendar-section";
import LocationsSection from "@/components/locations-section";
import TimelineSection from "@/components/timeline-section";
import RsvpSection from "@/components/rsvp-section";
import PhotoSection from "@/components/photo-section";
import MapModal from "@/components/map-modal";

interface RomanticTemplateProps {
  config: WeddingConfig;
  templateId?: string;
}

export default function RomanticTemplate({ config, templateId }: RomanticTemplateProps) {
  const sections = config.sections || {};
  
  // Set dynamic CSS variables for text colors
  useEffect(() => {
    const textColor = config.theme?.colors?.textColor || romanticDefaultConfig.theme?.colors?.textColor || '#3c1a3c';
    document.documentElement.style.setProperty('--dynamic-text-color', textColor);
    document.documentElement.style.setProperty('--dynamic-text-color-70', textColor + 'B3');
    document.documentElement.style.setProperty('--dynamic-text-color-60', textColor + '99');
  }, [config.theme?.colors?.textColor]);

  // Merge database config with default romantic config, prioritizing file config for theme
  const safeConfig: WeddingConfig = {
    ...config,
    couple: config.couple || { groomName: "Groom", brideName: "Bride" },
    footer: config.footer || { thankYouMessage: "Thank you for celebrating with us" },
    wedding: config.wedding || { displayDate: "Wedding Day" },
    // Use admin panel theme colors if available, otherwise fall back to romantic defaults
    theme: {
      ...romanticDefaultConfig.theme,
      ...config.theme,
      colors: config.theme?.colors || romanticDefaultConfig.theme?.colors || {},
      fonts: config.theme?.fonts || romanticDefaultConfig.theme?.fonts || {}
    }
  };

  return (
    <div className="min-h-screen text-rose-900" style={{
      background: `linear-gradient(135deg, ${config.theme?.colors?.background || safeConfig.theme?.colors?.background || '#fdf2f8'} 0%, ${config.theme?.colors?.background || safeConfig.theme?.colors?.background || '#fdf2f8'} 100%)`
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
        background: `linear-gradient(135deg, ${config.theme?.colors?.primary || safeConfig.theme?.colors?.primary || '#9f1239'} 0%, ${config.theme?.colors?.secondary || safeConfig.theme?.colors?.secondary || '#be123c'} 100%)`,
        color: 'white'
      }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="ornament w-full h-8 mb-8 opacity-50"></div>
          <h3 className="text-2xl font-serif font-bold mb-4 flex items-center justify-center gap-3">
            <span>{safeConfig.couple.groomName}</span>
            <span className="mx-1" style={{ color: config.theme?.colors?.accent || '#a855f7' }}>💕</span>
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
