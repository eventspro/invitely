/**
 * V2 Builder â€” Right Inspector Panel
 * 3-tab inspector: Content | Style | Advanced
 *
 * This panel is fully generic â€” it contains NO template-specific code.
 * Florence-specific (and future template-specific) inspector components live in
 * their respective template directories and are registered via
 * `manifest.sectionInspectors`. This file only knows about the manifest contract.
 */

import React from "react";
import { useBuilderV2 } from "../BuilderV2Context";
import {
  FieldGroup,
  TextField,
  TextareaField,
  ColorField,
  SelectField,
  DateField,
  AnimationField,
  InfoNote,
  ImageField,
  ButtonLinkField,
} from "./InspectorControls";
import type { InspectorTab } from "../types";
import type { WeddingConfig } from "@/templates/types";
import { getElementValue, setElementValue, setByPath } from "../manifest-types";
import type { TemplatePalette, TemplateColorRoleMap } from "../manifest-types";

const PANEL_STYLE: React.CSSProperties = {
  width:        "280px",
  flexShrink:   0,
  background:   "#111827",
  borderLeft:   "1px solid #1F2937",
  overflowY:    "auto",
  display:      "flex",
  flexDirection: "column",
};

const HEADER_STYLE: React.CSSProperties = {
  padding:      "12px 14px",
  borderBottom: "1px solid #1F2937",
  flexShrink:   0,
};

const CONTENT_STYLE: React.CSSProperties = {
  flex:    1,
  padding: "14px",
  overflowY: "auto",
};

