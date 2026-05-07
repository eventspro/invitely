/**
 * V2 Builder — Project Settings Panel
 * Replaces the right inspector when "Settings" is active in the top bar.
 * Manages canonical wedding data: date, couple names, venue, contact, etc.
 *
 * CRITICAL: Does NOT modify RSVP submission logic, auth, or V1 templates.
 */

import React, { useCallback, useMemo } from "react";
import { useBuilderV2 } from "../BuilderV2Context";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format ISO date string to display "DD • MM • YYYY" */
function isoToDisplay(iso: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const dd   = String(d.getDate()).padStart(2, "0");
    const mm   = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd} • ${mm} • ${yyyy}`;
  } catch {
    return iso;
  }
}

/** Month names for display */
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ─── Shared field styles ──────────────────────────────────────────────────────
const LABEL_STYLE: React.CSSProperties = {
  display:      "block",
  fontSize:     "0.65rem",
  fontWeight:   600,
  letterSpacing:"0.07em",
  textTransform:"uppercase",
  color:        "#64748B",
  marginBottom: "4px",
};

const INPUT_STYLE: React.CSSProperties = {
  width:        "100%",
  background:   "#1E293B",
  border:       "1px solid #334155",
  borderRadius: "6px",
  color:        "#E2E8F0",
  fontSize:     "0.8rem",
  padding:      "7px 10px",
  outline:      "none",
  boxSizing:    "border-box",
  transition:   "border-color 0.15s",
};

const SECTION_HEADER_STYLE: React.CSSProperties = {
  fontSize:     "0.65rem",
  fontWeight:   700,
  letterSpacing:"0.12em",
  textTransform:"uppercase",
  color:        "#94A3B8",
  paddingBottom:"8px",
  borderBottom: "1px solid #1E293B",
  marginBottom: "12px",
};

const FIELD_GAP = "14px";

// ─── Field components ─────────────────────────────────────────────────────────
function SettingsField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: FIELD_GAP }}>
      <label style={LABEL_STYLE}>{label}</label>
      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={INPUT_STYLE}
      onFocus={(e) => (e.currentTarget.style.borderColor = "#6366F1")}
      onBlur={(e)  => (e.currentTarget.style.borderColor = "#334155")}
    />
  );
}

function TextAreaInput({
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      rows={rows}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ ...INPUT_STYLE, resize: "vertical", lineHeight: "1.5" }}
      onFocus={(e) => (e.currentTarget.style.borderColor = "#6366F1")}
      onBlur={(e)  => (e.currentTarget.style.borderColor = "#334155")}
    />
  );
}

function DividerSection({ label }: { label: string }) {
  return (
    <div style={{ marginTop: "20px", marginBottom: "12px" }}>
      <p style={SECTION_HEADER_STYLE}>{label}</p>
    </div>
  );
}

// ─── Main Settings Panel ──────────────────────────────────────────────────────
export function ProjectSettingsPanel() {
  const { state, updateConfig } = useBuilderV2();
  const cfg = state.draftConfig;

  // ─── Canonical date change handler ─────────────────────────────────────────
  // When the ISO date changes, update wedding.date, wedding.displayDate,
  // wedding.day, wedding.month so the countdown and hero stay in sync.
  const handleDateChange = useCallback(
    (isoValue: string) => {
      updateConfig((c) => {
        try {
          const d = new Date(isoValue);
          if (isNaN(d.getTime())) {
            return { ...c, wedding: { ...c.wedding, date: isoValue } };
          }
          const dd      = String(d.getDate()).padStart(2, "0");
          const mm      = String(d.getMonth() + 1).padStart(2, "0");
          const yyyy    = d.getFullYear();
          const display = `${dd} • ${mm} • ${yyyy}`;
          const day     = String(d.getDate());
          const month   = MONTHS[d.getMonth()];
          return {
            ...c,
            wedding: {
              ...c.wedding,
              date:        isoValue,
              displayDate: display,
              day,
              month,
            },
          };
        } catch {
          return c;
        }
      });
    },
    [updateConfig]
  );

  // ── Derived values (non-reactive read from draftConfig) ────────────────────
  const weddingDate    = (cfg as any).wedding?.date        || "";
  const displayDate    = (cfg as any).wedding?.displayDate || isoToDisplay(weddingDate);
  const groomName      = (cfg as any).couple?.groomName    || "";
  const brideName      = (cfg as any).couple?.brideName    || "";
  const combinedNames  = (cfg as any).couple?.combinedNames || `${groomName} & ${brideName}`;
  const heroLocation   = (cfg as any).heroLocation         || "";
  const venueTitle     = (cfg as any).venueTitle           || "";
  const venueAddress   = (cfg as any).venueAddress         || "";
  const contactEmail   = (cfg as any).email?.recipients?.[0] || "";
  const heroIntro      = (cfg as any).heroIntro            || "";
  const heroSub        = (cfg as any).heroSub              || "";
  const rsvpTitle      = (cfg as any).rsvp?.title          || "";
  const rsvpDesc       = (cfg as any).rsvp?.description    || "";
  const rsvpDeadline   = (cfg as any).rsvp?.deadline        || "";
  const musicEnabled   = Boolean((cfg as any).music?.enabled);
  const musicUrl       = (cfg as any).music?.url            || "";
  const seoTitle       = (cfg as any).seo?.title            || combinedNames;
  const seoDescription = (cfg as any).seo?.description      || "";
  const instagramUrl   = (cfg as any).social?.instagram      || "";
  const twitterUrl     = (cfg as any).social?.twitter        || "";
  const footerTagline  = (cfg as any).footer?.thankYouMessage || "";

  // ─── Save helpers ──────────────────────────────────────────────────────────
  const setField = (updater: (c: any) => any) =>
    updateConfig((c) => updater(c as any) as any);

  return (
    <div
      style={{
        width:      "100%",
        height:     "100%",
        overflowY:  "auto",
        background: "#0F172A",
        display:    "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding:      "14px 16px 10px",
          borderBottom: "1px solid #1E293B",
          flexShrink:   0,
        }}
      >
        <p
          style={{
            fontSize:     "0.75rem",
            fontWeight:   700,
            color:        "#E2E8F0",
            letterSpacing:"0.04em",
            margin:       0,
          }}
        >
          ⚙ Project Settings
        </p>
        <p
          style={{
            fontSize: "0.65rem",
            color:    "#475569",
            margin:   "3px 0 0",
          }}
        >
          Changes apply to the live template after saving
        </p>
      </div>

      {/* Scrollable fields */}
      <div style={{ padding: "16px", flex: 1, overflowY: "auto" }}>

        {/* ── Wedding Date ─────────────────────────────── */}
        <DividerSection label="Wedding Date" />

        <SettingsField label="Date (canonical)">
          <input
            type="date"
            value={weddingDate ? weddingDate.slice(0, 10) : ""}
            onChange={(e) => handleDateChange(e.target.value + "T16:00:00")}
            style={{
              ...INPUT_STYLE,
              colorScheme: "dark",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#6366F1")}
            onBlur={(e)  => (e.currentTarget.style.borderColor = "#334155")}
          />
          {displayDate && (
            <p style={{ fontSize: "0.65rem", color: "#64748B", marginTop: "4px" }}>
              Displays as: <span style={{ color: "#94A3B8" }}>{displayDate}</span>
            </p>
          )}
        </SettingsField>

        {/* ── Couple ────────────────────────────────────── */}
        <DividerSection label="Couple" />

        <SettingsField label="Groom / Partner 1 Name">
          <TextInput
            value={groomName}
            placeholder="e.g. Alexander"
            onChange={(v) =>
              setField((c) => ({
                ...c,
                couple: {
                  ...c.couple,
                  groomName: v,
                  combinedNames: `${v} & ${c.couple?.brideName ?? ""}`,
                },
              }))
            }
          />
        </SettingsField>

        <SettingsField label="Bride / Partner 2 Name">
          <TextInput
            value={brideName}
            placeholder="e.g. Rosalie"
            onChange={(v) =>
              setField((c) => ({
                ...c,
                couple: {
                  ...c.couple,
                  brideName: v,
                  combinedNames: `${c.couple?.groomName ?? ""} & ${v}`,
                },
              }))
            }
          />
        </SettingsField>

        <SettingsField label="Combined Display Name">
          <TextInput
            value={combinedNames}
            placeholder="e.g. Alexander & Rosalie"
            onChange={(v) =>
              setField((c) => ({ ...c, couple: { ...c.couple, combinedNames: v } }))
            }
          />
        </SettingsField>

        {/* ── Hero Content ──────────────────────────────── */}
        <DividerSection label="Hero Copy" />

        <SettingsField label="Intro Line (above names)">
          <TextInput
            value={heroIntro}
            placeholder="e.g. Together with their families"
            onChange={(v) => setField((c) => ({ ...c, heroIntro: v }))}
          />
        </SettingsField>

        <SettingsField label="Subtitle (below names)">
          <TextInput
            value={heroSub}
            placeholder="e.g. invite you to celebrate their wedding"
            onChange={(v) => setField((c) => ({ ...c, heroSub: v }))}
          />
        </SettingsField>

        <SettingsField label="Hero Location Line">
          <TextInput
            value={heroLocation}
            placeholder="e.g. Yerevan, Armenia"
            onChange={(v) => setField((c) => ({ ...c, heroLocation: v }))}
          />
        </SettingsField>

        {/* ── Venue ─────────────────────────────────────── */}
        <DividerSection label="Venue" />

        <SettingsField label="Venue Name">
          <TextInput
            value={venueTitle}
            placeholder="e.g. The Ritz-Carlton"
            onChange={(v) => setField((c) => ({ ...c, venueTitle: v }))}
          />
        </SettingsField>

        <SettingsField label="Venue Address">
          <TextAreaInput
            value={venueAddress}
            rows={2}
            placeholder="Full address for Google Maps link"
            onChange={(v) => setField((c) => ({ ...c, venueAddress: v }))}
          />
        </SettingsField>

        {/* ── RSVP ──────────────────────────────────────── */}
        <DividerSection label="RSVP" />

        <SettingsField label="RSVP Section Title">
          <TextInput
            value={rsvpTitle}
            placeholder="e.g. Join Our Celebration"
            onChange={(v) =>
              setField((c) => ({ ...c, rsvp: { ...c.rsvp, title: v } }))
            }
          />
        </SettingsField>

        <SettingsField label="RSVP Description">
          <TextAreaInput
            value={rsvpDesc}
            rows={2}
            placeholder="e.g. Please RSVP by October 1st..."
            onChange={(v) =>
              setField((c) => ({ ...c, rsvp: { ...c.rsvp, description: v } }))
            }
          />
        </SettingsField>

        <SettingsField label="RSVP Deadline Date">
          <TextInput
            value={rsvpDeadline}
            placeholder="e.g. October 1st, 2025"
            onChange={(v) =>
              setField((c) => ({ ...c, rsvp: { ...c.rsvp, deadline: v } }))
            }
          />
        </SettingsField>

        {/* ── Notifications ─────────────────────────────── */}
        <DividerSection label="Notification Email" />

        <SettingsField label="RSVP Notification Email">
          <TextInput
            type="email"
            value={contactEmail}
            placeholder="your@email.com"
            onChange={(v) =>
              setField((c) => ({
                ...c,
                email: {
                  ...c.email,
                  recipients: v ? [v] : [],
                },
              }))
            }
          />
          <p style={{ fontSize: "0.62rem", color: "#475569", marginTop: "4px" }}>
            RSVP submissions will be sent to this address
          </p>
        </SettingsField>

        {/* ── Music ─────────────────────────────────────── */}
        <DividerSection label="Background Music" />

        <div
          style={{
            display:       "flex",
            alignItems:    "center",
            justifyContent:"space-between",
            marginBottom:  FIELD_GAP,
          }}
        >
          <span style={{ ...LABEL_STYLE, margin: 0 }}>Enable Music</span>
          <button
            onClick={() =>
              setField((c) => ({ ...c, music: { ...c.music, enabled: !musicEnabled } }))
            }
            style={{
              width:        "38px",
              height:       "20px",
              borderRadius: "10px",
              border:       "none",
              cursor:       "pointer",
              background:   musicEnabled ? "#6366F1" : "#334155",
              position:     "relative",
              transition:   "background 0.2s",
              flexShrink:   0,
            }}
          >
            <span
              style={{
                position:   "absolute",
                top:        "2px",
                left:       musicEnabled ? "20px" : "2px",
                width:      "16px",
                height:     "16px",
                borderRadius:"50%",
                background: "#fff",
                transition: "left 0.2s",
              }}
            />
          </button>
        </div>

        {musicEnabled && (
          <SettingsField label="Music URL">
            <TextInput
              value={musicUrl}
              placeholder="https://..."
              onChange={(v) =>
                setField((c) => ({ ...c, music: { ...c.music, url: v } }))
              }
            />
          </SettingsField>
        )}

        {/* ── Footer ────────────────────────────────────── */}
        <DividerSection label="Footer" />

        <SettingsField label="Footer Tagline">
          <TextInput
            value={footerTagline}
            placeholder="e.g. FOREVER STARTS HERE"
            onChange={(v) =>
              setField((c) => ({ ...c, footer: { ...c.footer, thankYouMessage: v } }))
            }
          />
        </SettingsField>

        {/* ── Social Links ──────────────────────────────── */}
        <DividerSection label="Social Links" />

        <SettingsField label="Instagram URL">
          <TextInput
            value={instagramUrl}
            placeholder="https://instagram.com/..."
            onChange={(v) =>
              setField((c) => ({ ...c, social: { ...c.social, instagram: v } }))
            }
          />
        </SettingsField>

        <SettingsField label="Twitter / X URL">
          <TextInput
            value={twitterUrl}
            placeholder="https://x.com/..."
            onChange={(v) =>
              setField((c) => ({ ...c, social: { ...c.social, twitter: v } }))
            }
          />
        </SettingsField>

        {/* ── SEO ───────────────────────────────────────── */}
        <DividerSection label="SEO / Sharing" />

        <SettingsField label="Page Title">
          <TextInput
            value={seoTitle}
            placeholder="e.g. Alexander & Rosalie — Wedding"
            onChange={(v) =>
              setField((c) => ({ ...c, seo: { ...c.seo, title: v } }))
            }
          />
        </SettingsField>

        <SettingsField label="Meta Description">
          <TextAreaInput
            value={seoDescription}
            rows={2}
            placeholder="Short description for Google / social previews"
            onChange={(v) =>
              setField((c) => ({ ...c, seo: { ...c.seo, description: v } }))
            }
          />
        </SettingsField>

        {/* bottom padding */}
        <div style={{ height: "24px" }} />
      </div>
    </div>
  );
}
