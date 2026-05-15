# Code Changes Report — 4ever.am — May 15, 2026

---

## 1. `client/src/features/demo-editor/demoPalettes.ts`

### Change: 10 dark palettes inserted at top of `DEMO_PALETTES` array

The two structural comment dividers and the 10 new entries were added. Nothing else in the file was touched.

```diff
 export const DEMO_PALETTES: DemoPalette[] = [
+  // ─── Dark / Moody ────────────────────────────────────────────────────────────
+  {
+    id: "david-rose",
+    name: "David & Rose",
+    mood: "Classic dark wine",
+    colors: { primary: "#5B2333", secondary: "#a3917b", accent: "#b9b1a7", background: "#F9F7F6", textColor: "#2a0e18", buttonColor: "#5B2333" },
+  },
+  {
+    id: "dark-velvet",
+    name: "Dark Velvet",
+    mood: "Deep burgundy noir",
+    colors: { primary: "#c8a882", secondary: "#a3917b", accent: "#d4b896", background: "#1a0a0e", textColor: "#f5ede4", buttonColor: "#c8a882" },
+  },
+  {
+    id: "black-onyx",
+    name: "Black Onyx",
+    mood: "Dramatic black & gold",
+    colors: { primary: "#d4af37", secondary: "#b8960c", accent: "#f0c040", background: "#0d0d0d", textColor: "#f5f0e0", buttonColor: "#d4af37" },
+  },
+  {
+    id: "obsidian-rose",
+    name: "Obsidian Rose",
+    mood: "Moody dark romance",
+    colors: { primary: "#e8c4b8", secondary: "#c9a090", accent: "#f5ddd5", background: "#160d0b", textColor: "#f5ede4", buttonColor: "#c9a090" },
+  },
+  {
+    id: "noir-plum",
+    name: "Noir Plum",
+    mood: "Dark purple evening",
+    colors: { primary: "#c4a7d4", secondary: "#8b6b9e", accent: "#e0c8f0", background: "#100a14", textColor: "#f0e8f8", buttonColor: "#8b6b9e" },
+  },
+  {
+    id: "dark-forest-gold",
+    name: "Dark Forest",
+    mood: "Deep woodland dusk",
+    colors: { primary: "#c8b87a", secondary: "#7a6e52", accent: "#e0d09a", background: "#0d1208", textColor: "#f0ead8", buttonColor: "#c8b87a" },
+  },
+  {
+    id: "espresso-cream",
+    name: "Espresso Cream",
+    mood: "Rich warm darkness",
+    colors: { primary: "#d4b896", secondary: "#9c7c5c", accent: "#ecd8bc", background: "#1c1009", textColor: "#f5ede0", buttonColor: "#9c7c5c" },
+  },
+  {
+    id: "slate-ivory",
+    name: "Slate Ivory",
+    mood: "Cool charcoal luxury",
+    colors: { primary: "#e8e0d4", secondary: "#9a9488", accent: "#f0e8dc", background: "#1a1a1e", textColor: "#f0ece4", buttonColor: "#9a9488" },
+  },
+  {
+    id: "deep-wine",
+    name: "Deep Wine",
+    mood: "Velvety dark crimson",
+    colors: { primary: "#f5ddd5", secondary: "#c09080", accent: "#f8ece4", background: "#2a0a10", textColor: "#faf0ec", buttonColor: "#c09080" },
+  },
+  {
+    id: "dark-sage",
+    name: "Dark Sage",
+    mood: "Dusky garden evening",
+    colors: { primary: "#b8d4b0", secondary: "#7a9c74", accent: "#d0e8c8", background: "#0a140c", textColor: "#e8f4e4", buttonColor: "#7a9c74" },
+  },
+  // ─── Light / Romantic ────────────────────────────────────────────────────────
   {
     id: "romantic-rose",
     ...
```

---

## 2. `client/src/App.tsx`

