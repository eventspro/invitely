import React, { useRef, useState } from "react";
import { Paperclip, X } from "lucide-react";
import { usePlannerText } from "../PlannerLocaleContext";
import { uid } from "../plannerUtils";
import type { BudgetItem, BudgetCategory, BudgetStatus } from "../types";

interface BudgetItemFormProps {
  initial?: BudgetItem;
  currency: string;
  onSave: (item: BudgetItem) => void;
  onCancel: () => void;
}

const STATUS_COLORS: Record<BudgetStatus, string> = {
  planned:        "#6B7280",
  deposit_paid:   "#D7951E",
  partially_paid: "#2563EB",
  paid:           "#16864A",
  overdue:        "#E85D5D",
  cancelled:      "#9CA3AF",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", border: "1px solid #E5E7EB",
  borderRadius: 10, fontSize: 14, color: "#111827", background: "#FAFAFA",
  outline: "none", boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5,
};

const fieldStyle: React.CSSProperties = { marginBottom: 14 };

export default function BudgetItemForm({ initial, currency, onSave, onCancel }: BudgetItemFormProps) {
  const pt = usePlannerText();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [category, setCategory] = useState<BudgetCategory>(initial?.category ?? "other");
  const [customCategoryName, setCustomCategoryName] = useState(initial?.customCategoryName ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [vendorName, setVendorName] = useState(initial?.vendorName ?? "");
  const [plannedCost, setPlannedCost] = useState(initial?.plannedCost ?? 0);
  const [actualCost, setActualCost] = useState(initial?.actualCost ?? 0);
  const [paidAmount, setPaidAmount] = useState(initial?.paidAmount ?? 0);
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [status, setStatus] = useState<BudgetStatus>(initial?.status ?? "planned");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [receiptDataUrl, setReceiptDataUrl] = useState<string | undefined>(initial?.receiptDataUrl);
  const [receiptFileName, setReceiptFileName] = useState<string | undefined>(initial?.receiptFileName);
  const [error, setError] = useState("");

  const CATEGORY_OPTIONS: { value: BudgetCategory; label: string }[] = [
    { value: "venue",        label: pt.budget.categories.venue        },
    { value: "catering",     label: pt.budget.categories.catering     },
    { value: "decor",        label: pt.budget.categories.decor        },
    { value: "photo",        label: pt.budget.categories.photo        },
    { value: "music",        label: pt.budget.categories.music        },
    { value: "restaurant",   label: pt.budget.categories.restaurant   },
    { value: "photographer", label: pt.budget.categories.photographer },
    { value: "videographer", label: pt.budget.categories.videographer },
    { value: "decorations",  label: pt.budget.categories.decorations  },
    { value: "flowers",      label: pt.budget.categories.flowers      },
    { value: "invitations",  label: pt.budget.categories.invitations  },
    { value: "website",      label: pt.budget.categories.website      },
    { value: "host",         label: pt.budget.categories.host         },
    { value: "lighting",     label: pt.budget.categories.lighting     },
    { value: "other",        label: pt.budget.categories.other        },
    { value: "custom",       label: pt.budget.categories.custom       },
  ];

  const STATUS_OPTIONS: { value: BudgetStatus; label: string }[] = [
    { value: "planned",        label: pt.budgetStatus.planned        },
    { value: "deposit_paid",   label: pt.budgetStatus.deposit_paid   },
    { value: "partially_paid", label: pt.budgetStatus.partially_paid },
    { value: "paid",           label: pt.budgetStatus.paid           },
    { value: "overdue",        label: pt.budgetStatus.overdue        },
    { value: "cancelled",      label: pt.budgetStatus.cancelled      },
  ];

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setReceiptDataUrl(reader.result as string);
      setReceiptFileName(file.name);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function handleSubmit() {
    if (!title.trim()) { setError(pt.warnings.titleRequired); return; }
    const item: BudgetItem = {
      id: initial?.id ?? uid(),
      category,
      customCategoryName: category === "custom" ? customCategoryName.trim() || undefined : undefined,
      title: title.trim(),
      vendorName: vendorName.trim() || undefined,
      plannedCost: Math.max(0, plannedCost),
      actualCost:  Math.max(0, actualCost),
      paidAmount:  Math.max(0, paidAmount),
      dueDate:     dueDate || undefined,
      status,
      notes: notes.trim() || undefined,
      receiptDataUrl,
      receiptFileName,
    };
    onSave(item);
  }

  const chipBtn = (active: boolean, color?: string): React.CSSProperties => ({
    padding: "5px 11px", borderRadius: 99,
    border: active ? `1.5px solid ${color ?? "#064E3B"}` : "1.5px solid #E5E7EB",
    background: active ? `${color ?? "#064E3B"}1A` : "#FAFAFA",
    color: active ? (color ?? "#064E3B") : "#6B7280",
    cursor: "pointer", fontSize: 11.5, fontWeight: active ? 700 : 500, transition: "all 0.15s",
  });

  return (
    <div>
      {/* Category */}
      <div style={fieldStyle}>
        <label style={labelStyle}>{pt.budget.category}</label>
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

      {/* Custom category name */}
      {category === "custom" && (
        <div style={fieldStyle}>
          <label style={labelStyle}>{pt.budget.customCategory}</label>
          <input
            style={inputStyle}
            value={customCategoryName}
            onChange={e => setCustomCategoryName(e.target.value)}
            placeholder={pt.budget.customCategoryPlaceholder}
          />
        </div>
      )}

      {/* Item name */}
      <div style={fieldStyle}>
        <label style={labelStyle}>{pt.budget.itemTitle} <span style={{ color: "#E85D5D" }}>*</span></label>
        <input
          style={{ ...inputStyle, borderColor: error ? "#E85D5D" : "#E5E7EB" }}
          value={title}
          onChange={e => { setTitle(e.target.value); setError(""); }}
          placeholder={pt.budget.itemTitlePlaceholder}
        />
        {error && <div style={{ fontSize: 11, color: "#E85D5D", marginTop: 4 }}>{error}</div>}
      </div>

      {/* Vendor */}
      <div style={fieldStyle}>
        <label style={labelStyle}>{pt.budget.vendorName}</label>
        <input style={inputStyle} value={vendorName} onChange={e => setVendorName(e.target.value)} placeholder={pt.budget.vendorNamePlaceholder} />
      </div>

      {/* Cost columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {[
          { label: `${pt.budget.planned} (${currency})`, value: plannedCost, set: setPlannedCost },
          { label: `${pt.budget.actual} (${currency})`,  value: actualCost,  set: setActualCost  },
          { label: `${pt.budget.paid} (${currency})`,    value: paidAmount,  set: setPaidAmount  },
        ].map((col, i) => (
          <div key={i} style={fieldStyle}>
            <label style={labelStyle}>{col.label}</label>
            <input type="number" min={0} style={inputStyle} value={col.value} onChange={e => col.set(Number(e.target.value))} />
          </div>
        ))}
      </div>

      {/* Due date */}
      <div style={fieldStyle}>
        <label style={labelStyle}>{pt.budget.dueDate}</label>
        <input type="date" style={inputStyle} value={dueDate} onChange={e => setDueDate(e.target.value)} />
      </div>

      {/* Status chips */}
      <div style={fieldStyle}>
        <label style={labelStyle}>{pt.budget.statusLabel}</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {STATUS_OPTIONS.map(o => (
            <button key={o.value} style={chipBtn(status === o.value, STATUS_COLORS[o.value])} onClick={() => setStatus(o.value)}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Receipt upload */}
      <div style={fieldStyle}>
        <label style={labelStyle}>{pt.budget.attachReceipt}</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        {receiptDataUrl ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", background: "#EFF6FF", borderRadius: 10, border: "1px solid #BFDBFE" }}>
            <Paperclip size={14} color="#3B82F6" />
            <span style={{ flex: 1, fontSize: 13, color: "#1D4ED8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {receiptFileName ?? pt.budget.viewReceipt}
            </span>
            <button
              onClick={() => { setReceiptDataUrl(undefined); setReceiptFileName(undefined); }}
              style={{ border: "none", background: "transparent", cursor: "pointer", color: "#6B7280", padding: 0, display: "flex" }}
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: "100%", padding: "10px", borderRadius: 10,
              border: "1.5px dashed #D1D5DB", background: "#FAFAFA",
              color: "#6B7280", fontSize: 13, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <Paperclip size={14} />
            {pt.budget.attachReceipt}
          </button>
        )}
      </div>

      {/* Notes */}
      <div style={fieldStyle}>
        <label style={labelStyle}>{pt.common.notes}</label>
        <textarea
          style={{ ...inputStyle, resize: "vertical", minHeight: 60 }}
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button
          onClick={onCancel}
          style={{ flex: 1, padding: "13px", borderRadius: 12, border: "1.5px solid #E5E7EB", background: "#FAFAFA", color: "#374151", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
        >
          {pt.common.cancel}
        </button>
        <button
          onClick={handleSubmit}
          style={{ flex: 2, padding: "13px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #00472F 0%, #006B4A 100%)", color: "#FFFFFF", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
        >
          {pt.common.save}
        </button>
      </div>
    </div>
  );
}
