import React, { useState } from "react";
import { usePlannerText } from "../PlannerLocaleContext";
import { uid } from "../plannerUtils";
import type { WeddingTable, TableShape } from "../types";

interface TableFormProps {
  initial?: WeddingTable;
  onSave: (t: WeddingTable) => void;
  onCancel: () => void;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #E5E7EB",
  borderRadius: 10,
  fontSize: 14,
  color: "#111827",
  background: "#FAFAFA",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#374151",
  marginBottom: 5,
};

const fieldStyle: React.CSSProperties = { marginBottom: 16 };

export default function TableForm({ initial, onSave, onCancel }: TableFormProps) {
  const pt = usePlannerText();
  const [name, setName] = useState(initial?.name ?? "");
  const [shape, setShape] = useState<TableShape>(initial?.shape ?? "circle");
  const [capacity, setCapacity] = useState(initial?.capacity ?? 10);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState("");

  const SHAPE_OPTIONS: { value: TableShape; label: string }[] = [
    { value: "circle",    label: pt.tableShapes.circle    },
    { value: "oval",      label: pt.tableShapes.oval      },
    { value: "square",    label: pt.tableShapes.square    },
    { value: "rectangle", label: pt.tableShapes.rectangle },
    { value: "long",      label: pt.tableShapes.long      },
    { value: "head",      label: pt.tableShapes.head      },
  ];

  function handleSubmit() {
    if (!name.trim()) {
      setError(pt.warnings.nameRequired);
      return;
    }
    const table: WeddingTable = {
      id: initial?.id ?? uid(),
      name: name.trim(),
      shape,
      capacity: Math.max(1, Math.min(40, capacity)),
      locked: initial?.locked ?? false,
      notes: notes.trim() || undefined,
    };
    onSave(table);
  }

  const chipBtn = (active: boolean): React.CSSProperties => ({
    padding: "6px 12px",
    borderRadius: 99,
    border: active ? "1.5px solid #064E3B" : "1.5px solid #E5E7EB",
    background: active ? "#EAF5EF" : "#FAFAFA",
    color: active ? "#064E3B" : "#6B7280",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: active ? 700 : 500,
    transition: "all 0.15s",
  });

  return (
    <div>
      <div style={fieldStyle}>
        <label style={labelStyle}>{pt.tables.tableName} <span style={{ color: "#E85D5D" }}>*</span></label>
        <input
          style={{ ...inputStyle, borderColor: error ? "#E85D5D" : "#E5E7EB" }}
          value={name}
          onChange={e => { setName(e.target.value); setError(""); }}
          placeholder={pt.tables.tableNamePlaceholder}
        />
        {error && <div style={{ fontSize: 11, color: "#E85D5D", marginTop: 4 }}>{error}</div>}
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>{pt.tables.shape}</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {SHAPE_OPTIONS.map(o => (
            <button key={o.value} style={chipBtn(shape === o.value)} onClick={() => setShape(o.value)}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>{pt.tables.capacity}</label>
        <input
          type="number"
          min={1}
          max={40}
          style={inputStyle}
          value={capacity}
          onChange={e => setCapacity(Number(e.target.value))}
        />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>{pt.common.notes}</label>
        <textarea
          style={{ ...inputStyle, resize: "vertical", minHeight: 60 }}
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1, padding: "13px", borderRadius: 12,
            border: "1.5px solid #E5E7EB", background: "#FAFAFA",
            color: "#374151", fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}
        >
          {pt.common.cancel}
        </button>
        <button
          onClick={handleSubmit}
          style={{
            flex: 2, padding: "13px", borderRadius: 12, border: "none",
            background: "linear-gradient(135deg, #00472F 0%, #006B4A 100%)",
            color: "#FFFFFF", fontSize: 14, fontWeight: 700, cursor: "pointer",
          }}
        >
          {pt.common.save}
        </button>
      </div>
    </div>
  );
}
