import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, ChevronLeft, ChevronRight } from "lucide-react";
import { weddingConfig } from "@/config/wedding-config";
import { WeddingConfig } from "@/templates/types";
import { getHeadingFont, getBodyFont, getArmenianTextStyles, containsArmenianText } from "@/utils/font-utils";
import { useArmenianFont } from "@/hooks/useArmenianFont";
import couplePhoto from "@assets/couple11.jpg";
import detailPhoto from "@assets/Blog_Banner_Left_Hand_Story_1755890185205.webp";
import heartImage from "@assets/heart-tattoo.jfif";
import weddingMusic from "@assets/Indila - Love Story_1756335711694.mp3";

interface HeroSectionProps {
  config?: WeddingConfig;
}

export default function HeroSection({ config = weddingConfig }: HeroSectionProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const isDragging = useRef(false);

  // Armenian text optimization
  const invitationText = config.hero?.invitation || 'Հրավիրում ենք մեր հարսանիքին';
  const welcomeText = config.hero?.welcomeMessage || 'Join us as we celebrate our love and begin our journey together as husband and wife.';
  const musicButtonText = config.hero?.musicButton || 'Play Music';
  
  const invitationRef = useArmenianFont<HTMLParagraphElement>(invitationText, config.theme?.fonts?.body);
  const welcomeRef = useArmenianFont<HTMLParagraphElement>(welcomeText, config.theme?.fonts?.body);
  const musicButtonRef = useArmenianFont<HTMLSpanElement>(musicButtonText, config.theme?.fonts?.body);

  // Get hero images - use uploaded images or fallback to static import
  const heroImages = config.hero?.images && config.hero.images.length > 0 
    ? config.hero.images 
    : [couplePhoto];
  
  const hasMultipleImages = heroImages.length > 1;

  // Slider navigation functions
  const nextSlide = useCallback(() => {
    setCurrentSlide(prev => (prev + 1) % heroImages.length);
  }, [heroImages.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide(prev => (prev - 1 + heroImages.length) % heroImages.length);
  }, [heroImages.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

  // Touch/swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
    isDragging.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartX.current) return;
    
    touchEndX.current = e.targetTouches[0].clientX;
    const distance = Math.abs(touchStartX.current - touchEndX.current);
    
    // Consider it dragging if moved more than 10px
    if (distance > 10) {
      isDragging.current = true;
      // Prevent default scrolling behavior during swipe
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX.current || !touchEndX.current || !hasMultipleImages) {
      touchStartX.current = null;
      touchEndX.current = null;
      isDragging.current = false;
      return;
    }
    
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 30; // Reduced threshold for easier swiping
    
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextSlide();
      handleUserInteraction();
    } else if (isRightSwipe) {
      prevSlide();
      handleUserInteraction();
    }

    touchStartX.current = null;
    touchEndX.current = null;
    isDragging.current = false;
  };

  // Mouse/desktop swipe handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    touchStartX.current = e.clientX;
    touchEndX.current = null;
    isDragging.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!touchStartX.current) return;
    
    touchEndX.current = e.clientX;
    const distance = Math.abs(touchStartX.current - touchEndX.current);
    
    if (distance > 10) {
      isDragging.current = true;
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!touchStartX.current || !touchEndX.current || !hasMultipleImages) {
      touchStartX.current = null;
      touchEndX.current = null;
      isDragging.current = false;
      return;
    }
    
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;
    
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextSlide();
      handleUserInteraction();
    } else if (isRightSwipe) {
      prevSlide();
      handleUserInteraction();
    }

    touchStartX.current = null;
    touchEndX.current = null;
    isDragging.current = false;
  };

  // Auto-play functionality
  useEffect(() => {
    if (hasMultipleImages && isAutoPlaying) {
      autoPlayRef.current = setInterval(() => {
        nextSlide();
      }, 5000); // Change slide every 5 seconds
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [hasMultipleImages, isAutoPlaying, nextSlide]);

  // Pause auto-play on user interaction
  const handleUserInteraction = () => {
    setIsAutoPlaying(false);
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
    // Resume auto-play after 10 seconds of no interaction
    setTimeout(() => {
      setIsAutoPlaying(true);
    }, 10000);
  };

  useEffect(() => {
    // Create audio element
    audioRef.current = new Audio();
    // Using Indila - Love Story for background music
    audioRef.current.src = weddingMusic;

    audioRef.current.loop = true;
    audioRef.current.volume = 0.3; // Set volume to 30%

    audioRef.current.addEventListener("canplaythrough", () => {
      setAudioLoaded(true);
    });

    audioRef.current.addEventListener("error", () => {
      console.log("Audio file not found or failed to load");
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
      console.log("Audio playback failed:", error);
      alert(
        "Չհաջողվեց միացնել երաժշտությունը: Խնդրում ենք ստուգել, որ մուսիկական ֆայլը գոյություն ունի:",
      );
    }
  };

  return (
    <section
      id="hero"
      className="min-h-[75vh] h-[75vh] md:min-h-screen md:h-screen lg:h-[120vh] flex items-center justify-center relative overflow-hidden pt-20"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-lightGold/20 to-sageGreen/10"></div>
      <div className="absolute top-20 left-10 w-32 h-32 bg-softGold/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-sageGreen/10 rounded-full blur-xl"></div>

      {/* Hero Image Slider */}
      <div 
        className="absolute inset-0 w-full h-full select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ touchAction: 'pan-y pinch-zoom' }}
        data-testid="hero-slider"
      >
        {heroImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              backgroundImage: `url(${image})`
            }}
            data-testid={index === 0 ? "bg-main-couple" : `bg-hero-${index}`}
          />
        ))}
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      {/* Navigation Arrows - Only show if multiple images and hidden on mobile */}
      {hasMultipleImages && (
        <>
          <button
            onClick={() => {
              prevSlide();
              handleUserInteraction();
            }}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-3 rounded-full transition-all duration-300 opacity-70 hover:opacity-100 hidden md:block"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button
            onClick={() => {
              nextSlide();
              handleUserInteraction();
            }}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-3 rounded-full transition-all duration-300 opacity-70 hover:opacity-100 hidden md:block"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Slide Indicators - Only show if multiple images */}
      {hasMultipleImages && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex space-x-2">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                goToSlide(index);
                handleUserInteraction();
              }}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'bg-white shadow-lg' 
                  : 'bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 text-center relative z-10 animate-fade-in mt-16">
        <div className="ornament w-full h-8 mb-8"></div>

        <h1
          className="text-4xl md:text-6xl font-serif font-bold text-white mb-4 flex items-center justify-center flex-wrap gap-3 drop-shadow-lg"
          style={{ fontFamily: getHeadingFont(config.theme?.fonts) }}
          data-testid="text-couple-names"
        >
          <span>{config.couple?.groomName || 'Groom'}</span>
          <span className="mx-1" style={{ color: config.theme?.colors?.accent || '#e8d5b7' }}>∞</span>
          <span>{config.couple?.brideName || 'Bride'}</span>
        </h1>
        <p
          ref={invitationRef}
          className="text-xl md:text-2xl text-white/90 mb-8 font-light drop-shadow-lg"
          style={{ 
            fontFamily: getBodyFont(config.theme?.fonts),
            ...(containsArmenianText(invitationText) ? getArmenianTextStyles(config.theme?.fonts?.body) : {})
          }}
          data-testid="text-invitation"
        >
          {invitationText}
        </p>
        <p
          ref={welcomeRef}
          className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed drop-shadow-lg"
          style={{ 
            fontFamily: getBodyFont(config.theme?.fonts),
            ...(containsArmenianText(welcomeText) ? getArmenianTextStyles(config.theme?.fonts?.body) : {})
          }}
          data-testid="text-welcome-message"
        >
          {welcomeText}
        </p>

        {/* Music Player */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={toggleMusic}
            className="text-white px-6 py-3 rounded-full shadow-lg transition-all duration-300 flex items-center space-x-2"
            style={{
              backgroundColor: config.theme?.colors?.primary || '#831843',
              borderColor: config.theme?.colors?.primary || '#831843'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${config.theme?.colors?.primary || '#831843'}dd`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = config.theme?.colors?.primary || '#831843';
            }}
            data-testid="button-music-toggle"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
            <span 
              ref={musicButtonRef}
              style={{ 
                fontFamily: getBodyFont(config.theme?.fonts),
                ...(containsArmenianText(musicButtonText) ? getArmenianTextStyles(config.theme?.fonts?.body) : {})
              }}
            >
              {musicButtonText}
            </span>
          </button>
        </div>

        <div className="ornament w-full h-8 mt-8"></div>
      </div>
    </section>
  );
}
