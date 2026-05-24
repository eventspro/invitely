import React, { useState } from "react";
import { plannerText } from "../plannerTextConfig";
import { uid } from "../plannerUtils";
import type { BudgetItem, BudgetCategory, BudgetStatus } from "../types";

interface BudgetItemFormProps {
  initial?: BudgetItem;
  currency: string;
  onSave: (item: BudgetItem) => void;
  onCancel: () => void;
}

const CATEGORY_OPTIONS: { value: BudgetCategory; label: string }[] = [
  { value: "venue", label: plannerText.budget.categories.venue },
  { value: "catering", label: plannerText.budget.categories.catering },
  { value: "decor", label: plannerText.budget.categories.decor },
  { value: "photo", label: plannerText.budget.categories.photo },
  { value: "music", label: plannerText.budget.categories.music },
  { value: "restaurant", label: plannerText.budget.categories.restaurant },
  { value: "photographer", label: plannerText.budget.categories.photographer },
  { value: "videographer", label: plannerText.budget.categories.videographer },
  { value: "decorations", label: plannerText.budget.categories.decorations },
  { value: "flowers", label: plannerText.budget.categories.flowers },
  { value: "invitations", label: plannerText.budget.categories.invitations },
  { value: "website", label: plannerText.budget.categories.website },
  { value: "host", label: plannerText.budget.categories.host },
  { value: "lighting", label: plannerText.budget.categories.lighting },
  { value: "other", label: plannerText.budget.categories.other },
];

const STATUS_OPTIONS: { value: BudgetStatus; label: string }[] = [
  { value: "planned", label: plannerText.budgetStatus.planned },
  { value: "deposit_paid", label: plannerText.budgetStatus.deposit_paid },
  { value: "partially_paid", label: plannerText.budgetStatus.partially_paid },
  { value: "paid", label: plannerText.budgetStatus.paid },
  { value: "overdue", label: plannerText.budgetStatus.overdue },
  { value: "cancelled", label: plannerText.budgetStatus.cancelled },
];

const STATUS_COLORS: Record<BudgetStatus, string> = {
  planned: "#6B7280",
  deposit_paid: "#D7951E",
  partially_paid: "#2563EB",
  paid: "#16864A",
  overdue: "#E85D5D",
  cancelled: "#9CA3AF",
};

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

const fieldStyle: React.CSSProperties = { marginBottom: 14 };

export default function BudgetItemForm({ initial, currency, onSave, onCancel }: BudgetItemFormProps) {
  const [category, setCategory] = useState<BudgetCategory>(initial?.category ?? "other");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [vendorName, setVendorName] = useState(initial?.vendorName ?? "");
  const [plannedCost, setPlannedCost] = useState(initial?.plannedCost ?? 0);
  const [actualCost, setActualCost] = useState(initial?.actualCost ?? 0);
  const [paidAmount, setPaidAmount] = useState(initial?.paidAmount ?? 0);
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [status, setStatus] = useState<BudgetStatus>(initial?.status ?? "planned");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!title.trim()) {
      setError(plannerText.warnings.titleRequired);
      return;
    }
    const item: BudgetItem = {
      id: initial?.id ?? uid(),
      category,
      title: title.trim(),
      vendorName: vendorName.trim() || undefined,
      plannedCost: Math.max(0, plannedCost),
      actualCost: Math.max(0, actualCost),
      paidAmount: Math.max(0, paidAmount),
      dueDate: dueDate || undefined,
      status,
      notes: notes.trim() || undefined,
    };
    onSave(item);
  }

  const chipBtn = (active: boolean, color?: string): React.CSSProperties => ({
    padding: "5px 11px",
    borderRadius: 99,
    border: active ? `1.5px solid ${color ?? "#064E3B"}` : "1.5px solid #E5E7EB",
    background: active ? `${color ?? "#064E3B"}1A` : "#FAFAFA",
    color: active ? (color ?? "#064E3B") : "#6B7280",
    cursor: "pointer",
    fontSize: 11.5,
    fontWeight: active ? 700 : 500,
    transition: "all 0.15s",
  });

  return (
    <div>
      <div style={fieldStyle}>
        <label style={labelStyle}>{plannerText.budget.category}</label>
        <select
          style={{ ...inputStyle, cursor: "pointer" }}
          value={category}
          onChange={e => setCategory(e.target.value as BudgetCategory)}
        >
          {CATEGORY_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>{plannerText.budget.itemTitle} <span style={{ color: "#E85D5D" }}>*</span></label>
        <input
          style={{ ...inputStyle, borderColor: error ? "#E85D5D" : "#E5E7EB" }}
          value={title}
          onChange={e => { setTitle(e.target.value); setError(""); }}
          placeholder={plannerText.budget.itemTitlePlaceholder}
        />
        {error && <div style={{ fontSize: 11, color: "#E85D5D", marginTop: 4 }}>{error}</div>}
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>{plannerText.budget.vendorName}</label>
        <input style={inputStyle} value={vendorName} onChange={e => setVendorName(e.target.value)} placeholder={plannerText.budget.vendorNamePlaceholder} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {[
          { label: `${plannerText.budget.planned} (${currency})`, value: plannedCost, set: setPlannedCost },
          { label: `${plannerText.budget.actual} (${currency})`, value: actualCost, set: setActualCost },
          { label: `${plannerText.budget.paid} (${currency})`, value: paidAmount, set: setPaidAmount },
        ].map((col, i) => (
          <div key={i} style={fieldStyle}>
            <label style={labelStyle}>{col.label}</label>
            <input type="number" min={0} style={inputStyle} value={col.value} onChange={e => col.set(Number(e.target.value))} />
          </div>
        ))}
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>{plannerText.budget.dueDate}</label>
        <input type="date" style={inputStyle} value={dueDate} onChange={e => setDueDate(e.target.value)} />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>{plannerText.budget.statusLabel}</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {STATUS_OPTIONS.map(o => (
            <button key={o.value} style={chipBtn(status === o.value, STATUS_COLORS[o.value])} onClick={() => setStatus(o.value)}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>{plannerText.common.notes}</label>
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
          onClick={handleSubmit}
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
          {plannerText.common.save}
        </button>
      </div>
    </div>
  );
}