// â”€â”€â”€ Panel header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function InspectorHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={HEADER_STYLE}>
      <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#E2E8F0", margin: 0 }}>
        {title}
      </p>
      {subtitle && (
        <p style={{ fontSize: "0.65rem", color: "#64748B", margin: "2px 0 0" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

// â”€â”€â”€ 1. Global Theme Inspector (no section selected) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function GlobalThemeInspector() {
  const { state, manifest, updateConfig } = useBuilderV2();
  const cfg = state.draftConfig;

  const setColor = (key: keyof NonNullable<NonNullable<WeddingConfig["theme"]>["colors"]>) => (val: string) =>
    updateConfig((c) => ({
      ...c,
      theme: {
        ...c.theme,
        colors: { ...c.theme?.colors, [key]: val },
      },
    }));

  const setFont = (key: keyof NonNullable<NonNullable<WeddingConfig["theme"]>["fonts"]>) => (val: string) =>
    updateConfig((c) => ({
      ...c,
      theme: {
        ...c.theme,
        fonts: { ...c.theme?.fonts, [key]: val },
      },
    }));

  const setCouple = (key: keyof WeddingConfig["couple"]) => (val: string) =>
    updateConfig((c) => ({ ...c, couple: { ...c.couple, [key]: val } }));

  return (
    <>
      <InspectorHeader title="Global Theme" subtitle="Colors, fonts, couple names" />
      <div style={CONTENT_STYLE}>
        <FieldGroup label="Couple">
          <TextField
            label="Groom Name"
            value={cfg.couple?.groomName || ""}
            onChange={setCouple("groomName")}
          />
          <TextField
            label="Bride Name"
            value={cfg.couple?.brideName || ""}
            onChange={setCouple("brideName")}
          />
          <TextField
            label="Combined Names"
            value={cfg.couple?.combinedNames || ""}
            onChange={setCouple("combinedNames")}
          />
        </FieldGroup>

        <FieldGroup label="Wedding Date">
          <DateField
            label="Date (sets countdown & display)"
            value={cfg.wedding?.date || ""}
            onChange={(isoFull, displayDate) =>
              updateConfig((c) => ({
                ...c,
                wedding: { ...c.wedding, date: isoFull, displayDate },
              }))
            }
          />
          <TextField
            label="Display Text Override"
            value={cfg.wedding?.displayDate || ""}
            onChange={(val) =>
              updateConfig((c) => ({ ...c, wedding: { ...c.wedding, displayDate: val } }))
            }
            placeholder="12 â€¢ 07 â€¢ 2026"
          />
        </FieldGroup>

        <FieldGroup label="Theme Colors">
          <ColorField
            label="Gold / Primary"
            value={cfg.theme?.colors?.primary || "#C9A86A"}
            onChange={setColor("primary")}
          />
          <ColorField
            label="Dark Olive / Secondary"
            value={cfg.theme?.colors?.secondary || "#2E3427"}
            onChange={setColor("secondary")}
          />
          <ColorField
            label="Ivory / Background"
            value={cfg.theme?.colors?.background || "#F5F1EA"}
            onChange={setColor("background")}
          />
          <ColorField
            label="Text Color"
            value={cfg.theme?.colors?.textColor || "#252B1F"}
            onChange={setColor("textColor")}
          />
        </FieldGroup>

        <FieldGroup label="Typography">
          <SelectField
            label="Heading Font"
            value={cfg.theme?.fonts?.heading || "Playfair Display, Georgia, serif"}
            onChange={setFont("heading")}
            options={[
              { value: "Playfair Display, Georgia, serif", label: "Playfair Display" },
              { value: "'Cormorant Garamond', Georgia, serif", label: "Cormorant Garamond" },
              { value: "'IM Fell English', Georgia, serif", label: "IM Fell English" },
              { value: "Lora, Georgia, serif", label: "Lora" },
              { value: "Georgia, serif", label: "Georgia" },
            ]}
          />
          <SelectField
            label="Body Font"
            value={cfg.theme?.fonts?.body || "Montserrat, Inter, sans-serif"}
            onChange={setFont("body")}
            options={[
              { value: "Montserrat, Inter, sans-serif", label: "Montserrat" },
              { value: "Inter, sans-serif", label: "Inter" },
              { value: "'Lato', sans-serif", label: "Lato" },
              { value: "system-ui, sans-serif", label: "System UI" },
            ]}
          />
        </FieldGroup>

        <InfoNote>
          Select a section in the canvas or left panel to edit its content.
        </InfoNote>

        {/* Palette picker — manifest-driven, only renders if template provides palettes */}
        {manifest?.themePalettes && manifest.colorRoleConfigPaths && (
          <PalettePickerControl
            palettes={manifest.themePalettes}
            roleMap={manifest.colorRoleConfigPaths}
          />
        )}
      </div>
    </>
  );
}

// ─── Style Tab ────────────────────────────────────────────────────────────────
// ─── Palette Picker Control (manifest-driven, no template-specific imports) ───

const MOOD_BADGE: Record<string, string> = {
  elegant:   "#7C6F9A",
  romantic:  "#9A5A65",
  luxury:    "#8A7240",
  botanical: "#4A6741",
  minimal:   "#607080",
  classic:   "#4A4A45",
  warm:      "#8A5E3A",
  cool:      "#3A6080",
};

function applyPaletteToConfig(
  config: WeddingConfig,
  palette: TemplatePalette,
  roleMap: TemplateColorRoleMap
): WeddingConfig {
  let next: WeddingConfig = config;
  for (const [role, configPath] of Object.entries(roleMap)) {
    const color = palette.colors[role];
    if (color !== undefined) {
      next = setByPath(next, configPath, color);
    }
  }
  return next;
}

function PalettePickerControl({
  palettes,
  roleMap,
}: {
  palettes: TemplatePalette[];
  roleMap: TemplateColorRoleMap;
}) {
  const { updateConfig } = useBuilderV2();

  const handleApply = (palette: TemplatePalette) => {
    updateConfig((c) => applyPaletteToConfig(c, palette, roleMap));
  };

  return (
    <FieldGroup label="Professional Palettes">
      <p style={{ fontSize: "0.62rem", color: "#6B7280", margin: "0 0 10px", lineHeight: 1.4 }}>
        Click Apply to replace the template colors with a curated professional palette.
        Use Undo (Ctrl+Z) to revert.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {palettes.map((palette) => {
          const swatchRoles = Object.keys(roleMap).slice(0, 6);
          const badgeColor = palette.mood ? (MOOD_BADGE[palette.mood] ?? "#4B5563") : "#4B5563";
          return (
            <div
              key={palette.id}
              style={{
                background:    "#1F2937",
                border:        "1px solid #374151",
                borderRadius:  "8px",
                padding:       "8px 10px",
                display:       "flex",
                alignItems:    "center",
                gap:           "8px",
              }}
            >
              {/* Color swatches */}
              <div style={{ display: "flex", gap: "3px", flexShrink: 0 }}>
                {swatchRoles.map((role) => (
                  <div
                    key={role}
                    title={`${role}: ${palette.colors[role] ?? "—"}`}
                    style={{
                      width:        "14px",
                      height:       "14px",
                      borderRadius: "3px",
                      background:   palette.colors[role] ?? "#555",
                      border:       "1px solid rgba(255,255,255,0.1)",
                      flexShrink:   0,
                    }}
                  />
                ))}
              </div>
              {/* Label + mood */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "0.68rem", color: "#E2E8F0", margin: 0, fontWeight: 600 }}>
                  {palette.label}
                </p>
                {palette.mood && (
                  <p style={{
                    fontSize:    "0.55rem",
                    margin:      "2px 0 0",
                    color:       badgeColor,
                    fontWeight:  700,
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                  }}>
                    {palette.mood}
                  </p>
                )}
              </div>
              {/* Apply button */}
              <button
                type="button"
                onClick={() => handleApply(palette)}
                style={{
                  background:   "#374151",
                  border:       "1px solid #4B5563",
                  borderRadius: "5px",
                  color:        "#D1D5DB",
                  cursor:       "pointer",
                  fontSize:     "0.6rem",
                  fontWeight:   600,
                  padding:      "4px 8px",
                  flexShrink:   0,
                  letterSpacing: "0.04em",
                  transition:   "background 0.15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#4B5563"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#374151"; }}
              >
                Apply
              </button>
            </div>
          );
        })}
      </div>
    </FieldGroup>
  );
}

// ─── Style Tab ────────────────────────────────────────────────────────────────
function StyleTab() {
  const { state, manifest, updateConfig } = useBuilderV2();
  const { selectedElement, draftConfig } = state;
  const cfg = draftConfig as any;

  const hasPalettes = !!(manifest?.themePalettes && manifest.colorRoleConfigPaths);

  // Show element-label-aware style controls when an element is selected
  if (selectedElement) {
    const elementLabel = manifest?.elements[selectedElement]?.label ?? selectedElement;
    return (
      <div style={CONTENT_STYLE}>
        <FieldGroup label={`Style: ${elementLabel}`}>
          <InfoNote>
            Style overrides for individual elements coming in the next update.
            Use the Global Theme section (no selection) to change colors &amp; fonts.
          </InfoNote>
          <SelectField
            label="Font Family"
            value={cfg.theme?.fonts?.heading || "Playfair Display, Georgia, serif"}
            onChange={(val) => updateConfig((c) => ({ ...c, theme: { ...c.theme, fonts: { ...c.theme?.fonts, heading: val } } }))}
            options={[
              { value: "Playfair Display, Georgia, serif",     label: "Playfair Display" },
              { value: "'Cormorant Garamond', Georgia, serif",  label: "Cormorant Garamond" },
              { value: "Lora, Georgia, serif",                  label: "Lora" },
              { value: "Georgia, serif",                        label: "Georgia" },
            ]}
          />
          <ColorField
            label="Primary / Gold Color"
            value={cfg.theme?.colors?.primary || "#C9A86A"}
            onChange={(val) => updateConfig((c) => ({ ...c, theme: { ...c.theme, colors: { ...c.theme?.colors, primary: val } } }))}
          />
          <ColorField
            label="Text Color"
            value={cfg.theme?.colors?.textColor || "#252B1F"}
            onChange={(val) => updateConfig((c) => ({ ...c, theme: { ...c.theme, colors: { ...c.theme?.colors, textColor: val } } }))}
          />
        </FieldGroup>
        {hasPalettes && (
          <PalettePickerControl
            palettes={manifest!.themePalettes!}
            roleMap={manifest!.colorRoleConfigPaths!}
          />
        )}
      </div>
    );
  }

  // No element selected — global section background / typography controls
  return (
    <div style={CONTENT_STYLE}>
      <FieldGroup label="Colors">
        <ColorField
          label="Gold / Primary"
          value={cfg.theme?.colors?.primary || "#C9A86A"}
          onChange={(val) => updateConfig((c) => ({ ...c, theme: { ...c.theme, colors: { ...c.theme?.colors, primary: val } } }))}
        />
        <ColorField
          label="Dark / Secondary"
          value={cfg.theme?.colors?.secondary || "#2E3427"}
          onChange={(val) => updateConfig((c) => ({ ...c, theme: { ...c.theme, colors: { ...c.theme?.colors, secondary: val } } }))}
        />
        <ColorField
          label="Background"
          value={cfg.theme?.colors?.background || "#F5F1EA"}
          onChange={(val) => updateConfig((c) => ({ ...c, theme: { ...c.theme, colors: { ...c.theme?.colors, background: val } } }))}
        />
        <ColorField
          label="Text Color"
          value={cfg.theme?.colors?.textColor || "#252B1F"}
          onChange={(val) => updateConfig((c) => ({ ...c, theme: { ...c.theme, colors: { ...c.theme?.colors, textColor: val } } }))}
        />
      </FieldGroup>
      <FieldGroup label="Typography">
        <SelectField
          label="Heading Font"
          value={cfg.theme?.fonts?.heading || "Playfair Display, Georgia, serif"}
          onChange={(val) => updateConfig((c) => ({ ...c, theme: { ...c.theme, fonts: { ...c.theme?.fonts, heading: val } } }))}
          options={[
            { value: "Playfair Display, Georgia, serif",    label: "Playfair Display" },
            { value: "'Cormorant Garamond', Georgia, serif", label: "Cormorant Garamond" },
            { value: "Lora, Georgia, serif",                 label: "Lora" },
            { value: "Georgia, serif",                       label: "Georgia" },
          ]}
        />
        <SelectField
          label="Body Font"
          value={cfg.theme?.fonts?.body || "Montserrat, Inter, sans-serif"}
          onChange={(val) => updateConfig((c) => ({ ...c, theme: { ...c.theme, fonts: { ...c.theme?.fonts, body: val } } }))}
          options={[
            { value: "Montserrat, Inter, sans-serif", label: "Montserrat" },
            { value: "Inter, sans-serif",             label: "Inter" },
            { value: "'Lato', sans-serif",            label: "Lato" },
            { value: "system-ui, sans-serif",         label: "System UI" },
          ]}
        />
      </FieldGroup>
      {hasPalettes && (
        <PalettePickerControl
          palettes={manifest!.themePalettes!}
          roleMap={manifest!.colorRoleConfigPaths!}
        />
      )}
    </div>
  );
}

// ─── Advanced Tab ─────────────────────────────────────────────────────────────
function AdvancedTab() {
  const { state, manifest, updateConfig } = useBuilderV2();
  const { selectedSection, draftConfig } = state;
  const cfg = draftConfig as any;

  // Use manifest configKey to find the animation config key, fall back to raw section id
  const section    = manifest?.sections.find((s) => s.id === selectedSection);
  const sectionKey = section?.configKey ?? (selectedSection || null);
  const animVal    = sectionKey ? (cfg.sections?.[sectionKey]?.animation || "none") : "none";

  return (
    <div style={CONTENT_STYLE}>
      {selectedSection && sectionKey && (
        <FieldGroup label="Animation">
          <AnimationField
            value={animVal}
            onChange={(val) =>
              updateConfig((c) => ({
                ...c,
                sections: {
                  ...(c.sections || {}),
                  [sectionKey]: {
                    ...((c.sections as any)?.[sectionKey] || {}),
                    animation: val,
                  },
                },
              }))
            }
          />
        </FieldGroup>
      )}
      <FieldGroup label="Responsive">
        <InfoNote>
          This template is fully responsive. It adapts to desktop, tablet, and mobile automatically. Use the device selector in the top bar to preview.
        </InfoNote>
      </FieldGroup>
      <FieldGroup label="Custom CSS">
        <InfoNote>
          Custom CSS is scoped to this template only. Changes will be applied on save.
        </InfoNote>
        <TextareaField
          label="CSS (advanced)"
          value={cfg.customCss || ""}
          onChange={(val) => updateConfig((c) => ({ ...c, customCss: val } as any))}
          rows={6}
          placeholder=".flo-hero-names { font-size: 5rem; }"
          monospace
        />
      </FieldGroup>
    </div>
  );
}

// ─── Element-specific Content Controls ───────────────────────────────────────
function ElementContentControls({ elementId }: { elementId: string }) {
  const { state, manifest, updateConfig } = useBuilderV2();
  // Manifest is the sole source — no Florence-specific fallback
  const meta = manifest?.elements[elementId];
  if (!meta) {
    return (
      <div style={CONTENT_STYLE}>
        <InfoNote>
          No editable controls for "{elementId}". Add this element to the template manifest to enable editing.
        </InfoNote>
      </div>
    );
  }

  const cfg = state.draftConfig;
  const currentValue = getElementValue(meta, cfg);

  // ── Button type: show ButtonLinkField ──────────────────────────────────────
  if (meta.type === "button") {
    const hrefKey  = `${elementId.replace("-", "")}Href`  as any;
    const tabKey   = `${elementId.replace("-", "")}NewTab` as any;
    const hrefVal  = (cfg as any)[hrefKey]  ?? "#rsvp";
    const tabVal   = (cfg as any)[tabKey]   ?? false;

    return (
      <div style={CONTENT_STYLE}>
        <FieldGroup label={`Button: ${meta.label}`}>
          <ButtonLinkField
            labelValue={currentValue}
            hrefValue={hrefVal}
            newTabValue={tabVal}
            onLabelChange={(v) => updateConfig((c) => setElementValue(meta, c, v))}
            onHrefChange={(v) => updateConfig((c) => ({ ...c, [hrefKey]: v } as any))}
            onNewTabChange={(v) => updateConfig((c) => ({ ...c, [tabKey]: v } as any))}
          />
        </FieldGroup>
      </div>
    );
  }

  // ── Image type: show ImageField ────────────────────────────────────────────
  if (meta.type === "image") {
    return (
      <div style={CONTENT_STYLE}>
        <FieldGroup label={`Image: ${meta.label}`}>
          <ImageField
            label="Image URL"
            value={currentValue}
            onChange={(v) => updateConfig((c) => setElementValue(meta, c, v))}
            helpText="Paste a direct image URL or upload via the gallery manager"
          />
        </FieldGroup>
      </div>
    );
  }

  // ── Default: text field ────────────────────────────────────────────────────
  return (
    <div style={CONTENT_STYLE}>
      <FieldGroup label={`Edit: ${meta.label}`}>
        <TextField
          label="Text Content"
          value={currentValue}
          onChange={(val) => updateConfig((c) => setElementValue(meta, c, val))}
        />
        <InfoNote>
          This is a direct text override. You can also double-click the element in the canvas to edit inline.
        </InfoNote>
      </FieldGroup>
    </div>
  );
}

// ─── Generic section inspector fallback ──────────────────────────────────────
/**
 * Rendered when a section has no inspector in manifest.sectionInspectors.
 * Future templates should provide sectionInspectors for a better UX, but this
 * safe fallback ensures the builder never crashes on unknown sections.
 */
function GenericSectionInspector({ sectionId }: { sectionId: string }) {
  const { manifest } = useBuilderV2();
  const section = manifest?.sections.find((s) => s.id === sectionId);
  return (
    <div style={CONTENT_STYLE}>
      <InfoNote>
        Select an element within "{section?.label ?? sectionId}" to edit its content.
        Add a <code style={{ fontSize: "0.65rem" }}>sectionInspectors</code> entry
        in the template manifest to show custom controls here.
      </InfoNote>
    </div>
  );
}

// ─── Main Right Panel router ──────────────────────────────────────────────────
export function BuilderRightPanel() {
  const { state, manifest, setTab } = useBuilderV2();
  const { selectedSection, selectedElement, inspectorTab, builderMode } = state;

  if (builderMode === "preview") return null;

  // ── Header badge labels ────────────────────────────────────────────────────
  const sectionDef   = manifest?.sections.find((s) => s.id === selectedSection);
  const elementDef   = selectedElement ? manifest?.elements[selectedElement] : null;
  const contextLabel = elementDef
    ? `Element: ${elementDef.label}`
    : sectionDef
    ? `Section: ${sectionDef.label}`
    : selectedSection
    ? `Section: ${selectedSection}`
    : "Global Theme";

  // ── Tab content ─────────────────────────────────────────────────────────────
  let contentInspector: React.ReactNode;

  if (inspectorTab === "style") {
    contentInspector = <StyleTab />;
  } else if (inspectorTab === "advanced") {
    contentInspector = <AdvancedTab />;
  } else {
    // Content tab — element-specific if element selected, else section inspector
    if (selectedElement) {
      const ElementInspector = manifest?.elementInspectors?.[selectedElement];
      contentInspector = ElementInspector
        ? <ElementInspector />
        : <ElementContentControls elementId={selectedElement} />;
    } else if (selectedSection) {
      // Manifest custom inspector takes priority; fall back to generic
      const SectionInspector = manifest?.sectionInspectors?.[selectedSection];
      if (SectionInspector) {
        contentInspector = <SectionInspector />;
      } else {
        contentInspector = <GenericSectionInspector sectionId={selectedSection} />;
      }
    } else {
      contentInspector = <GlobalThemeInspector />;
    }
  }

  const tabs: Array<{ id: InspectorTab; label: string }> = [
    { id: "content",  label: "Content"  },
    { id: "style",    label: "Style"    },
    { id: "advanced", label: "Advanced" },
  ];

  return (
    <div style={PANEL_STYLE}>
      {/* Panel context label */}
      <div style={{ padding: "8px 14px", borderBottom: "1px solid #1F2937", flexShrink: 0 }}>
        <p
          style={{
            fontSize:     "0.6rem",
            color:        "#6366F1",
            fontWeight:   700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            margin:        0,
            whiteSpace:    "nowrap",
            overflow:      "hidden",
            textOverflow:  "ellipsis",
          }}
        >
          {contextLabel}
        </p>
      </div>

      {/* Tab bar */}
      <div
        style={{
          display:      "flex",
          borderBottom: "1px solid #1F2937",
          flexShrink:   0,
        }}
      >
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              flex:        1,
              padding:     "8px 4px",
              background:  "transparent",
              border:      "none",
              borderBottom: inspectorTab === id ? "2px solid #6366F1" : "2px solid transparent",
              color:        inspectorTab === id ? "#E2E8F0" : "#6B7280",
              cursor:      "pointer",
              fontSize:    "0.65rem",
              fontWeight:   inspectorTab === id ? 700 : 400,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              transition:   "color 0.15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        {contentInspector}
      </div>
    </div>
  );
}


