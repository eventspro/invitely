import { weddingConfig } from "@/config/wedding-config";
import type { WeddingConfig } from "@/templates/types";

interface NavigationProps {
  config?: WeddingConfig;
}

export default function Navigation({ config = weddingConfig }: NavigationProps) {
  return (
    <nav 
      className="fixed top-0 w-full z-50 bg-cream/95 backdrop-blur-sm shadow-sm"
      data-testid="navigation"
    >
      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Couple Names Only */}
        <div className="flex justify-center">
          <span className="text-xl font-serif font-bold text-charcoal flex items-center gap-2">
            <span>{config.couple?.groomName || "Groom"}</span>
            <span className="text-softGold mx-1">∞</span>
            <span>{config.couple?.brideName || "Bride"}</span>
          </span>
        </div>
      </div>
    </nav>
  );
}
