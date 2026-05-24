import React, { useState, useEffect } from "react";
import type { Guest, RsvpStatus, GuestSide } from "../types";
import { RSVP_LABELS, SIDE_LABELS, RSVP_ALL_STATUSES } from "../constants";
import { uid } from "../plannerUtils";
import { plannerText } from "../plannerTextConfig";

interface GuestFormProps {
  initial?: Guest;
  onSave: (g: Guest) => void;
  onCancel: () => void;
}

const SIDES: GuestSide[] = ["bride", "groom", "both", "other"];

function emptyGuest(): Guest {
  return {
    id: uid(),
    fullName: "",
    phone: "",
    email: "",
    rsvpStatus: "invited",
    guestCount: 1,
    side: "both",
    groupName: "",
    tableId: undefined,
    seatId: undefined,
    dietaryNotes: "",
    notes: "",
  };
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0 14px",
  height: 48,
  borderRadius: 14,
  border: "1px solid #E8DDCB",
  background: "#FFFFFF",
  fontSize: 14.5,
  color: "#10241B",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#10241B",
  marginBottom: 6,
  letterSpacing: "-0.005em",
};

export default function GuestForm({ initial, onSave, onCancel }: GuestFormProps) {
  const [form, setForm] = useState<Guest>(() => (initial ? { ...initial } : emptyGuest()));
  const [errors, setErrors] = useState<Partial<Record<keyof Guest, string>>>({});

  useEffect(() => {
    setForm(initial ? { ...initial } : emptyGuest());
    setErrors({});
  }, [initial]);

  const set = <K extends keyof Guest>(key: K, val: Guest[K]) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): boolean => {
    const errs: Partial<Record<keyof Guest, string>> = {};
    if (!form.fullName.trim()) errs.fullName = plannerText.guests.validation.nameRequired;
    if (form.guestCount < 1) errs.guestCount = plannerText.guests.validation.guestCountMin;
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return false;
    }
    return true;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Field label={plannerText.guests.fullName + " *"} error={errors.fullName}>
        <input
          style={{ ...inputStyle, borderColor: errors.fullName ? "#D95B5B" : "#E8DDCB" }}
          value={form.fullName}
          onChange={(e) => set("fullName", e.target.value)}
          placeholder={plannerText.guests.fullNamePlaceholder}
          autoFocus
        />
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Field label={plannerText.guests.phone}>
          <input
            style={inputStyle}
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="+374 XX XXXXXX"
            type="tel"
          />
        </Field>
        <Field label={plannerText.guests.email}>
          <input
            style={inputStyle}
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="name@mail.com"
            type="email"
          />
        </Field>
      </div>

      <Field label={plannerText.guests.rsvpStatus}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {RSVP_ALL_STATUSES.map((s: RsvpStatus) => {
            const active = form.rsvpStatus === s;
            return (
              <button
                key={s}
                onClick={() => set("rsvpStatus", s)}
                type="button"
                style={{
                  padding: "8px 13px",
                  borderRadius: 22,
                  border: `1px solid ${active ? "#123C2F" : "#E8DDCB"}`,
                  background: active ? "#123C2F" : "#FFFFFF",
                  color: active ? "#fff" : "#10241B",
                  fontWeight: active ? 600 : 500,
                  fontSize: 13,
                  cursor: "pointer",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                {RSVP_LABELS[s]}
              </button>
            );
          })}
        </div>
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Field label={plannerText.guests.guestCount} error={errors.guestCount}>
          <input
            style={{ ...inputStyle, borderColor: errors.guestCount ? "#D95B5B" : "#E8DDCB" }}
            value={form.guestCount}
            onChange={(e) => set("guestCount", Math.max(1, parseInt(e.target.value) || 1))}
            type="number"
            min={1}
            max={20}
          />
        </Field>
        <Field label={plannerText.guests.side}>
          <select
            style={{ ...inputStyle, appearance: "none" }}
            value={form.side}
            onChange={(e) => set("side", e.target.value as GuestSide)}
          >
            {SIDES.map((s) => (
              <option key={s} value={s}>
                {SIDE_LABELS[s]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label={plannerText.guests.groupName}>
        <input
          style={inputStyle}
          value={form.groupName}
          onChange={(e) => set("groupName", e.target.value)}
          placeholder={plannerText.guests.groupNamePlaceholder}
        />
      </Field>

      <Field label={plannerText.guests.dietaryNotes}>
        <input
          style={inputStyle}
          value={form.dietaryNotes}
          onChange={(e) => set("dietaryNotes", e.target.value)}
          placeholder={plannerText.guests.dietaryPlaceholder}
        />
      </Field>

      <Field label={plannerText.guests.notes}>
        <textarea
          style={{ ...inputStyle, minHeight: 80, height: "auto", padding: "12px 14px", resize: "vertical" }}
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder={plannerText.guests.notesPlaceholder}
        />
      </Field>

      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <SecondaryBtn onClick={onCancel}>{plannerText.common.cancel}</SecondaryBtn>
        <PrimaryBtn onClick={() => validate() && onSave(form)}>{plannerText.common.save}</PrimaryBtn>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
      {error && <div style={{ color: "#D95B5B", fontSize: 11, marginTop: 4 }}>{error}</div>}
    </div>
  );
}

export function PrimaryBtn({
  children,
  onClick,
  flex = 2,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  flex?: number;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      type="button"
      style={{
        flex,
        padding: "14px 0",
        borderRadius: 14,
        border: "none",
        background: disabled ? "#E8DDCB" : "linear-gradient(135deg, #1A5240 0%, #0F3D2E 100%)",
        color: "#fff",
        fontWeight: 700,
        fontSize: 15,
        cursor: disabled ? "not-allowed" : "pointer",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {children}
    </button>
  );
}

export function SecondaryBtn({
  children,
  onClick,
  flex = 1,
}: {
  children: React.ReactNode;
  onClick: () => void;
  flex?: number;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      style={{
        flex,
        padding: "14px 0",
        borderRadius: 14,
        border: "1px solid #E8DDCB",
        background: "#FFFFFF",
        color: "#10241B",
        fontWeight: 600,
        fontSize: 15,
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {children}
    </button>
  );
}
