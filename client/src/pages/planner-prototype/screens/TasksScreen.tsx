import React, { useState } from "react";
import { Check, Trash2, Pencil, ClipboardList, Clock, CheckCircle2 } from "lucide-react";
import { usePlannerText } from "../PlannerLocaleContext";
import { formatDate } from "../plannerUtils";
import type { Task, TaskPriority, TelegramReminderState } from "../types";

const REMINDER_BADGE: Partial<Record<TelegramReminderState, { icon: string; color: string }>> = {
  scheduled:  { icon: "🔔", color: "#3B82F6" },
  sent:       { icon: "📤", color: "#6B7280" },
  repeating:  { icon: "🔄", color: "#3B82F6" },
  stopped:    { icon: "🔕", color: "#9CA3AF" },
  completed:  { icon: "✅", color: "#16864A" },
  failed:     { icon: "⚠️", color: "#E85D5D" },
};

interface TasksScreenProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onEdit: (task: Task) => void;
}

type Filter = "all" | "pending" | "done";

export default function TasksScreen({ tasks, onToggle, onDelete, onAdd, onEdit }: TasksScreenProps) {
  const pt = usePlannerText();

  const PRIORITY_STYLE: Record<TaskPriority, { bg: string; color: string; label: string }> = {
    high:   { bg: "#FEF2F2", color: "#E85D5D", label: pt.tasks.high },
    medium: { bg: "#FFF3E0", color: "#D7951E", label: pt.tasks.medium },
    low:    { bg: "#EFF6FF", color: "#3B82F6", label: pt.tasks.low },
  };

  const [filter, setFilter] = useState<Filter>("all");

  const pending  = tasks.filter(t => !t.done);
  const done     = tasks.filter(t => t.done);
  const filtered = filter === "all" ? tasks : filter === "pending" ? pending : done;

  const FILTERS: { key: Filter; label: string; count: number }[] = [
    { key: "all",     label: pt.tasks.all,     count: tasks.length },
    { key: "pending", label: pt.tasks.pending,  count: pending.length },
    { key: "done",    label: pt.tasks.done,     count: done.length },
  ];

  // ── Shared styles ────────────────────────────────────────────────────────
  const cardStyle: React.CSSProperties = {
    background: "#FFFFFF", borderRadius: 14, border: "1px solid #E5E7EB",
    padding: "14px 14px", marginBottom: 10,
    boxShadow: "0 4px 16px rgba(17,24,39,0.05)",
  };

  const addBtn = (
    <button
      onClick={onAdd}
      style={{
        width: "100%", padding: "15px", borderRadius: 16, border: "none",
        background: "linear-gradient(135deg, #00472F 0%, #006B4A 100%)",
        color: "#FFFFFF", fontSize: 15, fontWeight: 700, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        boxShadow: "0 4px 16px rgba(6,78,59,0.25)",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      + {pt.tasks.addTask}
    </button>
  );

  const filterChips = (
    <div className="pp-chip-scroll" style={{ display: "flex", gap: 8, marginBottom: 16 }}>
      {FILTERS.map(f => {
        const active = filter === f.key;
        return (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "7px 14px", borderRadius: 999, cursor: "pointer",
              background: active ? "#064E3B" : "#FFFFFF",
              color: active ? "#FFFFFF" : "#6B7280",
              fontSize: 13, fontWeight: active ? 700 : 500, flexShrink: 0,
              boxShadow: active ? "0 2px 8px rgba(6,78,59,0.25)" : "none",
              border: active ? "2px solid transparent" : "1px solid #E5E7EB",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {f.label}
            <span style={{
              fontSize: 11, fontWeight: 700,
              background: active ? "rgba(255,255,255,0.2)" : "#F3F4F6",
              color: active ? "#FFFFFF" : "#9CA3AF",
              borderRadius: 999, padding: "0 6px", minWidth: 18, textAlign: "center",
            }}>
              {f.count}
            </span>
          </button>
        );
      })}
    </div>
  );

  const emptyState = (
    <div style={{ textAlign: "center", padding: "48px 24px" }}>
      <div style={{
        width: 64, height: 64, borderRadius: "50%", background: "#EAF5EF",
        display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
      }}>
        <ClipboardList size={28} color="#064E3B" strokeWidth={1.5} />
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 6 }}>
        {filter === "done" ? pt.tasks.noTasksDone : pt.tasks.noTasks}
      </div>
      <div style={{ fontSize: 13, color: "#9CA3AF", marginBottom: filter === "done" ? 0 : 24 }}>
        {filter === "done" ? pt.tasks.noTasksDoneDesc : pt.tasks.noTasksDesc}
      </div>
      {filter !== "done" && (
        <button
          onClick={onAdd}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "10px 20px", borderRadius: 12, border: "none",
            background: "linear-gradient(135deg, #00472F 0%, #006B4A 100%)",
            color: "#FFFFFF", fontSize: 14, fontWeight: 700, cursor: "pointer",
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> {pt.tasks.addTask}
        </button>
      )}
    </div>
  );

  const taskList = (
    <div>
      {filtered.length === 0 ? emptyState : filtered.map(task => {
        const prio = PRIORITY_STYLE[task.priority];
        return (
          <div key={task.id} style={cardStyle}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              {/* Checkbox */}
              <button
                onClick={() => onToggle(task.id)}
                style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
                  border: task.done ? "none" : "1.5px solid #D1D5DB",
                  background: task.done ? "#064E3B" : "transparent",
                  cursor: "pointer", display: "flex", alignItems: "center",
                  justifyContent: "center", padding: 0,
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                {task.done && <Check size={12} color="#FFFFFF" strokeWidth={2.5} />}
              </button>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 14, fontWeight: 600, lineHeight: 1.4,
                  color: task.done ? "#9CA3AF" : "#111827",
                  textDecoration: task.done ? "line-through" : "none",
                }}>
                  {task.title}
                </div>
                <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, marginTop: 5 }}>
                  {(task.dueDate || task.dueAtLocal) && (
                    <span style={{ fontSize: 11, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 3 }}>
                      <Clock size={10} color="#9CA3AF" />
                      {formatDate((task.dueAtLocal ?? task.dueDate)!.slice(0, 10))}
                    </span>
                  )}
                  {task.telegramReminderState && REMINDER_BADGE[task.telegramReminderState] && (() => {
                    const b = REMINDER_BADGE[task.telegramReminderState!]!;
                    const badgeLabel = (pt.tasks.reminderBadge as Record<string, string>)[task.telegramReminderState!];
                    return (
                      <span style={{
                        fontSize: 10, fontWeight: 600, color: b.color,
                        display: "inline-flex", alignItems: "center", gap: 3,
                        background: `${b.color}15`, borderRadius: 6, padding: "2px 6px",
                      }}>
                        {b.icon} {badgeLabel}
                      </span>
                    );
                  })()}
                  <span style={{
                    fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                    background: prio.bg, color: prio.color,
                    textTransform: "uppercase", letterSpacing: "0.04em",
                  }}>
                    {prio.label}
                  </span>
                </div>
                {task.notes && (
                  <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4, lineHeight: 1.4 }}>
                    {task.notes}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                <button
                  onClick={() => onEdit(task)}
                  style={{
                    border: "none", background: "transparent", cursor: "pointer",
                    color: "#9CA3AF", padding: 4, WebkitTapHighlightColor: "transparent",
                  }}
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => { if (window.confirm(pt.tasks.deleteConfirm)) onDelete(task.id); }}
                  style={{
                    border: "none", background: "transparent", cursor: "pointer",
                    color: "#D1D5DB", padding: 4, WebkitTapHighlightColor: "transparent",
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const mobileStatStrip = (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
      {[
        { label: pt.tasks.totalTasks, value: tasks.length,   color: "#111827" },
        { label: pt.tasks.pending,    value: pending.length, color: "#D7951E" },
        { label: pt.tasks.done,       value: done.length,    color: "#16864A" },
      ].map(s => (
        <div key={s.label} style={{
          background: "#FFFFFF", borderRadius: 12, border: "1px solid #E5E7EB",
          padding: "12px 10px", textAlign: "center",
          boxShadow: "0 4px 16px rgba(17,24,39,0.05)",
        }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
          <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 500, marginTop: 4 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      {/* ── Mobile ── */}
      <div className="pp-mobile-view pp-page-pad pp-screen-bottom">
        {mobileStatStrip}
        {filterChips}
        {taskList}
        {tasks.length > 0 && <div style={{ marginTop: 16 }}>{addBtn}</div>}
      </div>

      {/* ── Desktop ── */}
      <div className="pp-desktop-view pp-page-pad">
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111827", margin: "0 0 4px", letterSpacing: "-0.03em" }}>
            {pt.tasks.title}
          </h1>
          <p style={{ fontSize: 14, color: "#6B7280", margin: 0 }}>{pt.tasks.subtitle}</p>
        </div>

        {/* Desktop stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
          {[
            { label: pt.tasks.totalTasks, value: tasks.length,   color: "#111827", iconBg: "#F3F4F6", Icon: ClipboardList, iconColor: "#6B7280" },
            { label: pt.tasks.pending,    value: pending.length, color: "#D7951E", iconBg: "#FFF3E0", Icon: Clock,          iconColor: "#D7951E" },
            { label: pt.tasks.done,       value: done.length,    color: "#16864A", iconBg: "#E6F4EC", Icon: CheckCircle2,   iconColor: "#16864A" },
          ].map(s => (
            <div key={s.label} style={{
              background: "#FFFFFF", borderRadius: 16, border: "1px solid #E5E7EB",
              padding: "18px 20px", boxShadow: "0 4px 16px rgba(17,24,39,0.05)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: s.iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <s.Icon size={18} color={s.iconColor} strokeWidth={1.75} />
                </div>
                <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500 }}>{s.label}</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {filterChips}
        {taskList}
        {tasks.length > 0 && <div style={{ marginTop: 24, maxWidth: 360 }}>{addBtn}</div>}
      </div>
    </>
  );
}
