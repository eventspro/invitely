/**
 * V2 Builder — Reusable Inspector Control Primitives
 * Premium compact controls for the right-side inspector panel.
 */

import React, { useState, useRef } from "react";
import { DetailIcon, DETAIL_ICON_KEYS, DETAIL_ICON_LABELS } from "../../../templates/shared/detail-icons";

// ─── Shared styles ────────────────────────────────────────────────────────────
const LABEL_STYLE: React.CSSProperties = {
  display:       "block",
  fontSize:      "0.65rem",
  fontWeight:    600,
  letterSpacing: "0.06em",
  color:         "#9CA3AF",
  textTransform: "uppercase",
  marginBottom:  "4px",
};

const INPUT_BASE: React.CSSProperties = {
  width:           "100%",
  background:      "#1F2937",
  border:          "1px solid #374151",
  borderRadius:    "6px",
  padding:         "6px 10px",
  fontSize:        "0.8rem",
  color:           "#F3F4F6",
  outline:         "none",
  transition:      "border-color 0.15s",
  boxSizing:       "border-box",
  fontFamily:      "inherit",
};

// ─── FieldGroup ───────────────────────────────────────────────────────────────
export function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <p
        style={{
          fontSize:      "0.6rem",
          fontWeight:    700,
          color:         "#6366F1",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          marginBottom:  "10px",
          paddingBottom: "4px",
          borderBottom:  "1px solid #374151",
        }}
      >
        {label}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {children}
      </div>
    </div>
  );
}

// ─── TextField ────────────────────────────────────────────────────────────────
interface TextFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  monospace?: boolean;
}

export function TextField({ label, value, onChange, placeholder, monospace }: TextFieldProps) {
  return (
    <div>
      <label style={LABEL_STYLE}>{label}</label>
      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          ...INPUT_BASE,
          fontFamily: monospace ? "monospace" : "inherit",
        }}
        onFocus={(e) => {
          (e.target as HTMLInputElement).style.borderColor = "#6366F1";
        }}
        onBlur={(e) => {
          (e.target as HTMLInputElement).style.borderColor = "#374151";
        }}
      />
    </div>
  );
}

// ─── TextareaField ────────────────────────────────────────────────────────────
interface TextareaFieldProps {
  label:       string;
  value:       string;
  onChange:    (val: string) => void;
  placeholder?: string;
  rows?:       number;
  monospace?:  boolean;
}

export function TextareaField({ label, value, onChange, placeholder, rows = 3, monospace }: TextareaFieldProps) {
  return (
    <div>
      <label style={LABEL_STYLE}>{label}</label>
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={{
          ...INPUT_BASE,
          resize:     "vertical",
          lineHeight: 1.5,
          fontFamily: monospace ? "monospace" : undefined,
        }}
        onFocus={(e) => {
          (e.target as HTMLTextAreaElement).style.borderColor = "#6366F1";
        }}
        onBlur={(e) => {
          (e.target as HTMLTextAreaElement).style.borderColor = "#374151";
        }}
      />
    </div>
  );
}

// ─── ColorField ───────────────────────────────────────────────────────────────
interface ColorFieldProps {
  label:    string;
  value:    string;
  onChange: (val: string) => void;
}

export function ColorField({ label, value, onChange }: ColorFieldProps) {
  return (
    <div>
      <label style={LABEL_STYLE}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width:        "36px",
            height:       "30px",
            border:       "1px solid #374151",
            borderRadius: "6px",
            padding:      "2px",
            background:   "#1F2937",
            cursor:       "pointer",
          }}
        />
        <input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#RRGGBB"
          maxLength={7}
          style={{
            ...INPUT_BASE,
            fontFamily: "monospace",
            fontSize:   "0.75rem",
            flex:       1,
          }}
          onFocus={(e) => {
            (e.target as HTMLInputElement).style.borderColor = "#6366F1";
          }}
          onBlur={(e) => {
            (e.target as HTMLInputElement).style.borderColor = "#374151";
          }}
        />
      </div>
    </div>
  );
}

// ─── SelectField ──────────────────────────────────────────────────────────────
interface SelectFieldProps {
  label:    string;
  value:    string;
  onChange: (val: string) => void;
  options:  { value: string; label: string }[];
}

