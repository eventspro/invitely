import React, { useState } from "react";
import type { BudgetItem } from "../types";
import { BUDGET_CATEGORIES } from "../constants";
import { getBudgetTotals, formatCurrency } from "../plannerUtils";
import { plannerText } from "../plannerTextConfig";
import BudgetCard from "./BudgetCard";
import { EmptyState, Fab } from "./GuestsTab";

interface BudgetTabProps {
  budgetItems: BudgetItem[];
  guestCount: number;
  pricePerGuest: number;
  onAddItem: () => void;
  onEditItem: (item: BudgetItem) => void;
  onDeleteItem: (id: string) => void;
}

export default function BudgetTab({
  budgetItems,
  guestCount,
  pricePerGuest,
  onAddItem,
  onEditItem,
  onDeleteItem,
}: BudgetTabProps) {
  const [catFilter, setCatFilter] = useState<string>("all");
  const totals = getBudgetTotals(budgetItems);

  const filtered = catFilter === "all" ? budgetItems : budgetItems.filter((i) => i.category === catFilter);
  const paidPct = totals.estimated > 0 ? Math.min(100, (totals.paid / totals.estimated) * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        style={{
          padding: "16px",
          background: "#FBF7EF",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #0F3D2E 0%, #1A5240 100%)",
            borderRadius: 18,
            padding: "16px 18px",
            color: "#fff",
            boxShadow: "0 4px 16px rgba(15,61,46,0.18)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                {plannerText.dashboard.estimatedBudget}
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 2 }}>
                {formatCurrency(totals.estimated)}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                {plannerText.common.paid}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#C9A85A", marginTop: 2 }}>
                {formatCurrency(totals.paid)}
              </div>
            </div>
          </div>
          <div style={{ height: 5, borderRadius: 4, background: "rgba(255,255,255,0.15)", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${paidPct}%`,
                background: totals.overBudget ? "#D95B5B" : "#C9A85A",
                transition: "width 0.4s ease",
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12 }}>
            <span style={{ color: "rgba(255,255,255,0.78)" }}>
              {plannerText.common.remaining}: {formatCurrency(totals.remaining)}
            </span>
            <span style={{ fontWeight: 700, color: "#C9A85A" }}>{Math.round(paidPct)}%</span>
          </div>
        </div>

        {guestCount > 0 && pricePerGuest > 0 && (
          <div
            style={{
              marginTop: 10,
              padding: "10px 14px",
              borderRadius: 12,
              background: "#FFFFFF",
              border: "1px solid #E8DDCB",
              fontSize: 12,
              color: "#6F766F",
            }}
          >
            <span style={{ color: "#10241B", fontWeight: 600 }}>
              {plannerText.budget.restaurantEstimate}:
            </span>{" "}
            {guestCount} × {formatCurrency(pricePerGuest)} ={" "}
            <span style={{ color: "#123C2F", fontWeight: 700 }}>
              {formatCurrency(guestCount * pricePerGuest)}
            </span>
          </div>
        )}
      </div>

      <div
        style={{
          padding: "0 16px 12px",
          overflowX: "auto",
          display: "flex",
          gap: 6,
          flexShrink: 0,
          background: "#FBF7EF",
          borderBottom: "1px solid #E8DDCB",
        }}
      >
        {(["all", ...BUDGET_CATEGORIES] as string[]).map((cat) => {
          const active = catFilter === cat;
          return (
            <button
              key={cat}
              onClick={() => setCatFilter(cat)}
              style={{
                flexShrink: 0,
                padding: "7px 13px",
                borderRadius: 22,
                border: `1px solid ${active ? "#123C2F" : "#E8DDCB"}`,
                background: active ? "#123C2F" : "#fff",
                color: active ? "#fff" : "#6F766F",
                fontWeight: active ? 600 : 500,
                fontSize: 12,
                cursor: "pointer",
                whiteSpace: "nowrap",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {cat === "all" ? plannerText.common.all : cat}
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px 120px" }}>
        {filtered.length === 0 ? (
          <EmptyState
            title={budgetItems.length === 0 ? plannerText.budget.noItems : plannerText.emptyStates.noBudgetInFilter}
            description={budgetItems.length === 0 ? plannerText.budget.noItemsDescription : undefined}
          />
        ) : (
          filtered.map((item) => (
            <BudgetCard key={item.id} item={item} onEdit={onEditItem} onDelete={onDeleteItem} />
          ))
        )}
      </div>

      <Fab onClick={onAddItem} ariaLabel={plannerText.budget.addItem} />
    </div>
  );
}
