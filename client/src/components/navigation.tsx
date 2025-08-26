import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { weddingConfig } from "@/config/wedding-config";
import heartImage from "@assets/heart-tattoo.jfif";

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    setIsMobileMenuOpen(false);
  };

  return (
    <nav 
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? "bg-cream/95 backdrop-blur-sm shadow-sm" : "bg-cream/95 backdrop-blur-sm"
      }`}
      data-testid="navigation"
    >
      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Mobile Menu Button */}
        <div className="md:hidden flex justify-between items-center">
          <span className="text-lg font-serif font-bold text-charcoal flex items-center gap-2">
            <span>{weddingConfig.couple.groomName}</span>
            <img 
              src={heartImage} 
              alt="Heart" 
              className="w-4 h-4 object-contain"
            />
            <span>{weddingConfig.couple.brideName}</span>
          </span>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-charcoal hover:text-softGold transition-colors"
            data-testid="mobile-menu-toggle"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex justify-center space-x-8">
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
        
        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-2 border-t border-charcoal/10 pt-4">
            <button
              onClick={() => scrollToSection("hero")}
              className="block w-full text-left text-charcoal hover:text-softGold transition-colors duration-300 font-medium py-2"
              data-testid="mobile-nav-hero"
            >
              {weddingConfig.navigation.home}
            </button>
            <button
              onClick={() => scrollToSection("countdown")}
              className="block w-full text-left text-charcoal hover:text-softGold transition-colors duration-300 font-medium py-2"
              data-testid="mobile-nav-countdown"
            >
              {weddingConfig.navigation.countdown}
            </button>
            <button
              onClick={() => scrollToSection("calendar")}
              className="block w-full text-left text-charcoal hover:text-softGold transition-colors duration-300 font-medium py-2"
              data-testid="mobile-nav-calendar"
            >
              {weddingConfig.navigation.calendar}
            </button>
            <button
              onClick={() => scrollToSection("locations")}
              className="block w-full text-left text-charcoal hover:text-softGold transition-colors duration-300 font-medium py-2"
              data-testid="mobile-nav-locations"
            >
              {weddingConfig.navigation.locations}
            </button>
            <button
              onClick={() => scrollToSection("timeline")}
              className="block w-full text-left text-charcoal hover:text-softGold transition-colors duration-300 font-medium py-2"
              data-testid="mobile-nav-timeline"
            >
              {weddingConfig.navigation.timeline}
            </button>
            <button
              onClick={() => scrollToSection("rsvp")}
              className="block w-full text-left text-charcoal hover:text-softGold transition-colors duration-300 font-medium py-2"
              data-testid="mobile-nav-rsvp"
            >
              {weddingConfig.navigation.rsvp}
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
