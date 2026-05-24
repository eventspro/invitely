import React, { useState } from "react";
import { Search, Sparkles, Plus } from "lucide-react";
import type { WeddingTable, Guest } from "../types";
import { plannerText } from "../plannerTextConfig";
import TableCard from "./TableCard";
import { EmptyState } from "./GuestsTab";

interface TablesTabProps {
  tables: WeddingTable[];
  guests: Guest[];
  onAddTable: () => void;
  onEditTable: (t: WeddingTable) => void;
  onDeleteTable: (id: string) => void;
  onOpenSeats: (tableId: string) => void;
  onOpenTableGen: () => void;
}

export default function TablesTab({
  tables,
  guests,
  onAddTable,
  onEditTable,
  onDeleteTable,
  onOpenSeats,
  onOpenTableGen,
}: TablesTabProps) {
  const [search, setSearch] = useState("");

  const filtered = tables.filter(
    (t) => !search || t.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalCapacity = tables.reduce((s, t) => s + t.capacity, 0);
  const totalAssigned = guests.filter((g) => g.tableId).length;
  const free = Math.max(0, totalCapacity - totalAssigned);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        style={{
          padding: "14px 16px",
          background: "#FFFFFF",
          borderBottom: "1px solid #E8DDCB",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          <MiniStat value={tables.length} label={plannerText.tables.tables} />
          <MiniStat value={totalCapacity} label={plannerText.dashboard.totalSeats} />
          <MiniStat
            value={totalAssigned}
            label={plannerText.dashboard.seated}
            color={totalAssigned > totalCapacity ? "#D95B5B" : "#1F9D63"}
          />
          <MiniStat value={free} label={plannerText.dashboard.freeSeats} color="#C88420" />
        </div>
      </div>

      <div
        style={{
          padding: "12px 16px 10px",
          background: "#FBF7EF",
          flexShrink: 0,
        }}
      >
        <div style={{ position: "relative", marginBottom: 10 }}>
          <Search
            size={16}
            color="#6F766F"
            style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={plannerText.tables.searchTablesPlaceholder}
            style={{
              width: "100%",
              padding: "0 14px 0 38px",
              height: 44,
              borderRadius: 14,
              border: "1px solid #E8DDCB",
              background: "#FFFFFF",
              fontSize: 14,
              color: "#10241B",
              boxSizing: "border-box",
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onOpenTableGen}
            style={{
              flex: 1,
              padding: "12px 0",
              borderRadius: 14,
              border: "none",
              background: "linear-gradient(135deg, #1A5240 0%, #0F3D2E 100%)",
              color: "#fff",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              boxShadow: "0 3px 12px rgba(15,61,46,0.18)",
            }}
          >
            <Sparkles size={14} />
            {plannerText.tables.generateTables}
          </button>
          <button
            onClick={onAddTable}
            style={{
              flex: 1,
              padding: "12px 0",
              borderRadius: 14,
              border: "1px solid #E8DDCB",
              background: "#FFFFFF",
              color: "#10241B",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Plus size={14} />
            {plannerText.tables.addTable}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px 120px" }}>
        {filtered.length === 0 ? (
          <EmptyState
            title={tables.length === 0 ? plannerText.tables.noTables : plannerText.emptyStates.noTablesInFilter}
            description={tables.length === 0 ? plannerText.tables.noTablesDescription : undefined}
          />
        ) : (
          filtered.map((t) => (
            <TableCard
              key={t.id}
              table={t}
              guests={guests}
              onEdit={onEditTable}
              onDelete={onDeleteTable}
              onOpenSeats={onOpenSeats}
            />
          ))
        )}
      </div>
    </div>
  );
}

function MiniStat({ value, label, color }: { value: number; label: string; color?: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: color || "#10241B",
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 10.5, color: "#6F766F", marginTop: 4, fontWeight: 500 }}>{label}</div>
    </div>
  );
}
