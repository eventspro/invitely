import React, { useState } from "react";
import { usePlannerText } from "../PlannerLocaleContext";
import type { Task, TaskPriority, TelegramReminderState } from "../types";
import { uid } from "../plannerUtils";

interface TaskFormProps {
  initial?: Task;
  telegramConnected?: boolean;
  isDemoMode?: boolean;
  onSave: (task: Task) => void;
  onCancel: () => void;
}

const TIMEZONES = [
  { value: "Asia/Yerevan",      label: "Yerevan (UTC+4)" },
  { value: "Europe/Moscow",     label: "Moscow (UTC+3)" },
  { value: "Europe/London",     label: "London (UTC+0/+1)" },
  { value: "Europe/Paris",      label: "Paris (UTC+1/+2)" },
  { value: "America/New_York",  label: "New York (UTC-5/-4)" },
  { value: "America/Los_Angeles", label: "Los Angeles (UTC-8/-7)" },
  { value: "UTC",               label: "UTC" },
];

const REMINDER_BADGE: Partial<Record<TelegramReminderState, { icon: string; color: string }>> = {
  scheduled:  { icon: "🔔", color: "#3B82F6" },
  sent:       { icon: "📤", color: "#6B7280" },
  repeating:  { icon: "🔄", color: "#3B82F6" },
  stopped:    { icon: "🔕", color: "#9CA3AF" },
  completed:  { icon: "✅", color: "#16864A" },
  failed:     { icon: "⚠️", color: "#E85D5D" },
};

function detectTimezone(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Yerevan"; }
  catch { return "Asia/Yerevan"; }
}

