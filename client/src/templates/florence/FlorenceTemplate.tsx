/**
 * Florence Eternal — Premium wedding template
 * Visual reference: luxury editorial, dark olive / gold / ivory palette
 * Isolated to Main Templates v2. Does NOT modify global styles.
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { insertRsvpSchema, type InsertRsvp } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import type { WeddingConfig } from "../types";
import { defaultConfig, type FlorenceExtendedConfig } from "./config";

// ─── Color palette constants ──────────────────────────────────────────────────
const C_DEFAULT = {
  darkOlive:  "#252B1F",
  midOlive:   "#2E3427",
  lightOlive: "#363D2B",
  borderCard: "#3E4732",
  gold:       "#C9A86A",
  goldLight:  "#D6B77A",
  ivory:      "#F5F1EA",
  ivoryWarm:  "#F7F4EF",
  beige:      "#EDE7DE",
  grayText:   "#6E685F",
  whiteText:  "#F8F7F3",
  white:      "#FFFFFF",
} as const;

// ─── Font shortcuts ───────────────────────────────────────────────────────────
const SERIF_DEFAULT = "'Playfair Display', Georgia, serif";
const SANS_DEFAULT  = "Montserrat, 'Inter', sans-serif";

// ─── Scroll entrance animation hook ──────────────────────────────────────────
function useSectionAnim(animType: string, builderMode: boolean) {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (builderMode || !animType || animType === "none") { setActive(true); return; }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setActive(true); obs.disconnect(); } },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [animType, builderMode]);

  const hasAnim = !builderMode && !!animType && animType !== "none";
  const style: React.CSSProperties = !hasAnim
    ? {}
    : active
    ? { animation: `flo-${animType} 0.75s cubic-bezier(0.25, 0.46, 0.45, 0.94) both` }
    : {
        opacity: 0,
        ...(animType === "fade-up"  ? { transform: "translateY(32px)" } : {}),
        ...(animType === "slide-in" ? { transform: "translateX(-48px)" } : {}),
        ...(animType === "zoom-in"  ? { transform: "scale(0.93)" } : {}),
      };

  return { ref, style };
}

interface FlorenceTemplateProps {
  config: WeddingConfig;
  templateId?: string;
  /** When true: sticky nav, data-v2-section attrs, no scroll-based nav transition */
  builderMode?: boolean;
}

