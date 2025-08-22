import { weddingConfig } from "@/config/wedding-config";

export default function TimelineSection() {
  const timelineIcons = [
    // Wedding rings icon
    (
      <svg viewBox="0 0 60 60" className="w-12 h-12 text-charcoal/60" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="20" cy="30" r="10" />
        <circle cx="40" cy="30" r="10" />
        <rect x="18" y="22" width="4" height="3" fill="currentColor" />
      </svg>
    ),
    // Dining/plate icon
    (
      <svg viewBox="0 0 60 60" className="w-12 h-12 text-charcoal/60" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="30" cy="30" r="15" />
        <path d="M20 20 L20 25" />
        <path d="M30 18 L30 25" />
        <path d="M40 20 L40 25" />
      </svg>
    ),
    // Wedding cake icon
    (
      <svg viewBox="0 0 60 60" className="w-12 h-12 text-charcoal/60" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="15" y="40" width="30" height="12" />
        <rect x="20" y="30" width="20" height="10" />
        <rect x="25" y="22" width="10" height="8" />
        <path d="M30 22 L30 18" />
        <circle cx="30" cy="16" r="1.5" fill="currentColor" />
      </svg>
    ),
    // Champagne glasses icon
    (
      <svg viewBox="0 0 60 60" className="w-12 h-12 text-charcoal/60" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M20 20 L20 35 Q20 38 23 38 Q26 38 26 35 L26 20" />
        <path d="M34 20 L34 35 Q34 38 37 38 Q40 38 40 35 L40 20" />
        <path d="M15 20 L31 20" />
        <path d="M29 20 L45 20" />
      </svg>
    )
  ];

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
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-charcoal/20 transform -translate-x-1/2"></div>
          
          <div className="space-y-24">
            {weddingConfig.timeline.events.map((event, index) => {
              const isLeft = index % 2 === 0;
              
              return (
                <div 
                  key={index}
                  className={`relative flex items-center ${isLeft ? 'flex-row-reverse' : ''}`}
                  data-testid={`timeline-event-${index}`}
                >
                  {/* Content */}
                  <div className={`w-5/12 ${isLeft ? 'text-right pr-8' : 'text-left pl-8'}`}>
                    <div className="space-y-2">
                      <div className="text-2xl md:text-3xl font-light text-charcoal" 
                           style={{ fontFamily: 'Playfair Display, serif' }}
                           data-testid={`timeline-time-${index}`}>
                        {event.time}
                      </div>
                      <div className="text-lg md:text-xl text-charcoal/80 font-medium" 
                           data-testid={`timeline-title-${index}`}>
                        {event.title}
                      </div>
                      {event.description && (
                        <div className="text-charcoal/60 text-sm" 
                             data-testid={`timeline-description-${index}`}>
                          {event.description}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Icon in center */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 bg-white border-2 border-charcoal/20 rounded-full p-4">
                    {timelineIcons[index]}
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
