import { useState, useEffect } from "react";

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
        <div className="flex justify-center space-x-8">
          <button
            onClick={() => scrollToSection("hero")}
            className="text-charcoal hover:text-softGold transition-colors duration-300 font-medium"
            data-testid="nav-hero"
          >
            Գլխավոր
          </button>
          <button
            onClick={() => scrollToSection("countdown")}
            className="text-charcoal hover:text-softGold transition-colors duration-300 font-medium"
            data-testid="nav-countdown"
          >
            Հաշվարկ
          </button>
          <button
            onClick={() => scrollToSection("calendar")}
            className="text-charcoal hover:text-softGold transition-colors duration-300 font-medium"
            data-testid="nav-calendar"
          >
            Օրացույց
          </button>
          <button
            onClick={() => scrollToSection("locations")}
            className="text-charcoal hover:text-softGold transition-colors duration-300 font-medium"
            data-testid="nav-locations"
          >
            Վայրեր
          </button>
          <button
            onClick={() => scrollToSection("timeline")}
            className="text-charcoal hover:text-softGold transition-colors duration-300 font-medium"
            data-testid="nav-timeline"
          >
            Ծրագիր
          </button>
          <button
            onClick={() => scrollToSection("rsvp")}
            className="text-charcoal hover:text-softGold transition-colors duration-300 font-medium"
            data-testid="nav-rsvp"
          >
            Հաստատում
          </button>
        </div>
      </div>
    </nav>
  );
}
