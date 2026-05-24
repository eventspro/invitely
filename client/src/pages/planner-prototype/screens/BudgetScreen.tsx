import React, { useState } from "react";
import { Plus, Wallet } from "lucide-react";
import { plannerText } from "../plannerTextConfig";
import BudgetItemCard from "../components/BudgetItemCard";
import EmptyState from "../components/EmptyState";
import ProgressBar from "../components/ProgressBar";
import { getBudgetTotals, formatCurrency } from "../plannerUtils";
import type { BudgetItem, BudgetCategory } from "../types";

interface BudgetScreenProps {
  budgetItems: BudgetItem[];
  currency: string;
  onAdd: () => void;
  onEdit: (item: BudgetItem) => void;
  onDelete: (id: string) => void;
}

type CategoryFilter = "all" | BudgetCategory;

const CATEGORY_FILTERS: { value: CategoryFilter; label: string }[] = [
  { value: "all",          label: plannerText.common.all },
  { value: "venue",        label: plannerText.budget.categories.venue },
  { value: "catering",     label: plannerText.budget.categories.catering },
  { value: "photo",        label: plannerText.budget.categories.photo },
  { value: "decor",        label: plannerText.budget.categories.decor },
  { value: "flowers",      label: plannerText.budget.categories.flowers },
  { value: "music",        label: plannerText.budget.categories.music },
  { value: "other",        label: plannerText.budget.categories.other },
];

