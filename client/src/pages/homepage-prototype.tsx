/**
 * homepage-prototype.tsx
 *
 * Route: /homepage-prototype
 *
 * All visible text comes from loadHomepageContent() / defaultHomepageContent.ts
 * Phone mockup loads /david-rose-romantic via iframe (scrollable & interactive)
 * Templates section redesigned: image + name + price + Դիտել button from config
 * FAQ, Contact, Footer restored from config
 */

import { type ElementType, memo, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Bell,
  Calendar,
  Camera,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  Gift,
  Heart,
  Lock,
  MapPin,
  Menu,
  MessageCircle,
  Palette,
  Phone,
  Send,
  Share2,
  Smartphone,
  Sparkles,
  Star,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { loadHomepageContent, fetchHomepageContentFromServer, saveHomepageContent } from "../content/homepage/homepageContentStorage";
import type { IconKey } from "../content/homepage/homepageContentTypes";
import { SaleWheelModal } from "../components/SaleWheelModal";

// ─── Styles ───────────────────────────────────────────────────────────────────
const serifStyle: React.CSSProperties = { fontFamily: "var(--armenian-serif, serif)" };
const sansStyle:  React.CSSProperties = { fontFamily: "var(--armenian-sans, sans-serif)" };

// ─── Icon map (mirrors HomepagePreview.tsx) ───────────────────────────────────
const ICON_MAP: Record<IconKey, ElementType> = {
  heart: Heart, calendar: Calendar, map: MapPin, camera: Camera,
  message: MessageCircle, phone: Phone, gift: Gift, lock: Lock,
  star: Star, users: Users, check: CheckCircle, smartphone: Smartphone,
  share: Share2, edit: Edit3, sparkles: Sparkles, clock: Clock,
  palette: Palette, send: Send, arrow: ArrowRight, bell: Bell, wallet: Wallet,
  instagram: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: "1em", height: "1em" }}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  ),
  facebook: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: "1em", height: "1em" }}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
  telegram: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: "1em", height: "1em" }}>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  ),
};

function Ic({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  const Comp = ICON_MAP[name as IconKey] ?? Sparkles;
  return <Comp className={className} />;
}

// ─── SectionHeading ───────────────────────────────────────────────────────────
function SectionHeading({
  eyebrow, title, inverse = false, compact = false,
}: {
  eyebrow: string; title: string; inverse?: boolean; compact?: boolean;
}) {
  return (
    <div className={`mx-auto max-w-2xl text-center ${compact ? "mb-7 sm:mb-10" : "mb-9 sm:mb-14"}`}>
      <div className="mb-3 flex items-center justify-center gap-3">
        <span className="h-px w-8 bg-[#c9a85a]" />
        <Heart className="h-4 w-4 fill-[#c9a85a] text-[#c9a85a]" />
        <span className="h-px w-8 bg-[#c9a85a]" />
      </div>
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c9a85a] sm:text-[11px]">
        {eyebrow}
      </p>
      <h2
        className={`font-semibold leading-[1.08] ${
          compact ? "text-[clamp(1.55rem,6vw,2.4rem)]" : "text-[clamp(1.8rem,6vw,3.15rem)]"
        } ${inverse ? "text-[#fffaf0]" : "text-[#14251d]"}`}
        style={serifStyle}
      >
        {title}
      </h2>
    </div>
  );
}

