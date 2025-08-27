import { weddingConfig } from "@/config/wedding-config";

export default function Navigation() {

  return (
    <nav 
      className="fixed top-0 w-full z-50 bg-cream/95 backdrop-blur-sm shadow-sm"
      data-testid="navigation"
    >
      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Couple Names Only */}
        <div className="flex justify-center">
          <span className="text-xl font-serif font-bold text-charcoal flex items-center gap-2">
            <span>{weddingConfig.couple.groomName}</span>
            <span className="text-softGold mx-1">∞</span>
            <span>{weddingConfig.couple.brideName}</span>
          </span>
        </div>
      </div>
    </nav>
  );
}
