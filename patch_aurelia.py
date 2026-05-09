"""
Aurelia Cinematic V2 — Full Section Rewrite Patch
Sections replaced: HERO, STORY, ROADMAP, DETAILS, VENUE, GALLERY, RSVP
All other content (CSS, hooks, navbar, footer) is preserved exactly.
"""

FILE = r"client\src\templates\aurelia\AureliaTemplate.tsx"

with open(FILE, encoding="utf-8") as f:
    lines = f.readlines()

# ── Section boundary line numbers (0-indexed Python array positions) ──────────
HERO_S    = 742
STORY_S   = 967
ROADMAP_S = 1142
DETAILS_S = 1365
VENUE_S   = 1517
GALLERY_S = 1652
RSVP_S    = 1759
FOOTER_S  = 2007

# ── New section JSX ────────────────────────────────────────────────────────────

HERO_JSX = """      {/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 HERO \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */}
      {showHero && (
        <section
          id="aur-hero"
          data-v2-section="aur-hero"
          style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden" }}
        >
          {/* Parallax bg layer */}
          <div
            ref={heroParallax.ref}
            style={{
              position:   "absolute",
              inset:      "-18% 0",
              background: heroImage ? `url(${heroImage}) center/cover no-repeat` : `linear-gradient(160deg, #2C2420 0%, #1C1917 60%, #0F0E0C 100%)`,
              transform:  `translateY(${heroParallax.offset}px)`,
              zIndex:     0,
              willChange: "transform",
            }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(6,4,2,0.55) 0%, rgba(6,4,2,0.20) 38%, rgba(6,4,2,0.62) 72%, rgba(6,4,2,0.92) 100%)", zIndex: 1 }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(100deg, rgba(6,4,2,0.42) 0%, transparent 55%)", zIndex: 1 }} />

          <div
            style={{
              position:  "relative",
              zIndex:    2,
              textAlign: "center",
              padding:   "110px 24px 70px",
              maxWidth:  "1000px",
              width:     "100%",
              animation: "aur-hero-reveal 1.5s cubic-bezier(0.25,0.46,0.45,0.94) both",
            }}
          >
            {(heroTagline || cfg.hero.invitation) && (
              <p
                data-v2-element="aur-hero-tagline"
                data-v2-type="text"
                style={{ fontFamily: SANS, fontSize: "0.60rem", fontWeight: 500, letterSpacing: "0.30em", textTransform: "uppercase", color: C.champagne, marginBottom: "28px", opacity: 0.90 }}
              >
                {heroTagline || cfg.hero.invitation}
              </p>
            )}
            <h1
              className="aur-hero-names"
              data-v2-element="aur-hero-names"
              data-v2-type="text"
              style={{ fontFamily: SERIF, fontSize: "clamp(3.6rem, 9vw, 9rem)", fontWeight: 300, letterSpacing: "0.015em", color: C.warmWhite, lineHeight: 1.0, margin: 0, textShadow: "0 4px 60px rgba(0,0,0,0.55)" }}
            >
              {groomName}
              <span style={{ fontStyle: "italic", color: C.champagne, margin: "0 0.22em", fontWeight: 300 }}>{separator}</span>
              {brideName}
            </h1>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "14px", margin: "30px auto 26px" }}>
              <div style={{ width: "52px", height: "1px", background: `${C.champagne}60` }} />
              <svg width="9" height="9" viewBox="0 0 9 9"><path d="M4.5 0L9 4.5L4.5 9L0 4.5Z" fill={C.champagne} fillOpacity="0.80"/></svg>
              <div style={{ width: "52px", height: "1px", background: `${C.champagne}60` }} />
            </div>
            <p
              data-v2-element="aur-hero-date"
              data-v2-type="text"
              style={{ fontFamily: SERIF, fontSize: "clamp(1.1rem, 2.5vw, 1.65rem)", fontWeight: 300, fontStyle: "italic", color: C.champagneLight, letterSpacing: "0.07em", marginBottom: "8px" }}
            >
              {displayDate}
            </p>
            {heroLocation && (
              <p
                data-v2-element="aur-hero-location"
                data-v2-type="text"
                style={{ fontFamily: SANS, fontSize: "0.60rem", fontWeight: 400, letterSpacing: "0.20em", textTransform: "uppercase", color: C.warmWhite, opacity: 0.58, marginBottom: "54px" }}
              >
                {heroLocation}
              </p>
            )}
            {cfg.sections?.countdown?.enabled !== false && (
              <div
                className="aur-glass"
                style={{ display: "inline-flex", gap: 0, justifyContent: "center", flexWrap: "wrap", padding: "18px 0", animation: "aur-glow-pulse 4.5s ease-in-out infinite" }}
              >
                {[
                  { value: countdown.days,    label: cfg.countdown.labels.days    },
                  { value: countdown.hours,   label: cfg.countdown.labels.hours   },
                  { value: countdown.minutes, label: cfg.countdown.labels.minutes },
                  { value: countdown.seconds, label: cfg.countdown.labels.seconds },
                ].map(({ value, label }, idx) => (
                  <div key={label} style={{ textAlign: "center", minWidth: "74px", padding: "4px 18px", borderRight: idx < 3 ? `1px solid ${C.champagne}25` : "none" }}>
                    <div style={{ fontFamily: SERIF, fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 300, color: C.champagne, lineHeight: 1 }}>
                      {String(value).padStart(2, "0")}
                    </div>
                    <div style={{ fontFamily: SANS, fontSize: "0.46rem", letterSpacing: "0.18em", color: C.warmWhite, marginTop: "6px", opacity: 0.48, textTransform: "uppercase" }}>
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ position: "absolute", bottom: "30px", left: "50%", transform: "translateX(-50%)", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", opacity: 0.45 }}>
            <span style={{ fontFamily: SANS, fontSize: "0.48rem", letterSpacing: "0.26em", color: C.warmWhite, textTransform: "uppercase" }}>Scroll</span>
            <svg style={{ animation: "aur-scroll-bob 2.4s ease-in-out infinite" }} width="14" height="26" viewBox="0 0 14 26" fill="none">
              <line x1="7" y1="0" x2="7" y2="20" stroke={C.champagne} strokeWidth="1"/>
              <path d="M2 15 L7 21 L12 15" stroke={C.champagne} strokeWidth="1" fill="none"/>
            </svg>
          </div>
        </section>
      )}

"""

