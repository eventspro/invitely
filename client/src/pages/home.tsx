import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import CountdownTimer from "@/components/countdown-timer";
import CalendarSection from "@/components/calendar-section";
import LocationsSection from "@/components/locations-section";
import TimelineSection from "@/components/timeline-section";
import RsvpSection from "@/components/rsvp-section";
import PhotoSection from "@/components/photo-section";
import MapModal from "@/components/map-modal";
import { weddingConfig } from "@/config/wedding-config";
import heartImage from "@assets/heart-tattoo.jfif";

export default function Home() {
  return (
    <div className="min-h-screen bg-cream text-charcoal">
      <Navigation />
      <main>
        <HeroSection />
        <CountdownTimer />
        <CalendarSection />
        <LocationsSection />
        <TimelineSection />
        <RsvpSection />
        <PhotoSection />
      </main>
      
      {/* Footer */}
      <footer className="bg-charcoal text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="ornament w-full h-8 mb-8 opacity-50"></div>
          <h3 className="text-2xl font-serif font-bold mb-4 flex items-center justify-center gap-3">
            <span>{weddingConfig.couple.groomName}</span>
            <span className="text-softGold mx-1">∞</span>
            <span>{weddingConfig.couple.brideName}</span>
          </h3>
          <p className="text-white/70 mb-6">{weddingConfig.footer.thankYouMessage}</p>
          <p className="text-white/50 text-sm">{weddingConfig.wedding.displayDate}</p>
        </div>
      </footer>

      <MapModal />
    </div>
  );
}
