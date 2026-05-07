/**
 * Aurelia — Cinematic V2 wedding template
 *
 * Visual identity: warm luxury editorial, cream / champagne / deep charcoal
 * Key differentiator: animated roadmap with traveling diamond marker
 *
 * All styles are scoped via inline styles + .aur-* class names in the
 * <style> block. Zero global style pollution.
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { insertRsvpSchema, type InsertRsvp } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import type { WeddingConfig } from "../types";
import { defaultConfig, type AureliaExtendedConfig } from "./config";

// ─── Color palette constants ──────────────────────────────────────────────────
const C_DEFAULT = {
  champagne:      "#C4A97D",
  champagneLight: "#D4BF9A",
  champagneDim:   "#A8906A",
  charcoal:       "#1C1917",
  charcoalMid:    "#292524",
  charcoalLight:  "#3C3730",
  cream:          "#FAF8F4",
  creamWarm:      "#F5F0E8",
  cardBg:         "#EDE8DF",
  border:         "#D4C5A9",
  stoneText:      "#44403C",
  warmGray:       "#78716C",
  warmWhite:      "#FAFAF9",
  softWhite:      "#F0EDE8",
} as const;

// ─── Font shortcuts ───────────────────────────────────────────────────────────
const SERIF_DEFAULT = "'Cormorant Garamond', Georgia, serif";
const SANS_DEFAULT  = "Raleway, 'Inter', sans-serif";

// ─── Scroll reveal hook (per section) ────────────────────────────────────────
function useSectionAnim(animType: string, builderMode: boolean) {
  const ref  = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (builderMode || !animType || animType === "none") {
      setActive(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setActive(true); obs.disconnect(); } },
      { threshold: 0.06, rootMargin: "0px 0px -48px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [animType, builderMode]);

  const hasAnim = !builderMode && !!animType && animType !== "none";
  const style: React.CSSProperties = !hasAnim
    ? {}
    : active
    ? { animation: `aur-${animType} 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) both` }
    : {
        opacity: 0,
        ...(animType === "fade-up"   ? { transform: "translateY(36px)"  } : {}),
        ...(animType === "slide-in"  ? { transform: "translateX(-52px)" } : {}),
        ...(animType === "zoom-in"   ? { transform: "scale(0.94)"       } : {}),
      };

  return { ref, style };
}

// ─── Roadmap scroll progress hook ────────────────────────────────────────────
function useRoadmapProgress(builderMode: boolean) {
  const [progress, setProgress] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const rafRef     = useRef<number | null>(null);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (builderMode || prefersReduced) {
      setProgress(1);
      return;
    }

    const update = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const winH  = window.innerHeight;
      const start = winH * 0.8 - rect.top;
      const total = el.offsetHeight * 0.85;
      setProgress(Math.max(0, Math.min(1, start / total)));
    };

    const onScroll = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [builderMode]);

  return { sectionRef, progress };
}

// ─── Milestone sequential reveal hook ────────────────────────────────────────
function useMilestoneReveal(count: number, builderMode: boolean) {
  const [visible, setVisible] = useState<boolean[]>(() => Array(count).fill(false));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile =
      typeof window !== "undefined" && window.innerWidth < 768;

    if (builderMode || prefersReduced || isMobile) {
      setVisible(Array(count).fill(true));
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const items = Array.from(container.querySelectorAll("[data-aur-ms]"));
    const observers: IntersectionObserver[] = [];

    items.forEach((el, i) => {
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTimeout(
              () =>
                setVisible((prev) => {
                  const next = [...prev];
                  next[i] = true;
                  return next;
                }),
              i * 120
            );
            obs.disconnect();
          }
        },
        { threshold: 0.18, rootMargin: "0px 0px -40px 0px" }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [count, builderMode]);

  return { containerRef, visible };
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface AureliaTemplateProps {
  config:       WeddingConfig;
  templateId?:  string;
  /** When true: sticky nav, data-v2-* attrs active, no scroll-based effects */
  builderMode?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AureliaTemplate({
  config,
  templateId,
  builderMode = false,
}: AureliaTemplateProps) {

  // ── Config merge ────────────────────────────────────────────────────────────
  const cfg: WeddingConfig = {
    ...defaultConfig,
    ...config,
    couple:    { ...defaultConfig.couple,    ...(config.couple    || {}) },
    wedding:   { ...defaultConfig.wedding,   ...(config.wedding   || {}) },
    hero:      { ...defaultConfig.hero,      ...(config.hero      || {}) },
    timeline:  { ...defaultConfig.timeline,  ...(config.timeline  || {}) },
    locations: { ...defaultConfig.locations, ...(config.locations || {}) },
    rsvp:      {
      ...defaultConfig.rsvp,
      ...(config.rsvp || {}),
      form: { ...defaultConfig.rsvp.form, ...(config.rsvp?.form || {}) },
    },
    photos:    { ...defaultConfig.photos, ...(config.photos || {}) },
    footer:    { ...defaultConfig.footer,    ...(config.footer    || {}) },
  };

  const ext = cfg as unknown as AureliaExtendedConfig & WeddingConfig & {
    rsvpBgImage?: string;
    nameSeparator?: string;
  };

  // ── Dynamic theme ────────────────────────────────────────────────────────────
  const colors = (cfg.theme?.colors ?? {}) as Record<string, string | undefined>;
  const C = {
    ...C_DEFAULT,
    champagne:      colors.primary        ?? C_DEFAULT.champagne,
    champagneLight: colors.primary        ?? C_DEFAULT.champagneLight,
    champagneDim:   colors.primary        ?? C_DEFAULT.champagneDim,
    charcoal:       colors.secondary      ?? C_DEFAULT.charcoal,
    charcoalMid:    colors.secondary      ?? C_DEFAULT.charcoalMid,
    charcoalLight:  colors.secondary      ?? C_DEFAULT.charcoalLight,
    cream:          colors.background     ?? C_DEFAULT.cream,
    creamWarm:      colors.background     ?? C_DEFAULT.creamWarm,
    cardBg:         colors.cardBackground ?? C_DEFAULT.cardBg,
    border:         colors.cardBorder     ?? C_DEFAULT.border,
    stoneText:      colors.textColor      ?? C_DEFAULT.stoneText,
    warmGray:       colors.mutedText      ?? colors.textColor ?? C_DEFAULT.warmGray,
    warmWhite:      colors.lightText      ?? C_DEFAULT.warmWhite,
  } as typeof C_DEFAULT;

  const SERIF = cfg.theme?.fonts?.heading || SERIF_DEFAULT;
  const SANS  = cfg.theme?.fonts?.body    || SANS_DEFAULT;

  // ── Derived content ──────────────────────────────────────────────────────────
  const groomName     = cfg.couple.groomName  ?? "Matteo";
  const brideName     = cfg.couple.brideName  ?? "Sophia";
  const separator     = ext.nameSeparator ?? cfg.footer.separator ?? "&";
  const displayDate   = cfg.wedding.displayDate || "20 • 09 • 2026";
  const heroTagline   = ext.heroTagline   ?? "";
  const heroLocation  = ext.heroLocation  ?? "Amalfi Coast, Italy";
  const heroImage     = (cfg.hero.images && cfg.hero.images[0]) || "";

  const storyHeading          = ext.storyHeading          ?? "How It All Began";
  const storyHeadingEmphasis  = ext.storyHeadingEmphasis  ?? "Began";
  const storyBody             = ext.storyBody             ?? "We crossed paths on a warm summer evening in Rome — a chance encounter that neither of us expected. What started as a brief conversation turned into hours, then days, then years of shared adventure and quiet joy.";
  const storyCtaLabel         = ext.storyCtaLabel         ?? "OUR FULL STORY";
  const storyImage            = ext.storyImage            ?? "";

  const roadmapHeading = ext.roadmapHeading ?? "The Road That Led Us Here";
  const milestones     = cfg.timeline.events.length > 0
    ? cfg.timeline.events
    : defaultConfig.timeline.events;

  const detailsLabel = cfg.locations.sectionTitle || "WEDDING DETAILS";
  const venues       = cfg.locations.venues;

  const venueSubtitle    = ext.venueSubtitle    ?? "THE VENUE";
  const venueTitle       = ext.venueTitle       ?? "Villa Cimbrone";
  const venueDescription = ext.venueDescription ?? "A timeless Italian villa perched on the clifftops above the Amalfi Coast, surrounded by ancient gardens and breathtaking sea views.";
  const venueCtaLabel    = ext.venueCtaLabel    ?? "EXPLORE THE VENUE";
  const venueAddress     = ext.venueAddress     ?? "Via Santa Chiara, 26\nRavello, SA 84010, Italy";
  const venueMapUrl      = ext.venueMapUrl      || (venues[0]?.address ? `https://www.google.com/maps/search/${encodeURIComponent(venues[0].address)}` : "#");
  const venueImage       = ext.venueImage       ?? "";

  const galleryTitle    = ext.galleryTitle    ?? cfg.photos.title;
  const gallerySubtitle = ext.gallerySubtitle ?? cfg.photos.description;
  const galleryImages   = cfg.photos.galleryImages || [];

  const rsvpBgImage = (ext as any).rsvpBgImage ?? "";
  const footerTagline = ext.footerTagline ?? cfg.footer.thankYouMessage;

  const socialInstagram = ext.socialInstagram || "";
  const socialFacebook  = ext.socialFacebook  || "";
  const socialEmail     = ext.socialEmail     || "";

  // ── Section visibility ───────────────────────────────────────────────────────
  const showHero    = cfg.sections?.hero?.enabled     !== false;
  const showRoadmap = cfg.sections?.timeline?.enabled !== false;
  const showDetails = cfg.sections?.locations?.enabled !== false;
  const showGallery = cfg.sections?.photos?.enabled   !== false;
  const showRsvp    = cfg.sections?.rsvp?.enabled     !== false;
  const showStory   = (cfg as any).sections?.story?.enabled   !== false;
  const showVenue   = (cfg as any).sections?.venue?.enabled   !== false;

  // ── Countdown ────────────────────────────────────────────────────────────────
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const target = new Date(cfg.wedding.date || defaultConfig.wedding.date).getTime();
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) { setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return; }
      setCountdown({
        days:    Math.floor(diff / 86400000),
        hours:   Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000)  / 60000),
        seconds: Math.floor((diff % 60000)    / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [cfg.wedding.date]);

  // ── Navbar scroll state ──────────────────────────────────────────────────────
  const [scrolled,     setScrolled]     = useState(builderMode);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => {
    if (builderMode) return;
    const onScroll = () => setScrolled(window.scrollY > 72);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [builderMode]);

  // ── RSVP form ────────────────────────────────────────────────────────────────
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
      guests:     parseInt(data.guestCount as string, 10),
    });
  };

  // ── Section entrance animations ──────────────────────────────────────────────
  const storyAnim   = useSectionAnim("fade-up",  builderMode);
  const roadmapAnim = useSectionAnim("fade-up",  builderMode);
  const detailsAnim = useSectionAnim("fade-up",  builderMode);
  const venueAnim   = useSectionAnim("fade-up",  builderMode);
  const galleryAnim = useSectionAnim("fade-up",  builderMode);
  const rsvpAnim    = useSectionAnim("fade-in",  builderMode);
  const footerAnim  = useSectionAnim("fade-in",  builderMode);

  // ── Roadmap animation ────────────────────────────────────────────────────────
  const { sectionRef: roadmapRef, progress } = useRoadmapProgress(builderMode);
  const { containerRef: milestonesRef, visible: milestoneVisible } =
    useMilestoneReveal(milestones.length, builderMode);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const handleNavLink = useCallback((href: string) => {
    setMobileMenuOpen(false);
    if (!builderMode && typeof document !== "undefined") {
      const el = document.querySelector(href);
      el?.scrollIntoView({ behavior: "smooth" });
    }
  }, [builderMode]);

  const NAV_LINKS = [
    { label: "Our Story",  href: "#aur-story"   },
    { label: "The Journey",href: "#aur-roadmap" },
    { label: "Details",    href: "#aur-details" },
    { label: "Venue",      href: "#aur-venue"   },
    { label: "Gallery",    href: "#aur-gallery" },
    { label: "RSVP",       href: "#aur-rsvp"    },
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        fontFamily: SANS,
        color:      C.stoneText,
        background: C.cream,
        overflowX:  "hidden",
        scrollBehavior: builderMode ? undefined : "smooth",
      }}
    >
      {/* Google Fonts */}
      <AureliaFonts />

      {/* Scoped CSS keyframes + responsive styles */}
      <style>{`
        @keyframes aur-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes aur-fade-up {
          from { opacity: 0; transform: translateY(36px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes aur-slide-in {
          from { opacity: 0; transform: translateX(-52px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes aur-zoom-in {
          from { opacity: 0; transform: scale(0.94); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes aur-scroll-bob {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(8px); }
        }
        @keyframes aur-dot-pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.9); }
          50%       { opacity: 1;   transform: scale(1.1); }
        }
        @keyframes aur-shimmer {
          from { background-position: -200% center; }
          to   { background-position:  200% center; }
        }

        /* Scroll-to-section smooth behavior */
        html { scroll-behavior: smooth; }

        /* Nav link hover */
        .aur-nav-link {
          font-family: ${SANS};
          font-size: 0.68rem;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: inherit;
          text-decoration: none;
          opacity: 0.75;
          transition: opacity 0.2s;
        }
        .aur-nav-link:hover { opacity: 1; }

        /* Gallery image hover */
        .aur-gallery-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94);
          display: block;
        }
        .aur-gallery-tile:hover .aur-gallery-img { transform: scale(1.04); }

        /* Form input focus glow */
        .aur-input:focus {
          outline: none;
          border-color: ${C.champagne} !important;
          box-shadow: 0 0 0 2px ${C.champagne}22;
        }

        /* Milestone layout */
        .aur-roadmap-milestone-left {
          margin-right: calc(50% + 36px);
          text-align: right;
        }
        .aur-roadmap-milestone-right {
          margin-left: calc(50% + 36px);
        }

        /* Venue split */
        .aur-venue-split {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 600px;
        }

        /* Details grid */
        .aur-details-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          max-width: 720px;
          margin: 0 auto;
        }

        /* Gallery grid */
        .aur-gallery-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 4px;
        }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .aur-story-split {
            grid-template-columns: 1fr !important;
          }
          .aur-venue-split {
            grid-template-columns: 1fr !important;
          }
          .aur-gallery-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 640px) {
          .aur-details-grid {
            grid-template-columns: 1fr !important;
          }
          .aur-gallery-grid {
            grid-template-columns: 1fr !important;
          }
          .aur-roadmap-milestone-left,
          .aur-roadmap-milestone-right {
            margin-left: 48px !important;
            margin-right: 0 !important;
            text-align: left !important;
          }
          .aur-roadmap-center-line {
            left: 24px !important;
            transform: none !important;
          }
          .aur-hero-names { font-size: clamp(2.8rem, 9vw, 5rem) !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      {/* ══════════════════ NAVBAR ══════════════════ */}
      <nav
        style={{
          position:         builderMode ? "sticky" : "fixed",
          top:              0,
          left:             0,
          right:            0,
          zIndex:           1000,
          display:          "flex",
          alignItems:       "center",
          justifyContent:   "space-between",
          padding:          "0 40px",
          height:           "64px",
          background:       scrolled
            ? `${C.charcoal}F0`
            : "transparent",
          backdropFilter:   scrolled ? "blur(12px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottom:     scrolled ? `1px solid ${C.champagne}20` : "none",
          transition:       "background 0.35s ease, backdrop-filter 0.35s ease, border-bottom 0.35s ease",
        }}
        data-v2-section="aur-nav"
      >
        {/* Logo / Couple Names */}
        <div style={{ fontFamily: SERIF, fontSize: "1.1rem", fontWeight: 400, letterSpacing: "0.06em", color: C.warmWhite }}>
          {groomName} {separator} {brideName}
        </div>

        {/* Desktop nav links */}
        <div style={{ display: "flex", gap: "28px", alignItems: "center" }}>
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="aur-nav-link"
              style={{ color: scrolled ? C.warmWhite : C.warmWhite }}
              onClick={(e) => { e.preventDefault(); handleNavLink(link.href); }}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          style={{
            display:    "none",
            background: "transparent",
            border:     "none",
            cursor:     "pointer",
            padding:    "8px",
            color:      C.warmWhite,
          }}
          className="aur-hamburger"
          aria-label="Open menu"
        >
          <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
            <line x1="0" y1="1"  x2="22" y2="1"  stroke="currentColor" strokeWidth="1.5"/>
            <line x1="0" y1="8"  x2="22" y2="8"  stroke="currentColor" strokeWidth="1.5"/>
            <line x1="0" y1="15" x2="22" y2="15" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        </button>
      </nav>

      {/* Mobile full-screen menu */}
      {mobileMenuOpen && (
        <div
          style={{
            position:       "fixed",
            inset:          0,
            zIndex:         1999,
            background:     C.charcoal,
            display:        "flex",
            flexDirection:  "column",
            alignItems:     "center",
            justifyContent: "center",
            gap:            "36px",
          }}
        >
          <button
            onClick={() => setMobileMenuOpen(false)}
            style={{ position: "absolute", top: "20px", right: "24px", background: "transparent", border: "none", color: C.warmGray, cursor: "pointer", fontSize: "1.4rem" }}
            aria-label="Close menu"
          >
            ✕
          </button>
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => { e.preventDefault(); handleNavLink(link.href); }}
              style={{
                fontFamily:      SERIF,
                fontSize:        "2rem",
                fontWeight:      400,
                color:           C.warmWhite,
                textDecoration:  "none",
                letterSpacing:   "0.04em",
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
      )}

      {/* ══════════════════ HERO ══════════════════ */}
      {showHero && (
        <section
          id="aur-hero"
          data-v2-section="aur-hero"
          style={{
            position:      "relative",
            minHeight:     "100vh",
            display:       "flex",
            flexDirection: "column",
            alignItems:    "center",
            justifyContent:"center",
            overflow:      "hidden",
            background:    heroImage ? `url(${heroImage}) center/cover no-repeat` : `linear-gradient(160deg, ${C.charcoalMid} 0%, ${C.charcoal} 60%, #0F0E0C 100%)`,
          }}
        >
          {/* Dark overlay */}
          <div
            style={{
              position:   "absolute",
              inset:      0,
              background: heroImage
                ? `linear-gradient(to bottom, rgba(20,18,16,0.35) 0%, rgba(20,18,16,0.55) 50%, rgba(20,18,16,0.85) 100%)`
                : "none",
              zIndex:     1,
            }}
          />

          {/* Hero content */}
          <div
            style={{
              position:      "relative",
              zIndex:        2,
              textAlign:     "center",
              padding:       "80px 24px 120px",
              maxWidth:      "900px",
              width:         "100%",
            }}
          >
            {/* Tagline */}
            {heroTagline && (
              <p
                data-v2-element="aur-hero-tagline"
                data-v2-type="text"
                style={{
                  fontFamily:    SANS,
                  fontSize:      "0.7rem",
                  fontWeight:    400,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color:         C.champagne,
                  marginBottom:  "32px",
                  opacity:       0.9,
                }}
              >
                {heroTagline}
              </p>
            )}

            {/* Couple names */}
            <h1
              className="aur-hero-names"
              data-v2-element="aur-hero-names"
              data-v2-type="text"
              style={{
                fontFamily:    SERIF,
                fontSize:      "clamp(3.5rem, 8vw, 8rem)",
                fontWeight:    300,
                letterSpacing: "0.02em",
                color:         C.warmWhite,
                lineHeight:    1.05,
                margin:        0,
              }}
            >
              {groomName}
              <span style={{ fontStyle: "italic", color: C.champagne, margin: "0 0.2em" }}>
                {separator}
              </span>
              {brideName}
            </h1>

            {/* Thin divider */}
            <div
              style={{
                width:      "60px",
                height:     "1px",
                background: C.champagne,
                margin:     "28px auto",
                opacity:    0.7,
              }}
            />

            {/* Wedding date */}
            <p
              data-v2-element="aur-hero-date"
              data-v2-type="text"
              style={{
                fontFamily:    SERIF,
                fontSize:      "1.5rem",
                fontWeight:    300,
                fontStyle:     "italic",
                color:         C.champagneLight,
                letterSpacing: "0.06em",
                marginBottom:  "10px",
              }}
            >
              {displayDate}
            </p>

            {/* Location */}
            {heroLocation && (
              <p
                data-v2-element="aur-hero-location"
                data-v2-type="text"
                style={{
                  fontFamily:    SANS,
                  fontSize:      "0.68rem",
                  fontWeight:    400,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color:         C.softWhite,
                  opacity:       0.75,
                  marginBottom:  "48px",
                }}
              >
                {heroLocation}
              </p>
            )}

            {/* Countdown boxes */}
            {cfg.sections?.countdown?.enabled !== false && (
              <div
                style={{
                  display:        "flex",
                  gap:            "clamp(12px, 3vw, 32px)",
                  justifyContent: "center",
                  flexWrap:       "wrap",
                }}
              >
                {[
                  { value: countdown.days,    label: cfg.countdown.labels.days    },
                  { value: countdown.hours,   label: cfg.countdown.labels.hours   },
                  { value: countdown.minutes, label: cfg.countdown.labels.minutes },
                  { value: countdown.seconds, label: cfg.countdown.labels.seconds },
                ].map(({ value, label }) => (
                  <div
                    key={label}
                    style={{
                      textAlign:  "center",
                      minWidth:   "64px",
                      padding:    "14px 20px",
                      border:     `1px solid ${C.champagne}35`,
                      background: "rgba(28,25,23,0.5)",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                    }}
                  >
                    <div
                      style={{
                        fontFamily:  SERIF,
                        fontSize:    "clamp(1.8rem, 4vw, 2.8rem)",
                        fontWeight:  300,
                        color:       C.champagne,
                        lineHeight:  1,
                      }}
                    >
                      {String(value).padStart(2, "0")}
                    </div>
                    <div
                      style={{
                        fontFamily:    SANS,
                        fontSize:      "0.52rem",
                        letterSpacing: "0.16em",
                        color:         C.champagne,
                        marginTop:     "8px",
                        opacity:       0.7,
                      }}
                    >
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Scroll indicator */}
          <div
            style={{
              position:       "absolute",
              bottom:         "36px",
              left:           "50%",
              transform:      "translateX(-50%)",
              zIndex:         2,
              display:        "flex",
              flexDirection:  "column",
              alignItems:     "center",
              gap:            "8px",
              opacity:        0.6,
              cursor:         "default",
            }}
          >
            <span
              style={{
                fontFamily:    SANS,
                fontSize:      "0.55rem",
                letterSpacing: "0.24em",
                color:         C.warmWhite,
                textTransform: "uppercase",
              }}
            >
              Scroll
            </span>
            <svg
              style={{ animation: "aur-scroll-bob 2.2s ease-in-out infinite" }}
              width="16"
              height="28"
              viewBox="0 0 16 28"
              fill="none"
            >
              <line x1="8" y1="0" x2="8" y2="22" stroke={C.champagne} strokeWidth="1.2"/>
              <path d="M3 16 L8 22 L13 16" stroke={C.champagne} strokeWidth="1.2" fill="none"/>
            </svg>
          </div>
        </section>
      )}

      {/* ══════════════════ OUR STORY ══════════════════ */}
      {showStory && (
        <section
          id="aur-story"
          data-v2-section="aur-story"
          ref={storyAnim.ref as React.RefObject<HTMLElement>}
          style={{
            background: C.creamWarm,
            padding:    "100px 40px",
            ...storyAnim.style,
          }}
        >
          <div
            className="aur-story-split"
            style={{
              display:       "grid",
              gridTemplateColumns: "1fr 1fr",
              gap:           "64px",
              maxWidth:      "1100px",
              margin:        "0 auto",
              alignItems:    "center",
            }}
          >
            {/* Left: editorial image */}
            <div
              style={{
                position:  "relative",
              }}
            >
              {storyImage ? (
                <div
                  style={{
                    position:     "relative",
                    paddingBottom: "130%",
                    overflow:      "hidden",
                    border:        `1px solid ${C.border}`,
                    boxShadow:     "12px 16px 40px rgba(0,0,0,0.10)",
                  }}
                >
                  <img
                    src={storyImage}
                    alt="Our Story"
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
              ) : (
                /* Placeholder when no image */
                <div
                  style={{
                    paddingBottom: "130%",
                    background:    `linear-gradient(135deg, ${C.cardBg} 0%, ${C.border} 100%)`,
                    border:        `1px solid ${C.border}`,
                    display:       "flex",
                    alignItems:    "center",
                    justifyContent:"center",
                    position:      "relative",
                  }}
                >
                  <span
                    style={{
                      position:      "absolute",
                      top:           "50%",
                      left:          "50%",
                      transform:     "translate(-50%,-50%)",
                      fontFamily:    SERIF,
                      fontSize:      "5rem",
                      fontWeight:    300,
                      color:         C.champagne,
                      opacity:       0.25,
                      letterSpacing: "0.1em",
                    }}
                  >
                    {groomName[0]}{brideName[0]}
                  </span>
                </div>
              )}

              {/* Decorative frame accent */}
              <div
                style={{
                  position:  "absolute",
                  top:       "16px",
                  left:      "16px",
                  right:     "-16px",
                  bottom:    "-16px",
                  border:    `1px solid ${C.champagne}45`,
                  zIndex:    0,
                  pointerEvents: "none",
                }}
              />
            </div>

            {/* Right: text content */}
            <div style={{ paddingLeft: "8px" }}>
              {/* Section label */}
              <p
                style={{
                  fontFamily:    SANS,
                  fontSize:      "0.62rem",
                  fontWeight:    500,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color:         C.champagne,
                  marginBottom:  "20px",
                }}
              >
                Our Story
              </p>

              {/* Thin rule */}
              <div style={{ width: "40px", height: "1px", background: C.champagne, marginBottom: "24px", opacity: 0.6 }} />

              {/* Heading */}
              <h2
                data-v2-element="aur-story-heading"
                data-v2-type="text"
                style={{
                  fontFamily:   SERIF,
                  fontSize:     "clamp(2.2rem, 4vw, 3.5rem)",
                  fontWeight:   400,
                  lineHeight:   1.15,
                  color:        C.charcoal,
                  marginBottom: "28px",
                }}
              >
                {storyHeadingEmphasis && storyHeading.includes(storyHeadingEmphasis)
                  ? storyHeading.split(storyHeadingEmphasis).map((part, i, arr) => (
                      <React.Fragment key={i}>
                        {part}
                        {i < arr.length - 1 && (
                          <em style={{ color: C.champagne, fontStyle: "italic" }}>{storyHeadingEmphasis}</em>
                        )}
                      </React.Fragment>
                    ))
                  : (
                    <>
                      {storyHeading}{storyHeadingEmphasis && (
                        <>{" "}<em style={{ color: C.champagne, fontStyle: "italic" }}>{storyHeadingEmphasis}</em></>
                      )}
                    </>
                  )
                }
              </h2>

              {/* Body */}
              <p
                data-v2-element="aur-story-body"
                data-v2-type="textarea"
                style={{
                  fontFamily:  SANS,
                  fontSize:    "1rem",
                  fontWeight:  300,
                  lineHeight:  1.85,
                  color:       C.warmGray,
                  marginBottom:"32px",
                }}
              >
                {storyBody}
              </p>

              {/* CTA */}
              {storyCtaLabel && (
                <div
                  data-v2-element="aur-story-cta"
                  data-v2-type="text"
                  style={{
                    display:       "inline-flex",
                    alignItems:    "center",
                    gap:           "8px",
                    fontFamily:    SANS,
                    fontSize:      "0.68rem",
                    fontWeight:    500,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color:         C.champagne,
                    cursor:        "default",
                    paddingBottom: "2px",
                    borderBottom:  `1px solid ${C.champagne}60`,
                  }}
                >
                  {storyCtaLabel}
                  <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                    <path d="M0 5H12M9 1L13 5L9 9" stroke="currentColor" strokeWidth="1.2"/>
                  </svg>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════ JOURNEY / ROADMAP ══════════════════ */}
      {showRoadmap && (
        <section
          id="aur-roadmap"
          data-v2-section="aur-roadmap"
          ref={roadmapAnim.ref as React.RefObject<HTMLElement>}
          style={{
            background: C.charcoal,
            padding:    "100px 24px 80px",
            ...roadmapAnim.style,
          }}
        >
          {/* Section header */}
          <div style={{ textAlign: "center", marginBottom: "72px" }}>
            <p
              style={{
                fontFamily:    SANS,
                fontSize:      "0.62rem",
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color:         C.champagne,
                marginBottom:  "16px",
                opacity:       0.8,
              }}
            >
              The Journey
            </p>
            <h2
              data-v2-element="aur-roadmap-heading"
              data-v2-type="text"
              style={{
                fontFamily:   SERIF,
                fontSize:     "clamp(2rem, 4vw, 3.2rem)",
                fontWeight:   300,
                color:        C.warmWhite,
                letterSpacing:"0.02em",
                margin:       0,
              }}
            >
              {roadmapHeading}
            </h2>
          </div>

          {/* Roadmap container */}
          <div
            ref={roadmapRef as React.RefObject<HTMLDivElement>}
            style={{
              position:  "relative",
              maxWidth:  "800px",
              margin:    "0 auto",
              padding:   "0 24px",
            }}
          >
            {/* Center vertical line track */}
            <div
              className="aur-roadmap-center-line"
              style={{
                position:  "absolute",
                left:      "50%",
                top:       0,
                bottom:    0,
                transform: "translateX(-50%)",
                width:     "2px",
                background:`${C.champagne}22`,
                zIndex:    1,
              }}
            >
              {/* Animated fill */}
              <div
                style={{
                  position:   "absolute",
                  top:        0,
                  left:       0,
                  width:      "100%",
                  height:     `${progress * 100}%`,
                  background: `linear-gradient(to bottom, ${C.champagne}, ${C.champagneDim})`,
                  transition: "height 0.12s linear",
                }}
              />

              {/* Traveling diamond marker */}
              <div
                style={{
                  position:  "absolute",
                  top:       `${progress * 100}%`,
                  left:      "50%",
                  transform: "translate(-50%, -50%)",
                  zIndex:    3,
                  transition:"top 0.12s linear",
                  filter:    `drop-shadow(0 0 6px ${C.champagne}80)`,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20">
                  <path d="M10 0 L20 10 L10 20 L0 10 Z" fill={C.champagne} />
                </svg>
              </div>
            </div>

            {/* Milestone cards */}
            <div ref={milestonesRef as React.RefObject<HTMLDivElement>}>
              {milestones.map((m, i) => (
                <div
                  key={m.id || i}
                  data-aur-ms={i}
                  className={i % 2 === 0
                    ? "aur-roadmap-milestone-left"
                    : "aur-roadmap-milestone-right"
                  }
                  style={{
                    position:   "relative",
                    marginBottom:"60px",
                    opacity:    milestoneVisible[i] ? 1 : 0,
                    transform:  milestoneVisible[i]
                      ? "none"
                      : `translateX(${i % 2 === 0 ? "-28px" : "28px"})`,
                    transition: "opacity 0.65s ease, transform 0.65s ease",
                    zIndex:     2,
                  }}
                >
                  {/* Card */}
                  <div
                    style={{
                      background:   `${C.charcoalMid}CC`,
                      border:       `1px solid ${C.champagne}30`,
                      padding:      "24px 28px",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    {/* Year */}
                    <div
                      style={{
                        fontFamily:    SERIF,
                        fontSize:      "0.75rem",
                        fontWeight:    400,
                        letterSpacing: "0.14em",
                        color:         C.champagne,
                        marginBottom:  "8px",
                        opacity:       0.85,
                      }}
                    >
                      {m.time}
                    </div>

                    {/* Title */}
                    <h3
                      style={{
                        fontFamily:   SERIF,
                        fontSize:     "1.45rem",
                        fontWeight:   400,
                        color:        C.warmWhite,
                        margin:       "0 0 10px",
                        lineHeight:   1.25,
                      }}
                    >
                      {m.title}
                    </h3>

                    {/* Description */}
                    {m.description && (
                      <p
                        style={{
                          fontFamily: SANS,
                          fontSize:   "0.85rem",
                          fontWeight: 300,
                          color:      C.warmGray,
                          lineHeight: 1.65,
                          margin:     0,
                        }}
                      >
                        {m.description}
                      </p>
                    )}
                  </div>

                  {/* Connector dot (centered on the line) */}
                  <div
                    style={{
                      position:     "absolute",
                      top:          "28px",
                      ...(i % 2 === 0
                        ? { right: "-42px" }
                        : { left: "-42px" }),
                      width:        "10px",
                      height:       "10px",
                      borderRadius: "50%",
                      background:   C.champagne,
                      border:       `2px solid ${C.charcoal}`,
                      zIndex:       4,
                      transform:    "translateX(50%)",
                    }}
                  />
                </div>
              ))}
            </div>

            {/* After message */}
            {cfg.timeline.afterMessage?.thankYou && (
              <div
                style={{
                  textAlign:  "center",
                  paddingTop: "40px",
                  borderTop:  `1px solid ${C.champagne}20`,
                  marginTop:  "20px",
                }}
              >
                <p
                  style={{
                    fontFamily:   SERIF,
                    fontSize:     "1.2rem",
                    fontWeight:   300,
                    fontStyle:    "italic",
                    color:        C.champagne,
                    opacity:      0.85,
                  }}
                >
                  {cfg.timeline.afterMessage.thankYou}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ══════════════════ WEDDING DETAILS ══════════════════ */}
      {showDetails && (
        <section
          id="aur-details"
          data-v2-section="aur-details"
          ref={detailsAnim.ref as React.RefObject<HTMLElement>}
          style={{
            background: C.cream,
            padding:    "100px 40px",
            ...detailsAnim.style,
          }}
        >
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            {/* Section label */}
            <div style={{ textAlign: "center", marginBottom: "56px" }}>
              <p
                style={{
                  fontFamily:    SANS,
                  fontSize:      "0.62rem",
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color:         C.champagne,
                  marginBottom:  "12px",
                  opacity:       0.85,
                }}
              >
                {detailsLabel}
              </p>
              <div style={{ width: "32px", height: "1px", background: C.champagne, margin: "0 auto", opacity: 0.5 }} />
            </div>

            {/* 4 detail cards */}
            <div className="aur-details-grid">
              {venues.slice(0, 4).map((venue, i) => (
                <div
                  key={venue.id || i}
                  style={{
                    background:   C.cardBg,
                    border:       `1px solid ${C.border}`,
                    padding:      "32px 28px",
                    textAlign:    "center",
                  }}
                >
                  {/* Icon */}
                  <div style={{ fontSize: "1.6rem", marginBottom: "16px" }}>
                    {venue.mapIcon || "◆"}
                  </div>

                  {/* Card label */}
                  <p
                    style={{
                      fontFamily:    SANS,
                      fontSize:      "0.58rem",
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      color:         C.champagne,
                      marginBottom:  "10px",
                    }}
                  >
                    {venue.title}
                  </p>

                  {/* Time/Name */}
                  <p
                    style={{
                      fontFamily:   SERIF,
                      fontSize:     "1.6rem",
                      fontWeight:   400,
                      color:        C.charcoal,
                      marginBottom: "10px",
                      lineHeight:   1.2,
                    }}
                  >
                    {venue.name}
                  </p>

                  {/* Description */}
                  <p
                    style={{
                      fontFamily: SANS,
                      fontSize:   "0.82rem",
                      fontWeight: 300,
                      color:      C.warmGray,
                      lineHeight: 1.6,
                      whiteSpace: "pre-line",
                      marginBottom: venue.mapButton ? "18px" : 0,
                    }}
                  >
                    {venue.description}
                  </p>

                  {/* Map button */}
                  {venue.mapButton && venue.address && (
                    <a
                      href={`https://www.google.com/maps/search/${encodeURIComponent(venue.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display:       "inline-block",
                        fontFamily:    SANS,
                        fontSize:      "0.6rem",
                        letterSpacing: "0.16em",
                        textTransform: "uppercase",
                        color:         C.champagne,
                        textDecoration:"none",
                        borderBottom:  `1px solid ${C.champagne}60`,
                        paddingBottom: "1px",
                      }}
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

      {/* ══════════════════ VENUE ══════════════════ */}
      {showVenue && (
        <section
          id="aur-venue"
          data-v2-section="aur-venue"
          ref={venueAnim.ref as React.RefObject<HTMLElement>}
          style={venueAnim.style}
        >
          <div className="aur-venue-split">
            {/* Left: text panel */}
            <div
              style={{
                background:    C.creamWarm,
                padding:       "80px 60px",
                display:       "flex",
                flexDirection: "column",
                justifyContent:"center",
              }}
            >
              {/* Section label */}
              <p
                data-v2-element="aur-venue-subtitle"
                data-v2-type="text"
                style={{
                  fontFamily:    SANS,
                  fontSize:      "0.62rem",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color:         C.champagne,
                  marginBottom:  "20px",
                  opacity:       0.85,
                }}
              >
                {venueSubtitle}
              </p>

              {/* Venue name */}
              <h2
                data-v2-element="aur-venue-title"
                data-v2-type="text"
                style={{
                  fontFamily:   SERIF,
                  fontSize:     "clamp(2.4rem, 4vw, 4rem)",
                  fontWeight:   400,
                  color:        C.charcoal,
                  lineHeight:   1.1,
                  marginBottom: "24px",
                }}
              >
                {venueTitle}
              </h2>

              {/* Thin rule */}
              <div style={{ width: "40px", height: "1px", background: C.champagne, marginBottom: "28px", opacity: 0.6 }} />

              {/* Description */}
              <p
                data-v2-element="aur-venue-desc"
                data-v2-type="textarea"
                style={{
                  fontFamily:   SANS,
                  fontSize:     "0.95rem",
                  fontWeight:   300,
                  lineHeight:   1.8,
                  color:        C.warmGray,
                  marginBottom: "28px",
                }}
              >
                {venueDescription}
              </p>

              {/* Address */}
              {venueAddress && (
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "28px" }}>
                  <span style={{ color: C.champagne, fontSize: "0.9rem", marginTop: "1px" }}>📍</span>
                  <p
                    style={{
                      fontFamily: SANS,
                      fontSize:   "0.82rem",
                      fontWeight: 300,
                      color:      C.warmGray,
                      lineHeight: 1.65,
                      whiteSpace: "pre-line",
                      margin:     0,
                    }}
                  >
                    {venueAddress}
                  </p>
                </div>
              )}

              {/* CTA */}
              {venueCtaLabel && (
                <a
                  href={venueMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display:       "inline-flex",
                    alignItems:    "center",
                    gap:           "8px",
                    fontFamily:    SANS,
                    fontSize:      "0.65rem",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color:         C.champagne,
                    textDecoration:"none",
                    borderBottom:  `1px solid ${C.champagne}60`,
                    paddingBottom: "2px",
                    alignSelf:     "flex-start",
                  }}
                >
                  {venueCtaLabel}
                  <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                    <path d="M0 5H12M9 1L13 5L9 9" stroke="currentColor" strokeWidth="1.2"/>
                  </svg>
                </a>
              )}
            </div>

            {/* Right: venue image */}
            <div
              style={{
                background:  venueImage
                  ? `url(${venueImage}) center/cover no-repeat`
                  : `linear-gradient(135deg, ${C.cardBg} 0%, ${C.border} 100%)`,
                minHeight:   "400px",
                position:    "relative",
              }}
            >
              {!venueImage && (
                <div
                  style={{
                    position:       "absolute",
                    inset:          0,
                    display:        "flex",
                    alignItems:     "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ fontFamily: SERIF, fontSize: "3rem", color: C.champagne, opacity: 0.2 }}>
                    ✦
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════ GALLERY ══════════════════ */}
      {showGallery && (
        <section
          id="aur-gallery"
          data-v2-section="aur-gallery"
          ref={galleryAnim.ref as React.RefObject<HTMLElement>}
          style={{
            background: C.charcoalMid,
            padding:    "100px 40px",
            ...galleryAnim.style,
          }}
        >
          {/* Section header */}
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <p
              style={{
                fontFamily:    SANS,
                fontSize:      "0.62rem",
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color:         C.champagne,
                marginBottom:  "16px",
                opacity:       0.8,
              }}
            >
              {gallerySubtitle}
            </p>
            <h2
              data-v2-element="aur-gallery-title"
              data-v2-type="text"
              style={{
                fontFamily:   SERIF,
                fontSize:     "clamp(2rem, 4vw, 3rem)",
                fontWeight:   300,
                color:        C.warmWhite,
                margin:       0,
                letterSpacing:"0.02em",
              }}
            >
              {galleryTitle}
            </h2>
          </div>

          {/* Image grid */}
          {galleryImages.length > 0 ? (
            <div className="aur-gallery-grid" style={{ maxWidth: "1100px", margin: "0 auto" }}>
              {galleryImages.map((url, i) => (
                <div
                  key={i}
                  className="aur-gallery-tile"
                  style={{
                    aspectRatio: "1 / 1",
                    overflow:    "hidden",
                    background:  C.charcoalLight,
                  }}
                >
                  <img
                    src={url}
                    alt={`Gallery ${i + 1}`}
                    className="aur-gallery-img"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                textAlign:  "center",
                padding:    "80px 0",
                color:      C.warmGray,
                fontFamily: SERIF,
                fontSize:   "1.2rem",
                fontStyle:  "italic",
                opacity:    0.6,
              }}
            >
              {cfg.photos.comingSoonMessage}
            </div>
          )}
        </section>
      )}

      {/* ══════════════════ RSVP ══════════════════ */}
      {showRsvp && (
        <section
          id="aur-rsvp"
          data-v2-section="aur-rsvp"
          ref={rsvpAnim.ref as React.RefObject<HTMLElement>}
          style={{
            position:    "relative",
            minHeight:   "700px",
            display:     "flex",
            alignItems:  "center",
            justifyContent:"center",
            padding:     "80px 24px",
            background:  rsvpBgImage
              ? `url(${rsvpBgImage}) center/cover no-repeat`
              : `linear-gradient(160deg, ${C.charcoal} 0%, ${C.charcoalMid} 100%)`,
            ...rsvpAnim.style,
          }}
        >
          {/* Overlay */}
          {rsvpBgImage && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(20,18,16,0.70)", zIndex: 1 }} />
          )}

          {/* Glass panel */}
          <div
            style={{
              position:     "relative",
              zIndex:       2,
              width:        "100%",
              maxWidth:     "560px",
              background:   "rgba(28,25,23,0.78)",
              backdropFilter:"blur(16px)",
              WebkitBackdropFilter:"blur(16px)",
              border:       `1px solid ${C.champagne}28`,
              padding:      "56px 48px",
            }}
          >
            {/* Title */}
            <h2
              data-v2-element="aur-rsvp-title"
              data-v2-type="text"
              style={{
                fontFamily:   SERIF,
                fontSize:     "2.8rem",
                fontWeight:   300,
                color:        C.warmWhite,
                textAlign:    "center",
                marginBottom: "12px",
                letterSpacing:"0.04em",
              }}
            >
              {cfg.rsvp.title}
            </h2>

            {/* Description */}
            {cfg.rsvp.description && (
              <p
                data-v2-element="aur-rsvp-desc"
                data-v2-type="textarea"
                style={{
                  fontFamily:  SANS,
                  fontSize:    "0.85rem",
                  fontWeight:  300,
                  color:       C.warmGray,
                  textAlign:   "center",
                  whiteSpace:  "pre-line",
                  lineHeight:  1.75,
                  marginBottom:"36px",
                }}
              >
                {cfg.rsvp.description}
              </p>
            )}

            {rsvpSuccess ? (
              <div
                style={{
                  textAlign:  "center",
                  padding:    "32px 0",
                  fontFamily: SERIF,
                  fontSize:   "1.4rem",
                  fontStyle:  "italic",
                  color:      C.champagne,
                  lineHeight: 1.6,
                }}
              >
                {cfg.rsvp.messages.success}
              </div>
            ) : (
              <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
                {/* First + Last name row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                  <div>
                    <label style={RSVP_LABEL}>{cfg.rsvp.form.firstName}</label>
                    <input
                      {...form.register("firstName")}
                      placeholder={cfg.rsvp.form.firstNamePlaceholder}
                      className="aur-input"
                      style={RSVP_INPUT(C)}
                    />
                    {form.formState.errors.firstName && (
                      <p style={RSVP_ERR}>{form.formState.errors.firstName.message}</p>
                    )}
                  </div>
                  <div>
                    <label style={RSVP_LABEL}>{cfg.rsvp.form.lastName}</label>
                    <input
                      {...form.register("lastName")}
                      placeholder={cfg.rsvp.form.lastNamePlaceholder}
                      className="aur-input"
                      style={RSVP_INPUT(C)}
                    />
                    {form.formState.errors.lastName && (
                      <p style={RSVP_ERR}>{form.formState.errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div style={{ marginBottom: "14px" }}>
                  <label style={RSVP_LABEL}>{cfg.rsvp.form.email}</label>
                  <input
                    {...form.register("email")}
                    type="email"
                    placeholder={cfg.rsvp.form.emailPlaceholder}
                    className="aur-input"
                    style={RSVP_INPUT(C)}
                  />
                  {form.formState.errors.email && (
                    <p style={RSVP_ERR}>{form.formState.errors.email.message}</p>
                  )}
                </div>

                {/* Guest count */}
                <div style={{ marginBottom: "14px" }}>
                  <label style={RSVP_LABEL}>{cfg.rsvp.form.guestCount}</label>
                  <select
                    {...form.register("guestCount")}
                    className="aur-input"
                    style={{ ...RSVP_INPUT(C), cursor: "pointer" }}
                  >
                    {cfg.rsvp.guestOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Dietary requirements */}
                <div style={{ marginBottom: "20px" }}>
                  <label style={RSVP_LABEL}>{cfg.rsvp.form.guestNames}</label>
                  <textarea
                    {...form.register("guestNames")}
                    placeholder={cfg.rsvp.form.guestNamesPlaceholder}
                    rows={2}
                    className="aur-input"
                    style={{ ...RSVP_INPUT(C), resize: "vertical", lineHeight: 1.5 }}
                  />
                </div>

                {/* Attendance */}
                <div style={{ marginBottom: "28px" }}>
                  <label style={{ ...RSVP_LABEL, marginBottom: "12px", display: "block" }}>
                    {cfg.rsvp.form.attendance}
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    {[
                      { value: "attending",     label: cfg.rsvp.form.attendingYes },
                      { value: "not-attending", label: cfg.rsvp.form.attendingNo  },
                    ].map((opt) => {
                      const selected = form.watch("attendance") === opt.value;
                      return (
                        <label
                          key={opt.value}
                          style={{
                            display:      "block",
                            padding:      "14px",
                            border:       `1px solid ${selected ? C.champagne : `${C.champagne}30`}`,
                            background:   selected ? `${C.champagne}15` : "transparent",
                            cursor:       "pointer",
                            textAlign:    "center",
                            fontFamily:   SANS,
                            fontSize:     "0.78rem",
                            color:        selected ? C.champagne : C.warmGray,
                            letterSpacing:"0.06em",
                            transition:   "all 0.2s",
                          }}
                        >
                          <input
                            type="radio"
                            {...form.register("attendance")}
                            value={opt.value}
                            style={{ display: "none" }}
                          />
                          {opt.label}
                        </label>
                      );
                    })}
                  </div>
                  {form.formState.errors.attendance && (
                    <p style={RSVP_ERR}>{form.formState.errors.attendance.message}</p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={rsvpMutation.isPending}
                  style={{
                    width:         "100%",
                    padding:       "16px",
                    background:    rsvpMutation.isPending ? C.charcoalLight : C.champagne,
                    border:        "none",
                    color:         C.charcoal,
                    fontFamily:    SANS,
                    fontSize:      "0.68rem",
                    fontWeight:    600,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    cursor:        rsvpMutation.isPending ? "not-allowed" : "pointer",
                    transition:    "background 0.2s",
                  }}
                >
                  {rsvpMutation.isPending
                    ? cfg.rsvp.form.submittingButton
                    : cfg.rsvp.form.submitButton}
                </button>

                {/* Error message */}
                {rsvpMutation.isError && (
                  <p
                    style={{
                      marginTop:  "12px",
                      fontFamily: SANS,
                      fontSize:   "0.78rem",
                      color:      "#EF4444",
                      textAlign:  "center",
                    }}
                  >
                    {cfg.rsvp.messages.error}
                  </p>
                )}
              </form>
            )}
          </div>
        </section>
      )}

      {/* ══════════════════ FOOTER ══════════════════ */}
      <footer
        data-v2-section="aur-footer"
        ref={footerAnim.ref as React.RefObject<HTMLElement>}
        style={{
          background:    C.charcoal,
          padding:       "80px 40px 48px",
          textAlign:     "center",
          ...footerAnim.style,
        }}
      >
        {/* Couple names */}
        <h2
          style={{
            fontFamily:   SERIF,
            fontSize:     "clamp(2rem, 5vw, 3.5rem)",
            fontWeight:   300,
            letterSpacing:"0.04em",
            color:        C.champagne,
            margin:       "0 0 6px",
          }}
        >
          {groomName}{" "}
          <span style={{ fontStyle: "italic", opacity: 0.7 }}>{separator}</span>
          {" "}{brideName}
        </h2>

        {/* Tagline */}
        <p
          data-v2-element="aur-footer-tagline"
          data-v2-type="text"
          style={{
            fontFamily:    SANS,
            fontSize:      "0.62rem",
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color:         C.warmGray,
            marginBottom:  "36px",
            opacity:       0.8,
          }}
        >
          {footerTagline}
        </p>

        {/* Thin rule */}
        <div style={{ width: "48px", height: "1px", background: C.champagne, margin: "0 auto 28px", opacity: 0.3 }} />

        {/* Social links */}
        {(socialInstagram || socialFacebook || socialEmail) && (
          <div style={{ display: "flex", justifyContent: "center", gap: "24px", marginBottom: "36px" }}>
            {socialInstagram && (
              <a
                href={socialInstagram}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: C.warmGray, textDecoration: "none", fontSize: "0.75rem", letterSpacing: "0.1em", fontFamily: SANS, opacity: 0.7, transition: "opacity 0.2s" }}
              >
                Instagram
              </a>
            )}
            {socialFacebook && (
              <a
                href={socialFacebook}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: C.warmGray, textDecoration: "none", fontSize: "0.75rem", letterSpacing: "0.1em", fontFamily: SANS, opacity: 0.7, transition: "opacity 0.2s" }}
              >
                Facebook
              </a>
            )}
            {socialEmail && (
              <a
                href={`mailto:${socialEmail}`}
                style={{ color: C.warmGray, textDecoration: "none", fontSize: "0.75rem", letterSpacing: "0.1em", fontFamily: SANS, opacity: 0.7, transition: "opacity 0.2s" }}
              >
                Email
              </a>
            )}
          </div>
        )}

        {/* Copyright */}
        <p
          style={{
            fontFamily: SANS,
            fontSize:   "0.6rem",
            color:      C.warmGray,
            opacity:    0.4,
            letterSpacing: "0.08em",
          }}
        >
          © {new Date().getFullYear()} {groomName} &amp; {brideName}. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

// ─── Reusable sub-components ──────────────────────────────────────────────────

/** Lazily injects Google Fonts for Cormorant Garamond + Raleway */
function AureliaFonts() {
  useEffect(() => {
    const id = "aurelia-gfonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id   = id;
    link.rel  = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Raleway:wght@300;400;500;600&display=swap";
    document.head.appendChild(link);
  }, []);
  return null;
}

// ─── RSVP form style helpers ──────────────────────────────────────────────────
const RSVP_LABEL: React.CSSProperties = {
  display:       "block",
  fontFamily:    "Raleway, Inter, sans-serif",
  fontSize:      "0.6rem",
  fontWeight:    500,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color:         "#78716C",
  marginBottom:  "6px",
};

function RSVP_INPUT(C: typeof C_DEFAULT): React.CSSProperties {
  return {
    width:          "100%",
    background:     "rgba(41,37,36,0.7)",
    border:         `1px solid ${C.champagne}28`,
    borderRadius:   0,
    padding:        "10px 12px",
    fontFamily:     "Raleway, Inter, sans-serif",
    fontSize:       "0.82rem",
    color:          C.warmWhite,
    outline:        "none",
    boxSizing:      "border-box",
    appearance:     "none",
  };
}

const RSVP_ERR: React.CSSProperties = {
  marginTop:  "4px",
  fontFamily: "Raleway, Inter, sans-serif",
  fontSize:   "0.7rem",
  color:      "#EF4444",
};
