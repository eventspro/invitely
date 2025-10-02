// Classic Template Component
// Updated to match other templates with modular components and Armenian font support

import React, { useEffect } from "react";
import type { WeddingConfig } from "../types";
import { defaultConfig as classicDefaultConfig } from "./config";
import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import CountdownTimer from "@/components/countdown-timer";
import CalendarSection from "@/components/calendar-section";
import LocationsSection from "@/components/locations-section";
import TimelineSection from "@/components/timeline-section";
import RsvpSection from "@/components/rsvp-section";
import PhotoSection from "@/components/photo-section";
import MapModal from "@/components/map-modal";

interface ClassicTemplateProps {
  config: WeddingConfig;
  templateId?: string;
}

export default function ClassicTemplate({ config, templateId }: ClassicTemplateProps) {
  const sections = config.sections || {};

  // Merge database config with default classic config, prioritizing file config for theme
  const safeConfig: WeddingConfig = {
    ...config,
    couple: config.couple || { groomName: "Groom", brideName: "Bride" },
    footer: config.footer || { thankYouMessage: "Thank you for celebrating with us" },
    wedding: config.wedding || { displayDate: "Wedding Day" },
    // Use admin panel theme colors if available, otherwise fall back to classic defaults
    theme: {
      ...classicDefaultConfig.theme,
      ...config.theme,
      colors: config.theme?.colors || classicDefaultConfig.theme?.colors || {},
      fonts: config.theme?.fonts || classicDefaultConfig.theme?.fonts || {}
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
    <div className="min-h-screen bg-rose-50 text-slate-800" style={{
      background: `linear-gradient(135deg, ${config.theme?.colors?.background || safeConfig.theme?.colors?.background || '#fdf2f8'} 0%, ${config.theme?.colors?.background || safeConfig.theme?.colors?.background || '#fdf2f8'} 100%)`
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
      
      {/* Footer */}
      <footer className="py-12" style={{
        background: `linear-gradient(135deg, ${config.theme?.colors?.primary || safeConfig.theme?.colors?.primary || '#be185d'} 0%, ${config.theme?.colors?.secondary || safeConfig.theme?.colors?.secondary || '#e11d48'} 100%)`,
        color: 'white'
      }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="ornament w-full h-8 mb-8 opacity-50"></div>
          <h3 className="text-2xl font-serif font-bold mb-4 flex items-center justify-center gap-3">
            <span>{safeConfig.couple.groomName}</span>
            <span className="mx-1" style={{ color: config.theme?.colors?.accent || '#f59e0b' }}>∞</span>
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