export function SelectField({ label, value, onChange, options }: SelectFieldProps) {
  return (
    <div>
      <label style={LABEL_STYLE}>{label}</label>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        style={{
          ...INPUT_BASE,
          cursor: "pointer",
          appearance: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat:   "no-repeat",
          backgroundPosition: "right 10px center",
          paddingRight:       "28px",
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── ToggleField ──────────────────────────────────────────────────────────────
interface ToggleFieldProps {
  label:    string;
  value:    boolean;
  onChange: (val: boolean) => void;
  helpText?: string;
}

export function ToggleField({ label, value, onChange, helpText }: ToggleFieldProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
      <div>
        <p style={{ ...LABEL_STYLE, marginBottom: helpText ? "2px" : 0 }}>{label}</p>
        {helpText && (
          <p style={{ fontSize: "0.65rem", color: "#6B7280", margin: 0 }}>{helpText}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        style={{
          width:        "36px",
          height:       "20px",
          borderRadius: "999px",
          border:       "none",
          cursor:       "pointer",
          background:   value ? "#6366F1" : "#374151",
          position:     "relative",
          flexShrink:   0,
          transition:   "background 0.2s",
        }}
      >
        <span
          style={{
            position:     "absolute",
            top:          "2px",
            left:         value ? "18px" : "2px",
            width:        "16px",
            height:       "16px",
            borderRadius: "50%",
            background:   "#fff",
            transition:   "left 0.2s",
          }}
        />
      </button>
    </div>
  );
}

// ─── SectionDivider ───────────────────────────────────────────────────────────
export function SectionDivider() {
  return (
    <div
      style={{
        height:     "1px",
        background: "#1F2937",
        margin:     "4px 0",
      }}
    />
  );
}

// ─── InfoNote ─────────────────────────────────────────────────────────────────
export function InfoNote({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background:   "#1E293B",
        border:       "1px solid #334155",
        borderRadius: "6px",
        padding:      "8px 10px",
        fontSize:     "0.7rem",
        color:        "#94A3B8",
        lineHeight:   1.5,
      }}
    >
      {children}
    </div>
  );
}

// MilestoneEditor and VenueCardEditor are defined later in this file (enhanced versions with add/remove/reorder).

// ─── SliderField ──────────────────────────────────────────────────────────────
interface SliderFieldProps {
  label:    string;
  value:    number;
  onChange: (val: number) => void;
  min:      number;
  max:      number;
  step?:    number;
  unit?:    string;
}

export function SliderField({ label, value, onChange, min, max, step = 1, unit = "" }: SliderFieldProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={LABEL_STYLE}>{label}</p>
        <span style={{ fontSize: "0.7rem", color: "#9CA3AF" }}>{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "#6366F1", cursor: "pointer" }}
      />
    </div>
  );
}

// ─── NumberField ──────────────────────────────────────────────────────────────
interface NumberFieldProps {
  label:    string;
  value:    number;
  onChange: (val: number) => void;
  unit?:    string;
  min?:     number;
  max?:     number;
}

export function NumberField({ label, value, onChange, unit = "", min, max }: NumberFieldProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <p style={LABEL_STYLE}>{label}</p>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ ...INPUT_BASE, width: "80px" }}
        />
        {unit && <span style={{ fontSize: "0.7rem", color: "#9CA3AF" }}>{unit}</span>}
      </div>
    </div>
  );
}

// ─── SpacingField ─────────────────────────────────────────────────────────────
interface SpacingValue {
  top:    number;
  right:  number;
  bottom: number;
  left:   number;
}

interface SpacingFieldProps {
  label:    string;
  value:    SpacingValue;
  onChange: (val: SpacingValue) => void;
}

export function SpacingField({ label, value, onChange }: SpacingFieldProps) {
  const update = (side: keyof SpacingValue, n: number) => onChange({ ...value, [side]: n });
  const Box = ({ side, placeholder }: { side: keyof SpacingValue; placeholder: string }) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
      <input
        type="number"
        value={value[side]}
        onChange={(e) => update(side, Number(e.target.value))}
        style={{ ...INPUT_BASE, width: "46px", textAlign: "center", padding: "4px" }}
      />
      <span style={{ fontSize: "0.55rem", color: "#6B7280", textTransform: "uppercase" }}>{placeholder}</span>
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <p style={LABEL_STYLE}>{label}</p>
      <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
        <Box side="top"    placeholder="T" />
        <Box side="right"  placeholder="R" />
        <Box side="bottom" placeholder="B" />
        <Box side="left"   placeholder="L" />
      </div>
    </div>
  );
}

