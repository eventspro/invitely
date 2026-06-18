import React from "react";
import { Users, LayoutGrid, Wallet, CheckSquare, ArrowRight, Building, UtensilsCrossed, Camera, Sparkles, Music, Package, Check, type LucideIcon } from "lucide-react";
import { usePlannerText } from "../PlannerLocaleContext";
import { getGuestTotals, getSeatingTotals, getBudgetTotals, formatCurrency, daysUntil, formatDate } from "../plannerUtils";
import DonutChart from "../components/DonutChart";
import CircularProgress from "../components/CircularProgress";
import ProgressBar from "../components/ProgressBar";
import type { PlannerData, TabId } from "../types";

const CAT_ICONS: Record<string, LucideIcon> = {
  venue: Building, catering: UtensilsCrossed, restaurant: UtensilsCrossed,
  photo: Camera, photographer: Camera, videographer: Camera,
  decor: Sparkles, decorations: Sparkles, flowers: Sparkles,
  music: Music, other: Package, invitations: Package, website: Package,
  host: Package, lighting: Sparkles,
};

const STATUS_PILL: Record<string, { bg: string; color: string }> = {
  paid:           { bg: "#E6F4EC", color: "#16864A" },
  partially_paid: { bg: "#FFF3E0", color: "#D7951E" },
  deposit_paid:   { bg: "#EBF3FF", color: "#2563EB" },
  planned:        { bg: "#F3F4F6", color: "#6B7280" },
  overdue:        { bg: "#FEF2F2", color: "#E85D5D" },
  cancelled:      { bg: "#F3F4F6", color: "#9CA3AF" },
};

interface DashboardScreenProps {
  data: PlannerData;
  onNavigate?: (tab: TabId) => void;
  onViewTasks?: () => void;
  onToggleTask?: (id: string) => void;
}

