import { weddingConfig } from "@/config/wedding-config";
import type { WeddingConfig } from "@/templates/types";

interface NavigationProps {
  config?: WeddingConfig;
}

export default function Navigation({ config = weddingConfig }: NavigationProps) {
  return (
    <nav 
      className="fixed top-0 w-full z-50 bg-transparent backdrop-blur-sm"
      data-testid="navigation"
    >
      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Couple Names Only */}
        {(config.couple?.groomName || config.couple?.brideName) && (
          <div className="flex justify-center">
            <span className="text-xl font-serif font-bold flex items-center gap-2 text-charcoal">
              {config.couple?.groomName && <span>{config.couple.groomName}</span>}
              {config.couple?.groomName && config.couple?.brideName && (
                <span className="mx-1" style={{ color: config.theme?.colors?.accent || config.theme?.colors?.primary }}>∞</span>
              )}
              {config.couple?.brideName && <span>{config.couple.brideName}</span>}
            </span>
          </div>
        )}
      </div>
    </nav>
  );
}
