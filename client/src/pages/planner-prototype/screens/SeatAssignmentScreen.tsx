import React, { useState } from "react";
import { ArrowLeft, UserPlus, Trash2 } from "lucide-react";
import { usePlannerText } from "../PlannerLocaleContext";
import { getInitials, RSVP_COLORS, RSVP_BG } from "../plannerUtils";
import VisualTable from "../components/VisualTable";
import BottomSheet from "../components/BottomSheet";
import GuestPickerSheet from "../forms/GuestPickerSheet";
import type { WeddingTable, Seat, Guest } from "../types";

interface SeatAssignmentScreenProps {
  table: WeddingTable;
  seats: Seat[];
  guests: Guest[];
  allSeats: Seat[];
  onAssign: (seatId: string, guestId: string) => void;
  onUnassign: (seatId: string) => void;
  onBack: () => void;
}

export default function SeatAssignmentScreen({ table, seats, guests, allSeats, onAssign, onUnassign, onBack }: SeatAssignmentScreenProps) {
  const pt = usePlannerText();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [targetSeatId, setTargetSeatId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "seating">("overview");

  const tableSeats = seats.filter(s => s.tableId === table.id).sort((a, b) => a.seatNumber - b.seatNumber);

  const seatInfos = tableSeats.map(s => {
    const g = s.guestId ? guests.find(x => x.id === s.guestId) : undefined;
    return {
      seatNumber: s.seatNumber,
      guestId: s.guestId,
      initials: g ? getInitials(g.fullName) : undefined,
      isSelected: targetSeatId === s.id,
    };
  });

  function handleSeatClick(seatNum: number) {
    const seat = tableSeats.find(s => s.seatNumber === seatNum);
    if (!seat) return;
    if (seat.guestId) {
      onUnassign(seat.id);
    } else {
      setTargetSeatId(seat.id);
      setPickerOpen(true);
    }
  }

  function handleGuestPick(guestId: string) {
    if (targetSeatId) {
      onAssign(targetSeatId, guestId);
      setTargetSeatId(null);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#FBFAF7",
        zIndex: 150,
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
      }}
    >
      {/* header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "16px 16px",
          background: "#FFFFFF",
          borderBottom: "1px solid #E5E7EB",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <button
          onClick={onBack}
          style={{ display: "flex", alignItems: "center", border: "none", background: "transparent", cursor: "pointer", color: "#064E3B", padding: 4, borderRadius: 8 }}
        >
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>{table.name}</div>
          <div style={{ fontSize: 11, color: "#9CA3AF" }}>
            {tableSeats.filter(s => s.guestId).length}/{table.capacity} {pt.common.seated}
          </div>
        </div>
      </div>

      {/* tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #E5E7EB", background: "#FFFFFF" }}>
        {(["overview", "seating"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ flex: 1, padding: "12px 0", border: "none", background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: activeTab === tab ? 700 : 500, color: activeTab === tab ? "#064E3B" : "#9CA3AF", borderBottom: activeTab === tab ? "2px solid #064E3B" : "2px solid transparent", marginBottom: -1 }}
          >
            {tab === "overview" ? pt.seats_screen.overviewTab : pt.seats_screen.seatingTab}
          </button>
        ))}
      </div>

      {activeTab === "overview" ? (
        <>
          {/* visual table large */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 16px 12px" }}>
            <VisualTable shape={table.shape} capacity={table.capacity} seats={seatInfos} onSeatClick={handleSeatClick} size={220} />
            <div style={{ fontSize: 13, color: "#6B7280", marginTop: 12, fontWeight: 500 }}>
              {tableSeats.filter(s => s.guestId).length} / {table.capacity} {pt.common.seated}
            </div>
          </div>
          {/* assigned guests list */}
          <div style={{ padding: "0 16px 80px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 12 }}>{pt.seats_screen.assignedGuests}</div>
            {tableSeats.filter(s => s.guestId).length === 0 ? (
              <div style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center", padding: "20px 0" }}>{pt.seats_screen.noGuestsAssigned}</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {tableSeats.filter(s => s.guestId).map((seat, idx) => {
                  const guest = guests.find(g => g.id === seat.guestId)!;
                  return (
                    <div key={seat.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 12, padding: "10px 14px" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", minWidth: 18 }}>{idx + 1}</div>
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#064E3B", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#FFF", flexShrink: 0 }}>{getInitials(guest.fullName)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{guest.fullName}</div>
                        <div style={{ fontSize: 10, color: "#9CA3AF" }}>{pt.seats_screen.seatLabel} {seat.seatNumber}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <button
              onClick={() => setActiveTab("seating")}
              style={{ width: "100%", marginTop: 18, padding: "14px", borderRadius: 14, border: "none", background: "linear-gradient(135deg, #00472F 0%, #006B4A 100%)", color: "#FFFFFF", cursor: "pointer", fontSize: 14, fontWeight: 700, boxShadow: "0 4px 16px rgba(6,78,59,0.3)" }}
            >
              {pt.seats_screen.manageSeatBtn}
            </button>
          </div>
        </>
      ) : (
        <>
          {/* visual table */}
          <div style={{ display: "flex", justifyContent: "center", padding: "28px 16px 16px", alignItems: "center" }}>
            <VisualTable shape={table.shape} capacity={table.capacity} seats={seatInfos} onSeatClick={handleSeatClick} size={220} />
          </div>
          <div style={{ padding: "0 16px 4px" }}>
            <div style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center" }}>{pt.seats.tapToAssign}</div>
          </div>
          {/* seat list */}
          <div style={{ flex: 1, padding: "16px 16px 80px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {tableSeats.map(seat => {
                const guest = seat.guestId ? guests.find(g => g.id === seat.guestId) : undefined;
                return (
                  <div
                    key={seat.id}
                    style={{
                      background: "#FFFFFF",
                      borderRadius: 12,
                      border: "1px solid #E5E7EB",
                      padding: "10px 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    {/* seat number badge */}
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        background: guest ? "#064E3B" : "#F3F4F6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 700,
                        color: guest ? "#FFFFFF" : "#9CA3AF",
                        flexShrink: 0,
                      }}
                    >
                      {seat.seatNumber}
                    </div>

                    {guest ? (
                      <>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {guest.fullName}
                          </div>
                          <div style={{ fontSize: 10, color: RSVP_COLORS[guest.rsvpStatus] ?? "#9CA3AF", marginTop: 1 }}>
                            {pt.rsvp[guest.rsvpStatus as keyof typeof pt.rsvp] ?? guest.rsvpStatus}
                          </div>
                        </div>
                        <button
                          onClick={() => onUnassign(seat.id)}
                          style={{ display: "flex", alignItems: "center", border: "none", background: "#FEF2F2", borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "#E85D5D", fontSize: 11, fontWeight: 600, gap: 4, flexShrink: 0 }}
                        >
                          <Trash2 size={12} /> {pt.seats.remove}
                        </button>
                      </>
                    ) : (
                      <>
                        <div style={{ flex: 1, fontSize: 13, color: "#9CA3AF" }}>{pt.seats.empty}</div>
                        <button
                          onClick={() => { setTargetSeatId(seat.id); setPickerOpen(true); }}
                          style={{ display: "flex", alignItems: "center", border: "none", background: "#EAF5EF", borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "#064E3B", fontSize: 11, fontWeight: 600, gap: 4, flexShrink: 0 }}
                        >
                          <UserPlus size={12} /> {pt.seats.assign}
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <BottomSheet open={pickerOpen} onClose={() => { setPickerOpen(false); setTargetSeatId(null); }} title={pt.seats.pickGuest} height="tall">
        <GuestPickerSheet
          guests={guests}
          seats={allSeats}
          onSelect={handleGuestPick}
          onClose={() => { setPickerOpen(false); setTargetSeatId(null); }}
        />
      </BottomSheet>
    </div>
  );
}