// ─── AlignmentField ───────────────────────────────────────────────────────────
interface AlignmentFieldProps {
  value:    "left" | "center" | "right";
  onChange: (val: "left" | "center" | "right") => void;
}

export function AlignmentField({ value, onChange }: AlignmentFieldProps) {
  const options: Array<{ v: "left" | "center" | "right"; icon: string }> = [
    { v: "left",   icon: "⬜" },
    { v: "center", icon: "▣" },
    { v: "right",  icon: "▦" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <p style={LABEL_STYLE}>Alignment</p>
      <div style={{ display: "flex", gap: "4px" }}>
        {options.map((opt) => (
          <button
            key={opt.v}
            type="button"
            onClick={() => onChange(opt.v)}
            title={opt.v}
            style={{
              flex:         1,
              padding:      "6px",
              border:       "1px solid",
              borderColor:  value === opt.v ? "#6366F1" : "#374151",
              borderRadius: "5px",
              background:   value === opt.v ? "#312e81" : "#1F2937",
              color:        value === opt.v ? "#A5B4FC" : "#9CA3AF",
              cursor:       "pointer",
              fontSize:     "0.65rem",
              textTransform: "capitalize",
            }}
          >
            {opt.v}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── FontWeightField ──────────────────────────────────────────────────────────
interface FontWeightFieldProps {
  value:    number;
  onChange: (val: number) => void;
}

export function FontWeightField({ value, onChange }: FontWeightFieldProps) {
  const weights = [
    { value: 300, label: "Light" },
    { value: 400, label: "Regular" },
    { value: 500, label: "Medium" },
    { value: 600, label: "SemiBold" },
    { value: 700, label: "Bold" },
  ];
  return (
    <SelectField
      label="Font Weight"
      value={String(value)}
      onChange={(v) => onChange(Number(v))}
      options={weights.map((w) => ({ value: String(w.value), label: w.label }))}
    />
  );
}

// ─── ShadowField ──────────────────────────────────────────────────────────────
interface ShadowValue {
  enabled: boolean;
  x:       number;
  y:       number;
  blur:    number;
  color:   string;
}

interface ShadowFieldProps {
  value:    ShadowValue;
  onChange: (val: ShadowValue) => void;
}

export function ShadowField({ value, onChange }: ShadowFieldProps) {
  const update = <K extends keyof ShadowValue>(key: K, v: ShadowValue[K]) => onChange({ ...value, [key]: v });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <ToggleField label="Text Shadow" value={value.enabled} onChange={(v) => update("enabled", v)} />
      {value.enabled && (
        <>
          <div style={{ display: "flex", gap: "6px" }}>
            <NumberField label="X" value={value.x} onChange={(v) => update("x", v)} unit="px" />
            <NumberField label="Y" value={value.y} onChange={(v) => update("y", v)} unit="px" />
            <NumberField label="Blur" value={value.blur} onChange={(v) => update("blur", v)} unit="px" />
          </div>
          <ColorField label="Shadow Color" value={value.color} onChange={(v) => update("color", v)} />
        </>
      )}
    </div>
  );
}

// ─── DateField ────────────────────────────────────────────────────────────────
interface DateFieldProps {
  label:    string;
  /** Full ISO string e.g. "2026-07-12T16:00:00" */
  value:    string;
  /** Called with (isoFull, displayFormatted) e.g. ("2026-07-12T16:00:00","12 • 07 • 2026") */
  onChange: (isoFull: string, displayDate: string) => void;
}

export function DateField({ label, value, onChange }: DateFieldProps) {
  const dateOnly = value ? value.split("T")[0] : "";
  return (
    <div>
      <label style={LABEL_STYLE}>{label}</label>
      <input
        type="date"
        value={dateOnly}
        onChange={(e) => {
          const d = e.target.value; // "YYYY-MM-DD"
          if (!d) return;
          const [y, m, day] = d.split("-");
          const displayDate = `${day} • ${m} • ${y}`;
          onChange(`${d}T16:00:00`, displayDate);
        }}
        style={{
          ...INPUT_BASE,
          colorScheme: "dark",
        } as React.CSSProperties}
        onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "#6366F1"; }}
        onBlur={(e)  => { (e.target as HTMLInputElement).style.borderColor = "#374151"; }}
      />
    </div>
  );
}

// ─── AnimationField ────────────────────────────────────────────────────────────
const ANIMATION_OPTIONS = [
  { value: "none",     label: "None" },
  { value: "fade-in",  label: "Fade In" },
  { value: "fade-up",  label: "Fade Up" },
  { value: "slide-in", label: "Slide In" },
  { value: "zoom-in",  label: "Zoom In" },
];

interface AnimationFieldProps {
  value:    string;
  onChange: (val: string) => void;
}

export function AnimationField({ value, onChange }: AnimationFieldProps) {
  return (
    <SelectField
      label="Entrance Animation"
      value={value}
      onChange={onChange}
      options={ANIMATION_OPTIONS}
    />
  );
}

// ─── ImageField ───────────────────────────────────────────────────────────────
// Lets the user replace an image by URL or paste a new one.
// Does NOT handle file upload here — points to upload endpoint separately.
interface ImageFieldProps {
  label:     string;
  value:     string;           // current image URL
  onChange:  (url: string) => void;
  helpText?: string;
}

export function ImageField({ label, value, onChange, helpText }: ImageFieldProps) {
  return (
    <div>
      <label style={LABEL_STYLE}>{label}</label>
      {value && (
        <div
          style={{
            width:        "100%",
            height:       "80px",
            borderRadius: "6px",
            overflow:     "hidden",
            marginBottom: "6px",
            background:   "#111827",
            border:       "1px solid #374151",
            display:      "flex",
            alignItems:   "center",
            justifyContent:"center",
          }}
        >
          <img
            src={value}
            alt="Preview"
            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "cover" }}
          />
        </div>
      )}
      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://... image URL"
        style={{
          ...INPUT_BASE,
          fontFamily: "monospace",
          fontSize:   "0.72rem",
        }}
        onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "#6366F1"; }}
        onBlur={(e)  => { (e.target as HTMLInputElement).style.borderColor = "#374151"; }}
      />
      {helpText && (
        <p style={{ fontSize: "0.65rem", color: "#6B7280", marginTop: "4px" }}>{helpText}</p>
      )}
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          style={{
            marginTop:    "6px",
            background:   "transparent",
            border:       "1px solid #374151",
            borderRadius: "5px",
            color:        "#9CA3AF",
            cursor:       "pointer",
            padding:      "4px 10px",
            fontSize:     "0.65rem",
          }}
        >
          ✕ Clear Image
        </button>
      )}
    </div>
  );
}

