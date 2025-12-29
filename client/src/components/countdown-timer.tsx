import { useCountdown } from "@/hooks/use-countdown";
import { weddingConfig } from "@/config/wedding-config";
import { WeddingConfig } from "@/templates/types";
import { useScrollAnimation, useStaggeredAnimation } from "@/hooks/use-scroll-animation";

interface CountdownTimerProps {
  config?: WeddingConfig;
}

export default function CountdownTimer({ config = weddingConfig }: CountdownTimerProps) {
  // Wedding date from configuration
  const weddingDate = new Date(config.wedding?.date || '2025-10-10');
  const { days, hours, minutes, seconds } = useCountdown(weddingDate);
  const titleRef = useScrollAnimation('animate-fade-in-scale');
  const countdownRef = useStaggeredAnimation(150);

  return (
    <section id="countdown" className="py-20">
      <div className="max-w-4xl mx-auto px-4 text-center">
        {/* Wedding Date Display */}
        <div ref={titleRef} className="mb-8 animate-on-scroll">
          {config.wedding?.displayDate && (
            <h2
              className="text-2xl md:text-3xl font-bold mb-2 armenian-text countdown-text"
            >
              {config.wedding.displayDate}
            </h2>
          )}
          {config.countdown?.subtitle && (
            <p
              className="text-sm md:text-base armenian-text countdown-text-muted"
            >
              {config.countdown.subtitle}
            </p>
          )}
        </div>

        {/* Countdown Numbers */}
        <div
          ref={countdownRef}
          className="flex justify-center items-center space-x-4 md:space-x-8"
        >
          <div className="text-center animate-on-scroll">
            <div
              className="text-4xl md:text-6xl font-bold countdown-numbers mb-1"
            >
              {days.toString().padStart(2, "0")}
            </div>
            {config.countdown?.labels?.days && (
              <div className="text-sm md:text-base armenian-text countdown-text-muted">
                {config.countdown.labels.days}
              </div>
            )}
          </div>

          <div className="text-center animate-on-scroll">
            <div
              className="text-4xl md:text-6xl font-bold countdown-numbers mb-1"
            >
              {hours.toString().padStart(2, "0")}
            </div>
            {config.countdown?.labels?.hours && (
              <div className="text-sm md:text-base armenian-text countdown-text-muted">
                {config.countdown.labels.hours}
              </div>
            )}
          </div>

          <div className="text-center animate-on-scroll">
            <div
              className="text-4xl md:text-6xl font-bold countdown-numbers mb-1"
            >
              {minutes.toString().padStart(2, "0")}
            </div>
            {config.countdown?.labels?.minutes && (
              <div className="text-sm md:text-base armenian-text countdown-text-muted">
                {config.countdown.labels.minutes}
              </div>
            )}
          </div>

          <div className="text-center animate-on-scroll">
            <div
              className="text-4xl md:text-6xl font-bold countdown-numbers mb-1"
            >
              {seconds.toString().padStart(2, "0")}
            </div>
            {config.countdown?.labels?.seconds && (
              <div className="text-sm md:text-base armenian-text countdown-text-muted">
                {config.countdown.labels.seconds}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
