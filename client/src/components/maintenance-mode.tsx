import { useState } from "react";
import { weddingConfig } from "@/config/wedding-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Lock } from "lucide-react";

interface MaintenanceConfig {
  password?: string;
  title?: string;
  subtitle?: string;
  message?: string;
  countdownText?: string;
  passwordPrompt?: string;
  wrongPassword?: string;
  enterPassword?: string;
}

interface MaintenanceModeProps {
  onPasswordCorrect: () => void;
  config?: MaintenanceConfig;
  weddingDate?: string;
  weddingDisplayDate?: string;
  coupleName?: string;
}

export function MaintenanceMode({ onPasswordCorrect, config, weddingDate: weddingDateProp, weddingDisplayDate, coupleName }: MaintenanceModeProps) {
  const [password, setPassword] = useState("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Merge template config over defaults
  const cfg = {
    password: config?.password ?? weddingConfig.maintenance.password,
    title: config?.title || weddingConfig.maintenance.title,
    subtitle: config?.subtitle || weddingConfig.maintenance.subtitle,
    message: config?.message || weddingConfig.maintenance.message,
    countdownText: config?.countdownText || weddingConfig.maintenance.countdownText,
    passwordPrompt: config?.passwordPrompt || weddingConfig.maintenance.passwordPrompt,
    wrongPassword: config?.wrongPassword || weddingConfig.maintenance.wrongPassword,
    enterPassword: config?.enterPassword || weddingConfig.maintenance.enterPassword,
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (password === cfg.password) {
      onPasswordCorrect();
    } else {
      setError(cfg.wrongPassword);
    }
    setIsLoading(false);
  };

  // Calculate days until wedding
  const dateStr = weddingDateProp || weddingConfig.wedding.date;
  const weddingDateObj = new Date(dateStr);
  const today = new Date();
  const diffTime = weddingDateObj.getTime() - today.getTime();
  const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const displayDate = weddingDisplayDate || weddingConfig.wedding.displayDate;
  const displayCoupleName = coupleName || `${weddingConfig.couple?.groomName ?? ''} ∞ ${weddingConfig.couple?.brideName ?? ''}`;

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
            {cfg.title}
          </h1>
          
          <p className="text-xl text-gold-600 font-medium">
            {cfg.subtitle}
          </p>

          <p className="text-lg text-charcoal-700 leading-relaxed max-w-sm mx-auto">
            {cfg.message}
          </p>

          {/* Wedding Countdown */}
          {daysUntil > 0 && (
            <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6 border border-gold-200 shadow-sm">
              <p className="text-sm text-charcoal-600 mb-2">{cfg.countdownText}</p>
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
              {cfg.enterPassword}
            </Button>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-charcoal-600">
                  {cfg.passwordPrompt}
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
          <p>{displayCoupleName}</p>
          <p className="mt-1">{displayDate}</p>
        </div>
      </div>
    </div>
  );
}
