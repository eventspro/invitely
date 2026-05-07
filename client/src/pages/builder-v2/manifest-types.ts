/**
 * V2 Builder — Generic Manifest Types
 *
 * Defines the schema-driven manifest interface that all V2 templates must implement.
 * Builder internals read from this manifest instead of any template-specific constants.
 *
 * ── Template authoring contract ──────────────────────────────────────────────
 * A new V2 template must provide:
 *   1. Template React component   → client/src/templates/{name}/{Name}Template.tsx
 *   2. Default config             → client/src/templates/{name}/config.ts
 *   3. This manifest              → client/src/templates/{name}/manifest.ts
 *   4. data-v2-section + data-v2-element attributes on all editable JSX nodes
 *   5. One line in                → client/src/templates/v2-templates.ts
 *
 * No changes are required in BuilderLeftPanel, BuilderCanvas, BuilderRightPanel,
 * or BuilderTopBar unless a completely new control type is introduced.
 */

import type React from "react";

// ─── Supported element types ──────────────────────────────────────────────────
export type V2GenericElementType =
  | "text"
  | "textarea"
  | "image"
  | "button"
  | "section"
  | "countdown"
  | "roadmap"
  | "timeline"
  | "location"
  | "gallery"
  | "rsvp"
  | "form"
  | "list"
  | "icon"
  | "socialLinks"
  | "theme"
  | "custom";

// ─── Editable element within a section ───────────────────────────────────────
export interface V2ElementManifest {
  /** Unique ID — must match the data-v2-element attribute in the template JSX */
  id: string;
  label: string;
  icon?: string;
  /** The section this element belongs to */
  sectionId: string;
  type: V2GenericElementType;
  /**
   * Dot-path into config, e.g. "couple.groomName".
   * Used by generic getElementValue/setElementValue when no custom fns are provided.
   */
  configPath?: string;
  locked?: boolean;
  /** Custom getter — takes priority over configPath */
  getValue?: (cfg: any) => string;
  /** Custom setter — takes priority over configPath. Must return new config immutably. */
  setValue?: (cfg: any, value: string) => any;
}

// ─── Child node in the layer tree ────────────────────────────────────────────
/** A child row in the layer tree. May optionally reference an editable element. */
export interface V2LayerChildManifest {
  id: string;
  label: string;
  icon?: string;
  sectionId: string;
  /** If set, clicking this row selects the element for editing */
  elementId?: string;
  locked?: boolean;
}

// ─── Top-level section manifest ───────────────────────────────────────────────
export interface V2SectionManifest {
  /** Unique section ID — must match the data-v2-section attribute in the template JSX */
  id: string;
  label: string;
  icon: string;
  /**
   * The key used in cfg.sections[configKey].enabled / .animation
   * If omitted, defaults to the full section id.
   * Florence example: id="flo-hero" → configKey="hero"
   */
  configKey?: string;
  hideable?: boolean;
  reorderable?: boolean;
  locked?: boolean;
  children: V2LayerChildManifest[];
}

// ─── Full template manifest ───────────────────────────────────────────────────
export interface V2TemplateManifest {
  /** Must match the templateKey stored in the database / API response */
  templateKey: string;
  displayName: string;
  /** Top-level sections — drives the left panel layer tree (order matters) */
  sections: V2SectionManifest[];
  /** All editable elements, keyed by element ID */
  elements: Record<string, V2ElementManifest>;
  /**
   * Factory for the template React component.
   * Used by BuilderCanvas for dynamic lazy loading.
   * Example: () => import("@/templates/florence/FlorenceTemplate")
   */
  getComponent: () => Promise<{ default: React.ComponentType<any> }>;
  /**
   * Optional per-section inspector component overrides.
   * If provided for a section, BuilderRightPanel renders this instead of the
   * built-in or generic inspector.
   * Key = section ID (matches V2SectionManifest.id).
   */
  sectionInspectors?: Record<string, React.ComponentType>;
  /**
   * Optional per-element inspector component overrides.
   * When an element is selected, this inspector is shown instead of the
   * generic single-field ElementContentControls.
   * Key = element ID (matches V2ElementManifest.id).
   *
   * Use this for compound elements (e.g. couple names block) where a single
   * text field is insufficient and you want to reuse a section inspector.
   */
  elementInspectors?: Record<string, React.ComponentType>;
  /**
   * Optional curated professional palettes for this template.
   * If present, BuilderRightPanel renders a palette picker in the global theme panel.
   * If absent, no palette UI is shown — safe for templates without palette support.
   */
  themePalettes?: TemplatePalette[];
  /**
   * Maps palette color role names to dot-paths inside WeddingConfig.
   * Used by the generic palette picker to apply colors via setByPath.
   * Example: { primary: "theme.colors.primary", text: "theme.colors.textColor" }
   */
  colorRoleConfigPaths?: TemplateColorRoleMap;
}

// ─── Palette types ────────────────────────────────────────────────────────────

/**
 * A single curated professional color palette.
 * colors keys are template-defined role names (e.g. "primary", "background").
 * They are mapped to config paths via colorRoleConfigPaths.
 */
export type TemplatePalette = {
  id: string;
  label: string;
  mood?: "elegant" | "romantic" | "luxury" | "botanical" | "minimal" | "classic" | "warm" | "cool";
  colors: Record<string, string>;
};

/**
 * Maps palette color role names to dot-paths into WeddingConfig.
 * Example: { primary: "theme.colors.primary", text: "theme.colors.textColor" }
 */
export type TemplateColorRoleMap = Record<string, string>;

// ─── configPath utilities ─────────────────────────────────────────────────────

/**
 * Read a value from a nested object using dot-path notation.
 * Returns undefined (not throws) if any part of the path is missing.
 *
 * @example getByPath(cfg, "couple.groomName") → "Arsen"
 */
export function getByPath(obj: unknown, path: string): unknown {
  if (!path) return obj;
  return path.split(".").reduce((acc: any, key) => acc?.[key], obj as any);
}

/**
 * Return a new object with the value at dot-path set to `value`.
 * Creates missing intermediate objects immutably. Does not mutate the input.
 *
 * @example setByPath(cfg, "couple.groomName", "Arsen") → { ...cfg, couple: { groomName: "Arsen" } }
 */
export function setByPath<T extends object>(obj: T, path: string, value: unknown): T {
  if (!path) return obj;
  const keys = path.split(".");
  const result = { ...obj } as any;
  let current = result;
  for (let i = 0; i < keys.length - 1; i++) {
    current[keys[i]] = current[keys[i]] ? { ...current[keys[i]] } : {};
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
  return result;
}

/**
 * Get the current string value for an element using its manifest definition.
 * Prefers custom getValue(), falls back to configPath, falls back to "".
 */
export function getElementValue(element: V2ElementManifest, cfg: any): string {
  if (element.getValue) return element.getValue(cfg);
  if (element.configPath) {
    const v = getByPath(cfg, element.configPath);
    return typeof v === "string" ? v : "";
  }
  return "";
}

/**
 * Set a new string value for an element using its manifest definition.
 * Prefers custom setValue(), falls back to configPath, falls back to returning cfg unchanged.
 */
export function setElementValue(element: V2ElementManifest, cfg: any, value: string): any {
  if (element.setValue) return element.setValue(cfg, value);
  if (element.configPath) return setByPath(cfg, element.configPath, value);
  return cfg;
}
