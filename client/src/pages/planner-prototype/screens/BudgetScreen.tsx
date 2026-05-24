import React, { useRef, useState } from "react";
import { Plus, Wallet, Pencil, Check } from "lucide-react";
import { usePlannerText } from "../PlannerLocaleContext";
import BudgetItemCard from "../components/BudgetItemCard";
import EmptyState from "../components/EmptyState";
import { getBudgetTotals, formatCurrency } from "../plannerUtils";
import type { BudgetItem, BudgetCategory, PlannerSettings } from "../types";

interface BudgetScreenProps {
  budgetItems: BudgetItem[];
  currency: string;
  settings: PlannerSettings;
  onAdd: () => void;
  onEdit: (item: BudgetItem) => void;
  onDelete: (id: string) => void;
  onUpdateSettings: (s: PlannerSettings) => void;
}

type CategoryFilter = "all" | BudgetCategory | string;

export default function BudgetScreen({ budgetItems, currency, settings, onAdd, onEdit, onDelete, onUpdateSettings }: BudgetScreenProps) {
  const pt = usePlannerText();
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [editingCap, setEditingCap] = useState(false);
  const [capInput, setCapInput] = useState("");
  const capInputRef = useRef<HTMLInputElement>(null);

  const totals = getBudgetTotals(budgetItems);
  const cap = settings.totalBudget > 0 ? settings.totalBudget : totals.planned;
  const capRemaining = Math.max(0, cap - totals.paid);
  const capPct = cap > 0 ? Math.round((totals.paid / cap) * 100) : 0;

  // Build custom category chips from items
  const customNames = Array.from(
    new Set(budgetItems.filter(i => i.category === "custom" && i.customCategoryName).map(i => i.customCategoryName!))
  );

  const filtered = (() => {
    if (filter === "all") return budgetItems;
    if (customNames.includes(filter as string))
      return budgetItems.filter(i => i.category === "custom" && i.customCategoryName === filter);
    return budgetItems.filter(i => i.category === filter);
  })();

  const CATEGORY_FILTERS: { value: CategoryFilter; label: string }[] = [
    { value: "all",      label: pt.common.all },
    { value: "venue",    label: pt.budget.categories.venue },
    { value: "catering", label: pt.budget.categories.catering },
    { value: "photo",    label: pt.budget.categories.photo },
    { value: "decor",    label: pt.budget.categories.decor },
    { value: "flowers",  label: pt.budget.categories.flowers },
    { value: "music",    label: pt.budget.categories.music },
    { value: "other",    label: pt.budget.categories.other },
    ...customNames.map(n => ({ value: n, label: n })),
  ];

  function startEditCap() {
    setCapInput(settings.totalBudget > 0 ? String(settings.totalBudget) : "");
    setEditingCap(true);
    setTimeout(() => capInputRef.current?.focus(), 50);
  }

  function saveCap() {
    const v = parseFloat(capInput.replace(/[^0-9.]/g, ""));
    onUpdateSettings({ ...settings, totalBudget: isNaN(v) ? 0 : Math.max(0, v) });
    setEditingCap(false);
  }

  /* ─── shared pieces ─── */
  const chipBtn = (active: boolean): React.CSSProperties => ({
    padding: "7px 14px", borderRadius: 99,
    border: active ? "none" : "1px solid #E5E7EB",
    background: active ? "#064E3B" : "#FFFFFF",
    color: active ? "#FFFFFF" : "#6B7280",
    cursor: "pointer", fontSize: 12.5, fontWeight: active ? 700 : 500,
    whiteSpace: "nowrap" as const, flexShrink: 0, fontFamily: "inherit",
    boxShadow: active ? "0 2px 8px rgba(6,78,59,0.22)" : "none",
  });

  const chips = (
    <div className="pp-chip-scroll" style={{ display: "flex", gap: 6, paddingBottom: 2 }}>
      {CATEGORY_FILTERS.map(o => (
        <button key={o.value} style={chipBtn(filter === o.value)} onClick={() => setFilter(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );

  const itemList = (
    <>
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Wallet size={36} />}
          title={pt.budget.emptyTitle}
          description={pt.budget.emptyDesc}
          action={
            <button
              onClick={onAdd}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "11px 20px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #00472F 0%, #006B4A 100%)", color: "#FFFFFF", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
            >
              <Plus size={14} strokeWidth={2.5} />
              {pt.budget.addExpense}
            </button>
          }
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(item => (
            <BudgetItemCard key={item.id} item={item} currency={currency} onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id)} />
          ))}
        </div>
      )}
    </>
  );

  const addBtn = (
    <button
      onClick={onAdd}
      style={{ width: "100%", padding: "15px", borderRadius: 16, border: "none", background: "linear-gradient(135deg, #00472F 0%, #006B4A 100%)", color: "#FFFFFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 9, fontSize: 14.5, fontWeight: 700, fontFamily: "inherit", letterSpacing: "-0.01em", boxShadow: "0 4px 16px rgba(6,78,59,0.28)" }}
    >
      <Plus size={16} strokeWidth={2.5} />
      {pt.budget.addExpense}
    </button>
  );

  /* ─── hero summary card ─── */
  const summaryCard = (isMobile: boolean) => (
    <div
      style={{ background: "linear-gradient(135deg, #00472F 0%, #006B4A 100%)", borderRadius: isMobile ? 22 : 20, padding: "22px 22px 18px", position: "relative", overflow: "hidden", boxShadow: "0 10px 32px rgba(6,78,59,0.32)" }}
    >
      <div style={{ position: "absolute", top: -40, right: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -20, left: -20, width: 90, height: 90, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

      {/* Label row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {pt.budget.totalBudget}
        </div>
        <button
          onClick={startEditCap}
          title={pt.budget.editBudgetCap}
          style={{ border: "none", background: "rgba(255,255,255,0.15)", borderRadius: 6, padding: "3px 8px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: 600 }}
        >
          <Pencil size={10} />
          {pt.budget.editBudgetCap}
        </button>
      </div>

      {/* Amount or inline edit */}
      {editingCap ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: "rgba(255,255,255,0.6)" }}>{currency}</span>
          <input
            ref={capInputRef}
            type="number"
            min={0}
            value={capInput}
            onChange={e => setCapInput(e.target.value)}
            onBlur={saveCap}
            onKeyDown={e => { if (e.key === "Enter") saveCap(); if (e.key === "Escape") setEditingCap(false); }}
            placeholder={pt.budget.budgetCapPlaceholder}
            style={{ flex: 1, background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.4)", borderRadius: 10, padding: "6px 10px", fontSize: isMobile ? 26 : 30, fontWeight: 800, color: "#FFFFFF", outline: "none", fontFamily: "inherit" }}
          />
          <button
            onClick={saveCap}
            style={{ border: "none", background: "rgba(255,255,255,0.2)", borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: "#FFFFFF", display: "flex" }}
          >
            <Check size={16} />
          </button>
        </div>
      ) : (
        <div
          onClick={startEditCap}
          style={{ fontSize: isMobile ? 32 : 36, fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.025em", lineHeight: 1, marginBottom: 16, cursor: "pointer" }}
          title={pt.budget.editBudgetCap}
        >
          {formatCurrency(cap, currency)}
        </div>
      )}

      {/* Paid / Remaining */}
      <div style={{ display: "flex", gap: 0, marginBottom: 14 }}>
        <div style={{ flex: 1, borderRight: "1px solid rgba(255,255,255,0.15)", paddingRight: 16 }}>
          <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>{pt.budget.paid}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#FFFFFF", marginTop: 3 }}>{formatCurrency(totals.paid, currency)}</div>
        </div>
        <div style={{ flex: 1, paddingLeft: 16 }}>
          <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>{pt.budget.remaining}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#FFFFFF", marginTop: 3 }}>{formatCurrency(capRemaining, currency)}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 99, height: 6, overflow: "hidden" }}>
        <div style={{ width: `${Math.min(100, capPct)}%`, height: "100%", background: "rgba(255,255,255,0.85)", borderRadius: 99 }} />
      </div>
      <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.5)", marginTop: 6, textAlign: "right" }}>
        {capPct}% {pt.budget.used}
      </div>
    </div>
  );

  return (
    <>
      {/* ─── MOBILE ─── */}
      <div className="pp-mobile-view">
        <div className="pp-screen-bottom" style={{ paddingTop: 0 }}>
          <div style={{ padding: "12px 14px 4px" }}>{summaryCard(true)}</div>
          <div style={{ padding: "14px 14px 6px", overflowX: "auto", scrollbarWidth: "none" }}>{chips}</div>
          <div style={{ padding: "6px 14px 0" }}>{itemList}</div>
          {budgetItems.length > 0 && <div style={{ padding: "20px 14px 0" }}>{addBtn}</div>}
        </div>
      </div>

      {/* ─── DESKTOP ─── */}
      <div className="pp-desktop-view">
        <div className="pp-page-pad">
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0, letterSpacing: "-0.02em" }}>{pt.budget.title}</h1>
              <p style={{ fontSize: 13.5, color: "#6B7280", margin: "4px 0 0", fontWeight: 400 }}>{pt.budget.subtitle}</p>
            </div>
            <button
              onClick={onAdd}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #00472F 0%, #006B4A 100%)", color: "#FFFFFF", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 10px rgba(6,78,59,0.22)" }}
            >
              <Plus size={15} strokeWidth={2.5} />
              {pt.budget.addExpense}
            </button>
          </div>

          {/* Summary + stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
            <div>{summaryCard(false)}</div>
            {[
              { label: pt.budget.totalPlanned, value: formatCurrency(totals.planned, currency), sub: `${budgetItems.length} items` },
              { label: pt.budget.paid,         value: formatCurrency(totals.paid, currency),    sub: `${capPct}% ${pt.budget.used}` },
              { label: pt.budget.remaining,    value: formatCurrency(capRemaining, currency),   sub: pt.budget.remaining },
            ].map((stat, i) => (
              <div key={i} style={{ background: "#FFFFFF", borderRadius: 18, border: "1px solid #E5E7EB", padding: "20px 18px", boxShadow: "0 4px 16px rgba(17,24,39,0.05)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500 }}>{stat.label}</div>
                <div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#111827", letterSpacing: "-0.025em", lineHeight: 1, marginTop: 8 }}>{stat.value}</div>
                  <div style={{ fontSize: 11, color: "#6B7280", marginTop: 5 }}>{stat.sub}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 16, overflowX: "auto", scrollbarWidth: "none" }}>{chips}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{itemList}</div>
          {budgetItems.length > 0 && <div style={{ marginTop: 24, maxWidth: 360 }}>{addBtn}</div>}
        </div>
      </div>
    </>
  );
}
