import React, { useState, useEffect } from "react";
import type { WeddingTable, TableShape } from "../types";
import { TABLE_SHAPES, SHAPE_LABELS } from "../constants";
import { uid } from "../plannerUtils";
import { plannerText } from "../plannerTextConfig";
import { PrimaryBtn, SecondaryBtn } from "./GuestForm";

interface TableFormProps {
  initial?: WeddingTable;
  onSave: (t: WeddingTable) => void;
  onCancel: () => void;
}

function emptyTable(): WeddingTable {
  return {
    id: uid(),
    name: "",
    shape: "circle",
    capacity: 8,
    x: 0,
    y: 0,
    rotation: 0,
    notes: "",
    color: undefined,
    locked: false,
  };
}

const COLOR_SWATCHES = ["", "#C9A85A", "#123C2F", "#D95B5B", "#2563eb", "#7c3aed", "#C88420"];

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0 14px",
  height: 48,
  borderRadius: 14,
  border: "1px solid #E8DDCB",
  background: "#FFFFFF",
  fontSize: 14.5,
  color: "#10241B",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#10241B",
  marginBottom: 6,
};

export default function TableForm({ initial, onSave, onCancel }: TableFormProps) {
  const [form, setForm] = useState<WeddingTable>(() => (initial ? { ...initial } : emptyTable()));
  const [errors, setErrors] = useState<Partial<Record<keyof WeddingTable, string>>>({});

  useEffect(() => {
    setForm(initial ? { ...initial } : emptyTable());
    setErrors({});
  }, [initial]);

  const set = <K extends keyof WeddingTable>(key: K, val: WeddingTable[K]) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): boolean => {
    const errs: Partial<Record<keyof WeddingTable, string>> = {};
    if (!form.name.trim()) errs.name = plannerText.tables.validation.nameRequired;
    if (form.capacity < 2 || form.capacity > 30) errs.capacity = plannerText.tables.validation.capacityRange;
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return false;
    }
    return true;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <label style={labelStyle}>{plannerText.tables.tableName} *</label>
        <input
          style={{ ...inputStyle, borderColor: errors.name ? "#D95B5B" : "#E8DDCB" }}
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder={plannerText.tables.tableNamePlaceholder}
          autoFocus
        />
        {errors.name && <div style={{ color: "#D95B5B", fontSize: 11, marginTop: 4 }}>{errors.name}</div>}
      </div>

      <div>
        <label style={labelStyle}>{plannerText.tables.tableShape}</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {TABLE_SHAPES.map((s: TableShape) => {
            const active = form.shape === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => set("shape", s)}
                style={{
                  padding: "8px 13px",
                  borderRadius: 22,
                  border: `1px solid ${active ? "#123C2F" : "#E8DDCB"}`,
                  background: active ? "#123C2F" : "#FFFFFF",
                  color: active ? "#fff" : "#10241B",
                  fontWeight: active ? 600 : 500,
                  fontSize: 13,
                  cursor: "pointer",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                {SHAPE_LABELS[s]}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label style={labelStyle}>
          {plannerText.tables.seatCount} ({form.capacity})
        </label>
        <input
          type="range"
          min={2}
          max={20}
          value={form.capacity}
          onChange={(e) => set("capacity", parseInt(e.target.value))}
          style={{ width: "100%", accentColor: "#123C2F" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6F766F" }}>
          <span>2</span>
          <span style={{ fontWeight: 700, color: "#123C2F" }}>
            {form.capacity} {plannerText.common.seats}
          </span>
          <span>20</span>
        </div>
        {errors.capacity && (
          <div style={{ color: "#D95B5B", fontSize: 11, marginTop: 4 }}>{errors.capacity}</div>
        )}
      </div>

      <div>
        <label style={labelStyle}>{plannerText.tables.colorOptional}</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {COLOR_SWATCHES.map((c, i) => {
            const active = (form.color || "") === c;
            return (
              <button
                key={i}
                type="button"
                onClick={() => set("color", c || undefined)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  border: active ? "2px solid #10241B" : "1px solid #E8DDCB",
                  background: c || "#FFFFFF",
                  cursor: "pointer",
                  position: "relative",
                  WebkitTapHighlightColor: "transparent",
                }}
                aria-label={c || plannerText.common.clear}
              >
                {!c && (
                  <span
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 16,
                      color: "#D95B5B",
                    }}
                  >
                    ×
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label style={labelStyle}>{plannerText.guests.notes}</label>
        <textarea
          style={{ ...inputStyle, minHeight: 60, height: "auto", padding: "12px 14px", resize: "vertical" }}
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder={plannerText.tables.notesPlaceholder}
        />
      </div>

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 14px",
          borderRadius: 12,
          background: "#FBF7EF",
          border: "1px solid #E8DDCB",
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={!!form.locked}
          onChange={(e) => set("locked", e.target.checked)}
          style={{ width: 18, height: 18, accentColor: "#123C2F" }}
        />
        <span style={{ fontSize: 13, color: "#10241B" }}>{plannerText.tables.lockToggleLabel}</span>
      </label>

      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <SecondaryBtn onClick={onCancel}>{plannerText.common.cancel}</SecondaryBtn>
        <PrimaryBtn onClick={() => validate() && onSave(form)}>{plannerText.common.save}</PrimaryBtn>
      </div>
    </div>
  );
}