STORY_JSX = """      {/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 OUR STORY \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */}
      {showStory && (
        <section
          id="aur-story"
          data-v2-section="aur-story"
          ref={storyAnim.ref as React.RefObject<HTMLElement>}
          style={{ position: "relative", background: C.charcoal, padding: "120px 40px 110px", overflow: "hidden", ...storyAnim.style }}
        >
          {storyImage && (
            <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${storyImage})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.07, filter: "blur(6px)", zIndex: 0 }} />
          )}
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${C.charcoal}F8 0%, ${C.charcoalMid}EC 100%)`, zIndex: 0 }} />

          <div
            className="aur-story-split"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "72px", maxWidth: "1120px", margin: "0 auto", alignItems: "center", position: "relative", zIndex: 1 }}
          >
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", top: "22px", left: "22px", right: "-22px", bottom: "-22px", border: `1px solid ${C.champagne}38`, zIndex: 0, pointerEvents: "none" }} />
              <div style={{ position: "absolute", top: "11px", left: "11px", right: "-11px", bottom: "-11px", border: `1px solid ${C.champagne}18`, zIndex: 0, pointerEvents: "none" }} />
              <div style={{ position: "relative", paddingBottom: "125%", overflow: "hidden", zIndex: 1, boxShadow: "18px 22px 64px rgba(0,0,0,0.50)" }}>
                <img
                  ref={storyParallax.ref as React.RefObject<HTMLImageElement>}
                  src={storyImage || "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80&auto=format&fit=crop"}
                  alt="Our Story"
                  style={{ position: "absolute", inset: 0, width: "100%", height: "115%", top: "-7.5%", objectFit: "cover", transform: `translateY(${storyParallax.offset * 0.45}px)`, willChange: "transform", display: "block" }}
                />
                <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to top, ${C.charcoal}80 0%, transparent 50%)` }} />
              </div>
              <div className="aur-glass" style={{ position: "absolute", bottom: "26px", left: "26px", zIndex: 2, padding: "10px 20px" }}>
                <span style={{ fontFamily: SERIF, fontSize: "1.35rem", fontWeight: 300, color: C.champagne, letterSpacing: "0.10em" }}>
                  {groomName[0]}{brideName[0]}
                </span>
              </div>
            </div>

            <div style={{ paddingLeft: "8px" }}>
              <p style={{ fontFamily: SANS, fontSize: "0.60rem", fontWeight: 500, letterSpacing: "0.24em", textTransform: "uppercase", color: C.champagne, marginBottom: "18px", opacity: 0.88 }}>
                Our Story
              </p>
              <div style={{ width: "34px", height: "1px", background: C.champagne, marginBottom: "28px", opacity: 0.50 }} />
              <h2
                data-v2-element="aur-story-heading"
                data-v2-type="text"
                style={{ fontFamily: SERIF, fontSize: "clamp(2.2rem, 3.8vw, 3.5rem)", fontWeight: 300, lineHeight: 1.12, color: C.warmWhite, marginBottom: "26px" }}
              >
                {storyHeadingEmphasis
                  ? <>{storyHeading.replace(storyHeadingEmphasis, "").trimStart()}<em style={{ color: C.champagne, fontStyle: "italic" }}> {storyHeadingEmphasis}</em></>
                  : storyHeading
                }
              </h2>
              <p
                data-v2-element="aur-story-body"
                data-v2-type="textarea"
                style={{ fontFamily: SANS, fontSize: "0.97rem", fontWeight: 300, lineHeight: 1.88, color: C.warmGray, marginBottom: "36px" }}
              >
                {storyBody}
              </p>
              {storyCtaLabel && (
                <div
                  data-v2-element="aur-story-cta"
                  data-v2-type="text"
                  style={{ display: "inline-flex", alignItems: "center", gap: "10px", fontFamily: SANS, fontSize: "0.63rem", fontWeight: 500, letterSpacing: "0.20em", textTransform: "uppercase", color: C.champagne, paddingBottom: "3px", borderBottom: `1px solid ${C.champagne}50`, cursor: "default" }}
                >
                  {storyCtaLabel}
                  <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M0 5H12M9 1L13 5L9 9" stroke="currentColor" strokeWidth="1.2"/></svg>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

"""

