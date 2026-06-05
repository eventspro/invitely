/**
 * V2 Builder — Canvas
 * Renders the active template in builder mode.
 * Template component is loaded dynamically via manifest.getComponent().
 * Element selection and inline editing use manifest.elements.
 */

import React, { Suspense, useEffect, useRef, useState, useMemo } from "react";
import { lazy } from "react";
import { useBuilderV2 } from "../BuilderV2Context";
import { DEVICE_WIDTHS } from "../types";
import { getElementValue, setElementValue } from "../manifest-types";
import type { V2TemplateManifest } from "../manifest-types";

interface FloatingToolbarState {
  top:  number;
  left: number;
}

interface InlineEditorState {
  elementId: string;
  top:       number;
  left:      number;
  width:     number;
  height:    number;
  value:     string;
}

/**
 * Cache of lazy-loaded template components, keyed by templateKey.
 * Created once per key so React.lazy never re-wraps the same factory.
 */
const _lazyComponentCache: Record<string, React.LazyExoticComponent<any>> = {};

function getOrCreateLazy(manifest: V2TemplateManifest): React.LazyExoticComponent<any> {
  if (!_lazyComponentCache[manifest.templateKey]) {
    _lazyComponentCache[manifest.templateKey] = lazy(manifest.getComponent);
  }
  return _lazyComponentCache[manifest.templateKey];
}

