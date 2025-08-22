import { useCountdown } from "@/hooks/use-countdown";
import { weddingConfig } from "@/config/wedding-config";
import { useScrollAnimation, useStaggeredAnimation } from "@/hooks/use-scroll-animation";

export default function CountdownTimer() {
  // Wedding date from configuration
  const weddingDate = new Date(weddingConfig.wedding.date);
  const { days, hours, minutes, seconds } = useCountdown(weddingDate);
  const titleRef = useScrollAnimation('animate-fade-in-scale');
  const countdownRef = useStaggeredAnimation(150);

  return (
    <section id="countdown" className="relative py-20 overflow-hidden">
      {/* Romantic Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('@assets/image_1755881009663.png')",
        }}
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        {/* Wedding Date Display */}
        <div ref={titleRef} className="mb-8 animate-on-scroll">
          <h2
            className="text-2xl md:text-3xl font-bold text-white mb-2"
            data-testid="text-wedding-date"
          >
            {weddingConfig.wedding.displayDate}
          </h2>
          <p
            className="text-white/80 text-sm md:text-base"
            data-testid="text-wedding-subtitle"
          >
            {weddingConfig.countdown.subtitle}
          </p>
        </div>

        {/* Countdown Numbers */}
        <div
          ref={countdownRef}
          className="flex justify-center items-center space-x-4 md:space-x-8"
          data-testid="countdown-overlay"
        >
          <div className="text-center animate-on-scroll">
            <div
              className="text-4xl md:text-6xl font-bold text-white mb-1"
              data-testid="countdown-days"
            >
              {days.toString().padStart(2, "0")}
            </div>
            <div className="text-white/90 text-sm md:text-base">
              {weddingConfig.countdown.labels.days}
            </div>
          </div>

          <div className="text-center animate-on-scroll">
            <div
              className="text-4xl md:text-6xl font-bold text-white mb-1"
              data-testid="countdown-hours"
            >
              {hours.toString().padStart(2, "0")}
            </div>
            <div className="text-white/90 text-sm md:text-base">
              {weddingConfig.countdown.labels.hours}
            </div>
          </div>

          <div className="text-center animate-on-scroll">
            <div
              className="text-4xl md:text-6xl font-bold text-white mb-1"
              data-testid="countdown-minutes"
            >
              {minutes.toString().padStart(2, "0")}
            </div>
            <div className="text-white/90 text-sm md:text-base">
              {weddingConfig.countdown.labels.minutes}
            </div>
          </div>

          <div className="text-center animate-on-scroll">
            <div
              className="text-4xl md:text-6xl font-bold text-white mb-1"
              data-testid="countdown-seconds"
            >
              {seconds.toString().padStart(2, "0")}
            </div>
            <div className="text-white/90 text-sm md:text-base">
              {weddingConfig.countdown.labels.seconds}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
