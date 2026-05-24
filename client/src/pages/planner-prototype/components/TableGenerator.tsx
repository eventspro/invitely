import React, { useState } from "react";
import { Sparkles, X, AlertTriangle, Check } from "lucide-react";
import type { PlannerState, TableShape } from "../types";
import { SHAPE_LABELS } from "../constants";
import { generateTableSuggestions, applyTableSuggestion, type TableSuggestion } from "../plannerUtils";
import { plannerText } from "../plannerTextConfig";
import VisualTable from "./VisualTable";

interface TableGeneratorProps {
  open: boolean;
  state: PlannerState;
  onApply: (updated: PlannerState) => void;
  onClose: () => void;
}

export default function TableGenerator({ open, state, onApply, onClose }: TableGeneratorProps) {
  const [seatsPerTable, setSeatsPerTable] = useState(state.settings.defaultSeatsPerTable);
  const [shape, setShape] = useState<TableShape>(state.settings.preferredTableShape);
  const [selected, setSelected] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  if (!open) return null;

  const comingPersons = state.guests
    .filter((g) => g.rsvpStatus === "coming")
    .reduce((s, g) => s + g.guestCount, 0);

  const suggestions = generateTableSuggestions(comingPersons, seatsPerTable, shape);

  const handleApply = () => {
    const sugg = suggestions.find((s) => s.id === selected);
    if (!sugg) return;
    const updated = applyTableSuggestion(state, sugg);
    onApply(updated);
    setApplied(true);
    setTimeout(onClose, 600);
  };

  const SHAPES: TableShape[] = ["circle", "rectangle", "long"];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 250 }}>
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(14,26,20,0.55)",
          backdropFilter: "blur(2px)",
        }}
      />

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#FFFFFF",
          borderRadius: "24px 24px 0 0",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.2)",
        }}
      >
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, paddingBottom: 4, flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "#E8DDCB" }} />
        </div>

        {/* Header */}
        <div
          style={{
            padding: "8px 20px 14px",
            borderBottom: "1px solid #E8DDCB",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                background: "#E8F3ED",
                color: "#123C2F",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#10241B", letterSpacing: "-0.01em" }}>
                {plannerText.tableGenerator.title}
              </div>
              <div style={{ fontSize: 11.5, color: "#6F766F", marginTop: 2 }}>
                {comingPersons} {plannerText.common.persons} · {plannerText.tableGenerator.subtitle}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              border: "1px solid #E8DDCB",
              background: "#FFFFFF",
              color: "#10241B",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label={plannerText.common.close}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scroll */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 32px" }}>
          {/* Shape */}
          <div style={{ marginBottom: 18 }}>
            <div style={sectionLabelStyle}>{plannerText.tableGenerator.shapeLabel}</div>
            <div style={{ display: "flex", gap: 8 }}>
              {SHAPES.map((s) => {
                const active = shape === s;
                return (
                  <button
                    key={s}
                    onClick={() => setShape(s)}
                    style={{
                      flex: 1,
                      padding: "10px 4px",
                      borderRadius: 12,
                      border: `1.5px solid ${active ? "#123C2F" : "#E8DDCB"}`,
                      background: active ? "#123C2F" : "#FFFFFF",
                      color: active ? "#fff" : "#10241B",
                      fontWeight: active ? 600 : 500,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    {SHAPE_LABELS[s]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seats per table */}
          <div style={{ marginBottom: 18 }}>
            <div style={sectionLabelStyle}>
              {plannerText.tableGenerator.seatsPerTableLabel} ({seatsPerTable})
            </div>
            <input
              type="range"
              min={4}
              max={20}
              value={seatsPerTable}
              onChange={(e) => setSeatsPerTable(parseInt(e.target.value))}
              style={{ width: "100%", accentColor: "#123C2F" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6F766F" }}>
              <span>4</span>
              <span style={{ fontWeight: 700, color: "#123C2F" }}>
                {seatsPerTable} {plannerText.common.seats}
              </span>
              <span>20</span>
            </div>
          </div>

          {comingPersons === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 16px", color: "#6F766F", fontSize: 13 }}>
              {plannerText.tableGenerator.noConfirmedGuests}
            </div>
          ) : (
            <>
              <div style={sectionLabelStyle}>{plannerText.tableGenerator.suggestionsHeader}</div>

              {suggestions.map((sugg: TableSuggestion) => {
                const active = selected === sugg.id;
                const enough = sugg.totalCapacity >= comingPersons;
                return (
                  <button
                    key={sugg.id}
                    onClick={() => setSelected(active ? null : sugg.id)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "14px 16px",
                      marginBottom: 10,
                      borderRadius: 16,
                      border: `1.5px solid ${active ? "#123C2F" : "#E8DDCB"}`,
                      background: active ? "#E8F3ED" : "#FFFFFF",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                    }}
                  >
                    <div style={{ flexShrink: 0 }}>
                      <VisualTable shape={sugg.shape} capacity={sugg.seatsPerTable} size={60} compact />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#10241B" }}>
                        {sugg.tableCount} {plannerText.common.tables}
                      </div>
                      <div style={{ fontSize: 11.5, color: "#6F766F", marginTop: 2 }}>
                        {SHAPE_LABELS[sugg.shape]} · {sugg.seatsPerTable} {plannerText.common.seats}
                      </div>
                      <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                        <span style={chipStyle("#E8F3ED", "#123C2F")}>
                          {sugg.totalCapacity} {plannerText.common.seats}
                        </span>
                        {enough && (
                          <span style={chipStyle("#DCFCE7", "#1F9D63")}>
                            {plannerText.tableGenerator.enough}
                          </span>
                        )}
                      </div>
                    </div>
                    {active && (
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
                        <Check size={14} />
                      </div>
                    )}
                  </button>
                );
              })}

              {/* Warning */}
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: "#FFF9EC",
                  border: "1px solid #fde68a",
                  marginBottom: 14,
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                }}
              >
                <AlertTriangle size={16} color="#C88420" style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 12, color: "#7c5a13", lineHeight: 1.5 }}>
                  {plannerText.tableGenerator.warningText}
                </div>
              </div>

              <button
                disabled={!selected || applied}
                onClick={handleApply}
                style={{
                  width: "100%",
                  padding: "14px 0",
                  borderRadius: 14,
                  border: "none",
                  background: !selected
                    ? "#E8DDCB"
                    : applied
                    ? "#1F9D63"
                    : "linear-gradient(135deg, #1A5240 0%, #0F3D2E 100%)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: !selected ? "not-allowed" : "pointer",
                  transition: "background 0.3s",
                }}
              >
                {applied ? plannerText.tableGenerator.applied : plannerText.common.apply}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "#10241B",
  marginBottom: 10,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

function chipStyle(bg: string, color: string): React.CSSProperties {
  return {
    fontSize: 10.5,
    padding: "3px 8px",
    borderRadius: 20,
    background: bg,
    color,
    fontWeight: 600,
  };
}