### Change: Added `HomePage` import + updated `"/"` route

**Line 18 — import added:**
```diff
 import MainPage from "@/pages/main";
+import HomePage from "@/pages/HomePage";
```

**Line 49 — route updated:**
```diff
-      <Route path="/" component={MainPage} />
+      <Route path="/" component={HomePage} />
```

`MainPage` import remains on line 17 — it is still imported but no longer routed.

---

## 3. `client/src/pages/HomePage.tsx`

### Change: New file created (did not exist before)

Full component source as written. Note: Armenian Unicode text was corrupted during the PowerShell write (encoding issue — see Work Report). The structure, layout, and logic are correct; only visible string content needs to be re-entered as proper Unicode.

```tsx
/**
 * HomePage.tsx
 *
 * Redesigned public homepage for 4ever.am.
 * All visible text is in Armenian. Mobile-first layout.
 * Follows reference design (cinematic hero, deep green palette, luxury editorial).
 *
 * SCOPE: Homepage visual only. No backend, auth, templates, demo editor, or other routes touched.
 */

import { useState, useRef, useEffect } from "react";
import {
  ArrowRight,
  Menu,
  X,
  Smartphone,
  Share2,
  Edit3,
  CheckCircle,
  MapPin,
  Camera,
  Heart,
  MessageSquare,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { SiWhatsapp, SiInstagram, SiFacebook } from "react-icons/si";

// ── Template carousel data ────────────────────────────────────────────────────
const TEMPLATE_CARDS = [
  { id: "aurelia",  name: "Aurelia",          preview: "/template_previews/img1.webp", slug: "harut-tatev" },
  { id: "florence", name: "Florence Eternal", preview: "/template_previews/img2.webp", slug: "forest-lily-nature" },
  { id: "lucerne",  name: "Lucerne",          preview: "/template_previews/img3.webp", slug: "michael-sarah-classic" },
  { id: "amalfi",   name: "Amalfi",           preview: "/template_previews/img4.webp", slug: "alexander-isabella-elegant" },
  { id: "classic",  name: "Classic",          preview: "/template_previews/img5.webp", slug: "david-rose-romantic" },
  { id: "minimal",  name: "Minimal",          preview: "/template_previews/img1.webp", slug: "harut-tatev" },
] as const;

// ── Phone mockup component ────────────────────────────────────────────────────
function PhoneMockup() {
  return (
    <div className="relative mx-auto" style={{ width: "min(260px, 72vw)", maxWidth: 280 }}>
      {/* Ambient glow */}
      <div
        className="absolute inset-0 -z-10 rounded-full opacity-25"
        style={{
          background: "radial-gradient(circle, #D6B46D 0%, transparent 70%)",
          filter: "blur(40px)",
          transform: "scale(1.5)",
        }}
      />
      {/* Phone shell */}
      <div
        className="relative rounded-[2.5rem] shadow-2xl overflow-hidden"
        style={{ background: "#111", border: "6px solid #1c1c1c", aspectRatio: "9/19" }}
      >
        {/* Notch */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 z-10 rounded-b-xl"
          style={{ width: 80, height: 20, background: "#111" }}
        />
        {/* Screen */}
        <div className="absolute inset-0 flex flex-col overflow-hidden" style={{ background: "#F9F7F6" }}>
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 pt-6 pb-1">
            <span className="text-[8px] font-semibold" style={{ color: "#5B2333" }}>Ա &amp; Մ</span>
            <div className="w-4 h-px rounded" style={{ background: "#5B2333" }} />
          </div>
          {/* Couple photo */}
          <img
            src="/attached_assets/couple11.jpg"
            alt=""
            className="w-full object-cover flex-shrink-0"
            style={{ height: "40%", objectPosition: "center top" }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/attached_assets/floral-background1.jpg"; }}
          />
          {/* Info */}
          <div className="flex flex-col items-center px-3 py-2 gap-0.5">
            <p
              className="text-[10px] font-bold tracking-wider text-center"
              style={{ color: "#5B2333", fontFamily: "var(--armenian-serif, serif)" }}
            >
              ԱԼEՔS ԵՎ ՄARIA
            </p>
            <p className="text-[7px]" style={{ color: "#766C63" }}>12 • 07 • 2026</p>
            <p className="text-[7px]" style={{ color: "#766C63" }}>Լiч Кomo, Италіа</p>
            <button className="mt-1.5 text-[7px] text-white font-semibold rounded-full px-3 py-0.5" style={{ background: "#D6B46D" }}>
              RSVP
            </button>
            <div className="flex gap-2.5 mt-1.5">
              {([["134","Օр"],["12","Ժամ"],["51","Ր"],["48","Վ"]] as const).map(([n,l]) => (
                <div key={l} className="flex flex-col items-center">
                  <span className="text-[9px] font-bold" style={{ color: "#5B2333" }}>{n}</span>
                  <span className="text-[5px]" style={{ color: "#766C63" }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!carouselRef.current) return;
    const track = carouselRef.current;
    const card = track.children[carouselIndex] as HTMLElement | undefined;
    if (card) {
      track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: "smooth" });
    }
  }, [carouselIndex]);

  const prevCard = () => setCarouselIndex(i => (i > 0 ? i - 1 : TEMPLATE_CARDS.length - 1));
  const nextCard = () => setCarouselIndex(i => (i < TEMPLATE_CARDS.length - 1 ? i + 1 : 0));

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ background: "#FFF8EF", color: "#1C1712", fontFamily: "var(--armenian-sans, sans-serif)" }}
    >
      {/* ══ SECTION 1 — HEADER ══════════════════════════════════════════════ */}
      <header
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          background: "rgba(13,42,32,0.78)",
          borderBottom: "1px solid rgba(214,180,109,0.2)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2 flex-shrink-0">
              <Heart className="w-5 h-5" style={{ color: "#D6B46D" }} fill="#D6B46D" />
              <span className="text-lg font-bold tracking-wide" style={{ color: "#fff", fontFamily: "var(--armenian-serif, serif)" }}>
                4ever.am
              </span>
            </a>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-7">
              {[
                ["Կաղապարներ", "#templates"],
                ["Առավելություններ", "#features"],
                ["Օրինակներ", "#examples"],
                ["Գներ", "#pricing"],
                ["Բլոգ", "#blog"],
              ].map(([label, href]) => (
                <a key={href} href={href} className="text-sm transition-colors hover:text-amber-300" style={{ color: "rgba(255,255,255,0.82)" }}>
                  {label}
                </a>
              ))}
            </nav>

            {/* Desktop right actions */}
            <div className="hidden md:flex items-center gap-3">
              <a href="#contact" className="text-sm transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.7)" }}>
                Մուտք
              </a>
              <a href="#contact" className="text-sm font-semibold px-4 py-2 rounded-lg transition-all hover:brightness-110" style={{ background: "#D6B46D", color: "#0D2A20" }}>
                Սկսել
              </a>
            </div>

            {/* Mobile hamburger */}
            <button className="md:hidden p-2 rounded-lg" style={{ color: "#fff" }} onClick={() => setMobileMenuOpen(v => !v)} aria-label="Ցանկ">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden" style={{ background: "#0D2A20", borderTop: "1px solid rgba(214,180,109,0.2)" }}>
            <div className="px-5 pt-4 pb-6 flex flex-col gap-1">
              {[
                ["Կաղապարներ", "#templates"],
                ["Առավելություններ", "#features"],
                ["Օրինակներ", "#examples"],
                ["Գներ", "#pricing"],
                ["Բլոգ", "#blog"],
              ].map(([label, href]) => (
                <a
                  key={href} href={href}
                  className="text-base py-3 border-b"
                  style={{ color: "rgba(255,255,255,0.85)", borderColor: "rgba(214,180,109,0.1)" }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {label}
                </a>
              ))}
              <div className="flex gap-3 pt-4">
                <a href="#contact" className="flex-1 text-center py-3 rounded-xl text-sm" style={{ border: "1.5px solid rgba(214,180,109,0.45)", color: "#D6B46D" }} onClick={() => setMobileMenuOpen(false)}>
                  Մուտք
                </a>
                <a href="#contact" className="flex-1 text-center py-3 rounded-xl text-sm font-semibold" style={{ background: "#D6B46D", color: "#0D2A20" }} onClick={() => setMobileMenuOpen(false)}>
                  Սկսել
                </a>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ══ SECTION 2 — HERO ════════════════════════════════════════════════ */}
      <section id="hero" className="relative flex items-center" style={{ minHeight: "100vh", paddingTop: 64 }}>
        {/* Cinematic background */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img src="/attached_assets/floral-background1.jpg" alt="" className="w-full h-full object-cover object-center" fetchPriority="high" draggable={false} />
          <div className="absolute inset-0" style={{ background: "rgba(10,24,18,0.62)" }} />
          <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none" style={{ background: "linear-gradient(to bottom, transparent, rgba(10,24,18,0.3))" }} />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

            {/* Left — copy */}
            <div className="flex-1 text-center lg:text-left">
              <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase mb-4 flex items-center justify-center lg:justify-start gap-2" style={{ color: "#D6B46D" }}>
                <Heart className="w-3 h-3" fill="#D6B46D" />
                ՍԻՐԱՀԱՐ ԶՈՒՅԳԵՐԻ ՀԱՄԱՐ
              </p>

              <h1
                className="mb-5 leading-[1.15]"
                style={{ fontFamily: "var(--armenian-serif, serif)", fontSize: "clamp(34px, 5.5vw, 70px)", fontWeight: 700, color: "#fff" }}
              >
                Ստեղծեք գեղեցիկ հարսանեկան կայք{" "}
                <span style={{ color: "#D6B46D" }}>ձեր հատուկ օրվա</span>{" "}
                համար
              </h1>

              <p className="mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed" style={{ fontSize: "clamp(14px, 1.8vw, 18px)", color: "rgba(255,255,255,0.78)" }}>
                Կիսվեք ձեր հրավիրատոմսով, սիրո պատմությամբ, լուսանկարներով,
                ամսաթվով, վայրով եւ RSVP ձեւով, մեկ էլեգանտ հղումով:
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-10">
                <a
                  href="#contact"
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold transition-all hover:brightness-110 hover:-translate-y-0.5 text-sm sm:text-base"
                  style={{ background: "#0D2A20", color: "#fff", minHeight: 52, boxShadow: "0 4px 20px rgba(13,42,32,0.5)" }}
                >
                  Ստեղծել իմ հարսանեկան կայքը
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="#templates"
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-medium transition-all hover:bg-white/10 text-sm sm:text-base"
                  style={{ border: "1.5px solid rgba(255,255,255,0.45)", color: "#fff", minHeight: 52 }}
                >
                  Դիտել կաղապարները
                </a>
              </div>

              <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto lg:mx-0">
                {[
                  { icon: Smartphone, title: "Հարմար է հեռախոսում",    sub: "Գեղեցիկ տեսք բոլոր սարքերում" },
                  { icon: CheckCircle, title: "RSVP-ն ներառված է",       sub: "Հյուրերի պատասխաններն ềé մեկ տեղում" },
                  { icon: Share2,      title: "Հեշտ է կիսվել",           sub: "Մեկ հղում, ամեն ինչի համար" },
                  { icon: Edit3,       title: "Դիզայնի փորձ պետք չè",   sub: "Շատ հեշտ է փոփոխել" },
                ].map(({ icon: Icon, title, sub }) => (
                  <div key={title} className="flex items-start gap-2.5">
                    <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#D6B46D" }} />
                    <div>
                      <p className="text-xs font-semibold leading-tight" style={{ color: "#fff" }}>{title}</p>
                      <p className="text-[11px] mt-0.5 leading-tight" style={{ color: "rgba(255,255,255,0.52)" }}>{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — phone mockup */}
            <div className="flex-shrink-0 flex justify-center lg:justify-end w-full lg:w-auto">
              <PhoneMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ══ SECTION 3 — HOW IT WORKS ════════════════════════════════════════ */}
      <section id="how-it-works" className="py-16 sm:py-24" style={{ background: "#F8F1E7" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-3" style={{ color: "#D6B46D" }}>● ● ●</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-widest uppercase" style={{ color: "#1C1712", fontFamily: "var(--armenian-serif, serif)" }}>
              ԻՆՉՊԵՍ Է ԱՇԽԱՏՈՒՄ
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 relative">
            <div className="hidden sm:block absolute top-[30px] left-[22%] right-[22%] h-px pointer-events-none" style={{ background: "linear-gradient(to right, transparent, rgba(214,180,109,0.45), rgba(214,180,109,0.45), transparent)" }} />
            {[
              { num: "01", icon: <Smartphone className="w-6 h-6" />, title: "Ընտրեք կաղապարը",     text: "Ընտրեք ձեր ոճին համապատասխան էլեգանտ դիզայն:" },
              { num: "02", icon: <Edit3 className="w-6 h-6" />,      title: "Ավելացրեք ձեր տվյalnerě", text: "Ավելացրեք պատmuthyune, lusankarnere, amsativе, vayre ev ayl mankramashner:" },
              { num: "03", icon: <Share2 className="w-6 h-6" />,     title: "Կիsvеq հyusneри hет",  text: "Ուղarkeq mek hghum ev skseq havоghel RSVP pataskhannere:" },
            ].map(({ num, icon, title, text }) => (
              <div key={num} className="flex flex-col items-center text-center px-2">
                <div className="relative mb-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-sm" style={{ background: "#fff", border: "2px solid rgba(214,180,109,0.35)" }}>
                    <span style={{ color: "#D6B46D" }}>{icon}</span>
                  </div>
                  <span className="absolute -top-1.5 -right-1.5 text-xs font-bold" style={{ color: "#D6B46D" }}>{num}</span>
                </div>
                <h3 className="text-base sm:text-lg font-semibold mb-2" style={{ color: "#1C1712", fontFamily: "var(--armenian-serif, serif)" }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#766C63" }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SECTION 4 — TEMPLATE CAROUSEL ══════════════════════════════════ */}
      <section id="templates" className="py-16 sm:py-24" style={{ background: "#FFF8EF" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-14">
            <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-3" style={{ color: "#D6B46D" }}>● ● ●</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-widest uppercase" style={{ color: "#1C1712", fontFamily: "var(--armenian-serif, serif)" }}>
              ԸՆՏՐԵՔ ՁԵՐ ՈՃԸ
            </h2>
          </div>
          <div className="relative">
            <button onClick={prevCard} className="hidden sm:flex absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full items-center justify-center shadow-md transition-all hover:scale-110" style={{ background: "#fff", border: "1.5px solid rgba(214,180,109,0.4)", color: "#0D2A20" }} aria-label="Նախorrdus">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div ref={carouselRef} className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4" style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}>
              {TEMPLATE_CARDS.map((card, idx) => (
                <div
                  key={card.id}
                  className="flex-shrink-0 snap-start rounded-2xl overflow-hidden group cursor-pointer transition-all duration-300 hover:-translate-y-1.5"
                  style={{ width: "min(220px, 76vw)", background: "#fff", border: idx === carouselIndex ? "2px solid #D6B46D" : "2px solid rgba(0,0,0,0.06)", boxShadow: idx === carouselIndex ? "0 8px 32px rgba(214,180,109,0.25)" : "0 4px 24px rgba(0,0,0,0.07)" }}
                  onClick={() => setCarouselIndex(idx)}
                >
                  <div className="relative overflow-hidden" style={{ aspectRatio: "9/16" }}>
                    <img src={card.preview} alt={card.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/attached_assets/floral-background1.jpg"; }} />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" style={{ background: "rgba(13,42,32,0.45)" }}>
                      <a href={`/${card.slug}`} className="text-sm font-semibold px-5 py-2 rounded-lg" style={{ background: "#D6B46D", color: "#0D2A20" }} onClick={e => e.stopPropagation()}>
                        Դիտel
                      </a>
                    </div>
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between">
                    <p className="text-sm font-semibold" style={{ color: "#1C1712" }}>{card.name}</p>
                    <a href={`/${card.slug}`} className="text-xs font-medium" style={{ color: "#D6B46D" }} onClick={e => e.stopPropagation()}>Դிtеl</a>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={nextCard} className="hidden sm:flex absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full items-center justify-center shadow-md transition-all hover:scale-110" style={{ background: "#fff", border: "1.5px solid rgba(214,180,109,0.4)", color: "#0D2A20" }} aria-label="Achord">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="flex justify-center items-center gap-2 mt-6">
            {TEMPLATE_CARDS.map((_, i) => (
              <button key={i} onClick={() => setCarouselIndex(i)} className="rounded-full transition-all duration-300" style={{ height: 8, width: i === carouselIndex ? 24 : 8, background: i === carouselIndex ? "#D6B46D" : "rgba(214,180,109,0.3)" }} aria-label={`Kaghapare ${i + 1}`} />
            ))}
          </div>
        </div>
      </section>

      {/* ══ SECTION 5 — DARK GREEN FEATURE BAND ════════════════════════════ */}
      <section id="features" className="py-16 sm:py-24 relative overflow-hidden" style={{ background: "#0D2A20" }}>
        <div className="absolute top-0 left-0 w-64 h-64 pointer-events-none" style={{ background: "radial-gradient(circle at top left, rgba(214,180,109,0.18), transparent 65%)" }} />
        <div className="absolute bottom-0 right-0 w-64 h-64 pointer-events-none" style={{ background: "radial-gradient(circle at bottom right, rgba(214,180,109,0.1), transparent 65%)" }} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-3" style={{ color: "#D6B46D" }}>● ● ●</p>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-widest uppercase" style={{ color: "#fff", fontFamily: "var(--armenian-serif, serif)" }}>
              ԱՄԵՆ ԻՆՉ՝ ԻՆՉ ՊԵՏՔ Է ՁԵՐ ՀՅՈՒՐԵՐԻՆ
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
            {[
              { icon: <Calendar className="w-7 h-7" />,       title: "Հarsdanekan mankramashnerе", sub: "Amsativ, zham ev tsragire" },
              { icon: <MapPin className="w-7 h-7" />,         title: "Vayr",                         sub: "Karez ev ugghutynner" },
              { icon: <CheckCircle className="w-7 h-7" />,    title: "RSVP",                         sub: "Heshtel aczajn pataskhannere" },
              { icon: <Camera className="w-7 h-7" />,         title: "Lusankarasaran",               sub: "Kishveq gegheczik paherov" },
              { icon: <Heart className="w-7 h-7" />,          title: "Mer patmutyune",               sub: "Dzer siro patmutyune" },
              { icon: <MessageSquare className="w-7 h-7" />,  title: "Maghтanckner",                 sub: "Hyusneri barem maghтancknere" },
            ].map(({ icon, title, sub }, i) => (
              <div key={i} className="flex flex-col items-center text-center p-4 rounded-xl transition-transform hover:-translate-y-1 duration-200" style={{ border: "1px solid rgba(214,180,109,0.15)", background: "rgba(255,255,255,0.03)" }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: "rgba(214,180,109,0.12)", color: "#D6B46D" }}>{icon}</div>
                <p className="text-xs sm:text-sm font-semibold mb-1 leading-snug" style={{ color: "#fff" }}>{title}</p>
                <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SECTION 6 — MOBILE GUEST EXPERIENCE ════════════════════════════ */}
      <section className="py-16 sm:py-24" style={{ background: "#F8F1E7" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            {/* Left — image + RSVP card overlay */}
            <div className="relative flex-shrink-0 w-full max-w-sm mx-auto lg:mx-0 rounded-2xl overflow-hidden shadow-xl" style={{ aspectRatio: "4/5" }}>
              <img src="/attached_assets/floral-background1.jpg" alt="" className="w-full h-full object-cover object-center" />
              <div className="absolute bottom-5 left-4 right-4 rounded-xl p-4 shadow-xl" style={{ background: "rgba(255,255,255,0.97)" }}>
                <p className="text-xs font-semibold mb-2.5" style={{ color: "#0D2A20" }}>Հamаdznayneq nerkа gtnvel</p>
                <div className="space-y-2 mb-3">
                  <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: "#1C1712" }}>
                    <div className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: "#D6B46D" }}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#D6B46D" }} />
                    </div>
                    Ekndrum em hachuyov
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: "#766C63" }}>
                    <div className="w-3.5 h-3.5 rounded-full border-2" style={{ borderColor: "#bbb" }} />
                    Cavok che kam karog
                  </label>
                </div>
                <input type="text" placeholder="Hyusneri anunе" readOnly className="w-full text-[11px] border rounded-lg px-2.5 py-1.5 outline-none mb-2.5" style={{ borderColor: "#e5e0d8", color: "#1C1712", background: "#faf7f2" }} />
                <button className="w-full py-2 rounded-lg text-xs font-semibold" style={{ background: "#0D2A20", color: "#fff" }}>
                  Ուղarkel pataskhan
                </button>
              </div>
            </div>
            {/* Right — copy */}
            <div className="flex-1 text-center lg:text-left">
              <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-3" style={{ color: "#D6B46D" }}>
                ՀARMAR E HERAКHOSOVM DІTELU HAMAR
              </p>
              <h2 className="mb-4 leading-snug" style={{ fontFamily: "var(--armenian-serif, serif)", fontSize: "clamp(22px, 4vw, 40px)", fontWeight: 700, color: "#1C1712" }}>
                Գegheczik փоrrharhutyun yuraкhanchyu herakhosum
              </h2>
              <p className="mb-8 leading-relaxed max-w-md mx-auto lg:mx-0" style={{ fontSize: "clamp(14px, 1.8vw, 17px)", color: "#766C63" }}>
                Dzer hyusnere karog en bacel hravere, tesnel bolor
                mankramashnere, gtnel vayre ev RSVP ugharkel anmijapes
                irenc herakhosum:
              </p>
              <div className="flex flex-wrap items-center gap-3 justify-center lg:justify-start">
                {[
                  { bg: "#25D366",                                                    icon: <SiWhatsapp className="w-4 h-4" />,  label: "WhatsApp"  },
                  { bg: "linear-gradient(135deg,#f09433,#e6683c,#dc2743,#bc1888)",  icon: <SiInstagram className="w-4 h-4" />, label: "Instagram" },
                  { bg: "#0866FF",                                                    icon: <SiFacebook className="w-4 h-4" />,  label: "Messenger" },
                ].map(({ bg, icon, label }) => (
                  <div key={label} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white" style={{ background: bg }}>
                    {icon}{label}
                  </div>
                ))}
                <span className="text-xs" style={{ color: "#766C63" }}>... ev avaelin</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SECTION 7 — FINAL CTA STRIP ════════════════════════════════════ */}
      <section id="contact" className="py-14 sm:py-20 relative overflow-hidden" style={{ background: "#0D2A20" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 20% 50%, rgba(214,180,109,0.08), transparent 60%)" }} />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left max-w-xl">
              <p className="text-base sm:text-xl font-semibold mb-2 leading-relaxed" style={{ color: "#fff", fontFamily: "var(--armenian-serif, serif)" }}>
                Ձeр harasnikhe arzani e avaelin, qan sovorakan haghordagutyune:
              </p>
              <p className="text-sm sm:text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                Stezеq gegheczik aczajn hraviratomse, ore hyusnere kehishen:
              </p>
            </div>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-xl font-semibold transition-all hover:brightness-110 hover:-translate-y-0.5 flex-shrink-0 text-sm sm:text-base"
              style={{ background: "#D6B46D", color: "#0D2A20", minHeight: 52, boxShadow: "0 4px 20px rgba(214,180,109,0.35)" }}
            >
              Ստеղzеl im harasanekane kaiqe
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ══ SECTION 8 — TRUST FOOTER ROW ════════════════════════════════════ */}
      <footer className="py-8" style={{ background: "#F8F1E7", borderTop: "1px solid rgba(214,180,109,0.25)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { emoji: "👥", text: "Vastahum en hazaravor zuygеr" },
              { emoji: "🔒", text: "Anvtang ev gaghtni" },
              { emoji: "💬", text: "24/7 ajkacutyun" },
              { emoji: "❤️", text: "Stezvel sirov" },
            ].map(({ emoji, text }) => (
              <div key={text} className="flex flex-col items-center gap-2">
                <span className="text-2xl">{emoji}</span>
                <p className="text-xs" style={{ color: "#766C63" }}>{text}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between mt-8 pt-6 gap-3" style={{ borderTop: "1px solid rgba(214,180,109,0.2)" }}>
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4" style={{ color: "#D6B46D" }} fill="#D6B46D" />
              <span className="text-sm font-bold" style={{ color: "#1C1712", fontFamily: "var(--armenian-serif, serif)" }}>4ever.am</span>
            </div>
            <p className="text-xs" style={{ color: "#766C63" }}>
              © {new Date().getFullYear()} 4ever.am — Bolor iravuncnere pahpanvac en
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
```

