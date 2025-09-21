import { useState } from "react";
import { weddingConfig } from "@/config/wedding-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Lock } from "lucide-react";

interface MaintenanceModeProps {
  onPasswordCorrect: () => void;
}

export function MaintenanceMode({ onPasswordCorrect }: MaintenanceModeProps) {
  const [password, setPassword] = useState("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (password === weddingConfig.maintenance.password) {
      onPasswordCorrect();
    } else {
      setError(weddingConfig.maintenance.wrongPassword);
    }
    setIsLoading(false);
  };

  // Calculate days until wedding
  const weddingDate = new Date(weddingConfig.wedding.date);
  const today = new Date();
  const diffTime = weddingDate.getTime() - today.getTime();
  const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-cream-100 to-gold-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Decorative Hearts */}
        <div className="flex justify-center space-x-4 mb-8">
          <Heart className="w-8 h-8 text-gold-400 fill-current animate-pulse" />
          <Heart className="w-10 h-10 text-gold-500 fill-current animate-pulse" style={{ animationDelay: "0.5s" }} />
          <Heart className="w-8 h-8 text-gold-400 fill-current animate-pulse" style={{ animationDelay: "1s" }} />
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-playfair font-bold text-charcoal-900 leading-tight">
            {weddingConfig.maintenance.title}
          </h1>
          
          <p className="text-xl text-gold-600 font-medium">
            {weddingConfig.maintenance.subtitle}
          </p>

          <p className="text-lg text-charcoal-700 leading-relaxed max-w-sm mx-auto">
            {weddingConfig.maintenance.message}
          </p>

          {/* Wedding Countdown */}
          {daysUntil > 0 && (
            <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6 border border-gold-200 shadow-sm">
              <p className="text-sm text-charcoal-600 mb-2">{weddingConfig.maintenance.countdownText}</p>
              <div className="text-3xl font-bold text-gold-600">
                {daysUntil} {weddingConfig.countdown?.labels?.days}
              </div>
            </div>
          )}
        </div>

        {/* Password Section */}
        <div className="space-y-4">
          {!showPasswordInput ? (
            <Button
              onClick={() => setShowPasswordInput(true)}
              variant="outline"
              className="bg-white/70 border-gold-300 text-charcoal-700 hover:bg-gold-50 transition-all duration-300"
              data-testid="show-password-input"
            >
              <Lock className="w-4 h-4 mr-2" />
              {weddingConfig.maintenance.enterPassword}
            </Button>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-charcoal-600">
                  {weddingConfig.maintenance.passwordPrompt}
                </p>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="text-center bg-white/70 border-gold-300 focus:border-gold-400 focus:ring-gold-400"
                  data-testid="password-input"
                  autoFocus
                />
                {error && (
                  <p className="text-sm text-red-500 font-medium" data-testid="error-message">
                    {error}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={isLoading || !password}
                  className="flex-1 bg-gold-500 hover:bg-gold-600 text-white transition-all duration-300"
                  data-testid="submit-password"
                >
                  {isLoading ? "..." : "Մուտք"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowPasswordInput(false);
                    setPassword("");
                    setError("");
                  }}
                  className="bg-white/70 border-gold-300 text-charcoal-700 hover:bg-gold-50"
                  data-testid="cancel-password"
                >
                  Չեղարկել
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="pt-8 text-sm text-charcoal-500">
          <p>Հարութ ∞ Տաթև</p>
          <p className="mt-1">{weddingConfig.wedding.displayDate}</p>
        </div>
      </div>
    </div>
  );
}