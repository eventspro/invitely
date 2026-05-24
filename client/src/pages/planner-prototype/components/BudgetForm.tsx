import React, { useState, useEffect } from "react";
import type { BudgetItem, BudgetStatus } from "../types";
import { BUDGET_CATEGORIES, BUDGET_STATUS_LABELS } from "../constants";
import { uid, formatCurrency } from "../plannerUtils";
import { plannerText } from "../plannerTextConfig";
import { PrimaryBtn, SecondaryBtn } from "./GuestForm";

interface BudgetFormProps {
  initial?: BudgetItem;
  onSave: (item: BudgetItem) => void;
  onCancel: () => void;
}

const STATUSES: BudgetStatus[] = [
  "planned",
  "deposit_paid",
  "partially_paid",
  "paid",
  "overdue",
  "cancelled",
];

function emptyItem(): BudgetItem {
  return {
    id: uid(),
    category: plannerText.budget.defaultCategory,
    title: "",
    vendorName: "",
    estimatedCost: 0,
    actualCost: 0,
    paidAmount: 0,
    dueDate: "",
    status: "planned",
    notes: "",
  };
}

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

export default function BudgetForm({ initial, onSave, onCancel }: BudgetFormProps) {
  const [form, setForm] = useState<BudgetItem>(() => (initial ? { ...initial } : emptyItem()));
  const [errors, setErrors] = useState<Partial<Record<keyof BudgetItem, string>>>({});

  useEffect(() => {
    setForm(initial ? { ...initial } : emptyItem());
    setErrors({});
  }, [initial]);

  const set = <K extends keyof BudgetItem>(key: K, val: BudgetItem[K]) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): boolean => {
    const errs: Partial<Record<keyof BudgetItem, string>> = {};
    if (!form.title.trim()) errs.title = plannerText.budget.validation.nameRequired;
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return false;
    }
    return true;
  };

  const remaining = Math.max(0, (form.actualCost || form.estimatedCost) - form.paidAmount);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <label style={labelStyle}>{plannerText.budget.category}</label>
        <select
          style={{ ...inputStyle, appearance: "none" }}
          value={form.category}
          onChange={(e) => set("category", e.target.value)}
        >
          {BUDGET_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label style={labelStyle}>{plannerText.budget.itemName} *</label>
        <input
          style={{ ...inputStyle, borderColor: errors.title ? "#D95B5B" : "#E8DDCB" }}
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder={plannerText.budget.itemNamePlaceholder}
          autoFocus
        />
        {errors.title && <div style={{ color: "#D95B5B", fontSize: 11, marginTop: 4 }}>{errors.title}</div>}
      </div>

      <div>
        <label style={labelStyle}>{plannerText.budget.vendorName}</label>
        <input
          style={inputStyle}
          value={form.vendorName}
          onChange={(e) => set("vendorName", e.target.value)}
          placeholder={plannerText.budget.vendorPlaceholder}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <label style={labelStyle}>{plannerText.budget.plannedCost} (֏)</label>
          <input
            style={inputStyle}
            value={form.estimatedCost || ""}
            onChange={(e) => set("estimatedCost", parseInt(e.target.value) || 0)}
            type="number"
            min={0}
            placeholder="0"
          />
        </div>
        <div>
          <label style={labelStyle}>{plannerText.budget.actualCost} (֏)</label>
          <input
            style={inputStyle}
            value={form.actualCost || ""}
            onChange={(e) => set("actualCost", parseInt(e.target.value) || 0)}
            type="number"
            min={0}
            placeholder="0"
          />
        </div>
      </div>

      <div>
        <label style={labelStyle}>{plannerText.budget.paidAmount} (֏)</label>
        <input
          style={inputStyle}
          value={form.paidAmount || ""}
          onChange={(e) => set("paidAmount", parseInt(e.target.value) || 0)}
          type="number"
          min={0}
          placeholder="0"
        />
        <div style={{ fontSize: 11, color: "#6F766F", marginTop: 6 }}>
          {plannerText.common.remaining}:{" "}
          <span style={{ color: "#C88420", fontWeight: 700 }}>{formatCurrency(remaining)}</span>
        </div>
      </div>

      <div>
        <label style={labelStyle}>{plannerText.budget.dueDate}</label>
        <input
          style={inputStyle}
          value={form.dueDate}
          onChange={(e) => set("dueDate", e.target.value)}
          type="date"
        />
      </div>

      <div>
        <label style={labelStyle}>{plannerText.budget.status}</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {STATUSES.map((s) => {
            const active = form.status === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => set("status", s)}
                style={{
                  padding: "7px 12px",
                  borderRadius: 22,
                  border: `1px solid ${active ? "#123C2F" : "#E8DDCB"}`,
                  background: active ? "#123C2F" : "#FFFFFF",
                  color: active ? "#fff" : "#10241B",
                  fontWeight: active ? 600 : 500,
                  fontSize: 12,
                  cursor: "pointer",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                {BUDGET_STATUS_LABELS[s]}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label style={labelStyle}>{plannerText.budget.notes}</label>
        <textarea
          style={{ ...inputStyle, minHeight: 60, height: "auto", padding: "12px 14px", resize: "vertical" }}
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder={plannerText.budget.notesPlaceholder}
        />
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <SecondaryBtn onClick={onCancel}>{plannerText.common.cancel}</SecondaryBtn>
        <PrimaryBtn onClick={() => validate() && onSave(form)}>{plannerText.common.save}</PrimaryBtn>
      </div>
    </div>
  );
}
