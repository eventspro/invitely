import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";
import { weddingConfig } from "@/config/wedding-config";
import couplePhoto from "@assets/primary_1755896240450.jpg";
import detailPhoto from "@assets/Blog_Banner_Left_Hand_Story_1755890185205.webp";

export default function HeroSection() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element
    audioRef.current = new Audio();
    // You can replace this with your own music file path
    // Add your music file to client/public/audio/ folder
    audioRef.current.src = "/audio/wedding-music.mp3"; // Change this to your music file name
    
    audioRef.current.loop = true;
    audioRef.current.volume = 0.3; // Set volume to 30%
    
    audioRef.current.addEventListener('canplaythrough', () => {
      setAudioLoaded(true);
    });
    
    audioRef.current.addEventListener('error', () => {
      console.log('Audio file not found or failed to load');
      setAudioLoaded(false);
    });

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const toggleMusic = async () => {
    if (!audioRef.current) return;
    
    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.log('Audio playback failed:', error);
      alert('Չհաջողվեց միացնել երաժշտությունը: Խնդրում ենք ստուգել, որ մուսիկական ֆայլը գոյություն ունի:');
    }
  };

  return (
    <section
      id="hero"
      className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-lightGold/20 to-sageGreen/10"></div>
      <div className="absolute top-20 left-10 w-32 h-32 bg-softGold/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-sageGreen/10 rounded-full blur-xl"></div>

      <div className="max-w-4xl mx-auto px-4 text-center relative z-10 animate-fade-in">
        <div className="ornament w-full h-8 mb-8"></div>

        {/* Overlapping Couple Images */}
        <div className="relative flex justify-center items-center mb-8 h-96 md:h-[600px]">
          {/* Main larger image */}
          <img
            src={couplePhoto}
            alt="Հարություն և Տաթև"
            className="w-80 h-96 md:w-96 md:h-[500px] object-cover rounded-lg shadow-xl ring-4 ring-softGold/30 transform hover:scale-105 transition-transform duration-300 z-10"
            data-testid="img-main-couple"
          />
          {/* Smaller rotated overlapping image */}
        </div>

        <h1
          className="text-4xl md:text-6xl font-serif font-bold text-charcoal mb-4"
          data-testid="text-couple-names"
        >
          {weddingConfig.couple.combinedNames}
        </h1>
        <p
          className="text-xl md:text-2xl text-charcoal/80 mb-8 font-light"
          data-testid="text-invitation"
        >
          {weddingConfig.hero.title}
        </p>
        <p
          className="text-lg md:text-xl text-charcoal/70 max-w-2xl mx-auto leading-relaxed"
          data-testid="text-welcome-message"
        >
          {weddingConfig.hero.welcomeMessage}
        </p>

        {/* Music Player */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={toggleMusic}
            className="bg-softGold hover:bg-softGold/90 text-white px-6 py-3 rounded-full shadow-lg transition-all duration-300 flex items-center space-x-2"
            data-testid="button-music-toggle"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
            <span>{weddingConfig.hero.musicButton}</span>
          </button>
        </div>

        <div className="ornament w-full h-8 mt-8"></div>
      </div>
    </section>
  );
}
