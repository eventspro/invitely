import { Clock, MapPin, Users, Music, Church, Camera, Car, Utensils, Heart, PartyPopper } from "lucide-react";
import { weddingConfig } from "@/config/wedding-config";
import type { WeddingConfig } from "@/templates/types";
import { getHeadingFont, getBodyFont } from "@/utils/font-utils";
import {
  useScrollAnimation,
  useStaggeredAnimation,
} from "@/hooks/use-scroll-animation";

interface TimelineSectionProps {
  config?: WeddingConfig;
}

export default function TimelineSection({ config }: TimelineSectionProps) {
  // Use passed config or fallback to default
  const sectionConfig = config || (weddingConfig as WeddingConfig);
  const themeColors = sectionConfig.theme?.colors;
  
  // Professional wedding icons mapping
  const getWeddingIcon = (event: any, index: number) => {
    const iconStyle = { color: 'white', fontSize: '24px' };
    
    // Map specific events to professional Lucide icons
    if (event.title?.includes('Պսակադրություն') || event.title?.includes('Ceremony')) {
      return <Church className="w-6 h-6 text-white" />;
    }
    if (event.title?.includes('Նկարահանում') || event.title?.includes('Photography')) {
      return <Camera className="w-6 h-6 text-white" />;
    }
    if (event.title?.includes('Շարժում') || event.title?.includes('Transportation')) {
      return <Car className="w-6 h-6 text-white" />;
    }
    if (event.title?.includes('Կոկտեյլ') || event.title?.includes('Cocktail')) {
      return (
        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M5 8V6h14v2l-7 7-7-7zM12 16l-2-2h4l-2 2zM7 4h10v1H7V4zM8 19h8v1H8v-1z"/>
        </svg>
      );
    }
    if (event.title?.includes('ընթրիք') || event.title?.includes('Dinner')) {
      return <Utensils className="w-6 h-6 text-white" />;
    }
    if (event.title?.includes('պար') || event.title?.includes('Dance')) {
      return <Heart className="w-6 h-6 text-white" />;
    }
    if (event.title?.includes('տոն') || event.title?.includes('Celebration')) {
      return <PartyPopper className="w-6 h-6 text-white" />;
    }
    if (event.title?.includes('Գիշեր') || event.title?.includes('Night')) {
      return (
        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
        </svg>
      );
    }
    
    // If custom emoji icon exists, display it with professional styling
    if (event.icon) {
      return (
        <div className="text-lg text-white font-medium">
          {event.icon}
        </div>
      );
    }
    
    // Default fallback icons
    const defaultIcons = [
      <Church className="w-6 h-6 text-white" />,
      <Camera className="w-6 h-6 text-white" />,
      <Users className="w-6 h-6 text-white" />,
      <Music className="w-6 h-6 text-white" />,
    ];
    
    return defaultIcons[index % defaultIcons.length];
  };

  const titleRef = useScrollAnimation("animate-slide-up");
  const cardsRef = useStaggeredAnimation(200);

  return (
    <section
      id="timeline"
      className="py-24 bg-gradient-to-br from-softGold/10 via-lightGold/15 to-warmBeige/20 relative overflow-hidden"
    >
      <div className="max-w-6xl mx-auto px-4">
        {/* Title */}
        <div ref={titleRef} className="text-center mb-20 animate-on-scroll">
          <h2
            className="text-5xl md:text-6xl text-charcoal mb-8"
            style={{
              fontFamily: "Playfair Display, serif",
              fontWeight: "300"
            }}
            data-testid="text-timeline-title"
          >
            {sectionConfig.timeline?.title}
          </h2>
          <div className="w-24 h-0.5 mx-auto mb-8" style={{ backgroundColor: themeColors?.primary }}></div>
        </div>

        {/* Timeline Cards */}
        <div
          ref={cardsRef}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {(sectionConfig.timeline?.events || []).map((event, index) => (
            <div
              key={index}
              className="group relative animate-on-scroll"
              data-testid={`timeline-event-${index}`}
            >
              {/* Card */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-softGold/20 hover:shadow-2xl hover:scale-105 transition-all duration-500 relative overflow-hidden">
                {/* Background Pattern */}
                <div 
                  className="absolute top-0 right-0 w-20 h-20 rounded-bl-full"
                  style={{ 
                    background: themeColors?.accent && themeColors?.primary ? `linear-gradient(135deg, ${themeColors.accent}20 0%, ${themeColors.primary}20 100%)` : undefined
                  }}
                ></div>

                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300"
                    style={{ 
                      background: themeColors?.primary && themeColors?.secondary ? `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%)` : undefined
                    }}
                  >
                    {getWeddingIcon(event, index)}
                  </div>
                </div>

                {/* Content */}
                <div className="text-center space-y-4">
                  <div
                    className="text-3xl md:text-4xl font-light text-charcoal"
                    style={{ 
                      fontFamily: getHeadingFont(sectionConfig.theme?.fonts)
                    }}
                    data-testid={`timeline-time-${index}`}
                  >
                    {event.time}
                  </div>

                  <div
                    className="text-xl font-semibold text-charcoal"
                    data-testid={`timeline-title-${index}`}
                  >
                    {event.title}
                  </div>

                  {event.description && (
                    <div
                      className="text-sm leading-relaxed text-charcoal/70"
                      data-testid={`timeline-description-${index}`}
                    >
                      {event.description}
                    </div>
                  )}
                </div>

                {/* Step Number */}
              </div>

              {/* Connector Line (except last item) */}
              {index < (sectionConfig.timeline?.events?.length || 0) - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-softGold/50 to-lightGold/30 z-10"></div>
              )}
            </div>
          ))}
        </div>

        {/* Thank You Message After Timeline */}
        {sectionConfig.timeline?.afterMessage && (
          <div className="mt-20 text-center">
            <div
              className="text-2xl md:text-3xl mb-8 text-charcoal"
              style={{
                fontFamily: getHeadingFont(sectionConfig.theme?.fonts),
                fontWeight: "300"
              }}
              data-testid="timeline-thank-you"
            >
              {sectionConfig.timeline?.afterMessage?.thankYou}
            </div>

            <div className="w-24 h-0.5 bg-softGold mx-auto mb-8"></div>

            <div
              className="text-lg max-w-3xl mx-auto leading-relaxed bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-softGold/20 text-charcoal/60"
              style={{ 
                whiteSpace: "pre-line"
              }}
              data-testid="timeline-notes"
            >
              {sectionConfig.timeline?.afterMessage?.notes}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
