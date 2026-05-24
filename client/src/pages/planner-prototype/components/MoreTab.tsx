import React, { useState, useRef, useEffect } from "react";
import {
  Users,
  LayoutGrid,
  Wallet2,
  CircleDollarSign,
  Pencil,
  X,
  Calendar,
  MapPin,
  Armchair,
  Download,
  Upload,
  RotateCcw,
  Info,
  Check,
} from "lucide-react";
import { plannerText } from "../plannerTextConfig";
import type { PlannerState } from "../types";
import { LS_KEY, RSVP_LABELS } from "../constants";
import { formatCurrency, getGuestTotals, getBudgetTotals, getSeatingTotals } from "../plannerUtils";

interface MoreTabProps {
  state: PlannerState;
  onStateChange: React.Dispatch<React.SetStateAction<PlannerState>>;
}

export default function MoreTab({ state, onStateChange }: MoreTabProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(state.settings);
  const [toast, setToast] = useState<{ msg: string; tone: "ok" | "err" } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(state.settings);
  }, [editing, state.settings]);

  const showToast = (msg: string, tone: "ok" | "err" = "ok") => {
    setToast({ msg, tone });
    setTimeout(() => setToast(null), 2400);
  };

  const guestTotals = getGuestTotals(state.guests);
  const seatTotals = getSeatingTotals(state.tables, state.guests);
  const budgetTotals = getBudgetTotals(state.budgetItems);

  const saveSettings = () => {
    onStateChange((s) => ({ ...s, settings: draft }));
    setEditing(false);
    showToast(plannerText.more.settingsSaved);
  };

  const handleExport = () => {
    try {
      const data = JSON.stringify(state, null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `planner-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(plannerText.more.exportSuccess);
    } catch {
      showToast(plannerText.more.importError, "err");
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as PlannerState;
        if (!parsed || !Array.isArray(parsed.guests)) throw new Error("invalid");
        onStateChange(parsed);
        showToast(plannerText.more.importSuccess);
      } catch {
        showToast(plannerText.more.importError, "err");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleReset = () => {
    if (!confirm(plannerText.more.resetConfirm)) return;
    try {
      localStorage.removeItem(LS_KEY);
    } catch {
      /* ignore */
    }
    location.reload();
  };

  return (
    <div style={{ padding: "20px 16px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "calc(70px + env(safe-area-inset-top, 0px))",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 400,
            padding: "10px 16px",
            borderRadius: 999,
            background: toast.tone === "ok" ? "#1F9D63" : "#D95B5B",
            color: "#FFFFFF",
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "0 6px 24px rgba(0,0,0,0.18)",
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Summary */}
      <section>
        <SectionTitle>{plannerText.more.summaryTitle}</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
          <SummaryCard
            icon={<Users size={16} color="#123C2F" />}
            label={plannerText.guests.title}
            value={String(guestTotals.total)}
            sub={`${guestTotals.coming} ${RSVP_LABELS.coming.toLowerCase()}`}
          />
          <SummaryCard
            icon={<LayoutGrid size={16} color="#123C2F" />}
            label={plannerText.tables.tables}
            value={String(state.tables.length)}
            sub={`${seatTotals.assigned}/${seatTotals.totalCapacity} ${plannerText.common.seats}`}
          />
          <SummaryCard
            icon={<Wallet2 size={16} color="#123C2F" />}
            label={plannerText.budget.title}
            value={formatCurrency(budgetTotals.estimated)}
            sub={plannerText.common.planned}
          />
          <SummaryCard
            icon={<CircleDollarSign size={16} color="#123C2F" />}
            label={plannerText.budget.totalPaid}
            value={formatCurrency(budgetTotals.paid)}
            sub={`${plannerText.budget.totalRemaining}: ${formatCurrency(budgetTotals.remaining)}`}
          />
        </div>
      </section>

      {/* Settings */}
      <section>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#6F766F", letterSpacing: "0.04em", textTransform: "uppercase" }}>
            {plannerText.more.settingsTitle}
          </div>
          {!editing ? (
            <button onClick={() => setEditing(true)} style={chipBtn("#123C2F", "#FFFFFF")}>
              <Pencil size={12} />
              {plannerText.more.editSettings}
            </button>
          ) : (
            <button onClick={() => setEditing(false)} style={chipBtn("#6F766F", "#FFFFFF")}>
              <X size={12} />
              {plannerText.more.cancelSettings}
            </button>
          )}
        </div>

        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 16,
            border: "1px solid #E8DDCB",
            overflow: "hidden",
          }}
        >
          <SettingRow
            icon={<Calendar size={16} color="#123C2F" />}
            label={plannerText.more.weddingDateLabel}
            value={state.settings.weddingDate || "—"}
            editing={editing}
            input={
              <input
                type="date"
                value={draft.weddingDate}
                onChange={(e) => setDraft({ ...draft, weddingDate: e.target.value })}
                style={settingInputStyle}
              />
            }
          />
          <SettingRow
            icon={<MapPin size={16} color="#123C2F" />}
            label={plannerText.more.venueLabel}
            value={state.settings.venueName || "—"}
            editing={editing}
            input={
              <input
                value={draft.venueName}
                onChange={(e) => setDraft({ ...draft, venueName: e.target.value })}
                style={settingInputStyle}
              />
            }
          />
          <SettingRow
            icon={<CircleDollarSign size={16} color="#123C2F" />}
            label={plannerText.more.pricePerGuestLabel}
            value={formatCurrency(state.settings.restaurantPricePerGuest)}
            editing={editing}
            input={
              <input
                type="number"
                min={0}
                value={draft.restaurantPricePerGuest || ""}
                onChange={(e) => setDraft({ ...draft, restaurantPricePerGuest: parseInt(e.target.value) || 0 })}
                style={settingInputStyle}
              />
            }
          />
          <SettingRow
            icon={<Armchair size={16} color="#123C2F" />}
            label={plannerText.more.defaultSeatsLabel}
            value={String(state.settings.defaultSeatsPerTable)}
            editing={editing}
            input={
              <input
                type="number"
                min={1}
                max={20}
                value={draft.defaultSeatsPerTable || ""}
                onChange={(e) => setDraft({ ...draft, defaultSeatsPerTable: parseInt(e.target.value) || 8 })}
                style={settingInputStyle}
              />
            }
            last
          />
        </div>

        {editing && (
          <button
            onClick={saveSettings}
            style={{
              marginTop: 10,
              width: "100%",
              padding: "12px 16px",
              borderRadius: 14,
              border: "none",
              background: "linear-gradient(135deg,#123C2F 0%,#1F5A45 100%)",
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              boxShadow: "0 4px 14px rgba(18,60,47,0.25)",
            }}
          >
            <Check size={14} strokeWidth={2.5} />
            {plannerText.more.saveSettings}
          </button>
        )}
      </section>

      {/* Data management */}
      <section>
        <SectionTitle>{plannerText.more.dataManagementTitle}</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button onClick={handleExport} style={dataBtnStyle("#FFFFFF", "#10241B", "#E8DDCB")}>
            <Download size={16} color="#123C2F" />
            <span>{plannerText.more.exportJson}</span>
          </button>
          <label style={{ ...dataBtnStyle("#FFFFFF", "#10241B", "#E8DDCB"), cursor: "pointer" }}>
            <Upload size={16} color="#123C2F" />
            <span>{plannerText.more.importJson}</span>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              onChange={handleImport}
              style={{ display: "none" }}
            />
          </label>
          <button onClick={handleReset} style={dataBtnStyle("#FFFFFF", "#D95B5B", "#F3CFCF")}>
            <RotateCcw size={16} color="#D95B5B" />
            <span>{plannerText.more.resetPlanner}</span>
          </button>
        </div>
      </section>

      {/* About */}
      <section
        style={{
          background: "linear-gradient(135deg,#E8F3ED 0%,#FBF7EF 100%)",
          borderRadius: 16,
          padding: 16,
          border: "1px solid #E8DDCB",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <Info size={14} color="#123C2F" />
          <div style={{ fontSize: 13, fontWeight: 700, color: "#10241B" }}>{plannerText.more.aboutTitle}</div>
        </div>
        <div style={{ fontSize: 12, color: "#6F766F", lineHeight: 1.5 }}>
          {plannerText.more.aboutNote} {plannerText.more.aboutFuture}
        </div>
      </section>
    </div>
  );
}

/* ─────────────────────────────  Helpers  ───────────────────────────── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 12,
        fontWeight: 700,
        color: "#6F766F",
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 14,
        padding: "12px 14px",
        border: "1px solid #E8DDCB",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        {icon}
        <div style={{ fontSize: 11, color: "#6F766F", fontWeight: 600 }}>{label}</div>
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: "#10241B", letterSpacing: "-0.02em" }}>{value}</div>
      <div style={{ fontSize: 11, color: "#6F766F", marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function SettingRow({
  icon,
  label,
  value,
  editing,
  input,
  last,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  editing: boolean;
  input: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      style={{
        padding: "12px 14px",
        borderBottom: last ? "none" : "1px solid #F0E8D6",
        display: "flex",
        flexDirection: "column",
        gap: editing ? 8 : 4,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {icon}
        <div style={{ fontSize: 12, color: "#6F766F", fontWeight: 600 }}>{label}</div>
      </div>
      {editing ? (
        input
      ) : (
        <div style={{ fontSize: 14, fontWeight: 600, color: "#10241B", paddingLeft: 24 }}>{value}</div>
      )}
    </div>
  );
}

const settingInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #E8DDCB",
  background: "#FBF7EF",
  fontSize: 13.5,
  color: "#10241B",
  outline: "none",
};

const chipBtn = (bg: string, fg: string): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: 4,
  padding: "5px 10px",
  borderRadius: 999,
  border: "none",
  background: bg,
  color: fg,
  fontSize: 11.5,
  fontWeight: 600,
  cursor: "pointer",
});

const dataBtnStyle = (bg: string, color: string, border: string): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: 10,
  width: "100%",
  padding: "12px 14px",
  borderRadius: 14,
  border: `1px solid ${border}`,
  background: bg,
  color,
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  textAlign: "left",
});
