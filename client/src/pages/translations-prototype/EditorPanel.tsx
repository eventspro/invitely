/**
 * EditorPanel.tsx — Left-side accordion editor for all homepage content sections.
 * Edits the active locale only. Each section is collapsible.
 */
import { useState } from "react";
import {
  ChevronDown, ChevronUp, Plus, Trash2, ArrowUp, ArrowDown,
  Eye, EyeOff, AlertTriangle,
} from "lucide-react";
import type {
  HomepageContent, Locale, LS, NavItem, TemplateCard, HowItWorksStep,
  FeatureItem, FaqItem, ContactButton, TrustItem, Chip, BenefitItem,
  ValidationWarning,
} from "./types";

// ─── Validation ───────────────────────────────────────────────────────────────
export function getValidationWarnings(c: HomepageContent, locale: Locale): ValidationWarning[] {
  const warns: ValidationWarning[] = [];
  const v = (ls: LS) => ls[locale];

  if (v(c.hero.title).length + v(c.hero.titleHighlight).length + v(c.hero.titleSuffix).length > 55)
    warns.push({ field: "hero.title", message: "Hero title may be too long for mobile (>55 chars)", severity: "warning" });

  if (v(c.hero.primaryCta.label).length > 24)
    warns.push({ field: "hero.primaryCta", message: "Primary CTA label too long (>24 chars)", severity: "warning" });

  if (v(c.hero.secondaryCta.label).length > 24)
    warns.push({ field: "hero.secondaryCta", message: "Secondary CTA label too long (>24 chars)", severity: "warning" });

  c.hero.chips.forEach((chip, i) => {
    if (v(chip.label).length > 16)
      warns.push({ field: `chip[${i}]`, message: `Chip "${v(chip.label)}" label too long (>16 chars)`, severity: "warning" });
  });

  c.faq.items.forEach((item, i) => {
    if (v(item.answer).length > 400)
      warns.push({ field: `faq[${i}]`, message: `FAQ answer ${i + 1} too long (>400 chars)`, severity: "warning" });
    if (!v(item.question))
      warns.push({ field: `faq[${i}].q`, message: `FAQ item ${i + 1} has empty question`, severity: "error" });
  });

  c.navigation.items.forEach((item, i) => {
    if (!v(item.label))
      warns.push({ field: `nav[${i}]`, message: `Nav item ${i + 1} has no label for ${locale}`, severity: "warning" });
    if (item.href && !item.href.startsWith("#") && !item.href.startsWith("/") && !item.href.startsWith("http"))
      warns.push({ field: `nav[${i}].href`, message: `Nav item ${i + 1} has an invalid href`, severity: "error" });
  });

  c.contact.buttons.forEach((btn, i) => {
    if (!btn.href)
      warns.push({ field: `contact.btn[${i}]`, message: `Contact button "${v(btn.label)}" has no link`, severity: "error" });
  });

  return warns;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 9); }

function updateLS(ls: LS, locale: Locale, value: string): LS {
  return { ...ls, [locale]: value };
}

// ─── Primitives ───────────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, rows }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number;
}) {
  const base: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", fontSize: 12,
    border: "1px solid #ddd6cc", borderRadius: 7,
    padding: "6px 9px", background: "#fffdf9", color: "#1a1310",
    outline: "none", fontFamily: "inherit",
    resize: rows ? "vertical" : undefined,
  };
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#766c63", marginBottom: 4 }}>{label}</label>
      {rows ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={base} />
      ) : (
        <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={base} />
      )}
    </div>
  );
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      title={value ? "Hide" : "Show"}
      style={{ display: "inline-flex", alignItems: "center", gap: 5, border: "none", cursor: "pointer", fontSize: 11, color: value ? "#0D2A20" : "#aaa", padding: "2px 6px", borderRadius: 6, background: value ? "#d8f0e0" : "#f0ece8" }}
    >
      {value ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
      {label}
    </button>
  );
}

function IconSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const icons = ["heart","calendar","map","camera","message","phone","instagram","facebook","telegram","gift","lock","star","users","check","smartphone","share","edit","sparkles","clock","palette","send","arrow"];
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#766c63", marginBottom: 4 }}>Icon</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ fontSize: 12, border: "1px solid #ddd6cc", borderRadius: 7, padding: "5px 8px", background: "#fffdf9", color: "#1a1310", width: "100%", outline: "none" }}>
        {icons.map(ic => <option key={ic} value={ic}>{ic}</option>)}
      </select>
    </div>
  );
}