ROADMAP_JSX = """      {/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 JOURNEY / ROADMAP \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */}
      {showRoadmap && (
        <section
          id="aur-roadmap"
          data-v2-section="aur-roadmap"
          ref={roadmapAnim.ref as React.RefObject<HTMLElement>}
          style={{ background: `linear-gradient(180deg, ${C.charcoalMid} 0%, ${C.charcoal} 100%)`, padding: "110px 24px 100px", ...roadmapAnim.style }}
        >
          <div style={{ textAlign: "center", marginBottom: "80px" }}>
            <p style={{ fontFamily: SANS, fontSize: "0.60rem", letterSpacing: "0.26em", textTransform: "uppercase", color: C.champagne, marginBottom: "16px", opacity: 0.85 }}>
              The Journey
            </p>
            <h2
              data-v2-element="aur-roadmap-heading"
              data-v2-type="text"
              style={{ fontFamily: SERIF, fontSize: "clamp(2rem, 4vw, 3.4rem)", fontWeight: 300, color: C.warmWhite, letterSpacing: "0.02em", margin: 0 }}
            >
              {roadmapHeading}
            </h2>
          </div>

          <div ref={roadmapRef as React.RefObject<HTMLDivElement>} style={{ position: "relative", maxWidth: "820px", margin: "0 auto", padding: "0 24px" }}>
            <div
              className="aur-roadmap-center-line"
              style={{ position: "absolute", left: "50%", top: 0, bottom: 0, transform: "translateX(-50%)", width: "2px", background: `${C.champagne}15`, zIndex: 1 }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: `${progress * 100}%`, background: `linear-gradient(to bottom, ${C.champagne}BB, ${C.champagneDim}70)`, transition: "height 0.12s linear" }} />
              <div style={{ position: "absolute", top: `${progress * 100}%`, left: "50%", transform: "translate(-50%, -50%)", zIndex: 5, transition: "top 0.12s linear", filter: `drop-shadow(0 0 10px ${C.champagne}88)` }}>
                <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                  <rect x="3" y="9" width="20" height="10" rx="2" fill={C.champagne} fillOpacity="0.92"/>
                  <path d="M7 9L9.5 4.5H16.5L19 9" fill={C.champagne} fillOpacity="0.70"/>
                  <circle cx="8.5"  cy="20" r="2.5" fill={C.charcoal} stroke={C.champagne} strokeWidth="1.2"/>
                  <circle cx="17.5" cy="20" r="2.5" fill={C.charcoal} stroke={C.champagne} strokeWidth="1.2"/>
                  <rect x="10" y="5.5" width="6" height="2.8" rx="0.4" fill={C.charcoal} fillOpacity="0.28"/>
                </svg>
              </div>
            </div>

            <div ref={milestonesRef as React.RefObject<HTMLDivElement>}>
              {milestones.map((m, i) => (
                <div
                  key={(m as any).id || i}
                  data-aur-ms={i}
                  className={i % 2 === 0 ? "aur-roadmap-milestone-left" : "aur-roadmap-milestone-right"}
                  style={{
                    position: "relative", marginBottom: "60px",
                    opacity:  milestoneVisible[i] ? 1 : 0,
                    transform: milestoneVisible[i] ? "none" : `translateX(${i % 2 === 0 ? "-28px" : "28px"})`,
                    transition: "opacity 0.65s ease, transform 0.65s ease",
                    zIndex: 2,
                  }}
                >
                  <div style={{ background: `${C.charcoalMid}DD`, border: `1px solid ${C.champagne}28`, overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.32)" }}>
                    {(m as any).image && (
                      <div style={{ height: "130px", overflow: "hidden", position: "relative" }}>
                        <img src={(m as any).image} alt={m.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, transparent 40%, ${C.charcoalMid}CC)` }} />
                      </div>
                    )}
                    <div style={{ padding: "22px 24px 24px" }}>
                      <div style={{ fontFamily: SERIF, fontSize: "0.72rem", fontWeight: 400, letterSpacing: "0.16em", color: C.champagne, marginBottom: "8px", opacity: 0.85 }}>
                        {m.time}
                      </div>
                      <h3 style={{ fontFamily: SERIF, fontSize: "1.4rem", fontWeight: 400, color: C.warmWhite, margin: "0 0 10px", lineHeight: 1.2 }}>
                        {m.title}
                      </h3>
                      {m.description && (
                        <p style={{ fontFamily: SANS, fontSize: "0.83rem", fontWeight: 300, color: C.warmGray, lineHeight: 1.65, margin: 0 }}>
                          {m.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      position: "absolute", top: "26px",
                      ...(i % 2 === 0 ? { right: "-37px" } : { left: "-37px" }),
                      width: "11px", height: "11px", borderRadius: "50%",
                      background: C.champagne, border: `2.5px solid ${C.charcoal}`,
                      zIndex: 4, boxShadow: `0 0 12px ${C.champagne}55`,
                    }}
                  />
                </div>
              ))}
            </div>

            {cfg.timeline.afterMessage?.thankYou && (
              <div style={{ textAlign: "center", paddingTop: "48px", borderTop: `1px solid ${C.champagne}18`, marginTop: "12px" }}>
                <p style={{ fontFamily: SERIF, fontSize: "1.15rem", fontWeight: 300, fontStyle: "italic", color: C.champagne, opacity: 0.75 }}>
                  {cfg.timeline.afterMessage.thankYou}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

"""

