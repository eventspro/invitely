import { useState } from "react";
import { Play, Pause } from "lucide-react";

export default function HeroSection() {
  const [isPlaying, setIsPlaying] = useState(false);

  const toggleMusic = () => {
    setIsPlaying(!isPlaying);
    // TODO: Implement actual music playback when audio file is provided
  };

  return (
    <section id="hero" className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-lightGold/20 to-sageGreen/10"></div>
      <div className="absolute top-20 left-10 w-32 h-32 bg-softGold/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-sageGreen/10 rounded-full blur-xl"></div>
      
      <div className="max-w-4xl mx-auto px-4 text-center relative z-10 animate-fade-in">
        <div className="ornament w-full h-8 mb-8"></div>
        
        {/* Overlapping Couple Images */}
        <div className="relative flex justify-center items-center mb-8 h-64 md:h-80">
          {/* Main larger image */}
          <img 
            src="@assets/image_1755880620916.png" 
            alt="Հարություն և Տաթև" 
            className="w-48 h-60 md:w-64 md:h-80 object-cover rounded-lg shadow-xl ring-4 ring-softGold/30 transform hover:scale-105 transition-transform duration-300 z-10" 
            data-testid="img-main-couple"
          />
          {/* Smaller rotated overlapping image */}
          <img 
            src="@assets/image_1755880788893.png" 
            alt="Մանրամասներ" 
            className="absolute w-32 h-40 md:w-40 md:h-52 object-cover rounded-lg shadow-xl ring-4 ring-lightGold/40 transform rotate-12 -translate-x-6 translate-y-4 md:-translate-x-12 md:translate-y-6 hover:scale-105 transition-transform duration-300 z-20" 
            data-testid="img-detail-overlay"
          />
        </div>
        
        <h1 className="text-4xl md:text-6xl font-serif font-bold text-charcoal mb-4" data-testid="text-couple-names">
          Հարություն & Տաթև
        </h1>
        <p className="text-xl md:text-2xl text-charcoal/80 mb-8 font-light" data-testid="text-invitation">
          Հարսանեկան հրավիրատոմս
        </p>
        <p className="text-lg md:text-xl text-charcoal/70 max-w-2xl mx-auto leading-relaxed" data-testid="text-welcome-message">
          Մեզ համար մեծ պատիվ կլինի տեսնել ձեզ մեր կյանքի այս կարևոր օրվա կիսելիս:
          Գալիս ենք միասին տոնել սերն ու երջանկությունը:
        </p>
        
        {/* Music Player */}
        <div className="mt-8 flex justify-center">
          <button 
            onClick={toggleMusic}
            className="bg-softGold hover:bg-softGold/90 text-white px-6 py-3 rounded-full shadow-lg transition-all duration-300 flex items-center space-x-2"
            data-testid="button-music-toggle"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            <span>Երաժշտություն</span>
          </button>
        </div>
        
        <div className="ornament w-full h-8 mt-8"></div>
      </div>
    </section>
  );
}
