import React, { useState } from "react";
import { usePlannerText } from "../PlannerLocaleContext";
import { uid } from "../plannerUtils";
import type { Guest, RsvpStatus, GuestSide } from "../types";

interface GuestFormProps {
  initial?: Guest;
  onSave: (g: Guest) => void;
  onCancel: () => void;
}

const RSVP_ACTIVE: Record<RsvpStatus, string> = {
  invited: "#6B7280",
  coming: "#16864A",
  not_coming: "#E85D5D",
  waiting: "#D7951E",
  maybe: "#9333EA",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #E5E7EB",
  borderRadius: 10,
  fontSize: 14,
  color: "#111827",
  background: "#FAFAFA",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#374151",
  marginBottom: 5,
};

const fieldStyle: React.CSSProperties = {
  marginBottom: 14,
};

export default function GuestForm({ initial, onSave, onCancel }: GuestFormProps) {
  const pt = usePlannerText();
  const [fullName, setFullName] = useState(initial?.fullName ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>(initial?.rsvpStatus ?? "invited");
  const [guestCount, setGuestCount] = useState(initial?.guestCount ?? 1);
  const [side, setSide] = useState<GuestSide>(initial?.side ?? "both");
  const [groupName, setGroupName] = useState(initial?.groupName ?? "");
  const [dietaryNotes, setDietaryNotes] = useState(initial?.dietaryNotes ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState("");

  const RSVP_OPTIONS: { value: RsvpStatus; label: string }[] = [
    { value: "invited",    label: pt.rsvp.invited    },
    { value: "coming",     label: pt.rsvp.coming     },
    { value: "not_coming", label: pt.rsvp.not_coming },
    { value: "waiting",    label: pt.rsvp.waiting    },
    { value: "maybe",      label: pt.rsvp.maybe      },
  ];

  const SIDE_OPTIONS: { value: GuestSide; label: string }[] = [
    { value: "bride", label: pt.guestSide.bride },
    { value: "groom", label: pt.guestSide.groom },
    { value: "both",  label: pt.guestSide.both  },
    { value: "other", label: pt.guestSide.other },
  ];

  function handleSubmit() {
    if (!fullName.trim()) {
      setError(pt.warnings.nameRequired);
      return;
    }
    const guest: Guest = {
      id: initial?.id ?? uid(),
      fullName: fullName.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      rsvpStatus,
      guestCount: Math.max(1, guestCount),
      side,
      groupName: groupName.trim() || undefined,
      dietaryNotes: dietaryNotes.trim() || undefined,
      notes: notes.trim() || undefined,
      tableId: initial?.tableId,
      seatId: initial?.seatId,
    };
    onSave(guest);
  }

  const chipBtn = (active: boolean, color: string): React.CSSProperties => ({
    padding: "6px 12px",
    borderRadius: 99,
    border: active ? `1.5px solid ${color}` : "1.5px solid #E5E7EB",
    background: active ? `${color}18` : "#FAFAFA",
    color: active ? color : "#6B7280",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: active ? 700 : 500,
    transition: "all 0.15s",
  });

  return (
    <div>
      <div style={fieldStyle}>
        <label style={labelStyle}>{pt.guests.fullName} <span style={{ color: "#E85D5D" }}>*</span></label>
        <input
          style={{ ...inputStyle, borderColor: error ? "#E85D5D" : "#E5E7EB" }}
          value={fullName}
          onChange={e => { setFullName(e.target.value); setError(""); }}
          placeholder={pt.guests.fullNamePlaceholder}
        />
        {error && <div style={{ fontSize: 11, color: "#E85D5D", marginTop: 4 }}>{error}</div>}
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>{pt.guests.rsvpStatus}</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {RSVP_OPTIONS.map(o => (
            <button key={o.value} style={chipBtn(rsvpStatus === o.value, RSVP_ACTIVE[o.value])} onClick={() => setRsvpStatus(o.value)}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ ...fieldStyle, flex: 1 }}>
          <label style={labelStyle}>{pt.guests.guestCount}</label>
          <input
            type="number"
            min={1}
            max={20}
            style={inputStyle}
            value={guestCount}
            onChange={e => setGuestCount(Number(e.target.value))}
          />
        </div>
        <div style={{ ...fieldStyle, flex: 2 }}>
          <label style={labelStyle}>{pt.guests.side}</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {SIDE_OPTIONS.map(o => (
              <button key={o.value} style={chipBtn(side === o.value, "#064E3B")} onClick={() => setSide(o.value)}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>{pt.guests.phone}</label>
        <input style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 555 000 0000" />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>{pt.guests.email}</label>
        <input type="email" style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>{pt.guests.groupName}</label>
        <input style={inputStyle} value={groupName} onChange={e => setGroupName(e.target.value)} placeholder={pt.guests.groupNamePlaceholder} />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>{pt.guests.dietaryNotes}</label>
        <input style={inputStyle} value={dietaryNotes} onChange={e => setDietaryNotes(e.target.value)} placeholder={pt.guests.dietaryNotesPlaceholder} />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>{pt.guests.notes}</label>
        <textarea
          style={{ ...inputStyle, resize: "vertical", minHeight: 64 }}
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1, padding: "13px", borderRadius: 12,
            border: "1.5px solid #E5E7EB", background: "#FAFAFA",
            color: "#374151", fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}
        >
          {pt.common.cancel}
        </button>
        <button
          onClick={handleSubmit}
          style={{
            flex: 2, padding: "13px", borderRadius: 12, border: "none",
            background: "linear-gradient(135deg, #00472F 0%, #006B4A 100%)",
            color: "#FFFFFF", fontSize: 14, fontWeight: 700, cursor: "pointer",
          }}
        >
          {pt.common.save}
        </button>
      </div>
    </div>
  );
}