export default function FlorenceTemplate({ config, templateId, builderMode = false }: FlorenceTemplateProps) {
  // Merge with defaults
  const cfg: WeddingConfig = {
    ...defaultConfig,
    ...config,
    couple:    { ...defaultConfig.couple,   ...(config.couple   || {}) },
    wedding:   { ...defaultConfig.wedding,  ...(config.wedding  || {}) },
    hero:      { ...defaultConfig.hero,     ...(config.hero     || {}) },
    timeline:  { ...defaultConfig.timeline, ...(config.timeline || {}) },
    locations: { ...defaultConfig.locations, ...(config.locations || {}) },
    rsvp:      {
      ...defaultConfig.rsvp,
      ...(config.rsvp || {}),
      form: { ...defaultConfig.rsvp.form, ...(config.rsvp?.form || {}) },
    },
    photos:    { ...defaultConfig.photos, ...(config.photos || {}) },
    footer:    { ...defaultConfig.footer,   ...(config.footer   || {}) },
  };

  // Extended Florence-specific config stored as optional top-level keys in JSONB
  const ext = cfg as any as FlorenceExtendedConfig & WeddingConfig;

  // -- Dynamic theme (overrides from cfg.theme) ------------------------------
  // Cast to wide Record so Florence-specific palette keys (lightText, mutedText,
  // cardBorder, cardBackground) are accepted without modifying WeddingConfig types.
  const colors = (cfg.theme?.colors ?? {}) as Record<string, string | undefined>;
  const C = {
    ...C_DEFAULT,
    // Accent / gold tones
    gold:       colors.primary        ?? C_DEFAULT.gold,
    goldLight:  colors.primary        ?? C_DEFAULT.goldLight,
    // Dark background tones (all dark sections follow secondary)
    darkOlive:  colors.secondary      ?? C_DEFAULT.darkOlive,
    midOlive:   colors.secondary      ?? C_DEFAULT.midOlive,
    lightOlive: colors.secondary      ?? C_DEFAULT.lightOlive,
    // Card chrome
    borderCard: colors.cardBorder     ?? C_DEFAULT.borderCard,
    // Light background tones
    ivory:      colors.background     ?? C_DEFAULT.ivory,
    ivoryWarm:  colors.background     ?? C_DEFAULT.ivoryWarm,
    beige:      colors.cardBackground ?? C_DEFAULT.beige,
    // Text on light sections (story body, venue description, journey subtitles)
    grayText:   colors.mutedText      ?? colors.textColor ?? C_DEFAULT.grayText,
    // Text on dark sections (hero, nav, countdown, details, RSVP, footer)
    // Reads lightText ONLY � never polluted by textColor
    whiteText:  colors.lightText      ?? C_DEFAULT.whiteText,
  } as typeof C_DEFAULT;
  const SERIF = cfg.theme?.fonts?.heading || SERIF_DEFAULT;
  const SANS  = cfg.theme?.fonts?.body    || SANS_DEFAULT;

  // ── Derived content ──────────────────────────────────────────────────────
  const groomName      = cfg.couple.groomName  ?? "Alexander";
  const brideName      = cfg.couple.brideName  ?? "Rosalie";
  const nameSeparator  = (ext as any).nameSeparator ?? "&";
  const displayDate = cfg.wedding.displayDate || "12 • 07 • 2025";
  const heroLocation = ext.heroLocation ?? "FLORENCE, ITALY";
  const heroIntro    = ext.heroIntro    ?? cfg.hero.invitation ?? "TOGETHER WITH THEIR FAMILIES";
  const heroSub      = ext.heroSub      ?? cfg.hero.welcomeMessage ?? "INVITE YOU TO CELEBRATE THEIR WEDDING";
  const heroImage    = (cfg.hero.images && cfg.hero.images[0]) || "";

  const storyTitle         = ext.storyTitle         ?? "Two paths. One forever.";
  const storyTitleEmphasis = ext.storyTitleEmphasis ?? "forever.";
  const storyText          = ext.storyText          ??
    "We met on a rainy afternoon in a small bookstore. What started as a simple conversation turned into a beautiful journey we now get to continue — together.";
  const storyCtaLabel = ext.storyCtaLabel ?? "READ OUR STORY";
  const storyImages   = cfg.photos.images || [];
  const storyMonogramHidden  = (ext as any).storyMonogramHidden  === true;
  const storyMonogramOpacity = typeof (ext as any).storyMonogramOpacity === "number"
    ? (ext as any).storyMonogramOpacity
    : 1;
  const storyMonogramTop  = (ext as any).storyMonogramTop  ?? "A";
  const storyMonogramBtm  = (ext as any).storyMonogramBtm  ?? "R";

  const journeyHeading  = ext.journeyHeading  ?? "Every moment led us here.";
  const journeyMilestones = cfg.timeline.events.length > 0
    ? cfg.timeline.events
    : defaultConfig.timeline.events;

  const venues      = cfg.locations.venues;
  const venueTitle       = ext.venueTitle       ?? "Villa di Maiano";
  const venueSubtitle    = ext.venueSubtitle    ?? "THE VENUE";
  const venueDescription = ext.venueDescription ??
    "A timeless Italian villa surrounded by cypress trees and rolling hills.";
  const venueCtaLabel    = ext.venueCtaLabel    ?? "VIEW VENUE";
  const venueAddress     = ext.venueAddress     ?? "Via del Salviatino, 6\n50137 Florence, Italy";
  const venueMapUrl      = ext.venueMapUrl      || (venues[2]?.address ? `https://www.google.com/maps/search/${encodeURIComponent(venues[2].address)}` : "#");

  const galleryImages = cfg.photos.galleryImages || [];

  const socialInstagram = ext.socialInstagram || "#";
  const socialFacebook  = ext.socialFacebook  || "#";
  const socialEmail     = ext.socialEmail     || "#";

  // ── Countdown state ────────────────────────────────────────────────────────
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const target = new Date(cfg.wedding.date || defaultConfig.wedding.date).getTime();
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setCountdown({
        days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours:   Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [cfg.wedding.date]);

  // ── Gallery slider ─────────────────────────────────────────────────────────
  const GALLERY_VISIBLE = 4;
  const [galleryOffset, setGalleryOffset] = useState(0);
  const galleryItems = galleryImages.length > 0 ? galleryImages : PLACEHOLDER_GALLERY;
  const maxOffset = Math.max(0, galleryItems.length - GALLERY_VISIBLE);
  const prevGallery = () => setGalleryOffset(o => Math.max(0, o - 1));
  const nextGallery = () => setGalleryOffset(o => Math.min(maxOffset, o + 1));

  // ── Nav scroll state ──────────────────────────────────────────────────────
  const [scrolled, setScrolled] = useState(builderMode ? true : false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    if (builderMode) return;
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [builderMode]);

  // ── RSVP form ──────────────────────────────────────────────────────────────
  const [rsvpSuccess, setRsvpSuccess] = useState(false);
  const form = useForm<InsertRsvp>({
    resolver: zodResolver(insertRsvpSchema),
    defaultValues: {
      templateId: templateId || "",
      firstName:  "",
      lastName:   "",
      email:      "",
      guestEmail: "",
      guestCount: "1",
      guestNames: "",
      attendance: "attending",
      attending:  true,
      guests:     1,
    },
  });

  const rsvpMutation = useMutation({
    mutationFn: async (data: InsertRsvp) => {
      const endpoint = templateId
        ? `/api/templates/${templateId}/rsvp`
        : "/api/rsvp";
      const res = await apiRequest("POST", endpoint, data);
      return res.json();
    },
    onSuccess: () => {
      setRsvpSuccess(true);
      form.reset();
    },
  });

  const onSubmit = (data: InsertRsvp) => {
    rsvpMutation.mutate({
      ...data,
      templateId: templateId || data.templateId,
      guestEmail: data.email,
      attending:  data.attendance === "attending",
      guests:     parseInt(data.guestCount) || 1,
    });
  };

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  }, []);

  // ── Section entrance animations ────────────────────────────────────────────
  const _s = (cfg.sections as any) || {};
  const heroAnim    = useSectionAnim(_s.hero?.animation     || "none", builderMode);
  const storyAnim   = useSectionAnim(_s.story?.animation    || "none", builderMode);
  const cdownAnim   = useSectionAnim(_s.countdown?.animation || "none", builderMode);
  const journeyAnim = useSectionAnim(_s.journey?.animation  || "none", builderMode);
  const detailsAnim = useSectionAnim(_s.details?.animation  || "none", builderMode);
  const venueAnim   = useSectionAnim(_s.venue?.animation    || "none", builderMode);
  const galleryAnim = useSectionAnim(_s.gallery?.animation  || "none", builderMode);
  const rsvpAnim    = useSectionAnim(_s.rsvp?.animation     || "none", builderMode);

  // ── Journey layout + scroll dot animation ──────────────────────────────────
  const journeyLayout: "horizontal" | "vertical" = (ext as any).journeyLayout || "horizontal";
  const milestoneRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeDots, setActiveDots] = useState<Set<number>>(new Set());

  // Reset active dots when layout or milestones change
  useEffect(() => { setActiveDots(new Set()); }, [journeyLayout, journeyMilestones.length]);

  // Observe each milestone dot for scroll activation (preview only)
  useEffect(() => {
    if (builderMode) { setActiveDots(new Set(journeyMilestones.map((_, i) => i))); return; }
    const observers: IntersectionObserver[] = [];
    milestoneRefs.current.forEach((el, idx) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveDots(prev => new Set([...Array.from(prev), idx])); },
        { threshold: 0.5 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  }, [builderMode, journeyLayout, journeyMilestones.length]);

  // ── Nav links ──────────────────────────────────────────────────────────────
  const navLinks = [
    { label: "HOME",       id: "flo-hero" },
    { label: "OUR STORY",  id: "flo-story" },
    { label: "WEDDING",    id: "flo-details" },
    { label: "DETAILS",    id: "flo-venue" },
    { label: "GALLERY",    id: "flo-gallery" },
    { label: "RSVP",       id: "flo-rsvp" },
  ];

  // ── Section ordering (opt-in via sectionOrder in config) ──────────────────
  const _savedSectionOrder: string[] | undefined = (cfg as any).sectionOrder;
  const getSectionOrder = _savedSectionOrder
    ? (id: string) => { const i = _savedSectionOrder.indexOf(id); return i === -1 ? 99 : i; }
    : null;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{
      fontFamily: SANS,
      background: C.ivory,
      color: C.darkOlive,
      ...(getSectionOrder ? { display: "flex", flexDirection: "column" } : {}),
    }}>

      {/* ── 1. NAVIGATION ──────────────────────────────────────────────── */}
      <nav style={{
        ...(getSectionOrder ? { order: -1 } : {}),
        position:   builderMode ? "sticky" : "fixed",
        top:        0,
        left:       0,
        right:      0,
        zIndex:     100,
        transition: "background 0.4s, box-shadow 0.4s",
        background: scrolled ? `${C.darkOlive}F2` : "transparent",
        boxShadow:  scrolled ? "0 2px 20px rgba(0,0,0,0.3)" : "none",
        padding:    "0 2rem",
      }}>
        <div style={{
          maxWidth: "1200px",
          margin:   "0 auto",
          display:  "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height:   "72px",
        }}>
          {/* Monogram */}
          <button
            onClick={() => scrollTo("flo-hero")}
            style={{
              fontFamily:  SERIF,
              fontSize:    "1.2rem",
              color:       C.goldLight,
              letterSpacing: "0.15em",
              fontStyle:   "italic",
              background:  "none",
              border:      "none",
              cursor:      "pointer",
              flexShrink:  0,
            }}
          >
            {groomName[0]} <span style={{ color: C.white, fontStyle: "normal", opacity: 0.6 }}>/</span> {brideName[0]}
          </button>

          {/* Desktop nav */}
          <div className="flo-desktop-nav" style={{ display: "flex", gap: "2rem" }}>
            {navLinks.map(link => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                style={{
                  background:    "none",
                  border:        "none",
                  cursor:        "pointer",
                  fontFamily:    SANS,
                  fontSize:      "0.7rem",
                  fontWeight:    600,
                  letterSpacing: "0.2em",
                  color:         C.whiteText,
                  opacity:       0.85,
                  padding:       "4px 0",
                  transition:    "color 0.2s, opacity 0.2s",
                }}
                onMouseEnter={e => {
                  (e.target as HTMLElement).style.color   = C.goldLight;
                  (e.target as HTMLElement).style.opacity = "1";
                }}
                onMouseLeave={e => {
                  (e.target as HTMLElement).style.color   = C.whiteText;
                  (e.target as HTMLElement).style.opacity = "0.85";
                }}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* RSVP pill + hamburger */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              onClick={() => scrollTo("flo-rsvp")}
              className="flo-rsvp-pill"
              style={{
                background:    C.gold,
                color:         C.darkOlive,
                border:        "none",
                borderRadius:  "999px",
                padding:       "8px 22px",
                fontSize:      "0.7rem",
                fontWeight:    700,
                letterSpacing: "0.15em",
                cursor:        "pointer",
                fontFamily:    SANS,
                transition:    "background 0.2s",
              }}
            >
              RSVP
            </button>
            {/* Hamburger — mobile only (shown via inline media query workaround using state) */}
            <button
              className="flo-hamburger"
              onClick={() => setMobileOpen(o => !o)}
              style={{
                display:    "none", // shown via CSS class on mobile
                background: "none",
                border:     "none",
                cursor:     "pointer",
                padding:    "4px",
              }}
              aria-label="Toggle menu"
            >
              <span style={{ display: "block", width: 22, height: 2, background: C.whiteText, margin: "4px 0" }} />
              <span style={{ display: "block", width: 22, height: 2, background: C.whiteText, margin: "4px 0" }} />
              <span style={{ display: "block", width: 22, height: 2, background: C.whiteText, margin: "4px 0" }} />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div style={{
            background: C.darkOlive,
            padding:    "1rem 2rem",
            display:    "flex",
            flexDirection: "column",
            gap: "1rem",
          }}>
            {navLinks.map(link => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                style={{
                  background:    "none",
                  border:        "none",
                  cursor:        "pointer",
                  fontFamily:    SANS,
                  fontSize:      "0.75rem",
                  fontWeight:    600,
                  letterSpacing: "0.2em",
                  color:         C.whiteText,
                  textAlign:     "left",
                  padding:       "0.5rem 0",
                }}
              >
                {link.label}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* Scoped styles for responsive behaviour */}
      <style>{`
        @media (max-width: 768px) {
          .flo-desktop-nav { display: none !important; }
          .flo-rsvp-pill   { display: none !important; }
          .flo-hamburger   { display: block !important; }
          .flo-hero-names  { font-size: clamp(2.5rem, 10vw, 5rem) !important; }
          .flo-story-grid  { grid-template-columns: 1fr !important; }
          .flo-details-grid{ grid-template-columns: 1fr 1fr !important; }
          .flo-venue-grid  { grid-template-columns: 1fr !important; }
          .flo-journey-grid{ grid-template-columns: 1fr !important; }
          .flo-timeline    { overflow-x: auto; }
        }
        @media (max-width: 480px) {
          .flo-details-grid{ grid-template-columns: 1fr !important; }
        }
        .flo-input:focus {
          outline: none;
          border-color: #C9A86A !important;
        }
        .flo-btn-dark:hover {
          background: #363D2B !important;
        }
        .flo-card-detail:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.4) !important;
        }
        @keyframes flo-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes flo-fade-up {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes flo-slide-in {
          from { opacity: 0; transform: translateX(-48px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes flo-zoom-in {
          from { opacity: 0; transform: scale(0.93); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes flo-dot-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(201,168,106,0.55); }
          60%  { box-shadow: 0 0 0 10px rgba(201,168,106,0); }
          100% { box-shadow: 0 0 0 0 rgba(201,168,106,0); }
        }
        @keyframes flo-arrow-bob {
          0%   { transform: translateY(0);    opacity: 0.7; }
          50%  { transform: translateY(8px);  opacity: 1;   }
          100% { transform: translateY(0);    opacity: 0.7; }
        }
        @keyframes flo-arrow-bob2 {
          0%   { transform: translateY(0);    opacity: 0.35; }
          50%  { transform: translateY(8px);  opacity: 0.65; }
          100% { transform: translateY(0);    opacity: 0.35; }
        }
        @keyframes flo-scroll-text {
          0%, 100% { opacity: 0.38; }
          50%      { opacity: 0.82; }
        }
      `}</style>

      {/* ── 2. HERO ─────────────────────────────────────────────────────── */}
      <section
        id="flo-hero"
        data-v2-section="flo-hero"
        ref={heroAnim.ref as React.Ref<HTMLElement>}
        style={{
          position:   "relative",
          minHeight:  "92vh",
          display:    "flex",
          alignItems: "center",
          background: heroImage
            ? `url(${heroImage}) center/cover no-repeat`
            : `linear-gradient(135deg, ${C.darkOlive} 0%, ${C.midOlive} 60%, #1E211A 100%)`,
          overflow:   "hidden",
          ...heroAnim.style,
          ...(getSectionOrder ? { order: getSectionOrder("flo-hero") } : {}),
        }}
      >
        {/* Dark overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to right, rgba(18,22,14,0.78) 0%, rgba(18,22,14,0.35) 60%, rgba(18,22,14,0.15) 100%)",
        }} />

        {/* Hero content — left aligned */}
        <div style={{
          position:  "relative",
          zIndex:    2,
          maxWidth:  "1200px",
          margin:    "0 auto",
          padding:   "0 2.5rem",
          paddingTop: "80px",
          width:     "100%",
        }}>
          <div style={{ maxWidth: "540px" }}>
            {/* Intro line */}
            {heroIntro && (
            <p style={{
              fontFamily:    SANS,
              fontSize:      "0.65rem",
              letterSpacing: "0.35em",
              color:         C.goldLight,
              fontWeight:    600,
              marginBottom:  "1.2rem",
              textTransform: "uppercase",
            }}
            data-v2-element="hero-intro"
            data-v2-type="text"
            >
              {heroIntro}
            </p>
            )}

            {/* Thin gold rule */}
            <div style={{ width: 48, height: 1, background: C.gold, marginBottom: "1.4rem" }} />

            {/* Couple names � one selectable block */}
            <div
              data-v2-element="hero-title"
              style={{ marginBottom: "1.4rem" }}
            >
              {groomName && (
              <h1
                className="flo-hero-names"
                style={{
                  fontFamily:  SERIF,
                  fontSize:    "clamp(3.2rem, 6vw, 6.5rem)",
                  fontWeight:  400,
                  lineHeight:  1.0,
                  color:       C.whiteText,
                  marginBottom: "0.6rem",
                  letterSpacing: "-0.01em",
                }}
              >
                {groomName.toUpperCase()}
              </h1>
              )}
              {brideName && (
              <h1
                className="flo-hero-names"
                style={{
                  fontFamily:  SERIF,
                  fontSize:    "clamp(3.2rem, 6vw, 6.5rem)",
                  fontWeight:  400,
                  lineHeight:  1.0,
                  color:       C.whiteText,
                  marginBottom: 0,
                  letterSpacing: "-0.01em",
                }}
              >
                <span style={{ fontStyle: "italic", color: C.goldLight }}>{nameSeparator}</span> {brideName.toUpperCase()}
              </h1>
              )}
            </div>

            {/* Sub invite line */}
            {heroSub && (
            <p style={{
              fontFamily:    SANS,
              fontSize:      "0.65rem",
              letterSpacing: "0.3em",
              color:         `${C.whiteText}BB`,
              fontWeight:    400,
              textTransform: "uppercase",
              marginBottom:  "1.6rem",
            }}>
              {heroSub}
            </p>
            )}

            {/* Date */}
            <p
              data-v2-element="hero-date"
              data-v2-type="text"
              style={{
                fontFamily:    SERIF,
                fontSize:      "1.25rem",
                color:         C.whiteText,
                letterSpacing: "0.12em",
                fontWeight:    400,
                marginBottom:  "0.5rem",
              }}
            >
              {displayDate}
            </p>

            {/* Location */}
            {heroLocation && (
            <p
              data-v2-element="hero-location"
              data-v2-type="text"
              style={{
                fontFamily:    SANS,
                fontSize:      "0.65rem",
                letterSpacing: "0.3em",
                color:         `${C.whiteText}99`,
                textTransform: "uppercase",
                fontWeight:    400,
              }}
            >
              {heroLocation}
            </p>
            )}
          </div>
        </div>

        {/* Right-side dot navigation */}
        <div style={{
          position: "absolute",
          right:    "2rem",
          top:      "50%",
          transform:"translateY(-50%)",
          display:  "flex",
          flexDirection: "column",
          gap:      "10px",
          zIndex:   3,
        }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{
              width:        8,
              height:       8,
              borderRadius: "50%",
              background:   i === 0 ? C.whiteText : `${C.whiteText}44`,
              cursor:       "pointer",
            }} />
          ))}
        </div>

        {/* Scroll to explore */}
        <div style={{
          position:  "absolute",
          bottom:    "2.5rem",
          left:      "50%",
          transform: "translateX(-50%)",
          display:   "flex",
          flexDirection: "column",
          alignItems: "center",
          gap:        "0.65rem",
          zIndex:     3,
          cursor:     "pointer",
        }} onClick={() => scrollTo("flo-story")}>
          <p style={{
            fontFamily:    SANS,
            fontSize:      "0.55rem",
            letterSpacing: "0.35em",
            color:         `${C.whiteText}70`,
            textTransform: "uppercase",
            animation:     "flo-scroll-text 2.8s ease-in-out infinite",
          }}>
            SCROLL TO EXPLORE
          </p>
          {/* Stacked double-chevron that bobs downward */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
            <svg
              width="22"
              height="12"
              viewBox="0 0 22 12"
              fill="none"
              style={{ animation: "flo-arrow-bob 2.2s ease-in-out infinite" }}
            >
              <polyline
                points="1,1 11,10 21,1"
                stroke={C.goldLight}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <svg
              width="22"
              height="12"
              viewBox="0 0 22 12"
              fill="none"
              style={{ animation: "flo-arrow-bob2 2.2s ease-in-out infinite" }}
            >
              <polyline
                points="1,1 11,10 21,1"
                stroke={C.goldLight}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </section>

      {/* ── 3. OUR STORY ───────────────────────────────────────────────── */}
      <section
        id="flo-story"
        data-v2-section="flo-story"
        ref={storyAnim.ref as React.Ref<HTMLElement>}
        style={{ background: C.ivoryWarm, padding: "7rem 2.5rem", ...storyAnim.style, ...(getSectionOrder ? { order: getSectionOrder("flo-story") } : {}) }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div
            className="flo-story-grid"
            style={{
              display:             "grid",
              gridTemplateColumns: "1fr 1fr",
              gap:                 "4rem",
              alignItems:          "center",
            }}
          >
            {/* Left: story text */}
            <div>
              <p style={{
                fontFamily:    SANS,
                fontSize:      "0.65rem",
                letterSpacing: "0.35em",
                color:         C.gold,
                fontWeight:    600,
                textTransform: "uppercase",
                marginBottom:  "1.2rem",
              }}>
                OUR STORY
              </p>

              {storyTitle && (
              <h2
                data-v2-element="story-title"
                data-v2-type="text"
                style={{
                  fontFamily:  SERIF,
                  fontSize:    "clamp(1.8rem, 3.5vw, 3rem)",
                  fontWeight:  400,
                  lineHeight:  1.15,
                  color:       C.darkOlive,
                  marginBottom: "1.8rem",
                }}
              >
                {/* Title plain text, then gold italic emphasis appended after */}
                {storyTitle}
                {storyTitleEmphasis && (
                  <>{" "}<em style={{ fontStyle: "italic", color: C.gold }}>{storyTitleEmphasis}</em></>
                )}
              </h2>
              )}

              {storyText && (
              <p
                data-v2-element="story-text"
                data-v2-type="text"
                style={{
                  fontFamily:  SANS,
                  fontSize:    "0.9rem",
                  lineHeight:  1.8,
                  color:       C.grayText,
                  marginBottom: "2.2rem",
                  maxWidth:    "380px",
                }}
              >
                {storyText}
              </p>
              )}

              {storyCtaLabel && (
              <button
                className="flo-btn-dark"
                onClick={() => scrollTo("flo-story")}
                style={{
                  background:    C.darkOlive,
                  color:         C.whiteText,
                  border:        "none",
                  padding:       "12px 28px",
                  fontSize:      "0.65rem",
                  fontFamily:    SANS,
                  fontWeight:    700,
                  letterSpacing: "0.25em",
                  cursor:        "pointer",
                  textTransform: "uppercase",
                  transition:    "background 0.2s",
                }}
              >
                {storyCtaLabel}
              </button>
              )}
            </div>

            {/* Right: overlapping image collage */}
            <div style={{
              position:  "relative",
              minHeight: "420px",
              display:   "flex",
              justifyContent: "center",
            }}>
              {/* Main portrait image */}
              {storyImages[0] ? (
                <div style={{
                  position:     "absolute",
                  top:          "0",
                  left:         "50%",
                  transform:    "translateX(-10%)",
                  width:        "58%",
                  paddingTop:   "78%",
                  background:   `url(${storyImages[0]}) center/cover no-repeat #d0cbc4`,
                  boxShadow:    "0 8px 40px rgba(0,0,0,0.15)",
                  borderRadius: "2px",
                }} />
              ) : (
                <div style={{
                  position:   "absolute",
                  top:        "0",
                  left:       "50%",
                  transform:  "translateX(-10%)",
                  width:      "58%",
                  paddingTop: "78%",
                  background: `linear-gradient(135deg, ${C.beige} 0%, ${C.midOlive}33 100%)`,
                  boxShadow:  "0 8px 40px rgba(0,0,0,0.15)",
                  borderRadius: "2px",
                }} />
              )}

              {/* Secondary image — offset left, overlapping */}
              {storyImages[1] ? (
                <div style={{
                  position:     "absolute",
                  bottom:       "0",
                  left:         "0",
                  width:        "46%",
                  paddingTop:   "55%",
                  background:   `url(${storyImages[1]}) center/cover no-repeat #c8c3bd`,
                  boxShadow:    "0 8px 40px rgba(0,0,0,0.18)",
                  borderRadius: "2px",
                  zIndex:       2,
                }} />
              ) : (
                <div style={{
                  position:   "absolute",
                  bottom:     "0",
                  left:       "0",
                  width:      "46%",
                  paddingTop: "55%",
                  background: `linear-gradient(135deg, ${C.midOlive}22 0%, ${C.beige} 100%)`,
                  boxShadow:  "0 8px 40px rgba(0,0,0,0.18)",
                  borderRadius: "2px",
                  zIndex:     2,
                }} />
              )}

              {/* Monogram card */}
              {!storyMonogramHidden && (
              <div style={{
                position:   "absolute",
                top:        "30%",
                left:       "12%",
                width:      "100px",
                height:     "100px",
                background: C.ivoryWarm,
                boxShadow:  "0 4px 24px rgba(0,0,0,0.12)",
                display:    "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "2px",
                zIndex:     3,
                border:     `1px solid ${C.beige}`,
                opacity:    storyMonogramOpacity,
              }}>
                <p style={{
                  fontFamily:  SERIF,
                  fontSize:    "1.6rem",
                  color:       C.darkOlive,
                  fontStyle:   "italic",
                  lineHeight:  1,
                  marginBottom: "4px",
                }}>
                  {storyMonogramTop}
                </p>
                <div style={{ width: 24, height: 1, background: C.gold }} />
                <p style={{
                  fontFamily: SERIF,
                  fontSize:   "1.6rem",
                  color:      C.darkOlive,
                  fontStyle:  "italic",
                  lineHeight: 1,
                  marginTop:  "4px",
                }}>
                  {storyMonogramBtm}
                </p>
              </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. COUNTDOWN BAND ──────────────────────────────────────────── */}
      <section
        id="flo-countdown"
        data-v2-section="flo-countdown"
        ref={cdownAnim.ref as React.Ref<HTMLElement>}
        style={{
          background: `linear-gradient(135deg, ${C.darkOlive} 0%, ${C.midOlive} 50%, #1A1E16 100%)`,
          padding:    "5rem 2.5rem",
          position:   "relative",
          overflow:   "hidden",
          ...cdownAnim.style,
          ...(getSectionOrder ? { order: getSectionOrder("flo-countdown") } : {}),
        }}
      >
        {/* Decorative gold curves */}
        <svg
          aria-hidden="true"
          style={{ position: "absolute", bottom: 0, left: 0, width: "100%", opacity: 0.25 }}
          viewBox="0 0 1200 120" preserveAspectRatio="none"
        >
          <path
            d="M0,40 C200,100 400,0 600,60 C800,120 1000,20 1200,60 L1200,120 L0,120 Z"
            fill={C.gold}
          />
        </svg>

        <div style={{ position: "relative", zIndex: 1, maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <p style={{
            fontFamily:    SANS,
            fontSize:      "0.65rem",
            letterSpacing: "0.35em",
            color:         C.goldLight,
            fontWeight:    600,
            textTransform: "uppercase",
            marginBottom:  "3rem",
          }}>
            {cfg.countdown.subtitle || "COUNTDOWN TO OUR BIG DAY"}
          </p>

          <div style={{
            display:             "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap:                 "1rem",
          }}>
            {[
              { value: countdown.days,    label: cfg.countdown.labels?.days    || "DAYS" },
              { value: countdown.hours,   label: cfg.countdown.labels?.hours   || "HOURS" },
              { value: countdown.minutes, label: cfg.countdown.labels?.minutes || "MINUTES" },
              { value: countdown.seconds, label: cfg.countdown.labels?.seconds || "SECONDS" },
            ].map(item => (
              <div key={item.label} style={{ textAlign: "center" }}>
                <p style={{
                  fontFamily:  SERIF,
                  fontSize:    "clamp(3rem, 6vw, 5rem)",
                  fontWeight:  400,
                  color:       C.whiteText,
                  lineHeight:  1,
                  marginBottom: "0.5rem",
                }}>
                  {String(item.value).padStart(2, "0")}
                </p>
                <p style={{
                  fontFamily:    SANS,
                  fontSize:      "0.6rem",
                  letterSpacing: "0.25em",
                  color:         C.goldLight,
                  fontWeight:    600,
                  textTransform: "uppercase",
                }}>
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. JOURNEY / TIMELINE ──────────────────────────────────────── */}
      <section
        id="flo-journey"
        data-v2-section="flo-journey"
        ref={journeyAnim.ref as React.Ref<HTMLElement>}
        style={{ background: C.ivoryWarm, padding: "7rem 2.5rem", position: "relative", overflow: "hidden", ...journeyAnim.style, ...(getSectionOrder ? { order: getSectionOrder("flo-journey") } : {}) }}
      >
        {/* Leaf decoration */}
        <svg aria-hidden="true" style={{ position: "absolute", bottom: -20, left: -30, width: 200, opacity: 0.08, transform: "rotate(15deg)" }} viewBox="0 0 100 180">
          <path d="M50,0 C20,40 0,80 10,140 C30,100 70,100 90,140 C100,80 80,40 50,0 Z" fill={C.darkOlive} />
          <line x1="50" y1="0" x2="50" y2="160" stroke={C.darkOlive} strokeWidth="1.5" />
        </svg>

        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

          {journeyLayout === "vertical" ? (
            /* ── VERTICAL LAYOUT ─────────────────────────────────────────── */
            <>
              {/* Heading — full width */}
              <div style={{ marginBottom: "3.5rem" }}>
                <p style={{ fontFamily: SANS, fontSize: "0.65rem", letterSpacing: "0.35em", color: C.gold, fontWeight: 600, textTransform: "uppercase", marginBottom: "0.8rem" }}>
                  {cfg.timeline.title || "THE JOURNEY"}
                </p>
                {journeyHeading && <h2 style={{ fontFamily: SERIF, fontSize: "clamp(1.6rem, 2.5vw, 2.4rem)", fontWeight: 400, lineHeight: 1.2, color: C.darkOlive }}>
                  {journeyHeading}
                </h2>}
              </div>

              {/* Vertical milestone list */}
              <div style={{ position: "relative", paddingLeft: "2.5rem", maxWidth: "560px" }}>
                {/* Vertical connecting line */}
                <div style={{
                  position:   "absolute",
                  top:        "8px",
                  bottom:     "8px",
                  left:       "7px",
                  width:      "2px",
                  background: `linear-gradient(to bottom, ${C.gold}22, ${C.gold}99, ${C.gold}22)`,
                }} />

                {journeyMilestones.map((m, i) => {
                  const isLast  = i === journeyMilestones.length - 1;
                  const active  = activeDots.has(i);
                  return (
                    <div
                      key={m.id || i}
                      ref={(el: HTMLDivElement | null) => { milestoneRefs.current[i] = el; }}
                      style={{
                        position:      "relative",
                        paddingBottom: isLast ? 0 : "2.5rem",
                        transition:    "opacity 1s",
                        opacity:       active ? 1 : 0.45,
                      }}
                    >
                      {/* Dot */}
                      <div style={{
                        position:     "absolute",
                        left:         "-2.5rem",
                        top:          "4px",
                        width:        isLast ? 20 : 16,
                        height:       isLast ? 20 : 16,
                        borderRadius: "50%",
                        background:   active ? C.gold : C.ivoryWarm,
                        border:       `2px solid ${C.gold}`,
                        display:      "flex",
                        alignItems:   "center",
                        justifyContent: "center",
                        fontSize:     "0.6rem",
                        color:        C.darkOlive,
                        transition:   "background 0.4s, box-shadow 0.4s",
                        boxShadow:    active ? `0 0 0 6px ${C.gold}22` : "none",
                        animation:    active && !builderMode ? "flo-dot-pulse 1.4s ease-out" : "none",
                        marginLeft:   isLast ? "-2px" : "0",
                      }}>
                        {isLast && "♥"}
                      </div>

                      {/* Year */}
                      <p style={{ fontFamily: SERIF, fontSize: "1.2rem", fontWeight: 400, color: C.darkOlive, marginBottom: "0.15rem" }}>
                        {m.time}
                      </p>
                      {/* Label */}
                      <p style={{ fontFamily: SANS, fontSize: "0.75rem", letterSpacing: "0.08em", color: active ? C.darkOlive : C.grayText, fontWeight: 500, transition: "color 1s" }}>
                        {m.title}
                      </p>
                      {m.description && (
                        <p style={{ fontFamily: SANS, fontSize: "0.8rem", color: C.grayText, lineHeight: 1.6, marginTop: "0.35rem" }}>
                          {m.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* ── HORIZONTAL LAYOUT ───────────────────────────────────────── */
            <div className="flo-journey-grid" style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "3rem", alignItems: "start" }}>
              {/* Left heading */}
              <div>
                <p style={{ fontFamily: SANS, fontSize: "0.65rem", letterSpacing: "0.35em", color: C.gold, fontWeight: 600, textTransform: "uppercase", marginBottom: "1rem" }}>
                  {cfg.timeline.title || "THE JOURNEY"}
                </p>
                {journeyHeading && <h2 style={{ fontFamily: SERIF, fontSize: "clamp(1.6rem, 2.5vw, 2.4rem)", fontWeight: 400, lineHeight: 1.2, color: C.darkOlive }}>
                  {journeyHeading}
                </h2>}
              </div>

              {/* Horizontal timeline */}
              <div className="flo-timeline" style={{ paddingTop: "2.5rem" }}>
                <div style={{ position: "relative" }}>
                  {/* Horizontal line */}
                  <div style={{
                    position:   "absolute",
                    top:        "16px",
                    left:       "0",
                    right:      "0",
                    height:     "1px",
                    background: `linear-gradient(to right, ${C.gold}22, ${C.gold}AA, ${C.gold}22)`,
                  }} />

                  {/* Milestones grid */}
                  <div style={{ display: "grid", gridTemplateColumns: `repeat(${journeyMilestones.length}, 1fr)`, position: "relative", zIndex: 1 }}>
                    {journeyMilestones.map((m, i) => {
                      const isLast = i === journeyMilestones.length - 1;
                      const active = activeDots.has(i);
                      return (
                        <div
                          key={m.id || i}
                          ref={(el: HTMLDivElement | null) => { milestoneRefs.current[i] = el; }}
                          style={{ textAlign: "center", paddingTop: 0, transition: "opacity 0.4s", opacity: active ? 1 : 0.5 }}
                        >
                          {/* Dot */}
                          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
                            {isLast ? (
                              <div style={{
                                width:        32,
                                height:       32,
                                background:   active ? C.gold : `${C.gold}88`,
                                borderRadius: "50%",
                                display:      "flex",
                                alignItems:   "center",
                                justifyContent: "center",
                                fontSize:     "0.9rem",
                                color:        C.darkOlive,
                                transition:   "background 0.4s, box-shadow 0.4s",
                                boxShadow:    active ? `0 0 0 8px ${C.gold}22` : "none",
                                animation:    active && !builderMode ? "flo-dot-pulse 1.4s ease-out" : "none",
                              }}>♥</div>
                            ) : (
                              <div style={{
                                width:        16,
                                height:       16,
                                borderRadius: "50%",
                                background:   active ? C.gold : C.ivoryWarm,
                                border:       `2px solid ${active ? C.gold : `${C.gold}66`}`,
                                marginTop:    "8px",
                                transition:   "background 0.4s, border-color 0.4s, box-shadow 0.4s",
                                boxShadow:    active ? `0 0 0 6px ${C.gold}22` : "none",
                                animation:    active && !builderMode ? "flo-dot-pulse 1.4s ease-out" : "none",
                              }} />
                            )}
                          </div>
                          {/* Year */}
                          <p style={{ fontFamily: SERIF, fontSize: "1.3rem", fontWeight: 400, color: C.darkOlive, marginBottom: "0.3rem" }}>
                            {m.time}
                          </p>
                          {/* Label */}
                          <p style={{ fontFamily: SANS, fontSize: "0.7rem", letterSpacing: "0.1em", color: C.grayText, fontWeight: 500 }}>
                            {m.title}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Pagination dots */}
                <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "2.5rem" }}>
                  {[0,1].map(i => (
                    <div key={i} style={{ width: i === 0 ? 20 : 8, height: 8, borderRadius: "999px", background: i === 0 ? C.gold : `${C.grayText}44` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── 6. WEDDING DETAILS ──────────────────────────────────────────── */}
      <section
        id="flo-details"
        data-v2-section="flo-details"
        ref={detailsAnim.ref as React.Ref<HTMLElement>}
        style={{
          background: `linear-gradient(160deg, ${C.midOlive} 0%, ${C.darkOlive} 100%)`,
          padding:    "6rem 2.5rem",
          ...detailsAnim.style,
          ...(getSectionOrder ? { order: getSectionOrder("flo-details") } : {}),
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <p style={{
            fontFamily:    SANS,
            fontSize:      "0.65rem",
            letterSpacing: "0.35em",
            color:         C.goldLight,
            fontWeight:    600,
            textTransform: "uppercase",
            marginBottom:  "3rem",
          }}>
            {cfg.locations.sectionTitle || "WEDDING DETAILS"}
          </p>

          <div
            className="flo-details-grid"
            style={{
              display:             "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap:                 "1.5rem",
            }}
          >
            {DETAIL_CARDS.map((card, i) => {
              const venue = venues[i];
              return (
                <div
                  key={i}
                  className="flo-card-detail"
                  style={{
                    border:        `1px solid ${C.borderCard}`,
                    borderRadius:  "4px",
                    padding:       "2rem 1.5rem",
                    textAlign:     "center",
                    transition:    "transform 0.25s, box-shadow 0.25s",
                    cursor:        "default",
                    background:    `${C.lightOlive}55`,
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    fontSize:     "1.5rem",
                    color:        C.goldLight,
                    marginBottom: "1rem",
                  }}>
                    {(venue as any)?.mapIcon || card.icon}
                  </div>
                  {/* Title */}
                  <p style={{
                    fontFamily:    SANS,
                    fontSize:      "0.6rem",
                    letterSpacing: "0.3em",
                    color:         C.goldLight,
                    fontWeight:    600,
                    textTransform: "uppercase",
                    marginBottom:  "0.6rem",
                  }}>
                    {venue?.title || card.title}
                  </p>
                  {/* Time / Subtitle */}
                  <p style={{
                    fontFamily:  SERIF,
                    fontSize:    "1.35rem",
                    color:       C.whiteText,
                    marginBottom: "0.6rem",
                    fontWeight:  400,
                  }}>
                    {venue?.name || card.time}
                  </p>
                  {/* Place */}
                  <p style={{
                    fontFamily: SANS,
                    fontSize:   "0.75rem",
                    color:      `${C.whiteText}88`,
                    lineHeight: 1.6,
                    whiteSpace: "pre-line",
                  }}>
                    {venue?.description || card.place}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 7. VENUE ───────────────────────────────────────────────────── */}
      <section
        id="flo-venue"
        data-v2-section="flo-venue"
        ref={venueAnim.ref as React.Ref<HTMLElement>}
        style={{ background: C.ivory, padding: "7rem 2.5rem", position: "relative", overflow: "hidden", ...venueAnim.style, ...(getSectionOrder ? { order: getSectionOrder("flo-venue") } : {}) }}
      >
        {/* Faint sketch decoration — far left */}
        <svg
          aria-hidden="true"
          style={{ position: "absolute", left: -60, top: "50%", transform: "translateY(-50%)", width: 200, opacity: 0.05 }}
          viewBox="0 0 200 300"
        >
          <rect x="40" y="60" width="120" height="200" fill="none" stroke={C.darkOlive} strokeWidth="2"/>
          <rect x="60" y="110" width="30" height="50" fill="none" stroke={C.darkOlive} strokeWidth="1.5"/>
          <rect x="110" y="110" width="30" height="50" fill="none" stroke={C.darkOlive} strokeWidth="1.5"/>
          <polygon points="10,60 100,10 190,60" fill="none" stroke={C.darkOlive} strokeWidth="2"/>
          <line x1="100" y1="10" x2="100" y2="60" stroke={C.darkOlive} strokeWidth="1.5"/>
        </svg>

        <div style={{ maxWidth: "1200px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div
            className="flo-venue-grid"
            style={{
              display:             "grid",
              gridTemplateColumns: "1fr 1fr",
              gap:                 "4rem",
              alignItems:          "center",
            }}
          >
            {/* Left: venue info */}
            <div>
              {venueSubtitle && (
              <p style={{
                fontFamily:    SANS,
                fontSize:      "0.65rem",
                letterSpacing: "0.35em",
                color:         C.gold,
                fontWeight:    600,
                textTransform: "uppercase",
                marginBottom:  "1rem",
              }}>
                {venueSubtitle}
              </p>
              )}
              {venueTitle && (
              <h2
                data-v2-element="venue-title"
                data-v2-type="text"
                style={{
                  fontFamily:  SERIF,
                  fontSize:    "clamp(1.8rem, 3.5vw, 3rem)",
                  fontWeight:  400,
                  color:       C.darkOlive,
                  marginBottom: "1.2rem",
                  lineHeight:  1.15,
                }}
              >
                {venueTitle}
              </h2>
              )}
              {venueDescription && (
              <p
                data-v2-element="venue-desc"
                data-v2-type="text"
                style={{
                  fontFamily:  SANS,
                  fontSize:    "0.9rem",
                  color:       C.grayText,
                  lineHeight:  1.8,
                  marginBottom: "2rem",
                  maxWidth:    "320px",
                }}
              >
                {venueDescription}
              </p>
              )}
              {venueCtaLabel && (
              <a
                href={venueMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flo-btn-dark"
                style={{
                  display:       "inline-block",
                  background:    C.darkOlive,
                  color:         C.whiteText,
                  border:        "none",
                  padding:       "12px 28px",
                  fontSize:      "0.65rem",
                  fontFamily:    SANS,
                  fontWeight:    700,
                  letterSpacing: "0.25em",
                  cursor:        "pointer",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  transition:    "background 0.2s",
                }}
              >
                {venueCtaLabel}
              </a>
              )}
            </div>

            {/* Right: address card */}
            <div style={{
              background:   C.whiteText,
              border:       `1px solid ${C.beige}`,
              borderRadius: "4px",
              padding:      "2.5rem",
              boxShadow:    "0 4px 32px rgba(0,0,0,0.06)",
            }}>
              {/* Map placeholder */}
              <div style={{
                background:   C.beige,
                height:       "160px",
                borderRadius: "2px",
                marginBottom: "1.5rem",
                display:      "flex",
                alignItems:   "center",
                justifyContent: "center",
                fontSize:     "2rem",
              }}>
                📍
              </div>

              {venueTitle && (
              <h3 style={{
                fontFamily:  SERIF,
                fontSize:    "1.1rem",
                color:       C.darkOlive,
                marginBottom: "0.6rem",
                fontWeight:  500,
              }}>
                {venueTitle}
              </h3>
              )}
              {venueAddress && (
              <p style={{
                fontFamily: SANS,
                fontSize:   "0.8rem",
                color:      C.grayText,
                lineHeight: 1.7,
                whiteSpace: "pre-line",
                marginBottom: "1.2rem",
              }}>
                {venueAddress}
              </p>
              )}
              <a
                href={venueMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily:    SANS,
                  fontSize:      "0.7rem",
                  fontWeight:    700,
                  letterSpacing: "0.1em",
                  color:         C.gold,
                  textDecoration: "none",
                  textTransform: "uppercase",
                }}
              >
                GET DIRECTIONS →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. GALLERY ──────────────────────────────────────────────────── */}
      <section
        id="flo-gallery"
        data-v2-section="flo-gallery"
        ref={galleryAnim.ref as React.Ref<HTMLElement>}
        style={{ background: C.ivory, padding: "6rem 0", ...galleryAnim.style, ...(getSectionOrder ? { order: getSectionOrder("flo-gallery") } : {}) }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 2.5rem" }}>
          <p style={{
            fontFamily:    SANS,
            fontSize:      "0.65rem",
            letterSpacing: "0.35em",
            color:         C.grayText,
            fontWeight:    600,
            textTransform: "uppercase",
            textAlign:     "center",
            marginBottom:  "3rem",
          }}>
            A FEW OF OUR FAVORITE MOMENTS
          </p>
        </div>

        {/* Full-width strip */}
        <div style={{ position: "relative", overflow: "hidden", padding: "0 3rem" }}>
          {/* Prev arrow */}
          <button
            onClick={prevGallery}
            disabled={galleryOffset === 0}
            style={{
              position:   "absolute",
              left:       "0.5rem",
              top:        "50%",
              transform:  "translateY(-50%)",
              zIndex:     4,
              width:      44,
              height:     44,
              borderRadius: "50%",
              background: galleryOffset === 0 ? `${C.midOlive}44` : C.midOlive,
              border:     "none",
              color:      C.whiteText,
              fontSize:   "1.1rem",
              cursor:     galleryOffset === 0 ? "default" : "pointer",
              display:    "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s",
            }}
          >
            ‹
          </button>

          <div style={{
            display:  "flex",
            gap:      "8px",
            transform:`translateX(calc(-${galleryOffset} * (25% + 8px)))`,
            transition:"transform 0.4s cubic-bezier(0.4,0,0.2,1)",
          }}>
            {galleryItems.map((src, i) => (
              <div
                key={i}
                style={{
                  flex:        "0 0 calc(25% - 6px)",
                  paddingTop:  "25%",
                  position:    "relative",
                  overflow:    "hidden",
                  background:  `url(${src}) center/cover no-repeat ${C.beige}`,
                  borderRadius: "2px",
                }}
              />
            ))}
          </div>

          {/* Next arrow */}
          <button
            onClick={nextGallery}
            disabled={galleryOffset >= maxOffset}
            style={{
              position:   "absolute",
              right:      "0.5rem",
              top:        "50%",
              transform:  "translateY(-50%)",
              zIndex:     4,
              width:      44,
              height:     44,
              borderRadius: "50%",
              background: galleryOffset >= maxOffset ? `${C.midOlive}44` : C.midOlive,
              border:     "none",
              color:      C.whiteText,
              fontSize:   "1.1rem",
              cursor:     galleryOffset >= maxOffset ? "default" : "pointer",
              display:    "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s",
            }}
          >
            ›
          </button>
        </div>
      </section>

      {/* ── 9. RSVP ─────────────────────────────────────────────────────── */}
      <section
        id="flo-rsvp"
        data-v2-section="flo-rsvp"
        ref={rsvpAnim.ref as React.Ref<HTMLElement>}
        style={{
          background: `linear-gradient(160deg, ${C.midOlive} 0%, ${C.darkOlive} 100%)`,
          padding:    "7rem 2.5rem",
          position:   "relative",
          overflow:   "hidden",
          ...rsvpAnim.style,
          ...(getSectionOrder ? { order: getSectionOrder("flo-rsvp") } : {}),
        }}
      >
        {/* Leaf decoration — left */}
        <svg
          aria-hidden="true"
          style={{ position: "absolute", left: -40, bottom: -40, width: 220, opacity: 0.08, transform: "rotate(-20deg)" }}
          viewBox="0 0 100 180"
        >
          <path d="M50,0 C20,40 0,80 10,140 C30,100 70,100 90,140 C100,80 80,40 50,0 Z" fill={C.gold} />
          <line x1="50" y1="0" x2="50" y2="160" stroke={C.gold} strokeWidth="1.5"/>
        </svg>

        <div style={{ maxWidth: "1100px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          {rsvpSuccess ? (
            <div style={{ textAlign: "center", padding: "4rem 0" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "1rem", color: C.goldLight }}>♥</div>
              <h2 style={{
                fontFamily: SERIF,
                fontSize:   "2rem",
                color:      C.whiteText,
                fontWeight: 400,
                marginBottom: "1rem",
              }}>
                Thank you!
              </h2>
              <p style={{ fontFamily: SANS, color: `${C.whiteText}AA`, fontSize: "0.9rem" }}>
                {cfg.rsvp.messages?.success}
              </p>
            </div>
          ) : (
            <div
              style={{
                display:             "grid",
                gridTemplateColumns: "280px 1fr",
                gap:                 "4rem",
                alignItems:          "start",
              }}
              className="flo-rsvp-inner"
            >
              {/* Left: RSVP intro */}
              <div>
                <p style={{
                  fontFamily:    SANS,
                  fontSize:      "0.65rem",
                  letterSpacing: "0.35em",
                  color:         C.goldLight,
                  fontWeight:    600,
                  textTransform: "uppercase",
                  marginBottom:  "0.5rem",
                }}>
                  KINDLY
                </p>
                <h2 style={{
                  fontFamily:  SERIF,
                  fontSize:    "clamp(3rem, 5vw, 5rem)",
                  fontWeight:  400,
                  color:       C.whiteText,
                  marginBottom: "1.5rem",
                  lineHeight:  0.95,
                }}>
                  {cfg.rsvp.title || "RSVP"}
                </h2>
                <p style={{
                  fontFamily: SANS,
                  fontSize:   "0.85rem",
                  color:      `${C.whiteText}99`,
                  lineHeight: 1.7,
                  whiteSpace: "pre-line",
                }}>
                  {cfg.rsvp.description || "Please RSVP by October 1st, 2025.\nWe can't wait to celebrate with you!"}
                </p>
              </div>

              {/* Right: form */}
              <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                {/* Name row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={labelStyle}>{cfg.rsvp.form.firstName}</label>
                    <input
                      className="flo-input"
                      placeholder={cfg.rsvp.form.firstNamePlaceholder}
                      {...form.register("firstName")}
                      style={inputStyle}
                    />
                    {form.formState.errors.firstName && (
                      <p style={errStyle}>{form.formState.errors.firstName.message}</p>
                    )}
                  </div>
                  <div>
                    <label style={labelStyle}>{cfg.rsvp.form.lastName}</label>
                    <input
                      className="flo-input"
                      placeholder={cfg.rsvp.form.lastNamePlaceholder}
                      {...form.register("lastName")}
                      style={inputStyle}
                    />
                    {form.formState.errors.lastName && (
                      <p style={errStyle}>{form.formState.errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label style={labelStyle}>{cfg.rsvp.form.email}</label>
                  <input
                    className="flo-input"
                    type="email"
                    placeholder={cfg.rsvp.form.emailPlaceholder}
                    {...form.register("email")}
                    style={inputStyle}
                  />
                  {form.formState.errors.email && (
                    <p style={errStyle}>{form.formState.errors.email.message}</p>
                  )}
                </div>

                {/* Attendance */}
                <div>
                  <label style={labelStyle}>{cfg.rsvp.form.attendance}</label>
                  <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.5rem" }}>
                    {[
                      { value: "attending",     label: cfg.rsvp.form.attendingYes },
                      { value: "not-attending", label: cfg.rsvp.form.attendingNo },
                    ].map(opt => (
                      <label
                        key={opt.value}
                        style={{
                          display:    "flex",
                          alignItems: "center",
                          gap:        "0.5rem",
                          cursor:     "pointer",
                          fontFamily: SANS,
                          fontSize:   "0.8rem",
                          color:      `${C.whiteText}CC`,
                        }}
                      >
                        <input
                          type="radio"
                          value={opt.value}
                          {...form.register("attendance")}
                          style={{ accentColor: C.gold }}
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                  {form.formState.errors.attendance && (
                    <p style={errStyle}>{form.formState.errors.attendance.message}</p>
                  )}
                </div>

                {/* Dietary / special requests */}
                <div>
                  <label style={labelStyle}>{cfg.rsvp.form.guestNames}</label>
                  <input
                    className="flo-input"
                    placeholder={cfg.rsvp.form.guestNamesPlaceholder}
                    {...form.register("guestNames")}
                    style={inputStyle}
                  />
                </div>

                {/* Hidden guestCount default */}
                <input type="hidden" {...form.register("guestCount")} value="1" />

                {/* Error from mutation */}
                {rsvpMutation.isError && (
                  <p style={{ ...errStyle, fontSize: "0.8rem" }}>
                    {cfg.rsvp.messages?.error || "Something went wrong. Please try again."}
                  </p>
                )}

                {/* Submit */}
                <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
                  <button
                    type="submit"
                    disabled={rsvpMutation.isPending}
                    style={{
                      background:    rsvpMutation.isPending ? `${C.gold}88` : C.gold,
                      color:         C.darkOlive,
                      border:        "none",
                      padding:       "14px 48px",
                      fontSize:      "0.7rem",
                      fontFamily:    SANS,
                      fontWeight:    700,
                      letterSpacing: "0.25em",
                      cursor:        rsvpMutation.isPending ? "not-allowed" : "pointer",
                      textTransform: "uppercase",
                      borderRadius:  "2px",
                      transition:    "background 0.2s",
                      minWidth:      "200px",
                    }}
                  >
                    {rsvpMutation.isPending
                      ? (cfg.rsvp.form.submittingButton || "Sending...")
                      : (cfg.rsvp.form.submitButton    || "SEND RSVP")}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Responsive tweak for RSVP inner grid */}
        <style>{`
          @media (max-width: 768px) {
            .flo-rsvp-inner { grid-template-columns: 1fr !important; gap: 2rem !important; }
          }
        `}</style>
      </section>

      {/* ── 10. FOOTER ──────────────────────────────────────────────────── */}
      <footer
        id="flo-footer"
        data-v2-section="flo-footer"
        style={{
          background: C.darkOlive,
          padding:    "3rem 2.5rem",
          position:   "relative",
          ...(getSectionOrder ? { order: getSectionOrder("flo-footer") } : {}),
        }}
      >
        <div style={{
          maxWidth:      "1200px",
          margin:        "0 auto",
          display:       "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems:    "center",
          gap:           "2rem",
        }}>
          {/* Left: monogram */}
          <div>
            <p style={{
              fontFamily:  SERIF,
              fontSize:    "1.6rem",
              color:       C.goldLight,
              fontStyle:   "italic",
              letterSpacing: "0.1em",
            }}>
              {groomName[0]} <span style={{ color: `${C.whiteText}44`, fontStyle: "normal" }}>/</span> {brideName[0]}
            </p>
          </div>

          {/* Center: names + date */}
          <div style={{ textAlign: "center" }}>
            <p style={{
              fontFamily:    SANS,
              fontSize:      "0.7rem",
              letterSpacing: "0.2em",
              color:         `${C.whiteText}BB`,
              textTransform: "uppercase",
              marginBottom:  "0.3rem",
            }}>
              {groomName.toUpperCase()} &amp; {brideName.toUpperCase()}
            </p>
            <p style={{
              fontFamily:    SERIF,
              fontSize:      "0.9rem",
              color:         C.goldLight,
              letterSpacing: "0.1em",
            }}>
              {displayDate}
            </p>
          </div>

          {/* Right: tagline + socials + back to top */}
          <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.8rem" }}>
            <p
              data-v2-element="footer-tagline"
              data-v2-type="text"
              style={{
              fontFamily:    SANS,
              fontSize:      "0.6rem",
              letterSpacing: "0.2em",
              color:         `${C.whiteText}66`,
              textTransform: "uppercase",
            }}>
              {cfg.footer.thankYouMessage || "FOREVER STARTS HERE"}
            </p>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              {socialInstagram !== "#" && (
                <a href={socialInstagram} target="_blank" rel="noopener noreferrer" style={{ color: `${C.whiteText}99`, textDecoration: "none", fontSize: "1rem" }}>IG</a>
              )}
              {socialFacebook !== "#" && (
                <a href={socialFacebook} target="_blank" rel="noopener noreferrer" style={{ color: `${C.whiteText}99`, textDecoration: "none", fontSize: "1rem" }}>FB</a>
              )}
              {socialEmail !== "#" && (
                <a href={`mailto:${socialEmail}`} style={{ color: `${C.whiteText}99`, textDecoration: "none", fontSize: "1rem" }}>✉</a>
              )}
              {/* Back to top */}
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                style={{
                  width:        36,
                  height:       36,
                  borderRadius: "50%",
                  background:   C.gold,
                  border:       "none",
                  color:        C.darkOlive,
                  cursor:       "pointer",
                  fontSize:     "0.9rem",
                  display:      "flex",
                  alignItems:   "center",
                  justifyContent: "center",
                }}
                aria-label="Back to top"
              >
                ↑
              </button>
            </div>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div style={{
          borderTop:   `1px solid ${C.borderCard}`,
          marginTop:   "2rem",
          paddingTop:  "1.5rem",
          textAlign:   "center",
        }}>
          <p style={{
            fontFamily: SANS,
            fontSize:   "0.65rem",
            color:      `${C.whiteText}44`,
            letterSpacing: "0.1em",
          }}>
            {groomName} &amp; {brideName} — {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}

// ─── Shared micro-styles ──────────────────────────────────────────────────────
const labelStyle: React.CSSProperties = {
  display:       "block",
  fontFamily:    SANS_DEFAULT,
  fontSize:      "0.6rem",
  letterSpacing: "0.25em",
  color:         `${C_DEFAULT.goldLight}`,
  fontWeight:    600,
  textTransform: "uppercase",
  marginBottom:  "0.4rem",
};

const inputStyle: React.CSSProperties = {
  width:           "100%",
  background:      "transparent",
  border:          `1px solid ${C_DEFAULT.borderCard}`,
  borderRadius:    "2px",
  padding:         "10px 14px",
  fontFamily:      SANS_DEFAULT,
  fontSize:        "0.85rem",
  color:           C_DEFAULT.whiteText,
  outline:         "none",
  transition:      "border-color 0.2s",
  boxSizing:       "border-box",
};

const errStyle: React.CSSProperties = {
  fontFamily:  SANS_DEFAULT,
  fontSize:    "0.7rem",
  color:       "#f87171",
  marginTop:   "0.25rem",
};

// ─── Static detail card definitions (icon + fallback label) ──────────────────
const DETAIL_CARDS = [
  { icon: "💍", title: "CEREMONY",      time: "4:30 PM", place: "Basilica di San Miniato\nal Monte, Florence" },
  { icon: "🥂", title: "COCKTAIL HOUR", time: "5:30 PM", place: "Giardino della Villa\nCocktail & Canapés" },
  { icon: "🎂", title: "RECEPTION",     time: "7:00 PM", place: "Villa di Maiano\nDinner & Dancing" },
  { icon: "👗", title: "DRESS CODE",    time: "Black Tie", place: "We can't wait to celebrate\nwith you!" },
];

// ─── Placeholder gallery images (shown when no gallery images are configured) ─
const PLACEHOLDER_GALLERY: string[] = Array(8).fill("").map((_, i) => "");
// (Empty strings render as solid beige boxes — intentionally neutral placeholders)


