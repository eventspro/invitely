import { useState, useEffect } from "react";
import { weddingConfig } from "@/config/wedding-config";

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <nav 
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? "bg-cream/95 backdrop-blur-sm shadow-sm" : "bg-cream/95 backdrop-blur-sm"
      }`}
      data-testid="navigation"
    >
      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Navigation */}
        <div className="flex justify-center space-x-8">
          <button
            onClick={() => scrollToSection("hero")}
            className="text-charcoal hover:text-softGold transition-colors duration-300 font-medium"
            data-testid="nav-hero"
          >
            {weddingConfig.navigation.home}
          </button>
          <button
            onClick={() => scrollToSection("countdown")}
            className="text-charcoal hover:text-softGold transition-colors duration-300 font-medium"
            data-testid="nav-countdown"
          >
            {weddingConfig.navigation.countdown}
          </button>
          <button
            onClick={() => scrollToSection("calendar")}
            className="text-charcoal hover:text-softGold transition-colors duration-300 font-medium"
            data-testid="nav-calendar"
          >
            {weddingConfig.navigation.calendar}
          </button>
          <button
            onClick={() => scrollToSection("locations")}
            className="text-charcoal hover:text-softGold transition-colors duration-300 font-medium"
            data-testid="nav-locations"
          >
            {weddingConfig.navigation.locations}
          </button>
          <button
            onClick={() => scrollToSection("timeline")}
            className="text-charcoal hover:text-softGold transition-colors duration-300 font-medium"
            data-testid="nav-timeline"
          >
            {weddingConfig.navigation.timeline}
          </button>
          <button
            onClick={() => scrollToSection("rsvp")}
            className="text-charcoal hover:text-softGold transition-colors duration-300 font-medium"
            data-testid="nav-rsvp"
          >
            {weddingConfig.navigation.rsvp}
          </button>
        </div>
      </div>
    </nav>
  );
}
