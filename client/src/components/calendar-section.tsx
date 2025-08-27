import { weddingConfig } from "@/config/wedding-config";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";

export default function CalendarSection() {
  const calendarDays = [
    ["", "", "", "", "", "1", "2"],
    ["3", "4", "5", "6", "7", "8", "9"],
    ["10", "11", "12", "13", "14", "15", "16"],
    ["17", "18", "19", "20", "21", "22", "23"],
    ["24", "25", "26", "27", "28", "29", "30"],
    ["31", "", "", "", "", "", ""],
  ];

  const titleRef = useScrollAnimation("animate-slide-up");
  const calendarRef = useScrollAnimation("animate-slide-in-left");
  const dateRef = useScrollAnimation("animate-slide-in-right");

  return (
    <section
      id="calendar"
      className="py-20 bg-gradient-to-br from-cream via-white to-warmBeige/20"
    >
      <div className="max-w-5xl mx-auto px-4">
        {/* Section Header */}
        <div ref={titleRef} className="text-center mb-16 animate-on-scroll">
          <h2
            className="text-5xl md:text-6xl text-charcoal mb-8"
            style={{
              fontFamily: "Playfair Display, serif",
              fontWeight: "300",
            }}
            data-testid="text-calendar-title"
          >
            {weddingConfig.calendar.title}
          </h2>
          <div className="w-24 h-0.5 bg-softGold mx-auto mb-8"></div>
          <p className="text-charcoal/70 max-w-3xl mx-auto text-lg leading-relaxed">
            {weddingConfig.calendar.description
              .split("\n")
              .map((line, index) => (
                <span key={index}>
                  {line}
                  {index <
                    weddingConfig.calendar.description.split("\n").length -
                      1 && <br />}
                </span>
              ))}
          </p>
        </div>

        {/* Calendar and Date Display */}
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-4xl mx-auto">
          {/* Calendar */}
          <div
            ref={calendarRef}
            className="order-2 lg:order-1 animate-on-scroll"
          >
            <div className="bg-white rounded-3xl shadow-2xl p-8 border border-charcoal/5">
              {/* Month Header */}
              <div className="text-center mb-8">
                <h3
                  className="text-3xl font-serif text-charcoal mb-3"
                  style={{ fontFamily: "Playfair Display, serif" }}
                >
                  {weddingConfig.calendar.monthTitle}
                </h3>
                <div className="w-16 h-0.5 bg-softGold mx-auto"></div>
              </div>

              {/* Day Labels */}
              <div className="grid grid-cols-7 gap-2 mb-6">
                {weddingConfig.calendar.dayLabels.map((day, index) => (
                  <div
                    key={index}
                    className="text-center text-charcoal/60 text-sm font-semibold py-3"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div
                className="grid grid-cols-7 gap-2"
                data-testid="calendar-grid"
              >
                {calendarDays.map((week, weekIndex) =>
                  week.map((day, dayIndex) => (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className={`
                        relative py-4 text-center text-base rounded-xl transition-all duration-300
                        ${
                          day === weddingConfig.wedding.day
                            ? "z-10"
                            : day
                              ? "text-charcoal/70 hover:bg-softGold/10 hover:scale-105"
                              : ""
                        }
                      `}
                      data-testid={
                        day === weddingConfig.wedding.day
                          ? "calendar-wedding-day"
                          : `calendar-day-${day}`
                      }
                    >
                      {day === weddingConfig.wedding.day ? (
                        <div className="inline-flex items-center justify-center h-full">
                          <div className="relative">
                            <svg
                              viewBox="0 0 32 29.6"
                              className="w-8 h-8 fill-current"
                              style={{
                                marginTop: "-5px",
                                color: "#E4A5B8", // sets the heart color to match website pink theme
                                filter:
                                  "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.25))", // softer shadow for contrast
                              }}
                            >
                              <path
                                d="M23.6,0c-2.9,0-5.6,1.4-7.6,3.6C14,1.4,11.3,0,8.4,0
                                 C3.8,0,0,3.8,0,8.4c0,9.2,16,21.2,16,21.2s16-12,16-21.2
                                 C32,3.8,28.2,0,23.6,0z"
                              />
                            </svg>

                            <span
                              className="absolute inset-0 flex items-center justify-center text-black font-bold text-xs"
                              style={{ marginTop: "-5px" }}
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

          {/* Wedding Date Display */}
          <div
            ref={dateRef}
            className="order-1 lg:order-2 text-center lg:text-left animate-on-scroll"
          >
            <div className="space-y-6">
              {/* Large Date */}
              {/* <div className="relative">
                <div
                  className="text-8xl md:text-9xl font-light text-charcoal/10 leading-none"
                  style={{ fontFamily: "Playfair Display, serif" }}
                >
                  {weddingConfig.wedding.day}
                </div>
              </div> */}

              {/* Date Description */}
              {/* <div className="space-y-3">
                <p
                  className="text-2xl md:text-3xl text-charcoal font-medium"
                  style={{ fontFamily: "Playfair Display, serif" }}
                  data-testid="text-wedding-description"
                >
                  {weddingConfig.wedding.displayDate}
                </p>
                <div className="w-20 h-0.5 bg-softGold mx-auto lg:mx-0"></div>
                <p className="text-charcoal/60 text-lg">Սիրո սկիզբը</p>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
