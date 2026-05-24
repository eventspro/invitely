import React, { useState } from "react";
import { Download, Upload, Trash2, Users, LayoutGrid, Wallet, CalendarDays } from "lucide-react";
import { plannerText } from "../plannerTextConfig";
import { getGuestTotals, getSeatingTotals, getBudgetTotals, formatCurrency } from "../plannerUtils";
import { exportData, importData, clearData } from "../storage";
import type { PlannerData } from "../types";

interface MoreScreenProps {
  data: PlannerData;
  onUpdate: (data: PlannerData) => void;
  isDemoMode?: boolean;
  onContactUs?: () => void;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  border: "1px solid #E5E7EB",
  borderRadius: 10,
  fontSize: 13,
  color: "#111827",
  background: "#FAFAFA",
  outline: "none",
  boxSizing: "border-box",
};

export default function MoreScreen({ data, onUpdate, isDemoMode = false, onContactUs }: MoreScreenProps) {
  const [settings, setSettings] = useState({ ...data.settings });
  const [saved, setSaved] = useState(false);

  const g = getGuestTotals(data.guests);
  const s = getSeatingTotals(data.tables, data.seats);
  const b = getBudgetTotals(data.budgetItems);

  function handleSaveSettings() {
    const next = { ...data, settings };
    onUpdate(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleImport() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const imported = await importData(file);
        onUpdate(imported);
      } catch {
        alert(plannerText.more.importError);
      }
    };
    input.click();
  }

  function handleReset() {
    if (window.confirm(plannerText.warnings.resetConfirm)) {
      clearData();
      window.location.reload();
    }
  }

  const sectionLabel: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    color: "#9CA3AF",
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    marginBottom: 10,
    marginTop: 20,
  };

  const card: React.CSSProperties = {
    background: "#FFFFFF",
    borderRadius: 16,
    border: "1px solid #E5E7EB",
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(17,24,39,0.04)",
  };

  const settingRow: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 16px",
    borderBottom: "1px solid #F3F4F6",
  };

  const actionRow: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "13px 16px",
    borderBottom: "1px solid #F3F4F6",
    cursor: "pointer",
    background: "transparent",
    border: "none",
    width: "100%",
    textAlign: "left",
  };

  return (
    <div style={{ padding: "12px 16px 80px" }}>

      {/* Demo: Get Full Access card */}
      {isDemoMode && (
        <div style={{
          marginBottom: 20,
          padding: "20px",
          borderRadius: 16,
          background: "linear-gradient(145deg, #0d1e14 0%, #0f2d22 100%)",
          border: "1px solid rgba(216,182,106,0.3)",
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#d8b66a", marginBottom: 6 }}>DEMO VERSION</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#fff8ef", marginBottom: 6 }}>Unlock the Full Planner</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.5, marginBottom: 16 }}>
            Unlimited guests, tables, budget items, seat assignment, export &amp; import — everything for your wedding day.
          </div>
          <button
            onClick={onContactUs}
            style={{
              padding: "10px 20px", borderRadius: 10,
              background: "linear-gradient(135deg, #d8b66a, #c9a030)",
              color: "#0e1e15", border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 700,
            }}
          >
            Contact Us
          </button>
        </div>
      )}
      {/* Summary mini-cards */}
      <div style={sectionLabel}>{plannerText.more.summary}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { icon: Users, label: plannerText.nav.guests, val: `${g.coming}/${g.total}`, sub: `${g.comingPersons} ${plannerText.common.persons}` },
          { icon: LayoutGrid, label: plannerText.nav.tables, val: `${s.assigned}/${s.totalCapacity}`, sub: plannerText.common.seated },
          { icon: Wallet, label: plannerText.more.budgetPaid, val: formatCurrency(b.paid, data.settings.currency), sub: `${b.pct}%` },
          { icon: CalendarDays, label: plannerText.more.items, val: data.budgetItems.length, sub: plannerText.nav.budget },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} style={{ background: "#FFFFFF", borderRadius: 14, padding: "12px 14px", border: "1px solid #E5E7EB" }}>
              <Icon size={16} color="#064E3B" />
              <div style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginTop: 8, lineHeight: 1 }}>{item.val}</div>
              <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 3 }}>{item.label}</div>
            </div>
          );
        })}
      </div>

      {/* Settings */}
      <div style={sectionLabel}>{plannerText.more.settings}</div>
      <div style={card}>
        {[
          { label: plannerText.more.weddingDate, el: <input type="date" style={{ ...inputStyle, width: "auto", maxWidth: 160 }} value={settings.weddingDate} onChange={e => setSettings(s => ({ ...s, weddingDate: e.target.value }))} /> },
          { label: plannerText.more.coupleName, el: <input style={{ ...inputStyle, width: "auto", maxWidth: 160 }} value={settings.coupleName} onChange={e => setSettings(s => ({ ...s, coupleName: e.target.value }))} /> },
          { label: plannerText.more.currency, el: <input style={{ ...inputStyle, width: 60 }} value={settings.currency} maxLength={3} onChange={e => setSettings(s => ({ ...s, currency: e.target.value }))} /> },
          { label: plannerText.more.seatsPerTable, el: <input type="number" min={1} max={40} style={{ ...inputStyle, width: 80 }} value={settings.defaultSeatsPerTable} onChange={e => setSettings(s => ({ ...s, defaultSeatsPerTable: Number(e.target.value) }))} /> },
          { label: plannerText.more.pricePerGuest, el: <input type="number" min={0} style={{ ...inputStyle, width: 100 }} value={settings.restaurantPricePerGuest} onChange={e => setSettings(s => ({ ...s, restaurantPricePerGuest: Number(e.target.value) }))} /> },
        ].map((row, i, arr) => (
          <div key={i} style={{ ...settingRow, borderBottom: i < arr.length - 1 ? "1px solid #F3F4F6" : "none" }}>
            <span style={{ fontSize: 13, color: "#374151" }}>{row.label}</span>
            {row.el}
          </div>
        ))}
      </div>
      <button
        onClick={handleSaveSettings}
        style={{
          width: "100%",
          marginTop: 10,
          padding: "12px",
          borderRadius: 12,
          border: "none",
          background: saved ? "#EAF5EF" : "linear-gradient(135deg, #00472F 0%, #006B4A 100%)",
          color: saved ? "#064E3B" : "#FFFFFF",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          transition: "background 0.2s",
        }}
      >
        {saved ? plannerText.more.saved : plannerText.more.saveSettings}
      </button>

      {/* Data Management — hidden in demo mode */}
      {!isDemoMode && (
        <>
          <div style={sectionLabel}>{plannerText.more.dataManagement}</div>
          <div style={card}>
            <button onClick={() => exportData(data)} style={{ ...actionRow, borderBottom: "1px solid #F3F4F6" }}>
              <Download size={16} color="#064E3B" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{plannerText.more.exportData}</div>
                <div style={{ fontSize: 11, color: "#9CA3AF" }}>{plannerText.more.exportDesc}</div>
              </div>
            </button>
            <button onClick={handleImport} style={{ ...actionRow, borderBottom: "1px solid #F3F4F6" }}>
              <Upload size={16} color="#2563EB" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{plannerText.more.importData}</div>
                <div style={{ fontSize: 11, color: "#9CA3AF" }}>{plannerText.more.importDesc}</div>
              </div>
            </button>
            <button onClick={handleReset} style={{ ...actionRow, borderBottom: "none" }}>
              <Trash2 size={16} color="#E85D5D" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#E85D5D" }}>{plannerText.more.resetData}</div>
                <div style={{ fontSize: 11, color: "#9CA3AF" }}>{plannerText.more.resetDesc}</div>
              </div>
            </button>
          </div>
        </>
      )}

      {/* Prototype note */}
      <div style={{ marginTop: 20, padding: "12px 14px", background: "#F9FAFB", borderRadius: 12, border: "1px solid #E5E7EB" }}>
        <div style={{ fontSize: 11, color: "#9CA3AF", lineHeight: 1.5 }}>
          {plannerText.more.prototypeNote}
        </div>
      </div>
    </div>
  );
}
