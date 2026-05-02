/**
 * SaleWheelModal.tsx
 * Spin & Win promotional wheel — elegant wedding-style design.
 *
 * Flow:
 *  1. Header button or auto-open → modal opens.
 *  2. Registration form shown first (left col on desktop).
 *  3. On valid submit → POST /api/sale-wheel/register-or-spin.
 *  4. alreadyParticipated → duplicate screen.
 *  5. prize returned → animate wheel → result screen.
 *
 * SECURITY NOTE: Frontend never picks the prize.
 * Wheel animation target is dictated solely by the backend response.
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
import { X, Loader2 } from "lucide-react";

// PRIZES must match server/routes/sale-wheel.ts order exactly for animation
export const PRIZES = [
  { key: "discount_10",      label: "10% զեղչ",                   emoji: "🏷️" },
  { key: "discount_20",      label: "20% զեղչ",                   emoji: "🎫" },
  { key: "admin_panel_free", label: "Admin Panel անվճար",          emoji: "⚙️" },
  { key: "music_free",       label: "Երաժշտություն անվճար",        emoji: "🎵" },
  { key: "gallery_free",     label: "Լուսանկարների բաժին",         emoji: "📸" },
  { key: "all_features",     label: "Բոլոր հնարավ. ներառված",     emoji: "✨" },
  { key: "free_template",    label: "Անվճար ձևանմուշ",             emoji: "🎁" },
  { key: "qr_cards",         label: "QR կոդերի քարտեր",            emoji: "📱" },
];

const SLICE_DEG = 360 / PRIZES.length;

// Elegant warm wedding palette — alternating to distinguish adjacent slices
const SEGMENT_COLORS = [
  "#C9A96E", // warm gold
  "#D4B896", // sand/beige
  "#B8937A", // terracotta rose
  "#8FAF8C", // muted sage
  "#A3B8C8", // dusty blue
  "#C4A0A0", // blush mauve
  "#D6C3A0", // champagne
  "#9BAF98", // sage green
];

// ─── Read owner test key from URL (?swtest=<secret>) ────────────────────────
function getTestKey(): string | null {
  try {
    return new URLSearchParams(window.location.search).get("swtest");
  } catch {
    return null;
  }
}

const SESSION_KEY = "sw_participated";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function adjustBrightness(hex: string, amount: number): string {
  const r = Math.max(0, Math.min(255, parseInt(hex.slice(1, 3), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.slice(3, 5), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.slice(5, 7), 16) + amount));
  return `rgb(${r},${g},${b})`;
}

// ─── Word-wrap helper for canvas text ────────────────────────────────────────
function wrapLabel(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? current + " " + word : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [text];
}

// ─── Canvas wheel renderer ───────────────────────────────────────────────────
function drawWheel(canvas: HTMLCanvasElement, rotation: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const size = canvas.width;
  const cx = size / 2;
  const cy = size / 2;
  const r  = size / 2 - 8;

  ctx.clearRect(0, 0, size, size);

  // Ivory backing ring
  ctx.beginPath();
  ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
  ctx.fillStyle = "#F5EDD8";
  ctx.fill();

  // Gold border ring
  ctx.beginPath();
  ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
  ctx.strokeStyle = "#C9A96E";
  ctx.lineWidth = 4;
  ctx.stroke();

  // Slices
  PRIZES.forEach((prize, i) => {
    const startAngle = ((i * SLICE_DEG - 90 + rotation) * Math.PI) / 180;
    const endAngle   = (((i + 1) * SLICE_DEG - 90 + rotation) * Math.PI) / 180;
    const midAngle   = (startAngle + endAngle) / 2;
    const base = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
    const fill = i % 2 === 0 ? base : adjustBrightness(base, -22);

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();

    ctx.strokeStyle = "rgba(255,250,240,0.9)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Text group
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(midAngle);

    // Available arc width at 58% radius (for wrapping calculation)
    const textR     = r * 0.58;
    const arcWidth  = 2 * textR * Math.sin((SLICE_DEG / 2) * Math.PI / 180) * 0.9;
    const labelSize = Math.round(Math.max(10, size / 30));
    const emojiSize = Math.round(Math.max(13, size / 23));

    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";

    // Emoji (outer position)
    ctx.font = `${emojiSize}px system-ui`;
    ctx.fillText(prize.emoji, textR, -(labelSize * 1.4 + 2));

    // Wrapped label
    ctx.font = `bold ${labelSize}px -apple-system,system-ui,sans-serif`;
    const lines = wrapLabel(ctx, prize.label, arcWidth);
    const lineH = labelSize * 1.25;
    const totalH = lines.length * lineH;
    const startY = -(totalH / 2) + lineH / 2;

    lines.forEach((line, li) => {
      const y = startY + li * lineH;
      ctx.lineJoin    = "round";
      ctx.lineWidth   = 3.5;
      ctx.strokeStyle = "rgba(40,15,0,0.8)";
      ctx.strokeText(line, textR, y);
      ctx.fillStyle   = "#FFFAF0";
      ctx.fillText(line, textR, y);
    });

    ctx.restore();
  });

  // Centre medallion
  ctx.beginPath();
  ctx.arc(cx, cy, 30, 0, Math.PI * 2);
  ctx.fillStyle = "#C9A96E";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, 24, 0, Math.PI * 2);
  ctx.fillStyle = "#FDF8F0";
  ctx.fill();

  ctx.font = "20px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🎁", cx, cy);
}

// ─── Types ────────────────────────────────────────────────────────────────────
type ModalStep = "form" | "spinning" | "result" | "duplicate";

interface FormData {
  name: string;
  phone: string;
  email: string;
  weddingDate: string;
}

interface SpinResult {
  prizeKey: string;
  prizeLabel: string;
  alreadyParticipated?: boolean;
}

interface SaleWheelModalProps {
  onClose: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────
export const SaleWheelModal: React.FC<SaleWheelModalProps> = ({ onClose }) => {
  const [step, setStep]           = useState<ModalStep>("form");
  const [form, setForm]           = useState<FormData>({ name: "", phone: "", email: "", weddingDate: "" });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]       = useState<SpinResult | null>(null);
  const [rotation, setRotation]   = useState(0);

  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const rafRef      = useRef<number | null>(null);
  const rotationRef = useRef(0);

  useEffect(() => {
    if (canvasRef.current && step !== "result" && step !== "duplicate") {
      drawWheel(canvasRef.current, rotation);
    }
  }, [rotation, step]);

  useEffect(() => {
    if (canvasRef.current) drawWheel(canvasRef.current, 0);
  }, []);

  const animateToPrize = useCallback(
    (prizeKey: string, onDone: () => void) => {
      const prizeIndex = PRIZES.findIndex((p) => p.key === prizeKey);
      if (prizeIndex === -1) { onDone(); return; }

      const sliceMid  = prizeIndex * SLICE_DEG + SLICE_DEG / 2;
      const targetDeg = 5 * 360 + (360 - sliceMid);

      const startTime = performance.now();
      const duration  = 4000;
      const startRot  = rotationRef.current % 360;

      function easeOut(t: number) { return 1 - Math.pow(1 - t, 3); }

      function frame(now: number) {
        const t       = Math.min((now - startTime) / duration, 1);
        const current = startRot + targetDeg * easeOut(t);
        rotationRef.current = current;
        if (canvasRef.current) drawWheel(canvasRef.current, current % 360);
        if (t < 1) { rafRef.current = requestAnimationFrame(frame); }
        else       { onDone(); }
      }
      rafRef.current = requestAnimationFrame(frame);
    },
    []
  );

  useEffect(() => () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); }, []);

  // ── Form handlers ─────────────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!form.name.trim() || form.name.trim().length < 2) {
      setFormError("Խնդրում ենք մուտքագրել Ձեր անունը:");
      return;
    }
    if (!form.phone.trim() || form.phone.trim().length < 8) {
      setFormError("Խնդրում ենք մուտքագրել վավեր հեռախոսահամար:");
      return;
    }
    // Client-side phone format check (mirrors backend)
    const normalised = form.phone.trim().replace(/[\s\-().]/g, "");
    if (!/^\+[1-9]\d{6,14}$/.test(normalised) && !/^\d{7,15}$/.test(normalised)) {
      setFormError("Անվավեր հեռախոսահամար: Օրինակ՝ +374 91 234 567");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/sale-wheel/register-or-spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || undefined,
          weddingDate: form.weddingDate.trim() || undefined,
          ...(getTestKey() ? { testKey: getTestKey() } : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Սերվերի սխալ: Փորձեք կրկին:");
        return;
      }

      if (data.alreadyParticipated) {
        setResult({ prizeKey: data.prizeKey, prizeLabel: data.prizeLabel, alreadyParticipated: true });
        setStep("duplicate");
        // Mark session so we don't re-prompt
        try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* ignore */ }
        return;
      }

      // Spin animation then show result
      setStep("spinning");
      animateToPrize(data.prizeKey, () => {
        setResult({ prizeKey: data.prizeKey, prizeLabel: data.prizeLabel });
        setStep("result");
        if (!data.testMode) {
          try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* ignore */ }
        }
        // In test mode: auto-reset after 2.5 s so owner can spin again immediately
        if (data.testMode) {
          setTimeout(() => {
            setStep("form");
            setResult(null);
            rotationRef.current = 0;
          }, 2500);
        }
      });
    } catch {
      setFormError("Ցանցային սխալ: Ստուգեք ինտերնետ կապը:");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Overlay close — only when not spinning ────────────────────────────────
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (step === "spinning") return;
    if (e.target === e.currentTarget) onClose();
  };

  const prizeInfo = result ? PRIZES.find((p) => p.key === result.prizeKey) ?? null : null;
  const isWheelVisible = step === "form" || step === "spinning";

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4"
      style={{ background: "rgba(40,25,10,0.65)", backdropFilter: "blur(4px)" }}
      onClick={handleOverlayClick}
    >
      {/* Modal card */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          maxWidth: isWheelVisible ? 820 : 440,
          maxHeight: "95vh",
          overflowY: "auto",
          background: "linear-gradient(145deg, #FDFAF4 0%, #F8F0E0 50%, #F5EBD5 100%)",
          borderRadius: 24,
          boxShadow: "0 32px 80px rgba(100,60,0,0.25), 0 0 0 1px rgba(201,169,110,0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floral corners */}
        <div className="absolute top-0 left-0 pointer-events-none select-none opacity-25" style={{ fontSize: 72, lineHeight: 1, transform: "translate(-16px,-16px) rotate(-15deg)" }}>🌸</div>
        <div className="absolute top-0 right-0 pointer-events-none select-none opacity-25" style={{ fontSize: 72, lineHeight: 1, transform: "translate(16px,-16px) rotate(15deg)" }}>🌿</div>
        <div className="absolute bottom-0 left-0 pointer-events-none select-none opacity-15" style={{ fontSize: 60, lineHeight: 1, transform: "translate(-12px,12px) rotate(10deg)" }}>🌿</div>
        <div className="absolute bottom-0 right-0 pointer-events-none select-none opacity-15" style={{ fontSize: 60, lineHeight: 1, transform: "translate(12px,12px) rotate(-10deg)" }}>🌸</div>

        {/* Close button */}
        {step !== "spinning" && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full transition-colors"
            style={{ background: "rgba(201,169,110,0.18)", color: "#7C5210" }}
            aria-label="Փակել"
          >
            <X size={16} />
          </button>
        )}

        {/* ── FORM + WHEEL two-column layout ── */}
        {isWheelVisible && (
          <div className="flex flex-col md:flex-row md:items-center gap-0">

            {/* LEFT: heading + form */}
            <div className="flex-1 px-6 pt-8 pb-6 md:pr-3" style={{ minWidth: 0 }}>
              {/* Ornamental divider */}
              <div className="flex items-center gap-2 mb-4">
                <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, transparent, #C9A96E)" }} />
                <span style={{ fontSize: 20 }}>🎁</span>
                <div style={{ flex: 1, height: 1, background: "linear-gradient(to left, transparent, #C9A96E)" }} />
              </div>

              <h2
                className="font-bold leading-snug mb-2"
                style={{
                  fontSize: "clamp(1.05rem,3.5vw,1.4rem)",
                  color: "#4A2E0A",
                  fontFamily: "Georgia,'Times New Roman',serif",
                  letterSpacing: "0.01em",
                }}
              >
                Պտտիր անիվը և<br className="hidden sm:block" /> ստացիր հատուկ առաջարկ
              </h2>
              <p className="text-sm mb-5" style={{ color: "#7C5210" }}>
                Մասնակցեք և ստացեք հատուկ նվերներ ու զեղչեր
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
                {formError && (
                  <div
                    className="text-sm px-3 py-2 rounded-xl flex items-start gap-2"
                    style={{ background: "#FEF0F0", border: "1px solid #FECACA", color: "#991B1B" }}
                  >
                    <span className="mt-0.5 shrink-0">⚠️</span>
                    <span>{formError}</span>
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#7C5210", letterSpacing: "0.05em" }}>
                    Անուն <span style={{ color: "#C0392B" }}>*</span>
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Ձեր անունը"
                    autoComplete="given-name"
                    maxLength={100}
                    className="w-full text-sm"
                    style={{
                      padding: "10px 14px", border: "1.5px solid #D4B896", borderRadius: 10,
                      background: "rgba(255,252,245,0.9)", color: "#3D2000", outline: "none",
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#C9A96E"; }}
                    onBlur={(e)  => { e.currentTarget.style.borderColor = "#D4B896"; }}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#7C5210", letterSpacing: "0.05em" }}>
                    Հեռախոսահամար <span style={{ color: "#C0392B" }}>*</span>
                  </label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+374 91 234 567"
                    type="tel"
                    autoComplete="tel"
                    maxLength={30}
                    className="w-full text-sm"
                    style={{
                      padding: "10px 14px",
                      border: `1.5px solid ${form.phone ? ((() => { const n = form.phone.replace(/[\s\-().]/g, ""); return /^\+[1-9]\d{6,14}$/.test(n) || /^\d{7,15}$/.test(n) ? "#6BA57D" : "#E07070"; })()) : "#D4B896"}`,
                      borderRadius: 10, background: "rgba(255,252,245,0.9)", color: "#3D2000", outline: "none",
                    }}
                    onFocus={(e) => { if (!form.phone) e.currentTarget.style.borderColor = "#C9A96E"; }}
                    onBlur={(e)  => { if (!form.phone) e.currentTarget.style.borderColor = "#D4B896"; }}
                  />
                  {form.phone && (() => {
                    const n = form.phone.replace(/[\s\-().]/g, "");
                    return !/^\+[1-9]\d{6,14}$/.test(n) && !/^\d{7,15}$/.test(n)
                      ? <p className="mt-0.5 text-xs" style={{ color: "#B91C1C" }}>Օրինակ՝ +374 91 234 567</p>
                      : null;
                  })()}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#7C5210", letterSpacing: "0.05em" }}>
                    Էլ․ հասցե{" "}
                    <span className="font-normal" style={{ color: "#9B7030", letterSpacing: 0 }}>(կամընտիր)</span>
                  </label>
                  <input
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    type="email"
                    autoComplete="email"
                    maxLength={200}
                    className="w-full text-sm"
                    style={{
                      padding: "10px 14px", border: "1.5px solid #D4B896", borderRadius: 10,
                      background: "rgba(255,252,245,0.9)", color: "#3D2000", outline: "none",
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#C9A96E"; }}
                    onBlur={(e)  => { e.currentTarget.style.borderColor = "#D4B896"; }}
                  />
                </div>

                {/* Wedding date */}
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#7C5210", letterSpacing: "0.05em" }}>
                    Հարսանիքի ամսաթիվ{" "}
                    <span className="font-normal" style={{ color: "#9B7030", letterSpacing: 0 }}>(կամընտիր)</span>
                  </label>
                  <input
                    name="weddingDate"
                    value={form.weddingDate}
                    onChange={handleChange}
                    placeholder="mm/dd/yyyy"
                    type="date"
                    maxLength={50}
                    className="w-full text-sm"
                    style={{
                      padding: "10px 14px", border: "1.5px solid #D4B896", borderRadius: 10,
                      background: "rgba(255,252,245,0.9)", color: "#3D2000", outline: "none",
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#C9A96E"; }}
                    onBlur={(e)  => { e.currentTarget.style.borderColor = "#D4B896"; }}
                  />
                </div>

                {/* CTA */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 font-bold transition-all active:scale-95"
                  style={{
                    padding: "12px 20px", fontSize: 15,
                    background: submitting ? "#D4B896" : "linear-gradient(135deg, #C9A96E 0%, #A0720A 50%, #C9A96E 100%)",
                    color: "#FFF8E7", borderRadius: 12, border: "none",
                    cursor: submitting ? "not-allowed" : "pointer",
                    boxShadow: submitting ? "none" : "0 4px 16px rgba(160,114,10,0.4)",
                    letterSpacing: "0.02em", marginTop: 4,
                  }}
                >
                  {submitting ? (<><Loader2 size={16} className="animate-spin" /> Բեռնում...</>) : <>Պտտել անիվը &nbsp;🎯</>}
                </button>
              </form>
            </div>

            {/* RIGHT: wheel */}
            <div className="flex items-center justify-center py-6 px-4 md:py-8 md:pl-1 md:pr-5" style={{ minWidth: 0, flexShrink: 0 }}>
              <div className="relative flex flex-col items-center">
                {/* Gold pointer */}
                <div
                  style={{
                    width: 0, height: 0, zIndex: 10, position: "relative",
                    borderLeft: "13px solid transparent",
                    borderRight: "13px solid transparent",
                    borderTop: "28px solid #C9A96E",
                    filter: "drop-shadow(0 3px 5px rgba(100,60,0,0.4))",
                    marginBottom: -4,
                  }}
                />
                {/* Gold ring + canvas */}
                <div
                  className="rounded-full"
                  style={{
                    padding: 5,
                    background: "linear-gradient(135deg, #C9A96E, #F5D78E, #B8860B, #F5D78E, #C9A96E)",
                    boxShadow: "0 8px 40px rgba(184,134,11,0.3)",
                  }}
                >
                  <canvas
                    ref={canvasRef}
                    width={360}
                    height={360}
                    className="rounded-full block"
                    style={{ width: "min(360px, calc(100vw - 60px))", height: "min(360px, calc(100vw - 60px))" }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Spinning subtitle */}
        {step === "spinning" && (
          <div className="pb-4 text-center">
            <p className="text-sm font-semibold animate-pulse" style={{ color: "#9B7640", letterSpacing: "0.05em" }}>✨ Պտտվում է...</p>
          </div>
        )}

        {/* ── RESULT screen ── */}
        {step === "result" && result && (
          <div className="px-8 py-10 text-center space-y-5">
            <div style={{ fontSize: 52, lineHeight: 1, marginBottom: 4 }}>{prizeInfo?.emoji ?? "🎉"}</div>
            <p className="font-bold text-xl" style={{ color: "#4A2E0A", fontFamily: "Georgia,serif" }}>Շնորհավորում ենք! 🎉</p>
            <div
              className="rounded-2xl py-5 px-6"
              style={{ background: "linear-gradient(135deg, #FDF3DC, #F5E4B8)", border: "1px solid #D4B896" }}
            >
              <p className="text-sm mb-1" style={{ color: "#8B6530" }}>Դուք շահեցիք</p>
              <p className="text-2xl font-black leading-tight" style={{ color: "#4A2E0A", fontFamily: "Georgia,serif" }}>
                {result.prizeLabel}
              </p>
            </div>
            <div
              className="rounded-xl px-4 py-3 text-sm flex items-center gap-2 justify-center"
              style={{ background: "#F0FAF3", border: "1px solid #A7D7B4", color: "#2D6A40" }}
            >
              <span>✅</span> Մենք շուտով կկապվենք Ձեզ հետ։
            </div>
            <button
              onClick={onClose}
              className="w-full font-bold transition-all active:scale-95"
              style={{
                padding: "12px 20px", fontSize: 15,
                background: "linear-gradient(135deg, #C9A96E 0%, #A0720A 50%, #C9A96E 100%)",
                color: "#FFF8E7", borderRadius: 12, border: "none", cursor: "pointer",
                boxShadow: "0 4px 16px rgba(160,114,10,0.4)",
              }}
            >
              Փակել
            </button>
          </div>
        )}

        {/* ── DUPLICATE screen ── */}
        {step === "duplicate" && (
          <div className="px-8 py-10 text-center space-y-5">
            <div style={{ fontSize: 48 }}>ℹ️</div>
            <p className="text-lg font-bold" style={{ color: "#4A2E0A", fontFamily: "Georgia,serif" }}>
              Դուք արդեն մասնակցել եք խաղարկությանը։
            </p>
            {result && (
              <div
                className="rounded-2xl py-4 px-6"
                style={{ background: "linear-gradient(135deg, #FDF3DC, #F5E4B8)", border: "1px solid #D4B896" }}
              >
                <p className="text-xs uppercase font-semibold mb-1" style={{ color: "#8B6530", letterSpacing: "0.06em" }}>Ձեր նախկին շահումը</p>
                <p className="text-xl font-black" style={{ color: "#4A2E0A", fontFamily: "Georgia,serif" }}>{result.prizeLabel}</p>
              </div>
            )}
            <div
              className="rounded-xl px-4 py-3 text-sm flex items-center gap-2 justify-center"
              style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", color: "#1E40AF" }}
            >
              <span>💌</span> Մենք շուտով կկապվենք Ձեզ հետ։
            </div>
            <button
              onClick={onClose}
              className="w-full font-bold transition-all active:scale-95"
              style={{
                padding: "12px 20px", fontSize: 15,
                background: "#3D2800", color: "#FFF8E7",
                borderRadius: 12, border: "none", cursor: "pointer",
              }}
            >
              Փակել
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
