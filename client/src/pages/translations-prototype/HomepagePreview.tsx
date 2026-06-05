/**
 * HomepagePreview.tsx — Live preview of the homepage using editable config.
 * Mirrors the visual style of homepage-prototype.tsx but accepts config props.
 * Supports mobile (390px) and desktop modes.
 */
import { useState } from "react";
import {
  ArrowRight, Calendar, Camera, CheckCircle, ChevronLeft, ChevronRight,
  Clock, Edit3, Gift, Heart, Lock, MapPin, Menu, MessageCircle, Phone,
  Palette, Send, Share2, Smartphone, Sparkles, Star, Users, X,
} from "lucide-react";
import type { HomepageContent, Locale, IconKey } from "./types";

// ─── Icon map ─────────────────────────────────────────────────────────────────
const ICON_MAP: Record<IconKey, React.ElementType> = {
  heart: Heart, calendar: Calendar, map: MapPin, camera: Camera,
  message: MessageCircle, phone: Phone, gift: Gift, lock: Lock,
  star: Star, users: Users, check: CheckCircle, smartphone: Smartphone,
  share: Share2, edit: Edit3, sparkles: Sparkles, clock: Clock,
  palette: Palette, send: Send, arrow: ArrowRight,
  instagram: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  ),
  facebook: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
  telegram: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  ),
};

function Icon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  const Comp = ICON_MAP[name as IconKey] ?? Sparkles;
  return <Comp className={className} />;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const serif = { fontFamily: "var(--armenian-serif, serif)" } as const;
const sans  = { fontFamily: "var(--armenian-sans, sans-serif)" } as const;

function t(ls: { hy: string; en: string; ru: string }, locale: Locale): string {
  return ls[locale] || ls.hy || "";
}

// ─── Main export ──────────────────────────────────────────────────────────────
interface Props {
  content: HomepageContent;
  locale: Locale;
  mode: "mobile" | "desktop";
}

