import React, { useState } from "react";
import { Pencil, Trash2, Armchair, ChevronRight, MoreHorizontal, X } from "lucide-react";
import { plannerText } from "../plannerTextConfig";
import VisualTable from "./VisualTable";
import ProgressBar from "./ProgressBar";
import type { WeddingTable, Seat, Guest } from "../types";

const SHAPE_LABELS: Record<string, string> = {
  circle: plannerText.tableShapes.circle,
  square: plannerText.tableShapes.square,
  rectangle: plannerText.tableShapes.rectangle,
  long: plannerText.tableShapes.long,
  oval: plannerText.tableShapes.oval,
  head: plannerText.tableShapes.head,
};

interface TableCardProps {
  table: WeddingTable;
  seats: Seat[];
  guests: Guest[];
  onEdit: () => void;
  onDelete: () => void;
  onManageSeats: () => void;
}

export default function TableCard({ table, seats, guests, onEdit, onDelete, onManageSeats }: TableCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const tableSeats = seats.filter(s => s.tableId === table.id);
  const assigned = tableSeats.filter(s => !!s.guestId).length;
  const pct = table.capacity > 0 ? Math.round((assigned / table.capacity) * 100) : 0;

  const seatInfos = tableSeats.map(s => {
    const g = s.guestId ? guests.find(x => x.id === s.guestId) : undefined;
    return {
      seatNumber: s.seatNumber,
      guestId: s.guestId,
      initials: g ? g.fullName.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? "").join("") : undefined,
    };
  });

  const barColor = pct >= 100 ? "#E85D5D" : pct >= 80 ? "#D7951E" : "#064E3B";

  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 18,
        border: "1px solid #E5E7EB",
        boxShadow: "0 4px 16px rgba(17,24,39,0.06)",
        overflow: "hidden",
      }}
    >
      {/* Main content row */}
      <div style={{ display: "flex", gap: 14, padding: "16px 14px 14px" }}>
        {/* Visual table diagram */}
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
          onClick={onManageSeats}
        >
          <VisualTable
            shape={table.shape}
            capacity={table.capacity}
            seats={seatInfos}
            compact
            size={96}
          />
        </div>

        {/* Info area */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 0 }}>
          {/* Header: name + locked badge + menu toggle */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#111827", letterSpacing: "-0.01em" }}>
                  {table.name}
                </span>
                {table.locked && (
                  <span style={{
                    fontSize: 10,
                    color: "#D7B56D",
                    fontWeight: 600,
                    background: "#FBF3E0",
                    borderRadius: 6,
                    padding: "2px 7px",
                    border: "1px solid #F0DCA8",
                  }}>
                    {plannerText.tables.locked}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: "#6B7280", marginTop: 3 }}>
                {SHAPE_LABELS[table.shape] ?? table.shape} · {table.capacity} {plannerText.common.seats}
              </div>
            </div>

            {/* "..." menu toggle */}
            {menuOpen ? (
              <div style={{ display: "flex", gap: 4, flexShrink: 0, alignItems: "center" }}>
                <button
                  onClick={() => { onEdit(); setMenuOpen(false); }}
                  style={{
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid #E5E7EB",
                    background: "#F9FAFB",
                    borderRadius: 10,
                    cursor: "pointer",
                    color: "#374151",
                  }}
                  title={plannerText.common.edit}
                >
                  <Pencil size={13} strokeWidth={1.75} />
                </button>
                <button
                  onClick={() => { if (!table.locked) { onDelete(); setMenuOpen(false); } }}
                  style={{
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: `1px solid ${table.locked ? "#F3F4F6" : "#FDE8E8"}`,
                    background: table.locked ? "#F9FAFB" : "#FEF2F2",
                    borderRadius: 10,
                    cursor: table.locked ? "default" : "pointer",
                    color: table.locked ? "#D1D5DB" : "#E85D5D",
                  }}
                  disabled={table.locked}
                  title={plannerText.common.delete}
                >
                  <Trash2 size={13} strokeWidth={1.75} />
                </button>
                <button
                  onClick={() => setMenuOpen(false)}
                  style={{
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid #E5E7EB",
                    background: "#F9FAFB",
                    borderRadius: 10,
                    cursor: "pointer",
                    color: "#9CA3AF",
                  }}
                  title={plannerText.common.close}
                >
                  <X size={13} strokeWidth={2} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setMenuOpen(true)}
                style={{
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "none",
                  background: "transparent",
                  borderRadius: 10,
                  cursor: "pointer",
                  color: "#9CA3AF",
                  flexShrink: 0,
                }}
              >
                <MoreHorizontal size={17} strokeWidth={1.75} />
              </button>
            )}
          </div>

          {/* Progress */}
          <div style={{ marginTop: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
              <span style={{ fontSize: 11.5, color: "#6B7280" }}>
                {assigned}/{table.capacity} {plannerText.tables.seated}
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: barColor }}>{pct}%</span>
            </div>
            <ProgressBar pct={pct} color={barColor} height={5} />
          </div>
        </div>
      </div>

      {/* Manage Seats strip */}
      <button
        onClick={onManageSeats}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "11px 16px",
          border: "none",
          borderTop: "1px solid #F3F4F6",
          background: "transparent",
          cursor: "pointer",
          fontFamily: "inherit",
          fontSize: 13,
          fontWeight: 600,
          color: "#064E3B",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Armchair size={14} strokeWidth={1.75} color="#064E3B" />
          {plannerText.tables.manageSeats}
        </div>
        <ChevronRight size={14} strokeWidth={2.5} color="#064E3B" />
      </button>
    </div>
  );
}
