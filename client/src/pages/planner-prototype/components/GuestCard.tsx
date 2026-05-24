import React from "react";
import { Pencil, Trash2, MapPin } from "lucide-react";
import { plannerText } from "../plannerTextConfig";
import { getInitials } from "../plannerUtils";
import type { Guest } from "../types";

interface GuestCardProps {
  guest: Guest;
  tableName?: string;
  seatNumber?: number;
  onEdit: () => void;
  onDelete: () => void;
}

const PILL: Record<string, { bg: string; color: string }> = {
  coming:     { bg: "#EAF5EF", color: "#16864A" },
  waiting:    { bg: "#FFF4DC", color: "#D7951E" },
  not_coming: { bg: "#FEECEC", color: "#E85D5D" },
  maybe:      { bg: "#EEF2FF", color: "#4F46E5" },
  invited:    { bg: "#F3F4F6", color: "#6B7280" },
};

const RSVP_LABEL: Record<string, string> = {
  coming:     plannerText.rsvp.coming,
  not_coming: plannerText.rsvp.not_coming,
  waiting:    plannerText.rsvp.waiting,
  maybe:      plannerText.rsvp.maybe,
  invited:    plannerText.rsvp.invited,
};

const SIDE_LABEL: Record<string, string> = {
  bride: plannerText.guestSide.bride,
  groom: plannerText.guestSide.groom,
  both:  plannerText.guestSide.both,
  other: plannerText.guestSide.other,
};

export default function GuestCard({ guest, tableName, seatNumber, onEdit, onDelete }: GuestCardProps) {
  const pill = PILL[guest.rsvpStatus] ?? { bg: "#F3F4F6", color: "#6B7280" };

  const meta: string[] = [];
  if (guest.guestCount > 1) meta.push(`${guest.guestCount} ${plannerText.common.guests}`);
  if (guest.side) meta.push(SIDE_LABEL[guest.side] ?? guest.side);
  if (guest.groupName) meta.push(guest.groupName);

  const tableDisplay = tableName
    ? (seatNumber ? `${tableName} · Seat ${seatNumber}` : tableName)
    : null;

  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 16,
        padding: "14px 12px 14px 14px",
        border: "1px solid #E5E7EB",
        boxShadow: "0 2px 12px rgba(17,24,39,0.05)",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
      }}
    >
      {/* Avatar – circular */}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 999,
          background: "linear-gradient(135deg, #EAF5EF 0%, #D1FAE5 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          fontSize: 14,
          fontWeight: 700,
          color: "#064E3B",
          letterSpacing: "-0.5px",
        }}
      >
        {getInitials(guest.fullName)}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Line 1: Name + status pill */}
        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: 15,
              fontWeight: 650,
              color: "#111827",
              lineHeight: 1.3,
              letterSpacing: "-0.01em",
            }}
          >
            {guest.fullName}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: pill.color,
              background: pill.bg,
              borderRadius: 99,
              padding: "2.5px 8px",
              flexShrink: 0,
              lineHeight: 1.5,
            }}
          >
            {RSVP_LABEL[guest.rsvpStatus] ?? guest.rsvpStatus}
          </span>
        </div>

        {/* Line 2: count · side · group */}
        {meta.length > 0 && (
          <div
            style={{
              fontSize: 12.5,
              color: "#6B7280",
              marginTop: 3,
              lineHeight: 1.4,
            }}
          >
            {meta.join(" · ")}
          </div>
        )}

        {/* Line 3: Table / seat */}
        {tableDisplay && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              marginTop: 3,
            }}
          >
            <MapPin size={11} color="#D7B56D" strokeWidth={2} />
            <span
              style={{
                fontSize: 12,
                color: "#D7B56D",
                fontWeight: 600,
                lineHeight: 1.4,
              }}
            >
              {tableDisplay}
            </span>
          </div>
        )}

        {/* Dietary notes */}
        {guest.dietaryNotes && (
          <div
            style={{
              fontSize: 11.5,
              color: "#9CA3AF",
              marginTop: 3,
              lineHeight: 1.3,
              fontStyle: "italic",
            }}
          >
            {guest.dietaryNotes}
          </div>
        )}
      </div>

      {/* Actions */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          flexShrink: 0,
          alignSelf: "center",
        }}
      >
        <button
          onClick={onEdit}
          style={{
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            borderRadius: 8,
            color: "#9CA3AF",
          }}
        >
          <Pencil size={14} strokeWidth={1.75} />
        </button>
        <button
          onClick={onDelete}
          style={{
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            borderRadius: 8,
            color: "#9CA3AF",
          }}
        >
          <Trash2 size={14} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