export default function HomepagePreview({ content, locale, mode }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTpl, setActiveTpl] = useState(0);
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const visibleTemplates = content.templates.items.filter(i => i.visible);
  const visibleFaq       = content.faq.items.filter(i => i.visible);
  const visibleFeatures  = content.features.items.filter(i => i.visible);
  const visibleNavItems  = content.navigation.items.filter(i => i.visible);
  const visibleChips     = content.hero.chips.filter(c => c.visible);
  const visibleSteps     = content.howItWorks.steps.filter(s => s.visible);
  const visibleTrust     = content.footer.trustItems.filter(tr => tr.visible);
  const visibleButtons   = content.contact.buttons.filter(b => b.visible);

  // Mobile preview wraps in a scaled phone-width container
  const isMobile = mode === "mobile";

  return (
    <div
      style={{
        width: isMobile ? 390 : "100%",
        ...sans,
        fontSize: isMobile ? 14 : 16,
        background: "#fff8ef",
        color: "#18241d",
        minHeight: 600,
        overflowX: "hidden",
      }}
    >
      {/* ──────── HEADER ──────── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(14,33,25,0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(216,182,106,0.2)",
      }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 16px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/homepage-prototype" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "white" }}>
            <span style={{ display: "flex", width: 32, height: 32, alignItems: "center", justifyContent: "center", borderRadius: "50%", border: "1px solid rgba(216,182,106,0.4)", background: "rgba(216,182,106,0.1)" }}>
              <Heart className="h-4 w-4 fill-[#d8b66a] text-[#d8b66a]" />
            </span>
            <span style={{ fontSize: 16, fontWeight: 600, ...serif }}>4ever.am</span>
          </a>

          {!isMobile && (
            <nav style={{ display: "flex", gap: 20, alignItems: "center" }}>
              {visibleNavItems.map(item => (
                <a key={item.id} href={item.href} style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", textDecoration: "none" }}>
                  {t(item.label, locale)}
                </a>
              ))}
            </nav>
          )}

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {!isMobile && (
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", cursor: "pointer" }}>
                {t(content.navigation.loginLabel, locale)}
              </span>
            )}
            <span style={{ fontSize: 12, fontWeight: 600, padding: "7px 16px", borderRadius: 20, background: "#d8b66a", color: "#10241b", cursor: "pointer" }}>
              {t(content.navigation.startLabel, locale)}
            </span>
            {isMobile && (
              <button onClick={() => setMenuOpen(v => !v)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "white", cursor: "pointer" }}>
                {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>

        {menuOpen && isMobile && (
          <div style={{ background: "#0e2119", padding: "8px 16px 16px" }}>
            {visibleNavItems.map(item => (
              <a key={item.id} href={item.href} style={{ display: "block", padding: "10px 0", color: "rgba(255,255,255,0.85)", textDecoration: "none", fontSize: 14, borderBottom: "1px solid rgba(216,182,106,0.12)" }}>
                {t(item.label, locale)}
              </a>
            ))}
          </div>
        )}
      </header>

      {/* ──────── HERO ──────── */}
      <section style={{ position: "relative", minHeight: isMobile ? 460 : 520, background: "#0e1e17", overflow: "hidden" }}>
        <img
          src={content.hero.backgroundImage}
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "58% center", opacity: 0.75 }}
          onError={e => { (e.currentTarget as HTMLImageElement).src = "/attached_assets/floral-background1.jpg"; }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(5,14,10,0.72), rgba(8,21,15,0.72) 48%, rgba(6,17,12,0.94) 100%)" }} />
        <div style={{ position: "relative", zIndex: 1, padding: isMobile ? "32px 20px 28px" : "64px 40px", maxWidth: 720 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Heart className="h-3.5 w-3.5 fill-[#f0cf82] text-[#f0cf82]" />
            <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.22em", color: "#f0cf82" }}>
              {t(content.hero.eyebrow, locale)}
            </span>
          </div>
          <h1 style={{ fontSize: isMobile ? "1.7rem" : "3.2rem", fontWeight: 600, lineHeight: 1.08, color: "white", marginBottom: 14, ...serif }}>
            {t(content.hero.title, locale)}{" "}
            <span style={{ color: "#f0cf82" }}>{t(content.hero.titleHighlight, locale)}</span>{" "}
            {t(content.hero.titleSuffix, locale)}
          </h1>
          <p style={{ fontSize: isMobile ? 13 : 15, lineHeight: 1.7, color: "rgba(255,255,255,0.8)", maxWidth: 540, marginBottom: 20 }}>
            {t(content.hero.subtitle, locale)}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
            {content.hero.primaryCta.visible && (
              <a href={content.hero.primaryCta.href} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 24, background: "#f0cf82", color: "#10241b", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                {t(content.hero.primaryCta.label, locale)}
                <ArrowRight className="h-4 w-4" />
              </a>
            )}
            {content.hero.secondaryCta.visible && (
              <a href={content.hero.secondaryCta.href} style={{ display: "inline-flex", alignItems: "center", padding: "10px 20px", borderRadius: 24, border: "1px solid rgba(255,255,255,0.4)", color: "white", fontSize: 13, fontWeight: 600, textDecoration: "none", background: "rgba(255,255,255,0.08)" }}>
                {t(content.hero.secondaryCta.label, locale)}
              </a>
            )}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {visibleChips.map(chip => (
              <span key={chip.id} style={{ padding: "5px 12px", borderRadius: 20, border: "1px solid rgba(240,207,130,0.4)", background: "rgba(255,255,255,0.08)", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>
                {t(chip.label, locale)}
              </span>
            ))}
          </div>
          {!isMobile && content.benefits.filter(b => b.visible).length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginTop: 16, maxWidth: 480 }}>
              {content.benefits.filter(b => b.visible).map(b => (
                <div key={b.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.055)" }}>
                  <Icon name={b.icon} className="h-4 w-4 text-[#f0cf82] mt-0.5 shrink-0" />
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "white", lineHeight: 1.3 }}>{t(b.title, locale)}</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2, lineHeight: 1.4 }}>{t(b.text, locale)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ──────── HOW IT WORKS ──────── */}
      <section id="how-it-works" style={{ background: "#f6ecdd", padding: isMobile ? "36px 20px" : "56px 40px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ height: 1, width: 28, background: "#c9a85a" }} />
              <Heart className="h-3.5 w-3.5 fill-[#c9a85a] text-[#c9a85a]" />
              <span style={{ height: 1, width: 28, background: "#c9a85a" }} />
            </div>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.22em", color: "#c9a85a", marginBottom: 8 }}>
              {t(content.howItWorks.eyebrow, locale)}
            </p>
            <h2 style={{ fontSize: isMobile ? "1.5rem" : "2rem", fontWeight: 600, color: "#14251d", ...serif }}>
              {t(content.howItWorks.title, locale)}
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 20 }}>
            {visibleSteps.map(step => (
              <div key={step.id} style={{ padding: "20px 16px", textAlign: "center", borderRadius: 20, border: "1px solid rgba(228,209,177,0.7)", background: "rgba(255,255,255,0.7)", boxShadow: "0 8px 32px rgba(60,40,15,0.07)" }}>
                <div style={{ position: "relative", display: "inline-flex", marginBottom: 14 }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", border: "1px solid rgba(216,182,106,0.4)", background: "#fff8ef", display: "flex", alignItems: "center", justifyContent: "center", color: "#c9a85a" }}>
                    <Icon name={step.icon} className="h-6 w-6" />
                  </div>
                  <span style={{ position: "absolute", top: -4, right: -4, fontSize: 10, fontWeight: 700, background: "#173c2d", color: "#f0cf82", borderRadius: 99, padding: "1px 5px" }}>{step.number}</span>
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "#14251d", marginBottom: 6, ...serif }}>{t(step.title, locale)}</h3>
                <p style={{ fontSize: 12, color: "#71685f", lineHeight: 1.6 }}>{t(step.text, locale)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────── TEMPLATES ──────── */}
      <section id="templates" style={{ background: "#fff8ef", padding: isMobile ? "36px 0" : "56px 0" }}>
        <div style={{ textAlign: "center", marginBottom: 28, padding: "0 20px" }}>
          <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.22em", color: "#c9a85a", marginBottom: 6 }}>
            {t(content.templates.eyebrow, locale)}
          </p>
          <h2 style={{ fontSize: isMobile ? "1.4rem" : "1.8rem", fontWeight: 600, color: "#14251d", ...serif }}>
            {t(content.templates.title, locale)}
          </h2>
        </div>
        <div style={{ display: "flex", gap: 16, overflowX: "auto", padding: "8px 20px 16px", scrollbarWidth: "none" }}>
          {visibleTemplates.map((card, idx) => (
            <div
              key={card.id}
              onClick={() => setActiveTpl(idx)}
              style={{
                flexShrink: 0, width: isMobile ? 180 : 220, borderRadius: 20,
                border: `2px solid ${idx === activeTpl ? "#d8b66a" : "rgba(201,168,90,0.3)"}`,
                overflow: "hidden", cursor: "pointer", background: "#fffaf3",
                boxShadow: idx === activeTpl ? "0 8px 28px rgba(201,168,90,0.2)" : "0 4px 18px rgba(0,0,0,0.07)",
                transition: "all 0.2s",
              }}
            >
              <div style={{ position: "relative", aspectRatio: "4/5", overflow: "hidden", background: "#efe4d4" }}>
                <img src={card.image} alt={t(card.name, locale)} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.currentTarget as HTMLImageElement).src = "/attached_assets/floral-background1.jpg"; }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(8,23,17,0.05) 20%, rgba(8,23,17,0.88) 100%)" }} />
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "12px 12px" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 4, borderRadius: 20, border: "1px solid rgba(240,207,130,0.5)", background: "rgba(240,207,130,0.18)", padding: "3px 8px", marginBottom: 6 }}>
                    <Sparkles className="h-3 w-3 text-[#f0cf82]" />
                    <span style={{ fontSize: 9, color: "#f6dda1", fontWeight: 600 }}>{t(card.tag, locale)}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                    <div>
                      <p style={{ color: "white", fontSize: 14, fontWeight: 600, ...serif }}>{t(card.name, locale)}</p>
                      <p style={{ color: "#f0cf82", fontSize: 11, marginTop: 2 }}>{t(card.price, locale)}</p>
                    </div>
                    <a href={card.href} onClick={e => e.stopPropagation()} style={{ borderRadius: 20, background: "#f0cf82", padding: "5px 10px", fontSize: 11, fontWeight: 600, color: "#10241b", textDecoration: "none" }}>
                      {t(card.buttonLabel, locale)}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 10 }}>
          {visibleTemplates.map((_, i) => (
            <button key={i} onClick={() => setActiveTpl(i)} style={{ height: 7, width: i === activeTpl ? 24 : 7, borderRadius: 99, border: "none", background: i === activeTpl ? "#c9a85a" : "rgba(201,168,90,0.35)", cursor: "pointer", padding: 0, transition: "width 0.3s" }} />
          ))}
        </div>
      </section>

      {/* ──────── FEATURES ──────── */}
      <section id="features" style={{ background: "#0f2d22", padding: isMobile ? "36px 20px" : "56px 40px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: "0 0 0 auto", width: "60%", background: "radial-gradient(circle at right, rgba(216,182,106,0.07), transparent 65%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 960, margin: "0 auto", position: "relative" }}>
          <div style={{ textAlign: "center", marginBottom: 30 }}>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.2em", color: "#c9a85a", marginBottom: 8 }}>
              {t(content.features.eyebrow, locale)}
            </p>
            <h2 style={{ fontSize: isMobile ? "1.2rem" : "1.6rem", fontWeight: 600, color: "#fffaf0", ...serif }}>
              {t(content.features.title, locale)}
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: 14 }}>
            {visibleFeatures.map(item => (
              <div key={item.id} style={{ padding: "16px 12px", borderRadius: 18, border: "1px solid rgba(216,182,106,0.18)", background: "rgba(255,255,255,0.04)", textAlign: "center" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(216,182,106,0.18)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", color: "#f0cf82" }}>
                  <Icon name={item.icon} className="h-4 w-4" />
                </div>
                <p style={{ fontSize: 12, fontWeight: 600, color: "white", lineHeight: 1.4 }}>{t(item.title, locale)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────── MOBILE EXPERIENCE ──────── */}
      <section id="guest-experience" style={{ background: "#f6ecdd", padding: isMobile ? "36px 20px" : "56px 40px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.2em", color: "#c9a85a", marginBottom: 10, textAlign: "center" }}>
            {t(content.mobileExperience.eyebrow, locale)}
          </p>
          <h2 style={{ fontSize: isMobile ? "1.4rem" : "2rem", fontWeight: 600, color: "#14251d", textAlign: "center", marginBottom: 14, ...serif }}>
            {t(content.mobileExperience.title, locale)}
          </h2>
          <p style={{ fontSize: isMobile ? 13 : 15, color: "#71685f", lineHeight: 1.7, textAlign: "center", maxWidth: 580, margin: "0 auto 24px" }}>
            {t(content.mobileExperience.subtitle, locale)}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10 }}>
            {content.mobileExperience.actions.filter(a => a.visible).map(action => (
              <span key={action.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 24, background: "white", fontSize: 12, fontWeight: 600, color: "#173c2d", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                <Icon name={action.icon} className="h-3.5 w-3.5 text-[#c9a85a]" />
                {t(action.label, locale)}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ──────── FAQ ──────── */}
      {visibleFaq.length > 0 && (
        <section style={{ background: "#fff8ef", padding: isMobile ? "36px 20px" : "56px 40px" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.2em", color: "#c9a85a", marginBottom: 8, textAlign: "center" }}>
              {t(content.faq.eyebrow, locale)}
            </p>
            <h2 style={{ fontSize: isMobile ? "1.4rem" : "1.8rem", fontWeight: 600, color: "#14251d", textAlign: "center", marginBottom: 24, ...serif }}>
              {t(content.faq.title, locale)}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {visibleFaq.map(item => (
                <div key={item.id} style={{ borderRadius: 14, border: "1px solid rgba(228,209,177,0.7)", background: "white", overflow: "hidden" }}>
                  <button
                    onClick={() => setOpenFaq(openFaq === item.id ? null : item.id)}
                    style={{ width: "100%", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#14251d", flex: 1, paddingRight: 12 }}>{t(item.question, locale)}</span>
                    <span style={{ fontSize: 18, color: "#c9a85a", flexShrink: 0, lineHeight: 1 }}>{openFaq === item.id ? "−" : "+"}</span>
                  </button>
                  {openFaq === item.id && (
                    <div style={{ padding: "4px 16px 14px", fontSize: 13, color: "#71685f", lineHeight: 1.65, borderTop: "1px solid rgba(228,209,177,0.5)" }}>
                      {t(item.answer, locale)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ──────── CONTACT ──────── */}
      <section id="contact" style={{ background: "#10251c", padding: isMobile ? "36px 20px" : "56px 40px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.22em", color: "#f0cf82", marginBottom: 8 }}>
            {t(content.contact.eyebrow, locale)}
          </p>
          <h2 style={{ fontSize: isMobile ? "1.4rem" : "1.9rem", fontWeight: 600, color: "white", marginBottom: 12, ...serif }}>
            {t(content.contact.title, locale)}
          </h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, marginBottom: 24 }}>
            {t(content.contact.subtitle, locale)}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10 }}>
            {visibleButtons.map(btn => (
              <a key={btn.id} href={btn.href} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 24, background: btn.icon === "arrow" ? "#f0cf82" : "rgba(255,255,255,0.12)", color: btn.icon === "arrow" ? "#10241b" : "white", fontSize: 13, fontWeight: 600, textDecoration: "none", border: "1px solid rgba(255,255,255,0.15)" }}>
                <Icon name={btn.icon} className="h-4 w-4" />
                {t(btn.label, locale)}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ──────── FOOTER ──────── */}
      <footer style={{ background: "#fff8ef", borderTop: "1px solid rgba(216,182,106,0.2)", padding: isMobile ? "24px 20px" : "36px 40px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
            {visibleTrust.map(item => (
              <div key={item.id} style={{ padding: "14px 12px", borderRadius: 14, border: "1px solid rgba(228,209,177,0.7)", background: "rgba(255,255,255,0.7)" }}>
                <Icon name={item.icon} className="h-4 w-4 text-[#c9a85a] mb-2" />
                <p style={{ fontSize: 12, fontWeight: 600, color: "#14251d", marginBottom: 4 }}>{t(item.title, locale)}</p>
                <p style={{ fontSize: 11, color: "#71685f", lineHeight: 1.5 }}>{t(item.text, locale)}</p>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid rgba(216,182,106,0.2)", paddingTop: 16, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Heart className="h-3.5 w-3.5 fill-[#c9a85a] text-[#c9a85a]" />
              <span style={{ fontWeight: 600, color: "#14251d", ...serif }}>4ever.am</span>
            </div>
            <div style={{ fontSize: 11, color: "#71685f", display: "flex", flexWrap: "wrap", gap: 12 }}>
              <span>{content.footer.email}</span>
              <span>{content.footer.phone}</span>
            </div>
            <p style={{ fontSize: 11, color: "#71685f" }}>{t(content.footer.copyright, locale)}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