// ─── ButtonLinkField ──────────────────────────────────────────────────────────
// Edits a button's label, href, and whether it opens in a new tab.
// Security: only allows https://, http://, mailto:, tel:, / prefixes (no javascript:)
interface ButtonLinkFieldProps {
  labelValue:    string;
  hrefValue:     string;
  newTabValue:   boolean;
  onLabelChange:  (v: string) => void;
  onHrefChange:   (v: string) => void;
  onNewTabChange: (v: boolean) => void;
}

function isSafeHref(href: string): boolean {
  if (!href) return true;
  const lower = href.trim().toLowerCase();
  // Block javascript: and data: URIs
  if (lower.startsWith("javascript:") || lower.startsWith("data:")) return false;
  return true;
}

export function ButtonLinkField({
  labelValue,
  hrefValue,
  newTabValue,
  onLabelChange,
  onHrefChange,
  onNewTabChange,
}: ButtonLinkFieldProps) {
  const hrefIsUnsafe = hrefValue ? !isSafeHref(hrefValue) : false;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div>
        <label style={LABEL_STYLE}>Button Label</label>
        <input
          value={labelValue || ""}
          onChange={(e) => onLabelChange(e.target.value)}
          placeholder="e.g. RSVP Now"
          style={INPUT_BASE}
          onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "#6366F1"; }}
          onBlur={(e)  => { (e.target as HTMLInputElement).style.borderColor = "#374151"; }}
        />
      </div>
      <div>
        <label style={LABEL_STYLE}>Link URL</label>
        <input
          value={hrefValue || ""}
          onChange={(e) => onHrefChange(e.target.value)}
          placeholder="https://... or #section or mailto:"
          style={{
            ...INPUT_BASE,
            borderColor: hrefIsUnsafe ? "#EF4444" : "#374151",
            fontFamily:  "monospace",
            fontSize:    "0.72rem",
          }}
          onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = hrefIsUnsafe ? "#EF4444" : "#6366F1"; }}
          onBlur={(e)  => { (e.target as HTMLInputElement).style.borderColor = hrefIsUnsafe ? "#EF4444" : "#374151"; }}
        />
        {hrefIsUnsafe && (
          <p style={{ fontSize: "0.65rem", color: "#EF4444", marginTop: "4px" }}>
            ⚠ Unsafe URL — only https://, http://, mailto:, tel:, and relative paths are allowed.
          </p>
        )}
      </div>
      <ToggleField
        label="Open in new tab"
        value={newTabValue}
        onChange={onNewTabChange}
      />
    </div>
  );
}

