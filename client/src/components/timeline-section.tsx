import { weddingConfig } from "@/config/wedding-config";

export default function TimelineSection() {
  const timelineIcons = [
    // Wedding rings icon
    (
      <svg viewBox="0 0 100 100" className="w-16 h-16 text-charcoal/70" fill="none" stroke="currentColor">
        <circle cx="35" cy="45" r="12" strokeWidth="1.5"/>
        <circle cx="65" cy="45" r="12" strokeWidth="1.5"/>
        <path d="M47 45 L53 45" strokeWidth="1.5"/>
        <circle cx="35" cy="38" r="2" fill="currentColor"/>
      </svg>
    ),
    // Dining/plate icon
    (
      <svg viewBox="0 0 100 100" className="w-16 h-16 text-charcoal/70" fill="none" stroke="currentColor">
        <circle cx="50" cy="50" r="20" strokeWidth="1.5"/>
        <path d="M45 30 L45 40" strokeWidth="1.5"/>
        <path d="M55 30 L55 40" strokeWidth="1.5"/>
        <path d="M50 25 L50 35" strokeWidth="1.5"/>
        <path d="M40 40 L60 40" strokeWidth="1.5"/>
      </svg>
    ),
    // Wedding cake icon
    (
      <svg viewBox="0 0 100 100" className="w-16 h-16 text-charcoal/70" fill="none" stroke="currentColor">
        <rect x="25" y="60" width="50" height="20" strokeWidth="1.5"/>
        <rect x="35" y="45" width="30" height="15" strokeWidth="1.5"/>
        <rect x="40" y="35" width="20" height="10" strokeWidth="1.5"/>
        <path d="M50 30 L50 25" strokeWidth="1.5"/>
        <circle cx="50" cy="23" r="2" fill="currentColor"/>
        <path d="M30 60 Q35 55 40 60" strokeWidth="1"/>
        <path d="M60 60 Q65 55 70 60" strokeWidth="1"/>
      </svg>
    ),
    // Champagne glasses icon
    (
      <svg viewBox="0 0 100 100" className="w-16 h-16 text-charcoal/70" fill="none" stroke="currentColor">
        <path d="M35 35 L35 50 Q35 55 40 55 Q45 55 45 50 L45 35" strokeWidth="1.5"/>
        <path d="M55 35 L55 50 Q55 55 60 55 Q65 55 65 50 L65 35" strokeWidth="1.5"/>
        <path d="M30 35 L50 35" strokeWidth="1.5"/>
        <path d="M50 35 L70 35" strokeWidth="1.5"/>
        <path d="M35 25 L45 35" strokeWidth="1"/>
        <path d="M55 25 L65 35" strokeWidth="1"/>
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
