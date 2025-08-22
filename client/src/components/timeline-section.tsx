import { Clock, MapPin, Users, Music } from "lucide-react";
import { weddingConfig } from "@/config/wedding-config";
import { useScrollAnimation, useStaggeredAnimation } from "@/hooks/use-scroll-animation";

export default function TimelineSection() {
  const eventIcons = [
    <MapPin className="w-8 h-8" />,
    <Users className="w-8 h-8" />,
    <Music className="w-8 h-8" />,
    <Clock className="w-8 h-8" />,
  ];
  
  const titleRef = useScrollAnimation('animate-slide-up');
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
              fontStyle: "italic",
              fontWeight: "300",
            }}
            data-testid="text-timeline-title"
          >
            {weddingConfig.timeline.title}
          </h2>
          <div className="w-24 h-0.5 bg-softGold mx-auto mb-8"></div>
          <p className="text-charcoal/70 text-lg max-w-2xl mx-auto">
            Մանրամասն ծրագիր մեր հատուկ օրվա համար
          </p>
        </div>

        {/* Timeline Cards */}
        <div ref={cardsRef} className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {weddingConfig.timeline.events.map((event, index) => (
            <div
              key={index}
              className="group relative animate-on-scroll"
              data-testid={`timeline-event-${index}`}
            >
              {/* Card */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-softGold/20 hover:shadow-2xl hover:scale-105 transition-all duration-500 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-softGold/10 to-lightGold/20 rounded-bl-full"></div>

                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-softGold to-lightGold rounded-full flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                    {eventIcons[index]}
                  </div>
                </div>

                {/* Content */}
                <div className="text-center space-y-4">
                  <div
                    className="text-3xl md:text-4xl font-light text-charcoal"
                    style={{ fontFamily: "Playfair Display, serif" }}
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
                      className="text-charcoal/70 text-sm leading-relaxed"
                      data-testid={`timeline-description-${index}`}
                    >
                      {event.description}
                    </div>
                  )}
                </div>

                {/* Step Number */}
              </div>

              {/* Connector Line (except last item) */}
              {index < weddingConfig.timeline.events.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-softGold/50 to-lightGold/30 z-10"></div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom Message */}
      </div>
    </section>
  );
}
