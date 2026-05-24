import React from "react";
import { Users, LayoutGrid, Wallet2, UserPlus, Sparkles, Plus, AlertTriangle, ArrowRight } from "lucide-react";
import type { PlannerState } from "../types";
import {
  getGuestTotals,
  getSeatingTotals,
  getBudgetTotals,
  formatCurrency,
  getUnseatedGuests,
} from "../plannerUtils";
import { plannerText } from "../plannerTextConfig";

interface DashboardTabProps {
  state: PlannerState;
  onOpenTableGen: () => void;
  onGoToGuests: () => void;
  onGoToTables: () => void;
  onGoToBudget: () => void;
}

const COLORS = {
  bg: "#FBF7EF",
  card: "#FFFFFF",
  primary: "#123C2F",
  primarySoft: "#E8F3ED",
  gold: "#C9A85A",
  text: "#10241B",
  muted: "#6F766F",
  border: "#E8DDCB",
  danger: "#D95B5B",
  success: "#1F9D63",
  warning: "#C88420",
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 13,
        fontWeight: 700,
        color: COLORS.text,
        marginBottom: 10,
        marginTop: 4,
        letterSpacing: "-0.01em",
      }}
    >
      {children}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
  onClick,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: "1 1 calc(50% - 5px)",
        minWidth: 0,
        background: COLORS.card,
        borderRadius: 18,
        padding: "14px 14px",
        boxShadow: "0 1px 3px rgba(16,36,27,0.04), 0 2px 12px rgba(16,36,27,0.04)",
        border: `1px solid ${COLORS.border}`,
        cursor: onClick ? "pointer" : "default",
        textAlign: "left",
        WebkitTapHighlightColor: "transparent",
        transition: "transform 0.15s ease",
      }}
    >
      <div style={{ fontSize: 12, color: COLORS.muted, fontWeight: 500, marginBottom: 8 }}>{label}</div>
      <div
        style={{
          fontSize: 26,
          fontWeight: 700,
          color: color || COLORS.text,
          lineHeight: 1,
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 6 }}>{sub}</div>}
    </button>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  variant = "primary",
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "gold";
}) {
  const styles =
    variant === "primary"
      ? { bg: COLORS.primary, color: "#fff", border: COLORS.primary }
      : variant === "gold"
      ? { bg: "#fff", color: COLORS.gold, border: COLORS.gold }
      : { bg: "#fff", color: COLORS.text, border: COLORS.border };
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "14px 8px",
        borderRadius: 16,
        border: `1.5px solid ${styles.border}`,
        background: styles.bg,
        color: styles.color,
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <Icon size={20} strokeWidth={2} />
      <span style={{ lineHeight: 1.2, textAlign: "center" }}>{label}</span>
    </button>
  );
}

