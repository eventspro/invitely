/**
 * V2 Builder — Type Definitions
 * Completely isolated from V1 builder internals.
 */

import React from "react";
import type { WeddingConfig } from "@/templates/types";
import type { V2TemplateManifest } from "./manifest-types";

// ─── Device preview sizes ──────────────────────────────────────────────────
export type DevicePreview = "desktop" | "tablet" | "mobile";

export const DEVICE_WIDTHS: Record<DevicePreview, number> = {
  desktop: 1280,
  tablet:  768,
  mobile:  390,
};

// ─── Selectable section IDs (match data-v2-section attrs in FlorenceTemplate) ─
export type V2SectionId =
  | "flo-hero"
  | "flo-story"
  | "flo-countdown"
  | "flo-journey"
  | "flo-details"
  | "flo-venue"
  | "flo-gallery"
  | "flo-rsvp"
  | "flo-footer";

export const V2_SECTIONS: { id: V2SectionId; label: string; icon: string }[] = [
  { id: "flo-hero",      label: "Hero",            icon: "🏛" },
  { id: "flo-story",     label: "Our Story",       icon: "📖" },
  { id: "flo-countdown", label: "Countdown",       icon: "⏳" },
  { id: "flo-journey",   label: "Journey",         icon: "🗺" },
  { id: "flo-details",   label: "Wedding Details", icon: "💍" },
  { id: "flo-venue",     label: "Venue",           icon: "🏰" },
  { id: "flo-gallery",   label: "Gallery",         icon: "🖼" },
  { id: "flo-rsvp",      label: "RSVP",            icon: "✉" },
  { id: "flo-footer",    label: "Footer",          icon: "⚓" },
];

// ─── Fine-grained element IDs (individual editable elements in FlorenceTemplate) ─
export type V2ElementId =
  | "hero-intro"
  | "hero-title"
  | "hero-date"
  | "hero-location"
  | "story-title"
  | "story-text"
  | "story-cta"
  | "countdown-title"
  | "venue-subtitle"
  | "venue-title"
  | "venue-desc"
  | "footer-tagline";

export type V2ElementType = "text" | "image" | "button" | "form" | "list";

export interface V2ElementMeta {
  id:        V2ElementId;
  sectionId: V2SectionId;
  label:     string;
  type:      V2ElementType;
  locked?:   boolean;
  /** Get current value from config */
  getValue:  (cfg: WeddingConfig) => string;
  /** Return updated config with new value */
  setValue:  (cfg: WeddingConfig, value: string) => WeddingConfig;
}

// ─── Inspector tab ────────────────────────────────────────────────────────
export type InspectorTab = "content" | "style" | "advanced";

// ─── Builder mode ─────────────────────────────────────────────────────────
export type BuilderMode = "editing" | "preview";

// ─── Builder panel (right-side panel mode) ────────────────────────────────
export type BuilderPanel = "inspector" | "settings";

// ─── Builder history entry ────────────────────────────────────────────────
export interface BuilderHistoryEntry {
  config: WeddingConfig;
  timestamp: number;
}

// ─── History limit ────────────────────────────────────────────────────────────
export const MAX_HISTORY = 50;

// ─── Full builder state ───────────────────────────────────────────────────────
export interface BuilderV2State {
  templateId:        string;
  templateName:      string;
  savedConfig:       WeddingConfig;
  draftConfig:       WeddingConfig;
  /** Generic string — matches data-v2-section attribute and V2SectionManifest.id */
  selectedSection:   string | null;
  /** Generic string — matches data-v2-element attribute and V2ElementManifest.id */
  selectedElement:   string | null;
  inspectorTab:      InspectorTab;
  builderMode:       BuilderMode;
  builderPanel:      BuilderPanel;
  devicePreview:     DevicePreview;
  hasUnsavedChanges: boolean;
  isSaving:          boolean;
  isPublishing:      boolean;
  lastSaved:         Date | null;
  past:              WeddingConfig[];
  future:            WeddingConfig[];
}

// ─── Reducer actions ──────────────────────────────────────────────────────────
export type BuilderV2Action =
  | { type: "UPDATE_CONFIG";     updater: (cfg: WeddingConfig) => WeddingConfig }
  | { type: "SELECT_SECTION";    sectionId: string | null }
  | { type: "SELECT_ELEMENT";    elementId: string | null; sectionId?: string }
  | { type: "SET_DEVICE";        device: DevicePreview }
  | { type: "SET_TAB";           tab: InspectorTab }
  | { type: "SET_MODE";          mode: BuilderMode }
  | { type: "SET_PANEL";         panel: BuilderPanel }
  | { type: "SET_NAME";          name: string }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "SAVE_START" }
  | { type: "SAVE_SUCCESS";      config: WeddingConfig }
  | { type: "SAVE_ERROR" }
  | { type: "PUBLISH_START" }
  | { type: "PUBLISH_SUCCESS" }
  | { type: "PUBLISH_ERROR" }
  | { type: "DISCARD" };

// ─── Context value ────────────────────────────────────────────────────────────
export interface BuilderV2ContextValue {
  state:           BuilderV2State;
  dispatch:        React.Dispatch<BuilderV2Action>;
  /** Active template manifest (null if templateKey is not yet registered) */
  manifest:        V2TemplateManifest | null;
  updateConfig:    (updater: (cfg: WeddingConfig) => WeddingConfig) => void;
  selectSection:   (id: string | null) => void;
  selectElement:   (id: string | null, sectionId?: string) => void;
  setDevice:       (device: DevicePreview) => void;
  setTab:          (tab: InspectorTab) => void;
  setMode:         (mode: BuilderMode) => void;
  setPanel:        (panel: BuilderPanel) => void;
  setName:         (name: string) => void;
  undo:            () => void;
  redo:            () => void;
  save:            () => void;
  publish:         () => void;
  discard:         () => void;
  canUndo:         boolean;
  canRedo:         boolean;
}