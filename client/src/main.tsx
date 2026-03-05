// v7 — imperative bootstrap: React renders exactly once, already with all data.
// The loader lives in index.html as plain HTML/CSS (zero JS dependency) and is
// replaced atomically when createRoot().render() is called after bootstrap.
import { createRoot } from "react-dom/client";
import App, { type BootstrapData } from "./App";
import "./index.css";

// ─── Bootstrap: fetch all startup-critical data before React mounts ───────────
async function bootstrap(): Promise<BootstrapData> {
  const [translations, maintenance, templates] = await Promise.all([
    fetch("/api/translations").then(r => {
      if (!r.ok) throw new Error(`translations ${r.status}`);
      return r.json();
    }),
    fetch("/api/maintenance").then(r => {
      if (!r.ok) throw new Error(`maintenance ${r.status}`);
      return r.json();
    }),
    fetch("/api/templates")
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .catch(() => [] as any[]),   // non-fatal
  ]);

  if (!translations || typeof translations !== "object" ||
      !("en" in translations || "hy" in translations || "ru" in translations)) {
    throw new Error("Invalid translations payload");
  }

  const maintenanceBypassed =
    localStorage.getItem("maintenance-bypass") === "true" ||
    new URLSearchParams(window.location.search).get("preview") === "true";

  // Resolve preferred language before React mounts so the first render is correct.
  const storedLang = localStorage.getItem("preferred-language") ?? "en";
  const initialLanguage = ["en", "hy", "ru"].includes(storedLang) ? storedLang : "en";

  if (import.meta.env.DEV) {
    console.log("[BOOT] ✅ translations ready:", Object.keys(translations));
    console.log("[BOOT] ✅ templates:", Array.isArray(templates) ? templates.length : "n/a");
    console.log("[BOOT] ✅ maintenance:", maintenance?.enabled, "| bypassed:", maintenanceBypassed);
    console.log("[BOOT] ✅ initialLanguage:", initialLanguage);
  }

  return {
    translations,
    templates: Array.isArray(templates) ? templates : [],
    maintenanceEnabled: Boolean(maintenance?.enabled),
    maintenanceBypassed,
    initialLanguage,
  };
}

// ─── Mount ─────────────────────────────────────────────────────────────────────
// bootstrap() resolves → createRoot().render() is called exactly once.
// React never runs in a "loading" state — the static HTML loader in index.html
// covers the wait, and the first React render already has all data.
const rootEl = document.getElementById("root")!;

bootstrap()
  .then((data) => {
    createRoot(rootEl).render(<App bootstrapData={data} />);
  })
  .catch((err) => {
    console.error("[4ever.am] Bootstrap failed:", err);
    rootEl.innerHTML = `
      <div style="position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#fff;gap:1rem;font-family:sans-serif;">
        <p style="color:#555;font-size:1rem;">Could not connect to the server. Please check your connection.</p>
        <button onclick="location.reload()" style="padding:0.6rem 1.4rem;background:#7c3aed;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:0.95rem;">Reload</button>
      </div>
    `;
  });
