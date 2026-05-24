import React, { useState } from "react";
import { Search, X } from "lucide-react";
import { plannerText } from "../plannerTextConfig";
import { getInitials, RSVP_COLORS, RSVP_BG } from "../plannerUtils";
import type { Guest, Seat } from "../types";

interface GuestPickerSheetProps {
  guests: Guest[];
  seats: Seat[];
  onSelect: (guestId: string) => void;
  onClose: () => void;
}

export default function GuestPickerSheet({ guests, seats, onSelect, onClose }: GuestPickerSheetProps) {
  const [search, setSearch] = useState("");

  // guests who are coming and not yet assigned to a seat
  const assignedIds = new Set(seats.filter(s => !!s.guestId).map(s => s.guestId as string));
  const eligible = guests.filter(
    g => (g.rsvpStatus === "coming" || g.rsvpStatus === "maybe") && !assignedIds.has(g.id)
  );

  const filtered = search.trim()
    ? eligible.filter(g => g.fullName.toLowerCase().includes(search.toLowerCase()))
    : eligible;

  return (
    <div>
      {/* search */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "#F3F4F6",
          borderRadius: 12,
          padding: "8px 12px",
          marginBottom: 12,
        }}
      >
        <Search size={15} color="#9CA3AF" />
        <input
          autoFocus
          style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 14, color: "#111827" }}
          placeholder={plannerText.guests.searchPlaceholder}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch("")} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#9CA3AF", padding: 0, display: "flex" }}>
            <X size={14} />
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 0", color: "#9CA3AF", fontSize: 13 }}>
          {plannerText.guests.noUnassignedGuests}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {filtered.map(g => (
            <button
              key={g.id}
              onClick={() => { onSelect(g.id); onClose(); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid #E5E7EB",
                background: "#FAFAFA",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "#EAF5EF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#064E3B",
                  flexShrink: 0,
                }}
              >
                {getInitials(g.fullName)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {g.fullName}
                </div>
                {g.guestCount > 1 && (
                  <div style={{ fontSize: 11, color: "#9CA3AF" }}>+{g.guestCount - 1} {plannerText.common.guests}</div>
                )}
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: RSVP_COLORS[g.rsvpStatus] ?? "#6B7280",
                  background: RSVP_BG[g.rsvpStatus] ?? "#F3F4F6",
                  borderRadius: 99,
                  padding: "2px 7px",
                  flexShrink: 0,
                }}
              >
                {plannerText.rsvp[g.rsvpStatus as keyof typeof plannerText.rsvp] ?? g.rsvpStatus}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
