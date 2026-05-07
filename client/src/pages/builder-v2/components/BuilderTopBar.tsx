/**
 * V2 Builder — Top Bar
 * Back / name / device selector / undo-redo / preview / publish / save controls.
 */

import React, { useState, useRef } from "react";
import { Link } from "wouter";
import { useBuilderV2 } from "../BuilderV2Context";
import type { DevicePreview } from "../types";

const DEVICE_OPTIONS: { id: DevicePreview; icon: string; label: string }[] = [
  { id: "desktop", icon: "🖥", label: "Desktop" },
  { id: "tablet",  icon: "📱", label: "Tablet" },
  { id: "mobile",  icon: "📲", label: "Mobile" },
];

export function BuilderTopBar() {
  const { state, undo, redo, save, discard, setDevice, canUndo, canRedo, setMode, setName, publish, setPanel } = useBuilderV2();
  const { isSaving, isPublishing, hasUnsavedChanges, lastSaved, devicePreview, templateName, builderMode, builderPanel } = state;

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(templateName);
  const nameRef = useRef<HTMLInputElement>(null);

  const isPreview = builderMode === "preview";

  const formattedSaved = lastSaved
    ? `Saved ${lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : null;

  const handleNameCommit = () => {
    const trimmed = nameInput.trim();
    if (trimmed && trimmed !== templateName) setName(trimmed);
    setEditingName(false);
  };

  return (
    <div
      style={{
        height:          "52px",
        background:      "#0F172A",
        borderBottom:    "1px solid #1E293B",
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "space-between",
        padding:         "0 16px",
        gap:             "12px",
        flexShrink:      0,
        zIndex:          200,
        position:        "relative",
      }}
    >
      {/* Left: back + name */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
        <Link href="/platform">
          <button
            style={{
              background:    "#1E293B",
              border:        "1px solid #334155",
              borderRadius:  "6px",
              color:         "#94A3B8",
              cursor:        "pointer",
              padding:       "5px 10px",
              fontSize:      "0.7rem",
              fontWeight:    600,
              letterSpacing: "0.04em",
              display:       "flex",
              alignItems:    "center",
              gap:           "5px",
              whiteSpace:    "nowrap",
              transition:    "background 0.15s",
            }}
          >
            ← Templates V2
          </button>
        </Link>

        {/* Editable template name */}
        {editingName ? (
          <input
            ref={nameRef}
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onBlur={handleNameCommit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleNameCommit();
              if (e.key === "Escape") { setNameInput(templateName); setEditingName(false); }
            }}
            autoFocus
            style={{
              background:   "#1E293B",
              border:       "1px solid #6366F1",
              borderRadius: "5px",
              color:        "#E2E8F0",
              fontSize:     "0.8rem",
              fontWeight:   600,
              padding:      "3px 8px",
              outline:      "none",
              width:        "200px",
            }}
          />
        ) : (
          <div
            style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}
            onClick={() => { setNameInput(templateName); setEditingName(true); }}
          >
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#E2E8F0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {templateName}
            </span>
            <span title="Edit name" style={{ fontSize: "0.65rem", color: "#64748B" }}>✏️</span>
          </div>
        )}

        {!editingName && hasUnsavedChanges && (
          <span style={{ fontSize: "0.65rem", color: "#FBBF24", whiteSpace: "nowrap", fontWeight: 500 }}>
            ● Unsaved
          </span>
        )}
        {!editingName && !hasUnsavedChanges && formattedSaved && (
          <span style={{ fontSize: "0.65rem", color: "#4ADE80", whiteSpace: "nowrap", fontWeight: 500 }}>
            ✓ {formattedSaved}
          </span>
        )}
      </div>

      {/* Center: device preview selector (hidden in preview mode) */}
      {!isPreview && (
        <div style={{ display: "flex", gap: "2px", background: "#1E293B", border: "1px solid #334155", borderRadius: "8px", padding: "3px", flexShrink: 0 }}>
          {DEVICE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              title={opt.label}
              onClick={() => setDevice(opt.id)}
              style={{
                background:   devicePreview === opt.id ? "#334155" : "transparent",
                border:       "none",
                borderRadius: "6px",
                color:        devicePreview === opt.id ? "#E2E8F0" : "#64748B",
                cursor:       "pointer",
                padding:      "4px 12px",
                fontSize:     "0.75rem",
                transition:   "background 0.15s, color 0.15s",
                display:      "flex",
                alignItems:   "center",
                gap:          "4px",
              }}
            >
              <span style={{ fontSize: "0.85rem" }}>{opt.icon}</span>
              <span style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.04em" }}>{opt.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Right: undo/redo + preview + discard + save + publish */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
        {!isPreview && (
          <>
            <button
              onClick={undo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: "6px", color: canUndo ? "#CBD5E1" : "#475569", cursor: canUndo ? "pointer" : "not-allowed", padding: "5px 10px", fontSize: "0.8rem" }}
            >↩</button>
            <button
              onClick={redo}
              disabled={!canRedo}
              title="Redo (Ctrl+Y)"
              style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: "6px", color: canRedo ? "#CBD5E1" : "#475569", cursor: canRedo ? "pointer" : "not-allowed", padding: "5px 10px", fontSize: "0.8rem" }}
            >↪</button>
          </>
        )}

        {/* Preview toggle */}
        <button
          onClick={() => setMode(isPreview ? "editing" : "preview")}
          style={{
            background:    isPreview ? "#0F4C75" : "#1E293B",
            border:        `1px solid ${isPreview ? "#0EA5E9" : "#334155"}`,
            borderRadius:  "6px",
            color:         isPreview ? "#38BDF8" : "#94A3B8",
            cursor:        "pointer",
            padding:       "5px 14px",
            fontSize:      "0.7rem",
            fontWeight:    600,
            letterSpacing: "0.04em",
          }}
        >
          {isPreview ? "← Exit Preview" : "👁 Preview"}
        </button>

        {!isPreview && hasUnsavedChanges && (
          <button
            onClick={() => { if (confirm("Discard all unsaved changes?")) discard(); }}
            style={{ background: "transparent", border: "1px solid #374151", borderRadius: "6px", color: "#94A3B8", cursor: "pointer", padding: "5px 14px", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.04em" }}
          >
            Discard
          </button>
        )}

        {!isPreview && (
          <button
            onClick={save}
            disabled={isSaving || !hasUnsavedChanges}
            style={{
              background:    hasUnsavedChanges && !isSaving ? "#4F46E5" : "#1E293B",
              border:        "1px solid transparent",
              borderRadius:  "6px",
              color:         hasUnsavedChanges && !isSaving ? "#fff" : "#475569",
              cursor:        hasUnsavedChanges && !isSaving ? "pointer" : "not-allowed",
              padding:       "5px 18px",
              fontSize:      "0.7rem",
              fontWeight:    700,
              letterSpacing: "0.06em",
            }}
          >
            {isSaving ? "Saving…" : "Save Draft"}
          </button>
        )}

        {/* Publish */}
        {/* Settings */}
        {!isPreview && (
          <button
            onClick={() => setPanel(builderPanel === "settings" ? "inspector" : "settings")}
            title="Project Settings"
            style={{
              background:    builderPanel === "settings" ? "#1E3A5F" : "#1E293B",
              border:        `1px solid ${builderPanel === "settings" ? "#3B82F6" : "#334155"}`,
              borderRadius:  "6px",
              color:         builderPanel === "settings" ? "#60A5FA" : "#94A3B8",
              cursor:        "pointer",
              padding:       "5px 14px",
              fontSize:      "0.7rem",
              fontWeight:    600,
              letterSpacing: "0.04em",
            }}
          >
            ⚙ Settings
          </button>
        )}

        {/* Publish */}
        <button
          onClick={publish}
          disabled={isPublishing || isSaving}
          style={{
            background:    isPublishing ? "#92400E" : "#B45309",
            border:        "1px solid #D97706",
            borderRadius:  "6px",
            color:         "#FEF3C7",
            cursor:        isPublishing ? "not-allowed" : "pointer",
            padding:       "5px 18px",
            fontSize:      "0.7rem",
            fontWeight:    700,
            letterSpacing: "0.06em",
          }}
        >
          {isPublishing ? "Publishing…" : "🚀 Publish"}
        </button>
      </div>
    </div>
  );
}
