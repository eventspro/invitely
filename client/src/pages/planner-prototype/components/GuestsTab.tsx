import React, { useState } from "react";
import { Search, Plus } from "lucide-react";
import type { Guest, RsvpStatus, GuestSide } from "../types";
import {
  RSVP_LABELS,
  RSVP_COLORS,
  RSVP_BG_COLORS,
  RSVP_ALL_STATUSES,
} from "../constants";
import { getGuestTotals } from "../plannerUtils";
import { plannerText } from "../plannerTextConfig";
import GuestCard from "./GuestCard";

interface GuestsTabProps {
  guests: Guest[];
  tableMap: Map<string, string>;
  onAddGuest: () => void;
  onEditGuest: (g: Guest) => void;
  onDeleteGuest: (id: string) => void;
  onAssignGuest?: (g: Guest) => void;
}

const SIDE_FILTERS: { id: GuestSide | "all"; label: string }[] = [
  { id: "all", label: plannerText.common.all },
  { id: "bride", label: plannerText.guestSide.bride },
  { id: "groom", label: plannerText.guestSide.groom },
  { id: "both", label: plannerText.guestSide.both },
  { id: "other", label: plannerText.guestSide.other },
];

export default function GuestsTab({
  guests,
  tableMap,
  onAddGuest,
  onEditGuest,
  onDeleteGuest,
  onAssignGuest,
}: GuestsTabProps) {
  const [rsvpFilter, setRsvpFilter] = useState<RsvpStatus | "all">("all");
  const [sideFilter, setSideFilter] = useState<GuestSide | "all">("all");
  const [search, setSearch] = useState("");

  const totals = getGuestTotals(guests);

  const filtered = guests.filter((g) => {
    if (rsvpFilter !== "all" && g.rsvpStatus !== rsvpFilter) return false;
    if (sideFilter !== "all" && g.side !== sideFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !g.fullName.toLowerCase().includes(q) &&
        !g.groupName.toLowerCase().includes(q) &&
        !g.phone.includes(q)
      )
        return false;
    }
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        style={{
          padding: "12px 16px 10px",
          background: "#FBF7EF",
          flexShrink: 0,
          borderBottom: "1px solid #E8DDCB",
        }}
      >
        <div style={{ position: "relative" }}>
          <Search
            size={16}
            color="#6F766F"
            style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={plannerText.guests.searchPlaceholder}
            style={{
              width: "100%",
              padding: "12px 14px 12px 38px",
              borderRadius: 14,
              border: "1px solid #E8DDCB",
              background: "#FFFFFF",
              fontSize: 14,
              color: "#10241B",
              boxSizing: "border-box",
              outline: "none",
              height: 44,
            }}
          />
        </div>
      </div>

      <div
        style={{
          padding: "10px 16px",
          overflowX: "auto",
          display: "flex",
          gap: 6,
          flexShrink: 0,
          background: "#FBF7EF",
        }}
      >
        <FilterChip
          active={rsvpFilter === "all"}
          activeColor="#123C2F"
          activeBg="#123C2F"
          activeText="#fff"
          onClick={() => setRsvpFilter("all")}
        >
          {plannerText.common.all} ({totals.total})
        </FilterChip>
        {RSVP_ALL_STATUSES.map((s) => {
          const count = guests.filter((g) => g.rsvpStatus === s).length;
          const active = rsvpFilter === s;
          return (
            <FilterChip
              key={s}
              active={active}
              activeColor={RSVP_COLORS[s]}
              activeBg={RSVP_BG_COLORS[s]}
              activeText={RSVP_COLORS[s]}
              onClick={() => setRsvpFilter(active ? "all" : s)}
            >
              {RSVP_LABELS[s]} ({count})
            </FilterChip>
          );
        })}
      </div>

      <div
        style={{
          padding: "0 16px 10px",
          overflowX: "auto",
          display: "flex",
          gap: 6,
          flexShrink: 0,
          background: "#FBF7EF",
          borderBottom: "1px solid #E8DDCB",
        }}
      >
        {SIDE_FILTERS.map((f) => {
          const active = sideFilter === f.id;
          return (
            <FilterChip
              key={f.id}
              active={active}
              activeColor="#123C2F"
              activeBg="#E8F3ED"
              activeText="#123C2F"
              size="sm"
              onClick={() => setSideFilter(active ? "all" : f.id)}
            >
              {f.label}
            </FilterChip>
          );
        })}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px 120px" }}>
        {filtered.length === 0 ? (
          <EmptyState
            title={guests.length === 0 ? plannerText.guests.noGuests : plannerText.emptyStates.noGuestsInFilter}
            description={guests.length === 0 ? plannerText.guests.noGuestsDescription : undefined}
          />
        ) : (
          <>
            <div style={{ fontSize: 12, color: "#6F766F", marginBottom: 12, fontWeight: 500 }}>
              {filtered.length} {plannerText.common.guests}
            </div>
            {filtered.map((g) => (
              <GuestCard
                key={g.id}
                guest={g}
                tableName={g.tableId ? tableMap.get(g.tableId) : undefined}
                onEdit={onEditGuest}
                onDelete={onDeleteGuest}
                onAssign={onAssignGuest}
              />
            ))}
          </>
        )}
      </div>

      <Fab onClick={onAddGuest} ariaLabel={plannerText.guests.addGuest} />
    </div>
  );
}

function FilterChip({
  children,
  active,
  activeColor,
  activeBg,
  activeText,
  size = "md",
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  activeColor: string;
  activeBg: string;
  activeText: string;
  size?: "sm" | "md";
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0,
        padding: size === "sm" ? "5px 11px" : "7px 13px",
        borderRadius: 20,
        border: `1px solid ${active ? activeColor : "#E8DDCB"}`,
        background: active ? activeBg : "#fff",
        color: active ? activeText : "#6F766F",
        fontWeight: active ? 600 : 500,
        fontSize: size === "sm" ? 11 : 12,
        cursor: "pointer",
        whiteSpace: "nowrap",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {children}
    </button>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 16px", color: "#6F766F" }}>
      <div style={{ fontSize: 15, color: "#10241B", fontWeight: 600 }}>{title}</div>
      {description && (
        <div style={{ fontSize: 13, marginTop: 8, lineHeight: 1.5 }}>{description}</div>
      )}
    </div>
  );
}

export function Fab({ onClick, ariaLabel }: { onClick: () => void; ariaLabel: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        position: "fixed",
        bottom: "calc(80px + env(safe-area-inset-bottom, 0px))",
        right: 20,
        width: 56,
        height: 56,
        borderRadius: "50%",
        border: "none",
        background: "linear-gradient(135deg, #1A5240 0%, #0F3D2E 100%)",
        color: "#fff",
        cursor: "pointer",
        boxShadow: "0 6px 20px rgba(15,61,46,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      <Plus size={26} strokeWidth={2.5} />
    </button>
  );
}
