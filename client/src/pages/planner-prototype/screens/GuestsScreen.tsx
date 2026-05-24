import React, { useState } from "react";
import { Search, X, UserPlus, Users } from "lucide-react";
import { usePlannerText } from "../PlannerLocaleContext";
import { getGuestTotals } from "../plannerUtils";
import GuestCard from "../components/GuestCard";
import type { Guest, WeddingTable, Seat, RsvpStatus } from "../types";

interface GuestsScreenProps {
  guests: Guest[];
  tables: WeddingTable[];
  seats: Seat[];
  onAdd: () => void;
  onEdit: (guest: Guest) => void;
  onDelete: (id: string) => void;
}

type FilterStatus = "all" | RsvpStatus | "unseated";

export default function GuestsScreen({ guests, tables, seats, onAdd, onEdit, onDelete }: GuestsScreenProps) {
  const pt = usePlannerText();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("all");

  const g = getGuestTotals(guests);
  const unseatedCount = guests.filter(gx => gx.rsvpStatus === "coming" && !gx.tableId).length;

  // Build filtered list
  let filtered: Guest[] = [...guests];
  if (filter === "unseated") {
    filtered = filtered.filter(gx => gx.rsvpStatus === "coming" && !gx.tableId);
  } else if (filter !== "all") {
    filtered = filtered.filter(gx => gx.rsvpStatus === filter);
  }
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(gx =>
      gx.fullName.toLowerCase().includes(q) ||
      gx.groupName?.toLowerCase().includes(q) ||
      gx.phone?.toLowerCase().includes(q) ||
      gx.email?.toLowerCase().includes(q)
    );
  }

  const FILTERS: { value: FilterStatus; label: string; count: number }[] = [
    { value: "all",        label: pt.common.all,        count: guests.length },
    { value: "coming",     label: pt.rsvp.coming,       count: g.coming },
    { value: "waiting",    label: pt.rsvp.waiting,      count: g.waiting },
    { value: "not_coming", label: pt.rsvp.not_coming,   count: g.notComing },
    { value: "maybe",      label: pt.rsvp.maybe,        count: g.maybe },
    { value: "invited",    label: pt.rsvp.invited,      count: g.invited },
    { value: "unseated",   label: pt.guests.unseated,   count: unseatedCount },
  ];

  const STAT_ITEMS = [
    { value: guests.length, label: pt.guests.totalGuests },
    { value: g.coming,      label: pt.rsvp.coming },
    { value: g.waiting,     label: pt.rsvp.waiting },
    { value: unseatedCount, label: pt.guests.unseated },
  ];

  function getSeatNumber(guest: Guest): number | undefined {
    if (!guest.seatId) return undefined;
    return seats.find(s => s.id === guest.seatId)?.seatNumber;
  }

  function getTableName(guest: Guest): string | undefined {
    if (!guest.tableId) return undefined;
    return tables.find(t => t.id === guest.tableId)?.name;
  }

  // ─── SHARED: Search bar ──────────────────────────────────────────────────
  function renderSearchBar(extraStyle?: React.CSSProperties) {
    return (
      <div style={extraStyle}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "#FFFFFF",
            borderRadius: 14,
            padding: "0 14px",
            height: 46,
            border: "1px solid #E5E7EB",
            boxShadow: "0 1px 4px rgba(17,24,39,0.04)",
          }}
        >
          <Search size={16} color="#9CA3AF" strokeWidth={2} />
          <input
            style={{
              flex: 1,
              border: "none",
              background: "transparent",
              outline: "none",
              fontSize: 14,
              color: "#111827",
              fontFamily: "inherit",
            }}
            placeholder={pt.guests.searchPlaceholder}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{ border: "none", background: "transparent", cursor: "pointer", color: "#9CA3AF", padding: 0, display: "flex" }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─── SHARED: Filter chips ────────────────────────────────────────────────
  function renderFilterChips() {
    return (
      <div
        className="pp-chip-scroll"
        style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}
      >
        {FILTERS.map(f => {
          const active = filter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "7px 12px",
                borderRadius: 99,
                border: active ? "none" : "1px solid #E5E7EB",
                background: active ? "#064E3B" : "#FFFFFF",
                color: active ? "#FFFFFF" : "#6B7280",
                cursor: "pointer",
                fontSize: 12.5,
                fontWeight: active ? 700 : 500,
                whiteSpace: "nowrap",
                flexShrink: 0,
                letterSpacing: "-0.01em",
              }}
            >
              {f.label}
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  background: active ? "rgba(255,255,255,0.25)" : "#F3F4F6",
                  color: active ? "#FFFFFF" : "#9CA3AF",
                  borderRadius: 99,
                  padding: "1px 6px",
                  lineHeight: 1.5,
                }}
              >
                {f.count}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  // ─── SHARED: Guest list / empty state ───────────────────────────────────
  function renderGuestList() {
    if (filtered.length === 0) {
      return (
        <div style={{ textAlign: "center", padding: "48px 24px" }}>
          <Users size={36} color="#D1D5DB" strokeWidth={1.5} style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
            {search ? pt.guests.emptySearch : pt.guests.emptyTitle}
          </div>
          {!search && (
            <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 16 }}>
              {pt.guests.emptyDesc}
            </p>
          )}
          {!search && (
            <button
              onClick={onAdd}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 20px",
                borderRadius: 12,
                border: "none",
                background: "linear-gradient(135deg, #00472F 0%, #006B4A 100%)",
                color: "#FFFFFF",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <UserPlus size={15} /> {pt.guests.addGuest}
            </button>
          )}
        </div>
      );
    }
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map(gx => (
          <GuestCard
            key={gx.id}
            guest={gx}
            tableName={getTableName(gx)}
            seatNumber={getSeatNumber(gx)}
            onEdit={() => onEdit(gx)}
            onDelete={() => onDelete(gx.id)}
          />
        ))}
      </div>
    );
  }

  // ─── DESKTOP: Stat card ──────────────────────────────────────────────────
  function statCard(value: number, label: string) {
    return (
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 16,
          padding: "18px 20px",
          border: "1px solid #E5E7EB",
          boxShadow: "0 2px 8px rgba(17,24,39,0.04)",
        }}
      >
        <div style={{ fontSize: 26, fontWeight: 700, color: "#111827", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
          {value}
        </div>
        <div style={{ fontSize: 12.5, color: "#6B7280", fontWeight: 500, marginTop: 4 }}>
          {label}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ─── MOBILE VIEW ───────────────────────────────────────────────── */}
      <div className="pp-mobile-view" style={{ paddingBottom: 90 }}>
        {/* Stats strip */}
        <div style={{ padding: "12px 16px 0" }}>
          <div style={{ display: "flex", gap: 8 }}>
            {STAT_ITEMS.map((s, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  background: "#FFFFFF",
                  borderRadius: 12,
                  padding: "10px 6px",
                  border: "1px solid #E5E7EB",
                  textAlign: "center",
                  boxShadow: "0 1px 4px rgba(17,24,39,0.04)",
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 700, color: "#111827", lineHeight: 1.2, letterSpacing: "-0.02em" }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 500, marginTop: 2, lineHeight: 1.2 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: "10px 16px 0" }}>
          {renderSearchBar()}
        </div>

        {/* Filter chips */}
        <div style={{ padding: "8px 16px 0" }}>
          {renderFilterChips()}
        </div>

        {/* Guest list */}
        <div style={{ padding: "10px 16px 0" }}>
          {renderGuestList()}
        </div>

        {/* Add Guest button */}
        <div style={{ padding: "16px 16px 0" }}>
          <button
            onClick={onAdd}
            style={{
              width: "100%",
              padding: "15px",
              borderRadius: 14,
              border: "none",
              background: "linear-gradient(135deg, #00472F 0%, #006B4A 100%)",
              color: "#FFFFFF",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontSize: 14.5,
              fontWeight: 700,
              boxShadow: "0 4px 16px rgba(6,78,59,0.25)",
              letterSpacing: "-0.01em",
              fontFamily: "inherit",
            }}
          >
            <UserPlus size={17} strokeWidth={2} /> {pt.guests.addGuest}
          </button>
        </div>
      </div>

      {/* ─── DESKTOP VIEW ──────────────────────────────────────────────── */}
      <div className="pp-desktop-view">
        <div className="pp-page-pad">
          {/* Header row */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: 24,
              gap: 16,
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: "#111827",
                  margin: 0,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.2,
                }}
              >
                {pt.guests.title}
              </h1>
              <p style={{ fontSize: 15, color: "#6B7280", margin: "4px 0 0", fontWeight: 400 }}>
                {pt.guests.subtitle}
              </p>
            </div>
            <button
              onClick={onAdd}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                borderRadius: 12,
                border: "none",
                background: "linear-gradient(135deg, #00472F 0%, #006B4A 100%)",
                color: "#FFFFFF",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 700,
                boxShadow: "0 4px 12px rgba(6,78,59,0.25)",
                flexShrink: 0,
                letterSpacing: "-0.01em",
                fontFamily: "inherit",
              }}
            >
              <UserPlus size={16} strokeWidth={2} /> {pt.guests.addGuest}
            </button>
          </div>

          {/* Stats row */}
          <div className="pp-stat-grid" style={{ gap: 14, marginBottom: 24 }}>
            {statCard(guests.length, pt.guests.totalGuests)}
            {statCard(g.coming, pt.rsvp.coming)}
            {statCard(g.waiting, pt.rsvp.waiting)}
            {statCard(unseatedCount, pt.guests.unseated)}
          </div>

          {/* Toolbar */}
          <div style={{ marginBottom: 16 }}>
            {renderSearchBar({ marginBottom: 10 })}
            {renderFilterChips()}
          </div>

          {/* Guest list */}
          <div style={{ maxWidth: 960 }}>
            {renderGuestList()}
          </div>
        </div>
      </div>
    </>
  );
}