export default function TaskForm({ initial, telegramConnected, isDemoMode, onSave, onCancel }: TaskFormProps) {
  const pt = usePlannerText();

  // Derive initial dueAtLocal from either existing dueAtLocal or legacy dueDate
  const initDueAtLocal =
    initial?.dueAtLocal
    ?? (initial?.dueDate ? `${initial.dueDate}T09:00` : "");

  const [form, setForm] = useState({
    title:                  initial?.title    ?? "",
    dueAtLocal:             initDueAtLocal,
    timezone:               initial?.timezone ?? detectTimezone(),
    priority:               (initial?.priority ?? "medium") as TaskPriority,
    notes:                  initial?.notes ?? initial?.description ?? "",
    reminderEnabled:        initial?.reminderEnabled ?? false,
  });

  const PRIORITIES: { key: TaskPriority; label: string; color: string; bg: string }[] = [
    { key: "high",   label: pt.tasks.high,   color: "#E85D5D", bg: "#FEF2F2" },
    { key: "medium", label: pt.tasks.medium, color: "#D7951E", bg: "#FFF3E0" },
    { key: "low",    label: pt.tasks.low,    color: "#3B82F6", bg: "#EFF6FF" },
  ];

  function handleSubmit() {
    if (!form.title.trim()) return;
    const dueDate = form.dueAtLocal ? form.dueAtLocal.slice(0, 10) : undefined;
    onSave({
      id:                     initial?.id ?? uid(),
      done:                   initial?.done ?? false,
      status:                 initial?.status ?? "pending",
      title:                  form.title.trim(),
      dueDate,
      dueAtLocal:             form.dueAtLocal || undefined,
      timezone:               form.timezone,
      priority:               form.priority,
      notes:                  form.notes.trim() || undefined,
      description:            form.notes.trim() || undefined,
      reminderEnabled:        form.dueAtLocal ? form.reminderEnabled : false,
      telegramReminderState:  initial?.telegramReminderState,
    });
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", borderRadius: 10,
    border: "1.5px solid #E5E7EB", fontSize: 16, color: "#111827",
    background: "#FFFFFF", outline: "none",
    fontFamily: "Inter, -apple-system, sans-serif",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: "#374151",
    marginBottom: 6, display: "block",
  };

  const canSubmit = form.title.trim().length > 0;
  const showReminderFields = !!form.dueAtLocal && !isDemoMode;
  const badge = initial?.telegramReminderState
    ? REMINDER_BADGE[initial.telegramReminderState]
    : undefined;
  const badgeLabel = initial?.telegramReminderState
    ? (pt.tasks.reminderBadge as Record<string, string>)[initial.telegramReminderState]
    : undefined;

  return (
    <div style={{ padding: "0 2px 8px" }}>

      {/* Reminder state badge (read-only, only on existing tasks) */}
      {badge && badgeLabel && (
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          background: "#F9FAFB", border: `1px solid ${badge.color}22`,
          borderRadius: 8, padding: "4px 10px", marginBottom: 14,
          fontSize: 12, fontWeight: 600, color: badge.color,
        }}>
          {badge.icon} {badgeLabel}
        </div>
      )}

      {/* Title */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>{pt.tasks.taskTitle}</label>
        <input
          style={inputStyle}
          placeholder={pt.tasks.titlePlaceholder}
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          autoFocus
        />
      </div>

      {/* Date + time */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>{pt.tasks.reminderTime}</label>
        <input
          type="datetime-local"
          style={inputStyle}
          value={form.dueAtLocal}
          onChange={e => setForm(f => ({
            ...f,
            dueAtLocal: e.target.value,
            reminderEnabled: e.target.value ? f.reminderEnabled : false,
          }))}
        />
      </div>

      {/* Timezone (shown when a date is set) */}
      {showReminderFields && (
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>{pt.tasks.timezoneLabel}</label>
          <select
            style={{ ...inputStyle, cursor: "pointer" }}
            value={form.timezone}
            onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
          >
            {TIMEZONES.map(tz => (
              <option key={tz.value} value={tz.value}>{tz.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Priority */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>{pt.tasks.priority}</label>
        <div style={{ display: "flex", gap: 8 }}>
          {PRIORITIES.map(p => (
            <button
              key={p.key}
              onClick={() => setForm(f => ({ ...f, priority: p.key }))}
              style={{
                flex: 1, padding: "9px 0", borderRadius: 10, fontSize: 13, fontWeight: 600,
                border: form.priority === p.key ? `2px solid ${p.color}` : "1.5px solid #E5E7EB",
                background: form.priority === p.key ? p.bg : "#FFFFFF",
                color: form.priority === p.key ? p.color : "#6B7280",
                cursor: "pointer", WebkitTapHighlightColor: "transparent",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div style={{ marginBottom: showReminderFields ? 16 : 24 }}>
        <label style={labelStyle}>{pt.tasks.notes}</label>
        <textarea
          style={{ ...inputStyle, resize: "none", height: 72 }}
          placeholder={pt.tasks.notesPlaceholder}
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
        />
      </div>

      {/* Reminder section (only when date is set and not demo) */}
      {showReminderFields && (
        <div style={{
          background: "#F9FAFB", borderRadius: 12, padding: "14px 14px",
          marginBottom: 16, border: "1px solid #E5E7EB",
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {pt.tasks.reminderSection}
          </div>

          {telegramConnected ? (
            <>
              {/* Toggle */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: form.reminderEnabled ? 12 : 0 }}>
                <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                  {pt.tasks.setReminder}
                </span>
                <button
                  onClick={() => setForm(f => ({ ...f, reminderEnabled: !f.reminderEnabled }))}
                  style={{
                    width: 44, height: 24, borderRadius: 999, border: "none", cursor: "pointer",
                    background: form.reminderEnabled ? "#064E3B" : "#D1D5DB",
                    position: "relative", flexShrink: 0, transition: "background 0.2s",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  <span style={{
                    position: "absolute", top: 2,
                    left: form.reminderEnabled ? 22 : 2,
                    width: 20, height: 20, borderRadius: "50%",
                    background: "#FFFFFF", transition: "left 0.2s",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  }} />
                </button>
              </div>
            </>
          ) : (
            <div style={{
              fontSize: 12, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 6,
            }}>
              ⚠️ {pt.tasks.telegramNotConnected}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1, padding: "12px", borderRadius: 12,
            border: "1.5px solid #E5E7EB", background: "#FFFFFF",
            color: "#374151", fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}
        >
          {pt.common.cancel}
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            flex: 2, padding: "12px", borderRadius: 12, border: "none",
            background: canSubmit
              ? "linear-gradient(135deg, #00472F 0%, #006B4A 100%)"
              : "#E5E7EB",
            color: canSubmit ? "#FFFFFF" : "#9CA3AF",
            fontSize: 14, fontWeight: 700,
            cursor: canSubmit ? "pointer" : "not-allowed",
          }}
        >
          {initial ? pt.common.save : pt.tasks.addTask}
        </button>
      </div>
    </div>
  );
}
