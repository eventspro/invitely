/**
 * V2 Builder -- Left Panel (Hierarchical Layers Tree with drag-to-reorder)
 * Renders sections from the active template manifest.
 * Top-level nodes = sections (draggable). Leaf nodes = elements.
 */

import React, { useState, useRef, useEffect } from "react";
import { useBuilderV2 } from "../BuilderV2Context";
import type { V2SectionManifest, V2LayerChildManifest } from "../manifest-types";

export function BuilderLeftPanel() {
  const { state, manifest, selectSection, selectElement, updateConfig } = useBuilderV2();
  const { selectedSection, selectedElement, draftConfig, builderMode } = state;

  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const s = new Set<string>();
    if (selectedSection) s.add(selectedSection);
    return s;
  });

  const [layerOrder, setLayerOrder] = useState<string[]>(() => {
    const savedOrder = (draftConfig as any).sectionOrder as string[] | undefined;
    const manifestOrder = (manifest?.sections ?? []).map((s) => s.id);
    if (savedOrder?.length) {
      const merged = savedOrder.filter((id: string) => manifestOrder.includes(id));
      manifestOrder.forEach((id) => { if (!merged.includes(id)) merged.push(id); });
      return merged;
    }
    return manifestOrder;
  });

  // Sync layer order when manifest/templateKey changes (template switch scenario)
  useEffect(() => {
    const savedOrder = (draftConfig as any).sectionOrder as string[] | undefined;
    const manifestOrder = manifest ? manifest.sections.map((s) => s.id) : [];
    if (savedOrder?.length) {
      const merged = savedOrder.filter((id: string) => manifestOrder.includes(id));
      manifestOrder.forEach((id) => { if (!merged.includes(id)) merged.push(id); });
      setLayerOrder(merged);
    } else {
      setLayerOrder(manifestOrder);
    }
  }, [manifest?.templateKey]);

  const dragSrcId = useRef<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  if (builderMode === "preview") return null;

  const sections = manifest?.sections ?? [];

  const orderedSections = layerOrder
    .map((id) => sections.find((s) => s.id === id))
    .filter((s): s is V2SectionManifest => s != null);

  /** Get the config key for a section (used for visibility + animation lookups) */
  const getSectionConfigKey = (sectionId: string): string => {
    const section = sections.find((s) => s.id === sectionId);
    return section?.configKey ?? sectionId;
  };

  const isSectionEnabled = (id: string): boolean => {
    const key = getSectionConfigKey(id);
    return (draftConfig.sections as any)?.[key]?.enabled !== false;
  };

  const toggleVisibility = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const key = getSectionConfigKey(id);
    updateConfig((cfg) => ({
      ...cfg,
      sections: {
        ...(cfg.sections || {}),
        [key]: {
          ...((cfg.sections as any)?.[key] || {}),
          enabled: !isSectionEnabled(id),
        },
      },
    }));
  };

  const handleSectionClick = (section: V2SectionManifest) => {
    selectSection(section.id);
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(section.id)) next.delete(section.id);
      else next.add(section.id);
      return next;
    });
    const el = document.querySelector(`[data-v2-section="${section.id}"]`) as HTMLElement | null;
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleChildClick = (child: V2LayerChildManifest, e: React.MouseEvent) => {
    e.stopPropagation();
    if (child.locked) return;
    if (child.elementId) {
      selectElement(child.elementId, child.sectionId);
      const el = document.querySelector(`[data-v2-element="${child.elementId}"]`) as HTMLElement | null;
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      selectSection(child.sectionId);
    }
  };

  const isSectionSelected = (section: V2SectionManifest) =>
    selectedSection === section.id && !selectedElement;

  const isChildSelected = (child: V2LayerChildManifest) =>
    child.elementId ? selectedElement === child.elementId : false;

  // -- Drag-to-reorder handlers ----------------------------------------------
  const handleDragStart = (id: string) => {
    dragSrcId.current = id;
  };

  const handleDragOver = (id: string, e: React.DragEvent) => {
    e.preventDefault();
    if (dragSrcId.current && dragSrcId.current !== id) {
      setDragOverId(id);
    }
  };

  const handleDrop = (targetId: string) => {
    const srcId = dragSrcId.current;
    if (!srcId || srcId === targetId) {
      dragSrcId.current = null;
      setDragOverId(null);
      return;
    }
    const newOrder = [...layerOrder];
    const srcIdx = newOrder.indexOf(srcId);
    const tgtIdx = newOrder.indexOf(targetId);
    if (srcIdx !== -1 && tgtIdx !== -1) {
      newOrder.splice(srcIdx, 1);
      newOrder.splice(tgtIdx, 0, srcId);
    }
    setLayerOrder(newOrder);
    updateConfig((cfg) => ({ ...cfg, sectionOrder: newOrder } as any));
    dragSrcId.current = null;
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    dragSrcId.current = null;
    setDragOverId(null);
  };

  return (
    <div
      style={{
        width:         "240px",
        flexShrink:    0,
        background:    "#111827",
        borderRight:   "1px solid #1F2937",
        display:       "flex",
        flexDirection: "column",
        overflowY:     "auto",
      }}
    >
      {/* Header */}
      <div style={{ padding: "12px 14px", borderBottom: "1px solid #1F2937", flexShrink: 0 }}>
        <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "#6366F1", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
          Layers
        </p>
        <p style={{ fontSize: "0.58rem", color: "#374151", margin: "2px 0 0", lineHeight: 1.4 }}>
          Drag handle to reorder sections
        </p>
      </div>

      {/* No manifest fallback */}
      {!manifest && (
        <div style={{ padding: "16px 14px", color: "#64748B", fontSize: "0.7rem" }}>
          Loading template…
        </div>
      )}

      {/* Tree */}
      <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
        {orderedSections.map((section) => {
          const isExp        = expanded.has(section.id);
          const isSel        = isSectionSelected(section);
          const enabled      = isSectionEnabled(section.id);
          const isDragTarget = dragOverId === section.id;

          return (
            <div
              key={section.id}
              draggable
              onDragStart={() => handleDragStart(section.id)}
              onDragOver={(e) => handleDragOver(section.id, e)}
              onDrop={() => handleDrop(section.id)}
              onDragEnd={handleDragEnd}
              style={{
                borderTop:  isDragTarget ? "2px solid #6366F1" : "2px solid transparent",
                transition: "border-color 0.1s",
              }}
            >
              {/* Section row */}
              <div
                onClick={() => handleSectionClick(section as V2SectionManifest)}
                style={{
                  display:    "flex",
                  alignItems: "center",
                  padding:    "8px 12px 8px 10px",
                  cursor:     "pointer",
                  background: isSel ? "#1E293B" : "transparent",
                  borderLeft: isSel ? "2px solid #6366F1" : "2px solid transparent",
                  opacity:    enabled ? 1 : 0.45,
                  gap:        "6px",
                  userSelect: "none",
                }}
                onMouseEnter={(e) => { if (!isSel) (e.currentTarget as HTMLElement).style.background = "#1A2332"; }}
                onMouseLeave={(e) => { if (!isSel) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                {/* Drag handle (= symbol) */}
                <span
                  title="Drag to reorder"
                  style={{
                    fontSize:   "0.85rem",
                    color:      "#374151",
                    cursor:     "grab",
                    flexShrink: 0,
                    lineHeight: 1,
                    userSelect: "none",
                    fontWeight: 700,
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  =
                </span>

                {/* Chevron */}
                <span
                  style={{
                    fontSize:   "0.55rem",
                    color:      "#64748B",
                    width:      "10px",
                    flexShrink: 0,
                    transition: "transform 0.15s",
                    transform:  isExp ? "rotate(90deg)" : "rotate(0deg)",
                    display:    "inline-block",
                  }}
                >
                  {">"}
                </span>

                {/* Icon */}
                <span style={{ fontSize: "0.85rem", width: "16px", textAlign: "center", flexShrink: 0 }}>
                  {section.icon}
                </span>

                {/* Label */}
                <span style={{ flex: 1, fontSize: "0.78rem", fontWeight: isSel ? 600 : 400, color: isSel ? "#E2E8F0" : "#94A3B8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {section.label}
                </span>

                {/* Eye toggle */}
                {section.hideable !== false && (
                  <button
                    onClick={(e) => toggleVisibility(section.id, e)}
                    title={enabled ? "Hide section" : "Show section"}
                    style={{
                      background: "transparent",
                      border:     "none",
                      cursor:     "pointer",
                      color:      enabled ? "#6366F1" : "#374151",
                      padding:    "2px",
                      fontSize:   "0.65rem",
                      flexShrink: 0,
                      lineHeight: 1,
                      fontWeight: 700,
                    }}
                  >
                    {enabled ? "ON" : "OFF"}
                  </button>
                )}
              </div>

              {/* Children (elements) */}
              {isExp && section.children && section.children.map((child) => {
                const childSel = isChildSelected(child);
                return (
                  <div
                    key={child.id}
                    onClick={(e) => handleChildClick(child, e)}
                    style={{
                      display:    "flex",
                      alignItems: "center",
                      padding:    "6px 12px 6px 34px",
                      cursor:     child.locked ? "default" : "pointer",
                      background: childSel ? "#1A2540" : "transparent",
                      borderLeft: childSel ? "2px solid #818CF8" : "2px solid transparent",
                      gap:        "6px",
                      userSelect: "none",
                      opacity:    child.locked ? 0.5 : 1,
                      position:   "relative",
                    }}
                    onMouseEnter={(e) => { if (!childSel && !child.locked) (e.currentTarget as HTMLElement).style.background = "#161E2E"; }}
                    onMouseLeave={(e) => { if (!childSel) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    {/* Tree connector lines */}
                    <span style={{ position: "absolute", left: "20px", top: 0, bottom: "50%", width: "1px", background: "#1F2937" }} />
                    <span style={{ position: "absolute", left: "20px", top: "50%", width: "10px", height: "1px", background: "#1F2937" }} />

                    {/* Icon */}
                    <span style={{ fontSize: "0.7rem", width: "14px", textAlign: "center", flexShrink: 0 }}>
                      {child.icon ?? "◻"}
                    </span>

                    {/* Label */}
                    <span style={{ flex: 1, fontSize: "0.72rem", fontWeight: childSel ? 600 : 400, color: childSel ? "#C7D2FE" : "#6B7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {child.label}
                    </span>

                    {/* Lock badge */}
                    {child.locked && (
                      <span style={{ fontSize: "0.6rem", color: "#374151", flexShrink: 0 }}>LOCK</span>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div style={{ padding: "10px 14px", borderTop: "1px solid #1F2937", flexShrink: 0 }}>
        <p style={{ fontSize: "0.6rem", color: "#374151", margin: 0, lineHeight: 1.5 }}>
          Click section to expand / click element to edit
        </p>
      </div>
    </div>
  );
}