DETAILS_JSX = """      {/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 WEDDING DETAILS \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */}
      {showDetails && (
        <section
          id="aur-details"
          data-v2-section="aur-details"
          ref={detailsAnim.ref as React.RefObject<HTMLElement>}
          style={{ background: C.creamWarm, padding: "100px 40px", ...detailsAnim.style }}
        >
          <div style={{ maxWidth: "820px", margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "56px" }}>
              <p style={{ fontFamily: SANS, fontSize: "0.60rem", letterSpacing: "0.26em", textTransform: "uppercase", color: C.champagne, marginBottom: "16px", opacity: 0.85 }}>
                {detailsLabel}
              </p>
              <div style={{ width: "28px", height: "1px", background: C.champagne, margin: "0 auto", opacity: 0.45 }} />
            </div>

            <div className="aur-details-grid">
              {venues.slice(0, 4).map((venue, i) => (
                <div
                  key={(venue as any).id || i}
                  className="aur-detail-card"
                  style={{ background: C.cardBg, border: `1px solid ${C.border}`, padding: "38px 28px 34px", textAlign: "center" }}
                >
                  <div style={{ marginBottom: "20px", display: "flex", justifyContent: "center" }}>
                    {i === 0 && (
                      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke={C.champagne} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 33V20H27V33"/><path d="M5 20h26"/><path d="M18 3v8M15 7h6"/>
                        <path d="M14 20V14h8v6"/>
                      </svg>
                    )}
                    {i === 1 && (
                      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke={C.champagne} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4l4 14H7L11 4z"/><path d="M11 18v14M7 32h8"/>
                        <path d="M25 4l4 14H21L25 4z"/><path d="M25 18v14M21 32h8"/>
                        <path d="M15 10l6 2"/>
                      </svg>
                    )}
                    {i === 2 && (
                      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke={C.champagne} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="14" r="5"/>
                        <path d="M18 2a12 12 0 010 24C10 26 4 20 4 14A14 14 0 0118 2z"/>
                        <path d="M18 26v8M14 31h8"/>
                      </svg>
                    )}
                    {i >= 3 && (
                      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke={C.champagne} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="6" y="10" width="24" height="20" rx="1"/>
                        <path d="M6 16h24M13 10V6M23 10V6"/>
                      </svg>
                    )}
                  </div>
                  <p style={{ fontFamily: SANS, fontSize: "0.56rem", letterSpacing: "0.22em", textTransform: "uppercase", color: C.champagne, marginBottom: "12px" }}>
                    {venue.title}
                  </p>
                  <p style={{ fontFamily: SERIF, fontSize: "1.7rem", fontWeight: 400, color: C.charcoal, marginBottom: "12px", lineHeight: 1.15 }}>
                    {venue.name}
                  </p>
                  <p style={{ fontFamily: SANS, fontSize: "0.84rem", fontWeight: 300, color: C.warmGray, lineHeight: 1.68, whiteSpace: "pre-line", marginBottom: venue.mapButton ? "20px" : 0 }}>
                    {venue.description}
                  </p>
                  {venue.mapButton && venue.address && (
                    <a
                      href={`https://www.google.com/maps/search/${encodeURIComponent(venue.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "inline-block", fontFamily: SANS, fontSize: "0.58rem", letterSpacing: "0.18em", textTransform: "uppercase", color: C.champagne, textDecoration: "none", borderBottom: `1px solid ${C.champagne}50`, paddingBottom: "2px" }}
                    >
                      {venue.mapButton}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

"""