// ─── UploadImageButton ────────────────────────────────────────────────────────
// Renders a file picker button that calls onUpload(file) → Promise<string>.
// The upload logic (fetch + auth) lives in the consuming inspector component.
interface UploadImageButtonProps {
  onUpload:  (file: File) => Promise<string>;
  label?:    string;
  accept?:   string;
  disabled?: boolean;
}

export function UploadImageButton({
  onUpload,
  label   = "Upload Image",
  accept  = "image/*",
  disabled = false,
}: UploadImageButtonProps) {
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState<string | null>(null);
  const inputRef                = useRef<HTMLInputElement>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      await onUpload(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        style={{ display: "none" }}
        aria-hidden="true"
      />
      <button
        type="button"
        onClick={() => !loading && !disabled && inputRef.current?.click()}
        disabled={loading || disabled}
        style={{
          width:        "100%",
          background:   loading ? "#374151" : "#1E1B4B",
          border:       "1px dashed #6366F1",
          borderRadius: "6px",
          color:        loading ? "#9CA3AF" : "#A5B4FC",
          cursor:       loading || disabled ? "not-allowed" : "pointer",
          padding:      "8px",
          fontSize:     "0.72rem",
          fontWeight:   600,
          display:      "flex",
          alignItems:   "center",
          justifyContent: "center",
          gap:          "6px",
          transition:   "background 0.15s",
        }}
      >
        {loading ? (
          <>⏳ Uploading…</>
        ) : (
          <>⬆ {label}</>
        )}
      </button>
      {error && (
        <p style={{ fontSize: "0.65rem", color: "#EF4444", marginTop: "4px" }}>
          ⚠ {error}
        </p>
      )}
    </div>
  );
}

// ─── MilestoneEditor (enhanced) ──────────────────────────────────────────────
// Replaces old MilestoneEditor — now supports add / remove / reorder.
interface Milestone {
  id?:          string;
  time:         string;
  title:        string;
  description:  string;
  image?:       string;
  address?:     string;
  mapUrl?:      string;
  buttonText?:  string;
}

interface MilestoneEditorProps {
  milestones:     Milestone[];
  onChange:       (milestones: Milestone[]) => void;
  /** If provided, each milestone card shows an image upload button */
  onImageUpload?: (milestoneIndex: number) => (file: File) => Promise<string>;
}

