import { Heart } from "lucide-react";

export default function CalendarSection() {
  const calendarDays = [
    ['', '', '', '', '', '', ''],
    ['', '', '', '1', '2', '3', '4'],
    ['5', '6', '7', '8', '9', '10', '11'],
    ['12', '13', '14', '15', '16', '17', '18'],
    ['19', '20', '21', '22', '23', '24', '25'],
    ['26', '27', '28', '29', '30', '31', '']
  ];

  return (
    <section id="calendar" className="py-20 bg-charcoal text-white">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4" data-testid="text-calendar-title">
          Հարցանյի հիմքեր
        </h2>
        <p className="text-white/70 mb-4 text-sm">
          Նուրա ունիցանունն եմք Մեր նիվգե ցարենք<br/>
          Ֆցր հարցանիքտ ճագիրձտռն<br/>
          Նուայեմությւմ ծրագիրների Ն հարցանիքի Մեր<br/>
          հարցանյիկով տ քիքուր ծագիրառն 15։
        </p>
        
        <div className="mb-8">
          <h3 className="text-2xl font-serif mb-6">Օգոստոս 2024</h3>
          <div className="text-xs text-white/50 mb-4 grid grid-cols-7 gap-1">
            <div>ԿՐՆ</div>
            <div>ԵՐԿ</div>
            <div>ԵՐՔ</div>
            <div>ՉՈՐ</div>
            <div>ՀՆԳ</div>
            <div>ՈՒՐ</div>
            <div>ՇԲՏ</div>
          </div>
        </div>
        
        {/* Heart positioned above calendar grid */}
        <div className="relative mb-6">
          <Heart 
            className="mx-auto text-white w-8 h-8 fill-current animate-heartbeat" 
            data-testid="calendar-heart-animation"
          />
        </div>
        
        <div className="grid grid-cols-7 gap-1 max-w-xs mx-auto" data-testid="calendar-grid">
          {calendarDays.map((week, weekIndex) => 
            week.map((day, dayIndex) => (
              <div 
                key={`${weekIndex}-${dayIndex}`} 
                className={`py-2 text-sm ${
                  day === '18' 
                    ? 'bg-white text-charcoal rounded font-bold' 
                    : day ? 'text-white/60' : ''
                }`}
                data-testid={day === '18' ? 'calendar-wedding-day' : `calendar-day-${day}`}
              >
                {day}
              </div>
            ))
          )}
        </div>
        
        <div className="mt-8 text-white/80">
          <p className="font-medium text-lg" data-testid="text-wedding-date">18</p>
          <p className="text-sm" data-testid="text-wedding-description">ՕԳՈՍՏՈՍ 2024</p>
        </div>
      </div>
      
    </section>
  );
}
