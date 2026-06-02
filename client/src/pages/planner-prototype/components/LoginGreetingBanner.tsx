import React, { useEffect, useRef } from "react";
import { X, AlertCircle, Clock, Calendar, Check, ArrowRight } from "lucide-react";
import { usePlannerText, usePlannerLocale } from "../PlannerLocaleContext";
import PlannerAssistantAvatar from "./PlannerAssistantAvatar";
import type { Task } from "../types";

// ─── CSS injection ────────────────────────────────────────────────────────────

const STYLE_ID = "pp-greeting-styles";

function injectGreetingStyles() {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = `
    @keyframes ppFadeUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes ppAvatarPop {
      0%   { transform: scale(0.5); opacity: 0; }
      65%  { transform: scale(1.1); opacity: 1; }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes ppAvatarFloat {
      0%, 100% { transform: translateY(0px); }
      50%      { transform: translateY(-5px); }
    }
    @keyframes ppRowIn {
      from { opacity: 0; transform: translateX(-10px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @media (prefers-reduced-motion: reduce) {
      .pp-greet-card  { animation: none !important; opacity: 1 !important; }
      .pp-greet-avatar { animation: none !important; transform: none !important; }
      .pp-greet-row   { animation: none !important; opacity: 1 !important; }
    }
  `;
  document.head.appendChild(el);
}

// ─── Responsive hook ──────────────────────────────────────────────────────────

