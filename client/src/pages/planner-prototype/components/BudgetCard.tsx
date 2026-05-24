import React from "react";
import {
  Pencil,
  Trash2,
  Calendar,
  Utensils,
  Music,
  Camera,
  Video,
  Flower2,
  Shirt,
  Cake,
  Car,
  Mail,
  Globe,
  Mic2,
  Lightbulb,
  Sparkles,
  Scissors,
  Palette,
  CircleDollarSign,
  TrendingUp,
} from "lucide-react";
import type { BudgetItem } from "../types";
import { BUDGET_STATUS_LABELS, BUDGET_STATUS_COLORS } from "../constants";
import { formatCurrency } from "../plannerUtils";
import { plannerText } from "../plannerTextConfig";

interface BudgetCardProps {
  item: BudgetItem;
  onEdit: (item: BudgetItem) => void;
  onDelete: (id: string) => void;
}

function categoryIcon(category: string): React.ElementType {
  const c = category;
  if (c === plannerText.budgetCategories.restaurant) return Utensils;
  if (c === plannerText.budgetCategories.music) return Music;
  if (c === plannerText.budgetCategories.photographer) return Camera;
  if (c === plannerText.budgetCategories.videographer) return Video;
  if (c === plannerText.budgetCategories.decorations) return Sparkles;
  if (c === plannerText.budgetCategories.flowers) return Flower2;
  if (c === plannerText.budgetCategories.dress || c === plannerText.budgetCategories.suit) return Shirt;
  if (c === plannerText.budgetCategories.makeup) return Palette;
  if (c === plannerText.budgetCategories.hair) return Scissors;
  if (c === plannerText.budgetCategories.cake) return Cake;
  if (c === plannerText.budgetCategories.cars) return Car;
  if (c === plannerText.budgetCategories.invitations) return Mail;
  if (c === plannerText.budgetCategories.website) return Globe;
  if (c === plannerText.budgetCategories.host) return Mic2;
  if (c === plannerText.budgetCategories.lighting) return Lightbulb;
  return CircleDollarSign;
}

export default function BudgetCard({ item, onEdit, onDelete }: BudgetCardProps) {
  const cost = item.actualCost || item.estimatedCost;
  const paidPct = cost > 0 ? Math.min(100, (item.paidAmount / cost) * 100) : 0;
  const remaining = Math.max(0, cost - item.paidAmount);
  const overBudget = item.actualCost > 0 && item.actualCost > item.estimatedCost;

  const statusColor = BUDGET_STATUS_COLORS[item.status];
  const Icon = categoryIcon(item.category);

  const dueDate = item.dueDate ? new Date(item.dueDate) : null;
  const isOverdue = dueDate && dueDate.getTime() < Date.now() && item.status !== "paid";

  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 18,
        padding: "16px",
        marginBottom: 12,
        boxShadow: "0 1px 3px rgba(16,36,27,0.04), 0 4px 14px rgba(16,36,27,0.04)",
        border: "1px solid #E8DDCB",
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: "#FBF7EF",
            color: "#123C2F",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            border: "1px solid #E8DDCB",
          }}
        >
          <Icon size={20} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5, color: "#10241B", letterSpacing: "-0.01em" }}>
                {item.title}
              </div>
              <div style={{ fontSize: 11, color: "#6F766F", marginTop: 2 }}>{item.category}</div>
            </div>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                padding: "3px 9px",
                borderRadius: 20,
                background: statusColor + "15",
                color: statusColor,
                flexShrink: 0,
                height: "fit-content",
              }}
            >
              {BUDGET_STATUS_LABELS[item.status]}
            </span>
          </div>

          {item.vendorName && (
            <div style={{ fontSize: 12, color: "#10241B", marginTop: 6, fontWeight: 500 }}>
              {item.vendorName}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginTop: 12 }}>
            <KV label={plannerText.common.planned} value={formatCurrency(item.estimatedCost)} />
            <KV label={plannerText.common.paid} value={formatCurrency(item.paidAmount)} color="#1F9D63" />
            <KV
              label={plannerText.common.remaining}
              value={formatCurrency(remaining)}
              color="#C88420"
            />
          </div>

          {overBudget && (
            <div
              style={{
                marginTop: 8,
                fontSize: 11,
                color: "#D95B5B",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <TrendingUp size={11} />
              {plannerText.budget.overPlanned}: {formatCurrency(item.actualCost - item.estimatedCost)}
            </div>
          )}

          {cost > 0 && (
            <div style={{ marginTop: 10, height: 5, borderRadius: 4, background: "#E8DDCB", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${paidPct}%`,
                  background: overBudget ? "#D95B5B" : "#C9A85A",
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          )}

          {dueDate && (
            <div
              style={{
                marginTop: 8,
                fontSize: 11,
                color: isOverdue ? "#D95B5B" : "#6F766F",
                fontWeight: isOverdue ? 600 : 500,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Calendar size={11} />
              {dueDate.toLocaleDateString("hy-AM")}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button
          onClick={() => onEdit(item)}
          style={{
            flex: 1,
            padding: "10px 0",
            borderRadius: 12,
            border: "1px solid #E8DDCB",
            background: "#FFFFFF",
            color: "#10241B",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
          }}
        >
          <Pencil size={13} />
          {plannerText.common.edit}
        </button>
        <button
          onClick={() => {
            if (window.confirm(`${plannerText.common.delete}?`)) onDelete(item.id);
          }}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            border: "1px solid #FECACA",
            background: "#FFF5F5",
            color: "#D95B5B",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label={plannerText.common.delete}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

function KV({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: "#6F766F", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: color || "#10241B", marginTop: 2 }}>
        {value}
      </div>
    </div>
  );
}
