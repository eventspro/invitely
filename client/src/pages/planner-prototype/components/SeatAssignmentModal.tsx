import React, { useState, useMemo, useEffect } from "react";
import { ChevronLeft, X, Search, Plus, UserMinus } from "lucide-react";
import VisualTable from "./VisualTable";
import { plannerText } from "../plannerTextConfig";
import type { Guest, Seat, WeddingTable } from "../types";

interface SeatAssignmentModalProps {
  open: boolean;
  table: WeddingTable | undefined;
  seats: Seat[];
  guests: Guest[];
  onAssignSeat: (seatId: string, guestId: string | undefined) => void;
  onClose: () => void;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}

export default function SeatAssignmentModal({
  open,
  table,
  seats,
  guests,
  onAssignSeat,
  onClose,
}: SeatAssignmentModalProps) {
  const [selectedSeatNumber, setSelectedSeatNumber] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (open) {
      setSelectedSeatNumber(null);
      setSearch("");
    }
  }, [open, table?.id]);

  const tableSeats = useMemo(
    () => (table ? seats.filter((s) => s.tableId === table.id).sort((a, b) => a.seatNumber - b.seatNumber) : []),
    [seats, table],
  );

  const guestById = useMemo(() => {
    const m = new Map<string, Guest>();
    guests.forEach((g) => m.set(g.id, g));
    return m;
  }, [guests]);

  const seatInfos = useMemo(
    () =>
      tableSeats.map((s) => ({
        seatNumber: s.seatNumber,
        guestId: s.guestId,
        guestInitials: s.guestId ? initials(guestById.get(s.guestId)?.fullName ?? "") : undefined,
        isSelected: selectedSeatNumber === s.seatNumber,
      })),
    [tableSeats, guestById, selectedSeatNumber],
  );

  const selectedSeat = tableSeats.find((s) => s.seatNumber === selectedSeatNumber);
  const selectedGuest = selectedSeat?.guestId ? guestById.get(selectedSeat.guestId) : undefined;

  // Coming guests that are not seated at any seat (or are at the currently selected seat)
  const assignedGuestIds = new Set(seats.map((s) => s.guestId).filter((id): id is string => !!id));
  const availableGuests = guests.filter(
    (g) =>
      g.rsvpStatus === "coming" &&
      (!assignedGuestIds.has(g.id) || g.id === selectedGuest?.id) &&
      (search.trim() === "" || g.fullName.toLowerCase().includes(search.toLowerCase())),
  );

  if (!open || !table) return null;

  const handleAssign = (guestId: string) => {
    if (!selectedSeat) return;
    onAssignSeat(selectedSeat.id, guestId);
    setSelectedSeatNumber(null);
  };

  const handleUnassign = () => {
    if (!selectedSeat) return;
    onAssignSeat(selectedSeat.id, undefined);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#FBF7EF",
        zIndex: 300,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px",
          borderBottom: "1px solid #E8DDCB",
          background: "#FFFFFF",
          paddingTop: "calc(14px + env(safe-area-inset-top, 0px))",
        }}
      >
        <button
          onClick={onClose}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            border: "none",
            background: "transparent",
            color: "#10241B",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            padding: 4,
          }}
        >
          <ChevronLeft size={20} />
        </button>
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#10241B" }}>{table.name}</div>
          <div style={{ fontSize: 11, color: "#6F766F", marginTop: 2 }}>
            {table.capacity} {plannerText.common.seats}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            border: "none",
            background: "transparent",
            color: "#6F766F",
            cursor: "pointer",
            padding: 4,
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Visual table */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "24px 16px 12px",
        }}
      >
        <VisualTable
          shape={table.shape}
          capacity={table.capacity}
          tableName={table.name}
          tableColor={table.color}
          seats={seatInfos}
          size={220}
          onSeatClick={(n) => setSelectedSeatNumber((cur) => (cur === n ? null : n))}
        />
      </div>

      {/* Selected seat info */}
      {selectedSeat && (
        <div
          style={{
            margin: "0 16px 12px",
            padding: "12px 14px",
            borderRadius: 14,
            background: "#E8F3ED",
            border: "1px solid #C9DDD0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, color: "#6F766F", fontWeight: 600 }}>
              {plannerText.seats.seat} #{selectedSeat.seatNumber}
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#10241B",
                marginTop: 2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {selectedGuest ? selectedGuest.fullName : plannerText.seats.empty}
            </div>
          </div>
          {selectedGuest && (
            <button
              onClick={handleUnassign}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "6px 10px",
                borderRadius: 999,
                border: "1px solid #D95B5B",
                background: "#FFFFFF",
                color: "#D95B5B",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <UserMinus size={12} />
              {plannerText.seats.unassign}
            </button>
          )}
        </div>
      )}

      {/* Guest picker */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#6F766F", marginBottom: 8, letterSpacing: "0.02em" }}>
          {plannerText.seats.availableGuests}
        </div>
        <div style={{ position: "relative", marginBottom: 10 }}>
          <Search
            size={14}
            color="#6F766F"
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={plannerText.guests.searchGuestPlaceholder}
            style={{
              width: "100%",
              padding: "10px 12px 10px 34px",
              borderRadius: 12,
              border: "1px solid #E8DDCB",
              background: "#FFFFFF",
              fontSize: 13,
              color: "#10241B",
              outline: "none",
            }}
          />
        </div>
        {availableGuests.length === 0 ? (
          <div
            style={{
              padding: 24,
              textAlign: "center",
              color: "#6F766F",
              fontSize: 13,
              background: "#FFFFFF",
              borderRadius: 14,
              border: "1px dashed #E8DDCB",
            }}
          >
            {plannerText.seats.noAvailableGuests}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {availableGuests.map((g) => (
              <button
                key={g.id}
                disabled={!selectedSeat}
                onClick={() => handleAssign(g.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid #E8DDCB",
                  background: "#FFFFFF",
                  cursor: selectedSeat ? "pointer" : "not-allowed",
                  opacity: selectedSeat ? 1 : 0.5,
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg,#E8F3ED,#C9DDD0)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#123C2F",
                    flexShrink: 0,
                  }}
                >
                  {initials(g.fullName)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: "#10241B",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {g.fullName}
                    {g.guestCount > 1 ? ` +${g.guestCount - 1}` : ""}
                  </div>
                </div>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: "#123C2F",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Plus size={14} strokeWidth={2.5} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
