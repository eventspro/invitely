/**
 * /demo/david-rose-romantic
 * Welcome page for the David & Rose Romantic demo.
 * Explains this is demo-only, shows a preview, and invites the customer to personalize.
 */
import { Suspense, lazy, useState } from "react";
import { useLocation } from "wouter";
import { DEMO_DEFAULT_CONFIG } from "@/features/demo-editor/demoConfig";

const RomanticTemplate = lazy(() => import("@/templates/romantic/RomanticTemplate"));

export default function DemoLandingPage() {
  const [, navigate] = useLocation();
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  async function handleTryNow() {
    setIsStarting(true);
    setStartError(null);
    try {
      const res = await fetch("/api/demo/customer-edits", { method: "POST" });
      if (!res.ok) throw new Error("Failed to start demo. Please try again.");
      const data = await res.json() as { editId: string };
      navigate(`/demo/david-rose-romantic/edit/${data.editId}`);
    } catch (err) {
      setStartError(err instanceof Error ? err.message : "Something went wrong.");
      setIsStarting(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "#faf8f4", fontFamily: "Inter, sans-serif" }}>

      {/* Hero Section */}
      <div className="max-w-2xl mx-auto text-center px-6 pt-16 pb-10">
        {/* Demo badge */}
        <span className="inline-block bg-amber-50 text-amber-700 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-amber-200 mb-6">
          Demo mode
        </span>

        <h1
          className="text-4xl sm:text-5xl font-bold text-stone-800 mb-4 leading-tight"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          Try the David & Rose<br />Romantic template
        </h1>

        <p className="text-stone-500 text-base leading-relaxed mb-8 max-w-lg mx-auto">
          Customize names, date, photos, wedding details, and colors.
          Your changes are saved only in this browser and are&nbsp;not&nbsp;published.
        </p>

        {/* Main CTA */}
        <button
          onClick={handleTryNow}
          disabled={isStarting}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-white text-base font-semibold shadow-lg hover:opacity-90 transition-opacity disabled:opacity-60"
          style={{ background: "#9f1239" }}
        >
          {isStarting ? "Setting up your demo…" : "✨ Start Customizing"}
        </button>
        {startError && (
          <p className="mt-3 text-sm text-red-600">{startError}</p>
        )}

        {/* Trust notes */}
        <div className="flex flex-wrap justify-center gap-5 mt-6 text-xs text-stone-400">
          <span>✓ No sign-up required</span>
          <span>✓ Nothing is published</span>
          <span>✓ Your demo is saved</span>
        </div>
      </div>

      {/* Template preview */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-stone-200 pointer-events-none select-none">
          <Suspense
            fallback={
              <div className="h-96 flex items-center justify-center bg-rose-50 text-stone-400 text-sm">
                Loading preview…
              </div>
            }
          >
            <RomanticTemplate config={DEMO_DEFAULT_CONFIG} templateId="demo-landing" />
          </Suspense>
        </div>
        <p className="text-center text-xs text-stone-400 mt-3">
          This is a live preview — scroll to explore all sections
        </p>
      </div>

      {/* What you can customize */}
      <div className="border-t border-stone-100 bg-white py-12">
        <div className="max-w-3xl mx-auto px-6">
          <h2
            className="text-center text-xl font-semibold text-stone-700 mb-8"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Personalize your wedding website in a few minutes
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 text-center">
            {[
              { icon: "💕", label: "Your names & date" },
              { icon: "📸", label: "Your own photos" },
              { icon: "📍", label: "Venues & schedule" },
              { icon: "🎨", label: "Color palette" },
            ].map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="text-3xl">{item.icon}</div>
                <p className="text-sm text-stone-600 font-medium">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky mobile CTA */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 px-4 py-3 bg-white/95 backdrop-blur border-t border-stone-200 z-50">
        <button
          onClick={handleTryNow}
          disabled={isStarting}
          className="w-full py-3.5 rounded-xl text-white font-semibold text-sm disabled:opacity-60"
          style={{ background: "#9f1239" }}
        >
          {isStarting ? "Setting up…" : "✨ Start Customizing"}
        </button>
      </div>
    </div>
  );
}