export default function DashboardScreen({ data, onNavigate, onViewTasks, onToggleTask }: DashboardScreenProps) {
  const pt = usePlannerText();
  const { settings, guests, tables, seats, budgetItems, tasks: allTasks } = data;
  const previewTasks = allTasks.slice(0, 4);
  const g   = getGuestTotals(guests);
  const s   = getSeatingTotals(tables, seats);
  const b   = getBudgetTotals(budgetItems);
  const budgetCap = settings.totalBudget > 0 ? settings.totalBudget : b.planned;
  const budgetRemaining = Math.max(0, budgetCap - b.paid);
  const budgetPct = budgetCap > 0 ? Math.round((b.paid / budgetCap) * 100) : 0;
  const days = daysUntil(settings.weddingDate);
  const firstName = settings.coupleName.split(/\s*&\s*|\s+and\s+/i)[0].trim().split(" ")[0];
  const recentBudget = [...budgetItems].reverse().slice(0, 4);

  const donutSegments = [
    { value: g.coming,            color: "#2F8F5B", label: pt.dashboard.coming    },
    { value: g.waiting,           color: "#E7B23B", label: pt.dashboard.waiting   },
    { value: g.notComing,         color: "#EF6A62", label: pt.dashboard.notComing },
    { value: g.invited + g.maybe, color: "#D1D5DB", label: pt.dashboard.noResponse},
  ].filter(x => x.value > 0);

  function toggleTask(id: string) {
    onToggleTask?.(id);
  }

  const card: React.CSSProperties = {
    background: "#FFFFFF",
    borderRadius: 18,
    border: "1px solid #E5E7EB",
    boxShadow: "0 8px 24px rgba(17,24,39,0.06)",
    overflow: "hidden",
  };
  const cardPad  : React.CSSProperties = { padding: "20px 24px 20px" };
  const mCardPad : React.CSSProperties = { padding: "16px 16px 16px" };
  const cardH    : React.CSSProperties = { fontSize: 16, fontWeight: 600, color: "#111827", marginBottom: 18, letterSpacing: "-0.01em" };
  const mCardH   : React.CSSProperties = { fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 14 };
  const linkBtn  : React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 600, color: "#064E3B", cursor: "pointer", border: "none", background: "transparent", padding: 0, marginTop: 16, WebkitTapHighlightColor: "transparent" };
  const mLinkBtn : React.CSSProperties = { ...linkBtn, fontSize: 12, marginTop: 12 };
  const divider  : React.CSSProperties = { borderBottom: "1px solid #F3F4F6" };

  const statCards = [
    { value: g.total,       label: pt.dashboard.totalGuests, Icon: Users,       tab: "guests"  as TabId, link: pt.dashboard.viewGuests  },
    { value: tables.length, label: pt.dashboard.tables,      Icon: LayoutGrid,  tab: "tables"  as TabId, link: pt.dashboard.viewTables  },
    { value: s.assigned,    label: pt.dashboard.seated,      Icon: CheckSquare, tab: "tables"  as TabId, link: pt.dashboard.viewSeating },
    { value: formatCurrency(budgetCap, settings.currency + " "), label: pt.dashboard.totalBudget + " ", Icon: Wallet, tab: "budget" as TabId, link: pt.dashboard.viewBudget },
  ];

  const guestCard = (desktop: boolean) => (
    <div style={card}>
      <div style={desktop ? cardPad : mCardPad}>
        <div style={desktop ? cardH : mCardH}>{pt.dashboard.guestOverview}</div>
        {donutSegments.length > 0
          ? <DonutChart segments={donutSegments} total={g.total} centerLabel={String(g.total)} centerSub={pt.common.total} size={desktop ? 130 : 120} />
          : <div style={{ textAlign: "center", color: "#9CA3AF", fontSize: 13, padding: "24px 0" }}>{pt.dashboard.noGuests}</div>
        }
        <button style={desktop ? linkBtn : mLinkBtn} onClick={() => onNavigate?.("guests")}>
          {pt.dashboard.seeAllGuests} <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );

  const seatingCard = (desktop: boolean) => (
    <div style={card}>
      <div style={desktop ? cardPad : mCardPad}>
        <div style={desktop ? cardH : mCardH}>{pt.dashboard.seatingOverview}</div>
        <div style={{ display: "flex", alignItems: "center", gap: desktop ? 22 : 18 }}>
          <CircularProgress pct={s.pct} size={desktop ? 104 : 92} strokeWidth={10} color="#064E3B" label={`${s.pct}%`} sublabel={pt.common.seated} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: pt.dashboard.totalSeats, val: s.totalCapacity },
              { label: pt.dashboard.seated,     val: s.assigned      },
              { label: pt.dashboard.freeSeats,  val: s.free          },
            ].map((row, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: desktop ? 13 : 12, color: "#6B7280" }}>{row.label}</span>
                <span style={{ fontSize: desktop ? 14 : 13, fontWeight: 700, color: "#111827" }}>{row.val}</span>
              </div>
            ))}
          </div>
        </div>
        <button style={desktop ? linkBtn : mLinkBtn} onClick={() => onNavigate?.("tables")}>
          {pt.dashboard.viewFloorPlan} <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );

  const budgetCard = (desktop: boolean) => (
    <div style={card}>
      <div style={desktop ? cardPad : mCardPad}>
        <div style={desktop ? cardH : mCardH}>{pt.dashboard.budgetOverview}</div>
        <div style={{ marginBottom: 4 }}>
          <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>{pt.dashboard.totalBudget + " "}</div>
          <div style={{ fontSize: desktop ? 30 : 26, fontWeight: 700, color: "#111827", letterSpacing: "-0.03em", lineHeight: 1.1 }}>{formatCurrency(budgetCap, settings.currency + " ")}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", margin: "14px 0 10px" }}>
          <div>
            <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 3 }}>{pt.dashboard.paid}</div>
            <div style={{ fontSize: desktop ? 17 : 15, fontWeight: 700, color: "#16864A" }}>{formatCurrency(b.paid, settings.currency + " ")}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 3 }}>{pt.dashboard.remaining}</div>
            <div style={{ fontSize: desktop ? 17 : 15, fontWeight: 700, color: "#D7951E" }}>{formatCurrency(budgetRemaining, settings.currency + " ")}</div>
          </div>
        </div>
        <ProgressBar pct={budgetPct} color="#064E3B" height={8} />
        <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6 }}>{budgetPct}% {pt.budget.ofBudget}</div>
        <button style={desktop ? linkBtn : mLinkBtn} onClick={() => onNavigate?.("budget")}>
          {pt.dashboard.viewBudget} <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );

  const tasksCard = (desktop: boolean) => (
    <div style={card}>
      <div style={desktop ? cardPad : mCardPad}>
        <div style={desktop ? cardH : mCardH}>{pt.dashboard.upcomingTasks}</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {previewTasks.map((task, i) => (
            <div key={task.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", ...(i < previewTasks.length - 1 ? divider : {}) }}>
              <button
                onClick={() => toggleTask(task.id)}
                aria-label={task.done ? pt.tasks.markIncomplete : pt.tasks.markComplete}
                style={{ width: 18, height: 18, borderRadius: 4, border: task.done ? "none" : "1.5px solid #D1D5DB", background: task.done ? "#064E3B" : "transparent", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, transition: "background 0.15s" }}
              >
                {task.done && <Check size={11} color="#FFFFFF" strokeWidth={2.5} />}
              </button>
              <div style={{ flex: 1, fontSize: desktop ? 14 : 13, color: task.done ? "#9CA3AF" : "#111827", textDecoration: task.done ? "line-through" : "none", fontWeight: task.done ? 400 : 500 }}>
                {task.title}
              </div>
              <div style={{ fontSize: 12, color: "#9CA3AF", flexShrink: 0 }}>{task.dueDate ? formatDate(task.dueDate) : ""}</div>
            </div>
          ))}
        </div>
        <button style={desktop ? linkBtn : mLinkBtn} onClick={() => onViewTasks?.()}>
          {pt.dashboard.seeAllTasks} <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );

  const expensesCard = (desktop: boolean) => (
    <div style={card}>
      <div style={desktop ? cardPad : mCardPad}>
        <div style={desktop ? cardH : mCardH}>{pt.dashboard.recentBudgetItems}</div>
        {recentBudget.length === 0 ? (
          <div style={{ color: "#9CA3AF", fontSize: 13, padding: "8px 0" }}>{pt.dashboard.noGuests}</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {recentBudget.map((item, i) => {
              const IconComp: LucideIcon = CAT_ICONS[item.category] ?? Package;
              const pill = STATUS_PILL[item.status] ?? STATUS_PILL.planned;
              const pillLabel = pt.budgetStatus[item.status as keyof typeof pt.budgetStatus] ?? item.status;
              const catLabel  = pt.budget.categories[item.category as keyof typeof pt.budget.categories] ?? item.category;
              return (
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", ...(i < recentBudget.length - 1 ? divider : {}) }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "#EAF5EF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <IconComp size={16} color="#064E3B" strokeWidth={1.75} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: desktop ? 14 : 13, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>{catLabel}</div>
                  </div>
                  <div style={{ fontSize: desktop ? 14 : 13, fontWeight: 700, color: "#111827", flexShrink: 0, marginRight: 8 }}>{formatCurrency(item.plannedCost, settings.currency + " ")}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: pill.color, background: pill.bg, borderRadius: 6, padding: "3px 8px", flexShrink: 0, whiteSpace: "nowrap" }}>{pillLabel}</div>
                </div>
              );
            })}
          </div>
        )}
        <button style={desktop ? linkBtn : mLinkBtn} onClick={() => onNavigate?.("budget")}>
          {pt.dashboard.viewAllExpenses} <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );

  return (
    <div>
      {/* ───── MOBILE VIEW ───── */}
      <div className="pp-mobile-view" style={{ paddingBottom: 90 }}>
        {/* Hero card */}
        <div style={{ padding: "14px 14px 0" }}>
          <div style={{ background: "linear-gradient(135deg, #00472F 0%, #006B4A 100%)", borderRadius: 20, padding: "20px 18px 22px", position: "relative", overflow: "hidden", boxShadow: "0 8px 28px rgba(0,71,47,0.22)" }}>
            <div style={{ position: "absolute", top: -40, right: -40, width: 170, height: 170, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: -32, left: -32, width: 130, height: 130, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />
            <div style={{ position: "relative" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: 6 }}>{pt.dashboard.weddingOverview}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.02em", marginBottom: 2 }}>{settings.coupleName}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 20 }}>
                {formatDate(settings.weddingDate)}
                {days >= 0 && <span style={{ color: "#D7B56D", fontWeight: 600 }}> · {days} {pt.dashboard.daysLeft}</span>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { val: g.total,       lbl: pt.dashboard.totalGuests },
                  { val: tables.length, lbl: pt.dashboard.tables      },
                  { val: s.assigned,    lbl: pt.dashboard.seated      },
                  { val: formatCurrency(budgetCap, settings.currency + " "), lbl: pt.dashboard.totalBudget + " " },
                ].map((item, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.12)", borderRadius: 12, padding: "12px 12px" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#FFFFFF", lineHeight: 1 }}>{item.val}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>{item.lbl}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Mobile stacked cards */}
        <div style={{ padding: "14px 14px 0", display: "flex", flexDirection: "column", gap: 14 }}>
          {guestCard(false)}
          {seatingCard(false)}
          {budgetCard(false)}
          {recentBudget.length > 0 && expensesCard(false)}
          {tasksCard(false)}
        </div>
      </div>

      {/* ───── DESKTOP VIEW ───── */}
      <div className="pp-desktop-view">
        <div className="pp-page-pad">
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 30, fontWeight: 700, color: "#111827", letterSpacing: "-0.03em", margin: 0, lineHeight: 1.2, fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif" }}>
              {pt.dashboard.welcomePrefix} {firstName}
            </h1>
            <p style={{ fontSize: 15, color: "#6B7280", margin: "6px 0 0", fontWeight: 400 }}>{pt.app.greetingSub}</p>
          </div>

          <div className="pp-stat-grid" style={{ gap: 16, marginBottom: 20 }}>
            {statCards.map((st, i) => {
              const Icon = st.Icon;
              return (
                <div key={i} style={{ ...card, padding: "20px 22px 18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                    <div>
                      <div style={{ fontSize: 32, fontWeight: 700, color: "#111827", letterSpacing: "-0.04em", lineHeight: 1 }}>{st.value}</div>
                      <div style={{ fontSize: 13, color: "#6B7280", marginTop: 6, fontWeight: 500 }}>{st.label}</div>
                    </div>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#EAF5EF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={20} color="#064E3B" strokeWidth={1.75} />
                    </div>
                  </div>
                  <button
                    style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 600, color: "#064E3B", cursor: "pointer", border: "none", background: "transparent", padding: 0 }}
                    onClick={() => onNavigate?.(st.tab)}
                  >
                    {st.link} <ArrowRight size={13} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="pp-overview-grid" style={{ gap: 16, marginBottom: 20 }}>
            {guestCard(true)}
            {seatingCard(true)}
            {budgetCard(true)}
          </div>

          <div className="pp-lower-grid" style={{ gap: 16 }}>
            {tasksCard(true)}
            {expensesCard(true)}
          </div>
        </div>
      </div>
    </div>
  );
}