function genId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function MilestoneEditor({ milestones, onChange, onImageUpload }: MilestoneEditorProps) {
  const update = (idx: number, field: keyof Milestone, val: string) =>
    onChange(milestones.map((m, i) => (i === idx ? { ...m, [field]: val } : m)));

  const remove = (idx: number) =>
    onChange(milestones.filter((_, i) => i !== idx));

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const arr = [...milestones];
    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
    onChange(arr);
  };

  const moveDown = (idx: number) => {
    if (idx === milestones.length - 1) return;
    const arr = [...milestones];
    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
    onChange(arr);
  };

  const add = () =>
    onChange([
      ...milestones,
      { id: genId(), time: "", title: "New Route Stop", description: "" },
    ]);

  const BTN: React.CSSProperties = {
    background:   "transparent",
    border:       "1px solid #374151",
    borderRadius: "4px",
    color:        "#9CA3AF",
    cursor:       "pointer",
    padding:      "3px 6px",
    fontSize:     "0.6rem",
    flexShrink:   0,
    lineHeight:   1,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {milestones.map((m, idx) => (
        <div
          key={m.id || idx}
          style={{
            background:    "#1F2937",
            border:        "1px solid #374151",
            borderRadius:  "8px",
            padding:       "10px",
            display:       "flex",
            flexDirection: "column",
            gap:           "6px",
          }}
        >
          {/* Row: label + reorder + remove */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <p style={{ ...LABEL_STYLE, marginBottom: 0, color: "#6366F1", flex: 1 }}>
              Route Stop {idx + 1}
            </p>
            <button style={BTN} onClick={() => moveUp(idx)}   title="Move up">↑</button>
            <button style={BTN} onClick={() => moveDown(idx)} title="Move down">↓</button>
            <button
              style={{ ...BTN, color: "#EF4444", borderColor: "#4B1C1C" }}
              onClick={() => remove(idx)}
              title="Remove milestone"
            >
              ✕
            </button>
          </div>
          <input
            value={m.time}
            onChange={(e) => update(idx, "time", e.target.value)}
            placeholder="Time (e.g. 11:00 AM)"
            style={{ ...INPUT_BASE, fontSize: "0.75rem" }}
          />
          <input
            value={m.title}
            onChange={(e) => update(idx, "title", e.target.value)}
            placeholder="Title"
            style={{ ...INPUT_BASE, fontSize: "0.75rem" }}
          />
          <input
            value={m.description}
            onChange={(e) => update(idx, "description", e.target.value)}
            placeholder="Short description"
            style={{ ...INPUT_BASE, fontSize: "0.75rem" }}
          />
          <input
            value={m.address ?? ""}
            onChange={(e) => update(idx, "address", e.target.value)}
            placeholder="Address (optional)"
            style={{ ...INPUT_BASE, fontSize: "0.75rem" }}
          />
          <input
            value={m.mapUrl ?? ""}
            onChange={(e) => update(idx, "mapUrl", e.target.value)}
            placeholder="Map URL (overrides address)"
            style={{ ...INPUT_BASE, fontSize: "0.75rem" }}
          />
          <input
            value={m.buttonText ?? ""}
            onChange={(e) => update(idx, "buttonText", e.target.value)}
            placeholder='Button text (default: "Open in Maps")'
            style={{ ...INPUT_BASE, fontSize: "0.75rem" }}
          />
          {/* Image URL + optional upload */}
          {m.image && (
            <div style={{ position: "relative", marginBottom: "2px" }}>
              <img src={m.image} alt="milestone" style={{ width: "100%", height: "56px", objectFit: "cover", borderRadius: "4px", border: "1px solid #374151" }} />
              <button
                type="button"
                onClick={() => update(idx, "image", "")}
                style={{ position: "absolute", top: "2px", right: "2px", background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "3px", color: "#EF4444", cursor: "pointer", padding: "1px 5px", fontSize: "0.6rem" }}
              >✕</button>
            </div>
          )}
          <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
            <input
              value={m.image ?? ""}
              onChange={(e) => update(idx, "image", e.target.value)}
              placeholder="Image URL (optional)"
              style={{ ...INPUT_BASE, fontSize: "0.72rem", flex: 1 }}
            />
            {onImageUpload && (
              <label style={{ cursor: "pointer", flexShrink: 0 }}>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) { e.target.value = ""; await onImageUpload(idx)(file); }
                  }}
                />
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#374151", border: "1px solid #4B5563", borderRadius: "4px", color: "#9CA3AF", padding: "4px 7px", fontSize: "0.65rem", cursor: "pointer", whiteSpace: "nowrap" }}>
                  ↑ Upload
                </span>
              </label>
            )}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        style={{
          background:    "transparent",
          border:        "1px dashed #374151",
          borderRadius:  "6px",
          color:         "#6366F1",
          cursor:        "pointer",
          padding:       "7px",
          fontSize:      "0.7rem",
          fontWeight:    600,
          width:         "100%",
        }}
      >
        + Add Milestone
      </button>
    </div>
  );
}