VENUE_JSX = """      {/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 VENUE \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */}
      {showVenue && (
        <section
          id="aur-venue"
          data-v2-section="aur-venue"
          ref={venueAnim.ref as React.RefObject<HTMLElement>}
          style={{ position: "relative", minHeight: "640px", overflow: "hidden", ...venueAnim.style }}
        >
          <div
            ref={venueParallax.ref}
            style={{
              position:   "absolute",
              inset:      "-18% 0",
              background: `url(${venueImage || "https://images.unsplash.com/photo-1578774295889-02bc12c28e3a?w=1400&q=80&auto=format&fit=crop"}) center/cover no-repeat`,
              transform:  `translateY(${venueParallax.offset}px)`,
              zIndex:     0,
              willChange: "transform",
            }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(6,4,2,0.88) 0%, rgba(6,4,2,0.65) 45%, rgba(6,4,2,0.15) 100%)", zIndex: 1 }} />

          <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", minHeight: "640px", padding: "80px 64px" }}>
            <div style={{ maxWidth: "490px" }}>
              <p
                data-v2-element="aur-venue-subtitle"
                data-v2-type="text"
                style={{ fontFamily: SANS, fontSize: "0.60rem", letterSpacing: "0.24em", textTransform: "uppercase", color: C.champagne, marginBottom: "20px", opacity: 0.90 }}
              >
                {venueSubtitle}
              </p>
              <h2
                data-v2-element="aur-venue-title"
                data-v2-type="text"
                style={{ fontFamily: SERIF, fontSize: "clamp(2.6rem, 4.5vw, 4.5rem)", fontWeight: 300, color: C.warmWhite, lineHeight: 1.05, marginBottom: "24px", textShadow: "0 2px 30px rgba(0,0,0,0.45)" }}
              >
                {venueTitle}
              </h2>
              <div style={{ width: "40px", height: "1px", background: C.champagne, marginBottom: "26px", opacity: 0.55 }} />
              <p
                data-v2-element="aur-venue-desc"
                data-v2-type="textarea"
                style={{ fontFamily: SANS, fontSize: "0.95rem", fontWeight: 300, lineHeight: 1.88, color: `${C.warmWhite}C8`, marginBottom: "28px" }}
              >
                {venueDescription}
              </p>
              {venueAddress && (
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "32px" }}>
                  <svg width="13" height="17" viewBox="0 0 13 17" fill="none" style={{ flexShrink: 0, marginTop: "3px" }}>
                    <path d="M6.5 0C3.46 0 1 2.46 1 5.5c0 4.88 5.5 10.5 5.5 10.5S12 10.38 12 5.5C12 2.46 9.54 0 6.5 0zm0 7.5A2 2 0 114.5 5.5 2 2 0 016.5 7.5z" fill={C.champagne} fillOpacity="0.80"/>
                  </svg>
                  <p style={{ fontFamily: SANS, fontSize: "0.84rem", fontWeight: 300, color: `${C.warmWhite}A8`, lineHeight: 1.68, whiteSpace: "pre-line", margin: 0 }}>
                    {venueAddress}
                  </p>
                </div>
              )}
              {venueCtaLabel && (
                <a
                  href={venueMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: "10px", fontFamily: SANS, fontSize: "0.63rem", letterSpacing: "0.20em", textTransform: "uppercase", color: C.champagne, textDecoration: "none", borderBottom: `1px solid ${C.champagne}50`, paddingBottom: "2px" }}
                >
                  {venueCtaLabel}
                  <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M0 5H12M9 1L13 5L9 9" stroke="currentColor" strokeWidth="1.2"/></svg>
                </a>
              )}
            </div>
          </div>
        </section>
      )}

"""

