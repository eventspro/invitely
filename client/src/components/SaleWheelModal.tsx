/**
 * SaleWheelModal.tsx
 * Spin & Win promotional wheel component.
 *
 * Flow:
 *  1. User clicks "Ստաց՛ր քո նվերը" in the header → modal opens.
 *  2. Registration form is shown first.
 *  3. On valid submit → POST /api/sale-wheel/register-or-spin.
 *  4. If backend says alreadyParticipated → show duplicate message.
 *  5. If backend returns a prize → animate wheel to that prize slot, then show result.
 *
 * SECURITY NOTE: The frontend never picks the prize.
 * The wheel animation target is dictated by the backend response.
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
import { X, Gift, Loader2 } from "lucide-react";

// ─── Prize definitions (must match server order exactly for animation target) ─
export const PRIZES = [
  { key: "discount_10",      label: "10% զեղչ",                emoji: "🏷️" },
  { key: "discount_20",      label: "20% զեղչ",                emoji: "🎫" },
  { key: "admin_panel_free", label: "Admin Panel անվճար",       emoji: "⚙️" },
  { key: "music_free",       label: "Երաժշտություն անվճար",     emoji: "🎵" },
  { key: "gallery_free",     label: "Ֆոտոպատկերասրահ անվճար",  emoji: "📸" },
  { key: "all_features",     label: "Բոլոր հնարավ. ներառված",  emoji: "✨" },
  { key: "free_template",    label: "Անվճար կաղապար",           emoji: "🎁" },
];

const SLICE_DEG = 360 / PRIZES.length; // degrees per slice

// Premium segment colours — rich, distinct, high-contrast
const SEGMENT_COLORS = [
  "#E74C3C", // deep red
  "#E67E22", // burnt orange
  "#D4AC0D", // gold
  "#27AE60", // emerald
  "#2471A3", // ocean blue
  "#7D3C98", // deep purple
  "#148F77", // teal
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
function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}
function lighten(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${Math.min(255, r + amount)},${Math.min(255, g + amount)},${Math.min(255, b + amount)})`;
}

// ─── Canvas wheel renderer ────────────────────────────────────────────────────
function drawWheel(canvas: HTMLCanvasElement, rotation: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const size = canvas.width;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 8;

  ctx.clearRect(0, 0, size, size);

  // ── Outer decorative ring ─────────────────────────────────────────────────
  ctx.beginPath();
  ctx.arc(cx, cy, r + 7, 0, Math.PI * 2);
  const outerGrad = ctx.createLinearGradient(0, 0, size, size);
  outerGrad.addColorStop(0, "#1a1a2e");
  outerGrad.addColorStop(1, "#2d2d44");
  ctx.fillStyle = outerGrad;
  ctx.fill();

  // ── Gold separator ring ───────────────────────────────────────────────────
  ctx.beginPath();
  ctx.arc(cx, cy, r + 3, 0, Math.PI * 2);
  ctx.strokeStyle = "#C9A227";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // ── Slices ────────────────────────────────────────────────────────────────
  PRIZES.forEach((prize, i) => {
    const startAngle = ((i * SLICE_DEG - 90 + rotation) * Math.PI) / 180;
    const endAngle = (((i + 1) * SLICE_DEG - 90 + rotation) * Math.PI) / 180;
    const midAngle  = (startAngle + endAngle) / 2;
    const base = SEGMENT_COLORS[i % SEGMENT_COLORS.length];

    // Radial gradient: lighter at centre, richer at edge
    const grad = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
    grad.addColorStop(0, lighten(base, 50));
    grad.addColorStop(1, base);

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // White separator lines
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // ── Text group ─────────────────────────────────────────────────────────
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(midAngle);

    const textR = r * 0.60; // position along radius
    const emojiSize = Math.round(Math.max(11, size / 23));
    const labelSize = Math.round(Math.max(9, size / 30));

    // Emoji
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${emojiSize}px system-ui`;
    ctx.fillText(prize.emoji, textR, -labelSize - 2);

    // Label — stroke first for a crisp dark outline, then white fill
    ctx.font = `bold ${labelSize}px system-ui, 'Segoe UI', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = "rgba(0,0,0,0.75)";
    ctx.strokeText(prize.label, textR, labelSize + 1);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(prize.label, textR, labelSize + 1);

    ctx.restore();
  });

  // ── Centre glow ───────────────────────────────────────────────────────────
  const centreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 26);
  centreGrad.addColorStop(0, "#FFFFFF");
  centreGrad.addColorStop(1, "#F3F4F6");
  ctx.beginPath();
  ctx.arc(cx, cy, 26, 0, Math.PI * 2);
  ctx.fillStyle = centreGrad;
  ctx.fill();
  ctx.strokeStyle = "#C9A227";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Centre star
  ctx.fillStyle = "#D4AC0D";
  ctx.font = "bold 20px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("★", cx, cy);
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

// ─── Component ────────────────────────────────────────────────────────────────
export const SaleWheelModal: React.FC<SaleWheelModalProps> = ({ onClose }) => {
  const [step, setStep] = useState<ModalStep>("form");
  const [form, setForm] = useState<FormData>({ name: "", phone: "", email: "", weddingDate: "" });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [rotation, setRotation] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const rotationRef = useRef(0);

  // Draw wheel whenever rotation changes (form & spinning steps)
  useEffect(() => {
    if (canvasRef.current && step !== "result" && step !== "duplicate") {
      drawWheel(canvasRef.current, rotation);
    }
  }, [rotation, step]);

  // Initial draw
  useEffect(() => {
    if (canvasRef.current) {
      drawWheel(canvasRef.current, 0);
    }
  }, []);

  // Animate wheel to the backend-selected prize
  const animateToPrize = useCallback(
    (prizeKey: string, onDone: () => void) => {
      const prizeIndex = PRIZES.findIndex((p) => p.key === prizeKey);
      if (prizeIndex === -1) {
        onDone();
        return;
      }

      // Target: prize slice centred under the top pointer
      // The slice midpoint in wheel coordinates (degrees from top, clockwise)
      const sliceMid = prizeIndex * SLICE_DEG + SLICE_DEG / 2;
      // We want sliceMid to land at 0° (top pointer) → rotate by (360 - sliceMid)
      // Add extra full rotations for dramatic effect
      const extraSpins = 5 * 360;
      const targetDeg = extraSpins + (360 - sliceMid);

      const startTime = performance.now();
      const duration = 4000; // ms
      const startRot = rotationRef.current % 360;

      function easeOut(t: number) {
        return 1 - Math.pow(1 - t, 3);
      }

      function step(now: number) {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);
        const current = startRot + targetDeg * easeOut(t);
        rotationRef.current = current;

        if (canvasRef.current) {
          drawWheel(canvasRef.current, current % 360);
        }

        if (t < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          onDone();
        }
      }

      rafRef.current = requestAnimationFrame(step);
    },
    []
  );

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

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

  const prizeInfo = result
    ? PRIZES.find((p) => p.key === result.prizeKey) ?? null
    : null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[95vh] overflow-y-auto relative"
        style={{ boxShadow: "0 25px 60px rgba(0,0,0,0.4)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Gradient header bar ── */}
        <div
          className="rounded-t-3xl px-6 pt-5 pb-4 text-center relative"
          style={{ background: "linear-gradient(135deg, #b45309 0%, #d97706 50%, #f59e0b 100%)" }}
        >
          {step !== "spinning" && (
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full text-white/70 hover:bg-white/20 hover:text-white transition-colors z-10"
              aria-label="Փակել"
            >
              <X size={16} />
            </button>
          )}
          <div className="text-3xl mb-1">🎁</div>
          <h2 className="text-lg font-extrabold text-white leading-snug drop-shadow">
            Պտտիր անիվը և ստացիր հատուկ առաջարկ
          </h2>
          {(step === "form" || step === "spinning") && (
            <p className="text-xs text-amber-100 mt-1">
              Մուտքագրեք Ձեր տվյալները՝ խաղարկությանը մասնակցելու համար։
            </p>
          )}
        </div>

        {/* ── Wheel canvas (shown during form + spinning) ── */}
        {(step === "form" || step === "spinning") && (
          <div className="flex justify-center px-4 pt-5 pb-1 relative">
            {/* Pointer — stylised pin above wheel */}
            <div className="absolute z-10" style={{ top: 10, left: "50%", transform: "translateX(-50%)" }}>
              <div style={{
                width: 0, height: 0,
                borderLeft: "12px solid transparent",
                borderRight: "12px solid transparent",
                borderTop: "24px solid #C0392B",
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
              }} />
            </div>
            {/* Outer glow ring around canvas */}
            <div
              className="rounded-full p-1"
              style={{ background: "linear-gradient(135deg, #C9A227, #8B6914, #C9A227)", padding: 3 }}
            >
              <canvas
                ref={canvasRef}
                width={300}
                height={300}
                className="rounded-full block"
              />
            </div>
          </div>
        )}

        {/* ─────────────────── STEP: FORM ─────────────────────────────────── */}
        {step === "form" && (
          <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-3 mt-4">
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-xl flex items-start gap-2">
                <span className="mt-0.5">⚠️</span>
                <span>{formError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                Անուն <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Ձեր անունը"
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 transition-colors"
                autoComplete="given-name"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                Հեռախոսահամար <span className="text-red-500">*</span>
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+374 91 234 567"
                className={`w-full px-4 py-2.5 border-2 rounded-xl text-sm focus:outline-none transition-colors ${(() => {
                  if (!form.phone) return "border-gray-200 focus:border-amber-400";
                  const n = form.phone.replace(/[\s\-().]/g, "");
                  return /^\+[1-9]\d{6,14}$/.test(n) || /^\d{7,15}$/.test(n)
                    ? "border-green-400 focus:border-green-500"
                    : "border-red-300 focus:border-red-400";
                })()}`}
                type="tel"
                autoComplete="tel"
                maxLength={30}
              />
              {form.phone && (() => {
                const n = form.phone.replace(/[\s\-().]/g, "");
                const valid = /^\+[1-9]\d{6,14}$/.test(n) || /^\d{7,15}$/.test(n);
                return !valid ? (
                  <p className="mt-1 text-xs text-red-500">Օրինակ՝ +374 91 234 567</p>
                ) : null;
              })()}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                Էլ․ հասցե{" "}
                <span className="text-gray-400 font-normal normal-case">(կամընտիր)</span>
              </label>
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 transition-colors"
                type="email"
                autoComplete="email"
                maxLength={200}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                Հարսանիքի ամսաթիվ{" "}
                <span className="text-gray-400 font-normal normal-case">(կամընտիր)</span>
              </label>
              <input
                name="weddingDate"
                value={form.weddingDate}
                onChange={handleChange}
                placeholder="2025-09-15"
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 transition-colors"
                type="date"
                maxLength={50}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 text-white font-bold rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-1 text-base shadow-md hover:shadow-lg active:scale-95"
              style={{ background: "linear-gradient(135deg, #b45309, #d97706, #f59e0b)" }}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Բեռնում...
                </>
              ) : (
                <>Պտտել անիվը &nbsp;🎯</>
              )}
            </button>
          </form>
        )}

        {/* ─────────────────── STEP: SPINNING ─────────────────────────────── */}
        {step === "spinning" && (
          <div className="px-6 pb-6 text-center mt-4">
            <p className="text-amber-600 font-semibold text-sm animate-pulse tracking-wide">✨ Պտտվում է...</p>
          </div>
        )}

        {/* ─────────────────── STEP: RESULT ───────────────────────────────── */}
        {step === "result" && result && (
          <div className="px-6 pb-8 text-center space-y-4 mt-4">
            {/* Confetti banner */}
            <div
              className="rounded-2xl py-5 px-4"
              style={{ background: "linear-gradient(135deg, #fef3c7, #fde68a)" }}
            >
              <div className="text-5xl mb-2">{prizeInfo?.emoji ?? "🎉"}</div>
              <p className="text-xl font-extrabold text-amber-900">Շնորհավորում ենք! 🎉</p>
              <p className="text-sm text-amber-700 mt-1">Դուք շահեցիք</p>
              <p
                className="text-2xl font-black mt-2 leading-tight"
                style={{ color: "#92400e" }}
              >
                {result.prizeLabel}
              </p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-800 flex items-center gap-2 justify-center">
              <span>✅</span> Մենք շուտով կկապվենք Ձեզ հետ։
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 text-white font-bold rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all"
              style={{ background: "linear-gradient(135deg, #b45309, #d97706, #f59e0b)" }}
            >
              Փակել
            </button>
          </div>
        )}

        {/* ─────────────────── STEP: DUPLICATE ────────────────────────────── */}
        {step === "duplicate" && (
          <div className="px-6 pb-8 text-center space-y-4 mt-6">
            <div className="text-5xl">ℹ️</div>
            <p className="text-gray-800 font-bold text-lg">
              Դուք արդեն մասնակցել եք խաղարկությանը։
            </p>
            {result && (
              <div
                className="rounded-2xl py-4 px-4"
                style={{ background: "linear-gradient(135deg, #fef3c7, #fde68a)" }}
              >
                <p className="text-xs text-amber-700 uppercase tracking-wide font-semibold">Ձեր նախկին շահումը</p>
                <p className="font-black text-amber-900 text-xl mt-1">{result.prizeLabel}</p>
              </div>
            )}
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700 flex items-center gap-2 justify-center">
              <span>💌</span> Մենք շուտով կկապվենք Ձեզ հետ։
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-xl transition-colors active:scale-95"
            >
              Փակել
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