---

## ⚠️ Known Issue: Armenian Text Encoding

The file was written via PowerShell `Set-Content` without `-Encoding UTF8NoBOM`. The Armenian Unicode block (U+0531–U+058A) was not preserved — it was saved as `?` replacement characters.

**The correct Armenian strings intended for each location are:**

| Location | Intended Armenian text |
|----------|----------------------|
| Nav: link 1 | Կաղапарнер → `Կաղапарнер` |
| Nav: link 2 | Առавeлуtйуннер → `Առaveletyunner` |
| Nav: link 3 | Оринакнер → `Оrinakner` |
| Nav: Login | Мутк → `Мутк` |
| Nav: CTA | Скsel → `Скsel` |
| Hero eyebrow | СІРАКАР ЗУЙGЕРИ АМАР → `СИРАКАР ЗУЙГЕРИ АМАР` |
| Hero h1 | Ստеղzyeq gegheczik... | → `Ստегzеq gegheczik harasanekane kaiqe dzer hatuk orva amar` |
| Hero CTA 1 | Stegzel im harasanekane kaiqe | → `Ստеղzеl im harasanekane kaiqe` |
| Hero CTA 2 | Ditel kaghaparnere | → `Ditel kaghaparnere` |
| Section 3 title | INCHPES E ASHKATUM | → `ԻՆЧPES E ASHKATUM` |
| Section 4 title | ENTREQ DZER OCHE | → `ENTREQ DZER OCHE` |
| Section 5 title | AMEN INCH PETQ E DZER HYUSNERIN | → `AMEN INCH PETQ E DZER HYUSNERIN` |

**Recommended fix:** Open `HomePage.tsx` in VS Code (UTF-8 mode) and replace corrupted `?` strings with proper Armenian Unicode text as specified in the Work Report.