GALLERY_JSX = """      {/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 GALLERY \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */}
      {showGallery && (
        <section
          id="aur-gallery"
          data-v2-section="aur-gallery"
          ref={galleryAnim.ref as React.RefObject<HTMLElement>}
          style={{ background: C.charcoal, padding: "100px 40px 110px", ...galleryAnim.style }}
        >
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <p style={{ fontFamily: SANS, fontSize: "0.60rem", letterSpacing: "0.26em", textTransform: "uppercase", color: C.champagne, marginBottom: "18px", opacity: 0.80 }}>
              {gallerySubtitle}
            </p>
            <h2
              data-v2-element="aur-gallery-title"
              data-v2-type="text"
              style={{ fontFamily: SERIF, fontSize: "clamp(2rem, 4vw, 3.2rem)", fontWeight: 300, color: C.warmWhite, margin: 0, letterSpacing: "0.02em" }}
            >
              {galleryTitle}
            </h2>
          </div>

          {(() => {
            const PLACEHOLDERS = [
              "https://images.unsplash.com/photo-1465495976277-a3741a19326e?w=600&q=80&auto=format&fit=crop",
              "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80&auto=format&fit=crop",
              "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&q=80&auto=format&fit=crop",
              "https://images.unsplash.com/photo-1507504031003-b417219a0fde?w=600&q=80&auto=format&fit=crop",
              "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=600&q=80&auto=format&fit=crop",
              "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600&q=80&auto=format&fit=crop",
            ];
            const displayImages = galleryImages.length > 0 ? galleryImages : PLACEHOLDERS;
            const isPlaceholder = galleryImages.length === 0;
            return (
              <div style={{ maxWidth: "1160px", margin: "0 auto" }}>
                <div className="aur-gallery-grid">
                  {displayImages.map((url: string, i: number) => (
                    <div
                      key={i}
                      className="aur-gallery-tile"
                      style={{ ...(i === 0 ? { gridRow: "span 2" } : {}), aspectRatio: i === 0 ? "auto" : "1 / 1" }}
                    >
                      <img src={url} alt={`Gallery ${i + 1}`} className="aur-gallery-img" loading="lazy" />
                      {isPlaceholder && <div style={{ position: "absolute", inset: 0, background: "rgba(6,4,2,0.18)", pointerEvents: "none" }} />}
                    </div>
                  ))}
                </div>
                {isPlaceholder && (
                  <p style={{ textAlign: "center", marginTop: "36px", fontFamily: SERIF, fontSize: "1.05rem", fontStyle: "italic", color: C.warmGray, opacity: 0.45, letterSpacing: "0.04em" }}>
                    Your favourite moments will live here
                  </p>
                )}
              </div>
            );
          })()}
        </section>
      )}

"""

