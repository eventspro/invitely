import { weddingConfig } from "@/config/wedding-config";
import { WeddingConfig } from "@/templates/types";
import { getHeadingFont, getBodyFont } from "@/utils/font-utils";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";

interface CalendarSectionProps {
  config?: WeddingConfig;
}

export default function CalendarSection({ config = weddingConfig }: CalendarSectionProps) {
  // Extract the day from the actual wedding date to ensure consistency
  const getWeddingDay = () => {
    if (config.wedding?.date) {
      const date = new Date(config.wedding.date);
      return date.getDate().toString();
    }
    return config.wedding?.day || "11";
  };

  // Generate calendar dynamically based on wedding date
  const generateCalendar = () => {
    if (!config.wedding?.date) {
      // Fallback to hardcoded October 2025 if no date
      return [
        ["", "", "1", "2", "3", "4", "5"],
        ["6", "7", "8", "9", "10", "11", "12"],
        ["13", "14", "15", "16", "17", "18", "19"],
        ["20", "21", "22", "23", "24", "25", "26"],
        ["27", "28", "29", "30", "31", "", ""],
      ];
    }

    const weddingDate = new Date(config.wedding.date);
    const year = weddingDate.getFullYear();
    const month = weddingDate.getMonth(); // 0-based (0 = January, 11 = December)
    
    // Get first day of the month and number of days in month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const numDays = lastDay.getDate();
    
    // Get what day of week the month starts (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    // Armenian week format: Կիր Երկ Երք Չոր Հնգ Ուրբ Շբթ (Sunday through Saturday)
    // JavaScript: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
    // Armenian:   0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
    // The formats match exactly, so no conversion needed!
    let startDayOfWeek = firstDay.getDay();
    
    const weeks: string[][] = [];
    let currentWeek: string[] = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push("");
    }
    
    // Add all days of the month
    for (let day = 1; day <= numDays; day++) {
      currentWeek.push(day.toString());
      
      // If we've filled a week (7 days), start a new week
      if (currentWeek.length === 7) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    }
    
    // Fill remaining cells in last week
    while (currentWeek.length > 0 && currentWeek.length < 7) {
      currentWeek.push("");
    }
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }
    
    return weeks;
  };

  const weddingDay = getWeddingDay();
  const calendarDays = generateCalendar();

  const titleRef = useScrollAnimation("animate-slide-up");
  const calendarRef = useScrollAnimation("animate-slide-in-left");
  const dateRef = useScrollAnimation("animate-slide-in-right");

  return (
    <section
      id="calendar"
      className="py-20"
      style={{
        background: `linear-gradient(135deg, ${config.theme?.colors?.background } 0%, #ffffff 50%, ${config.theme?.colors?.background }20 100%)`
      }}
    >
      <div className="max-w-5xl mx-auto px-4">
        {/* Section Header */}
        <div ref={titleRef} className="text-center mb-16 animate-on-scroll">
          <h2
            className="text-5xl md:text-6xl mb-8"
            style={{
              fontFamily: getHeadingFont(config.theme?.fonts),
              fontWeight: "300",
              color: config.theme?.colors?.primary 
            }}
          >
            {config.calendar?.title || "Our Wedding"}
          </h2>
          <div className="w-24 h-0.5 mx-auto mb-8" style={{
            backgroundColor: config.theme?.colors?.accent 
          }}></div>
          <p className="max-w-3xl mx-auto text-lg leading-relaxed" style={{
            color: `${config.theme?.colors?.primary }70`
          }}>
            {(config.calendar?.description || "Join us for our special day")
              .split("\n")
              .map((line, index) => (
                <span key={index}>
                  {line}
                  {index <
                    (config.calendar?.description || "Join us for our special day").split("\n").length -
                      1 && <br />}
                </span>
                ))}
          </p>
        </div>        {/* Calendar and Date Display */}
        <div className="flex justify-center max-w-6xl mx-auto">
          {/* Calendar */}
          <div
            ref={calendarRef}
            className="w-full max-w-lg animate-on-scroll"
          >
            <div className="bg-white rounded-3xl shadow-2xl p-10 w-full" style={{
              borderColor: `${config.theme?.colors?.primary }05`
            }}>
              {/* Month Header */}
              <div className="text-center mb-8">
                <h3
                  className="text-3xl font-serif mb-3"
                  style={{ 
                    fontFamily: getHeadingFont(config.theme?.fonts),
                    color: config.theme?.colors?.primary 
                  }}
                >
                  {config.calendar?.monthTitle || "Wedding Month"}
                </h3>
                <div className="w-16 h-0.5 mx-auto" style={{
                  backgroundColor: config.theme?.colors?.accent 
                }}></div>
              </div>

              {/* Day Labels */}
              <div className="grid grid-cols-7 gap-2 mb-6">
                {config.calendar?.dayLabels?.map((day, index) => (
                  <div
                    key={index}
                    className="text-center text-sm font-semibold py-3"
                    style={{
                      color: `${config.theme?.colors?.primary }60`
                    }}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div
                className="grid grid-cols-7 gap-2"
              >
                {calendarDays.map((week, weekIndex) =>
                  week.map((day, dayIndex) => (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className={`
                        relative py-4 text-center text-base rounded-xl transition-all duration-300
                        ${
                          day === weddingDay
                            ? "z-10"
                            : day
                              ? "hover:scale-105"
                              : ""
                        }
                      `}
                      style={day && day !== weddingDay ? {
                        color: `${config.theme?.colors?.primary }70`,
                        backgroundColor: 'transparent'
                      } : {}}
                      onMouseEnter={(e) => {
                        if (day && day !== weddingDay) {
                          e.currentTarget.style.backgroundColor = `${config.theme?.colors?.accent }10`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (day && day !== weddingDay) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}

                    >
                      {day === weddingDay ? (
                        <div className="inline-flex items-center justify-center h-full">
                          <div className="relative">
                            <svg
                              viewBox="0 0 32 29.6"
                              className="w-8 h-8 fill-current animate-heartbeat"
                              style={{
                                marginTop: "-5px",
                                color: config.theme?.colors?.accent ,
                                filter:
                                  "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.25))",
                              }}
                            >
                              <path
                                d="M23.6,0c-2.9,0-5.6,1.4-7.6,3.6C14,1.4,11.3,0,8.4,0
                                 C3.8,0,0,3.8,0,8.4c0,9.2,16,21.2,16,21.2s16-12,16-21.2
                                 C32,3.8,28.2,0,23.6,0z"
                              />
                            </svg>

                            <span
                              className="absolute inset-0 flex items-center justify-center font-bold text-xs"
                              style={{ 
                                marginTop: "-5px",
                                color: config.theme?.colors?.primary 
                              }}
                            >
                              {day}
                            </span>
                          </div>
                        </div>
                      ) : day ? (
                        <span className="text-charcoal/70">{day}</span>
                      ) : null}
                    </div>
                  )),
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

