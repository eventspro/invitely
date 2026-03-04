// v4 — true bootstrap gate: app never renders before translations + maintenance are ready
import { createRoot } from "react-dom/client";
import { createElement, useState, useEffect, useCallback } from "react";
import App, { type BootstrapData } from "./App";
import TypingLoader from "./components/TypingLoader";
import "./index.css";

// ─── Startup data shape ───────────────────────────────────────────────────────
// BootstrapData is defined in App.tsx and re-imported here.

// ─── Error screen shown when bootstrap fails ──────────────────────────────────
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
    createElement(
      "button",
      {
        onClick: onRetry,
        style: {
          padding: "0.6rem 1.4rem", background: "#7c3aed", color: "#fff",
          border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.95rem",
        },
      },
      "Retry"
    )
  );
}

// ─── Determine language preference ───────────────────────────────────────────
function getPreferredLanguage(): string {
  try {
    const stored = localStorage.getItem("preferred-language");
    if (stored && ["en", "hy", "ru"].includes(stored)) return stored;
  } catch {}
  return "hy"; // platform default
}

// ─── Bootstrap: fetch everything the app needs before first render ─────────────
async function bootstrap(): Promise<BootstrapData> {
  const [translationsRes, maintenanceRes] = await Promise.all([
    fetch("/api/translations"),
    fetch("/api/maintenance"),
  ]);

  if (!translationsRes.ok) {
    throw new Error(`Translations fetch failed: ${translationsRes.status}`);
  }
  if (!maintenanceRes.ok) {
    throw new Error(`Maintenance fetch failed: ${maintenanceRes.status}`);
  }

  const [translations, maintenance] = await Promise.all([
    translationsRes.json(),
    maintenanceRes.json(),
  ]);

  // Validate translations shape
  if (!translations || typeof translations !== "object" ||
      !("en" in translations || "hy" in translations || "ru" in translations)) {
    throw new Error("Invalid translations payload");
  }

  const bypassKey = localStorage.getItem("maintenance-bypass");
  const urlParams = new URLSearchParams(window.location.search);
  const maintenanceBypassed =
    bypassKey === "true" || urlParams.get("preview") === "true";

  if (import.meta.env.DEV) {
    console.log("[4ever.am] ✅ Translations ready:", Object.keys(translations));
    console.log("[4ever.am] ✅ Maintenance state:", maintenance.enabled, "| bypassed:", maintenanceBypassed);
    console.log("[4ever.am] ✅ appReady = true");
  }

  return {
    translations,
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

  // Run once on mount — safe async side-effect
  useEffect(() => { runBootstrap(); }, []);

  if (phase === "loading") return createElement(TypingLoader, null);
  if (phase === "error") {
    return createElement(BootstrapError, { onRetry: runBootstrap });
  }
  return createElement(App, { bootstrapData: data! });
}

// ─── Mount ────────────────────────────────────────────────────────────────────
const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(createElement(Root, null));
} else {
  console.error("[4ever.am] Root element missing");
}