RSVP_JSX = """      {/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 RSVP \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */}
      {showRsvp && (
        <section
          id="aur-rsvp"
          data-v2-section="aur-rsvp"
          ref={rsvpAnim.ref as React.RefObject<HTMLElement>}
          style={{ position: "relative", minHeight: "820px", display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 24px", overflow: "hidden", ...rsvpAnim.style }}
        >
          <div
            ref={rsvpParallax.ref}
            style={{
              position:   "absolute",
              inset:      "-18% 0",
              background: `url(${rsvpBgImage || "https://images.unsplash.com/photo-1519741497674-611481863552?w=1400&q=80&auto=format&fit=crop"}) center/cover no-repeat`,
              transform:  `translateY(${rsvpParallax.offset}px)`,
              zIndex:     0,
              willChange: "transform",
            }}
          />
          <div style={{ position: "absolute", inset: 0, background: "rgba(6,4,2,0.74)", zIndex: 1 }} />

          <div
            className="aur-glass"
            style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: "540px", padding: "52px 48px", boxShadow: "0 32px 80px rgba(0,0,0,0.55)" }}
          >
            <h2
              data-v2-element="aur-rsvp-title"
              data-v2-type="text"
              style={{ fontFamily: SERIF, fontSize: "2.8rem", fontWeight: 300, color: C.warmWhite, textAlign: "center", marginBottom: "10px", letterSpacing: "0.04em" }}
            >
              {cfg.rsvp.title}
            </h2>
            {cfg.rsvp.description && (
              <p
                data-v2-element="aur-rsvp-desc"
                data-v2-type="textarea"
                style={{ fontFamily: SANS, fontSize: "0.85rem", fontWeight: 300, color: C.warmGray, textAlign: "center", whiteSpace: "pre-line", lineHeight: 1.78, marginBottom: "36px" }}
              >
                {cfg.rsvp.description}
              </p>
            )}

            {rsvpSuccess ? (
              <div style={{ textAlign: "center", padding: "32px 0", fontFamily: SERIF, fontSize: "1.4rem", fontStyle: "italic", color: C.champagne, lineHeight: 1.6 }}>
                {cfg.rsvp.messages.success}
              </div>
            ) : (
              <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                  <div>
                    <label style={RSVP_LABEL}>{cfg.rsvp.form.firstName}</label>
                    <input {...form.register("firstName")} placeholder={cfg.rsvp.form.firstNamePlaceholder} className="aur-input" style={RSVP_INPUT(C)} />
                    {form.formState.errors.firstName && <p style={RSVP_ERR}>{form.formState.errors.firstName.message}</p>}
                  </div>
                  <div>
                    <label style={RSVP_LABEL}>{cfg.rsvp.form.lastName}</label>
                    <input {...form.register("lastName")} placeholder={cfg.rsvp.form.lastNamePlaceholder} className="aur-input" style={RSVP_INPUT(C)} />
                    {form.formState.errors.lastName && <p style={RSVP_ERR}>{form.formState.errors.lastName.message}</p>}
                  </div>
                </div>
                <div style={{ marginBottom: "14px" }}>
                  <label style={RSVP_LABEL}>{cfg.rsvp.form.email}</label>
                  <input {...form.register("email")} type="email" placeholder={cfg.rsvp.form.emailPlaceholder} className="aur-input" style={RSVP_INPUT(C)} />
                  {form.formState.errors.email && <p style={RSVP_ERR}>{form.formState.errors.email.message}</p>}
                </div>
                <div style={{ marginBottom: "14px" }}>
                  <label style={RSVP_LABEL}>{cfg.rsvp.form.guestCount}</label>
                  <select {...form.register("guestCount")} className="aur-input" style={{ ...RSVP_INPUT(C), cursor: "pointer" }}>
                    {cfg.rsvp.guestOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: "20px" }}>
                  <label style={RSVP_LABEL}>{cfg.rsvp.form.guestNames}</label>
                  <textarea {...form.register("guestNames")} placeholder={cfg.rsvp.form.guestNamesPlaceholder} rows={2} className="aur-input" style={{ ...RSVP_INPUT(C), resize: "vertical", lineHeight: 1.5 }} />
                </div>
                <div style={{ marginBottom: "28px" }}>
                  <label style={{ ...RSVP_LABEL, marginBottom: "12px", display: "block" }}>{cfg.rsvp.form.attendance}</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    {[
                      { value: "attending",     label: cfg.rsvp.form.attendingYes },
                      { value: "not-attending", label: cfg.rsvp.form.attendingNo  },
                    ].map((opt) => {
                      const selected = form.watch("attendance") === opt.value;
                      return (
                        <label
                          key={opt.value}
                          style={{ display: "block", padding: "14px", border: `1px solid ${selected ? C.champagne : `${C.champagne}28`}`, background: selected ? `${C.champagne}18` : "transparent", cursor: "pointer", textAlign: "center", fontFamily: SANS, fontSize: "0.78rem", color: selected ? C.champagne : C.warmGray, letterSpacing: "0.06em", transition: "all 0.2s" }}
                        >
                          <input type="radio" {...form.register("attendance")} value={opt.value} style={{ display: "none" }} />
                          {opt.label}
                        </label>
                      );
                    })}
                  </div>
                  {form.formState.errors.attendance && <p style={RSVP_ERR}>{form.formState.errors.attendance.message}</p>}
                </div>
                <button
                  type="submit"
                  disabled={rsvpMutation.isPending}
                  style={{ width: "100%", padding: "16px", background: rsvpMutation.isPending ? C.charcoalLight : C.champagne, border: "none", color: C.charcoal, fontFamily: SANS, fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", cursor: rsvpMutation.isPending ? "not-allowed" : "pointer", transition: "background 0.2s" }}
                >
                  {rsvpMutation.isPending ? cfg.rsvp.form.submittingButton : cfg.rsvp.form.submitButton}
                </button>
                {rsvpMutation.isError && (
                  <p style={{ marginTop: "12px", fontFamily: SANS, fontSize: "0.78rem", color: "#EF4444", textAlign: "center" }}>
                    {cfg.rsvp.messages.error}
                  </p>
                )}
              </form>
            )}
          </div>
        </section>
      )}

"""

# ── Assemble new file content ─────────────────────────────────────────────────
prefix  = "".join(lines[:HERO_S])
footer  = "".join(lines[FOOTER_S:])

new_content = (
    prefix +
    HERO_JSX +
    STORY_JSX +
    ROADMAP_JSX +
    DETAILS_JSX +
    VENUE_JSX +
    GALLERY_JSX +
    RSVP_JSX +
    footer
)

with open(FILE, "w", encoding="utf-8", newline="\n") as f:
    f.write(new_content)

new_lines = new_content.count("\n") + 1
print(f"Done! New line count: ~{new_lines}")