// ─── IconPicker ───────────────────────────────────────────────────────────────
function IconPicker({ value, onChange }: { value: string; onChange: (key: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={value ? DETAIL_ICON_LABELS[value as keyof typeof DETAIL_ICON_LABELS] ?? value : "Choose icon"}
        style={{
          width:         "38px",
          height:        "38px",
          background:    open ? "#374151" : "#111827",
          border:        "1px solid #374151",
          borderRadius:  "6px",
          cursor:        "pointer",
          display:       "flex",
          alignItems:    "center",
          justifyContent: "center",
          padding:       0,
        }}
      >
        {value
          ? <DetailIcon iconKey={value} stroke="#D1B87A" size={20} />
          : <span style={{ color: "#6B7280", fontSize: "0.65rem" }}>—</span>}
      </button>
      {open && (
        <div style={{
          position:     "absolute",
          top:          "calc(100% + 4px)",
          left:         0,
          zIndex:       200,
          background:   "#111827",
          border:       "1px solid #374151",
          borderRadius: "8px",
          padding:      "8px",
          display:      "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap:          "4px",
          width:        "144px",
          boxShadow:    "0 8px 24px rgba(0,0,0,0.5)",
        }}>
          {DETAIL_ICON_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => { onChange(key); setOpen(false); }}
              title={DETAIL_ICON_LABELS[key]}
              style={{
                background:   value === key ? "#374151" : "transparent",
                border:       "none",
                borderRadius: "4px",
                cursor:       "pointer",
                padding:      "5px",
                display:      "flex",
                alignItems:   "center",
                justifyContent: "center",
              }}
            >
              <DetailIcon iconKey={key} stroke={value === key ? "#D1B87A" : "#6B7280"} size={20} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── VenueCardEditor (enhanced) ──────────────────────────────────────────────
// Supports add / remove / reorder + icon/emoji field.
interface VenueCard {
  id?:         string;
  title:       string;
  name:        string;
  description: string;
  mapIcon?:    string;
}

interface VenueCardEditorProps {
  venues:   VenueCard[];
  onChange: (venues: VenueCard[]) => void;
}

export function VenueCardEditor({ venues, onChange }: VenueCardEditorProps) {
  const update = (idx: number, field: keyof VenueCard, val: string) =>
    onChange(venues.map((v, i) => (i === idx ? { ...v, [field]: val } : v)));

  const remove = (idx: number) =>
    onChange(venues.filter((_, i) => i !== idx));

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const arr = [...venues];
    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
    onChange(arr);
  };

  const moveDown = (idx: number) => {
    if (idx === venues.length - 1) return;
    const arr = [...venues];
    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
    onChange(arr);
  };

  const add = () =>
    onChange([
      ...venues,
      {
        id:          genId(),
        title:       "NEW CARD",
        name:        "",
        description: "",
        mapIcon:     "map-pin",
      },
    ]);

  const BTN: React.CSSProperties = {
    background:   "transparent",
    border:       "1px solid #374151",
    borderRadius: "4px",
    color:        "#9CA3AF",
    cursor:       "pointer",
    padding:      "3px 6px",
    fontSize:     "0.6rem",
    flexShrink:   0,
    lineHeight:   1,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {venues.map((v, idx) => (
        <div
          key={v.id || idx}
          style={{
            background:    "#1F2937",
            border:        "1px solid #374151",
            borderRadius:  "8px",
            padding:       "10px",
            display:       "flex",
            flexDirection: "column",
            gap:           "6px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <p style={{ ...LABEL_STYLE, marginBottom: 0, color: "#6366F1", flex: 1 }}>
              Card {idx + 1}
            </p>
            <button style={BTN} onClick={() => moveUp(idx)}   title="Move up">↑</button>
            <button style={BTN} onClick={() => moveDown(idx)} title="Move down">↓</button>
            <button
              style={{ ...BTN, color: "#EF4444", borderColor: "#4B1C1C" }}
              onClick={() => remove(idx)}
              title="Remove card"
            >
              ✕
            </button>
          </div>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <IconPicker
              value={v.mapIcon ?? ""}
              onChange={(key) => update(idx, "mapIcon", key)}
            />
            <input
              value={v.title}
              onChange={(e) => update(idx, "title", e.target.value)}
              placeholder="Label (e.g. CEREMONY)"
              style={{ ...INPUT_BASE, flex: 1, fontSize: "0.75rem" }}
            />
          </div>
          <input
            value={v.name}
            onChange={(e) => update(idx, "name", e.target.value)}
            placeholder="Time / Value (e.g. 4:30 PM)"
            style={{ ...INPUT_BASE, fontSize: "0.75rem" }}
          />
          <textarea
            value={v.description}
            onChange={(e) => update(idx, "description", e.target.value)}
            placeholder={"Description (use \\n for line break)"}
            rows={2}
            style={{ ...INPUT_BASE, resize: "vertical", lineHeight: 1.5, fontSize: "0.75rem" }}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        style={{
          background:    "transparent",
          border:        "1px dashed #374151",
          borderRadius:  "6px",
          color:         "#6366F1",
          cursor:        "pointer",
          padding:       "7px",
          fontSize:      "0.7rem",
          fontWeight:    600,
          width:         "100%",
        }}
      >
        + Add Card
      </button>
    </div>
  );
}

