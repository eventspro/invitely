// Nature Template Component
// Based on Pro template structure with green/earth tone color scheme

import React from "react";
import type { WeddingConfig } from "../types";
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
}

export default function NatureTemplate({ config }: NatureTemplateProps) {
  const sections = config.sections || {};

  // Provide fallback values for missing config properties
  const safeConfig = {
    ...config,
    couple: config.couple || { groomName: "Groom", brideName: "Bride" },
    footer: config.footer || { thankYouMessage: "Thank you for celebrating with us" },
    wedding: config.wedding || { displayDate: "Wedding Day" }
  };

  return (
    <div className="min-h-screen text-gray-800" style={{
      background: `linear-gradient(135deg, ${config.theme?.colors?.background || '#f7f8f7'} 0%, #ecfdf5 100%)`
    }}>
      <Navigation config={safeConfig} />
      <main>
        {sections.hero?.enabled !== false && <HeroSection config={safeConfig} />}
        {sections.countdown?.enabled !== false && <CountdownTimer config={safeConfig} />}
        {sections.calendar?.enabled !== false && <CalendarSection config={safeConfig} />}
        {sections.locations?.enabled !== false && <LocationsSection config={safeConfig} />}
        {sections.timeline?.enabled !== false && <TimelineSection config={safeConfig} />}
        {sections.rsvp?.enabled !== false && <RsvpSection config={safeConfig} />}
        {sections.photos?.enabled !== false && <PhotoSection config={safeConfig} />}
      </main>
      
      {/* Footer */}
      <footer className="py-12" style={{
        background: `linear-gradient(135deg, ${config.theme?.colors?.primary || '#166534'} 0%, ${config.theme?.colors?.secondary || '#15803d'} 100%)`,
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
