/**
 * V2 Builder — Main Page Shell
 * Loads template config, wraps in BuilderV2Provider, renders the 3-panel layout.
 * Route: /platform/builder-v2/:templateId
 *
 * Isolated from V1 builder entirely. Does NOT import any V1 builder code.
 */

import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { BuilderV2Provider, useBuilderV2 } from "./BuilderV2Context";
import { BuilderTopBar } from "./components/BuilderTopBar";
import { BuilderLeftPanel } from "./components/BuilderLeftPanel";
import { BuilderCanvas } from "./components/BuilderCanvas";
import { BuilderRightPanel } from "./components/BuilderRightPanel";
import { ProjectSettingsPanel } from "./components/ProjectSettingsPanel";
import type { WeddingConfig } from "@/templates/types";
// Register all V2 template manifests before the builder mounts
import "@/templates/v2-templates";

// ─── Right panel switcher (inside provider) ───────────────────────────────────
function BuilderRightArea() {
  const { state } = useBuilderV2();
  if (state.builderPanel === "settings") return <ProjectSettingsPanel />;
  return <BuilderRightPanel />;
}

// ─── Loading screen ───────────────────────────────────────────────────────────
function BuilderLoadingScreen({ message }: { message: string }) {
  return (
    <div
      style={{
        height:          "100vh",
        background:      "#0F172A",
        display:         "flex",
        flexDirection:   "column",
        alignItems:      "center",
        justifyContent:  "center",
        color:           "#64748B",
        fontFamily:      "system-ui, sans-serif",
        gap:             "12px",
      }}
    >
      <div
        style={{
          width:        "32px",
          height:       "32px",
          border:       "2px solid #334155",
          borderTop:    "2px solid #6366F1",
          borderRadius: "50%",
          animation:    "spin 0.8s linear infinite",
        }}
      />
      <p style={{ fontSize: "0.8rem", letterSpacing: "0.06em" }}>{message}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Error screen ─────────────────────────────────────────────────────────────
function BuilderErrorScreen({ message }: { message: string }) {
  return (
    <div
      style={{
        height:         "100vh",
        background:     "#0F172A",
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        color:          "#EF4444",
        fontFamily:     "system-ui, sans-serif",
        gap:            "12px",
      }}
    >
      <p style={{ fontSize: "1.5rem" }}>⚠</p>
      <p style={{ fontSize: "0.85rem" }}>{message}</p>
      <a
        href="/platform"
        style={{ color: "#6366F1", fontSize: "0.75rem", textDecoration: "underline" }}
      >
        Back to Platform
      </a>
    </div>
  );
}

// ─── Main Builder Page ────────────────────────────────────────────────────────
interface TemplateData {
  templateId:  string;
  templateKey: string;
  config:      WeddingConfig;
  maintenance: boolean;
  name?:       string;
}

export default function BuilderV2Page() {
  const params    = useParams<{ templateId: string }>();
  const [, navigate] = useLocation();
  const templateId   = params.templateId;

  const [state, setState] = useState<
    | { status: "checking-auth" }
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "ready"; data: TemplateData }
  >({ status: "checking-auth" });

  // ── 1. Check auth (same pattern as platform-dashboard) ──────────────────
  useEffect(() => {
    const token = localStorage.getItem("admin-token");
    if (!token) {
      navigate("/platform");
      return;
    }
    setState({ status: "loading" });
  }, [navigate]);

  // ── 2. Load template config from API ────────────────────────────────────
  useEffect(() => {
    if (state.status !== "loading") return;
    if (!templateId) {
      setState({ status: "error", message: "No template ID provided." });
      return;
    }

    const load = async () => {
      try {
        const token = localStorage.getItem("admin-token");
        const res = await fetch(`/api/templates/${templateId}/config`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
          setState({ status: "error", message: `Template not found (${res.status}).` });
          return;
        }
        const data: TemplateData = await res.json();
        if (!data.config || typeof data.config !== "object") {
          setState({ status: "error", message: "Invalid template config returned from API." });
          return;
        }
        setState({ status: "ready", data });
      } catch (err) {
        setState({ status: "error", message: "Failed to load template. Check your connection." });
      }
    };
    load();
  }, [state.status, templateId]);

  // ── Render states ────────────────────────────────────────────────────────
  if (state.status === "checking-auth" || state.status === "loading") {
    return <BuilderLoadingScreen message={
      state.status === "checking-auth" ? "Verifying access…" : "Loading template…"
    } />;
  }

  if (state.status === "error") {
    return <BuilderErrorScreen message={state.message} />;
  }

  const { data } = state;

  return (
    <BuilderV2Provider
      templateId={data.templateId}
      templateKey={data.templateKey}
      templateName={data.name || `Template ${data.templateId.slice(0, 8)}`}
      initialConfig={data.config}
    >
      {/* Full-viewport builder shell — 3-column layout */}
      <div
        style={{
          display:        "flex",
          flexDirection:  "column",
          height:         "100vh",
          background:     "#0F172A",
          overflow:       "hidden",
          fontFamily:     "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Top bar (fixed height) */}
        <BuilderTopBar />

        {/* Main body: Left panel + Canvas + Right panel */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <BuilderLeftPanel />
          <BuilderCanvas />
          <BuilderRightArea />
        </div>
      </div>
    </BuilderV2Provider>
  );
}
