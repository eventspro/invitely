/**
 * Aurelia — Pixel-Perfect Cinematic V2 Wedding Template
 *
 * Visual identity: deep dark teal / forest green + gold
 * Key differentiators:
 *   - Full-screen image-led sections with layered glass panels
 *   - SVG curved route animation with getPointAtLength car marker
 *   - Editorial layered gallery carousel with tilted side images
 *   - Countdown glass card anchored bottom-right of hero
 *
 * All styles scoped via inline + .aur-* class names in <style> block.
 * Zero global style pollution.
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
import { WeddingCarMapMarker, WeddingCarRoadmapIcon } from "./components/WeddingCarRoadmapIcon";
import { DetailIcon, DETAIL_ICON_KEYS } from "../shared/detail-icons";

// ─── Spec colour palette — dark teal + gold ───────────────────────────────────
const C_DEFAULT = {
  bgDark:      "#081212",
  bgDeep:      "#0C1412",
  panelDark:   "rgba(8,14,12,0.72)",
  panelGlass:  "rgba(12,18,15,0.62)",
  gold:        "#D7B777",
  goldSoft:    "#F1D8A1",
  ivory:       "#F7F0E3",
  ivoryMuted:  "#D6C8B0",
  textLight:   "#FFF7EA",
  textMuted:   "#CBBEA8",
  borderGold:  "rgba(215,183,119,0.55)",
  shadowDark:  "rgba(0,0,0,0.45)",
  overlayDark: "rgba(0,0,0,0.46)",
} as const;

// ─── Font shortcuts ───────────────────────────────────────────────────────────
const SERIF_DEFAULT = "'Cormorant Garamond', 'Playfair Display', Georgia, serif";
const SANS_DEFAULT  = "'Montserrat', 'Inter', 'system-ui', sans-serif";

// ─── Scroll reveal hook ───────────────────────────────────────────────────────
function useSectionAnim(animType: string, builderMode: boolean) {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (builderMode || !animType || animType === "none") { setActive(true); return; }
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
    ? { animation: `aur-${animType} 0.9s cubic-bezier(0.25,0.46,0.45,0.94) both` }
    : { opacity: 0, ...(animType === "fade-up" ? { transform: "translateY(36px)" } : {}) };
  return { ref, style };
}

// ─── Roadmap scroll progress hook ────────────────────────────────────────────
function useRoadmapProgress(builderMode: boolean) {
  const [progress, setProgress] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (builderMode || prefersReduced) { setProgress(1); return; }
    const update = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const winH = window.innerHeight;
      const start = winH * 0.8 - rect.top;
      const total = el.offsetHeight * 1.3;
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

// ─── Parallax hook ────────────────────────────────────────────────────────────
function useParallax(factor = 0.3, builderMode = false) {
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
      setOffset((rect.top + rect.height / 2 - winH / 2) * factor);
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, [factor, builderMode]);
  return { ref, offset };
}

// ─── Milestone sequential reveal hook ────────────────────────────────────────
// Uses two separate refs (desktop + mobile) so both can be observed independently.
// data-aur-ms value is used as the index to avoid double-counting elements.
function useMilestoneReveal(count: number, builderMode: boolean) {
  const [visible, setVisible] = useState<boolean[]>(() => Array(count).fill(false));
  const desktopRef = useRef<HTMLDivElement>(null);
  const mobileRef  = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (builderMode || prefersReduced) { setVisible(Array(count).fill(true)); return; }
    const observers: IntersectionObserver[] = [];
    [desktopRef.current, mobileRef.current].forEach(container => {
      if (!container) return;
      Array.from(container.querySelectorAll("[data-aur-ms]")).forEach(el => {
        const idx = parseInt((el as HTMLElement).dataset.aurMs ?? "0", 10);
        const obs = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              setTimeout(
                () => setVisible(prev => { const n = [...prev]; n[idx] = true; return n; }),
                idx * 120
              );
              obs.disconnect();
            }
          },
          { threshold: 0.18, rootMargin: "0px 0px -40px 0px" }
        );
        obs.observe(el);
        observers.push(obs);
      });
    });
    return () => observers.forEach(o => o.disconnect());
  }, [count, builderMode]);
  return { desktopRef, mobileRef, visible };
}

// ─── Mobile roadmap progress (mirrors desktop but for the vertical mobile path) ─
function useMobileRoadmapProgress(builderMode: boolean) {
  const [progress, setProgress] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (builderMode || prefersReduced) { setProgress(1); return; }
    const update = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const winH = window.innerHeight;
      const start = winH * 0.75 - rect.top;
      const total = el.offsetHeight * 1.3;
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

// ─── Mobile gallery touch hook ─────────────────────────────────────────────────
function useTouchGallery(total: number) {
  const [index, setIndex] = useState(0);
  const startX = useRef<number | null>(null);
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  }, []);
  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (startX.current === null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(dx) > 42) {
      if (dx < 0) setIndex(i => (i + 1) % total);
      else        setIndex(i => (i - 1 + total) % total);
    }
    startX.current = null;
  }, [total]);
  const goTo = useCallback((i: number) => setIndex(i), []);
  const prev = useCallback(() => setIndex(i => (i - 1 + total) % total), [total]);
  const next = useCallback(() => setIndex(i => (i + 1) % total), [total]);
  return { index, onTouchStart, onTouchEnd, goTo, prev, next };
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface AureliaTemplateProps {
  config: WeddingConfig;
  templateId?: string;
  /** When true: sticky nav, all animations at final state, data-v2-* active */
  builderMode?: boolean;
  /** "desktop" | "tablet" | "mobile" — controls CSS class for preview simulation */
  devicePreview?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AureliaTemplate({
  config,
  templateId,
  builderMode = false,
  devicePreview,
}: AureliaTemplateProps) {

  // ── Config merge ──────────────────────────────────────────────────────────────
  const cfg: WeddingConfig = {
    ...defaultConfig,
    ...config,
    couple:    { ...defaultConfig.couple,    ...(config.couple    || {}) },
    wedding:   { ...defaultConfig.wedding,   ...(config.wedding   || {}) },
    hero:      { ...defaultConfig.hero,      ...(config.hero      || {}) },
    timeline:  { ...defaultConfig.timeline,  ...(config.timeline  || {}) },
    locations: { ...defaultConfig.locations, ...(config.locations || {}) },
    rsvp: {
      ...defaultConfig.rsvp,
      ...(config.rsvp || {}),
      form: { ...defaultConfig.rsvp.form, ...(config.rsvp?.form || {}) },
    },
    photos: { ...defaultConfig.photos, ...(config.photos || {}) },
    footer: { ...defaultConfig.footer, ...(config.footer || {}) },
  };

  // Cast for Aurelia-extended fields
  const ext = cfg as unknown as AureliaExtendedConfig & WeddingConfig & Record<string, unknown>;

  // Builder device preview flags (simulate CSS media queries via class names)
  const isBuilderMobile  = builderMode && devicePreview === "mobile";
  const isBuilderTablet  = builderMode && (devicePreview === "tablet" || devicePreview === "mobile");

  // ── Dynamic theme ─────────────────────────────────────────────────────────────
  const colors = (cfg.theme?.colors ?? {}) as Record<string, string | undefined>;
  const C: Record<keyof typeof C_DEFAULT, string> = {
    ...C_DEFAULT,
    gold:       colors.primary          ?? C_DEFAULT.gold,
    goldSoft:   colors.primary          ?? C_DEFAULT.goldSoft,
    bgDark:     colors.secondary    ?? C_DEFAULT.bgDark,
    bgDeep:     colors.secondary    ?? C_DEFAULT.bgDeep,
    textLight:  colors.lightText    ?? C_DEFAULT.textLight,
    textMuted:  colors.mutedText    ?? C_DEFAULT.textMuted,
    ivory:      colors.background   ?? C_DEFAULT.ivory,
    ivoryMuted: colors.textColor    ?? C_DEFAULT.ivoryMuted,
  };

  const SERIF = cfg.theme?.fonts?.heading || SERIF_DEFAULT;
  const SANS  = cfg.theme?.fonts?.body    || SANS_DEFAULT;

  // ── Derived content ───────────────────────────────────────────────────────────
  const groomName   = cfg.couple.groomName  ?? "Matteo";
  const brideName   = cfg.couple.brideName  ?? "Sophia";
  const separator   = (ext.nameSeparator as string | undefined) ?? cfg.footer.separator ?? "&";
  const displayDate = cfg.wedding.displayDate || "20 \u2022 09 \u2022 2026";
  const HERO_DEFAULT = "https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=80&auto=format&fit=crop";
  const heroImage          = (cfg.hero.images && cfg.hero.images[0]) || HERO_DEFAULT;
  const heroLocation       = (ext.heroLocation as string | undefined)       ?? "Amalfi Coast, Italy";
  const heroInvitationLine = (ext.heroInvitationLine as string | undefined) ?? "WE\u2019RE GETTING MARRIED";
  const heroCta            = (ext.heroCta as string | undefined)            ?? "RSVP NOW";

  const storySmallTitle = (ext.storySmallTitle as string | undefined) ?? "OUR STORY";
  const storyHeading    = (ext.storyHeading as string | undefined)    ?? "Our Love Story";
  const storyBody       = (ext.storyBody as string | undefined)       ?? "We crossed paths on a warm summer evening in Rome \u2014 a chance encounter that neither of us expected. What started as a brief conversation turned into hours, then days, then years of shared adventure and quiet joy.";
  const storyCtaLabel   = (ext.storyCtaLabel as string | undefined)   ?? "READ OUR STORY";
  const storyImage      = (ext.storyImage as string | undefined)      ?? "";

  const roadmapSmallTitle  = (ext.roadmapSmallTitle as string | undefined)  ?? "WEDDING ROUTE";
  const roadmapHeading     = (ext.roadmapHeading as string | undefined)     ?? "Your Wedding Day Roadmap";
  const roadmapSubtitle    = (ext.roadmapSubtitle as string | undefined)    ?? "Follow the route from the first stop to the final celebration.";
  const roadmapBgImage     = (ext.roadmapBgImage as string | undefined)     ?? "";
  const routeInstruction   = (ext.routeInstruction as string | undefined)   ?? "Scroll to follow the route";
  const showStopNumbers    = (ext.showStopNumbers as boolean | undefined)   ?? true;
  const milestones = cfg.timeline.events.length > 0 ? cfg.timeline.events : defaultConfig.timeline.events;
  // Progress threshold at which each stop's dot activates (evenly spaced, reached slightly before halfway through each segment)
  const stopProgressPositions = milestones.map((_, i) => (i + 0.5) / milestones.length);

  const detailsSmallTitle = (ext.detailsSmallTitle as string | undefined) ?? "WEDDING NOTES";
  const detailsLabel      = cfg.locations.sectionTitle || "THE CELEBRATION";
  const venues            = cfg.locations.venues;

  const venueSubtitle    = (ext.venueSubtitle as string | undefined)    ?? "THE VENUE";
  const venueTitle       = (ext.venueTitle as string | undefined)       ?? "Villa Cimbrone";
  // venueAddress (from inspector) takes priority; venueLocation is legacy alias
  const venueLocation    = (ext.venueAddress as string | undefined)     ?? (ext.venueLocation as string | undefined) ?? "Ravello, Amalfi Coast";
  const venueDescription = (ext.venueDescription as string | undefined) ?? "A timeless Italian villa perched on the clifftops above the Amalfi Coast, surrounded by ancient gardens and breathtaking sea views.";
  const venueCtaLabel    = (ext.venueCtaLabel as string | undefined)    ?? "EXPLORE THE VENUE";
  const venueMapUrl      = (ext.venueMapUrl as string | undefined)      || (venues[0]?.address ? `https://www.google.com/maps/search/${encodeURIComponent(venues[0].address)}` : "#");
  const venueImage       = (ext.venueImage as string | undefined)       ?? "";

  const galleryTitle     = (ext.galleryTitle as string | undefined)     ?? cfg.photos.title;
  const gallerySmallLabel = (ext.gallerySubtitle as string | undefined) ?? "OUR MOMENTS";
  const galleryBgImage   = (ext.galleryBgImage as string | undefined)   ?? "";
  const galleryHint      = (ext.galleryHint as string | undefined)      ?? "DRAG OR SCROLL TO EXPLORE";
  const galleryImages    = cfg.photos.galleryImages || [];
  const filteredGalleryImages = galleryImages.filter(Boolean);

  const rsvpBgImage  = (ext.rsvpBgImage as string | undefined)  ?? "";
  const rsvpNote     = (ext.rsvpNote as string | undefined)     ?? "We can\u2019t wait to celebrate with you in the beautiful surroundings of the Amalfi Coast.";
  const rsvpDeadline = cfg.rsvp.description?.split("\n")[0]     ?? "Please respond by June 1st, 2026.";

  const footerTagline   = (ext.footerTagline as string | undefined)   ?? cfg.footer.thankYouMessage;
  const socialInstagram = (ext.socialInstagram as string | undefined) || "";
  const socialFacebook  = (ext.socialFacebook as string | undefined)  || "";
  const socialEmail     = (ext.socialEmail as string | undefined)     || "";

  // ── Section visibility ────────────────────────────────────────────────────────
  const showHero    = cfg.sections?.hero?.enabled     !== false;
  const showStory   = (cfg.sections as Record<string, { enabled?: boolean } | undefined>)?.story?.enabled   !== false;
  const showRoadmap = cfg.sections?.timeline?.enabled !== false;
  const showDetails = cfg.sections?.locations?.enabled !== false;
  const showVenue   = (cfg.sections as Record<string, { enabled?: boolean } | undefined>)?.venue?.enabled   !== false;
  const showGallery = cfg.sections?.photos?.enabled   !== false;
  const showRsvp    = cfg.sections?.rsvp?.enabled     !== false;

  // ── Countdown ─────────────────────────────────────────────────────────────────
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

  // ── Navbar ────────────────────────────────────────────────────────────────────
  const [scrolled, setScrolled]           = useState(builderMode);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => {
    if (builderMode) return;
    const onScroll = () => setScrolled(window.scrollY > 72);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [builderMode]);

  // ── RSVP form ─────────────────────────────────────────────────────────────────
  const [rsvpSuccess, setRsvpSuccess] = useState(false);
  const form = useForm<InsertRsvp>({
    resolver: zodResolver(insertRsvpSchema),
    defaultValues: {
      templateId: templateId || "",
      firstName: "", lastName: "", email: "",
      guestEmail: "", guestCount: "1", guestNames: "",
      attendance: "attending", attending: true, guests: 1,
    },
  });
  const rsvpMutation = useMutation({
    mutationFn: async (data: InsertRsvp) => {
      const endpoint = templateId ? `/api/templates/${templateId}/rsvp` : "/api/rsvp";
      const res = await apiRequest("POST", endpoint, data);
      return res.json();
    },
    onSuccess: () => { setRsvpSuccess(true); form.reset(); },
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

  // ── Gallery state ─────────────────────────────────────────────────────────────
  const GALLERY_PLACEHOLDERS = [
    "https://images.unsplash.com/photo-1465495976277-a3741a19326e?w=800&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1507504031003-b417219a0fde?w=800&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&q=80&auto=format&fit=crop",
  ];
  const GALLERY_FALLBACK = "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80&auto=format&fit=crop";
  const MILESTONE_FALLBACKS = [
    "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1507504031003-b417219a0fde?w=600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1465495976277-a3741a19326e?w=600&q=80&auto=format&fit=crop",
  ];
  const allGalleryImages = filteredGalleryImages.length > 0 ? filteredGalleryImages : GALLERY_PLACEHOLDERS;
  const [galleryIndex, setGalleryIndex] = useState(0);
  const galleryPrev = useCallback(() => setGalleryIndex(i => (i - 1 + allGalleryImages.length) % allGalleryImages.length), [allGalleryImages.length]);
  const galleryNext = useCallback(() => setGalleryIndex(i => (i + 1) % allGalleryImages.length), [allGalleryImages.length]);
  const routePathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);
  useEffect(() => {
    if (routePathRef.current) {
      setPathLength(routePathRef.current.getTotalLength());
    }
  }, []);

  // ── SVG route path (mobile vertical) ─────────────────────────────────────────
  const mobileRoutePathRef   = useRef<SVGPathElement>(null);
  const msMobileContainerRef = useRef<HTMLDivElement>(null);   // position:relative wrapper — measured for y-scaling
  const MOBILE_PATH_APPROX   = 1550;
  const [mobilePathLength, setMobilePathLength] = useState(MOBILE_PATH_APPROX);
  // Measured height of the cards container = SVG rendered height
  const [mobileRailH, setMobileRailH] = useState(0);
  // Car position in CSS pixels relative to msMobileContainerRef
  const [mobileCarPos, setMobileCarPos] = useState({ x: 30, y: 0 });

  // Retry getTotalLength until the path is visible and laid out
  useEffect(() => {
    let rafId: number;
    const tryGet = () => {
      const el = mobileRoutePathRef.current;
      if (el) {
        const len = el.getTotalLength();
        if (len > 0) { setMobilePathLength(len); return; }
      }
      rafId = requestAnimationFrame(tryGet);
    };
    rafId = requestAnimationFrame(tryGet);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Use ResizeObserver to reliably capture when the container has real pixel height
  useEffect(() => {
    const el = msMobileContainerRef.current;
    if (!el) return;
    const update = () => { const h = el.offsetHeight; if (h > 0) setMobileRailH(h); };
    const ro = new ResizeObserver(update);
    ro.observe(el);
    update();
    return () => ro.disconnect();
  }, []);

  // ── Section entrance animations ───────────────────────────────────────────────
  const storyAnim   = useSectionAnim("fade-up", builderMode);
  const roadmapAnim = useSectionAnim("fade-up", builderMode);
  const detailsAnim = useSectionAnim("fade-up", builderMode);
  const venueAnim   = useSectionAnim("fade-up", builderMode);
  const galleryAnim = useSectionAnim("fade-up", builderMode);
  const rsvpAnim    = useSectionAnim("fade-in", builderMode);
  const footerAnim  = useSectionAnim("fade-in", builderMode);

  // ── Parallax ──────────────────────────────────────────────────────────────────
  const heroParallax  = useParallax(0.25, builderMode);
  const storyParallax = useParallax(0.18, builderMode);
  const venueParallax = useParallax(0.20, builderMode);
  const rsvpParallax  = useParallax(0.15, builderMode);

  // ── Roadmap animation ─────────────────────────────────────────────────────────
  const { sectionRef: roadmapRef, progress } = useRoadmapProgress(builderMode);
  const { sectionRef: mobileRoadmapRef, progress: mobileProgress } = useMobileRoadmapProgress(builderMode);

  // Recompute car position whenever progress, path length, or measured height changes.
  // viewBox y (0–1400) maps to screen y (0–mobileRailH). x maps 1:1 (CSS width = viewBox width = 60px).
  useEffect(() => {
    const path = mobileRoutePathRef.current;
    if (!path || mobileRailH === 0) return;
    let rafId: number;
    rafId = requestAnimationFrame(() => {
      const len = path.getTotalLength() || MOBILE_PATH_APPROX;
      const pt  = path.getPointAtLength(mobileProgress * len);
      setMobileCarPos({ x: pt.x, y: pt.y * (mobileRailH / 1400) });
    });
    return () => cancelAnimationFrame(rafId);
  }, [mobileProgress, mobilePathLength, mobileRailH]);

  const { desktopRef: msDesktopRef, mobileRef: msMobileRef, visible: milestoneVisible } =
    useMilestoneReveal(milestones.length, builderMode);

  // ── Mobile detection (SSR-safe) ───────────────────────────────────────────────
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── Mobile gallery touch ──────────────────────────────────────────────────────
  const mobileGal = useTouchGallery(allGalleryImages.length);

  // ── Nav click ─────────────────────────────────────────────────────────────────
  const handleNavLink = useCallback((href: string) => {
    setMobileMenuOpen(false);
    if (!builderMode && typeof document !== "undefined") {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    }
  }, [builderMode]);

  const NAV_LINKS = [
    { label: "Our Story",   href: "#aur-story"   },
    { label: "The Route",   href: "#aur-roadmap" },
    { label: "Details",     href: "#aur-details" },
    { label: "Venue",       href: "#aur-venue"   },
    { label: "Gallery",     href: "#aur-gallery" },
    { label: "RSVP",        href: "#aur-rsvp"    },
  ];

  // ── Car marker position from SVG path ─────────────────────────────────────────
  const carPt = (pathLength > 0 && routePathRef.current)
    ? routePathRef.current.getPointAtLength(progress * pathLength)
    : null;

  // ── Venue feature items with inline SVG icons ─────────────────────────────────
  const venueFeatures = [
    {
      label: "Ceremony",
      text: venues[0]?.name || "5:00 PM",
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={C.gold} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 14V8H13V14"/><path d="M1 8h14"/><path d="M8 2v4M6 4h4"/><path d="M5 8V6h6v2"/>
        </svg>
      ),
    },
    {
      label: "Cocktail Hour",
      text: venues[1]?.name || "6:30 PM",
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={C.gold} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 2l8 0L9 9H7L4 2z"/><line x1="8" y1="9" x2="8" y2="14"/><line x1="5" y1="14" x2="11" y2="14"/>
        </svg>
      ),
    },
    {
      label: "Reception",
      text: venues[2]?.name || "8:00 PM",
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={C.gold} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="5" cy="12" r="2"/><circle cx="11" cy="10" r="2"/><path d="M7 12V6l6-2v4"/>
        </svg>
      ),
    },
    {
      label: "Dress Code",
      text: venues[3]?.name || "Black Tie",
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={C.gold} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4L8 8L12 4L12 13L4 13Z"/>
        </svg>
      ),
    },
  ];

  // ── Detail card icons ─────────────────────────────────────────────────────────
  const FALLBACK_ICON_KEYS = ["hanger", "gift", "car", "calendar"];
  function detailIcon(venue: (typeof venues)[0], i: number) {
    const iconKey = (venue as Record<string, unknown>).mapIcon as string | undefined;
    const key = (iconKey && (DETAIL_ICON_KEYS as readonly string[]).includes(iconKey))
      ? iconKey
      : FALLBACK_ICON_KEYS[i] ?? "calendar";
    return <DetailIcon iconKey={key} stroke={C.gold} size={38} />;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div
      className={[
        isBuilderMobile ? "aur-builder-mobile aur-builder-tablet" : isBuilderTablet ? "aur-builder-tablet" : "",
      ].filter(Boolean).join(" ") || undefined}
      style={{
        fontFamily: SANS,
        color: C.textLight,
        background: C.bgDark,
        overflowX: "hidden",
        scrollBehavior: builderMode ? undefined : "smooth",
      }}
    >
      {/* Google Fonts */}
      <AureliaFonts headingFont={SERIF} bodyFont={SANS} />

      {/* Scoped CSS */}
      <style>{`
        @keyframes aur-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes aur-fade-up {
          from { opacity: 0; transform: translateY(36px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes aur-hero-scale {
          from { transform: scale(1.04); }
          to   { transform: scale(1); }
        }
        @keyframes aur-hero-content {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes aur-countdown-slide {
          from { opacity: 0; transform: translateX(44px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes aur-scroll-bob {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50%       { transform: translateX(-50%) translateY(9px); }
        }
        @keyframes aur-panel-reveal {
          from { opacity: 0; transform: translateY(36px); filter: blur(10px); }
          to   { opacity: 1; transform: translateY(0);    filter: blur(0);    }
        }
        @keyframes aur-ms-card-in {
          from { opacity: 0; transform: translateX(-18px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes aur-mob-gal-float {
          0%, 100% { transform: translateY(0px) rotate(var(--rot, 0deg)); }
          50%       { transform: translateY(-5px) rotate(var(--rot, 0deg)); }
        }

        html { scroll-behavior: smooth; }

        .aur-nav-link {
          font-family: ${SANS};
          font-size: 0.62rem;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(255,247,234,0.72);
          text-decoration: none;
          transition: color 0.22s;
        }
        .aur-nav-link:hover { color: ${C.goldSoft}; }

        .aur-story-panel {
          animation: aur-panel-reveal 1.1s 0.35s cubic-bezier(0.25,0.46,0.45,0.94) both;
        }

        .aur-detail-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
        }
        .aur-detail-card:hover {
          transform: translateY(-6px);
          border-color: rgba(180,145,80,0.70) !important;
          box-shadow: 0 20px 56px rgba(0,0,0,0.13) !important;
        }

        .aur-gal-center {
          transform: scale(1) rotate(0deg);
          z-index: 10;
          filter: brightness(1);
          transition: all 0.55s cubic-bezier(0.25,0.46,0.45,0.94);
          box-shadow: 0 40px 80px rgba(0,0,0,0.62);
        }
        .aur-gal-left {
          transform: translateX(-58%) scale(0.80) rotate(-5deg);
          z-index: 5;
          filter: brightness(0.60);
          transition: all 0.55s cubic-bezier(0.25,0.46,0.45,0.94);
          box-shadow: 0 20px 48px rgba(0,0,0,0.42);
        }
        .aur-gal-right {
          transform: translateX(58%) scale(0.80) rotate(5deg);
          z-index: 5;
          filter: brightness(0.60);
          transition: all 0.55s cubic-bezier(0.25,0.46,0.45,0.94);
          box-shadow: 0 20px 48px rgba(0,0,0,0.42);
        }
        .aur-gal-hidden {
          opacity: 0;
          transform: scale(0.65);
          pointer-events: none;
          transition: all 0.55s cubic-bezier(0.25,0.46,0.45,0.94);
        }

        .aur-gal-arrow {
          width: 52px; height: 52px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          border: 1px solid rgba(215,183,119,0.38);
          background: rgba(8,18,14,0.55);
          color: ${C.gold};
          backdrop-filter: blur(8px);
          transition: border-color 0.22s, background 0.22s, box-shadow 0.22s;
        }
        .aur-gal-arrow:hover {
          border-color: ${C.gold};
          background: rgba(8,18,14,0.88);
          box-shadow: 0 0 28px rgba(215,183,119,0.38);
        }

        .aur-venue-feat {
          display: flex; gap: 14px; align-items: flex-start;
          padding: 14px 0;
          border-bottom: 1px solid rgba(215,183,119,0.12);
        }
        .aur-venue-feat:last-child { border-bottom: none; }

        .aur-input:focus {
          outline: none;
          border-color: ${C.gold} !important;
          box-shadow: 0 0 0 2px rgba(215,183,119,0.16);
        }

        .aur-ms-left  { margin-right: calc(50% + 44px); text-align: right; }
        .aur-ms-right { margin-left:  calc(50% + 44px); }

        /* Desktop shows desktop variants, mobile hides them by default */
        .aur-ms-desktop { display: block; }
        .aur-ms-mobile  { display: none; }
        .aur-gal-desktop { display: block; }
        .aur-gal-mobile  { display: none; }

        /* ─── Mobile gallery coverflow ───────────────────────────────── */
        .aur-mob-gal-track {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: visible;
          touch-action: pan-y;
          user-select: none;
          -webkit-user-select: none;
        }
        .aur-mob-gal-card {
          position: absolute;
          border-radius: 10px;
          overflow: hidden;
          transition: all 0.5s cubic-bezier(0.25,0.46,0.45,0.94);
          cursor: pointer;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .aur-mob-gal-card img {
          width: 100%; height: 100%;
          object-fit: cover; display: block;
        }
        .aur-mob-gal-card.state-center {
          transform: scale(1) rotate(0deg) translateX(0);
          z-index: 10;
          filter: brightness(1);
          box-shadow: 0 32px 64px rgba(0,0,0,0.65), 0 0 0 1px rgba(215,183,119,0.22);
        }
        .aur-mob-gal-card.state-left1 {
          transform: scale(0.84) rotate(-5deg) translateX(-68%);
          z-index: 6;
          filter: brightness(0.55);
          box-shadow: 0 16px 40px rgba(0,0,0,0.45);
        }
        .aur-mob-gal-card.state-right1 {
          transform: scale(0.84) rotate(5deg) translateX(68%);
          z-index: 6;
          filter: brightness(0.55);
          box-shadow: 0 16px 40px rgba(0,0,0,0.45);
        }
        .aur-mob-gal-card.state-left2 {
          transform: scale(0.68) rotate(-9deg) translateX(-115%);
          z-index: 3;
          filter: brightness(0.32);
          box-shadow: 0 8px 24px rgba(0,0,0,0.38);
        }
        .aur-mob-gal-card.state-right2 {
          transform: scale(0.68) rotate(9deg) translateX(115%);
          z-index: 3;
          filter: brightness(0.32);
          box-shadow: 0 8px 24px rgba(0,0,0,0.38);
        }
        .aur-mob-gal-card.state-hidden {
          transform: scale(0.5);
          z-index: 0;
          opacity: 0;
          pointer-events: none;
        }

        /* ─── Mobile-first foundation ─────────────────────────────────── */
        *, *::before, *::after { box-sizing: border-box; }
        img, video, svg { max-width: 100%; }

        /* Safe viewport units — modern browsers understand 100svh */
        .aur-hero-sect  { min-height: 100vh; min-height: 100svh; }
        .aur-story-sect { min-height: 100vh; min-height: 100svh; }
        .aur-rsvp-sect  { min-height: 100vh; min-height: 100svh; }

        /* Text overflow guard */
        .aur-hero-names  { word-break: break-word; overflow-wrap: break-word; }
        .aur-footer-names { word-break: break-word; overflow-wrap: break-word; }

        /* ─── 860px: swap navbar ────────────────────────────────────── */
        @media (max-width: 860px) {
          .aur-nav { padding: 0 20px !important; }
          .aur-hamburger {
            display: flex !important;
            align-items: center;
            justify-content: center;
            min-width: 44px;
            min-height: 44px;
            padding: 0 !important;
          }
          .aur-nav-desktop { display: none !important; }
        }

        /* ─── 900px: RSVP single-col ────────────────────────────────── */
        @media (max-width: 900px) {
          .aur-rsvp-cols {
            grid-template-columns: 1fr !important;
            gap: 0 !important;
            padding: 72px 24px !important;
          }
          .aur-rsvp-left { display: none !important; }
        }

        /* ─── 768px: tablet ─────────────────────────────────────────── */
        @media (max-width: 768px) {
          /* Hero */
          .aur-hero-content-panel {
            padding-left: 24px !important;
            padding-right: 24px !important;
            padding-bottom: 80px !important;
          }
          .aur-countdown-card {
            bottom: 16px !important;
            right: 12px !important;
            padding: 14px 16px !important;
            border-radius: 14px !important;
          }
          .aur-countdown-unit { min-width: 48px !important; padding: 0 8px !important; }

          /* Story */
          .aur-story-panel {
            margin-left: 20px !important;
            margin-right: 20px !important;
            margin-top: 64px !important;
            margin-bottom: 64px !important;
            max-width: calc(100% - 40px) !important;
            padding: 38px 30px 34px !important;
          }

          /* Details: 2-col on tablet */
          .aur-details-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 16px !important;
          }
          .aur-details-sect { padding: 80px 24px 72px !important; }

          /* Venue */
          .aur-venue-feats { grid-template-columns: 1fr !important; }
          .aur-venue-panel-inner {
            padding: 36px 28px !important;
            border-radius: 16px !important;
            width: calc(100% - 40px) !important;
            margin: 40px 20px !important;
          }

          /* Roadmap: on mobile we show the dedicated mobile roadmap block */
          .aur-ms-desktop { display: none !important; }
          .aur-ms-mobile  { display: block !important; }

          /* RSVP form */
          .aur-rsvp-name-row   { grid-template-columns: 1fr !important; gap: 12px !important; }
          .aur-rsvp-attend-row { grid-template-columns: 1fr !important; gap: 10px !important; }

          /* Footer */
          .aur-footer { padding: 64px 24px 40px !important; }

          /* Mobile gallery — coverflow */
          .aur-gal-desktop { display: none !important; }
          .aur-gal-mobile  { display: block !important; }
        }

        /* ─── 520px: small phones ───────────────────────────────────── */
        @media (max-width: 520px) {
          .aur-hero-names { font-size: clamp(2.8rem, 10.5vw, 4.2rem) !important; }
          .aur-hero-content-panel {
            padding-left: 20px !important;
            padding-right: 20px !important;
            padding-bottom: 72px !important;
          }
          .aur-countdown-card {
            bottom: 12px !important;
            right: 8px !important;
            padding: 12px 14px !important;
          }
          .aur-countdown-unit { min-width: 40px !important; padding: 0 6px !important; }

          /* Story */
          .aur-story-panel { padding: 28px 22px 26px !important; }

          /* Details: 1-col */
          .aur-details-grid { grid-template-columns: 1fr !important; }
          .aur-details-sect { padding: 64px 20px 56px !important; }

          /* Venue */
          .aur-venue-panel-inner {
            padding: 28px 20px !important;
            width: calc(100% - 32px) !important;
            margin: 28px 16px !important;
          }
          .aur-venue-cta {
            width: 100% !important;
            justify-content: center !important;
            display: flex !important;
            padding: 15px 20px !important;
          }

          /* RSVP form */
          .aur-rsvp-form-panel { padding: 30px 24px !important; }

          /* Footer */
          .aur-footer { padding: 52px 20px 36px !important; }
        }

        /* ─── 390px: modern iPhones ─────────────────────────────────── */
        @media (max-width: 390px) {
          .aur-hero-names { font-size: clamp(2.4rem, 9.5vw, 3.4rem) !important; }
          .aur-countdown-unit { min-width: 36px !important; padding: 0 5px !important; }
          .aur-details-grid { grid-template-columns: 1fr !important; }
          .aur-gallery-stage { height: 340px !important; }
          .aur-gal-item.aur-gal-center {
            width: calc(100vw - 40px) !important;
            height: 320px !important;
          }
          .aur-rsvp-form-panel { padding: 24px 20px !important; }
          .aur-footer-names { font-size: clamp(1.7rem, 8.5vw, 2.4rem) !important; }
        }

        /* ─── 340px: very small phones ──────────────────────────────── */
        @media (max-width: 340px) {
          .aur-hero-names { font-size: clamp(2rem, 9vw, 2.8rem) !important; }
          .aur-countdown-card { display: none !important; }
          .aur-gallery-stage { height: 280px !important; }
          .aur-footer-names { font-size: clamp(1.5rem, 8vw, 2rem) !important; }
        }

        /* ─── Reduced motion ────────────────────────────────────────── */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation: none !important; transition: none !important; }
        }

        /* ─── Builder device preview — tablet (mirrors ≤768px) ─────── */
        .aur-builder-tablet .aur-nav { padding: 0 20px !important; }
        .aur-builder-tablet .aur-hamburger { display: flex !important; align-items: center; justify-content: center; min-width: 44px; min-height: 44px; padding: 0 !important; }
        .aur-builder-tablet .aur-nav-desktop { display: none !important; }
        .aur-builder-tablet .aur-rsvp-cols { grid-template-columns: 1fr !important; gap: 0 !important; padding: 72px 24px !important; }
        .aur-builder-tablet .aur-rsvp-left { display: none !important; }
        .aur-builder-tablet .aur-hero-content-panel { padding-left: 24px !important; padding-right: 24px !important; padding-bottom: 80px !important; }
        .aur-builder-tablet .aur-countdown-card { bottom: 16px !important; right: 12px !important; padding: 14px 16px !important; border-radius: 14px !important; }
        .aur-builder-tablet .aur-countdown-unit { min-width: 48px !important; padding: 0 8px !important; }
        .aur-builder-tablet .aur-story-panel { margin-left: 20px !important; margin-right: 20px !important; margin-top: 64px !important; margin-bottom: 64px !important; max-width: calc(100% - 40px) !important; padding: 38px 30px 34px !important; }
        .aur-builder-tablet .aur-details-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 16px !important; }
        .aur-builder-tablet .aur-details-sect { padding: 80px 24px 72px !important; }
        .aur-builder-tablet .aur-venue-feats { grid-template-columns: 1fr !important; }
        .aur-builder-tablet .aur-venue-panel-inner { padding: 36px 28px !important; border-radius: 16px !important; width: calc(100% - 40px) !important; margin: 40px 20px !important; }
        .aur-builder-tablet .aur-ms-desktop { display: none !important; }
        .aur-builder-tablet .aur-ms-mobile  { display: block !important; }
        .aur-builder-tablet .aur-rsvp-name-row   { grid-template-columns: 1fr !important; gap: 12px !important; }
        .aur-builder-tablet .aur-rsvp-attend-row { grid-template-columns: 1fr !important; gap: 10px !important; }
        .aur-builder-tablet .aur-footer { padding: 64px 24px 40px !important; }
        .aur-builder-tablet .aur-gal-desktop { display: none !important; }
        .aur-builder-tablet .aur-gal-mobile  { display: block !important; }

        /* ─── Builder device preview — mobile (mirrors ≤520px + ≤390px) */
        .aur-builder-mobile .aur-hero-names { font-size: clamp(2.4rem, 9.5vw, 3.4rem) !important; word-break: break-word !important; overflow-wrap: break-word !important; }
        .aur-builder-mobile .aur-hero-content-panel { padding-left: 20px !important; padding-right: 20px !important; padding-bottom: 72px !important; }
        .aur-builder-mobile .aur-countdown-card { bottom: 12px !important; right: 8px !important; padding: 12px 14px !important; }
        .aur-builder-mobile .aur-countdown-unit { min-width: 36px !important; padding: 0 5px !important; }
        .aur-builder-mobile .aur-story-panel { padding: 28px 22px 26px !important; }
        .aur-builder-mobile .aur-details-grid { grid-template-columns: 1fr !important; gap: 14px !important; }
        .aur-builder-mobile .aur-details-sect { padding: 64px 20px 56px !important; }
        .aur-builder-mobile .aur-venue-panel-inner { padding: 28px 20px !important; width: calc(100% - 32px) !important; margin: 28px 16px !important; }
        .aur-builder-mobile .aur-venue-cta { width: 100% !important; justify-content: center !important; display: flex !important; padding: 15px 20px !important; }
        .aur-builder-mobile .aur-rsvp-form-panel { padding: 24px 20px !important; }
        .aur-builder-mobile .aur-gallery-stage { height: 340px !important; }
        .aur-builder-mobile .aur-gal-item.aur-gal-center { width: calc(100% - 40px) !important; height: 320px !important; }
        .aur-builder-mobile .aur-footer { padding: 52px 20px 36px !important; }
        .aur-builder-mobile .aur-footer-names { font-size: clamp(1.7rem, 8.5vw, 2.4rem) !important; }
      `}</style>

      {/* ══════════════════ NAVBAR ══════════════════ */}
      <nav
        data-v2-section="aur-nav"
        className="aur-nav"
        style={{
          position: builderMode ? "sticky" : "fixed",
          top: 0, left: 0, right: 0,
          zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 44px", height: "64px",
          background: scrolled ? "rgba(6,14,10,0.94)" : "transparent",
          backdropFilter: scrolled ? "blur(18px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(18px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(215,183,119,0.16)" : "none",
          transition: "background 0.35s ease, border-bottom 0.35s ease",
        }}
      >
        {/* Brand AURELIA with leaf mark */}
        <div
          data-v2-element="aur-nav-brand"
          data-v2-type="text"
          style={{ display: "flex", alignItems: "center", gap: "7px" }}
        >
          <svg width="13" height="15" viewBox="0 0 13 15" fill="none">
            <path d="M6.5 1 C4.5 3.5 2.5 5.5 2.5 7.5 C2.5 10 4.2 12 6.5 12 C8.8 12 10.5 10 10.5 7.5 C10.5 5.5 8.5 3.5 6.5 1Z" stroke={C.gold} strokeWidth="0.85" fill="none"/>
            <line x1="6.5" y1="12" x2="6.5" y2="14.5" stroke={C.gold} strokeWidth="0.85"/>
          </svg>
          <span style={{ fontFamily: SERIF, fontSize: "0.82rem", fontWeight: 400, letterSpacing: "0.26em", textTransform: "uppercase", color: C.goldSoft }}>
            AURELIA
          </span>
        </div>

        {/* Desktop nav */}
        <div className="aur-nav-desktop" style={{ display: "flex", gap: "28px", alignItems: "center" }}>
          {NAV_LINKS.map(link => (
            <a
              key={link.href}
              href={link.href}
              className="aur-nav-link"
              onClick={e => { e.preventDefault(); handleNavLink(link.href); }}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="aur-hamburger"
          style={{ display: "none", background: "transparent", border: "1px solid rgba(215,183,119,0.45)", cursor: "pointer", padding: "7px 10px", color: C.goldSoft, borderRadius: "4px" }}
          aria-label="Open menu"
        >
          <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
            <line x1="0" y1="1"  x2="20" y2="1"  stroke="currentColor" strokeWidth="1.5"/>
            <line x1="0" y1="7"  x2="20" y2="7"  stroke="currentColor" strokeWidth="1.5"/>
            <line x1="0" y1="13" x2="20" y2="13" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        </button>
      </nav>

      {/* Mobile full-screen menu */}
      {mobileMenuOpen && (
        <div
          className="aur-mobile-menu"
          style={{ position: "fixed", inset: 0, zIndex: 1999, background: C.bgDark, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "32px", paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <button
            onClick={() => setMobileMenuOpen(false)}
            style={{ position: "absolute", top: "16px", right: "20px", background: "transparent", border: "1px solid rgba(215,183,119,0.28)", borderRadius: "50%", color: C.textMuted, cursor: "pointer", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}
            aria-label="Close menu"
          >&#10005;</button>
          {NAV_LINKS.map(link => (
            <a
              key={link.href}
              href={link.href}
              onClick={e => { e.preventDefault(); handleNavLink(link.href); }}
              style={{ fontFamily: SERIF, fontSize: "clamp(1.8rem, 6vw, 2.4rem)", fontWeight: 300, color: C.textLight, textDecoration: "none", letterSpacing: "0.04em", padding: "6px 0", minHeight: "44px", display: "flex", alignItems: "center" }}
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
          className="aur-hero-sect"
          style={{ position: "relative", display: "flex", flexDirection: "column", overflow: "hidden" }}
        >
          {/* Parallax background */}
          <div
            ref={heroParallax.ref}
            style={{
              position: "absolute", inset: "-15% 0",
              backgroundImage: `url(${heroImage})`,
              backgroundSize: "cover", backgroundPosition: "center",
              transform: `translateY(${heroParallax.offset}px)`,
              zIndex: 0,
              animation: "aur-hero-scale 2s cubic-bezier(0.25,0.46,0.45,0.94) both",
              willChange: "transform",
            }}
          />
          {/* Spec dual overlay */}
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 42% 50%, rgba(0,0,0,0.10), rgba(0,0,0,0.68))", zIndex: 1 }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(0,0,0,0.62), rgba(0,0,0,0.18), rgba(0,0,0,0.55))", zIndex: 1 }} />

          {/* Content — visually weighted left */}
          <div
            className="aur-hero-content-panel"
            style={{
              position: "relative", zIndex: 2,
              padding: "clamp(88px, 14vh, 160px) clamp(24px, 8vw, 96px) 80px",
              maxWidth: "860px",
              flex: "1",
              display: "flex", flexDirection: "column", justifyContent: "flex-end",
              animation: "aur-hero-content 1.4s 0.3s cubic-bezier(0.25,0.46,0.45,0.94) both",
            }}
          >
            <p
              data-v2-element="aur-hero-intro"
              data-v2-type="text"
              style={{ fontFamily: SANS, fontSize: "0.57rem", fontWeight: 500, letterSpacing: "0.34em", textTransform: "uppercase", color: C.gold, marginBottom: "22px", opacity: 0.92 }}
            >
              {heroInvitationLine}
            </p>

            <h1
              className="aur-hero-names"
              data-v2-element="aur-hero-names"
              data-v2-type="text"
              style={{
                fontFamily: SERIF,
                fontSize: "clamp(4rem, 8vw, 8.8rem)",
                fontWeight: 300,
                letterSpacing: "0.08em",
                color: C.goldSoft,
                lineHeight: 1.0,
                margin: 0,
                textShadow: "0 20px 60px rgba(0,0,0,0.55)",
              }}
            >
              {groomName}
              <span style={{ fontStyle: "italic", color: C.gold, margin: "0 0.2em" }}>{separator}</span>
              {brideName}
            </h1>

            {/* Decorative divider */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px", margin: "28px 0 22px" }}>
              <div style={{ width: "50px", height: "1px", background: "rgba(215,183,119,0.50)" }} />
              <svg width="7" height="7" viewBox="0 0 7 7"><path d="M3.5 0L7 3.5L3.5 7L0 3.5Z" fill={C.gold} fillOpacity="0.82"/></svg>
              <div style={{ width: "50px", height: "1px", background: "rgba(215,183,119,0.50)" }} />
            </div>

            <p
              data-v2-element="aur-hero-date"
              data-v2-type="text"
              style={{ fontFamily: SERIF, fontSize: "clamp(1.1rem, 2vw, 1.55rem)", fontWeight: 300, fontStyle: "italic", color: C.ivoryMuted, letterSpacing: "0.07em", marginBottom: "7px" }}
            >
              {displayDate}
            </p>
            <p
              data-v2-element="aur-hero-location"
              data-v2-type="text"
              style={{ fontFamily: SANS, fontSize: "0.56rem", fontWeight: 400, letterSpacing: "0.24em", textTransform: "uppercase", color: C.textLight, opacity: 0.52, marginBottom: "44px" }}
            >
              {heroLocation}
            </p>

            {/* CTA */}
            <a
              href="#aur-rsvp"
              onClick={e => { e.preventDefault(); handleNavLink("#aur-rsvp"); }}
              data-v2-element="aur-hero-cta"
              data-v2-type="text"
              style={{
                display: "inline-flex", alignItems: "center", gap: "12px",
                alignSelf: "flex-start",
                fontFamily: SANS, fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase",
                color: C.bgDark,
                background: `linear-gradient(135deg, ${C.goldSoft} 0%, ${C.gold} 100%)`,
                padding: "14px 34px",
                textDecoration: "none",
              }}
            >
              {heroCta}
              <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M0 5H12M9 1L13 5L9 9" stroke="currentColor" strokeWidth="1.5"/></svg>
            </a>
          </div>

          {/* Countdown glass card — bottom-right */}
          {cfg.sections?.countdown?.enabled !== false && (
            <div
              className="aur-countdown-card"
              data-v2-element="aur-hero-countdown"
              style={{
                position: "absolute", bottom: "40px", right: "40px",
                zIndex: 3,
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
                background: "rgba(10,16,13,0.58)",
                border: "1px solid rgba(215,183,119,0.62)",
                borderRadius: "18px",
                boxShadow: "0 26px 70px rgba(0,0,0,0.55)",
                padding: "20px 26px",
                animation: "aur-countdown-slide 1.4s 0.9s cubic-bezier(0.25,0.46,0.45,0.94) both",
              }}
            >
              <p style={{ fontFamily: SANS, fontSize: "0.50rem", letterSpacing: "0.26em", textTransform: "uppercase", color: C.gold, textAlign: "center", marginBottom: "14px", opacity: 0.88 }}>
                {cfg.countdown.subtitle}
              </p>
              <div style={{ display: "flex", gap: 0 }}>
                {[
                  { value: countdown.days,    label: cfg.countdown.labels.days    },
                  { value: countdown.hours,   label: cfg.countdown.labels.hours   },
                  { value: countdown.minutes, label: cfg.countdown.labels.minutes },
                  { value: countdown.seconds, label: cfg.countdown.labels.seconds },
                ].map(({ value, label }, idx) => (
                  <div key={label} className="aur-countdown-unit" style={{ textAlign: "center", minWidth: "60px", padding: "0 10px", borderRight: idx < 3 ? "1px solid rgba(215,183,119,0.18)" : "none" }}>
                    <div style={{ fontFamily: SERIF, fontSize: "clamp(1.5rem, 2.4vw, 2.1rem)", fontWeight: 300, color: C.goldSoft, lineHeight: 1 }}>
                      {String(value).padStart(2, "0")}
                    </div>
                    <div style={{ fontFamily: SANS, fontSize: "0.42rem", letterSpacing: "0.18em", color: C.textMuted, marginTop: "5px", textTransform: "uppercase" }}>
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scroll indicator */}
          <div
            style={{
              position: "absolute", bottom: "32px", left: "50%",
              zIndex: 2,
              display: "flex", flexDirection: "column", alignItems: "center", gap: "7px",
              opacity: 0.40,
              animation: "aur-scroll-bob 2.8s ease-in-out infinite",
            }}
          >
            <span style={{ fontFamily: SANS, fontSize: "0.43rem", letterSpacing: "0.28em", textTransform: "uppercase", color: C.textLight }}>Scroll</span>
            <svg width="12" height="22" viewBox="0 0 12 22" fill="none">
              <line x1="6" y1="0" x2="6" y2="17" stroke={C.gold} strokeWidth="1"/>
              <path d="M1 12 L6 18 L11 12" stroke={C.gold} strokeWidth="1" fill="none"/>
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
          className="aur-story-sect"
          style={{ position: "relative", display: "flex", alignItems: "center", overflow: "hidden", ...storyAnim.style }}
        >
          {/* Full-section background image with parallax */}
          <div
            ref={storyParallax.ref}
            style={{
              position: "absolute", inset: "-15% 0",
              backgroundImage: `url(${storyImage || "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1400&q=80&auto=format&fit=crop"})`,
              backgroundSize: "cover", backgroundPosition: "center",
              transform: `translateY(${storyParallax.offset}px)`,
              zIndex: 0, willChange: "transform",
            }}
          />
          {/* Left-weighted dark overlay */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(100deg, rgba(6,10,9,0.85) 0%, rgba(6,10,9,0.58) 52%, rgba(6,10,9,0.18) 100%)", zIndex: 1 }} />

          {/* Glass panel — floats LEFT */}
          <div
            className="aur-story-panel"
            data-v2-element="aur-story-panel"
            style={{
              position: "relative", zIndex: 2,
              marginLeft: "clamp(24px, 8vw, 110px)",
              marginTop: "80px", marginBottom: "80px",
              maxWidth: "490px", width: "100%",
              background: "rgba(8,18,14,0.74)",
              backdropFilter: "blur(22px)",
              WebkitBackdropFilter: "blur(22px)",
              border: "1px solid rgba(215,183,119,0.38)",
              borderRadius: "16px",
              boxShadow: "0 32px 80px rgba(0,0,0,0.55)",
              padding: "52px 44px 48px",
            }}
          >
            <p style={{ fontFamily: SANS, fontSize: "0.57rem", fontWeight: 500, letterSpacing: "0.32em", textTransform: "uppercase", color: C.gold, marginBottom: "16px", opacity: 0.92 }}>
              {storySmallTitle}
            </p>
            <div style={{ width: "32px", height: "1px", background: C.gold, marginBottom: "24px", opacity: 0.48 }} />
            <h2
              data-v2-element="aur-story-heading"
              data-v2-type="text"
              style={{ fontFamily: SERIF, fontSize: "clamp(2rem, 3.5vw, 3.2rem)", fontWeight: 300, lineHeight: 1.12, color: C.textLight, marginBottom: "22px" }}
            >
              {storyHeading}
            </h2>
            <p
              data-v2-element="aur-story-body"
              data-v2-type="textarea"
              style={{ fontFamily: SANS, fontSize: "0.9rem", fontWeight: 300, lineHeight: 1.88, color: C.textMuted, marginBottom: "32px" }}
            >
              {storyBody}
            </p>
            {storyCtaLabel && (
              <div
                data-v2-element="aur-story-cta"
                data-v2-type="text"
                style={{ display: "inline-flex", alignItems: "center", gap: "10px", fontFamily: SANS, fontSize: "0.60rem", fontWeight: 500, letterSpacing: "0.20em", textTransform: "uppercase", color: C.gold, paddingBottom: "3px", borderBottom: "1px solid rgba(215,183,119,0.42)", cursor: "default" }}
              >
                {storyCtaLabel}
                <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M0 5H12M9 1L13 5L9 9" stroke="currentColor" strokeWidth="1.2"/></svg>
              </div>
            )}
            {/* Pagination 01 — 02 — 03 */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "40px", opacity: 0.42 }}>
              {["01", "02", "03"].map((n, i) => (
                <React.Fragment key={n}>
                  <span style={{ fontFamily: SANS, fontSize: "0.52rem", letterSpacing: "0.14em", color: i === 0 ? C.gold : C.textMuted }}>{n}</span>
                  {i < 2 && <div style={{ width: "18px", height: "1px", background: "rgba(215,183,119,0.38)" }} />}
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════ WEDDING ROUTE / ROADMAP ══════════════════ */}
      {showRoadmap && (
        <section
          id="aur-roadmap"
          data-v2-section="aur-roadmap"
          ref={roadmapAnim.ref as React.RefObject<HTMLElement>}
          style={{ position: "relative", minHeight: "140vh", overflow: "hidden", padding: "120px 24px 100px", ...roadmapAnim.style }}
        >
          {/* Aerial/lakeside background */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${roadmapBgImage || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80&auto=format&fit=crop"})`, backgroundSize: "cover", backgroundPosition: "center", zIndex: 0 }} />
          <div style={{ position: "absolute", inset: 0, background: "rgba(4,8,8,0.74)", zIndex: 1 }} />

          {/* Section header */}
          <div style={{ position: "relative", zIndex: 2, textAlign: "center", marginBottom: "88px" }}>
            <p style={{ fontFamily: SANS, fontSize: "0.57rem", letterSpacing: "0.30em", textTransform: "uppercase", color: C.gold, marginBottom: "16px", opacity: 0.85 }}>
              {roadmapSmallTitle}
            </p>
            <h2
              data-v2-element="aur-roadmap-heading"
              data-v2-type="text"
              style={{ fontFamily: SERIF, fontSize: "clamp(2.2rem, 4.5vw, 3.8rem)", fontWeight: 300, color: C.textLight, letterSpacing: "0.02em", margin: "0 0 18px" }}
            >
              {roadmapHeading}
            </h2>
            <p style={{ fontFamily: SANS, fontSize: "0.88rem", fontWeight: 300, color: C.textMuted, maxWidth: "480px", margin: "0 auto", lineHeight: 1.8 }}>
              {roadmapSubtitle}
            </p>
            <p style={{ fontFamily: SANS, fontSize: "0.48rem", letterSpacing: "0.28em", textTransform: "uppercase", color: C.textMuted, opacity: 0.55, marginTop: "16px" }}>
              {routeInstruction}
            </p>
          </div>

          {/* Roadmap body */}
          <div ref={roadmapRef as React.RefObject<HTMLDivElement>} style={{ position: "relative", maxWidth: "860px", margin: "0 auto", zIndex: 2 }}>

            {/* ── DESKTOP roadmap (hidden on mobile) ── */}
            <div className="aur-ms-desktop">
            {/* SVG curved route — centred */}
            <div
              className="aur-ms-rail"
              style={{ position: "absolute", left: "50%", top: 0, bottom: 0, transform: "translateX(-50%)", width: "300px", zIndex: 1, pointerEvents: "none" }}
            >
              <svg viewBox="0 0 300 1200" preserveAspectRatio="none" style={{ width: "100%", height: "100%", overflow: "visible" }}>
                {/* Ghost base */}
                <path
                  d="M150 0 C80 180 220 300 150 460 C80 640 220 780 150 1200"
                  stroke="rgba(215,183,119,0.14)"
                  strokeWidth="3"
                  fill="none"
                />
                {/* Animated progress fill */}
                <path
                  ref={routePathRef}
                  d="M150 0 C80 180 220 300 150 460 C80 640 220 780 150 1200"
                  stroke={C.gold}
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={pathLength > 0 ? pathLength : 1600}
                  strokeDashoffset={(pathLength > 0 ? pathLength : 1600) * (1 - progress)}
                  style={{ filter: "drop-shadow(0 0 7px rgba(215,183,119,0.62))", transition: "stroke-dashoffset 0.12s linear" }}
                />
                {/* Wedding car marker */}
                {carPt && (
                  <WeddingCarMapMarker
                    x={carPt.x}
                    y={carPt.y}
                    size={52}
                    strokeColor={C.gold}
                    fillColor="#F7F0E3"
                    accentColor={C.goldSoft}
                    strokeWidth={1.3}
                    showFloral={true}
                    showHeart={true}
                    glowStrength={0.65}
                    animation="float"
                  />
                )}
              </svg>
            </div>

            {/* Milestone cards */}
            <div ref={msDesktopRef} className="aur-ms-cards-container">
              {milestones.map((m, i) => (
                <div
                  key={String((m as Record<string, unknown>).id ?? i)}
                  data-aur-ms={i}
                  className={`${i % 2 === 0 ? "aur-ms-left" : "aur-ms-right"} aur-ms-card`}
                  style={{
                    position: "relative",
                    marginBottom: "72px",
                    opacity: milestoneVisible[i] ? 1 : 0,
                    transform: milestoneVisible[i] ? "none" : `translateX(${i % 2 === 0 ? "-32px" : "32px"})`,
                    transition: "opacity 0.65s ease, transform 0.65s ease",
                    zIndex: 2,
                    maxWidth: "360px",
                    ...(i % 2 === 0 ? { marginLeft: "auto" } : {}),
                  }}
                >
                  <div style={{ background: "rgba(8,18,14,0.80)", border: "1px solid rgba(215,183,119,0.22)", borderRadius: "10px", overflow: "hidden", backdropFilter: "blur(12px)", boxShadow: "0 12px 48px rgba(0,0,0,0.45)" }}>
                    {(() => {
                      const msImg = (m as Record<string, unknown>).image as string || MILESTONE_FALLBACKS[i % MILESTONE_FALLBACKS.length];
                      return (
                        <div style={{ height: "140px", overflow: "hidden", position: "relative" }}>
                          <img
                            src={msImg}
                            alt={m.title}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={(e) => { (e.target as HTMLImageElement).src = MILESTONE_FALLBACKS[i % MILESTONE_FALLBACKS.length]; }}
                          />
                          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(8,18,14,0.82))" }} />
                        </div>
                      );
                    })()}
                    <div style={{ padding: "22px 24px 24px" }}>
                      {showStopNumbers && (
                        <div style={{ fontFamily: SERIF, fontSize: "0.60rem", fontWeight: 400, letterSpacing: "0.20em", color: C.gold, marginBottom: "4px", opacity: 0.55 }}>
                          {String(i + 1).padStart(2, "0")}
                        </div>
                      )}
                      <div style={{ fontFamily: SERIF, fontSize: "0.70rem", fontWeight: 400, letterSpacing: "0.18em", color: C.gold, marginBottom: "7px", opacity: 0.85 }}>
                        {m.time}
                      </div>
                      <h3 style={{ fontFamily: SERIF, fontSize: "1.35rem", fontWeight: 400, color: C.textLight, margin: "0 0 9px", lineHeight: 1.22 }}>
                        {m.title}
                      </h3>
                      {m.description && (
                        <p style={{ fontFamily: SANS, fontSize: "0.82rem", fontWeight: 300, color: C.textMuted, lineHeight: 1.68, margin: "0 0 10px" }}>
                          {m.description}
                        </p>
                      )}
                      {(() => {
                        const stopAddress  = (m as Record<string, unknown>).address as string | undefined;
                        const stopMapUrl   = (m as Record<string, unknown>).mapUrl as string | undefined;
                        const stopBtnTxt   = (m as Record<string, unknown>).buttonText as string | undefined ?? "Open in Maps";
                        const placeholder  = "Add address here";
                        const addrClean    = stopAddress?.trim() && stopAddress !== placeholder ? stopAddress.trim() : null;
                        const mapHref      = stopMapUrl ? stopMapUrl : addrClean ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addrClean)}` : null;
                        return (
                          <>
                            {addrClean && (
                              <div style={{ display: "flex", alignItems: "flex-start", gap: "5px", marginBottom: mapHref ? "10px" : 0 }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "1px" }}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                                <span style={{ fontFamily: SANS, fontSize: "0.72rem", color: C.textMuted, lineHeight: 1.5 }}>{addrClean}</span>
                              </div>
                            )}
                            {mapHref && (
                              <a href={mapHref} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontFamily: SANS, fontSize: "0.58rem", letterSpacing: "0.16em", textTransform: "uppercase", color: C.gold, textDecoration: "none", borderBottom: "1px solid rgba(215,183,119,0.35)", paddingBottom: "2px", transition: "border-color 0.2s", marginTop: "2px" }}>
                                {stopBtnTxt}
                                <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke={C.gold} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 1h6v6M11 1L1 11"/></svg>
                              </a>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  {/* Timeline dot — activates as car reaches this stop */}
                  {(() => {
                    const dotActive = progress >= stopProgressPositions[i] - 0.04;
                    return (
                      <div
                        className="aur-ms-dot"
                        style={{
                          position: "absolute", top: "24px",
                          ...(i % 2 === 0 ? { right: "-48px" } : { left: "-48px" }),
                          width: dotActive ? "12px" : "9px",
                          height: dotActive ? "12px" : "9px",
                          borderRadius: "50%",
                          background: dotActive ? C.gold : "rgba(215,183,119,0.28)",
                          border: `2.5px solid ${C.bgDark}`,
                          zIndex: 4,
                          boxShadow: dotActive ? "0 0 16px rgba(215,183,119,0.78)" : "none",
                          transition: "all 0.4s ease",
                        }}
                      />
                    );
                  })()}
                </div>
              ))}
            </div>

            {cfg.timeline.afterMessage?.thankYou && (
              <div style={{ textAlign: "center", paddingTop: "52px", borderTop: "1px solid rgba(215,183,119,0.14)", marginTop: "12px" }}>
                <p style={{ fontFamily: SERIF, fontSize: "1.15rem", fontWeight: 300, fontStyle: "italic", color: C.gold, opacity: 0.68 }}>
                  {cfg.timeline.afterMessage.thankYou}
                </p>
              </div>
            )}
            </div>{/* end aur-ms-desktop */}

            {/* ── MOBILE roadmap (shown on mobile only) ── */}
            <div className="aur-ms-mobile" ref={mobileRoadmapRef as React.RefObject<HTMLDivElement>}>
              {/* Vertical animated SVG path + car on left, cards on right */}
              <div ref={msMobileContainerRef} style={{ position: "relative", paddingLeft: "72px" }}>
                {/* SVG rail strip — absolutely positioned on the left */}
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "60px", zIndex: 1, pointerEvents: "none" }}>
                  <svg viewBox="0 0 60 1400" preserveAspectRatio="none" style={{ width: "60px", height: "100%", minHeight: `${milestones.length * 200}px`, overflow: "visible" }}>
                    {/* ghost base — soft S-curve */}
                    <path
                      d="M30 0 C60 300 0 500 30 700 C60 900 0 1100 30 1400"
                      stroke="rgba(215,183,119,0.14)"
                      strokeWidth="2"
                      fill="none"
                    />
                    {/* animated progress fill */}
                    <path
                      ref={mobileRoutePathRef}
                      d="M30 0 C60 300 0 500 30 700 C60 900 0 1100 30 1400"
                      stroke={C.gold}
                      strokeWidth="2"
                      fill="none"
                      strokeDasharray={mobilePathLength}
                      strokeDashoffset={mobilePathLength * (1 - mobileProgress)}
                      style={{ filter: "drop-shadow(0 0 5px rgba(215,183,119,0.58))", transition: "stroke-dashoffset 0.1s linear" }}
                    />
                  </svg>
                  {/* Car rendered as HTML element — avoids foreignObject+preserveAspectRatio distortion */}
                  <div style={{ position: "absolute", left: mobileCarPos.x - 19, top: mobileCarPos.y - 19, width: 38, height: 38, zIndex: 5, pointerEvents: "none" }}>
                    <WeddingCarRoadmapIcon
                      size={38}
                      strokeColor={C.gold}
                      fillColor="#F7F0E3"
                      accentColor={C.goldSoft}
                      strokeWidth={1.2}
                      showFloral={true}
                      showHeart={true}
                      glowStrength={0.6}
                      animation="float"
                    />
                  </div>
                </div>

                {/* Milestone cards stacked vertically */}
                <div ref={msMobileRef}>
                  {milestones.map((m, i) => (
                    <div
                      key={`mob-ms-${String((m as Record<string, unknown>).id ?? i)}`}
                      data-aur-ms={i}
                      style={{
                        position: "relative",
                        marginBottom: "28px",
                        opacity: milestoneVisible[i] ? 1 : 0,
                        transform: milestoneVisible[i] ? "none" : "translateX(20px)",
                        transition: `opacity 0.6s ${i * 0.08}s ease, transform 0.6s ${i * 0.08}s ease`,
                      }}
                    >
                      {/* connector dot — activates as car reaches this stop */}
                      {(() => {
                        const dotActive = mobileProgress >= stopProgressPositions[i] - 0.04;
                        return (
                          <div style={{
                            position: "absolute",
                            left: "-40px", top: "22px",
                            width: dotActive ? "11px" : "8px",
                            height: dotActive ? "11px" : "8px",
                            borderRadius: "50%",
                            background: dotActive ? C.gold : "rgba(215,183,119,0.28)",
                            border: `2px solid ${C.bgDark}`,
                            boxShadow: dotActive ? "0 0 12px rgba(215,183,119,0.75)" : "none",
                            zIndex: 4,
                            transition: "all 0.4s ease",
                          }} />
                        );
                      })()}
                      <div style={{ background: "rgba(8,18,14,0.82)", border: "1px solid rgba(215,183,119,0.20)", borderRadius: "10px", overflow: "hidden", backdropFilter: "blur(12px)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
                        {(() => {
                          const msImg = (m as Record<string, unknown>).image as string || MILESTONE_FALLBACKS[i % MILESTONE_FALLBACKS.length];
                          return (
                            <div style={{ height: "110px", overflow: "hidden", position: "relative" }}>
                              <img
                                src={msImg}
                                alt={m.title}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                onError={(e) => { (e.target as HTMLImageElement).src = MILESTONE_FALLBACKS[i % MILESTONE_FALLBACKS.length]; }}
                              />
                              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(8,18,14,0.80))" }} />
                            </div>
                          );
                        })()}
                        <div style={{ padding: "16px 18px 18px" }}>
                          {showStopNumbers && (
                            <div style={{ fontFamily: SERIF, fontSize: "0.55rem", letterSpacing: "0.20em", color: C.gold, marginBottom: "3px", opacity: 0.55 }}>
                              {String(i + 1).padStart(2, "0")}
                            </div>
                          )}
                          <div style={{ fontFamily: SERIF, fontSize: "0.64rem", letterSpacing: "0.18em", color: C.gold, marginBottom: "5px", opacity: 0.82 }}>
                            {m.time}
                          </div>
                          <h3 style={{ fontFamily: SERIF, fontSize: "1.18rem", fontWeight: 400, color: C.textLight, margin: "0 0 7px", lineHeight: 1.2 }}>
                            {m.title}
                          </h3>
                          {m.description && (
                            <p style={{ fontFamily: SANS, fontSize: "0.78rem", fontWeight: 300, color: C.textMuted, lineHeight: 1.65, margin: "0 0 8px" }}>
                              {m.description}
                            </p>
                          )}
                          {(() => {
                            const stopAddress  = (m as Record<string, unknown>).address as string | undefined;
                            const stopMapUrl   = (m as Record<string, unknown>).mapUrl as string | undefined;
                            const stopBtnTxt   = (m as Record<string, unknown>).buttonText as string | undefined ?? "Open in Maps";
                            const placeholder  = "Add address here";
                            const addrClean    = stopAddress?.trim() && stopAddress !== placeholder ? stopAddress.trim() : null;
                            const mapHref      = stopMapUrl ? stopMapUrl : addrClean ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addrClean)}` : null;
                            return (
                              <>
                                {addrClean && (
                                  <div style={{ display: "flex", alignItems: "flex-start", gap: "4px", marginBottom: mapHref ? "8px" : 0 }}>
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "1px" }}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                                    <span style={{ fontFamily: SANS, fontSize: "0.68rem", color: C.textMuted, lineHeight: 1.5 }}>{addrClean}</span>
                                  </div>
                                )}
                                {mapHref && (
                                  <a href={mapHref} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontFamily: SANS, fontSize: "0.55rem", letterSpacing: "0.14em", textTransform: "uppercase", color: C.gold, textDecoration: "none", borderBottom: "1px solid rgba(215,183,119,0.35)", paddingBottom: "2px" }}>
                                    {stopBtnTxt}
                                    <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke={C.gold} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 1h6v6M11 1L1 11"/></svg>
                                  </a>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {cfg.timeline.afterMessage?.thankYou && (
                <div style={{ textAlign: "center", paddingTop: "40px", borderTop: "1px solid rgba(215,183,119,0.14)", marginTop: "8px" }}>
                  <p style={{ fontFamily: SERIF, fontSize: "1rem", fontWeight: 300, fontStyle: "italic", color: C.gold, opacity: 0.68 }}>
                    {cfg.timeline.afterMessage.thankYou}
                  </p>
                </div>
              )}
            </div>{/* end aur-ms-mobile */}
          </div>
        </section>
      )}

      {/* ══════════════════ WEDDING DETAILS ══════════════════ */}
      {showDetails && (
        <section
          id="aur-details"
          data-v2-section="aur-details"
          ref={detailsAnim.ref as React.RefObject<HTMLElement>}
          className="aur-details-sect"
          style={{ background: C.ivory, padding: "110px 40px 100px", ...detailsAnim.style }}
        >
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "70px" }}>
              <p style={{ fontFamily: SANS, fontSize: "0.57rem", letterSpacing: "0.32em", textTransform: "uppercase", color: C.gold, marginBottom: "16px", opacity: 0.88 }}>
                {detailsSmallTitle}
              </p>
              <h2
                data-v2-element="aur-details-title"
                data-v2-type="text"
                style={{ fontFamily: SERIF, fontSize: "clamp(2.2rem, 4vw, 3.6rem)", fontWeight: 300, color: "#1a140e", letterSpacing: "0.04em", margin: "0 0 22px" }}
              >
                {detailsLabel}
              </h2>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
                <div style={{ width: "40px", height: "1px", background: "rgba(175,140,75,0.42)" }} />
                <svg width="7" height="7" viewBox="0 0 7 7"><path d="M3.5 0L7 3.5L3.5 7L0 3.5Z" fill={C.gold} fillOpacity="0.70"/></svg>
                <div style={{ width: "40px", height: "1px", background: "rgba(175,140,75,0.42)" }} />
              </div>
            </div>

            {/* 4-column cards */}
            <div className="aur-details-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
              {venues.slice(0, 4).map((venue, i) => (
                <div
                  key={(venue as Record<string, unknown>).id as string || i}
                  className="aur-detail-card"
                  data-v2-element={`aur-detail-card-${i}`}
                  style={{ background: "rgba(247,240,227,0.88)", border: "1px solid rgba(175,140,75,0.28)", borderRadius: "4px", padding: "40px 28px 36px", textAlign: "center", boxShadow: "0 4px 24px rgba(175,140,75,0.07), 0 1px 4px rgba(0,0,0,0.04)" }}
                >
                  <div style={{ marginBottom: "20px", display: "flex", justifyContent: "center" }}>
                    {detailIcon(venue, i)}
                  </div>
                  <div style={{ width: "26px", height: "1px", background: "rgba(175,140,75,0.32)", margin: "0 auto 18px" }} />
                  <p style={{ fontFamily: SANS, fontSize: "0.53rem", letterSpacing: "0.26em", textTransform: "uppercase", color: C.gold, marginBottom: "10px", opacity: 0.92 }}>
                    {venue.title}
                  </p>
                  <p style={{ fontFamily: SERIF, fontSize: "1.55rem", fontWeight: 400, color: "#1a140e", marginBottom: "10px", lineHeight: 1.2 }}>
                    {venue.name}
                  </p>
                  <p style={{ fontFamily: SANS, fontSize: "0.82rem", fontWeight: 300, color: "#6b5e4e", lineHeight: 1.72, whiteSpace: "pre-line", marginBottom: venue.mapButton ? "18px" : 0 }}>
                    {venue.description}
                  </p>
                  {venue.mapButton && venue.address && (
                    <a
                      href={`https://www.google.com/maps/search/${encodeURIComponent(venue.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "inline-block", fontFamily: SANS, fontSize: "0.54rem", letterSpacing: "0.18em", textTransform: "uppercase", color: C.gold, textDecoration: "none", borderBottom: "1px solid rgba(175,140,75,0.42)", paddingBottom: "2px" }}
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
          style={{ position: "relative", minHeight: "700px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", ...venueAnim.style }}
        >
          <div
            ref={venueParallax.ref}
            style={{
              position: "absolute", inset: "-15% 0",
              backgroundImage: `url(${venueImage || "https://images.unsplash.com/photo-1578774295889-02bc12c28e3a?w=1600&q=80&auto=format&fit=crop"})`,
              backgroundSize: "cover", backgroundPosition: "center",
              transform: `translateY(${venueParallax.offset}px)`,
              zIndex: 0, willChange: "transform",
            }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(4,8,8,0.28) 0%, rgba(4,8,8,0.40) 50%, rgba(4,8,8,0.55) 100%)", zIndex: 1 }} />

          {/* Centred glass panel */}
          <div
            data-v2-element="aur-venue-panel"
            className="aur-venue-panel-inner"
            style={{
              position: "relative", zIndex: 2,
              background: "rgba(8,18,14,0.74)",
              backdropFilter: "blur(22px)",
              WebkitBackdropFilter: "blur(22px)",
              border: "1px solid rgba(215,183,119,0.42)",
              borderRadius: "24px",
              boxShadow: "0 40px 100px rgba(0,0,0,0.55)",
              padding: "52px 56px",
              maxWidth: "760px", width: "calc(100% - 48px)",
              margin: "80px 24px",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <p style={{ fontFamily: SANS, fontSize: "0.57rem", letterSpacing: "0.30em", textTransform: "uppercase", color: C.gold, marginBottom: "14px", opacity: 0.90 }}>
                {venueSubtitle}
              </p>
              <h2
                data-v2-element="aur-venue-title"
                data-v2-type="text"
                style={{ fontFamily: SERIF, fontSize: "clamp(2.4rem, 4.5vw, 4rem)", fontWeight: 300, color: C.textLight, lineHeight: 1.05, marginBottom: "8px" }}
              >
                {venueTitle}
              </h2>
              <p
                data-v2-element="aur-venue-location"
                data-v2-type="text"
                style={{ fontFamily: SANS, fontSize: "0.60rem", letterSpacing: "0.18em", textTransform: "uppercase", color: C.gold, opacity: 0.72 }}
              >
                {venueLocation}
              </p>
            </div>
            <div style={{ width: "38px", height: "1px", background: "rgba(215,183,119,0.40)", margin: "0 auto 26px" }} />
            <p
              data-v2-element="aur-venue-desc"
              data-v2-type="textarea"
              style={{ fontFamily: SANS, fontSize: "0.88rem", fontWeight: 300, lineHeight: 1.92, color: C.textMuted, textAlign: "center", marginBottom: "36px" }}
            >
              {venueDescription}
            </p>

            {/* Two-column feature grid */}
            <div className="aur-venue-feats" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px" }}>
              {venueFeatures.map((feat, i) => (
                <div key={i} className="aur-venue-feat">
                  <div style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(215,183,119,0.26)", borderRadius: "50%", flexShrink: 0 }}>
                    {feat.icon}
                  </div>
                  <div>
                    <p style={{ fontFamily: SANS, fontSize: "0.50rem", letterSpacing: "0.22em", textTransform: "uppercase", color: C.gold, marginBottom: "3px", opacity: 0.78 }}>
                      {feat.label}
                    </p>
                    <p style={{ fontFamily: SERIF, fontSize: "1.12rem", fontWeight: 400, color: C.textLight, lineHeight: 1.28, margin: 0 }}>
                      {feat.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {venueCtaLabel && (
              <div style={{ textAlign: "center", marginTop: "36px" }}>
                <a
                  href={venueMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-v2-element="aur-venue-cta"
                  className="aur-venue-cta"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "10px",
                    fontFamily: SANS, fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.20em", textTransform: "uppercase",
                    color: C.bgDark,
                    background: `linear-gradient(135deg, ${C.goldSoft} 0%, ${C.gold} 100%)`,
                    padding: "13px 28px",
                    textDecoration: "none",
                    minHeight: "44px",
                  }}
                >
                  {venueCtaLabel}
                  <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M0 5H12M9 1L13 5L9 9" stroke="currentColor" strokeWidth="1.5"/></svg>
                </a>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ══════════════════ GALLERY ══════════════════ */}
      {showGallery && (
        <section
          id="aur-gallery"
          data-v2-section="aur-gallery"
          ref={galleryAnim.ref as React.RefObject<HTMLElement>}
          style={{ position: "relative", background: C.bgDark, padding: "110px 40px 100px", overflow: "hidden", ...galleryAnim.style }}
        >
          {/* Floral background tint */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${galleryBgImage || "https://images.unsplash.com/photo-1585007600263-71228e40c8d1?w=1400&q=50&auto=format&fit=crop"})`, backgroundSize: "cover", opacity: 0.05, zIndex: 0 }} />

          <div style={{ position: "relative", zIndex: 1, textAlign: "center", marginBottom: "68px" }}>
            <p style={{ fontFamily: SANS, fontSize: "0.57rem", letterSpacing: "0.30em", textTransform: "uppercase", color: C.gold, marginBottom: "16px", opacity: 0.82 }}>
              {gallerySmallLabel}
            </p>
            <h2
              data-v2-element="aur-gallery-title"
              data-v2-type="text"
              style={{ fontFamily: SERIF, fontSize: "clamp(2.2rem, 4vw, 3.6rem)", fontWeight: 300, color: C.textLight, margin: "0 0 18px", letterSpacing: "0.02em" }}
            >
              {galleryTitle}
            </h2>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", opacity: 0.48 }}>
              <div style={{ width: "36px", height: "1px", background: C.gold }} />
              <svg width="6" height="6" viewBox="0 0 6 6"><path d="M3 0L6 3L3 6L0 3Z" fill={C.gold}/></svg>
              <div style={{ width: "36px", height: "1px", background: C.gold }} />
            </div>
          </div>

          {/* Layered stacked gallery — DESKTOP */}
          <div className="aur-gal-desktop">
          <div className="aur-gallery-wrap" style={{ position: "relative", zIndex: 1, maxWidth: "900px", margin: "0 auto", padding: "0 80px" }}>
            <div className="aur-gallery-stage" style={{ position: "relative", height: "520px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {allGalleryImages.map((url: string, i: number) => {
                const total = allGalleryImages.length;
                const rawOffset = ((i - galleryIndex) % total + total) % total;
                const centeredOffset = rawOffset <= Math.floor(total / 2) ? rawOffset : rawOffset - total;
                let cls = "aur-gal-hidden";
                if (centeredOffset === 0)  cls = "aur-gal-center";
                else if (centeredOffset === -1) cls = "aur-gal-left";
                else if (centeredOffset ===  1) cls = "aur-gal-right";
                return (
                  <div
                    key={i}
                    className={`${cls} aur-gal-item`}
                    style={{ position: "absolute", width: "370px", height: "490px", borderRadius: "8px", overflow: "hidden", cursor: "pointer" }}
                    onClick={() => setGalleryIndex(i)}
                  >
                    <img src={url} alt={`Gallery ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" onError={(e) => { (e.target as HTMLImageElement).src = GALLERY_FALLBACK; }} />
                  </div>
                );
              })}
            </div>

            {/* Arrow controls — hidden if only 1 image */}
            {filteredGalleryImages.length !== 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "40px" }}>
              <button onClick={galleryPrev} className="aur-gal-arrow" aria-label="Previous image">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <p style={{ fontFamily: SANS, fontSize: "0.49rem", letterSpacing: "0.28em", textTransform: "uppercase", color: C.textMuted, opacity: 0.58 }}>
                {galleryHint}
              </p>
              <button onClick={galleryNext} className="aur-gal-arrow" aria-label="Next image">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
            )}

            {/* Dot indicators — hidden if only 1 image */}
            {filteredGalleryImages.length !== 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "20px" }}>
              {allGalleryImages.map((_: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setGalleryIndex(i)}
                  style={{ width: i === galleryIndex ? "20px" : "6px", height: "6px", borderRadius: "3px", background: i === galleryIndex ? C.gold : "rgba(215,183,119,0.26)", border: "none", cursor: "pointer", transition: "all 0.3s ease", padding: 0 }}
                  aria-label={`Go to image ${i + 1}`}
                />
              ))}
            </div>
            )}
          </div>
          </div>{/* end aur-gal-desktop */}

          {/* Premium mobile gallery — coverflow with swipe */}
          <div className="aur-gal-mobile" style={{ position: "relative", zIndex: 1, maxWidth: "100vw", overflow: "hidden" }}>
            {/* Coverflow track */}
            <div
              className="aur-mob-gal-track"
              style={{ height: "420px", width: "100%", overflow: "hidden" }}
              onTouchStart={mobileGal.onTouchStart}
              onTouchEnd={mobileGal.onTouchEnd}
            >
              {allGalleryImages.map((url: string, i: number) => {
                const total = allGalleryImages.length;
                const rawOffset = ((i - mobileGal.index) % total + total) % total;
                const centeredOffset = rawOffset <= Math.floor(total / 2) ? rawOffset : rawOffset - total;
                let stateClass = "state-hidden";
                if (centeredOffset === 0)       stateClass = "state-center";
                else if (centeredOffset === -1) stateClass = "state-left1";
                else if (centeredOffset ===  1) stateClass = "state-right1";
                else if (centeredOffset === -2) stateClass = "state-left2";
                else if (centeredOffset ===  2) stateClass = "state-right2";
                return (
                  <div
                    key={i}
                    className={`aur-mob-gal-card ${stateClass}`}
                    style={{ width: "min(280px, 75vw)", height: "360px" }}
                    onClick={() => { if (centeredOffset !== 0) mobileGal.goTo(i); }}
                  >
                    <img src={url} alt={`Gallery ${i + 1}`} loading="lazy" onError={(e) => { (e.target as HTMLImageElement).src = GALLERY_FALLBACK; }} />
                  </div>
                );
              })}
            </div>

            {/* Mobile dot indicators */}
            <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "24px" }}>
              {allGalleryImages.map((_: string, i: number) => (
                <button
                  key={i}
                  onClick={() => mobileGal.goTo(i)}
                  style={{ width: i === mobileGal.index ? "18px" : "6px", height: "6px", borderRadius: "3px", background: i === mobileGal.index ? C.gold : "rgba(215,183,119,0.28)", border: "none", cursor: "pointer", transition: "all 0.3s ease", padding: 0 }}
                  aria-label={`Go to image ${i + 1}`}
                />
              ))}
            </div>
            {/* Swipe hint */}
            <p style={{ fontFamily: SANS, fontSize: "0.48rem", letterSpacing: "0.28em", textTransform: "uppercase", color: C.textMuted, opacity: 0.52, textAlign: "center", marginTop: "14px" }}>
              SWIPE TO EXPLORE
            </p>
          </div>{/* end aur-gal-mobile */}
        </section>
      )}

      {/* ══════════════════ RSVP ══════════════════ */}
      {showRsvp && (
        <section
          id="aur-rsvp"
          data-v2-section="aur-rsvp"
          ref={rsvpAnim.ref as React.RefObject<HTMLElement>}
          className="aur-rsvp-sect"
          style={{ position: "relative", overflow: "hidden", ...rsvpAnim.style }}
        >
          <div
            ref={rsvpParallax.ref}
            style={{
              position: "absolute", inset: "-15% 0",
              backgroundImage: `url(${rsvpBgImage || "https://images.unsplash.com/photo-1519741497674-611481863552?w=1400&q=80&auto=format&fit=crop"})`,
              backgroundSize: "cover", backgroundPosition: "center",
              transform: `translateY(${rsvpParallax.offset}px)`,
              zIndex: 0, willChange: "transform",
            }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(100deg, rgba(4,8,8,0.76) 0%, rgba(4,8,8,0.65) 52%, rgba(4,8,8,0.45) 100%)", zIndex: 1 }} />

          {/* Two-column layout */}
          <div
            className="aur-rsvp-cols"
            style={{
              position: "relative", zIndex: 2,
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px",
              maxWidth: "1100px", width: "calc(100% - 48px)",
              margin: "0 auto", padding: "100px 0",
              alignItems: "center",
            }}
          >
            {/* Left — large RSVP text */}
            <div className="aur-rsvp-left">
              <div style={{ marginBottom: "22px" }}>
                <svg width="26" height="20" viewBox="0 0 26 20" fill="none">
                  <path d="M13 1 L2 1 L2 19 L24 19 L24 1 L13 1 Z" stroke={C.gold} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 1 L13 9 L24 1" stroke={C.gold} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2
                data-v2-element="aur-rsvp-heading"
                data-v2-type="text"
                style={{ fontFamily: SERIF, fontSize: "clamp(4.5rem, 9vw, 9rem)", fontWeight: 300, letterSpacing: "0.04em", color: C.goldSoft, lineHeight: 0.92, marginBottom: "22px" }}
              >
                RSVP
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "26px" }}>
                <div style={{ width: "22px", height: "1px", background: "rgba(215,183,119,0.52)" }} />
                <svg width="6" height="6" viewBox="0 0 6 6"><path d="M3 0L6 3L3 6L0 3Z" fill={C.gold} fillOpacity="0.72"/></svg>
              </div>
              <p
                data-v2-element="aur-rsvp-deadline"
                data-v2-type="text"
                style={{ fontFamily: SERIF, fontSize: "clamp(1rem, 2vw, 1.4rem)", fontStyle: "italic", color: C.ivoryMuted, lineHeight: 1.58, marginBottom: "20px" }}
              >
                {rsvpDeadline}
              </p>
              <p
                data-v2-element="aur-rsvp-note"
                data-v2-type="textarea"
                style={{ fontFamily: SANS, fontSize: "0.88rem", fontWeight: 300, color: C.textMuted, lineHeight: 1.88 }}
              >
                {rsvpNote}
              </p>
            </div>

            {/* Right — glass form panel */}
            <div
              className="aur-rsvp-form-panel"
              style={{
                background: "rgba(8,18,14,0.74)",
                backdropFilter: "blur(22px)",
                WebkitBackdropFilter: "blur(22px)",
                border: "1px solid rgba(215,183,119,0.38)",
                borderRadius: "16px",
                boxShadow: "0 32px 80px rgba(0,0,0,0.55)",
                padding: "44px 40px",
              }}
            >
              {rsvpSuccess ? (
                <div style={{ textAlign: "center", padding: "40px 0", fontFamily: SERIF, fontSize: "1.45rem", fontStyle: "italic", color: C.gold, lineHeight: 1.65 }}>
                  {cfg.rsvp.messages.success}
                </div>
              ) : (
                <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
                  {/* Name */}
                  <div style={{ marginBottom: "14px" }}>
                    <label style={rsvpLabel(SANS)}>FULL NAME</label>
                    <div className="aur-rsvp-name-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div>
                        <input {...form.register("firstName")} placeholder="First name" className="aur-input" style={rsvpInput(C, SANS)} />
                        {form.formState.errors.firstName && <p style={RSVP_ERR}>{form.formState.errors.firstName.message}</p>}
                      </div>
                      <div>
                        <input {...form.register("lastName")} placeholder="Last name" className="aur-input" style={rsvpInput(C, SANS)} />
                        {form.formState.errors.lastName && <p style={RSVP_ERR}>{form.formState.errors.lastName.message}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Attendance */}
                  <div style={{ marginBottom: "16px" }}>
                    <label style={rsvpLabel(SANS)}>WILL YOU ATTEND?</label>
                    <div className="aur-rsvp-attend-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      {[
                        { value: "attending",     label: "Accepts with pleasure" },
                        { value: "not-attending", label: "Declines with regret"  },
                      ].map(opt => {
                        const selected = form.watch("attendance") === opt.value;
                        return (
                          <label
                            key={opt.value}
                            style={{
                              display: "flex", alignItems: "center", gap: "9px",
                              padding: "12px 14px",
                              border: `1px solid ${selected ? C.gold : "rgba(215,183,119,0.20)"}`,
                              background: selected ? "rgba(215,183,119,0.09)" : "transparent",
                              cursor: "pointer",
                              fontFamily: SANS, fontSize: "0.78rem",
                              color: selected ? C.gold : C.textMuted,
                              transition: "all 0.22s",
                              borderRadius: "4px",
                            }}
                          >
                            <input type="radio" {...form.register("attendance")} value={opt.value} style={{ display: "none" }} />
                            <div style={{ width: "14px", height: "14px", borderRadius: "50%", border: `1px solid ${selected ? C.gold : "rgba(215,183,119,0.38)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              {selected && <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: C.gold }} />}
                            </div>
                            {opt.label}
                          </label>
                        );
                      })}
                    </div>
                    {form.formState.errors.attendance && <p style={RSVP_ERR}>{form.formState.errors.attendance.message}</p>}
                  </div>

                  {/* Guest count */}
                  <div style={{ marginBottom: "14px" }}>
                    <label style={rsvpLabel(SANS)}>NUMBER ATTENDING</label>
                    <select {...form.register("guestCount")} className="aur-input" style={{ ...rsvpInput(C, SANS), cursor: "pointer" }}>
                      {cfg.rsvp.guestOptions.map(opt => (
                        <option key={opt.value} value={opt.value} style={{ background: "#081212" }}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Dietary */}
                  <div style={{ marginBottom: "24px" }}>
                    <label style={rsvpLabel(SANS)}>
                      DIETARY RESTRICTIONS{" "}
                      <span style={{ opacity: 0.52, fontSize: "0.90em" }}>(OPTIONAL)</span>
                    </label>
                    <textarea
                      {...form.register("guestNames")}
                      placeholder={cfg.rsvp.form.guestNamesPlaceholder}
                      rows={3}
                      className="aur-input"
                      style={{ ...rsvpInput(C, SANS), resize: "vertical", lineHeight: 1.55 }}
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={rsvpMutation.isPending}
                    style={{
                      width: "100%", padding: "16px",
                      background: rsvpMutation.isPending ? "rgba(215,183,119,0.45)" : `linear-gradient(135deg, ${C.goldSoft} 0%, ${C.gold} 100%)`,
                      border: "none",
                      color: C.bgDark,
                      fontFamily: SANS, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase",
                      cursor: rsvpMutation.isPending ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                    }}
                  >
                    {rsvpMutation.isPending ? cfg.rsvp.form.submittingButton : (cfg.rsvp.form.submitButton || "SEND REPLY")}
                    {!rsvpMutation.isPending && (
                      <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M0 5H12M9 1L13 5L9 9" stroke="currentColor" strokeWidth="1.5"/></svg>
                    )}
                  </button>

                  {rsvpMutation.isError && (
                    <p style={{ marginTop: "12px", fontFamily: SANS, fontSize: "0.78rem", color: "#EF4444", textAlign: "center" }}>
                      {cfg.rsvp.messages.error}
                    </p>
                  )}
                </form>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════ FOOTER ══════════════════ */}
      <footer
        data-v2-section="aur-footer"
        ref={footerAnim.ref as React.RefObject<HTMLElement>}
        className="aur-footer"
        style={{
          background: C.bgDeep,
          padding: "80px 40px 48px",
          textAlign: "center",
          borderTop: "1px solid rgba(215,183,119,0.10)",
          ...footerAnim.style,
        }}
      >
        <div style={{ marginBottom: "10px" }}>
          <svg width="14" height="16" viewBox="0 0 14 16" fill="none" style={{ opacity: 0.38 }}>
            <path d="M7 1 C5 3.5 3 5.5 3 7.5 C3 10 4.8 12 7 12 C9.2 12 11 10 11 7.5 C11 5.5 9 3.5 7 1Z" stroke={C.gold} strokeWidth="0.85" fill="none"/>
            <line x1="7" y1="12" x2="7" y2="15" stroke={C.gold} strokeWidth="0.85"/>
          </svg>
        </div>
        <h2 className="aur-footer-names" style={{ fontFamily: SERIF, fontSize: "clamp(2rem, 5vw, 3.6rem)", fontWeight: 300, letterSpacing: "0.04em", color: C.gold, margin: "0 0 6px" }}>
          {groomName}{" "}
          <span style={{ fontStyle: "italic", opacity: 0.68 }}>{separator}</span>
          {" "}{brideName}
        </h2>
        <p
          data-v2-element="aur-footer-tagline"
          data-v2-type="text"
          style={{ fontFamily: SANS, fontSize: "0.56rem", letterSpacing: "0.28em", textTransform: "uppercase", color: C.textMuted, marginBottom: "36px", opacity: 0.72 }}
        >
          {footerTagline}
        </p>
        <div style={{ width: "44px", height: "1px", background: C.gold, margin: "0 auto 28px", opacity: 0.26 }} />
        {(socialInstagram || socialFacebook || socialEmail) && (
          <div style={{ display: "flex", justifyContent: "center", gap: "24px", marginBottom: "36px" }}>
            {socialInstagram && <a href={socialInstagram} target="_blank" rel="noopener noreferrer" style={{ color: C.textMuted, textDecoration: "none", fontSize: "0.70rem", letterSpacing: "0.10em", fontFamily: SANS, opacity: 0.62 }}>Instagram</a>}
            {socialFacebook  && <a href={socialFacebook}  target="_blank" rel="noopener noreferrer" style={{ color: C.textMuted, textDecoration: "none", fontSize: "0.70rem", letterSpacing: "0.10em", fontFamily: SANS, opacity: 0.62 }}>Facebook</a>}
            {socialEmail     && <a href={`mailto:${socialEmail}`} style={{ color: C.textMuted, textDecoration: "none", fontSize: "0.70rem", letterSpacing: "0.10em", fontFamily: SANS, opacity: 0.62 }}>Email</a>}
          </div>
        )}
        <p style={{ fontFamily: SANS, fontSize: "0.56rem", color: C.textMuted, opacity: 0.35, letterSpacing: "0.08em" }}>
          &#169; {new Date().getFullYear()} {groomName} &amp; {brideName}. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

// ─── Lazily inject Google Fonts ───────────────────────────────────────────────
function extractFamilyName(fontValue: string): string {
  // Strip weight variants like "Cormorant Garamond:ital,wght@..."
  return fontValue.split(":")[0].split(",")[0].trim();
}

function AureliaFonts({ headingFont, bodyFont }: { headingFont: string; bodyFont: string }) {
  useEffect(() => {
    const families = [
      extractFamilyName(headingFont),
      extractFamilyName(bodyFont),
    ].filter(Boolean);

    const id = `aurelia-gfonts-${families.join("-").replace(/\s+/g, "_")}`;
    if (document.getElementById(id)) return;

    // Always ensure defaults are loaded
    const alwaysLoad = [
      "Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400",
      "Montserrat:wght@300;400;500;600",
    ];
    const dynamicFamilies = families
      .filter((f) => f && f !== "Cormorant Garamond" && f !== "Montserrat")
      .map((f) => f.replace(/\s+/g, "+") + ":wght@300;400;500;600");

    const allFamilies = [...alwaysLoad, ...dynamicFamilies];
    const query = allFamilies.map((f) => `family=${f}`).join("&");
    const link = document.createElement("link");
    link.id   = id;
    link.rel  = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?${query}&display=swap`;
    document.head.appendChild(link);
  }, [headingFont, bodyFont]);
  return null;
}

// ─── RSVP style helpers ───────────────────────────────────────────────────────
function rsvpLabel(sans: string): React.CSSProperties {
  return {
    display: "block",
    fontFamily: sans,
    fontSize: "0.55rem",
    fontWeight: 500,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "#CBBEA8",
    marginBottom: "8px",
  };
}

function rsvpInput(C: Record<keyof typeof C_DEFAULT, string>, sans: string): React.CSSProperties {
  return {
    width: "100%",
    background: "rgba(4,10,8,0.72)",
    border: "1px solid rgba(215,183,119,0.20)",
    borderRadius: "4px",
    padding: "11px 14px",
    fontFamily: sans,
    fontSize: "0.84rem",
    color: C.textLight,
    outline: "none",
    boxSizing: "border-box",
    appearance: "none",
  };
}

const RSVP_ERR: React.CSSProperties = {
  marginTop: "4px",
  fontFamily: "'Montserrat', sans-serif",
  fontSize: "0.7rem",
  color: "#EF4444",
};