export function BuilderCanvas() {
  const { state, manifest, selectSection, selectElement, setTab, updateConfig } = useBuilderV2();
  const { draftConfig, selectedSection, selectedElement, devicePreview, templateId, builderMode } = state;

  const canvasRef  = useRef<HTMLDivElement>(null);
  const styleRef   = useRef<HTMLStyleElement | null>(null);
  const isPreview  = builderMode === "preview";

  const [toolbar, setToolbar]       = useState<FloatingToolbarState | null>(null);
  const [inlineEdit, setInlineEdit] = useState<InlineEditorState | null>(null);

  // Derive the lazy template component from the manifest
  const TemplateComponent = useMemo(
    () => (manifest ? getOrCreateLazy(manifest) : null),
    [manifest?.templateKey]
  );

  // ── Inject / remove builder selection styles ────────────────────────────
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "builder-v2-canvas-styles";
    document.head.appendChild(style);
    styleRef.current = style;
    return () => style.remove();
  }, []);

  // ── Preserve scroll ratio when device width changes ──────────────────────
  const prevDeviceRef = useRef(devicePreview);
  useEffect(() => {
    if (prevDeviceRef.current === devicePreview) return;
    prevDeviceRef.current = devicePreview;

    const el = canvasRef.current;
    if (!el) return;

    // Store scroll ratio before paint, restore after re-layout
    const ratio = el.scrollTop / (el.scrollHeight || 1);
    requestAnimationFrame(() => {
      el.scrollTop = ratio * el.scrollHeight;
    });
  }, [devicePreview]);

  useEffect(() => {
    const style = styleRef.current;
    if (!style) return;

    if (isPreview) {
      style.textContent = "";
      return;
    }

    style.textContent = `
      [data-v2-section] { cursor: pointer !important; position: relative; }
      [data-v2-section]:hover { box-shadow: inset 0 0 0 2px rgba(99,102,241,0.35) !important; }
      [data-v2-element] { cursor: pointer !important; outline: none; }
      [data-v2-element]:hover { outline: 2px dashed rgba(99,102,241,0.5) !important; outline-offset: 2px; }
      ${selectedSection ? `[data-v2-section="${selectedSection}"] { box-shadow: inset 0 0 0 2px rgba(99,102,241,0.7) !important; }` : ""}
      ${selectedElement ? `[data-v2-element="${selectedElement}"] { outline: 2px solid #6366F1 !important; outline-offset: 2px; }` : ""}
    `;
  }, [selectedSection, selectedElement, isPreview]);

  // ── Toolbar positioning ──────────────────────────────────────────────────
  useEffect(() => {
    if (isPreview) { setToolbar(null); return; }
    if (!selectedElement && !selectedSection) { setToolbar(null); return; }

    const selector = selectedElement
      ? `[data-v2-element="${selectedElement}"]`
      : `[data-v2-section="${selectedSection}"]`;

    const el = document.querySelector(selector) as HTMLElement | null;
    if (!el) { setToolbar(null); return; }

    const rect = el.getBoundingClientRect();
    setToolbar({ top: rect.top + window.scrollY - 40, left: rect.left + window.scrollX });
  }, [selectedElement, selectedSection, isPreview]);

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (inlineEdit) { setInlineEdit(null); return; }
        if (selectedElement) { selectElement(null); return; }
        selectSection(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectSection, selectElement, selectedElement, inlineEdit]);

  // ── Click handler ────────────────────────────────────────────────────────
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPreview) return;
    if (inlineEdit) return; // let inline editor handle its own blur

    const target = e.target as HTMLElement;

    // Priority: element > section
    const elementEl = target.closest("[data-v2-element]") as HTMLElement | null;
    if (elementEl) {
      const elementId = elementEl.getAttribute("data-v2-element") as string;
      const sectionEl = elementEl.closest("[data-v2-section]") as HTMLElement | null;
      const sectionId = (sectionEl?.getAttribute("data-v2-section") ?? null) as string | null;
      selectElement(elementId, sectionId ?? undefined);
      e.stopPropagation();
      return;
    }

    const sectionEl = target.closest("[data-v2-section]") as HTMLElement | null;
    if (sectionEl) {
      const id = sectionEl.getAttribute("data-v2-section") as string;
      selectSection(id);
      selectElement(null);
      e.stopPropagation();
      return;
    }

    // Clicked outside — deselect
    selectSection(null);
    selectElement(null);
  };

  // ── Double-click → inline text editing ──────────────────────────────────
  const handleCanvasDblClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPreview) return;
    const target = e.target as HTMLElement;
    const elementEl = target.closest("[data-v2-element][data-v2-type='text']") as HTMLElement | null;
    if (!elementEl) return;

    const elementId   = elementEl.getAttribute("data-v2-element") as string;
    const elementMeta = manifest?.elements[elementId];
    if (!elementMeta) return; // unknown element — fail safely

    const rect    = elementEl.getBoundingClientRect();
    const current = getElementValue(elementMeta, draftConfig);

    setInlineEdit({
      elementId,
      top:    rect.top,
      left:   rect.left,
      width:  Math.max(rect.width, 200),
      height: Math.max(rect.height, 40),
      value:  current,
    });
    e.preventDefault();
    e.stopPropagation();
  };

  const commitInlineEdit = () => {
    if (!inlineEdit) return;
    const { elementId, value } = inlineEdit;
    const elementMeta = manifest?.elements[elementId];
    if (elementMeta) updateConfig((cfg) => setElementValue(elementMeta, cfg, value));
    setInlineEdit(null);
  };

  const canvasWidth = DEVICE_WIDTHS[devicePreview];

  return (
    <div
      style={{
        flex:           1,
        background:     isPreview ? "#fff" : "#0D1117",
        overflow:       "auto",
        overflowX:      "hidden",
        display:        "flex",
        justifyContent: "center",
        padding:        isPreview ? "0" : devicePreview === "desktop" ? "32px 24px" : "32px 24px 48px",
        position:       "relative",
      }}
    >
      {/* Preview mode banner */}
      {isPreview && (
        <div
          style={{
            position:      "fixed",
            top:           "52px",
            left:          0,
            right:         0,
            zIndex:        1000,
            background:    "#0F4C75",
            borderBottom:  "1px solid #0EA5E9",
            color:         "#38BDF8",
            fontSize:      "0.7rem",
            fontWeight:    600,
            textAlign:     "center",
            padding:       "6px 0",
            letterSpacing: "0.08em",
            pointerEvents: "none",
          }}
        >
          👁 PREVIEW MODE — Use "Exit Preview" in the toolbar to return to editing
        </div>
      )}

      {/* Floating mini-toolbar */}
      {!isPreview && toolbar && (selectedElement || selectedSection) && (
        <div
          style={{
            position:      "fixed",
            top:           `${toolbar.top}px`,
            left:          `${toolbar.left}px`,
            zIndex:        999,
            background:    "#1E293B",
            border:        "1px solid #334155",
            borderRadius:  "8px",
            display:       "flex",
            gap:           "2px",
            padding:       "4px",
            boxShadow:     "0 4px 16px rgba(0,0,0,0.4)",
            pointerEvents: "auto",
          }}
        >
          {[
            { label: "✏️ Edit",  title: "Edit content",       onClick: () => setTab("content") },
            { label: "🎨 Style", title: "Edit style",         onClick: () => setTab("style") },
            { label: "⚙️ Adv",   title: "Advanced settings",  onClick: () => setTab("advanced") },
          ].map((btn) => (
            <button
              key={btn.label}
              title={btn.title}
              onClick={btn.onClick}
              style={{
                background:    "transparent",
                border:        "none",
                borderRadius:  "5px",
                color:         "#CBD5E1",
                cursor:        "pointer",
                padding:       "4px 8px",
                fontSize:      "0.65rem",
                fontWeight:    600,
                whiteSpace:    "nowrap",
                transition:    "background 0.1s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#334155"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}

      {/* Inline text editor overlay */}
      {inlineEdit && (
        <textarea
          autoFocus
          value={inlineEdit.value}
          onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
          onBlur={commitInlineEdit}
          onKeyDown={(e) => {
            if (e.key === "Escape") { setInlineEdit(null); e.preventDefault(); }
            if (e.key === "Enter" && !e.shiftKey) { commitInlineEdit(); e.preventDefault(); }
          }}
          style={{
            position:     "fixed",
            top:          `${inlineEdit.top}px`,
            left:         `${inlineEdit.left}px`,
            width:        `${inlineEdit.width}px`,
            minHeight:    `${inlineEdit.height}px`,
            zIndex:       9999,
            background:   "rgba(30,41,59,0.95)",
            border:       "2px solid #6366F1",
            borderRadius: "4px",
            color:        "#E2E8F0",
            fontSize:     "0.9rem",
            padding:      "8px",
            resize:       "both",
            outline:      "none",
            lineHeight:   1.5,
            boxShadow:    "0 8px 32px rgba(0,0,0,0.5)",
          }}
        />
      )}

      {/* Canvas shadow wrapper */}
      <div
        style={{
          width:        isPreview ? "100%" : canvasWidth,
          maxWidth:     "100%",
          boxShadow:    isPreview ? "none" : devicePreview === "mobile"
            ? "0 0 0 12px #1F2937, 0 0 0 14px #374151, 0 8px 40px rgba(0,0,0,0.8)"
            : devicePreview === "tablet"
            ? "0 0 0 8px #1F2937, 0 0 0 10px #374151, 0 6px 40px rgba(0,0,0,0.7)"
            : "0 4px 60px rgba(0,0,0,0.6)",
          borderRadius: isPreview ? 0 : devicePreview === "mobile" ? "32px" : devicePreview === "tablet" ? "16px" : "2px",
          overflow:     "hidden",
          flexShrink:   0,
          transition:   "width 0.35s cubic-bezier(0.4,0,0.2,1), border-radius 0.35s, box-shadow 0.35s",
          position:     "relative",
          marginTop:    isPreview ? "36px" : 0,
        }}
      >
        {/* Selected section badge */}
        {!isPreview && selectedSection && (
          <div
            style={{
              position:      "absolute",
              top:           8,
              left:          "50%",
              transform:     "translateX(-50%)",
              zIndex:        1000,
              background:    "#6366F1",
              color:         "#fff",
              fontSize:      "0.6rem",
              fontWeight:    700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding:       "4px 12px",
              borderRadius:  "999px",
              pointerEvents: "none",
              userSelect:    "none",
              whiteSpace:    "nowrap",
            }}
          >
            {selectedElement
              ? `${manifest?.elements[selectedElement]?.label ?? selectedElement} — double-click to edit text`
              : `${manifest?.sections.find(s => s.id === selectedSection)?.label ?? selectedSection} — edit in panel →`
            }
          </div>
        )}

        {/* Scrollable template container */}
        <div
          id="builder-v2-canvas-inner"
          ref={canvasRef}
          onClick={handleCanvasClick}
          onDoubleClick={handleCanvasDblClick}
          style={{
            height:     isPreview ? "100vh" : "calc(100vh - 52px - 64px)",
            overflowY:  "auto",
            overflowX:  "hidden",
            background: "#fff",
          }}
        >
          <Suspense
            fallback={
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "400px", background: "#111", color: "#555", fontSize: "0.8rem", letterSpacing: "0.1em" }}>
                Loading template preview…
              </div>
            }
          >
            {TemplateComponent ? (
              /* Cast props to any to avoid TypeScript complaining about unknown component shape */
              React.createElement(TemplateComponent as React.ComponentType<any>, {
                config:        draftConfig,
                templateId:    templateId,
                builderMode:   !isPreview,
                devicePreview: isPreview ? undefined : devicePreview,
              })
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "400px", background: "#111", color: "#EF4444", fontSize: "0.8rem" }}>
                Template not registered. Check v2-templates.ts.
              </div>
            )}
          </Suspense>
        </div>
      </div>

      {/* Device width indicator */}
      {!isPreview && (
        <div
          style={{
            position:      "absolute",
            bottom:        "10px",
            left:          "50%",
            transform:     "translateX(-50%)",
            fontSize:      "0.6rem",
            color:         "#374151",
            letterSpacing: "0.06em",
            pointerEvents: "none",
            userSelect:    "none",
          }}
        >
          {canvasWidth}px
        </div>
      )}
    </div>
  );
}