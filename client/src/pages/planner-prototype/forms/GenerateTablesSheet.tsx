import React, { useMemo, useState } from "react";
import { Check, Users, LayoutGrid } from "lucide-react";
import { plannerText } from "../plannerTextConfig";
import { generateSuggestions, type TableSuggestion } from "../plannerUtils";
import type { PlannerData } from "../types";

interface GenerateTablesSheetProps {
  data: PlannerData;
  onApply: (suggestion: TableSuggestion) => void;
  onClose: () => void;
}

const PLAN_GRADIENT: Record<number, string> = {
  0: "linear-gradient(135deg, #064E3B 0%, #065F46 100%)",
  1: "linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)",
  2: "linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)",
};

export default function GenerateTablesSheet({ data, onApply, onClose }: GenerateTablesSheetProps) {
  const comingPersons = data.guests
    .filter(g => g.rsvpStatus === "coming")
    .reduce((sum, g) => sum + g.guestCount, 0);

  const [preferredShape, setPreferredShape] = useState<"circle" | "rectangle">("circle");
  const [selected, setSelected] = useState(0);

  const suggestions = useMemo(
    () => generateSuggestions(comingPersons, data.settings.defaultSeatsPerTable, preferredShape),
    [comingPersons, data.settings.defaultSeatsPerTable, preferredShape]
  );

  function handleApply() {
    onApply(suggestions[selected]);
    onClose();
  }

  const chipBtn = (active: boolean): React.CSSProperties => ({
    padding: "6px 14px",
    borderRadius: 99,
    border: active ? "1.5px solid #064E3B" : "1.5px solid #E5E7EB",
    background: active ? "#EAF5EF" : "#FAFAFA",
    color: active ? "#064E3B" : "#6B7280",
    cursor: "pointer",
    fontSize: 12.5,
    fontWeight: active ? 700 : 500,
  });

  return (
    <div>
      <div
        style={{
          background: "#EAF5EF",
          borderRadius: 12,
          padding: "10px 14px",
          marginBottom: 18,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Users size={16} color="#064E3B" />
        <span style={{ fontSize: 13, color: "#064E3B", fontWeight: 600 }}>
          {comingPersons} {plannerText.generator.guests}
        </span>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
          {plannerText.generator.preferredShape}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={chipBtn(preferredShape === "circle")} onClick={() => setPreferredShape("circle")}>
            {plannerText.tableShapes.circle}
          </button>
          <button style={chipBtn(preferredShape === "rectangle")} onClick={() => setPreferredShape("rectangle")}>
            {plannerText.tableShapes.rectangle}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => setSelected(i)}
            style={{
              background: selected === i ? PLAN_GRADIENT[i] : "#FAFAFA",
              border: selected === i ? "none" : "1.5px solid #E5E7EB",
              borderRadius: 14,
              padding: "14px 16px",
              cursor: "pointer",
              textAlign: "left",
              position: "relative",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: selected === i ? "#FFFFFF" : "#111827" }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 12, color: selected === i ? "rgba(255,255,255,0.7)" : "#6B7280", marginTop: 2 }}>
                  {s.tableCount} {plannerText.generator.tables} · {s.seatsPerTable} {plannerText.generator.seatsEach}
                </div>
              </div>
              {selected === i && (
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Check size={16} color="#FFFFFF" />
                </div>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
              <LayoutGrid size={12} color={selected === i ? "rgba(255,255,255,0.7)" : "#9CA3AF"} />
              <span style={{ fontSize: 11, color: selected === i ? "rgba(255,255,255,0.7)" : "#9CA3AF" }}>
                {s.tableCount * s.seatsPerTable} {plannerText.generator.totalSeats}
              </span>
            </div>
          </button>
        ))}
      </div>

      <div
        style={{
          background: "#FEF3C7",
          borderRadius: 10,
          padding: "10px 12px",
          marginBottom: 16,
          fontSize: 12,
          color: "#92400E",
        }}
      >
        {plannerText.generator.warning}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={onClose}
          style={{
            flex: 1,
            padding: "13px",
            borderRadius: 12,
            border: "1.5px solid #E5E7EB",
            background: "#FAFAFA",
            color: "#374151",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {plannerText.common.cancel}
        </button>
        <button
          onClick={handleApply}
          style={{
            flex: 2,
            padding: "13px",
            borderRadius: 12,
            border: "none",
            background: "linear-gradient(135deg, #00472F 0%, #006B4A 100%)",
            color: "#FFFFFF",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {plannerText.generator.apply}
        </button>
      </div>
    </div>
  );
}
