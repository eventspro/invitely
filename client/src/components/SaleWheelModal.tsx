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

// Segment colours (alternating warm palette)
const SEGMENT_COLORS = [
  "#F59E0B", "#EF4444", "#8B5CF6",
  "#10B981", "#3B82F6", "#F97316", "#EC4899",
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

// ─── Canvas wheel renderer ────────────────────────────────────────────────────
function drawWheel(canvas: HTMLCanvasElement, rotation: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const size = canvas.width;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;

  ctx.clearRect(0, 0, size, size);

  PRIZES.forEach((prize, i) => {
    const startAngle = ((i * SLICE_DEG - 90 + rotation) * Math.PI) / 180;
    const endAngle = (((i + 1) * SLICE_DEG - 90 + rotation) * Math.PI) / 180;

    // Slice
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Emoji + label text
    ctx.save();
    ctx.translate(cx, cy);
    const midAngle = ((i + 0.5) * SLICE_DEG - 90 + rotation) * (Math.PI / 180);
    ctx.rotate(midAngle);
    ctx.textAlign = "right";
    ctx.fillStyle = "#fff";
    ctx.font = `bold ${Math.max(10, size / 25)}px system-ui, sans-serif`;
    ctx.fillText(prize.emoji + " " + prize.label, r - 8, 4);
    ctx.restore();
  });

  // Centre circle
  ctx.beginPath();
  ctx.arc(cx, cy, 22, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.strokeStyle = "#E5E7EB";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Centre star
  ctx.fillStyle = "#F59E0B";
  ctx.font = "bold 18px system-ui";
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
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[95vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button — hidden while spinning */}
        {step !== "spinning" && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors z-10"
            aria-label="Փակել"
          >
            <X size={16} />
          </button>
        )}

        <div className="px-6 pt-6 pb-2 text-center">
          <div className="text-3xl mb-1">🎁</div>
          <h2 className="text-xl font-bold text-gray-900 leading-snug">
            Պտտիր անիվը և ստացիր հատուկ առաջարկ
          </h2>
          {(step === "form" || step === "spinning") && (
            <p className="text-sm text-gray-500 mt-1">
              Մուտքագրեք Ձեր տվյալները՝ խաղարկությանը մասնակցելու համար։
            </p>
          )}
        </div>

        {/* ── Wheel canvas (shown during form + spinning) ── */}
        {(step === "form" || step === "spinning") && (
          <div className="flex justify-center px-6 pt-4 pb-2 relative">
            {/* Top pointer triangle */}
            <div
              className="absolute top-[16px] left-1/2 -translate-x-1/2 z-10 w-0 h-0"
              style={{
                borderLeft: "10px solid transparent",
                borderRight: "10px solid transparent",
                borderTop: "20px solid #EF4444",
              }}
            />
            <canvas
              ref={canvasRef}
              width={280}
              height={280}
              className="rounded-full shadow-lg"
            />
          </div>
        )}

        {/* ─────────────────── STEP: FORM ─────────────────────────────────── */}
        {step === "form" && (
          <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-3 mt-2">
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Անուն <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Ձեր անունը"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                autoComplete="given-name"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Հեռախոսահամար <span className="text-red-500">*</span>
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+374 91 234 567"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 ${(() => {
                  if (!form.phone) return "border-gray-200";
                  const n = form.phone.replace(/[\s\-().]/g, "");
                  return /^\+[1-9]\d{6,14}$/.test(n) || /^\d{7,15}$/.test(n)
                    ? "border-green-400"
                    : "border-red-300";
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Էլ․ հասցե{" "}
                <span className="text-gray-400 font-normal">(կամընտիր)</span>
              </label>
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                type="email"
                autoComplete="email"
                maxLength={200}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Հարսանիքի ամսաթիվ{" "}
                <span className="text-gray-400 font-normal">(կամընտիր)</span>
              </label>
              <input
                name="weddingDate"
                value={form.weddingDate}
                onChange={handleChange}
                placeholder="2025-09-15"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                type="date"
                maxLength={50}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Բեռնում...
                </>
              ) : (
                "Պտտել անիվը 🎯"
              )}
            </button>
          </form>
        )}

        {/* ─────────────────── STEP: SPINNING ─────────────────────────────── */}
        {step === "spinning" && (
          <div className="px-6 pb-6 text-center mt-4">
            <p className="text-gray-500 text-sm animate-pulse">Պտտվում է...</p>
          </div>
        )}

        {/* ─────────────────── STEP: RESULT ───────────────────────────────── */}
        {step === "result" && result && (
          <div className="px-6 pb-8 text-center space-y-4 mt-2">
            <div className="text-5xl">{prizeInfo?.emoji ?? "🎉"}</div>
            <div>
              <p className="text-lg font-bold text-gray-900">Շնորհավորում ենք 🎉</p>
              <p className="text-gray-600 text-sm mt-1">Դուք շահեցիք</p>
              <p className="text-2xl font-extrabold text-amber-500 mt-2">
                {result.prizeLabel}
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
              Մենք շուտով կկապվենք Ձեզ հետ։
            </div>
            <button
              onClick={onClose}
              className="mt-2 px-8 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors"
            >
              Փակել
            </button>
          </div>
        )}

        {/* ─────────────────── STEP: DUPLICATE ────────────────────────────── */}
        {step === "duplicate" && (
          <div className="px-6 pb-8 text-center space-y-4 mt-4">
            <div className="text-4xl">ℹ️</div>
            <p className="text-gray-800 font-semibold">
              Դուք արդեն մասնակցել եք խաղարկությանը։
            </p>
            {result && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                <p className="text-sm text-gray-500">Ձեր նախկին շահումը՝</p>
                <p className="font-bold text-amber-500 text-lg mt-1">{result.prizeLabel}</p>
              </div>
            )}
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
              Մենք շուտով կկապվենք Ձեզ հետ։
            </div>
            <button
              onClick={onClose}
              className="mt-2 px-8 py-2.5 bg-gray-700 hover:bg-gray-800 text-white font-semibold rounded-xl transition-colors"
            >
              Փակել
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
