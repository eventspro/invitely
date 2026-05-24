import React from "react";
import {
  type LucideIcon,
  Pencil,
  Trash2,
  CalendarDays,
  Building2,
  Utensils,
  Camera,
  Film,
  Music,
  Sparkles,
  Flower2,
  Mail,
  Globe,
  Mic2,
  Lightbulb,
  Receipt,
  Image as LucideImage,
} from "lucide-react";
import { plannerText } from "../plannerTextConfig";
import { BUDGET_STATUS_COLORS, BUDGET_STATUS_BG, formatCurrency, formatDate } from "../plannerUtils";
import type { BudgetItem } from "../types";

const CATEGORY_LABELS: Record<string, string> = {
  venue: plannerText.budget.categories.venue,
  catering: plannerText.budget.categories.catering,
  decor: plannerText.budget.categories.decor,
  photo: plannerText.budget.categories.photo,
  music: plannerText.budget.categories.music,
  restaurant: plannerText.budget.categories.restaurant,
  photographer: plannerText.budget.categories.photographer,
  videographer: plannerText.budget.categories.videographer,
  decorations: plannerText.budget.categories.decorations,
  flowers: plannerText.budget.categories.flowers,
  invitations: plannerText.budget.categories.invitations,
  website: plannerText.budget.categories.website,
  host: plannerText.budget.categories.host,
  lighting: plannerText.budget.categories.lighting,
  other: plannerText.budget.categories.other,
};

const STATUS_LABELS: Record<string, string> = {
  planned: plannerText.budgetStatus.planned,
  deposit_paid: plannerText.budgetStatus.deposit_paid,
  partially_paid: plannerText.budgetStatus.partially_paid,
  paid: plannerText.budgetStatus.paid,
  overdue: plannerText.budgetStatus.overdue,
  cancelled: plannerText.budgetStatus.cancelled,
  refunded: plannerText.budgetStatus.refunded,
};

interface IconConfig { icon: LucideIcon; bg: string; color: string }

const CATEGORY_ICON_CONFIG: Record<string, IconConfig> = {
  venue:        { icon: Building2, bg: "#EEF4FF", color: "#3B82F6" },
  catering:     { icon: Utensils,  bg: "#FFF4ED", color: "#EA7A2C" },
  restaurant:   { icon: Utensils,  bg: "#FFF4ED", color: "#EA7A2C" },
  photo:        { icon: Camera,    bg: "#EEF0FF", color: "#6366F1" },
  photographer: { icon: Camera,    bg: "#EEF0FF", color: "#6366F1" },
  videographer: { icon: Film,      bg: "#EEF0FF", color: "#8B5CF6" },
  music:        { icon: Music,     bg: "#F5F0FF", color: "#8B5CF6" },
  host:         { icon: Mic2,      bg: "#F5F0FF", color: "#6366F1" },
  decor:        { icon: Sparkles,  bg: "#FFF0F6", color: "#EC4899" },
  decorations:  { icon: Sparkles,  bg: "#FFF0F6", color: "#EC4899" },
  flowers:      { icon: Flower2,   bg: "#FFF0F6", color: "#F43F5E" },
  invitations:  { icon: Mail,      bg: "#F0FFF4", color: "#16A34A" },
  website:      { icon: Globe,     bg: "#EFF6FF", color: "#3B82F6" },
  lighting:     { icon: Lightbulb, bg: "#FEFCE8", color: "#CA8A04" },
  other:        { icon: Receipt,   bg: "#F9FAFB", color: "#6B7280" },
};

const DEFAULT_ICON_CFG: IconConfig = { icon: Receipt, bg: "#F9FAFB", color: "#6B7280" };

interface BudgetItemCardProps {
  item: BudgetItem;
  currency: string;
  onEdit: () => void;
  onDelete: () => void;
}

export default function BudgetItemCard({ item, currency, onEdit, onDelete }: BudgetItemCardProps) {
  const statusColor = BUDGET_STATUS_COLORS[item.status] ?? "#6B7280";
  const statusBg   = BUDGET_STATUS_BG[item.status]    ?? "#F3F4F6";
  const iconCfg    = CATEGORY_ICON_CONFIG[item.category] ?? DEFAULT_ICON_CFG;
  const IconComponent = iconCfg.icon;

  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 18,
        border: "1px solid #E5E7EB",
        boxShadow: "0 4px 16px rgba(17,24,39,0.05)",
        overflow: "hidden",
      }}
    >
      {/* Main content row */}
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "14px 14px 12px" }}>
        {/* Category icon block */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 13,
            background: iconCfg.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <IconComponent size={20} strokeWidth={1.75} color={iconCfg.color} />
        </div>

        {/* Middle: title + category/vendor + due date */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#111827",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              lineHeight: 1.25,
            }}
          >
            {item.title}
          </div>
          <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
            {CATEGORY_LABELS[item.category] ?? item.category}
            {item.vendorName && ` · ${item.vendorName}`}
          </div>
          {item.dueDate && (
            <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 5 }}>
              <CalendarDays size={11} color="#9CA3AF" strokeWidth={1.75} />
              <span style={{ fontSize: 11, color: "#9CA3AF" }}>{formatDate(item.dueDate)}</span>
            </div>
          )}
        </div>

        {/* Right: amount + status pill + actions */}
        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: "#111827", letterSpacing: "-0.01em" }}>
            {formatCurrency(item.plannedCost, currency)}
          </span>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              color: statusColor,
              background: statusBg,
              borderRadius: 99,
              padding: "2px 8px",
              whiteSpace: "nowrap",
            }}
          >
            {STATUS_LABELS[item.status] ?? item.status}
          </span>
          <div style={{ display: "flex", gap: 0 }}>
            <button
              onClick={onEdit}
              style={{
                width: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                borderRadius: 7,
                color: "#C4C9D4",
              }}
              title={plannerText.common.edit}
            >
              <Pencil size={12} strokeWidth={1.75} />
            </button>
            <button
              onClick={onDelete}
              style={{
                width: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                borderRadius: 7,
                color: "#C4C9D4",
              }}
              title={plannerText.common.delete}
            >
              <Trash2 size={12} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </div>

      {/* Amounts strip */}
      <div
        style={{
          display: "flex",
          borderTop: "1px solid #F3F4F6",
        }}
      >
        {[
          { label: plannerText.budget.planned, value: formatCurrency(item.plannedCost, currency) },
          { label: plannerText.budget.actual,  value: formatCurrency(item.actualCost,  currency) },
          { label: plannerText.budget.paid,    value: formatCurrency(item.paidAmount,  currency) },
        ].map((col, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              textAlign: "center",
              padding: "9px 4px",
              borderRight: i < 2 ? "1px solid #F3F4F6" : "none",
            }}
          >
            <div style={{ fontSize: 9.5, color: "#9CA3AF", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.03em" }}>
              {col.label}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginTop: 2 }}>
              {col.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