// ─── PhonePreview ─────────────────────────────────────────────────────────────
// Renders a phone frame around an iframe loading /david-rose-romantic.
// The iframe viewport fills the phone screen (scaled from 375px) and is
// fully scrollable and interactive — no pointer-events blocking.
const PhonePreview = memo(function PhonePreview({ size = "desktop", src = "/david-rose-romantic" }: { size?: "desktop" | "mobile"; src?: string }) {
  const [iframeReady, setIframeReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const phoneW    = size === "desktop" ? 320 : 222;
  const phoneH    = size === "desktop" ? 662 : 462;
  const borderPx  = size === "desktop" ? 8 : 7;
  const bRadius   = size === "desktop" ? "2.45rem" : "2rem";
  const notchW    = size === "desktop" ? 96 : 64;
  const notchH    = size === "desktop" ? 24 : 16;

  const screenW = phoneW - borderPx * 2;
  const screenH = phoneH - borderPx * 2;

  const scale    = screenW / 375;
  const iframeW  = 375;
  const iframeH  = Math.round(screenH / scale);

  function handleLoad() {
    try {
      const doc = iframeRef.current?.contentDocument;
      if (doc?.head) {
        const style = doc.createElement("style");
        style.textContent = "::-webkit-scrollbar{display:none!important;width:0!important}html{scrollbar-width:none!important;overflow-y:scroll}";
        doc.head.appendChild(style);
      }
    } catch { /* cross-origin guard */ }

    // Wait until the template's <section> elements are in the DOM
    // (loading screens don't have sections; the real template does)
    const check = setInterval(() => {
      try {
        const doc = iframeRef.current?.contentDocument;
        if ((doc?.querySelectorAll("section").length ?? 0) >= 1) {
          clearInterval(check);
          clearTimeout(fallback);
          setIframeReady(true);
        }
      } catch {
        clearInterval(check);
      }
    }, 200);

    // Safety fallback — reveal after 6 s no matter what
    const fallback = setTimeout(() => {
      clearInterval(check);
      setIframeReady(true);
    }, 6000);
  }

  return (
    <div style={{ position: "relative", width: phoneW, flexShrink: 0 }}>
      {/* Ambient glow */}
      <div
        aria-hidden
        style={{
          position: "absolute", inset: -20, borderRadius: "3rem",
          background: "rgba(201,168,90,0.18)", filter: "blur(28px)",
          pointerEvents: "none",
        }}
      />

      {/* Phone outer shell */}
      <div style={{
        position: "relative", width: phoneW, height: phoneH,
        borderRadius: bRadius,
        border: `${borderPx}px solid #101411`,
        background: "#101411",
        boxShadow: "0 32px 80px rgba(0,0,0,0.52), inset 0 0 0 1px rgba(255,255,255,0.04)",
        overflow: "hidden",
      }}>
        {/* Dynamic island notch */}
        <div
          aria-hidden
          style={{
            position: "absolute", top: 0, left: "50%",
            transform: "translateX(-50%)",
            width: notchW, height: notchH,
            borderRadius: "0 0 14px 14px",
            background: "#101411", zIndex: 20,
          }}
        />

        {/* Screen area — clips the scaled iframe */}
        <div style={{
          position: "absolute", inset: 0, overflow: "hidden",
          borderRadius: `calc(${bRadius} - ${borderPx}px)`,
          background: "#0d1f17",
        }}>
          {/* Static screenshot — shown immediately, fades out when iframe is ready */}
          <img
            src="/template_previews/img1.webp"
            alt=""
            aria-hidden
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              objectFit: "cover", objectPosition: "top",
              opacity: iframeReady ? 0 : 1,
              transition: "opacity 0.7s ease",
              zIndex: 2,
              pointerEvents: "none",
            }}
          />

          {/* Live iframe — loads silently, fades in when ready */}
          <div style={{
            position: "absolute", top: 0, left: 0,
            width: iframeW, height: iframeH,
            transformOrigin: "0 0",
            transform: `scale(${scale})`,
            opacity: iframeReady ? 1 : 0,
            transition: "opacity 0.7s ease",
            zIndex: 1,
          }}>
            <iframe
              ref={iframeRef}
              src={src}
              title="Wedding template preview"
              onLoad={handleLoad}
              style={{
                width: iframeW, height: iframeH,
                border: "none", display: "block",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

// ─── PlannerTabletDashboard ───────────────────────────────────────────────────
// Landscape tablet mockup for desktop, compact portrait card for mobile.
// Content is static/visual — no interaction needed.
function PlannerTabletDashboard({ visible }: { visible: boolean }) {
  const barStyle = (w: string, delay: string): React.CSSProperties => ({
    height: "100%", borderRadius: 99,
    "--bar-w": w,
    animation: visible ? `ppsBarGrow 1.2s ease ${delay} both` : "none",
  } as React.CSSProperties);

  const badgeAnim = (i: number) =>
    visible ? `ppsBadgeIn .45s ease ${0.2 + i * 0.08}s both` : "none";

  const stats = [
    { val: "182", label: "Հյուրեր" },
    { val: "146", label: "Գալիս է", green: true  },
    { val: "20",  label: "Սեղաններ" },
    { val: "֏6.8M", label: "Բյուջե",  gold: true   },
  ];

  const tasks = [
    { label: "Զանգել նկարիչներին", due: "Հունիսի 8", done: false },
    { label: "Վճարել երաժիշտներին",     due: "Հունիսի 10", done: false },
    { label: "Պայմանավորվել դիզայների հետ",   due: "Հունիսի 5",  done: true  },
  ];

  const Header = ({ fs14 = false }: { fs14?: boolean }) => (
    <div style={{ background: "#12231a", padding: fs14 ? "11px 18px 10px" : "10px 14px 9px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: fs14 ? 36 : 32, height: fs14 ? 36 : 32, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg,#2d7a55,#1a4d35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Heart style={{ width: fs14 ? 15 : 13, height: fs14 ? 15 : 13, fill: "#f0cf82", color: "#f0cf82" }} />
      </div>
      <div>
        <div style={{ fontSize: fs14 ? 14 : 13, fontWeight: 700, color: "#fffaf0", lineHeight: 1.2 }}>Aram & Ani</div>
        <div style={{ fontSize: fs14 ? 10 : 9, color: "rgba(255,255,255,0.45)", lineHeight: 1.2 }}>Wedding Planner · 14 Հունիս 2026</div>
      </div>
      <div style={{ marginLeft: "auto" }}>
        <div style={{ fontSize: fs14 ? 9.5 : 8.5, fontWeight: 600, color: "#34d399", background: "rgba(52,211,153,0.12)", borderRadius: 20, padding: fs14 ? "3px 10px" : "2px 8px", border: "1px solid rgba(52,211,153,0.28)", display: "flex", alignItems: "center", gap: 4, animation: visible ? "ppsTgPulse 2.4s ease-in-out infinite" : "none" }}>
          <span style={{ width: 5, height: 5, background: "#34d399", borderRadius: "50%", display: "inline-block" }} />
          Telegram
        </div>
      </div>
    </div>
  );

  const StatsRow = ({ pad, gap, fs }: { pad: string; gap: number; fs: number }) => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap, padding: pad }}>
      {stats.map(({ val, label, green, gold }, i) => (
        <div key={label} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "9px 6px", textAlign: "center", border: "1px solid rgba(255,255,255,0.07)", animation: badgeAnim(i) }}>
          <div style={{ fontSize: fs, fontWeight: 700, color: green ? "#34d399" : gold ? "#f0cf82" : "#fffaf0", lineHeight: 1.2 }}>{val}</div>
          <div style={{ fontSize: fs - 5, color: "rgba(255,255,255,0.5)", lineHeight: 1.2, marginTop: 2 }}>{label}</div>
        </div>
      ))}
    </div>
  );

  const RSVPWidget = ({ fs }: { fs: number }) => (
    <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "11px 13px", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div style={{ fontSize: fs - 1, fontWeight: 600, color: "#c9a85a", marginBottom: 7, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>RSVP</div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: fs - 1, color: "rgba(255,255,255,0.55)" }}>146 / 182 Գալիս են</span>
        <span style={{ fontSize: fs - 1, fontWeight: 700, color: "#34d399" }}>80%</span>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ ...barStyle("80%", "0.5s"), background: "linear-gradient(90deg,#2d7a55,#34d399)" }} />
      </div>
    </div>
  );

  const BudgetWidget = ({ fs }: { fs: number }) => (
    <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "11px 13px", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div style={{ fontSize: fs - 1, fontWeight: 600, color: "#c9a85a", marginBottom: 7, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Բյուջե</div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: fs - 1, color: "rgba(255,255,255,0.55)" }}>֏3.2M վճարված</span>
        <span style={{ fontSize: fs - 1, fontWeight: 700, color: "#f0cf82" }}>47%</span>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ ...barStyle("47%", "0.7s"), background: "linear-gradient(90deg,#9a7e3d,#f0cf82)" }} />
      </div>
      <div style={{ fontSize: fs - 2, color: "rgba(255,255,255,0.32)", marginTop: 5 }}>֏6.8M նախատեսված · ֏3.6M մնացել է</div>
    </div>
  );

  const TablesWidget = ({ fs }: { fs: number }) => (
    <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "11px 13px", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div style={{ fontSize: fs - 1, fontWeight: 600, color: "#c9a85a", marginBottom: 8, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Սեղաններ</div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 9px)", gap: 3 }}>
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} style={{ width: 9, height: 9, borderRadius: 3, background: i < 16 ? "rgba(52,211,153,0.65)" : "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.07)" }} />
          ))}
        </div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#fffaf0" }}>20</div>
          <div style={{ fontSize: fs - 2, color: "rgba(255,255,255,0.45)" }}>146 նստած</div>
        </div>
      </div>
    </div>
  );

  const TasksWidget = ({ fs, flex1 = false }: { fs: number; flex1?: boolean }) => (
    <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "11px 13px", border: "1px solid rgba(255,255,255,0.08)", ...(flex1 ? { flex: 1 } : {}) }}>
      <div style={{ fontSize: fs - 1, fontWeight: 600, color: "#c9a85a", marginBottom: 8, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Անելիքներ</div>
      {tasks.map(({ label, due, done }) => (
        <div key={label} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
          <div style={{ width: 13, height: 13, borderRadius: "50%", flexShrink: 0, background: done ? "rgba(52,211,153,0.2)" : "rgba(255,255,255,0.07)", border: `1.5px solid ${done ? "#34d399" : "rgba(255,255,255,0.18)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {done && <div style={{ width: 5, height: 5, background: "#34d399", borderRadius: "50%" }} />}
          </div>
          <span style={{ fontSize: fs, color: done ? "rgba(255,255,255,0.32)" : "rgba(255,255,255,0.78)", flex: 1, textDecoration: done ? "line-through" : "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
          <span style={{ fontSize: fs - 1.5, color: "#c9a85a", flexShrink: 0 }}>{due}</span>
        </div>
      ))}
    </div>
  );

  const TgChip = () => (
    <div style={{ padding: "0 18px 14px", display: "flex", justifyContent: "center" }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(52,211,153,0.08)", borderRadius: 20, padding: "5px 14px", border: "1px solid rgba(52,211,153,0.22)", fontSize: 9.5, color: "#34d399", fontWeight: 600, letterSpacing: "0.02em" }}>
        <span style={{ width: 6, height: 6, background: "#34d399", borderRadius: "50%", display: "inline-block" }} />
        Telegram ծանուցումները միացված են
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop: landscape tablet ── */}
      <div
        className="relative hidden lg:block"
        style={{ animation: visible ? "ppsDashFloat 6s ease-in-out 0.4s infinite" : "none" }}
      >
        <div aria-hidden style={{ position: "absolute", inset: -32, borderRadius: "2.6rem", background: "rgba(52,211,153,0.09)", filter: "blur(36px)", pointerEvents: "none" }} />
        <div aria-hidden style={{ position: "absolute", inset: -1, borderRadius: "1.5rem", boxShadow: "0 0 0 1px rgba(201,168,90,0.18)", pointerEvents: "none" }} />
        <div style={{ width: 560, borderRadius: "1.4rem", border: "12px solid #0e1c13", background: "#0e1c13", boxShadow: "0 36px 90px rgba(0,0,0,0.65), inset 0 0 0 1px rgba(255,255,255,0.04)", overflow: "hidden" }}>
          <div style={{ background: "#0d1e14" }}>
            <Header fs14 />
            <StatsRow pad="12px 18px 10px" gap={8} fs={18} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 18px 10px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <RSVPWidget fs={11} />
                <BudgetWidget fs={11} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <TablesWidget fs={11} />
                <TasksWidget fs={10} flex1 />
              </div>
            </div>
            <TgChip />
          </div>
        </div>
      </div>

      {/* ── Mobile: compact portrait card ── */}
      <div className="lg:hidden" style={{ width: "100%", maxWidth: 360, margin: "0 auto" }}>
        <div style={{ width: "100%", borderRadius: "1.3rem", border: "8px solid #0e1c13", background: "#0e1c13", boxShadow: "0 24px 60px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.04)", overflow: "hidden" }}>
          <div style={{ background: "#0d1e14" }}>
            <Header />
            <StatsRow pad="10px 14px 8px" gap={6} fs={15} />
            <div style={{ padding: "0 14px 7px" }}><RSVPWidget fs={10} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, padding: "0 14px 7px" }}>
              <BudgetWidget fs={10} />
              <TablesWidget fs={10} />
            </div>
            <div style={{ padding: "0 14px 7px" }}><TasksWidget fs={9} /></div>
            <TgChip />
          </div>
        </div>
      </div>
    </>
  );
}

// ─── TemplateCard ─────────────────────────────────────────────────────────────
type TCard = {
  title: string; tag: string; price: string;
  image: string; href: string; buttonLabel: string;
};

function TemplateCard({
  card, active, onSelect,
}: {
  card: TCard; active: boolean; onSelect: () => void;
}) {
  return (
    <article
      className="group w-[82vw] max-w-[300px] shrink-0 snap-start cursor-pointer overflow-hidden rounded-[1.5rem] border bg-white shadow-[0_8px_32px_rgba(44,31,14,0.09)] transition duration-300 hover:-translate-y-1 md:w-[255px]"
      style={{ borderColor: active ? "#d8b66a" : "rgba(201,168,90,0.25)" }}
      onClick={onSelect}
    >
      {/* Image */}
      <div className="relative overflow-hidden bg-[#efe4d4]" style={{ aspectRatio: "3/2" }}>
        <img
          src={card.image}
          alt={card.title}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
        {active && (
          <div className="absolute right-3 top-3 rounded-full bg-[#d8b66a] px-2.5 py-1 text-[10px] font-semibold text-[#10241b]">
            ✓
          </div>
        )}
      </div>

      {/* Card content */}
      <div className="p-4">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#c9a85a]">
          {card.tag}
        </p>
        <h3 className="text-[15px] font-semibold leading-snug text-[#14251d]" style={serifStyle}>
          {card.title}
        </h3>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-[#173c2d]">{card.price}</span>
          <a
            href={card.href}
            className="shrink-0 rounded-full bg-[#173c2d] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[#0f2a1e]"
            onClick={(e) => e.stopPropagation()}
          >
            {card.buttonLabel}
          </a>
        </div>
      </div>
    </article>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function HomepagePrototype() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState(0);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [showSaleWheel, setShowSaleWheel] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [plannerVisible, setPlannerVisible] = useState(false);
  const plannerRef  = useRef<HTMLDivElement>(null);

  // Live config from translations-prototype / localStorage, then server
  const [cfg, setCfg] = useState(() => loadHomepageContent());
  useEffect(() => {
    // Fetch authoritative content from server (overrides localStorage defaults for all visitors)
    fetchHomepageContentFromServer().then(serverContent => {
      if (serverContent) {
        setCfg(serverContent);
        saveHomepageContent(serverContent);
      }
    });
  }, []);
  useEffect(() => {
    const refresh = () => setCfg(loadHomepageContent());
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "homepage_content_prototype_v1") refresh();
    };
    window.addEventListener("homepage-content-updated", refresh);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("homepage-content-updated", refresh);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  // ─── Derived data (always hy locale) ────────────────────────────────────
  const navItems = cfg.navigation.items
    .filter(i => i.visible)
    .map(i => ({ label: i.label.hy, href: i.href }));

  const heroChips = cfg.hero.chips
    .filter(c => c.visible)
    .map(c => c.label.hy);

  const benefitItems = cfg.benefits
    .filter(b => b.visible)
    .map(b => ({
      icon: b.icon,
      title: b.title.hy,
      text: b.text.hy,
    }));

  const steps = cfg.howItWorks.steps
    .filter(s => s.visible)
    .map(s => ({
      number: s.number,
      icon: s.icon,
      title: s.title.hy,
      text: s.text.hy,
    }));

  const templateCards = cfg.templates.items
    .filter(t => t.visible)
    .map(t => ({
      title: t.name.hy,
      tag: t.tag.hy,
      price: t.price.hy,
      image: t.image,
      href: t.href,
      buttonLabel: t.buttonLabel.hy,
    }));

  const featureItems = cfg.features.items
    .filter(f => f.visible)
    .map(f => ({
      icon: f.icon,
      title: f.title.hy,
    }));

  const trustItems = cfg.footer.trustItems
    .filter(t => t.visible)
    .map(t => ({
      icon: t.icon,
      title: t.title.hy,
      text: t.text.hy,
    }));

  const faqItems      = cfg.faq.items.filter(f => f.visible);
  const contactBtns   = cfg.contact.buttons.filter(b => b.visible);
  const mobileActions = cfg.mobileExperience.actions.filter(a => a.visible);

  const plannerFeatures = cfg.plannerShowcase.features
    .filter(f => f.visible)
    .map(f => ({ id: f.id, icon: f.icon, title: f.title.hy, text: f.text.hy }));

  // ─── Carousel: IntersectionObserver drives active dot ───────────────────
  useEffect(() => {
    const track = carouselRef.current;
    if (!track) return;
    const cards = Array.from(track.children) as HTMLElement[];
    if (!cards.length) return;

    const observers = cards.map((card, idx) => {
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            setActiveTemplate(idx);
          }
        },
        { root: track, threshold: 0.5 },
      );
      obs.observe(card);
      return obs;
    });

    return () => observers.forEach(o => o.disconnect());
  }, [templateCards.length]);

  // ─── Planner section: trigger animation on scroll into view ─────────────
  useEffect(() => {
    const el = plannerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setPlannerVisible(true); },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const scrollToCard = (index: number) => {
    const track = carouselRef.current;
    const card  = track?.children[index] as HTMLElement | undefined;
    if (!track || !card) return;
    track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: "smooth" });
  };

  const prevCard = () => {
    const next = activeTemplate === 0 ? templateCards.length - 1 : activeTemplate - 1;
    setActiveTemplate(next);
    scrollToCard(next);
  };

  const nextCard = () => {
    const next = activeTemplate === templateCards.length - 1 ? 0 : activeTemplate + 1;
    setActiveTemplate(next);
    scrollToCard(next);
  };

  return (
    <div className="overflow-x-hidden bg-[#fff8ef] text-[#18241d]" style={sansStyle}>
      <style>{`
        .hp-carousel::-webkit-scrollbar { display: none; }
        @keyframes ppsDashFloat { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-8px); } }
        @keyframes ppsBadgeIn { from { opacity:0; transform:scale(0.72); } to { opacity:1; transform:scale(1); } }
        @keyframes ppsTgPulse { 0%,100% { box-shadow:0 0 0 0 rgba(52,211,153,0.4); } 60% { box-shadow:0 0 0 7px rgba(52,211,153,0); } }
        @keyframes ppsBarGrow { from { width:0; } to { width:var(--bar-w,60%); } }
        .pps-fade { opacity:0; transform:translateY(22px); transition:opacity .6s ease,transform .6s ease; }
        .pps-fade.pps-vis { opacity:1; transform:translateY(0); }
        @media (prefers-reduced-motion: reduce) {
          .pps-fade { transition:none; opacity:1; transform:none; }
        }
      `}</style>

      {/* ─── HEADER ────────────────────────────────────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#d8b66a]/20 bg-[#0e2119]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="/homepage-prototype" className="flex items-center gap-2.5 text-white" aria-label="4ever.am">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d8b66a]/40 bg-[#d8b66a]/10">
              <Heart className="h-4 w-4 fill-[#d8b66a] text-[#d8b66a]" />
            </span>
            <span className="text-lg font-semibold tracking-wide" style={serifStyle}>4ever.am</span>
          </a>

          <nav className="hidden items-center gap-7 lg:flex" aria-label="Գլխավոր բաժիններ">
            {navItems.map(item => (
              <a key={item.href} href={item.href} className="text-sm text-white/80 transition hover:text-[#f0cf82]">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <a href={cfg.navigation.loginHref} className="text-sm font-medium text-white/70 transition hover:text-white">
              {cfg.navigation.loginLabel.hy}
            </a>
            <a
              href={cfg.hero.primaryCta.href}
              className="rounded-full bg-[#d8b66a] px-5 py-2.5 text-sm font-semibold text-[#10241b] shadow-[0_8px_24px_rgba(216,182,106,0.2)] transition hover:-translate-y-0.5 hover:bg-[#edcf8c]"
            >
              {cfg.navigation.startLabel.hy}
            </a>
          </div>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white lg:hidden"
            onClick={() => setMobileMenuOpen(v => !v)}
            aria-label="Բացել ընտրացանկը"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-[#d8b66a]/20 bg-[#0e2119] px-4 pb-6 pt-2 lg:hidden">
            <nav className="mx-auto flex max-w-md flex-col" aria-label="Բջջային ընտրացանկ">
              {navItems.map(item => (
                <a
                  key={item.href}
                  href={item.href}
                  className="border-b border-white/10 py-3.5 text-base text-white/80"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <div className="grid grid-cols-2 gap-3 pt-5">
                <a
                  href={cfg.navigation.loginHref}
                  className="rounded-full border border-[#d8b66a]/40 py-3 text-center text-sm font-medium text-[#f0cf82]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {cfg.navigation.loginLabel.hy}
                </a>
                <a
                  href={cfg.hero.primaryCta.href}
                  className="rounded-full bg-[#d8b66a] py-3 text-center text-sm font-semibold text-[#10241b]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {cfg.navigation.startLabel.hy}
                </a>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main>
        {/* ─── HERO ────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-[#0e1e17] pt-16">
          <img
            src={cfg.hero.backgroundImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-80"
            style={{ objectPosition: "58% center" }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,14,10,0.72),rgba(8,21,15,0.72)_48%,rgba(6,17,12,0.96)_100%)] lg:bg-[linear-gradient(90deg,rgba(6,18,13,0.96),rgba(10,26,19,0.82)_42%,rgba(10,26,19,0.38)_100%)]" />

          {/* ── Mobile layout (< lg) ── */}
          <div className="relative z-10 px-4 pb-16 pt-10 lg:hidden">
            <div className="mx-auto w-full max-w-[390px]">
              <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#f0cf82]">
                <Heart className="h-3.5 w-3.5 shrink-0 fill-[#f0cf82]" />
                {cfg.hero.eyebrow.hy}
              </div>

              <h1 className="max-w-[340px] text-[2rem] font-semibold leading-[1.07] text-white" style={serifStyle}>
                {cfg.hero.title.hy}{" "}
                <span className="text-[#f0cf82]">{cfg.hero.titleHighlight.hy}</span>
                {cfg.hero.titleSuffix.hy ? <> {cfg.hero.titleSuffix.hy}</> : null}
              </h1>

              <p className="mt-3 max-w-[340px] text-[13px] leading-6 text-white/80">
                {cfg.hero.subtitle.hy}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <a
                  href={cfg.hero.primaryCta.href}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#f0cf82] px-5 py-2.5 text-sm font-semibold text-[#10241b] shadow-[0_12px_28px_rgba(216,182,106,0.28)]"
                >
                  {cfg.hero.primaryCta.label.hy}
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </a>
                <a
                  href={cfg.hero.secondaryCta.href}
                  className="text-sm font-semibold text-white underline decoration-[#f0cf82]/60 underline-offset-4"
                >
                  {cfg.hero.secondaryCta.label.hy}
                </a>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {heroChips.map(chip => (
                  <span
                    key={chip}
                    className="rounded-full border border-[#f0cf82]/40 bg-white/[0.08] px-3 py-1.5 text-[11px] font-semibold text-white/90 backdrop-blur"
                  >
                    {chip}
                  </span>
                ))}
              </div>

              {/* Phone preview — sits below CTA, fully contained in hero */}
              <div className="mt-8 flex justify-center">
                <PhonePreview size="mobile" />
              </div>
            </div>
          </div>

          {/* ── Desktop layout (≥ lg) ── */}
          <div className="relative z-10 mx-auto hidden min-h-[calc(100svh-4rem)] w-full max-w-7xl items-center gap-16 px-8 py-20 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="max-w-xl">
              <div className="mb-5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f0cf82]">
                <Heart className="h-3.5 w-3.5 fill-[#f0cf82]" />
                {cfg.hero.eyebrow.hy}
              </div>

              <h1 className="text-[clamp(2.8rem,5.2vw,4.7rem)] font-semibold leading-[1.0] text-white" style={serifStyle}>
                {cfg.hero.title.hy}{" "}
                <span className="text-[#f0cf82]">{cfg.hero.titleHighlight.hy}</span>
                {cfg.hero.titleSuffix.hy ? <> {cfg.hero.titleSuffix.hy}</> : null}
              </h1>

              <p className="mt-5 max-w-lg text-[17px] leading-[1.75] text-white/80">
                {cfg.hero.subtitle.hy}
              </p>

              <div className="mt-7 flex gap-3">
                <a
                  href={cfg.hero.primaryCta.href}
                  className="inline-flex min-h-[52px] items-center gap-2 rounded-full bg-[#f0cf82] px-6 py-3 text-base font-semibold text-[#10241b] shadow-[0_16px_36px_rgba(216,182,106,0.26)] transition hover:-translate-y-0.5 hover:bg-[#f7dda4]"
                >
                  {cfg.hero.primaryCta.label.hy}
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </a>
                <a
                  href={cfg.hero.secondaryCta.href}
                  className="inline-flex min-h-[52px] items-center rounded-full border border-white/40 bg-white/10 px-6 py-3 text-base font-semibold text-white backdrop-blur transition hover:bg-white/20"
                >
                  {cfg.hero.secondaryCta.label.hy}
                </a>
              </div>

              <div className="mt-8 grid max-w-[480px] grid-cols-2 gap-3">
                {benefitItems.map(({ icon, title, text }) => (
                  <div key={title} className="flex items-start gap-2.5 rounded-2xl border border-white/10 bg-white/[0.055] p-3 backdrop-blur">
                    <Ic name={icon} className="mt-0.5 h-4 w-4 shrink-0 text-[#f0cf82]" />
                    <div>
                      <p className="text-[12px] font-semibold leading-snug text-white">{title}</p>
                      <p className="mt-0.5 text-[11px] leading-snug text-white/60">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end">
              <PhonePreview size="desktop" />
            </div>
          </div>
        </section>

        {/* ─── TEMPLATES ───────────────────────────────────────────────────── */}
        <section
          id="templates"
          className="relative z-20 -mt-8 rounded-t-[2rem] bg-[#fff8ef] px-4 py-12 sm:px-6 sm:py-20 lg:mt-0 lg:rounded-none lg:px-8 lg:py-24"
        >
          <div className="mx-auto max-w-7xl">
            <SectionHeading eyebrow={cfg.templates.eyebrow.hy} title={cfg.templates.title.hy} compact />

            <div className="relative">
              <button
                type="button"
                onClick={prevCard}
                className="absolute -left-3 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#d8b66a]/40 bg-white text-[#173c2d] shadow-lg transition hover:-translate-x-0.5 md:flex"
                aria-label="Նախորդ"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div
                ref={carouselRef}
                className="hp-carousel -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-7 md:gap-5"
                style={{ scrollbarWidth: "none" }}
              >
                {templateCards.map((card, index) => (
                  <TemplateCard
                    key={card.title + String(index)}
                    card={card}
                    active={index === activeTemplate}
                    onSelect={() => { setActiveTemplate(index); scrollToCard(index); }}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={nextCard}
                className="absolute -right-3 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#d8b66a]/40 bg-white text-[#173c2d] shadow-lg transition hover:translate-x-0.5 md:flex"
                aria-label="Հաջորդ"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Dots — updated by IntersectionObserver on swipe, also clickable */}
            <div className="mt-1 flex justify-center gap-2">
              {templateCards.map((card, index) => (
                <button
                  key={card.title + String(index)}
                  type="button"
                  onClick={() => { setActiveTemplate(index); scrollToCard(index); }}
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: index === activeTemplate ? 28 : 8,
                    background: index === activeTemplate ? "#c9a85a" : "rgba(201,168,90,0.35)",
                  }}
                  aria-label={`${card.title} ընտրել`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ─── PLANNER SHOWCASE ────────────────────────────────────────── */}
        <section
          id="planner-showcase"
          className="relative overflow-hidden bg-[#0b1d14] px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
          ref={plannerRef}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,#d8b66a,transparent)]" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,#d8b66a,transparent)]" />

          <div className="mx-auto max-w-7xl">
            <div className="lg:grid lg:grid-cols-[minmax(0,300px)_1fr] lg:items-center lg:gap-14 xl:gap-20">

              {/* Left: Eyebrow / title / subtitle / CTAs */}
              <div className={`pps-fade ${plannerVisible ? "pps-vis" : ""}`} style={{ transitionDelay: "0.05s" }}>
                <div className="mb-3 flex items-center gap-3">
                  <span className="h-px w-8 bg-[#c9a85a]" />
                  <Heart className="h-4 w-4 fill-[#c9a85a] text-[#c9a85a]" />
                  <span className="h-px w-8 bg-[#c9a85a]" />
                </div>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c9a85a] sm:text-[11px]">
                  {cfg.plannerShowcase.eyebrow.hy}
                </p>
                <h2
                  className="mb-5 font-semibold leading-[1.08] text-[clamp(1.75rem,5vw,2.8rem)] text-[#fffaf0]"
                  style={serifStyle}
                >
                  {cfg.plannerShowcase.title.hy}
                </h2>
                <p className="mb-8 text-[14px] leading-7 text-white/60">
                  {cfg.plannerShowcase.subtitle.hy}
                </p>

                <div className="flex flex-wrap gap-3">
                  {cfg.plannerShowcase.primaryCta.visible && (
                    <a
                      href={cfg.plannerShowcase.primaryCta.href}
                      className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[#f0cf82] px-6 py-2.5 text-sm font-semibold text-[#10241b] shadow-[0_12px_28px_rgba(216,182,106,0.22)] transition hover:-translate-y-0.5 hover:bg-[#f7dda4]"
                    >
                      {cfg.plannerShowcase.primaryCta.label.hy}
                      <ArrowRight className="h-4 w-4 shrink-0" />
                    </a>
                  )}
                  {cfg.plannerShowcase.secondaryCta.visible && (
                    <a
                      href={cfg.plannerShowcase.secondaryCta.href}
                      className="inline-flex min-h-[48px] items-center rounded-full border border-white/25 bg-white/[0.08] px-6 py-2.5 text-sm font-semibold text-white/80 backdrop-blur transition hover:bg-white/[0.14]"
                    >
                      {cfg.plannerShowcase.secondaryCta.label.hy}
                    </a>
                  )}
                </div>
              </div>

              {/* Right: chip columns + tablet mockup */}
              <div className={`pps-fade ${plannerVisible ? "pps-vis" : ""} mt-12 lg:mt-0`} style={{ transitionDelay: "0.18s" }}>

                {/* Desktop: chip columns flanking the tablet */}
                <div className="hidden lg:flex lg:items-center lg:justify-center lg:gap-5">
                  <div className="flex w-[128px] shrink-0 flex-col gap-3">
                    {plannerFeatures.slice(0, 3).map(({ id, icon, title, text }, i) => (
                      <div
                        key={id}
                        className={`pps-fade ${plannerVisible ? "pps-vis" : ""} flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.05] p-3 backdrop-blur`}
                        style={{ transitionDelay: `${0.3 + i * 0.1}s` }}
                      >
                        <Ic name={icon} className="h-4 w-4 text-[#c9a85a]" />
                        <p className="text-[11px] font-semibold leading-tight text-white/90">{title}</p>
                        <p className="text-[10px] leading-snug text-white/45">{text}</p>
                      </div>
                    ))}
                  </div>

                  <div className="shrink-0">
                    <PlannerTabletDashboard visible={plannerVisible} />
                  </div>

                  <div className="flex w-[128px] shrink-0 flex-col gap-3">
                    {plannerFeatures.slice(3, 6).map(({ id, icon, title, text }, i) => (
                      <div
                        key={id}
                        className={`pps-fade ${plannerVisible ? "pps-vis" : ""} flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.05] p-3 backdrop-blur`}
                        style={{ transitionDelay: `${0.35 + i * 0.1}s` }}
                      >
                        <Ic name={icon} className="h-4 w-4 text-[#c9a85a]" />
                        <p className="text-[11px] font-semibold leading-tight text-white/90">{title}</p>
                        <p className="text-[10px] leading-snug text-white/45">{text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mobile: tablet centered then feature grid */}
                <div className="lg:hidden">
                  <PlannerTabletDashboard visible={plannerVisible} />

                  <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {plannerFeatures.map(({ id, icon, title, text }, i) => (
                      <div
                        key={id}
                        className={`pps-fade ${plannerVisible ? "pps-vis" : ""} flex flex-col gap-1.5 rounded-2xl border border-white/10 bg-white/[0.05] p-3.5`}
                        style={{ transitionDelay: `${0.15 + i * 0.07}s` }}
                      >
                        <Ic name={icon} className="h-5 w-5 text-[#c9a85a]" />
                        <p className="text-[12px] font-semibold leading-snug text-white/90">{title}</p>
                        <p className="text-[11px] leading-snug text-white/50">{text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── HOW IT WORKS ────────────────────────────────────────────────── */}
        <section id="how-it-works" className="bg-[#f6ecdd] px-4 py-12 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-6xl">
            <SectionHeading eyebrow={cfg.howItWorks.eyebrow.hy} title={cfg.howItWorks.title.hy} compact />
            <div className="relative grid gap-0 md:grid-cols-3 md:gap-5">
              <div className="absolute left-[16%] right-[16%] top-11 hidden h-px bg-[linear-gradient(90deg,transparent,#d2b36d,transparent)] md:block" />
              {steps.map(({ number, icon, title, text }, index) => (
                <article
                  key={number}
                  className={`relative grid grid-cols-[44px_minmax(0,1fr)] gap-3 py-4 text-left md:block md:rounded-2xl md:border md:border-[#e4d1b1] md:bg-white/80 md:p-6 md:text-center md:shadow-[0_22px_55px_rgba(60,40,15,0.07)] ${
                    index < steps.length - 1 ? "border-b border-[#d8b66a]/30 md:border-b-[#e4d1b1]" : ""
                  }`}
                >
                  <div className="relative flex justify-center md:hidden">
                    <span className="text-sm font-semibold tracking-[0.12em] text-[#c9a85a]">{number}</span>
                  </div>
                  <div className="hidden md:mx-auto md:mb-5 md:flex md:h-20 md:w-20 md:items-center md:justify-center md:rounded-full md:border md:border-[#d8b66a]/40 md:bg-[#fff8ef] md:text-[#c9a85a]">
                    <Ic name={icon} className="h-7 w-7" />
                    <span className="absolute right-[calc(50%-46px)] top-6 rounded-full bg-[#173c2d] px-2 py-1 text-[10px] font-semibold text-[#f0cf82]">
                      {number}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-[16px] font-semibold text-[#14251d] md:text-lg" style={serifStyle}>{title}</h3>
                    <p className="mt-1.5 text-[13px] leading-5 text-[#71685f] md:mt-3 md:text-sm md:leading-6">{text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FEATURES ────────────────────────────────────────────────────── */}
        <section id="features" className="relative overflow-hidden bg-[#0f2d22] px-4 py-12 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,#d8b66a,transparent)]" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,#d8b66a,transparent)]" />
          <div className="mx-auto max-w-7xl">
            <SectionHeading eyebrow={cfg.features.eyebrow.hy} title={cfg.features.title.hy} inverse compact />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {featureItems.map(({ icon, title }) => (
                <article
                  key={title}
                  className="rounded-[1.25rem] border border-[#d8b66a]/20 bg-white/[0.045] p-4 text-center transition hover:-translate-y-1 hover:bg-white/[0.075]"
                >
                  <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#d8b66a]/20 text-[#f0cf82]">
                    <Ic name={icon} className="h-5 w-5" />
                  </div>
                  <h3 className="text-[14px] font-semibold leading-snug text-white">{title}</h3>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ─── GUEST EXPERIENCE ────────────────────────────────────────────── */}
        <section id="guest-experience" className="bg-[#f6ecdd] px-4 py-12 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[420px_minmax(0,1fr)] lg:gap-16">
            <div className="relative mx-auto w-full max-w-[360px]">
              <div className="overflow-hidden rounded-[1.8rem] border border-[#e2cfaa] bg-white shadow-[0_28px_75px_rgba(41,25,10,0.13)]">
                <img
                  src="/attached_assets/Blog_Banner_Left_Hand_Story_1755890185205.webp"
                  alt=""
                  className="h-64 w-full object-cover sm:h-80"
                />
                <div className="p-4 sm:p-5">
                  <div className="rounded-2xl border border-[#e8d9bd] bg-[#fffaf3] p-4 shadow-sm">
                    <p className="text-sm font-semibold text-[#173c2d]">Համաձայն եք ներկա գտնվել</p>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-[#18241d]">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-[#c9a85a]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#c9a85a]" />
                        </span>
                        Կգամ հաճույքով
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#7b6b5b]">
                        <span className="h-4 w-4 rounded-full border-2 border-[#d6cec2]" />
                        Ցավոք չեմ կարող գալ
                      </div>
                    </div>
                    <div className="mt-4 rounded-xl border border-[#e3d8ca] bg-white px-3 py-2 text-sm text-[#998c7c]">
                      Հյուրերի անուններ
                    </div>
                    <button type="button" className="mt-3 w-full rounded-full bg-[#173c2d] px-4 py-3 text-sm font-semibold text-white">
                      Ուղարկել պատասխան
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center lg:text-left">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c9a85a] sm:text-[11px]">
                {cfg.mobileExperience.eyebrow.hy}
              </p>
              <h2 className="text-[clamp(1.85rem,7vw,4.1rem)] font-semibold leading-[1.03] text-[#14251d]" style={serifStyle}>
                {cfg.mobileExperience.title.hy}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-[15px] leading-7 text-[#71685f] sm:text-lg lg:mx-0">
                {cfg.mobileExperience.subtitle.hy}
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3 lg:justify-start">
                {mobileActions.map(action => (
                  <span key={action.id} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[#173c2d] shadow-sm">
                    <Ic name={action.icon} className="h-4 w-4 text-[#c9a85a]" />
                    {action.label.hy}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── FAQ ─────────────────────────────────────────────────────────── */}
        {faqItems.length > 0 && (
          <section className="bg-[#fff8ef] px-4 py-12 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
            <div className="mx-auto max-w-3xl">
              <SectionHeading eyebrow={cfg.faq.eyebrow.hy} title={cfg.faq.title.hy} compact />
              <div className="flex flex-col gap-3">
                {faqItems.map(item => (
                  <div key={item.id} className="overflow-hidden rounded-2xl border border-[#e4d1b1] bg-white">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-5 py-4 text-left"
                      onClick={() => setOpenFaq(openFaq === item.id ? null : item.id)}
                    >
                      <span className="pr-4 text-[14px] font-semibold text-[#14251d]">{item.question.hy}</span>
                      <ChevronDown
                        className="h-5 w-5 shrink-0 text-[#c9a85a] transition-transform duration-200"
                        style={{ transform: openFaq === item.id ? "rotate(180deg)" : "none" }}
                      />
                    </button>
                    {openFaq === item.id && (
                      <div className="border-t border-[#e4d1b1]/60 px-5 pb-5 pt-4 text-[13px] leading-6 text-[#71685f]">
                        {item.answer.hy}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── CONTACT ─────────────────────────────────────────────────────── */}
        <section id="contact" className="bg-[#10251c] px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#f0cf82] sm:text-[11px]">
              {cfg.contact.eyebrow.hy}
            </p>
            <h2 className="text-[clamp(1.55rem,5vw,2.65rem)] font-semibold leading-tight text-white" style={serifStyle}>
              {cfg.contact.title.hy}
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-white/70 sm:text-base">
              {cfg.contact.subtitle.hy}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {contactBtns.map(btn => (
                <a
                  key={btn.id}
                  href={btn.href}
                  className={`inline-flex min-h-[48px] items-center gap-2.5 rounded-full px-6 py-3 text-sm font-semibold transition hover:-translate-y-0.5 ${
                    btn.icon === "arrow"
                      ? "bg-[#f0cf82] text-[#10241b] shadow-[0_12px_32px_rgba(216,182,106,0.22)]"
                      : "border border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/20"
                  }`}
                >
                  <Ic name={btn.icon} className="h-4 w-4" />
                  {btn.label.hy}
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ─── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#d8b66a]/20 bg-[#fff8ef] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {trustItems.map(({ icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-[#e4d1b1] bg-white/70 p-4">
                <Ic name={icon} className="mb-3 h-5 w-5 text-[#c9a85a]" />
                <p className="text-sm font-semibold text-[#14251d]">{title}</p>
                <p className="mt-1 text-xs leading-5 text-[#71685f]">{text}</p>
              </div>
            ))}
          </div>

          <div className="mt-7 flex flex-col items-center justify-between gap-3 border-t border-[#d8b66a]/20 pt-6 text-center sm:flex-row sm:text-left">
            <div className="flex items-center gap-2.5">
              <Heart className="h-4 w-4 fill-[#c9a85a] text-[#c9a85a]" />
              <span className="font-semibold text-[#14251d]" style={serifStyle}>4ever.am</span>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-xs text-[#71685f]">
              <span>{cfg.footer.email}</span>
              <span>{cfg.footer.phone}</span>
            </div>
            <p className="text-xs text-[#71685f]">{cfg.footer.copyright.hy}</p>
          </div>
        </div>
      </footer>

      {/* ─── SPIN & WIN floating button ─────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setShowSaleWheel(true)}
        className="fixed bottom-6 right-5 z-40 flex items-center gap-2 rounded-full font-semibold transition hover:-translate-y-0.5 active:scale-95"
        style={{
          padding: "11px 20px",
          background: "linear-gradient(135deg, #d8b66a, #c9a030)",
          color: "#0e1e15",
          boxShadow: "0 8px 28px rgba(216,182,106,0.4)",
          fontSize: 13,
          letterSpacing: "0.02em",
        }}
        aria-label="Spin & Win"
      >
        <Gift className="h-4 w-4 shrink-0" />
        Spin & Win
      </button>

      {showSaleWheel && <SaleWheelModal onClose={() => setShowSaleWheel(false)} />}
    </div>
  );
}
