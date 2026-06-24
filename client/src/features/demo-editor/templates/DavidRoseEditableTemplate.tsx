/**
 * DavidRoseEditableTemplate.tsx
 * Demo-only editable renderer for the David & Rose Romantic template.
 *
 * SAFETY: This file is COMPLETELY ISOLATED from the live RomanticTemplate.
 * It renders sections in-line (no shared component imports) and wraps
 * every editable element with <EditableElement> for click-to-edit support.
 *
 * DO NOT import this file from any live template or page.
 */
import { useState, useEffect, useRef } from "react";
import type { WeddingConfig } from "@/templates/types";
import EditableElement from "../click-editor/EditableElement";

interface Props {
  config: WeddingConfig;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function useCountdown(targetDate: string) {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    function calc() {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) { setTime({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTime({ days: d, hours: h, minutes: m, seconds: s });
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  return time;
}

function SectionHint({ children }: { children: string }) {
  return (
    <div
      className="text-center text-xs font-medium tracking-widest uppercase mb-3 opacity-60"
      style={{ letterSpacing: "0.2em" }}
    >
      {children}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function DavidRoseEditableTemplate({ config }: Props) {
  const colors = config.theme?.colors ?? {};
  const fonts = config.theme?.fonts ?? {};
  const primary = colors.primary || "#9f1239";
  const secondary = colors.secondary || "#be123c";
  const accent = colors.accent || "#a855f7";
  const bg = colors.background || "#fdf2f8";
  const text = colors.textColor || "#3c1a3c";
  // Semantic roles for readability across all palette types
  const lightText = colors.lightText || "white";
  const mutedText = colors.mutedText || `${primary}99`;
  const headingFont = fonts.heading || "Playfair Display, serif";
  const bodyFont = fonts.body || "Inter, sans-serif";
  const sections = config.sections ?? {};
  const countdown = useCountdown(config.wedding?.date ?? "");

  const heroImages = (config.hero?.images ?? []).filter(Boolean);
  const heroImage = heroImages[0] || "/attached_assets/couple11.jpg";

  const navLinks = [
    { key: "home",      label: config.navigation?.home      ?? "Home",      href: "#hero" },
    { key: "countdown", label: config.navigation?.countdown ?? "Countdown", href: "#countdown" },
    { key: "calendar",  label: config.navigation?.calendar  ?? "Calendar",  href: "#calendar" },
    { key: "locations", label: config.navigation?.locations ?? "Venues",    href: "#locations" },
    { key: "timeline",  label: config.navigation?.timeline  ?? "Schedule",  href: "#timeline" },
    { key: "rsvp",      label: config.navigation?.rsvp      ?? "RSVP",      href: "#rsvp" },
    { key: "photos",    label: config.navigation?.photos    ?? "Photos",    href: "#photos" },
  ];

  // ── Inline CSS variables ──────────────────────────────────────────────────
  const rootStyle: React.CSSProperties = {
    "--demo-primary": primary,
    "--demo-secondary": secondary,
    "--demo-accent": accent,
    "--demo-bg": bg,
    "--demo-text": text,
    "--demo-heading-font": headingFont,
    "--demo-body-font": bodyFont,
    background: bg,
    color: text,
    fontFamily: bodyFont,
  } as React.CSSProperties;

  return (
    <div style={rootStyle} className="min-h-screen">

      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <nav
        style={{ background: `${primary}f0`, backdropFilter: "blur(8px)" }}
        className="fixed top-0 left-0 right-0 z-50 shadow-sm"
      >
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <EditableElement path="couple.combinedNames" label="Combined Names" type="text">
            <span style={{ color: "white", fontFamily: headingFont, fontWeight: 600, fontSize: "1rem" }}>
              {config.couple?.combinedNames || `${config.couple?.groomName} & ${config.couple?.brideName}`}
            </span>
          </EditableElement>
          <div className="hidden md:flex items-center gap-5">
            {navLinks.map((link) => (
              <a
                key={link.key}
                href={link.href}
                style={{ color: "rgba(255,255,255,0.85)", fontFamily: bodyFont, fontSize: "0.8rem" }}
                className="hover:text-white transition-colors"
                onClick={(e) => e.preventDefault()}
              >
                <EditableElement path={`navigation.${link.key}`} label={`Nav: ${link.label}`} type="text">
                  {link.label}
                </EditableElement>
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      {sections.hero?.enabled !== false && (
        <section
          id="hero"
          style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", paddingTop: "4rem" }}
        >
          {/* Background image */}
          <EditableElement path="hero.images" label="Hero Background Image" type="image" block className="absolute inset-0">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${heroImage})` }}
            />
          </EditableElement>
          <div className="absolute inset-0 bg-black/35" />

          {/* Content */}
          <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
            <div style={{ marginBottom: "1.5rem" }}>
              <EditableElement path="couple.groomName" label="Groom's Name" type="text">
                <span
                  style={{ fontFamily: headingFont, fontSize: "clamp(2.5rem,8vw,4.5rem)", fontWeight: 700, color: "white", textShadow: "0 2px 8px rgba(0,0,0,0.4)", letterSpacing: "-0.01em" }}
                >
                  {config.couple?.groomName}
                </span>
              </EditableElement>
              <span style={{ color: accent, fontSize: "clamp(2rem,6vw,3.5rem)", margin: "0 1rem" }}>
                <EditableElement path="footer.separator" label="Separator Symbol" type="icon">
                  {config.footer?.separator || "💕"}
                </EditableElement>
              </span>
              <EditableElement path="couple.brideName" label="Bride's Name" type="text">
                <span
                  style={{ fontFamily: headingFont, fontSize: "clamp(2.5rem,8vw,4.5rem)", fontWeight: 700, color: "white", textShadow: "0 2px 8px rgba(0,0,0,0.4)", letterSpacing: "-0.01em" }}
                >
                  {config.couple?.brideName}
                </span>
              </EditableElement>
            </div>

            <EditableElement path="hero.invitation" label="Invitation Text" type="textarea" block>
              <p style={{ fontFamily: bodyFont, fontSize: "1.2rem", color: "rgba(255,255,255,0.9)", marginBottom: "1rem" }}>
                {config.hero?.invitation}
              </p>
            </EditableElement>

            <EditableElement path="hero.welcomeMessage" label="Welcome Message" type="textarea" block>
              <p style={{ fontFamily: bodyFont, fontSize: "1rem", color: "rgba(255,255,255,0.8)", maxWidth: "36rem", margin: "0 auto" }}>
                {config.hero?.welcomeMessage}
              </p>
            </EditableElement>

            <div style={{ marginTop: "2rem" }}>
              <EditableElement path="wedding.displayDate" label="Wedding Date Display" type="text">
                <span
                  style={{ display: "inline-block", background: `${primary}cc`, color: "white", padding: "0.5rem 1.5rem", borderRadius: "2rem", fontFamily: bodyFont, fontSize: "1rem", backdropFilter: "blur(4px)" }}
                >
                  {config.wedding?.displayDate}
                </span>
              </EditableElement>
            </div>
          </div>
        </section>
      )}

      {/* ── Countdown ─────────────────────────────────────────────────────── */}
      {sections.countdown?.enabled !== false && (
        <section
          id="countdown"
          style={{
            padding: "5rem 1rem",
            background: config.countdown?.backgroundImage
              ? `linear-gradient(rgba(0,0,0,0.55),rgba(0,0,0,0.55)), url(${config.countdown.backgroundImage}) center/cover no-repeat`
              : `linear-gradient(rgba(0,0,0,0.28), rgba(0,0,0,0.28)), linear-gradient(135deg, ${primary}, ${secondary})`,
            color: lightText,
            textAlign: "center",
            position: "relative",
          }}
        >
          <EditableElement path="countdown.backgroundImage" label="Countdown Background Image" type="image" block
            className="absolute inset-0 opacity-0 pointer-events-none">
            <div className="absolute inset-0" />
          </EditableElement>

          <EditableElement path="countdown.subtitle" label="Countdown Subtitle" type="text" block>
            <p style={{ fontFamily: bodyFont, fontSize: "1rem", marginBottom: "2.5rem", opacity: 0.9, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {config.countdown?.subtitle}
            </p>
          </EditableElement>

          <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem", flexWrap: "wrap" }}>
            {[
              { value: countdown.days,    path: "countdown.labels.days",    label: config.countdown?.labels?.days    || "Days" },
              { value: countdown.hours,   path: "countdown.labels.hours",   label: config.countdown?.labels?.hours   || "Hours" },
              { value: countdown.minutes, path: "countdown.labels.minutes", label: config.countdown?.labels?.minutes || "Minutes" },
              { value: countdown.seconds, path: "countdown.labels.seconds", label: config.countdown?.labels?.seconds || "Seconds" },
            ].map(({ value, path, label }) => (
              <div key={path} style={{ textAlign: "center", minWidth: "80px" }}>
                <div style={{ fontFamily: headingFont, fontSize: "3.5rem", fontWeight: 700, lineHeight: 1 }}>
                  {String(value).padStart(2, "0")}
                </div>
                <EditableElement path={path} label={`Label: ${label}`} type="text">
                  <span style={{ fontFamily: bodyFont, fontSize: "0.75rem", opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    {label}
                  </span>
                </EditableElement>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Calendar ──────────────────────────────────────────────────────── */}
      {sections.calendar?.enabled !== false && (
        <section id="calendar" style={{ padding: "5rem 1rem", textAlign: "center", background: bg }}>
          <EditableElement path="calendar.title" label="Calendar Title" type="text" block>
            <h2 style={{ fontFamily: headingFont, fontSize: "2rem", fontWeight: 700, color: primary, marginBottom: "0.75rem" }}>
              {config.calendar?.title}
            </h2>
          </EditableElement>
          <EditableElement path="calendar.description" label="Calendar Description" type="text" block>
            <p style={{ fontFamily: bodyFont, fontSize: "1rem", opacity: 0.7, marginBottom: "2rem" }}>
              {config.calendar?.description}
            </p>
          </EditableElement>
          {/* Simple calendar display */}
          <div style={{ display: "inline-block", background: "white", borderRadius: "1rem", padding: "1.5rem 2rem", boxShadow: `0 4px 24px ${primary}22` }}>
            <EditableElement path="calendar.monthTitle" label="Month Label" type="text" block>
              <div style={{ fontFamily: headingFont, fontSize: "1.1rem", fontWeight: 600, color: primary, marginBottom: "1rem" }}>
                {config.calendar?.monthTitle}
              </div>
            </EditableElement>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 2rem)", gap: "0.25rem", textAlign: "center" }}>
              {(config.calendar?.dayLabels ?? ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]).map((d) => (
                <div key={d} style={{ fontFamily: bodyFont, fontSize: "0.7rem", color: primary, fontWeight: 600, padding: "0.2rem" }}>{d}</div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Locations ─────────────────────────────────────────────────────── */}
      {sections.locations?.enabled !== false && config.locations?.venues?.length > 0 && (
        <section id="locations" style={{ padding: "5rem 1rem", background: `${bg}ee` }}>
          <div style={{ maxWidth: "56rem", margin: "0 auto", textAlign: "center" }}>
            <EditableElement path="locations.sectionTitle" label="Venues Section Title" type="text" block>
              <h2 style={{ fontFamily: headingFont, fontSize: "2rem", fontWeight: 700, color: primary, marginBottom: "3rem" }}>
                {config.locations.sectionTitle}
              </h2>
            </EditableElement>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.5rem" }}>
              {config.locations.venues.map((venue, idx) => (
                <VenueCard key={venue.id} venue={venue} idx={idx} primary={primary} secondary={secondary} bodyFont={bodyFont} headingFont={headingFont} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Timeline ──────────────────────────────────────────────────────── */}
      {sections.timeline?.enabled !== false && (
        <section id="timeline" style={{ padding: "5rem 1rem", background: "white" }}>
          <div style={{ maxWidth: "42rem", margin: "0 auto" }}>
            <EditableElement path="timeline.title" label="Schedule Title" type="text" block>
              <h2 style={{ fontFamily: headingFont, fontSize: "2rem", fontWeight: 700, color: primary, textAlign: "center", marginBottom: "3rem" }}>
                {config.timeline?.title}
              </h2>
            </EditableElement>
            <div style={{ position: "relative" }}>
              {/* Vertical line */}
              <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: "2px", background: `${primary}33`, transform: "translateX(-50%)" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {(config.timeline?.events ?? []).map((evt, i) => (
                  <div key={evt.id ?? i} style={{ display: "flex", alignItems: "flex-start", gap: "1rem", position: "relative", paddingLeft: i % 2 === 0 ? 0 : "calc(50% + 1.5rem)", paddingRight: i % 2 === 0 ? "calc(50% + 1.5rem)" : 0 }}>
                    <div style={{ background: primary, color: "white", borderRadius: "50%", width: "2.5rem", height: "2.5rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "0.9rem", fontWeight: 600, zIndex: 1 }}>
                      {evt.icon || "💍"}
                    </div>
                    <div>
                      <div style={{ fontFamily: bodyFont, fontSize: "0.75rem", color: primary, fontWeight: 600, marginBottom: "0.2rem" }}>
                        {evt.time}
                      </div>
                      <div style={{ fontFamily: headingFont, fontSize: "1rem", fontWeight: 600, color: text }}>
                        {evt.title}
                      </div>
                      {evt.description && (
                        <div style={{ fontFamily: bodyFont, fontSize: "0.85rem", opacity: 0.6, marginTop: "0.25rem" }}>
                          {evt.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* After message */}
            {config.timeline?.afterMessage && (
              <div style={{ textAlign: "center", marginTop: "3rem", padding: "2rem", background: `${primary}0d`, borderRadius: "1rem" }}>
                <EditableElement path="timeline.afterMessage.thankYou" label="Thank You Line" type="text" block>
                  <p style={{ fontFamily: headingFont, fontSize: "1.1rem", fontWeight: 600, color: primary, marginBottom: "0.75rem" }}>
                    {config.timeline.afterMessage.thankYou}
                  </p>
                </EditableElement>
                <EditableElement path="timeline.afterMessage.notes" label="Notes / Reminders" type="textarea" block>
                  <p style={{ fontFamily: bodyFont, fontSize: "0.9rem", opacity: 0.7, whiteSpace: "pre-line" }}>
                    {config.timeline.afterMessage.notes}
                  </p>
                </EditableElement>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── RSVP ──────────────────────────────────────────────────────────── */}
      {sections.rsvp?.enabled !== false && (
        <section id="rsvp" style={{ padding: "5rem 1rem", background: `linear-gradient(135deg, ${primary}0d, ${secondary}0d)` }}>
          <div style={{ maxWidth: "36rem", margin: "0 auto", textAlign: "center" }}>
            <EditableElement path="rsvp.title" label="RSVP Title" type="text" block>
              <h2 style={{ fontFamily: headingFont, fontSize: "2rem", fontWeight: 700, color: primary, marginBottom: "0.75rem" }}>
                {config.rsvp?.title}
              </h2>
            </EditableElement>
            <EditableElement path="rsvp.description" label="RSVP Description" type="textarea" block>
              <p style={{ fontFamily: bodyFont, opacity: 0.7, marginBottom: "2.5rem" }}>
                {config.rsvp?.description}
              </p>
            </EditableElement>

            {/* Demo form — not functional, just shows editable labels */}
            <div style={{ background: "white", borderRadius: "1.25rem", padding: "2rem", boxShadow: `0 4px 24px ${primary}1a`, textAlign: "left" }}>
              <p style={{ textAlign: "center", fontSize: "0.75rem", color: mutedText, marginBottom: "1.5rem", fontStyle: "italic" }}>
                Form labels are editable — click any label to change it
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <FormField label={config.rsvp?.form?.firstName ?? "First Name"} path="rsvp.form.firstName" placeholder={config.rsvp?.form?.firstNamePlaceholder} bodyFont={bodyFont} primary={primary} />
                <FormField label={config.rsvp?.form?.lastName ?? "Last Name"} path="rsvp.form.lastName" placeholder={config.rsvp?.form?.lastNamePlaceholder} bodyFont={bodyFont} primary={primary} />
              </div>
              <FormField label={config.rsvp?.form?.email ?? "Email"} path="rsvp.form.email" placeholder={config.rsvp?.form?.emailPlaceholder} bodyFont={bodyFont} primary={primary} />
              <div style={{ marginTop: "1rem" }}>
                <EditableElement path="rsvp.form.attendance" label="Attendance Label" type="text" block>
                  <label style={{ fontFamily: bodyFont, fontSize: "0.8rem", fontWeight: 600, color: text, display: "block", marginBottom: "0.5rem" }}>
                    {config.rsvp?.form?.attendance}
                  </label>
                </EditableElement>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  {[
                    { path: "rsvp.form.attendingYes", value: config.rsvp?.form?.attendingYes ?? "Attending", selected: true },
                    { path: "rsvp.form.attendingNo", value: config.rsvp?.form?.attendingNo ?? "Declining", selected: false },
                  ].map(({ path: p, value, selected }) => (
                    <EditableElement key={p} path={p} label={selected ? '"Attending" Text' : '"Declining" Text'} type="text">
                      <button
                        style={{
                          flex: 1, padding: "0.6rem 1rem", borderRadius: "0.5rem", fontFamily: bodyFont, fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
                          background: selected ? primary : "transparent",
                          color: selected ? "white" : primary,
                          border: `2px solid ${primary}`,
                        }}
                      >
                        {value}
                      </button>
                    </EditableElement>
                  ))}
                </div>
              </div>
              <EditableElement path="rsvp.form.submitButton" label="Submit Button Text" type="button" block>
                <button
                  style={{ marginTop: "1.5rem", width: "100%", padding: "0.875rem", borderRadius: "0.75rem", background: primary, color: "white", fontFamily: bodyFont, fontWeight: 700, fontSize: "1rem", border: "none", cursor: "pointer" }}
                >
                  {config.rsvp?.form?.submitButton ?? "Send RSVP"}
                </button>
              </EditableElement>
            </div>
          </div>
        </section>
      )}

      {/* ── Gallery ───────────────────────────────────────────────────────── */}
      {sections.photos?.enabled !== false && (
        <section id="photos" style={{ padding: "5rem 1rem", background: "white", textAlign: "center" }}>
          <EditableElement path="photos.title" label="Gallery Title" type="text" block>
            <h2 style={{ fontFamily: headingFont, fontSize: "2rem", fontWeight: 700, color: primary, marginBottom: "0.75rem" }}>
              {config.photos?.title}
            </h2>
          </EditableElement>
          <EditableElement path="photos.description" label="Gallery Description" type="text" block>
            <p style={{ fontFamily: bodyFont, opacity: 0.7, marginBottom: "2rem" }}>
              {config.photos?.description}
            </p>
          </EditableElement>

          {(config.photos?.galleryImages ?? []).length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.75rem", maxWidth: "56rem", margin: "0 auto" }}>
              {(config.photos?.galleryImages ?? []).map((src, i) => (
                <EditableElement key={i} path={`photos.galleryImages`} label="Gallery Image" type="image" block>
                  <img src={src} alt="" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: "0.75rem" }} />
                </EditableElement>
              ))}
            </div>
          ) : (
            <EditableElement path="photos.comingSoonMessage" label="Coming Soon Text" type="text" block>
              <div style={{ padding: "3rem", background: `${primary}0a`, borderRadius: "1rem", maxWidth: "36rem", margin: "0 auto" }}>
                <p style={{ fontFamily: bodyFont, opacity: 0.6, fontSize: "1rem" }}>
                  {config.photos?.comingSoonMessage}
                </p>
              </div>
            </EditableElement>
          )}
        </section>
      )}

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer
        style={{
          background: `linear-gradient(135deg, ${primary}, ${secondary})`,
          color: "white",
          textAlign: "center",
          padding: "4rem 1rem",
        }}
      >
        <div style={{ fontFamily: headingFont, fontSize: "2rem", fontWeight: 700, marginBottom: "1rem" }}>
          <EditableElement path="couple.groomName" label="Groom's Name" type="text">
            {config.couple?.groomName}
          </EditableElement>
          <span style={{ color: accent, margin: "0 0.75rem" }}>
            <EditableElement path="footer.separator" label="Separator Symbol" type="icon">
              {config.footer?.separator || "💕"}
            </EditableElement>
          </span>
          <EditableElement path="couple.brideName" label="Bride's Name" type="text">
            {config.couple?.brideName}
          </EditableElement>
        </div>
        <EditableElement path="footer.thankYouMessage" label="Footer Message" type="textarea" block>
          <p style={{ fontFamily: bodyFont, opacity: 0.85, maxWidth: "32rem", margin: "0 auto" }}>
            {config.footer?.thankYouMessage}
          </p>
        </EditableElement>
      </footer>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function VenueCard({ venue, idx, primary, secondary, bodyFont, headingFont }: {
  venue: WeddingConfig["locations"]["venues"][0];
  idx: number;
  primary: string; secondary: string; bodyFont: string; headingFont: string;
}) {
  return (
    <div style={{ background: "white", borderRadius: "1rem", overflow: "hidden", boxShadow: `0 4px 20px ${primary}18` }}>
      {venue.image ? (
        <EditableElement path={`locations.venues.${idx}.image`} label="Venue Image" type="image" block>
          <img src={venue.image} alt={venue.name} style={{ width: "100%", height: "10rem", objectFit: "cover" }} />
        </EditableElement>
      ) : (
        <div style={{ height: "10rem", background: `linear-gradient(135deg, ${primary}22, ${secondary}22)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "2.5rem" }}>📍</span>
        </div>
      )}
      <div style={{ padding: "1.25rem", textAlign: "left" }}>
        <EditableElement path={`locations.venues.${idx}.title`} label="Venue Tab Label" type="text" block>
          <div style={{ fontFamily: bodyFont, fontSize: "0.7rem", color: primary, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.35rem" }}>
            {venue.title}
          </div>
        </EditableElement>
        <EditableElement path={`locations.venues.${idx}.name`} label="Venue Name" type="text" block>
          <h3 style={{ fontFamily: headingFont, fontSize: "1.1rem", fontWeight: 700, color: primary, marginBottom: "0.35rem" }}>
            {venue.name}
          </h3>
        </EditableElement>
        <EditableElement path={`locations.venues.${idx}.description`} label="Venue Description" type="textarea" block>
          <p style={{ fontFamily: bodyFont, fontSize: "0.85rem", opacity: 0.7 }}>
            {venue.description}
          </p>
        </EditableElement>
        {venue.address && (
          <EditableElement path={`locations.venues.${idx}.address`} label="Venue Address" type="text" block>
            <p style={{ fontFamily: bodyFont, fontSize: "0.8rem", opacity: 0.55, marginTop: "0.5rem" }}>
              {venue.address}
            </p>
          </EditableElement>
        )}
      </div>
    </div>
  );
}

function FormField({ label, path, placeholder, bodyFont, primary }: {
  label: string; path: string; placeholder?: string; bodyFont: string; primary: string;
}) {
  return (
    <div>
      <EditableElement path={path} label={`Label: ${label}`} type="text" block>
        <label style={{ fontFamily: bodyFont, fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: "0.35rem" }}>
          {label}
        </label>
      </EditableElement>
      <input
        readOnly
        placeholder={placeholder ?? label}
        style={{ width: "100%", padding: "0.6rem 0.85rem", borderRadius: "0.5rem", border: `1.5px solid ${primary}33`, fontFamily: bodyFont, fontSize: "0.875rem", background: "white", boxSizing: "border-box" }}
      />
    </div>
  );
}
