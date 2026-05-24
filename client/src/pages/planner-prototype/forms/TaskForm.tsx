import React, { useState } from "react";
import { usePlannerText } from "../PlannerLocaleContext";
import type { Task, TaskPriority } from "../types";
import { uid } from "../plannerUtils";

interface TaskFormProps {
  initial?: Task;
  onSave: (task: Task) => void;
  onCancel: () => void;
}

export default function TaskForm({ initial, onSave, onCancel }: TaskFormProps) {
  const pt = usePlannerText();
  const [form, setForm] = useState({
    title:    initial?.title    ?? "",
    dueDate:  initial?.dueDate  ?? "",
    priority: (initial?.priority ?? "medium") as TaskPriority,
    notes:    initial?.notes    ?? "",
  });

  const PRIORITIES: { key: TaskPriority; label: string; color: string; bg: string }[] = [
    { key: "high",   label: pt.tasks.high,   color: "#E85D5D", bg: "#FEF2F2" },
    { key: "medium", label: pt.tasks.medium, color: "#D7951E", bg: "#FFF3E0" },
    { key: "low",    label: pt.tasks.low,    color: "#3B82F6", bg: "#EFF6FF" },
  ];

  function handleSubmit() {
    if (!form.title.trim()) return;
    onSave({
      id:       initial?.id ?? uid(),
      done:     initial?.done ?? false,
      title:    form.title.trim(),
      dueDate:  form.dueDate || undefined,
      priority: form.priority,
      notes:    form.notes.trim() || undefined,
    });
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", borderRadius: 10,
    border: "1.5px solid #E5E7EB", fontSize: 14, color: "#111827",
    background: "#FFFFFF", outline: "none",
    fontFamily: "Inter, -apple-system, sans-serif",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: "#374151",
    marginBottom: 6, display: "block",
  };

  const canSubmit = form.title.trim().length > 0;

  return (
    <div style={{ padding: "0 2px 8px" }}>
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

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>{pt.tasks.dueDate}</label>
        <input
          type="date"
          style={inputStyle}
          value={form.dueDate}
          onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
        />
      </div>

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

      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>{pt.tasks.notes}</label>
        <textarea
          style={{ ...inputStyle, resize: "none", height: 72 }}
          placeholder={pt.tasks.notesPlaceholder}
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
        />
      </div>

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
