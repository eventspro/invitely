import { weddingConfig } from "@/config/wedding-config";

export default function TimelineSection() {
  return (
    <section id="timeline" className="py-20 bg-white relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4">
        {/* Title */}
        <div className="text-center mb-20">
          <h2 className="text-6xl md:text-7xl text-charcoal/80 mb-8" 
              style={{ 
                fontFamily: 'Playfair Display, serif', 
                fontStyle: 'italic',
                fontWeight: '300'
              }}
              data-testid="text-timeline-title">
            {weddingConfig.timeline.title}
          </h2>
        </div>
        
        {/* Timeline */}
        <div className="relative">
          {/* Central vertical line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-charcoal/15 transform -translate-x-1/2"></div>
          
          <div className="space-y-20">
            {weddingConfig.timeline.events.map((event, index) => {
              const isLeft = index % 2 === 0;
              
              return (
                <div 
                  key={index}
                  className={`relative flex items-center ${isLeft ? 'flex-row-reverse' : ''}`}
                  data-testid={`timeline-event-${index}`}
                >
                  {/* Content */}
                  <div className={`w-5/12 ${isLeft ? 'text-right pr-12' : 'text-left pl-12'}`}>
                    <div className="space-y-3">
                      <div className="text-3xl md:text-4xl font-light text-charcoal" 
                           style={{ fontFamily: 'Playfair Display, serif' }}
                           data-testid={`timeline-time-${index}`}>
                        {event.time}
                      </div>
                      <div className="text-lg md:text-xl text-charcoal/80 font-medium" 
                           data-testid={`timeline-title-${index}`}>
                        {event.title}
                      </div>
                      {event.description && (
                        <div className="text-charcoal/60 text-base" 
                             data-testid={`timeline-description-${index}`}>
                          {event.description}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Simple elegant dot in center */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 bg-white border-3 border-charcoal/30 rounded-full w-6 h-6 shadow-sm">
                    <div className="absolute inset-2 bg-charcoal/20 rounded-full"></div>
                  </div>
                  
                  {/* Empty space for other side */}
                  <div className="w-5/12"></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
