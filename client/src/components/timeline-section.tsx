export default function TimelineSection() {
  const timelineEvents = [
    {
      time: "13:00",
      title: "Պսակադրություն",
      description: "Նուր Նարգիզ ծետալթեր",
      icon: (
        <svg viewBox="0 0 100 100" className="w-12 h-12 text-charcoal/60" fill="currentColor">
          <circle cx="30" cy="40" r="15" fill="none" stroke="currentColor" strokeWidth="2"/>
          <circle cx="70" cy="40" r="15" fill="none" stroke="currentColor" strokeWidth="2"/>
          <path d="M30 55 Q50 75 70 55" fill="none" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    },
    {
      time: "17:00", 
      title: "Հանդիսական խանութարկարգ",
      description: " Hannah Garden Hall",
      icon: (
        <svg viewBox="0 0 100 100" className="w-12 h-12 text-charcoal/60" fill="currentColor">
          <rect x="20" y="50" width="60" height="30" fill="none" stroke="currentColor" strokeWidth="2"/>
          <path d="M30 50 L35 45 L40 50 M50 50 L55 45 L60 50 M70 50 L75 45 L80 50" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        </svg>
      )
    },
    {
      time: "21:30",
      title: "Հանդիսական ընդունելություն",
      description: "",
      icon: (
        <svg viewBox="0 0 100 100" className="w-12 h-12 text-charcoal/60" fill="currentColor">
          <rect x="25" y="35" width="50" height="30" rx="5" fill="none" stroke="currentColor" strokeWidth="2"/>
          <rect x="20" y="45" width="60" height="4" fill="currentColor"/>
          <rect x="20" y="55" width="60" height="4" fill="currentColor"/>
          <path d="M40 25 Q50 15 60 25" fill="none" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    },
    {
      time: "23:00",
      title: "Ակտիվ",
      description: "",
      icon: (
        <svg viewBox="0 0 100 100" className="w-12 h-12 text-charcoal/60" fill="currentColor">
          <rect x="20" y="60" width="15" height="25" fill="none" stroke="currentColor" strokeWidth="2"/>
          <rect x="40" y="50" width="15" height="35" fill="none" stroke="currentColor" strokeWidth="2"/>
          <path d="M20 45 Q30 25 45 40" fill="none" stroke="currentColor" strokeWidth="2"/>
          <circle cx="65" cy="35" r="8" fill="none" stroke="currentColor" strokeWidth="2"/>
          <path d="M60 40 Q75 45 80 30" fill="none" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    }
  ];

  return (
    <section id="timeline" className="py-20 bg-cream relative overflow-hidden">
      {/* Decorative botanical elements */}
      <div className="absolute top-20 right-8 opacity-10">
        <svg viewBox="0 0 200 300" className="w-32 h-48 text-charcoal">
          <path d="M100 50 Q120 80 140 120 Q160 160 150 200 Q140 240 120 270" 
                fill="none" stroke="currentColor" strokeWidth="2"/>
          <path d="M90 70 Q70 85 60 105" fill="none" stroke="currentColor" strokeWidth="1"/>
          <path d="M110 90 Q130 105 140 125" fill="none" stroke="currentColor" strokeWidth="1"/>
          <path d="M85 130 Q65 145 55 165" fill="none" stroke="currentColor" strokeWidth="1"/>
          <circle cx="60" cy="105" r="3" fill="currentColor" opacity="0.5"/>
          <circle cx="140" cy="125" r="2" fill="currentColor" opacity="0.5"/>
          <circle cx="55" cy="165" r="2.5" fill="currentColor" opacity="0.5"/>
        </svg>
      </div>
      
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-serif font-light text-charcoal mb-8" 
              style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic' }}
              data-testid="text-timeline-title">
            Ծրագիր
          </h2>
        </div>
        
        <div className="space-y-16">
          {timelineEvents.map((event, index) => (
            <div 
              key={index}
              className="flex flex-col items-center text-center space-y-4"
              data-testid={`timeline-event-${index}`}
            >
              {/* Time */}
              <div className="text-xl md:text-2xl font-light text-charcoal" data-testid={`timeline-time-${index}`}>
                {event.time}
              </div>
              
              {/* Icon */}
              <div className="my-6">
                {event.icon}
              </div>
              
              {/* Title and Description */}
              <div className="space-y-2">
                <div className="text-lg md:text-xl font-medium text-charcoal" data-testid={`timeline-title-${index}`}>
                  {event.title}
                </div>
                {event.description && (
                  <div className="text-charcoal/60 text-sm" data-testid={`timeline-description-${index}`}>
                    {event.description}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