export default function DashboardTab({
  state,
  onOpenTableGen,
  onGoToGuests,
  onGoToTables,
  onGoToBudget,
}: DashboardTabProps) {
  const gTotals = getGuestTotals(state.guests);
  const sTotals = getSeatingTotals(state.tables, state.guests);
  const bTotals = getBudgetTotals(state.budgetItems);
  const unseated = getUnseatedGuests(state.guests);

  const daysToWedding = state.settings.weddingDate
    ? Math.ceil((new Date(state.settings.weddingDate).getTime() - Date.now()) / 86400000)
    : null;

  const paidPct = bTotals.estimated > 0 ? Math.min(100, (bTotals.paid / bTotals.estimated) * 100) : 0;

  return (
    <div style={{ padding: "16px 16px 32px", display: "flex", flexDirection: "column", gap: 18 }}>
      {/* HERO */}
      <div
        style={{
          background: "linear-gradient(135deg, #0F3D2E 0%, #1A5240 100%)",
          borderRadius: 22,
          padding: "22px 22px 20px",
          color: "#fff",
          boxShadow: "0 6px 24px rgba(15,61,46,0.22)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 160,
            height: 160,
            borderRadius: "50%",
            background: "rgba(201,168,90,0.12)",
          }}
        />
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.gold, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
            {plannerText.app.name}
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
              marginBottom: 6,
            }}
          >
            {plannerText.dashboard.title}
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.78)", lineHeight: 1.5, marginBottom: 16 }}>
            {plannerText.dashboard.subtitle}
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <div
              style={{
                padding: "6px 12px",
                borderRadius: 20,
                background: "rgba(255,255,255,0.12)",
                fontSize: 12,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Users size={13} />
              {gTotals.totalPersons} {plannerText.common.guests}
            </div>
            <div
              style={{
                padding: "6px 12px",
                borderRadius: 20,
                background: "rgba(255,255,255,0.12)",
                fontSize: 12,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <LayoutGrid size={13} />
              {state.tables.length} {plannerText.common.tables}
            </div>
            {daysToWedding !== null && daysToWedding >= 0 && (
              <div
                style={{
                  padding: "6px 12px",
                  borderRadius: 20,
                  background: COLORS.gold,
                  color: COLORS.primary,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {daysToWedding} {plannerText.dashboard.daysRemaining}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* WARNINGS */}
      {unseated.length > 0 && (
        <button
          onClick={onGoToTables}
          style={{
            background: "#FFF9EC",
            border: `1px solid ${COLORS.warning}30`,
            borderRadius: 14,
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            cursor: "pointer",
            textAlign: "left",
            width: "100%",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: `${COLORS.warning}1A`,
              color: COLORS.warning,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: COLORS.text }}>
              {unseated.length} {plannerText.warnings.comingGuestsUnseated}
            </div>
            <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>
              {plannerText.warnings.manageSeats}
            </div>
          </div>
          <ArrowRight size={16} color={COLORS.muted} />
        </button>
      )}

      {/* GUESTS */}
      <div>
        <SectionTitle>{plannerText.dashboard.guestStatsTitle}</SectionTitle>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <StatCard
            label={plannerText.dashboard.totalGuests}
            value={gTotals.total}
            sub={`${gTotals.totalPersons} ${plannerText.common.persons}`}
            onClick={onGoToGuests}
          />
          <StatCard
            label={plannerText.dashboard.coming}
            value={gTotals.coming}
            color={COLORS.success}
            sub={`${gTotals.comingPersons} ${plannerText.common.persons}`}
            onClick={onGoToGuests}
          />
          <StatCard
            label={plannerText.dashboard.waiting}
            value={gTotals.waiting}
            color={COLORS.warning}
            onClick={onGoToGuests}
          />
          <StatCard
            label={plannerText.dashboard.notComing}
            value={gTotals.notComing}
            color={COLORS.danger}
            onClick={onGoToGuests}
          />
        </div>
      </div>

      {/* TABLES */}
      <div>
        <SectionTitle>{plannerText.dashboard.tableStatsTitle}</SectionTitle>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <StatCard label={plannerText.dashboard.tables} value={state.tables.length} onClick={onGoToTables} />
          <StatCard
            label={plannerText.dashboard.totalSeats}
            value={sTotals.totalCapacity}
            onClick={onGoToTables}
          />
          <StatCard
            label={plannerText.dashboard.seated}
            value={sTotals.assigned}
            color={sTotals.overCapacity ? COLORS.danger : COLORS.success}
            onClick={onGoToTables}
          />
          <StatCard
            label={plannerText.dashboard.freeSeats}
            value={Math.max(0, sTotals.totalCapacity - sTotals.assigned)}
            color={COLORS.warning}
            onClick={onGoToTables}
          />
        </div>
      </div>

      {/* BUDGET */}
      <div>
        <SectionTitle>{plannerText.dashboard.budgetStatsTitle}</SectionTitle>
        <button
          onClick={onGoToBudget}
          style={{
            width: "100%",
            background: "linear-gradient(135deg, #0F3D2E 0%, #1A5240 100%)",
            borderRadius: 20,
            padding: "20px",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            textAlign: "left",
            boxShadow: "0 4px 18px rgba(15,61,46,0.16)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                {plannerText.dashboard.estimatedBudget}
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 2 }}>
                {formatCurrency(bTotals.estimated)}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                {plannerText.dashboard.paidBudget}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.gold, marginTop: 2 }}>
                {formatCurrency(bTotals.paid)}
              </div>
            </div>
          </div>

          <div style={{ height: 6, borderRadius: 4, background: "rgba(255,255,255,0.15)", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                borderRadius: 4,
                width: `${paidPct}%`,
                background: bTotals.overBudget ? COLORS.danger : COLORS.gold,
                transition: "width 0.4s ease",
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 12 }}>
            <span style={{ color: "rgba(255,255,255,0.78)" }}>
              {plannerText.dashboard.remainingBudget}: {formatCurrency(bTotals.remaining)}
            </span>
            <span style={{ fontWeight: 700, color: COLORS.gold }}>{Math.round(paidPct)}%</span>
          </div>
        </button>
      </div>

      {/* QUICK ACTIONS */}
      <div>
        <SectionTitle>{plannerText.dashboard.quickActionsTitle}</SectionTitle>
        <div style={{ display: "flex", gap: 10 }}>
          <ActionButton icon={UserPlus} label={plannerText.dashboard.addGuest} onClick={onGoToGuests} variant="secondary" />
          <ActionButton icon={Sparkles} label={plannerText.dashboard.generateTables} onClick={onOpenTableGen} variant="primary" />
          <ActionButton icon={Plus} label={plannerText.dashboard.addExpense} onClick={onGoToBudget} variant="secondary" />
        </div>
      </div>
    </div>
  );
}