function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#766c63", marginBottom: 4 }}>{label}</label>
      <div style={{ display: "flex", gap: 6 }}>
        <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder="URL or /path/to/image.jpg"
          style={{ flex: 1, fontSize: 12, border: "1px solid #ddd6cc", borderRadius: 7, padding: "6px 9px", background: "#fffdf9", color: "#1a1310", outline: "none" }} />
        {value && (
          <img src={value} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover", border: "1px solid #e5ddd4", flexShrink: 0 }}
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
        )}
      </div>
    </div>
  );
}

// ─── Accordion wrapper ────────────────────────────────────────────────────────
function Section({ title, badge, children, defaultOpen = false }: {
  title: string; badge?: number; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 4, borderRadius: 10, border: "1px solid #e5ddd4", overflow: "hidden" }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{ width: "100%", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", background: open ? "#f8f2eb" : "#fffdf9", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        <span style={{ fontSize: 12, fontWeight: 700, color: "#0D2A20" }}>
          {title}
          {badge !== undefined && (
            <span style={{ marginLeft: 6, fontSize: 10, background: "#d8b66d", color: "#0D2A20", borderRadius: 99, padding: "1px 6px", fontWeight: 700 }}>{badge}</span>
          )}
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-[#766c63]" /> : <ChevronDown className="h-4 w-4 text-[#766c63]" />}
      </button>
      {open && <div style={{ padding: "12px 14px", background: "#fffdf9" }}>{children}</div>}
    </div>
  );
}

function MoveButtons({ onUp, onDown, isFirst, isLast }: { onUp: () => void; onDown: () => void; isFirst: boolean; isLast: boolean }) {
  const btn: React.CSSProperties = { background: "#f0ece8", border: "1px solid #e5ddd4", borderRadius: 5, padding: "2px 5px", cursor: "pointer", display: "inline-flex", alignItems: "center", color: "#766c63" };
  return (
    <div style={{ display: "inline-flex", gap: 3 }}>
      <button type="button" onClick={onUp} disabled={isFirst} style={{ ...btn, opacity: isFirst ? 0.35 : 1 }}><ArrowUp className="h-3 w-3" /></button>
      <button type="button" onClick={onDown} disabled={isLast} style={{ ...btn, opacity: isLast ? 0.35 : 1 }}><ArrowDown className="h-3 w-3" /></button>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
interface Props {
  content: HomepageContent;
  locale: Locale;
  onChange: (c: HomepageContent) => void;
}

export default function EditorPanel({ content: c, locale, onChange }: Props) {
  const L = locale;
  const warnings = getValidationWarnings(c, L);

  function setC(patch: Partial<HomepageContent>) { onChange({ ...c, ...patch }); }

  // ── list helpers
  function moveItem<T>(arr: T[], from: number, to: number): T[] {
    if (to < 0 || to >= arr.length) return arr;
    const a = [...arr]; const [el] = a.splice(from, 1); a.splice(to, 0, el); return a;
  }
  function removeItem<T>(arr: T[], idx: number): T[] { return arr.filter((_, i) => i !== idx); }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>

      {/* Validation warnings */}
      {warnings.length > 0 && (
        <div style={{ borderRadius: 10, border: "1px solid #f0d58a", background: "#fffbea", padding: "10px 14px", marginBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <AlertTriangle className="h-4 w-4 text-[#b8880a]" />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#b8880a" }}>{warnings.length} validation {warnings.length === 1 ? "warning" : "warnings"}</span>
          </div>
          {warnings.map((w, i) => (
            <div key={i} style={{ fontSize: 11, color: w.severity === "error" ? "#c0392b" : "#9a6f02", marginBottom: 2 }}>• {w.message}</div>
          ))}
        </div>
      )}

      {/* ── 1. Navigation */}
      <Section title="1. Navigation" badge={c.navigation.items.length} defaultOpen>
        <Field label={`Login label (${L})`} value={c.navigation.loginLabel[L]} onChange={v => setC({ navigation: { ...c.navigation, loginLabel: updateLS(c.navigation.loginLabel, L, v) } })} />
        <Field label="Login button link (href)" value={c.navigation.loginHref} onChange={v => setC({ navigation: { ...c.navigation, loginHref: v } })} />
        <Field label={`Start button (${L})`} value={c.navigation.startLabel[L]} onChange={v => setC({ navigation: { ...c.navigation, startLabel: updateLS(c.navigation.startLabel, L, v) } })} />
        <div style={{ borderTop: "1px solid #f0ece8", paddingTop: 10, marginTop: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#766c63", marginBottom: 8 }}>Nav items</div>
          {c.navigation.items.map((item, i) => (
            <div key={item.id} style={{ marginBottom: 10, padding: "10px", borderRadius: 8, border: "1px solid #ede6dc", background: "#fffaf5" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#0D2A20" }}>Item {i + 1}</span>
                <div style={{ display: "flex", gap: 4 }}>
                  <MoveButtons onUp={() => setC({ navigation: { ...c.navigation, items: moveItem(c.navigation.items, i, i - 1) } })} onDown={() => setC({ navigation: { ...c.navigation, items: moveItem(c.navigation.items, i, i + 1) } })} isFirst={i === 0} isLast={i === c.navigation.items.length - 1} />
                  <Toggle value={item.visible} onChange={v => setC({ navigation: { ...c.navigation, items: c.navigation.items.map((it, j) => j === i ? { ...it, visible: v } : it) } })} label="" />
                  <button type="button" onClick={() => setC({ navigation: { ...c.navigation, items: removeItem(c.navigation.items, i) } })} style={{ background: "#fde8e8", border: "none", borderRadius: 5, padding: "3px 6px", cursor: "pointer", color: "#c0392b" }}><Trash2 className="h-3 w-3" /></button>
                </div>
              </div>
              <Field label={`Label (${L})`} value={item.label[L]} onChange={v => setC({ navigation: { ...c.navigation, items: c.navigation.items.map((it, j) => j === i ? { ...it, label: updateLS(it.label, L, v) } : it) } })} />
              <Field label="Link (href)" value={item.href} onChange={v => setC({ navigation: { ...c.navigation, items: c.navigation.items.map((it, j) => j === i ? { ...it, href: v } : it) } })} />
            </div>
          ))}
          <button type="button"
            onClick={() => setC({ navigation: { ...c.navigation, items: [...c.navigation.items, { id: uid(), label: { hy: "", en: "", ru: "" }, href: "#", visible: true }] } })}
            style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#0D2A20", background: "#e8f2eb", border: "none", borderRadius: 7, padding: "6px 10px", cursor: "pointer" }}>
            <Plus className="h-3 w-3" /> Add nav item
          </button>
        </div>
      </Section>

      {/* ── 2. Hero */}
      <Section title="2. Hero" defaultOpen>
        <Field label={`Eyebrow (${L})`} value={c.hero.eyebrow[L]} onChange={v => setC({ hero: { ...c.hero, eyebrow: updateLS(c.hero.eyebrow, L, v) } })} />
        <Field label={`Title (${L})`} value={c.hero.title[L]} onChange={v => setC({ hero: { ...c.hero, title: updateLS(c.hero.title, L, v) } })} placeholder="First part of the headline" />
        <Field label={`Title highlight (${L})`} value={c.hero.titleHighlight[L]} onChange={v => setC({ hero: { ...c.hero, titleHighlight: updateLS(c.hero.titleHighlight, L, v) } })} placeholder="Gold-colored part" />
        <Field label={`Title suffix (${L})`} value={c.hero.titleSuffix[L]} onChange={v => setC({ hero: { ...c.hero, titleSuffix: updateLS(c.hero.titleSuffix, L, v) } })} />
        <Field label={`Subtitle (${L})`} value={c.hero.subtitle[L]} onChange={v => setC({ hero: { ...c.hero, subtitle: updateLS(c.hero.subtitle, L, v) } })} rows={3} />
        <div style={{ borderTop: "1px solid #f0ece8", paddingTop: 10, marginTop: 2, marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#766c63", marginBottom: 8 }}>Primary CTA</div>
          <Field label={`Label (${L})`} value={c.hero.primaryCta.label[L]} onChange={v => setC({ hero: { ...c.hero, primaryCta: { ...c.hero.primaryCta, label: updateLS(c.hero.primaryCta.label, L, v) } } })} />
          <Field label="Link" value={c.hero.primaryCta.href} onChange={v => setC({ hero: { ...c.hero, primaryCta: { ...c.hero.primaryCta, href: v } } })} />
        </div>
        <div style={{ borderTop: "1px solid #f0ece8", paddingTop: 10, marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#766c63", marginBottom: 8 }}>Secondary CTA</div>
          <Field label={`Label (${L})`} value={c.hero.secondaryCta.label[L]} onChange={v => setC({ hero: { ...c.hero, secondaryCta: { ...c.hero.secondaryCta, label: updateLS(c.hero.secondaryCta.label, L, v) } } })} />
          <Field label="Link" value={c.hero.secondaryCta.href} onChange={v => setC({ hero: { ...c.hero, secondaryCta: { ...c.hero.secondaryCta, href: v } } })} />
        </div>
        <div style={{ borderTop: "1px solid #f0ece8", paddingTop: 10, marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#766c63", marginBottom: 8 }}>Chips</div>
          {c.hero.chips.map((chip, i) => (
            <div key={chip.id} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
              <input type="text" value={chip.label[L]} onChange={e => setC({ hero: { ...c.hero, chips: c.hero.chips.map((ch, j) => j === i ? { ...ch, label: updateLS(ch.label, L, e.target.value) } : ch) } })}
                style={{ flex: 1, fontSize: 12, border: "1px solid #ddd6cc", borderRadius: 7, padding: "5px 8px", background: "#fffdf9", outline: "none" }} />
              <Toggle value={chip.visible} onChange={v => setC({ hero: { ...c.hero, chips: c.hero.chips.map((ch, j) => j === i ? { ...ch, visible: v } : ch) } })} label="" />
              <button type="button" onClick={() => setC({ hero: { ...c.hero, chips: removeItem(c.hero.chips, i) } })} style={{ background: "#fde8e8", border: "none", borderRadius: 5, padding: "4px 6px", cursor: "pointer", color: "#c0392b" }}><Trash2 className="h-3 w-3" /></button>
            </div>
          ))}
          <button type="button" onClick={() => setC({ hero: { ...c.hero, chips: [...c.hero.chips, { id: uid(), label: { hy: "", en: "", ru: "" }, visible: true }] } })}
            style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#0D2A20", background: "#e8f2eb", border: "none", borderRadius: 7, padding: "6px 10px", cursor: "pointer" }}>
            <Plus className="h-3 w-3" /> Add chip
          </button>
        </div>
        <div style={{ borderTop: "1px solid #f0ece8", paddingTop: 10 }}>
          <ImageField label="Background image URL" value={c.hero.backgroundImage} onChange={v => setC({ hero: { ...c.hero, backgroundImage: v } })} />
          <Field label="Phone preview URL" value={c.hero.phonePreviewUrl} onChange={v => setC({ hero: { ...c.hero, phonePreviewUrl: v } })} />
        </div>
      </Section>

      {/* ── 3. Templates */}
      <Section title="3. Template Cards" badge={c.templates.items.filter(t => t.visible).length}>
        <Field label={`Eyebrow (${L})`} value={c.templates.eyebrow[L]} onChange={v => setC({ templates: { ...c.templates, eyebrow: updateLS(c.templates.eyebrow, L, v) } })} />
        <Field label={`Title (${L})`} value={c.templates.title[L]} onChange={v => setC({ templates: { ...c.templates, title: updateLS(c.templates.title, L, v) } })} />
        {c.templates.items.map((card, i) => (
          <div key={card.id} style={{ marginBottom: 12, padding: "10px", borderRadius: 8, border: "1px solid #ede6dc", background: "#fffaf5" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#0D2A20" }}>Card {i + 1}: {card.name[L] || card.name.hy}</span>
              <div style={{ display: "flex", gap: 4 }}>
                <MoveButtons onUp={() => setC({ templates: { ...c.templates, items: moveItem(c.templates.items, i, i - 1) } })} onDown={() => setC({ templates: { ...c.templates, items: moveItem(c.templates.items, i, i + 1) } })} isFirst={i === 0} isLast={i === c.templates.items.length - 1} />
                <Toggle value={card.visible} onChange={v => setC({ templates: { ...c.templates, items: c.templates.items.map((it, j) => j === i ? { ...it, visible: v } : it) } })} label="" />
              </div>
            </div>
            <Field label={`Name (${L})`} value={card.name[L]} onChange={v => setC({ templates: { ...c.templates, items: c.templates.items.map((it, j) => j === i ? { ...it, name: updateLS(it.name, L, v) } : it) } })} />
            <Field label={`Tag / style (${L})`} value={card.tag[L]} onChange={v => setC({ templates: { ...c.templates, items: c.templates.items.map((it, j) => j === i ? { ...it, tag: updateLS(it.tag, L, v) } : it) } })} />
            <Field label={`Price (${L})`} value={card.price[L]} onChange={v => setC({ templates: { ...c.templates, items: c.templates.items.map((it, j) => j === i ? { ...it, price: updateLS(it.price, L, v) } : it) } })} placeholder="֏15,000" />
            <Field label={`Button label (${L})`} value={card.buttonLabel[L]} onChange={v => setC({ templates: { ...c.templates, items: c.templates.items.map((it, j) => j === i ? { ...it, buttonLabel: updateLS(it.buttonLabel, L, v) } : it) } })} />
            <Field label="Page link (href)" value={card.href} onChange={v => setC({ templates: { ...c.templates, items: c.templates.items.map((it, j) => j === i ? { ...it, href: v } : it) } })} />
            <ImageField label="Preview image" value={card.image} onChange={v => setC({ templates: { ...c.templates, items: c.templates.items.map((it, j) => j === i ? { ...it, image: v } : it) } })} />
          </div>
        ))}
      </Section>

      {/* ── 4. How It Works */}
      <Section title="4. How It Works">
        <Field label={`Eyebrow (${L})`} value={c.howItWorks.eyebrow[L]} onChange={v => setC({ howItWorks: { ...c.howItWorks, eyebrow: updateLS(c.howItWorks.eyebrow, L, v) } })} />
        <Field label={`Title (${L})`} value={c.howItWorks.title[L]} onChange={v => setC({ howItWorks: { ...c.howItWorks, title: updateLS(c.howItWorks.title, L, v) } })} />
        {c.howItWorks.steps.map((step, i) => (
          <div key={step.id} style={{ marginBottom: 10, padding: "10px", borderRadius: 8, border: "1px solid #ede6dc", background: "#fffaf5" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#0D2A20" }}>Step {step.number}</span>
              <Toggle value={step.visible} onChange={v => setC({ howItWorks: { ...c.howItWorks, steps: c.howItWorks.steps.map((s, j) => j === i ? { ...s, visible: v } : s) } })} label="" />
            </div>
            <IconSelect value={step.icon} onChange={v => setC({ howItWorks: { ...c.howItWorks, steps: c.howItWorks.steps.map((s, j) => j === i ? { ...s, icon: v } : s) } })} />
            <Field label={`Title (${L})`} value={step.title[L]} onChange={v => setC({ howItWorks: { ...c.howItWorks, steps: c.howItWorks.steps.map((s, j) => j === i ? { ...s, title: updateLS(s.title, L, v) } : s) } })} />
            <Field label={`Description (${L})`} value={step.text[L]} onChange={v => setC({ howItWorks: { ...c.howItWorks, steps: c.howItWorks.steps.map((s, j) => j === i ? { ...s, text: updateLS(s.text, L, v) } : s) } })} rows={2} />
          </div>
        ))}
      </Section>

      {/* ── 5. Guest Features */}
      <Section title="5. Guest Features" badge={c.features.items.length}>
        <Field label={`Eyebrow (${L})`} value={c.features.eyebrow[L]} onChange={v => setC({ features: { ...c.features, eyebrow: updateLS(c.features.eyebrow, L, v) } })} />
        <Field label={`Title (${L})`} value={c.features.title[L]} onChange={v => setC({ features: { ...c.features, title: updateLS(c.features.title, L, v) } })} />
        {c.features.items.map((item, i) => (
          <div key={item.id} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8, padding: "8px 10px", borderRadius: 8, border: "1px solid #ede6dc", background: "#fffaf5" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                <select value={item.icon} onChange={e => setC({ features: { ...c.features, items: c.features.items.map((it, j) => j === i ? { ...it, icon: e.target.value } : it) } })}
                  style={{ fontSize: 11, border: "1px solid #ddd6cc", borderRadius: 5, padding: "3px 6px", background: "#fffdf9", outline: "none", width: 90, flexShrink: 0 }}>
                  {["heart","calendar","map","camera","message","phone","gift","lock","star","users","check","smartphone","share","edit","clock","palette"].map(ic => <option key={ic} value={ic}>{ic}</option>)}
                </select>
                <input type="text" value={item.title[L]} onChange={e => setC({ features: { ...c.features, items: c.features.items.map((it, j) => j === i ? { ...it, title: updateLS(it.title, L, e.target.value) } : it) } })}
                  style={{ flex: 1, fontSize: 12, border: "1px solid #ddd6cc", borderRadius: 6, padding: "4px 8px", background: "#fffdf9", outline: "none" }} />
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Toggle value={item.visible} onChange={v => setC({ features: { ...c.features, items: c.features.items.map((it, j) => j === i ? { ...it, visible: v } : it) } })} label="" />
              <div style={{ display: "flex", gap: 2 }}>
                <button type="button" onClick={() => setC({ features: { ...c.features, items: moveItem(c.features.items, i, i - 1) } })} disabled={i === 0} style={{ background: "#f0ece8", border: "none", borderRadius: 4, padding: "2px 4px", cursor: "pointer", opacity: i === 0 ? 0.35 : 1 }}><ArrowUp className="h-3 w-3" /></button>
                <button type="button" onClick={() => setC({ features: { ...c.features, items: moveItem(c.features.items, i, i + 1) } })} disabled={i === c.features.items.length - 1} style={{ background: "#f0ece8", border: "none", borderRadius: 4, padding: "2px 4px", cursor: "pointer", opacity: i === c.features.items.length - 1 ? 0.35 : 1 }}><ArrowDown className="h-3 w-3" /></button>
              </div>
            </div>
          </div>
        ))}
        <button type="button"
          onClick={() => setC({ features: { ...c.features, items: [...c.features.items, { id: uid(), icon: "star", title: { hy: "", en: "", ru: "" }, visible: true }] } })}
          style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#0D2A20", background: "#e8f2eb", border: "none", borderRadius: 7, padding: "6px 10px", cursor: "pointer" }}>
          <Plus className="h-3 w-3" /> Add feature
        </button>
      </Section>

      {/* ── 6. Mobile Experience */}
      <Section title="6. Mobile Experience">
        <Field label={`Eyebrow (${L})`} value={c.mobileExperience.eyebrow[L]} onChange={v => setC({ mobileExperience: { ...c.mobileExperience, eyebrow: updateLS(c.mobileExperience.eyebrow, L, v) } })} />
        <Field label={`Title (${L})`} value={c.mobileExperience.title[L]} onChange={v => setC({ mobileExperience: { ...c.mobileExperience, title: updateLS(c.mobileExperience.title, L, v) } })} rows={2} />
        <Field label={`Subtitle (${L})`} value={c.mobileExperience.subtitle[L]} onChange={v => setC({ mobileExperience: { ...c.mobileExperience, subtitle: updateLS(c.mobileExperience.subtitle, L, v) } })} rows={3} />
        <div style={{ borderTop: "1px solid #f0ece8", paddingTop: 8, marginTop: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#766c63", marginBottom: 6 }}>Action chips</div>
          {c.mobileExperience.actions.map((action, i) => (
            <div key={action.id} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
              <select value={action.icon} onChange={e => setC({ mobileExperience: { ...c.mobileExperience, actions: c.mobileExperience.actions.map((a, j) => j === i ? { ...a, icon: e.target.value } : a) } })}
                style={{ fontSize: 11, border: "1px solid #ddd6cc", borderRadius: 5, padding: "4px 6px", background: "#fffdf9", outline: "none", width: 80, flexShrink: 0 }}>
                {["share","camera","message","phone","heart","check","instagram","telegram","facebook","arrow"].map(ic => <option key={ic} value={ic}>{ic}</option>)}
              </select>
              <input type="text" value={action.label[L]} onChange={e => setC({ mobileExperience: { ...c.mobileExperience, actions: c.mobileExperience.actions.map((a, j) => j === i ? { ...a, label: updateLS(a.label, L, e.target.value) } : a) } })}
                style={{ flex: 1, fontSize: 12, border: "1px solid #ddd6cc", borderRadius: 6, padding: "5px 8px", background: "#fffdf9", outline: "none" }} />
              <Toggle value={action.visible} onChange={v => setC({ mobileExperience: { ...c.mobileExperience, actions: c.mobileExperience.actions.map((a, j) => j === i ? { ...a, visible: v } : a) } })} label="" />
              <button type="button" onClick={() => setC({ mobileExperience: { ...c.mobileExperience, actions: removeItem(c.mobileExperience.actions, i) } })} style={{ background: "#fde8e8", border: "none", borderRadius: 5, padding: "4px 6px", cursor: "pointer", color: "#c0392b" }}><Trash2 className="h-3 w-3" /></button>
            </div>
          ))}
          <button type="button" onClick={() => setC({ mobileExperience: { ...c.mobileExperience, actions: [...c.mobileExperience.actions, { id: uid(), icon: "share", label: { hy: "", en: "", ru: "" }, visible: true }] } })}
            style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#0D2A20", background: "#e8f2eb", border: "none", borderRadius: 7, padding: "6px 10px", cursor: "pointer" }}>
            <Plus className="h-3 w-3" /> Add chip
          </button>
        </div>
      </Section>

      {/* ── 7. FAQ */}
      <Section title="7. FAQ" badge={c.faq.items.filter(f => f.visible).length}>
        <Field label={`Eyebrow (${L})`} value={c.faq.eyebrow[L]} onChange={v => setC({ faq: { ...c.faq, eyebrow: updateLS(c.faq.eyebrow, L, v) } })} />
        <Field label={`Title (${L})`} value={c.faq.title[L]} onChange={v => setC({ faq: { ...c.faq, title: updateLS(c.faq.title, L, v) } })} />
        {c.faq.items.map((item, i) => (
          <div key={item.id} style={{ marginBottom: 10, padding: "10px", borderRadius: 8, border: "1px solid #ede6dc", background: "#fffaf5" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#0D2A20" }}>Q{i + 1}</span>
              <div style={{ display: "flex", gap: 4 }}>
                <MoveButtons onUp={() => setC({ faq: { ...c.faq, items: moveItem(c.faq.items, i, i - 1) } })} onDown={() => setC({ faq: { ...c.faq, items: moveItem(c.faq.items, i, i + 1) } })} isFirst={i === 0} isLast={i === c.faq.items.length - 1} />
                <Toggle value={item.visible} onChange={v => setC({ faq: { ...c.faq, items: c.faq.items.map((it, j) => j === i ? { ...it, visible: v } : it) } })} label="" />
                <button type="button" onClick={() => setC({ faq: { ...c.faq, items: removeItem(c.faq.items, i) } })} style={{ background: "#fde8e8", border: "none", borderRadius: 5, padding: "3px 6px", cursor: "pointer", color: "#c0392b" }}><Trash2 className="h-3 w-3" /></button>
              </div>
            </div>
            <Field label={`Question (${L})`} value={item.question[L]} onChange={v => setC({ faq: { ...c.faq, items: c.faq.items.map((it, j) => j === i ? { ...it, question: updateLS(it.question, L, v) } : it) } })} />
            <Field label={`Answer (${L})`} value={item.answer[L]} onChange={v => setC({ faq: { ...c.faq, items: c.faq.items.map((it, j) => j === i ? { ...it, answer: updateLS(it.answer, L, v) } : it) } })} rows={3} />
            <div style={{ fontSize: 10, color: "#aaa", textAlign: "right" }}>{(item.answer[L] || "").length} / 400</div>
          </div>
        ))}
        <button type="button" onClick={() => setC({ faq: { ...c.faq, items: [...c.faq.items, { id: uid(), question: { hy: "", en: "", ru: "" }, answer: { hy: "", en: "", ru: "" }, visible: true }] } })}
          style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#0D2A20", background: "#e8f2eb", border: "none", borderRadius: 7, padding: "6px 10px", cursor: "pointer" }}>
          <Plus className="h-3 w-3" /> Add FAQ item
        </button>
      </Section>

      {/* ── 8. Contact */}
      <Section title="8. Contact">
        <Field label={`Eyebrow (${L})`} value={c.contact.eyebrow[L]} onChange={v => setC({ contact: { ...c.contact, eyebrow: updateLS(c.contact.eyebrow, L, v) } })} />
        <Field label={`Title (${L})`} value={c.contact.title[L]} onChange={v => setC({ contact: { ...c.contact, title: updateLS(c.contact.title, L, v) } })} rows={2} />
        <Field label={`Subtitle (${L})`} value={c.contact.subtitle[L]} onChange={v => setC({ contact: { ...c.contact, subtitle: updateLS(c.contact.subtitle, L, v) } })} rows={2} />
        <div style={{ borderTop: "1px solid #f0ece8", paddingTop: 8, marginTop: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#766c63", marginBottom: 6 }}>Buttons</div>
          {c.contact.buttons.map((btn, i) => (
            <div key={btn.id} style={{ marginBottom: 10, padding: "10px", borderRadius: 8, border: "1px solid #ede6dc", background: "#fffaf5" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#0D2A20" }}>Button {i + 1}</span>
                <div style={{ display: "flex", gap: 4 }}>
                  <MoveButtons onUp={() => setC({ contact: { ...c.contact, buttons: moveItem(c.contact.buttons, i, i - 1) } })} onDown={() => setC({ contact: { ...c.contact, buttons: moveItem(c.contact.buttons, i, i + 1) } })} isFirst={i === 0} isLast={i === c.contact.buttons.length - 1} />
                  <Toggle value={btn.visible} onChange={v => setC({ contact: { ...c.contact, buttons: c.contact.buttons.map((b, j) => j === i ? { ...b, visible: v } : b) } })} label="" />
                  <button type="button" onClick={() => setC({ contact: { ...c.contact, buttons: removeItem(c.contact.buttons, i) } })} style={{ background: "#fde8e8", border: "none", borderRadius: 5, padding: "3px 6px", cursor: "pointer", color: "#c0392b" }}><Trash2 className="h-3 w-3" /></button>
                </div>
              </div>
              <Field label={`Label (${L})`} value={btn.label[L]} onChange={v => setC({ contact: { ...c.contact, buttons: c.contact.buttons.map((b, j) => j === i ? { ...b, label: updateLS(b.label, L, v) } : b) } })} />
              <Field label="Link (href)" value={btn.href} onChange={v => setC({ contact: { ...c.contact, buttons: c.contact.buttons.map((b, j) => j === i ? { ...b, href: v } : b) } })} />
              <IconSelect value={btn.icon} onChange={v => setC({ contact: { ...c.contact, buttons: c.contact.buttons.map((b, j) => j === i ? { ...b, icon: v } : b) } })} />
            </div>
          ))}
          <button type="button" onClick={() => setC({ contact: { ...c.contact, buttons: [...c.contact.buttons, { id: uid(), label: { hy: "", en: "", ru: "" }, href: "", icon: "arrow", visible: true }] } })}
            style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#0D2A20", background: "#e8f2eb", border: "none", borderRadius: 7, padding: "6px 10px", cursor: "pointer" }}>
            <Plus className="h-3 w-3" /> Add button
          </button>
        </div>
      </Section>

      {/* ── 9. Footer */}
      <Section title="9. Footer" defaultOpen={false}>
        <Field label="Email" value={c.footer.email} onChange={v => setC({ footer: { ...c.footer, email: v } })} placeholder="info@4ever.am" />
        <Field label="Phone" value={c.footer.phone} onChange={v => setC({ footer: { ...c.footer, phone: v } })} placeholder="+374 77 000 000" />
        <Field label={`Copyright (${L})`} value={c.footer.copyright[L]} onChange={v => setC({ footer: { ...c.footer, copyright: updateLS(c.footer.copyright, L, v) } })} />
        <div style={{ borderTop: "1px solid #f0ece8", paddingTop: 8, marginTop: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#766c63", marginBottom: 6 }}>Trust items</div>
          {c.footer.trustItems.map((item, i) => (
            <div key={item.id} style={{ marginBottom: 8, padding: "8px 10px", borderRadius: 8, border: "1px solid #ede6dc", background: "#fffaf5" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#0D2A20" }}>Trust {i + 1}</span>
                <div style={{ display: "flex", gap: 4 }}>
                  <Toggle value={item.visible} onChange={v => setC({ footer: { ...c.footer, trustItems: c.footer.trustItems.map((it, j) => j === i ? { ...it, visible: v } : it) } })} label="" />
                  <button type="button" onClick={() => setC({ footer: { ...c.footer, trustItems: removeItem(c.footer.trustItems, i) } })} style={{ background: "#fde8e8", border: "none", borderRadius: 5, padding: "3px 6px", cursor: "pointer", color: "#c0392b" }}><Trash2 className="h-3 w-3" /></button>
                </div>
              </div>
              <IconSelect value={item.icon} onChange={v => setC({ footer: { ...c.footer, trustItems: c.footer.trustItems.map((it, j) => j === i ? { ...it, icon: v } : it) } })} />
              <Field label={`Title (${L})`} value={item.title[L]} onChange={v => setC({ footer: { ...c.footer, trustItems: c.footer.trustItems.map((it, j) => j === i ? { ...it, title: updateLS(it.title, L, v) } : it) } })} />
              <Field label={`Text (${L})`} value={item.text[L]} onChange={v => setC({ footer: { ...c.footer, trustItems: c.footer.trustItems.map((it, j) => j === i ? { ...it, text: updateLS(it.text, L, v) } : it) } })} rows={2} />
            </div>
          ))}
          <button type="button" onClick={() => setC({ footer: { ...c.footer, trustItems: [...c.footer.trustItems, { id: uid(), icon: "star", title: { hy: "", en: "", ru: "" }, text: { hy: "", en: "", ru: "" }, visible: true }] } })}
            style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#0D2A20", background: "#e8f2eb", border: "none", borderRadius: 7, padding: "6px 10px", cursor: "pointer" }}>
            <Plus className="h-3 w-3" /> Add trust item
          </button>
        </div>
      </Section>

      {/* ── 10. Benefits (hero micro-badges) */}
      <Section title="10. Benefits" badge={c.benefits.filter(b => b.visible).length}>
        {c.benefits.map((item, i) => (
          <div key={item.id} style={{ marginBottom: 8, padding: "10px", borderRadius: 8, border: "1px solid #ede6dc", background: "#fffaf5" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#0D2A20" }}>Benefit {i + 1}</span>
              <div style={{ display: "flex", gap: 4 }}>
                <MoveButtons
                  onUp={() => setC({ benefits: moveItem(c.benefits, i, i - 1) })}
                  onDown={() => setC({ benefits: moveItem(c.benefits, i, i + 1) })}
                  isFirst={i === 0} isLast={i === c.benefits.length - 1}
                />
                <Toggle value={item.visible} onChange={v => setC({ benefits: c.benefits.map((b, j) => j === i ? { ...b, visible: v } : b) })} label="" />
              </div>
            </div>
            <IconSelect value={item.icon} onChange={v => setC({ benefits: c.benefits.map((b, j) => j === i ? { ...b, icon: v } : b) })} />
            <Field label={`Title (${L})`} value={item.title[L]} onChange={v => setC({ benefits: c.benefits.map((b, j) => j === i ? { ...b, title: updateLS(b.title, L, v) } : b) })} />
            <Field label={`Text (${L})`} value={item.text[L]} onChange={v => setC({ benefits: c.benefits.map((b, j) => j === i ? { ...b, text: updateLS(b.text, L, v) } : b) })} rows={2} />
          </div>
        ))}
        <button type="button"
          onClick={() => setC({ benefits: [...c.benefits, { id: uid(), icon: "star", title: { hy: "", en: "", ru: "" }, text: { hy: "", en: "", ru: "" }, visible: true }] })}
          style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#0D2A20", background: "#e8f2eb", border: "none", borderRadius: 7, padding: "6px 10px", cursor: "pointer" }}>
          <Plus className="h-3 w-3" /> Add benefit
        </button>
      </Section>

    </div>
  );
}
