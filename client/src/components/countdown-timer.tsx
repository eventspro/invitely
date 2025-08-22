import { useCountdown } from "@/hooks/use-countdown";

export default function CountdownTimer() {
  // Wedding date - August 18, 2024 at 3:00 PM (updated to match the reference screenshot)
  const weddingDate = new Date('2024-08-18T15:00:00');
  const { days, hours, minutes, seconds } = useCountdown(weddingDate);

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
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2" data-testid="text-wedding-date">
            18 ՕԳՈՍՏՈՍ 2024
          </h2>
          <p className="text-white/80 text-sm md:text-base" data-testid="text-wedding-subtitle">
            Ֆցր հարսանիքի ծանուցում ծանծգն է
          </p>
        </div>
        
        {/* Countdown Numbers */}
        <div className="flex justify-center items-center space-x-4 md:space-x-8" data-testid="countdown-overlay">
          <div className="text-center">
            <div className="text-4xl md:text-6xl font-bold text-white mb-1" data-testid="countdown-days">
              {days.toString().padStart(3, '0')}
            </div>
            <div className="text-white/90 text-sm md:text-base">օր</div>
          </div>
          
          <div className="text-center">
            <div className="text-4xl md:text-6xl font-bold text-white mb-1" data-testid="countdown-hours">
              {hours.toString().padStart(2, '0')}
            </div>
            <div className="text-white/90 text-sm md:text-base">ժամ</div>
          </div>
          
          <div className="text-center">
            <div className="text-4xl md:text-6xl font-bold text-white mb-1" data-testid="countdown-minutes">
              {minutes.toString().padStart(2, '0')}
            </div>
            <div className="text-white/90 text-sm md:text-base">րոպ</div>
          </div>
          
          <div className="text-center">
            <div className="text-4xl md:text-6xl font-bold text-white mb-1" data-testid="countdown-seconds">
              {seconds.toString().padStart(2, '0')}
            </div>
            <div className="text-white/90 text-sm md:text-base">վայրկ</div>
          </div>
        </div>
      </div>
    </section>
  );
}
