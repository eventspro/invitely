// v6 — deterministic bootstrap with requestTracker
import { createRoot } from "react-dom/client";
import { createElement, useState, useEffect, useCallback } from "react";
import App, { type BootstrapData } from "./App";
import TypingLoader from "./components/TypingLoader";
import { trackPromise, subscribe, getPendingLabels } from "./lib/requestTracker";
import "./index.css";

if (import.meta.env.DEV) {
  console.log("[BOOT] main.tsx loaded", new Date().toISOString());
}

// ─── Error screen ─────────────────────────────────────────────────────────────
function BootstrapError({ onRetry }: { onRetry: () => void }) {
  return createElement(
    "div",
    {
      style: {
        position: "fixed", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", background: "#fff",
        gap: "1rem", fontFamily: "sans-serif",
      },
    },
    createElement("p", { style: { color: "#555", fontSize: "1rem" } },
      "Could not connect to the server. Please check your connection."),
    createElement("button", {
      onClick: onRetry,
      style: {
        padding: "0.6rem 1.4rem", background: "#7c3aed", color: "#fff",
        border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.95rem",
      },
    }, "Retry")
  );
}

// ─── Dev-only loader that shows pending labels ────────────────────────────────
function LoaderWithDiagnostics() {
  const [labels, setLabels] = useState<string[]>(() => getPendingLabels());
  useEffect(() => subscribe(setLabels), []);

  return createElement(
    "div",
    { style: { position: "relative" } },
    createElement(TypingLoader, null),
    import.meta.env.DEV
      ? createElement("div", {
          style: {
            position: "fixed", bottom: "1rem", left: "50%", transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.7)", color: "#fff", padding: "0.4rem 0.8rem",
            borderRadius: "6px", fontSize: "0.75rem", fontFamily: "monospace",
            zIndex: 99999, pointerEvents: "none",
            display: labels.length ? "block" : "none",
          },
        }, `⏳ waiting: ${labels.join(", ")}`)
      : null
  );
}

// ─── Bootstrap: all startup-critical fetches tracked and awaited ──────────────
async function bootstrap(): Promise<BootstrapData> {
  const [translations, maintenance, templates] = await Promise.all([
    trackPromise("translations",
      fetch("/api/translations").then(r => {
        if (!r.ok) throw new Error(`translations ${r.status}`);
        return r.json();
      })
    ),
    trackPromise("maintenance",
      fetch("/api/maintenance").then(r => {
        if (!r.ok) throw new Error(`maintenance ${r.status}`);
        return r.json();
      })
    ),
    trackPromise("templates",
      fetch("/api/templates").then(r => {
        if (!r.ok) throw new Error(`templates ${r.status}`);
        return r.json();
      }).catch(() => [] as any[])   // templates failure is non-fatal — fall back to []
    ),
  ]);

  if (!translations || typeof translations !== "object" ||
      !("en" in translations || "hy" in translations || "ru" in translations)) {
    throw new Error("Invalid translations payload");
  }

  const bypassKey = localStorage.getItem("maintenance-bypass");
  const urlParams = new URLSearchParams(window.location.search);
  const maintenanceBypassed =
    bypassKey === "true" || urlParams.get("preview") === "true";

  if (import.meta.env.DEV) {
    console.log("[BOOT] ✅ translations ready:", Object.keys(translations));
    console.log("[BOOT] ✅ templates count:", Array.isArray(templates) ? templates.length : "n/a");
    console.log("[BOOT] ✅ maintenance:", maintenance.enabled, "| bypassed:", maintenanceBypassed);
    console.log("[BOOT] rendering App (ready)", new Date().toISOString());
  }

  return {
    translations,
    templates: Array.isArray(templates) ? templates : [],
    maintenanceEnabled: Boolean(maintenance.enabled),
    maintenanceBypassed,
  };
}

// ─── Root orchestrator ────────────────────────────────────────────────────────
type Phase = "loading" | "ready" | "error";

function Root() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [data, setData] = useState<BootstrapData | null>(null);

  const runBootstrap = useCallback(() => {
    setPhase("loading");
    bootstrap()
      .then((d) => { setData(d); setPhase("ready"); })
      .catch(() => setPhase("error"));
  }, []);

  useEffect(() => { runBootstrap(); }, []);

  if (phase === "loading") return createElement(LoaderWithDiagnostics, null);
  if (phase === "error") return createElement(BootstrapError, { onRetry: runBootstrap });
  return createElement(App, { bootstrapData: data! });
}

// ─── Mount ────────────────────────────────────────────────────────────────────
const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(createElement(Root, null));
} else {
  console.error("[4ever.am] Root element missing");
}
