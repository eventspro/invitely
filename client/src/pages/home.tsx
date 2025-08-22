import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import CountdownTimer from "@/components/countdown-timer";
import CalendarSection from "@/components/calendar-section";
import LocationsSection from "@/components/locations-section";
import TimelineSection from "@/components/timeline-section";
import RsvpSection from "@/components/rsvp-section";
import PhotoSection from "@/components/photo-section";
import ScrollToTop from "@/components/scroll-to-top";
import MapModal from "@/components/map-modal";

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
          <h3 className="text-2xl font-serif font-bold mb-4">Հարություն & Տաթև</h3>
          <p className="text-white/70 mb-6">Շնորհակալություն մեզ հետ այս հատուկ օրը կիսելու համար</p>
          <p className="text-white/50 text-sm">Մարտ 15, 2024</p>
        </div>
      </footer>

      <ScrollToTop />
      <MapModal />
    </div>
  );
}
