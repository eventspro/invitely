import React from "react";
import { Plus, Wand2 } from "lucide-react";
import { usePlannerText } from "../PlannerLocaleContext";
import TableCard from "../components/TableCard";
import EmptyState from "../components/EmptyState";
import { getSeatingTotals } from "../plannerUtils";
import type { WeddingTable, Seat, Guest } from "../types";

interface TablesScreenProps {
  tables: WeddingTable[];
  seats: Seat[];
  guests: Guest[];
  onAdd: () => void;
  onEdit: (table: WeddingTable) => void;
  onDelete: (id: string) => void;
  onManageSeats: (tableId: string) => void;
  onGenerate: () => void;
}

export default function TablesScreen({ tables, seats, guests, onAdd, onEdit, onDelete, onManageSeats, onGenerate }: TablesScreenProps) {
  const pt = usePlannerText();
  const s = getSeatingTotals(tables, seats);

  const stats = [
    { label: pt.tables.totalTables, val: tables.length },
    { label: pt.tables.totalSeats, val: s.totalCapacity },
    { label: pt.tables.seated, val: s.assigned },
    { label: pt.tables.available, val: s.free },
  ];

  const tableCards = tables.map(t => (
    <TableCard
      key={t.id}
      table={t}
      seats={seats}
      guests={guests}
      onEdit={() => onEdit(t)}
      onDelete={() => onDelete(t.id)}
      onManageSeats={() => onManageSeats(t.id)}
    />
  ));

  const generateBtn = (
    <button
      onClick={onGenerate}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 9,
        padding: "15px 20px",
        borderRadius: 16,
        border: "none",
        background: "linear-gradient(135deg, #00472F 0%, #006B4A 100%)",
        color: "#FFFFFF",
        fontSize: 14.5,
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: "inherit",
        letterSpacing: "-0.01em",
        boxShadow: "0 4px 16px rgba(6,78,59,0.28)",
      }}
    >
      <Wand2 size={16} strokeWidth={2} />
      {pt.tables.generatePlan}
    </button>
  );

  const emptyState = (
    <EmptyState
      icon={<Wand2 size={36} />}
      title={pt.tables.emptyTitle}
      description={pt.tables.emptyDesc}
      action={
        <button
          onClick={onGenerate}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "11px 20px",
            borderRadius: 12,
            border: "none",
            background: "linear-gradient(135deg, #00472F 0%, #006B4A 100%)",
            color: "#FFFFFF",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <Wand2 size={14} strokeWidth={2} />
          {pt.tables.generatePlan}
        </button>
      }
    />
  );

  return (
    <>
      {/* ─── MOBILE ─── */}
      <div className="pp-mobile-view">
        <div className="pp-screen-bottom" style={{ paddingTop: 0 }}>
          {/* Stats strip */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            background: "#FFFFFF",
            borderBottom: "1px solid #F0F0EF",
            marginBottom: 12,
          }}>
            {stats.map((item, i) => (
              <div
                key={i}
                style={{
                  textAlign: "center",
                  padding: "13px 4px",
                  borderRight: i < 3 ? "1px solid #F3F4F6" : "none",
                }}
              >
                <div style={{ fontSize: 21, fontWeight: 800, color: "#111827", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                  {item.val}
                </div>
                <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 3, fontWeight: 500 }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>

          {tables.length === 0 ? (
            emptyState
          ) : (
            <>
              {/* Table card list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 14px" }}>
                {tableCards}
              </div>

              {/* Generate Seating Plan CTA */}
              <div style={{ padding: "20px 14px 0" }}>
                {generateBtn}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── DESKTOP ─── */}
      <div className="pp-desktop-view">
        <div className="pp-page-pad">
          {/* Header row */}
          <div style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 24,
          }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0, letterSpacing: "-0.02em" }}>
                {pt.tables.title}
              </h1>
              <p style={{ fontSize: 13.5, color: "#6B7280", margin: "4px 0 0", fontWeight: 400 }}>
                {pt.tables.subtitle}
              </p>
            </div>
            <button
              onClick={onAdd}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "10px 18px",
                borderRadius: 12,
                border: "none",
                background: "linear-gradient(135deg, #00472F 0%, #006B4A 100%)",
                color: "#FFFFFF",
                fontSize: 13.5,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                boxShadow: "0 2px 10px rgba(6,78,59,0.22)",
              }}
            >
              <Plus size={15} strokeWidth={2.5} />
              {pt.tables.addTable}
            </button>
          </div>

          {/* Stats row */}
          <div className="pp-stat-grid" style={{ marginBottom: 24 }}>
            {stats.map((item, i) => (
              <div
                key={i}
                style={{
                  background: "#FFFFFF",
                  borderRadius: 16,
                  border: "1px solid #E5E7EB",
                  padding: "18px 20px",
                  boxShadow: "0 2px 8px rgba(17,24,39,0.04)",
                }}
              >
                <div style={{ fontSize: 28, fontWeight: 800, color: "#111827", letterSpacing: "-0.03em", lineHeight: 1 }}>
                  {item.val}
                </div>
                <div style={{ fontSize: 12, color: "#6B7280", marginTop: 6, fontWeight: 500 }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>

          {tables.length === 0 ? (
            emptyState
          ) : (
            <>
              {/* Table grid */}
              <div className="pp-tables-list" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
                {tableCards}
              </div>

              {/* Generate Seating Plan CTA */}
              <div style={{ marginTop: 28, maxWidth: 360 }}>
                {generateBtn}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
