import { weddingConfig } from "@/config/wedding-config";

export default function CalendarSection() {
  const calendarDays = [
    ['', '', '', '', '', '1', '2'],
    ['3', '4', '5', '6', '7', '8', '9'],
    ['10', '11', '12', '13', '14', '15', '16'],
    ['17', '18', '19', '20', '21', '22', '23'],
    ['24', '25', '26', '27', '28', '29', '30'],
    ['31', '', '', '', '', '', '']
  ];

  return (
    <section id="calendar" className="py-20 bg-gradient-to-br from-cream via-white to-warmBeige/20">
      <div className="max-w-5xl mx-auto px-4">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl text-charcoal mb-8" 
              style={{ 
                fontFamily: 'Playfair Display, serif', 
                fontStyle: 'italic',
                fontWeight: '300'
              }}
              data-testid="text-calendar-title">
            {weddingConfig.calendar.title}
          </h2>
          <div className="w-24 h-0.5 bg-softGold mx-auto mb-8"></div>
          <p className="text-charcoal/70 max-w-3xl mx-auto text-lg leading-relaxed">
            {weddingConfig.calendar.description.split('\n').map((line, index) => (
              <span key={index}>
                {line}
                {index < weddingConfig.calendar.description.split('\n').length - 1 && <br />}
              </span>
            ))}
          </p>
        </div>

        {/* Calendar and Date Display */}
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-4xl mx-auto">
          
          {/* Calendar */}
          <div className="order-2 lg:order-1">
            <div className="bg-white rounded-3xl shadow-2xl p-8 border border-charcoal/5">
              
              {/* Month Header */}
              <div className="text-center mb-8">
                <h3 className="text-3xl font-serif text-charcoal mb-3" 
                    style={{ fontFamily: 'Playfair Display, serif' }}>
                  {weddingConfig.calendar.monthTitle}
                </h3>
                <div className="w-16 h-0.5 bg-softGold mx-auto"></div>
              </div>

              {/* Day Labels */}
              <div className="grid grid-cols-7 gap-2 mb-6">
                {weddingConfig.calendar.dayLabels.map((day, index) => (
                  <div key={index} className="text-center text-charcoal/60 text-sm font-semibold py-3">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2" data-testid="calendar-grid">
                {calendarDays.map((week, weekIndex) => 
                  week.map((day, dayIndex) => (
                    <div 
                      key={`${weekIndex}-${dayIndex}`} 
                      className={`
                        relative py-4 text-center text-base rounded-xl transition-all duration-300
                        ${day === weddingConfig.wedding.day 
                          ? 'z-10' 
                          : day 
                            ? 'text-charcoal/70 hover:bg-softGold/10 hover:scale-105' 
                            : ''
                        }
                      `}
                      data-testid={day === weddingConfig.wedding.day ? 'calendar-wedding-day' : `calendar-day-${day}`}
                    >
                      {day === weddingConfig.wedding.day ? (
                        <div className="relative flex items-center justify-center">
                          {/* Heart Shape SVG */}
                          <svg 
                            viewBox="0 0 100 100" 
                            className="w-16 h-16 text-red-500 fill-current transform scale-125"
                            style={{ filter: 'drop-shadow(0 4px 12px rgba(239, 68, 68, 0.3))' }}
                          >
                            <path d="M50 85c-1.5-1.5-3.5-3.5-6-6.5C35 69 25 58 25 45c0-9 7-16 16-16s16 7 16 16c0 0 0 0 0 0 0-9 7-16 16-16s16 7 16 16c0 13-10 24-19 33.5-2.5 3-4.5 5-6 6.5z"/>
                          </svg>
                          {/* Date Number Inside Heart */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-white font-bold text-lg mt-1">
                              {day}
                            </span>
                          </div>
                        </div>
                      ) : day ? (
                        <span>{day}</span>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Wedding Date Display */}
          <div className="order-1 lg:order-2 text-center lg:text-left">
            <div className="space-y-6">
              
              {/* Large Date */}
              <div className="relative">
                <div className="text-8xl md:text-9xl font-light text-charcoal/10 leading-none"
                     style={{ fontFamily: 'Playfair Display, serif' }}>
                  {weddingConfig.wedding.day}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-6xl md:text-7xl font-light text-charcoal"
                       style={{ fontFamily: 'Playfair Display, serif' }}
                       data-testid="text-wedding-date">
                    {weddingConfig.wedding.day}
                  </div>
                </div>
              </div>

              {/* Date Description */}
              <div className="space-y-3">
                <p className="text-2xl md:text-3xl text-charcoal font-medium" 
                   style={{ fontFamily: 'Playfair Display, serif' }}
                   data-testid="text-wedding-description">
                  {weddingConfig.wedding.displayDate}
                </p>
                <div className="w-20 h-0.5 bg-softGold mx-auto lg:mx-0"></div>
                <p className="text-charcoal/60 text-lg">
                  Մեր հատուկ օրը
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
