import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.pageYOffset > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-8 right-8 bg-softGold hover:bg-softGold/90 text-white p-4 rounded-full shadow-lg transition-all duration-300 animate-bounce-gentle ${
        isVisible ? "scale-100" : "scale-0"
      }`}
      data-testid="button-scroll-to-top"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
}
