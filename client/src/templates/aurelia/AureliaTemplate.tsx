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

// ─── Parallax scroll hook ─────────────────────────────────────────────────────
function useParallax(factor: number = 0.3, builderMode: boolean = false) {
  const [offset, setOffset] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (builderMode) return;
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const update = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const winH = window.innerHeight;
      const center = rect.top + rect.height / 2 - winH / 2;
      setOffset(center * factor);
    };

    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, [factor, builderMode]);

  return { ref, offset };
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
  // Cinematic default hero image (Unsplash scenic wedding backdrop)
  const HERO_DEFAULT = "https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=80&auto=format&fit=crop";
  const heroImage     = (cfg.hero.images && cfg.hero.images[0]) || HERO_DEFAULT;

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

  // ── Parallax layers ──────────────────────────────────────────────────────────
  const heroParallax    = useParallax(0.25, builderMode);
  const storyParallax   = useParallax(0.18, builderMode);
  const venueParallax   = useParallax(0.20, builderMode);
  const rsvpParallax    = useParallax(0.15, builderMode);

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
        @keyframes aur-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes aur-glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(196,169,125,0.15); }
          50%       { box-shadow: 0 0 40px rgba(196,169,125,0.30); }
        }
        @keyframes aur-hero-reveal {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
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
          transition: transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94);
          display: block;
        }
        .aur-gallery-tile:hover .aur-gallery-img { transform: scale(1.06); }
        .aur-gallery-tile {
          overflow: hidden;
          position: relative;
        }
        .aur-gallery-tile::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(10,8,6,0.55) 0%, transparent 60%);
          opacity: 0;
          transition: opacity 0.4s ease;
        }
        .aur-gallery-tile:hover::after { opacity: 1; }

        /* Detail card hover */
        .aur-detail-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .aur-detail-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 48px rgba(0,0,0,0.12) !important;
        }

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
          gap: 24px;
          max-width: 760px;
          margin: 0 auto;
        }

        /* Gallery staggered grid */
        .aur-gallery-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
        }
        .aur-gallery-grid > *:first-child {
          grid-row: span 2;
        }

        /* Story image frame */
        .aur-story-image-frame {
          position: relative;
          overflow: hidden;
        }
        .aur-story-image-frame::before {
          content: '';
          position: absolute;
          top: 16px; left: 16px; right: -16px; bottom: -16px;
          border: 1px solid ${C.champagne}45;
          z-index: 0;
          pointer-events: none;
        }

        /* Glass card */
        .aur-glass {
          background: rgba(20,17,14,0.65);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(196,169,125,0.20);
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
          .aur-gallery-grid > *:first-child { grid-row: span 1; }
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

      {/* ══════════════════ OUR STORY ══════════════════ */}
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

      {/* ══════════════════ JOURNEY / ROADMAP ══════════════════ */}
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

      {/* ══════════════════ WEDDING DETAILS ══════════════════ */}
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

      {/* ══════════════════ VENUE ══════════════════ */}
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

      {/* ══════════════════ GALLERY ══════════════════ */}
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

      {/* ══════════════════ RSVP ══════════════════ */}
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