export default function BudgetScreen({ budgetItems, currency, onAdd, onEdit, onDelete }: BudgetScreenProps) {
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const totals = getBudgetTotals(budgetItems);
  const filtered = filter === "all" ? budgetItems : budgetItems.filter(i => i.category === filter);

  /* ─── shared pieces ─── */

  const chipBtn = (active: boolean): React.CSSProperties => ({
    padding: "7px 14px",
    borderRadius: 99,
    border: active ? "none" : "1px solid #E5E7EB",
    background: active ? "#064E3B" : "#FFFFFF",
    color: active ? "#FFFFFF" : "#6B7280",
    cursor: "pointer",
    fontSize: 12.5,
    fontWeight: active ? 700 : 500,
    whiteSpace: "nowrap" as const,
    flexShrink: 0,
    fontFamily: "inherit",
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
          title={plannerText.budget.emptyTitle}
          description={plannerText.budget.emptyDesc}
          action={
            <button
              onClick={onAdd}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
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
              <Plus size={14} strokeWidth={2.5} />
              {plannerText.budget.addExpense}
            </button>
          }
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(item => (
            <BudgetItemCard
              key={item.id}
              item={item}
              currency={currency}
              onEdit={() => onEdit(item)}
              onDelete={() => onDelete(item.id)}
            />
          ))}
        </div>
      )}
    </>
  );

  const addBtn = (
    <button
      onClick={onAdd}
      style={{
        width: "100%",
        padding: "15px",
        borderRadius: 16,
        border: "none",
        background: "linear-gradient(135deg, #00472F 0%, #006B4A 100%)",
        color: "#FFFFFF",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 9,
        fontSize: 14.5,
        fontWeight: 700,
        fontFamily: "inherit",
        letterSpacing: "-0.01em",
        boxShadow: "0 4px 16px rgba(6,78,59,0.28)",
      }}
    >
      <Plus size={16} strokeWidth={2.5} />
      {plannerText.budget.addExpense}
    </button>
  );

  /* ─── hero summary card ─── */
  const summaryCard = (isMobile: boolean) => (
    <div
      style={{
        background: "linear-gradient(135deg, #00472F 0%, #006B4A 100%)",
        borderRadius: isMobile ? 22 : 20,
        padding: "22px 22px 18px",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 10px 32px rgba(6,78,59,0.32)",
      }}
    >
      {/* decorative circles */}
      <div style={{ position: "absolute", top: -40, right: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -20, left: -20, width: 90, height: 90, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

      {/* label + main amount */}
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
        {plannerText.budget.totalBudget}
      </div>
      <div style={{ fontSize: isMobile ? 32 : 36, fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.025em", lineHeight: 1, marginBottom: 16 }}>
        {formatCurrency(totals.planned, currency)}
      </div>

      {/* Paid / Remaining row */}
      <div style={{ display: "flex", gap: 0, marginBottom: 14 }}>
        <div style={{ flex: 1, borderRight: "1px solid rgba(255,255,255,0.15)", paddingRight: 16 }}>
          <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>
            {plannerText.budget.paid}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#FFFFFF", marginTop: 3 }}>
            {formatCurrency(totals.paid, currency)}
          </div>
        </div>
        <div style={{ flex: 1, paddingLeft: 16 }}>
          <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>
            {plannerText.budget.remaining}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#FFFFFF", marginTop: 3 }}>
            {formatCurrency(totals.remaining, currency)}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 99, height: 6, overflow: "hidden" }}>
        <div
          style={{
            width: `${Math.min(100, totals.pct)}%`,
            height: "100%",
            background: "rgba(255,255,255,0.85)",
            borderRadius: 99,
          }}
        />
      </div>
      <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.5)", marginTop: 6, textAlign: "right" }}>
        {totals.pct}% {plannerText.budget.used}
      </div>
    </div>
  );

  return (
    <>
      {/* ─── MOBILE ─── */}
      <div className="pp-mobile-view">
        <div className="pp-screen-bottom" style={{ paddingTop: 0 }}>
          {/* Hero summary card */}
          <div style={{ padding: "12px 14px 4px" }}>
            {summaryCard(true)}
          </div>

          {/* Category chips */}
          <div style={{ padding: "14px 14px 6px", overflowX: "auto", scrollbarWidth: "none" }}>
            {chips}
          </div>

          {/* Budget items */}
          <div style={{ padding: "6px 14px 0" }}>
            {itemList}
          </div>

          {/* Add Expense CTA */}
          {budgetItems.length > 0 && (
            <div style={{ padding: "20px 14px 0" }}>
              {addBtn}
            </div>
          )}
        </div>
      </div>

      {/* ─── DESKTOP ─── */}
      <div className="pp-desktop-view">
        <div className="pp-page-pad">
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0, letterSpacing: "-0.02em" }}>
                {plannerText.budget.title}
              </h1>
              <p style={{ fontSize: 13.5, color: "#6B7280", margin: "4px 0 0", fontWeight: 400 }}>
                {plannerText.budget.subtitle}
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
              {plannerText.budget.addExpense}
            </button>
          </div>

          {/* Summary + stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
            {/* Large summary card */}
            <div>{summaryCard(false)}</div>

            {/* Stat cards */}
            {[
              { label: plannerText.budget.totalPlanned, value: formatCurrency(totals.planned, currency), sub: `${budgetItems.length} items` },
              { label: plannerText.budget.paid,         value: formatCurrency(totals.paid, currency),    sub: `${totals.pct}% ${plannerText.budget.used}` },
              { label: plannerText.budget.remaining,    value: formatCurrency(totals.remaining, currency), sub: plannerText.budget.remaining },
            ].map((stat, i) => (
              <div
                key={i}
                style={{
                  background: "#FFFFFF",
                  borderRadius: 18,
                  border: "1px solid #E5E7EB",
                  padding: "20px 18px",
                  boxShadow: "0 4px 16px rgba(17,24,39,0.05)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500 }}>{stat.label}</div>
                <div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#111827", letterSpacing: "-0.025em", lineHeight: 1, marginTop: 8 }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 11, color: "#6B7280", marginTop: 5 }}>{stat.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Category chips */}
          <div style={{ marginBottom: 16, overflowX: "auto", scrollbarWidth: "none" }}>
            {chips}
          </div>

          {/* Budget items */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {itemList}
          </div>

          {/* Add Expense CTA */}
          {budgetItems.length > 0 && (
            <div style={{ marginTop: 24, maxWidth: 360 }}>
              {addBtn}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

