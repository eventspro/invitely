import React from "react";
import { Users, LayoutGrid, Wallet, CheckSquare, ArrowRight, Building, UtensilsCrossed, Camera, Sparkles, Music, Package, Check, type LucideIcon } from "lucide-react";
import { plannerText } from "../plannerTextConfig";
import { getGuestTotals, getSeatingTotals, getBudgetTotals, formatCurrency, daysUntil, formatDate } from "../plannerUtils";
import DonutChart from "../components/DonutChart";
import CircularProgress from "../components/CircularProgress";
import ProgressBar from "../components/ProgressBar";
import type { PlannerData, TabId } from "../types";

// ─── Category icon map ────────────────────────────────────────────────────────────────────────────────────────────────
const CAT_ICONS: Record<string, LucideIcon> = {
  venue: Building, catering: UtensilsCrossed, restaurant: UtensilsCrossed,
  photo: Camera, photographer: Camera, videographer: Camera,
  decor: Sparkles, decorations: Sparkles, flowers: Sparkles,
  music: Music, other: Package, invitations: Package, website: Package,
  host: Package, lighting: Sparkles,
};

// â”€â”€â”€ Status pill config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  const { settings, guests, tables, seats, budgetItems, tasks: allTasks } = data;
  const previewTasks = allTasks.slice(0, 4);
  const g   = getGuestTotals(guests);
  const s   = getSeatingTotals(tables, seats);
  const b   = getBudgetTotals(budgetItems);
  const days = daysUntil(settings.weddingDate);
  const firstName = settings.coupleName.split(/\s*&\s*|\s+and\s+/i)[0].trim().split(" ")[0];
  const recentBudget = [...budgetItems].reverse().slice(0, 4);

  const donutSegments = [
    { value: g.coming,            color: "#2F8F5B", label: plannerText.dashboard.coming    },
    { value: g.waiting,           color: "#E7B23B", label: plannerText.dashboard.waiting   },
    { value: g.notComing,         color: "#EF6A62", label: plannerText.dashboard.notComing },
    { value: g.invited + g.maybe, color: "#D1D5DB", label: plannerText.dashboard.noResponse},
  ].filter(x => x.value > 0);

  function toggleTask(id: string) {
    onToggleTask?.(id);
  }

  // â”€â”€ Shared styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Stat cards (desktop only) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const statCards = [
    { value: g.total,       label: plannerText.dashboard.totalGuests, Icon: Users,       tab: "guests"  as TabId, link: plannerText.dashboard.viewGuests  },
    { value: tables.length, label: plannerText.dashboard.tables,      Icon: LayoutGrid,  tab: "tables"  as TabId, link: plannerText.dashboard.viewTables  },
    { value: s.assigned,    label: plannerText.dashboard.seated,      Icon: CheckSquare, tab: "tables"  as TabId, link: plannerText.dashboard.viewSeating },
    { value: formatCurrency(b.planned, settings.currency), label: plannerText.dashboard.totalBudget, Icon: Wallet, tab: "budget" as TabId, link: plannerText.dashboard.viewBudget },
  ];

  // â”€â”€ Guest Overview card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const guestCard = (desktop: boolean) => (
    <div style={card}>
      <div style={desktop ? cardPad : mCardPad}>
        <div style={desktop ? cardH : mCardH}>{plannerText.dashboard.guestOverview}</div>
        {donutSegments.length > 0
          ? <DonutChart segments={donutSegments} total={g.total} centerLabel={String(g.total)} centerSub="Total" size={desktop ? 130 : 120} />
          : <div style={{ textAlign: "center", color: "#9CA3AF", fontSize: 13, padding: "24px 0" }}>{plannerText.dashboard.noGuests}</div>
        }
        <button style={desktop ? linkBtn : mLinkBtn} onClick={() => onNavigate?.("guests")}>
          {plannerText.dashboard.seeAllGuests} <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );

  // â”€â”€ Seating Overview card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const seatingCard = (desktop: boolean) => (
    <div style={card}>
      <div style={desktop ? cardPad : mCardPad}>
        <div style={desktop ? cardH : mCardH}>{plannerText.dashboard.seatingOverview}</div>
        <div style={{ display: "flex", alignItems: "center", gap: desktop ? 22 : 18 }}>
          <CircularProgress pct={s.pct} size={desktop ? 104 : 92} strokeWidth={10} color="#064E3B" label={`${s.pct}%`} sublabel="Seated" />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: plannerText.dashboard.totalSeats, val: s.totalCapacity },
              { label: plannerText.dashboard.seated,     val: s.assigned      },
              { label: plannerText.dashboard.freeSeats,  val: s.free          },
            ].map((row, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: desktop ? 13 : 12, color: "#6B7280" }}>{row.label}</span>
                <span style={{ fontSize: desktop ? 14 : 13, fontWeight: 700, color: "#111827" }}>{row.val}</span>
              </div>
            ))}
          </div>
        </div>
        <button style={desktop ? linkBtn : mLinkBtn} onClick={() => onNavigate?.("tables")}>
          {plannerText.dashboard.viewFloorPlan} <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );

  // â”€â”€ Budget Overview card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const budgetCard = (desktop: boolean) => (
    <div style={card}>
      <div style={desktop ? cardPad : mCardPad}>
        <div style={desktop ? cardH : mCardH}>{plannerText.dashboard.budgetOverview}</div>
        <div style={{ marginBottom: 4 }}>
          <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>{plannerText.dashboard.totalBudget}</div>
          <div style={{ fontSize: desktop ? 30 : 26, fontWeight: 700, color: "#111827", letterSpacing: "-0.03em", lineHeight: 1.1 }}>{formatCurrency(b.planned, settings.currency)}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", margin: "14px 0 10px" }}>
          <div>
            <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 3 }}>{plannerText.dashboard.paid}</div>
            <div style={{ fontSize: desktop ? 17 : 15, fontWeight: 700, color: "#16864A" }}>{formatCurrency(b.paid, settings.currency)}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 3 }}>{plannerText.dashboard.remaining}</div>
            <div style={{ fontSize: desktop ? 17 : 15, fontWeight: 700, color: "#D7951E" }}>{formatCurrency(b.remaining, settings.currency)}</div>
          </div>
        </div>
        <ProgressBar pct={b.pct} color="#064E3B" height={8} />
        <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6 }}>{b.pct}% {plannerText.budget.ofBudget}</div>
        <button style={desktop ? linkBtn : mLinkBtn} onClick={() => onNavigate?.("budget")}>
          {plannerText.dashboard.viewBudget} <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );

  // â”€â”€ Upcoming Tasks card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const tasksCard = (desktop: boolean) => (
    <div style={card}>
      <div style={desktop ? cardPad : mCardPad}>
        <div style={desktop ? cardH : mCardH}>{plannerText.dashboard.upcomingTasks}</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {previewTasks.map((task, i) => (
            <div key={task.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", ...(i < previewTasks.length - 1 ? divider : {}) }}>
              <button
                onClick={() => toggleTask(task.id)}
                aria-label={task.done ? "Mark incomplete" : "Mark complete"}
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
          {plannerText.dashboard.seeAllTasks} <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );

  // â”€â”€ Recent Budget Items card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const expensesCard = (desktop: boolean) => (
    <div style={card}>
      <div style={desktop ? cardPad : mCardPad}>
        <div style={desktop ? cardH : mCardH}>{plannerText.dashboard.recentBudgetItems}</div>
        {recentBudget.length === 0 ? (
          <div style={{ color: "#9CA3AF", fontSize: 13, padding: "8px 0" }}>{plannerText.dashboard.noGuests}</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {recentBudget.map((item, i) => {
              const IconComp: LucideIcon = CAT_ICONS[item.category] ?? Package;
              const pill = STATUS_PILL[item.status] ?? STATUS_PILL.planned;
              const pillLabel = plannerText.budgetStatus[item.status as keyof typeof plannerText.budgetStatus] ?? item.status;
              const catLabel  = plannerText.budget.categories[item.category as keyof typeof plannerText.budget.categories] ?? item.category;
              return (
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", ...(i < recentBudget.length - 1 ? divider : {}) }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "#EAF5EF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <IconComp size={16} color="#064E3B" strokeWidth={1.75} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: desktop ? 14 : 13, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>{catLabel}</div>
                  </div>
                  <div style={{ fontSize: desktop ? 14 : 13, fontWeight: 700, color: "#111827", flexShrink: 0, marginRight: 8 }}>{formatCurrency(item.plannedCost, settings.currency)}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: pill.color, background: pill.bg, borderRadius: 6, padding: "3px 8px", flexShrink: 0, whiteSpace: "nowrap" }}>{pillLabel}</div>
                </div>
              );
            })}
          </div>
        )}
        <button style={desktop ? linkBtn : mLinkBtn} onClick={() => onNavigate?.("budget")}>
          {plannerText.dashboard.viewAllExpenses} <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  return (
    <div>
      {/* â•â•â•â•â•â• MOBILE VIEW â•â•â•â•â•â• */}
      <div className="pp-mobile-view" style={{ paddingBottom: 90 }}>
        {/* Hero card */}
        <div style={{ padding: "14px 14px 0" }}>
          <div style={{ background: "linear-gradient(135deg, #00472F 0%, #006B4A 100%)", borderRadius: 20, padding: "20px 18px 22px", position: "relative", overflow: "hidden", boxShadow: "0 8px 28px rgba(0,71,47,0.22)" }}>
            <div style={{ position: "absolute", top: -40, right: -40, width: 170, height: 170, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: -32, left: -32, width: 130, height: 130, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />
            <div style={{ position: "relative" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: 6 }}>{plannerText.dashboard.weddingOverview}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.02em", marginBottom: 2 }}>{settings.coupleName}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 20 }}>
                {formatDate(settings.weddingDate)}
                {days >= 0 && <span style={{ color: "#D7B56D", fontWeight: 600 }}> Â· {days} {plannerText.dashboard.daysLeft}</span>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { val: g.total,       lbl: plannerText.dashboard.totalGuests },
                  { val: tables.length, lbl: plannerText.dashboard.tables      },
                  { val: s.assigned,    lbl: plannerText.dashboard.seated      },
                  { val: formatCurrency(b.planned, settings.currency), lbl: plannerText.dashboard.totalBudget },
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

      {/* â•â•â•â•â•â• DESKTOP VIEW â•â•â•â•â•â• */}
      <div className="pp-desktop-view">
        <div className="pp-page-pad">
          {/* Welcome heading */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 30, fontWeight: 700, color: "#111827", letterSpacing: "-0.03em", margin: 0, lineHeight: 1.2, fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif" }}>
              {plannerText.dashboard.welcomePrefix} {firstName}
            </h1>
            <p style={{ fontSize: 15, color: "#6B7280", margin: "6px 0 0", fontWeight: 400 }}>{plannerText.app.greetingSub}</p>
          </div>

          {/* 4 stat cards */}
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

          {/* 3 overview cards */}
          <div className="pp-overview-grid" style={{ gap: 16, marginBottom: 20 }}>
            {guestCard(true)}
            {seatingCard(true)}
            {budgetCard(true)}
          </div>

          {/* 2 bottom cards */}
          <div className="pp-lower-grid" style={{ gap: 16 }}>
            {tasksCard(true)}
            {expensesCard(true)}
          </div>
        </div>
      </div>
    </div>
  );
}