function useIsDesktop(breakpoint = 720) {
  const [isDesktop, setIsDesktop] = React.useState(
    typeof window !== "undefined" ? window.innerWidth >= breakpoint : false
  );
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${breakpoint}px)`);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);
  return isDesktop;
}

// ─── Due-status helpers ───────────────────────────────────────────────────────

type DueStatus = "overdue" | "today" | "upcoming" | "nodate";

function getDueStatus(task: Task): DueStatus {
  const ref = task.dueAtUtc ?? (task.dueDate ? `${task.dueDate}T00:00:00Z` : null);
  if (!ref) return "nodate";
  const due = new Date(ref);
  const now = new Date();
  if (due < now) return "overdue";
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  if (due <= todayEnd) return "today";
  return "upcoming";
}

function formatDueDisplay(task: Task, status: DueStatus, locale: "en" | "hy"): string {
  const loc = locale === "hy" ? "hy-AM" : "en-US";
  const ref = task.dueAtLocal ?? task.dueAtUtc ?? (task.dueDate ? `${task.dueDate}T00:00:00` : null);
  if (!ref) return "";
  const d = new Date(ref);
  if (status === "overdue") {
    return d.toLocaleDateString(loc, { month: "short", day: "numeric" });
  }
  if (status === "today") {
    const h = d.getHours(), m = d.getMinutes();
    if (h === 0 && m === 0) return "";
    return d.toLocaleTimeString(loc, { hour: "numeric", minute: "2-digit" });
  }
  // upcoming
  const datePart = d.toLocaleDateString(loc, { month: "short", day: "numeric" });
  const h = d.getHours(), m = d.getMinutes();
  if (h === 0 && m === 0) return datePart;
  const timePart = d.toLocaleTimeString(loc, { hour: "numeric", minute: "2-digit" });
  return `${datePart} · ${timePart}`;
}

const STATUS_ORDER: Record<DueStatus, number> = { overdue: 0, today: 1, upcoming: 2, nodate: 3 };

export function getGreetingTasks(tasks: Task[]): Task[] {
  const pending = tasks.filter(t => t.status === "pending" && !t.done);
  return [...pending]
    .sort((a, b) => {
      const sa = STATUS_ORDER[getDueStatus(a)];
      const sb = STATUS_ORDER[getDueStatus(b)];
      if (sa !== sb) return sa - sb;
      const pa = a.priority === "high" ? 0 : a.priority === "medium" ? 1 : 2;
      const pb = b.priority === "high" ? 0 : b.priority === "medium" ? 1 : 2;
      return pa - pb;
    })
    .slice(0, 3);
}

// ─── Greeting text builder ────────────────────────────────────────────────────

function buildGreetingNode(template: string, name: string | undefined, count: number): React.ReactNode {
  const withName = name ? template.replace("{{name}}", name) : template;
  const parts = withName.split("{{count}}");
  if (parts.length === 2) {
    return (
      <>
        {parts[0]}
        <span style={{ fontWeight: 800, color: "#111827" }}>{count}</span>
        {parts[1]}
      </>
    );
  }
  return withName.replace("{{count}}", String(count));
}

// ─── Component ────────────────────────────────────────────────────────────────

interface LoginGreetingBannerProps {
  tasks: Task[];
  firstName?: string;
  onDismiss: () => void;
  onViewTasks: () => void;
  onMarkDone: (taskId: string) => void;
}

export default function LoginGreetingBanner({
  tasks,
  firstName,
  onDismiss,
  onViewTasks,
  onMarkDone,
}: LoginGreetingBannerProps) {
  const pt = usePlannerText();
  const { locale } = usePlannerLocale();
  const g = pt.tasksGreeting;
  const isDesktop = useIsDesktop();

  useEffect(() => { injectGreetingStyles(); }, []);

  const pending = tasks.filter(t => t.status === "pending" && !t.done);
  if (pending.length === 0) return null;

  const top   = getGreetingTasks(tasks);
  const extra = pending.length - top.length;

  const overdueCount  = pending.filter(t => getDueStatus(t) === "overdue").length;
  const todayCount    = pending.filter(t => getDueStatus(t) === "today").length;
  const upcomingCount = pending.filter(t => getDueStatus(t) === "upcoming").length;

  const isUrgent    = overdueCount > 0;
  const accentColor = isUrgent ? "#DC2626" : "#00472F";
  const accentGrad  = isUrgent
    ? "linear-gradient(90deg,#DC2626,#EF4444)"
    : "linear-gradient(90deg,#00472F,#006B4A)";

  const name          = firstName?.trim() || "";
  const greetingNode  = buildGreetingNode(
    name ? g.greetingWithName : g.genericGreeting,
    name || undefined,
    pending.length,
  );

  const attnParts: string[] = [];
  if (overdueCount  > 0) attnParts.push(g.overdueSummary.replace("{{count}}", String(overdueCount)));
  if (todayCount    > 0) attnParts.push(g.todaySummary.replace("{{count}}", String(todayCount)));
  if (upcomingCount > 0) attnParts.push(g.pendingSummary.replace("{{count}}", String(upcomingCount)));
  const attentionLine = attnParts.join(" · ");

  type StatusCfg = { color: string; bg: string; border: string; Icon: React.ElementType };
  const STATUS_CFG: Record<DueStatus, StatusCfg> = {
    overdue:  { color: "#DC2626", bg: "#FEF2F2", border: "#FCA5A5", Icon: AlertCircle },
    today:    { color: "#D7951E", bg: "#FFF7ED", border: "#FCD34D", Icon: Clock       },
    upcoming: { color: "#2563EB", bg: "#EFF6FF", border: "#93C5FD", Icon: Calendar    },
    nodate:   { color: "#9CA3AF", bg: "#F9FAFB", border: "#E5E7EB", Icon: Calendar    },
  };
  const STATUS_LABEL: Record<DueStatus, string> = {
    overdue:  g.overdue,
    today:    g.today,
    upcoming: g.upcoming,
    nodate:   g.noDate,
  };

  // ── Sub-elements ─────────────────────────────────────────────────────────────

  const avatarEl = (avatarSize: number) => (
    <PlannerAssistantAvatar
      size={avatarSize}
      notificationDot={isUrgent}
      className="pp-greet-avatar"
      style={{
        flexShrink: 0,
        animation: "ppAvatarPop 0.6s cubic-bezier(0.22,1,0.36,1) both, ppAvatarFloat 3.2s ease-in-out 0.9s infinite",
      }}
    />
  );

  const taskRows = top.map((task, i) => {
    const status = getDueStatus(task);
    const cfg    = STATUS_CFG[status];
    const Icon   = cfg.Icon;
    const dueDisplay = formatDueDisplay(task, status, locale);
    return (
      <div
        key={task.id}
        className="pp-greet-row"
        style={{
          display: "flex", alignItems: "center", gap: 9,
          padding: "9px 11px", borderRadius: 12,
          background: cfg.bg, border: `1px solid ${cfg.border}`,
          animation: `ppRowIn 0.35s ease-out ${0.18 + i * 0.09}s both`,
        }}
      >
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}>
          <Icon size={14} color={cfg.color} strokeWidth={2} />
        </div>
        <span style={{
          flex: 1, fontSize: 13, fontWeight: 600, color: "#111827",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0,
        }}>
          {task.title}
        </span>
        {dueDisplay && (
          <span style={{ fontSize: 11, color: cfg.color, fontWeight: 600, flexShrink: 0 }}>
            {dueDisplay}
          </span>
        )}
        <span style={{
          fontSize: 10, fontWeight: 700, color: cfg.color, background: "#FFFFFF",
          border: `1px solid ${cfg.border}`, borderRadius: 6, padding: "2px 7px",
          flexShrink: 0, letterSpacing: "0.04em", whiteSpace: "nowrap",
        }}>
          {STATUS_LABEL[status]}
        </span>
        <button
          onClick={() => onMarkDone(task.id)}
          title={g.markDone}
          style={{
            flexShrink: 0, border: "none", background: "transparent",
            cursor: "pointer", padding: 3, borderRadius: 6, color: "#9CA3AF",
            display: "flex", alignItems: "center",
          }}
        >
          <Check size={15} strokeWidth={2.5} />
        </button>
      </div>
    );
  });

  const moreEl = extra > 0 ? (
    <div style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500, paddingLeft: 4 }}>
      {g.moreTasks.replace("{{count}}", String(extra))}
    </div>
  ) : null;

  const headerTextEl = (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontSize: 10, fontWeight: 800, letterSpacing: "0.11em",
        textTransform: "uppercase", color: accentColor, marginBottom: 4,
      }}>
        {g.assistantLabel}
      </div>
      <div style={{ fontSize: isDesktop ? 17 : 15, fontWeight: 700, color: "#374151", lineHeight: 1.35 }}>
        {greetingNode}
      </div>
      {attentionLine && (
        <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 500, marginTop: 3 }}>
          {attentionLine}
        </div>
      )}
    </div>
  );

  const primaryBtn = (
    <button
      onClick={onViewTasks}
      style={{
        width: "100%", padding: "11px 16px", borderRadius: 12, border: "none",
        background: `linear-gradient(135deg,${accentColor} 0%,#006B4A 100%)`,
        color: "#FFFFFF", fontSize: 14, fontWeight: 700, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        whiteSpace: "nowrap",
      }}
    >
      {g.viewTasks} <ArrowRight size={14} strokeWidth={2.5} />
    </button>
  );

  const secondaryBtn = top.length > 0 ? (
    <button
      onClick={() => onMarkDone(top[0].id)}
      style={{
        width: "100%", padding: "10px 16px", borderRadius: 12,
        border: "1.5px solid #E5E7EB", background: "#FAFAFA",
        color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
        whiteSpace: "nowrap",
      }}
    >
      <Check size={13} strokeWidth={2.5} color="#16864A" />
      {g.markFirstDone}
    </button>
  ) : null;

  const dismissBtn = (
    <button
      onClick={onDismiss}
      style={{
        border: "none", background: "transparent", cursor: "pointer",
        color: "#9CA3AF", fontSize: 12, fontWeight: 500, padding: "4px 0",
        display: "block", width: "100%", textAlign: "center",
      }}
    >
      {g.dismiss}
    </button>
  );

  const cardBase: React.CSSProperties = {
    background: "#FFFFFF",
    borderRadius: 20,
    border: "1px solid #E5E7EB",
    boxShadow: isUrgent
      ? "0 6px 28px rgba(220,38,38,0.12)"
      : "0 6px 28px rgba(6,78,59,0.10)",
    overflow: "hidden",
  };

  // ── Mobile layout ─────────────────────────────────────────────────────────

  if (!isDesktop) {
    return (
      <div
        className="pp-greet-card"
        style={{ ...cardBase, animation: "ppFadeUp 0.4s ease-out both" }}
      >
        <div style={{ height: 4, background: accentGrad }} />
        <div style={{ padding: "16px 16px 14px" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
            {avatarEl(54)}
            {headerTextEl}
            <button
              onClick={onDismiss}
              style={{
                border: "none", background: "transparent", cursor: "pointer",
                padding: 4, color: "#9CA3AF", flexShrink: 0, borderRadius: 6,
              }}
            >
              <X size={16} strokeWidth={2} />
            </button>
          </div>

          {/* Task rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 14 }}>
            {taskRows}
            {moreEl}
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {primaryBtn}
            {secondaryBtn}
            {dismissBtn}
          </div>
        </div>
      </div>
    );
  }

  // ── Desktop layout ────────────────────────────────────────────────────────

  return (
    <div
      className="pp-greet-card"
      style={{ ...cardBase, animation: "ppFadeUp 0.4s ease-out both" }}
    >
      <div style={{ height: 4, background: accentGrad }} />
      <div style={{ padding: "20px 24px", display: "flex", alignItems: "flex-start", gap: 20 }}>
        {/* Avatar */}
        <div style={{ flexShrink: 0, paddingTop: 2 }}>
          {avatarEl(72)}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {headerTextEl}
          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 14 }}>
            {taskRows}
            {moreEl}
          </div>
        </div>

        {/* Buttons */}
        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 8, minWidth: 170 }}>
          {/* Close X */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 2 }}>
            <button
              onClick={onDismiss}
              style={{
                border: "none", background: "transparent", cursor: "pointer",
                padding: 4, color: "#9CA3AF", borderRadius: 6,
              }}
            >
              <X size={16} strokeWidth={2} />
            </button>
          </div>
          {primaryBtn}
          {secondaryBtn}
          {dismissBtn}
        </div>
      </div>
    </div>
  );
}
