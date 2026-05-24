/**
 * TranslationsPrototypePage.tsx — Main page for the homepage content editor prototype.
 * Route: /translations-prototype
 * Left panel: EditorPanel | Right panel: HomepagePreview
 * Persists to localStorage, supports JSON export/import.
 */
import { useState, useRef, useCallback, useEffect } from "react";
import {
  Download, Upload, RotateCcw, Save, Monitor, Smartphone,
} from "lucide-react";
import EditorPanel from "./EditorPanel";
import HomepagePreview from "./HomepagePreview";
import { DEFAULT_CONTENT } from "./defaultContent";
import type { HomepageContent, Locale } from "./types";
import {
  loadHomepageContent,
  saveHomepageContent,
  resetHomepageContent,
  exportHomepageContent,
  fetchHomepageContentFromServer,
  publishHomepageContent,
} from "../../content/homepage/homepageContentStorage";

export default function TranslationsPrototypePage() {
  const [content, setContent] = useState<HomepageContent>(loadHomepageContent);
  const [locale, setLocale] = useState<Locale>("hy");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [saved, setSaved] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");
  const importRef = useRef<HTMLInputElement>(null);

  // On mount: try to load the server-published version as the authoritative source
  useEffect(() => {
    fetchHomepageContentFromServer().then(serverContent => {
      if (serverContent) {
        setContent(serverContent);
        saveHomepageContent(serverContent); // sync localStorage to match server
      }
    });
  }, []);

  const handleChange = useCallback((c: HomepageContent) => {
    setContent(c);
  }, []);

  async function handleSave() {
    setSaved("saving");
    saveHomepageContent(content); // always update localStorage
    const ok = await publishHomepageContent(content);
    setSaved(ok ? "saved" : "error");
    setTimeout(() => setSaved("idle"), 2500);
  }

  function handleReset() {
    if (!window.confirm("Reset all content to defaults? Unsaved changes will be lost.")) return;
    resetHomepageContent();
    setContent(DEFAULT_CONTENT);
  }

  function handleExport() {
    exportHomepageContent(content);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target?.result as string) as HomepageContent;
        setContent(parsed);
      } catch {
        alert("Invalid JSON file — could not import content.");
      }
    };
    reader.readAsText(file);
    if (importRef.current) importRef.current.value = "";
  }

  const locales: { key: Locale; label: string }[] = [
    { key: "hy", label: "Հայ" },
    { key: "en", label: "EN" },
    { key: "ru", label: "RU" },
  ];

  // ── Styles ────────────────────────────────────────────────────────────────
  const topBarHeight = 52;
  const editorWidth = 420;

  const btnBase: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 5,
    border: "1px solid #ddd6cc", borderRadius: 7, padding: "5px 11px",
    fontSize: 11, fontWeight: 600, cursor: "pointer", background: "#fff",
    color: "#1a1310", whiteSpace: "nowrap",
  };

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", fontFamily: "var(--armenian-sans, sans-serif)", background: "#f8f2eb", overflow: "hidden" }}>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div style={{ height: topBarHeight, flexShrink: 0, background: "#0D2A20", borderBottom: "1px solid rgba(216,182,106,0.2)", display: "flex", alignItems: "center", gap: 10, padding: "0 14px", overflowX: "auto" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#f0cf82", whiteSpace: "nowrap", marginRight: 4 }}>
          Homepage Content Editor
        </span>

        {/* Locale tabs */}
        <div style={{ display: "flex", gap: 3, background: "rgba(255,255,255,0.08)", borderRadius: 8, padding: 3 }}>
          {locales.map(l => (
            <button key={l.key} type="button" onClick={() => setLocale(l.key)}
              style={{ ...btnBase, background: locale === l.key ? "#f0cf82" : "transparent", color: locale === l.key ? "#0D2A20" : "rgba(255,255,255,0.7)", border: "none", borderRadius: 6, padding: "4px 10px" }}>
              {l.label}
            </button>
          ))}
        </div>

        {/* Preview mode (desktop only) */}
        <div style={{ display: "flex", gap: 3, background: "rgba(255,255,255,0.08)", borderRadius: 8, padding: 3, marginLeft: 4 }}>
          <button type="button" onClick={() => setPreviewMode("desktop")}
            title="Desktop preview"
            style={{ ...btnBase, background: previewMode === "desktop" ? "#fff" : "transparent", color: previewMode === "desktop" ? "#0D2A20" : "rgba(255,255,255,0.7)", border: "none", borderRadius: 6, padding: "4px 8px" }}>
            <Monitor className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => setPreviewMode("mobile")}
            title="Mobile preview"
            style={{ ...btnBase, background: previewMode === "mobile" ? "#fff" : "transparent", color: previewMode === "mobile" ? "#0D2A20" : "rgba(255,255,255,0.7)", border: "none", borderRadius: 6, padding: "4px 8px" }}>
            <Smartphone className="h-3.5 w-3.5" />
          </button>
        </div>

        <div style={{ flex: 1 }} />

        {/* Action buttons */}
        <button type="button" onClick={handleSave} disabled={saved === "saving"}
          style={{ ...btnBase, background: saved === "saved" ? "#d8f0e0" : saved === "error" ? "#fde8e8" : "#f0cf82", color: "#0D2A20", border: "none", opacity: saved === "saving" ? 0.7 : 1 }}>
          <Save className="h-3.5 w-3.5" />
          {saved === "saving" ? "Publishing…" : saved === "saved" ? "Published!" : saved === "error" ? "Auth needed" : "Save Draft"}
        </button>
        <button type="button" onClick={handleExport} style={{ ...btnBase, background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.9)", border: "1px solid rgba(255,255,255,0.2)" }}>
          <Download className="h-3.5 w-3.5" /> Export
        </button>
        <button type="button" onClick={() => importRef.current?.click()} style={{ ...btnBase, background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.9)", border: "1px solid rgba(255,255,255,0.2)" }}>
          <Upload className="h-3.5 w-3.5" /> Import
        </button>
        <button type="button" onClick={handleReset} style={{ ...btnBase, background: "rgba(255,80,80,0.18)", color: "#fbb", border: "1px solid rgba(255,100,100,0.3)" }}>
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
        <input ref={importRef} type="file" accept=".json" onChange={handleImport} style={{ display: "none" }} />
      </div>

      {/* ── Mobile: tab switcher ─────────────────────────────────────────────── */}
      <div className="lg:hidden" style={{ display: "flex", background: "#f0e8da", borderBottom: "1px solid #e5ddd4" }}>
        {["editor", "preview"].map(tab => (
          <button key={tab} type="button" onClick={() => setActiveTab(tab as "editor" | "preview")}
            style={{ flex: 1, padding: "8px", fontSize: 12, fontWeight: 600, background: activeTab === tab ? "#fff" : "transparent", color: activeTab === tab ? "#0D2A20" : "#766c63", border: "none", cursor: "pointer", textTransform: "capitalize" }}>
            {tab === "editor" ? "Editor" : "Preview"}
          </button>
        ))}
      </div>

      {/* ── Main 2-column layout ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* LEFT: Editor panel */}
        <div style={{
          width: editorWidth, flexShrink: 0,
          overflowY: "auto",
          background: "#faf5ee",
          borderRight: "1px solid #e5ddd4",
          padding: "12px",
          display: typeof window !== "undefined" && window.innerWidth < 1024 && activeTab !== "editor" ? "none" : undefined,
        }}
          className="hidden lg:block lg:flex-shrink-0"
          // On mobile we use the activeTab to toggle display
        >
          <EditorPanel content={content} locale={locale} onChange={handleChange} />
        </div>

        {/* RIGHT: Preview panel */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          background: "#e8e2db",
          display: "flex",
          alignItems: previewMode === "mobile" ? "flex-start" : "stretch",
          justifyContent: previewMode === "mobile" ? "center" : "stretch",
          padding: previewMode === "mobile" ? "20px" : 0,
        }}>
          <div style={{
            width: previewMode === "mobile" ? 390 : "100%",
            flexShrink: 0,
            boxShadow: previewMode === "mobile" ? "0 8px 40px rgba(0,0,0,0.22)" : undefined,
            borderRadius: previewMode === "mobile" ? 20 : 0,
            overflow: previewMode === "mobile" ? "hidden" : "visible",
          }}>
            <HomepagePreview content={content} locale={locale} mode={previewMode} />
          </div>
        </div>

      </div>

      {/* ── Mobile: show active tab ──────────────────────────────────────────── */}
      {/* The CSS above handles desktop split; on mobile we conditionally show/hide via the tab state */}
    </div>
  );
}
