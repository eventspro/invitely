import React, { useState, useEffect, useRef } from "react";
import { Download, Upload, Trash2, Users, LayoutGrid, Wallet, CalendarDays, Send } from "lucide-react";
import { usePlannerText } from "../PlannerLocaleContext";
import { getGuestTotals, getSeatingTotals, getBudgetTotals, formatCurrency } from "../plannerUtils";
import { exportData, importData, clearData } from "../storage";
import type { PlannerData } from "../types";

interface MoreScreenProps {
  data: PlannerData;
  onUpdate: (data: PlannerData) => void;
  isDemoMode?: boolean;
  onContactUs?: () => void;
  storageKey?: string;
  token?: string;
  templateId?: string;
}

interface TelegramStatus {
  connected: boolean;
  enabled: boolean;
  connectedAt: string | null;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  border: "1px solid #E5E7EB",
  borderRadius: 10,
  fontSize: 16,
  color: "#111827",
  background: "#FAFAFA",
  outline: "none",
  boxSizing: "border-box",
};

export default function MoreScreen({ data, onUpdate, isDemoMode = false, onContactUs, storageKey, token, templateId }: MoreScreenProps) {
  const pt = usePlannerText();
  const [settings, setSettings] = useState({ ...data.settings });
  const [saved, setSaved] = useState(false);

  // Telegram state
  const isApiMode = !isDemoMode && !!token && !!templateId;
  const [tgStatus, setTgStatus] = useState<TelegramStatus | null>(null);
  const [tgCode, setTgCode] = useState<{ code: string; botUsername: string } | null>(null);
  const [tgLoading, setTgLoading] = useState(false);
  const [tgToast, setTgToast] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isApiMode) return;
    fetchTgStatus();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApiMode]);

  async function fetchTgStatus() {
    try {
      const res = await fetch(`/api/telegram/${templateId}/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json() as TelegramStatus;
        setTgStatus(d);
        if (d.connected) {
          setTgCode(null);
          if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
        }
      }
    } catch { /* silent */ }
  }

  async function handleConnect() {
    setTgLoading(true);
    try {
      const res = await fetch(`/api/telegram/${templateId}/connect-code`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json() as { code: string; botUsername: string };
        setTgCode(d);
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = setInterval(fetchTgStatus, 4000);
        setTimeout(() => {
          if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
        }, 5 * 60 * 1000);
      }
    } catch { /* silent */ }
    setTgLoading(false);
  }

  async function handleTest() {
    setTgLoading(true);
    try {
      const res = await fetch(`/api/telegram/${templateId}/test`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast(res.ok ? pt.telegram.testSent : pt.telegram.testFailed);
    } catch { showToast(pt.telegram.testFailed); }
    setTgLoading(false);
  }

  async function handleDisconnect() {
    if (!window.confirm(pt.telegram.disconnectConfirm)) return;
    setTgLoading(true);
    try {
      await fetch(`/api/telegram/${templateId}/disconnect`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setTgStatus(s => s ? { ...s, connected: false, enabled: false, connectedAt: null } : null);
      setTgCode(null);
    } catch { /* silent */ }
    setTgLoading(false);
  }

  function showToast(msg: string) {
    setTgToast(msg);
    setTimeout(() => setTgToast(null), 3000);
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => { /* noop */ });
  }

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
        alert(pt.more.importError);
      }
    };
    input.click();
  }

  function handleReset() {
    if (window.confirm(pt.warnings.resetConfirm)) {
      clearData(storageKey);
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
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#d8b66a", marginBottom: 6 }}>{pt.more.demoVersion}</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#fff8ef", marginBottom: 6 }}>{pt.more.unlockTitle}</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.5, marginBottom: 16 }}>
            {pt.more.unlockDesc}
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
            {pt.more.contactUs}
          </button>
        </div>
      )}

      {/* Summary mini-cards */}
      <div style={sectionLabel}>{pt.more.summary}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { icon: Users,        label: pt.nav.guests,      val: `${g.coming}/${g.total}`,                     sub: `${g.comingPersons} ${pt.common.persons}` },
          { icon: LayoutGrid,   label: pt.nav.tables,      val: `${s.assigned}/${s.totalCapacity}`,           sub: pt.common.seated },
          { icon: Wallet,       label: pt.more.budgetPaid, val: formatCurrency(b.paid, data.settings.currency), sub: `${b.pct}%` },
          { icon: CalendarDays, label: pt.more.items,      val: data.budgetItems.length,                      sub: pt.nav.budget },
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
      <div style={sectionLabel}>{pt.more.settings}</div>
      <div style={card}>
        {[
          { label: pt.more.weddingDate,   el: <input type="date" style={{ ...inputStyle, width: "auto", maxWidth: 160 }} value={settings.weddingDate} onChange={e => setSettings(s => ({ ...s, weddingDate: e.target.value }))} /> },
          { label: pt.more.coupleName,    el: <input style={{ ...inputStyle, width: "auto", maxWidth: 160 }} value={settings.coupleName} onChange={e => setSettings(s => ({ ...s, coupleName: e.target.value }))} /> },
          { label: pt.more.currency,      el: (
              <select
                style={{ ...inputStyle, width: "auto", minWidth: 90 }}
                value={settings.currency}
                onChange={e => setSettings(s => ({ ...s, currency: e.target.value }))}
              >
                <option value="֏">֏ AMD</option>
                <option value="$">$ USD</option>
                <option value="€">€ EUR</option>
                <option value="₽">₽ RUB</option>
                <option value="£">£ GBP</option>
              </select>
            ) },
          { label: pt.more.seatsPerTable, el: <input type="number" min={1} max={40} style={{ ...inputStyle, width: 80 }} value={settings.defaultSeatsPerTable} onChange={e => setSettings(s => ({ ...s, defaultSeatsPerTable: Number(e.target.value) }))} /> },
          { label: pt.more.pricePerGuest, el: <input type="number" min={0} style={{ ...inputStyle, width: 100 }} value={settings.restaurantPricePerGuest} onChange={e => setSettings(s => ({ ...s, restaurantPricePerGuest: Number(e.target.value) }))} /> },
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
          width: "100%", marginTop: 10, padding: "12px", borderRadius: 12, border: "none",
          background: saved ? "#EAF5EF" : "linear-gradient(135deg, #00472F 0%, #006B4A 100%)",
          color: saved ? "#064E3B" : "#FFFFFF", fontSize: 13, fontWeight: 700,
          cursor: "pointer", transition: "background 0.2s",
        }}
      >
        {saved ? pt.more.saved : pt.more.saveSettings}
      </button>

      {/* ── Telegram Notifications ─────────────────────────────────────────── */}
      {isApiMode && (
        <>
          <div style={sectionLabel}>{pt.telegram.sectionTitle}</div>
          <div style={{ ...card, padding: "16px" }}>

            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: (tgCode || tgStatus?.connected) ? 14 : 0 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{pt.telegram.sectionTitle}</div>
                <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{pt.telegram.sectionDesc}</div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999,
                background: tgStatus?.connected ? "#EAF5EF" : "#F3F4F6",
                color: tgStatus?.connected ? "#064E3B" : "#9CA3AF",
              }}>
                {tgStatus?.connected ? `✓ ${pt.telegram.connected}` : pt.telegram.notConnected}
              </span>
            </div>

            {/* Connected: show connected date + Test / Disconnect */}
            {tgStatus?.connected && (
              <>
                {tgStatus.connectedAt && (
                  <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 12 }}>
                    {pt.telegram.connectedSince} {new Date(tgStatus.connectedAt).toLocaleDateString()}
                  </div>
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={handleTest}
                    disabled={tgLoading}
                    style={{
                      flex: 1, padding: "9px 12px", borderRadius: 10, border: "1px solid #E5E7EB",
                      background: "#FFFFFF", color: "#374151", fontSize: 12, fontWeight: 600,
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                    }}
                  >
                    <Send size={12} /> {pt.telegram.testBtn}
                  </button>
                  <button
                    onClick={handleDisconnect}
                    disabled={tgLoading}
                    style={{
                      flex: 1, padding: "9px 12px", borderRadius: 10, border: "1px solid #FECACA",
                      background: "#FFF5F5", color: "#E85D5D", fontSize: 12, fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    {pt.telegram.disconnectBtn}
                  </button>
                </div>
              </>
            )}

            {/* Not connected, no code: Connect button */}
            {!tgStatus?.connected && !tgCode && (
              <button
                onClick={handleConnect}
                disabled={tgLoading}
                style={{
                  width: "100%", marginTop: 12, padding: "10px 16px", borderRadius: 10, border: "none",
                  background: "linear-gradient(135deg, #00472F 0%, #006B4A 100%)",
                  color: "#FFFFFF", fontSize: 13, fontWeight: 700, cursor: "pointer",
                }}
              >
                {tgLoading ? "..." : pt.telegram.connectBtn}
              </button>
            )}

            {/* Pairing code panel */}
            {tgCode && (
              <div style={{ background: "#F9FAFB", borderRadius: 10, padding: "12px 14px", marginTop: 4 }}>
                <div style={{ fontSize: 12, color: "#374151", marginBottom: 8 }}>
                  {pt.telegram.codeInstructions}
                </div>
                <div style={{
                  fontFamily: "monospace", fontSize: 16, fontWeight: 800, letterSpacing: "0.12em",
                  color: "#064E3B", background: "#EAF5EF", borderRadius: 8, padding: "10px 12px",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <span>CONNECT {tgCode.code}</span>
                  <button
                    onClick={() => handleCopy(`CONNECT ${tgCode.code}`)}
                    style={{
                      border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700,
                      color: "#064E3B", padding: "2px 8px", borderRadius: 6,
                      background: copied ? "#D1FAE5" : "rgba(6,78,59,0.08)",
                    }}
                  >
                    {copied ? pt.telegram.copiedBtn : pt.telegram.copyBtn}
                  </button>
                </div>
                <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 6 }}>
                  @{tgCode.botUsername} · {pt.telegram.expiresIn}
                </div>
                <button
                  onClick={fetchTgStatus}
                  style={{
                    marginTop: 10, width: "100%", padding: "9px", borderRadius: 10,
                    border: "1px solid #064E3B", background: "transparent",
                    color: "#064E3B", fontSize: 12, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  {pt.telegram.refreshBtn}
                </button>
              </div>
            )}

            {/* Toast */}
            {tgToast && (
              <div style={{
                marginTop: 10, padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: "#EAF5EF", color: "#064E3B", textAlign: "center",
              }}>
                {tgToast}
              </div>
            )}
          </div>
        </>
      )}

      {/* Data Management — hidden in demo mode */}
      {!isDemoMode && (
        <>
          <div style={sectionLabel}>{pt.more.dataManagement}</div>
          <div style={card}>
            <button onClick={() => exportData(data)} style={{ ...actionRow, borderBottom: "1px solid #F3F4F6" }}>
              <Download size={16} color="#064E3B" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{pt.more.exportData}</div>
                <div style={{ fontSize: 11, color: "#9CA3AF" }}>{pt.more.exportDesc}</div>
              </div>
            </button>
            <button onClick={handleImport} style={{ ...actionRow, borderBottom: "1px solid #F3F4F6" }}>
              <Upload size={16} color="#2563EB" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{pt.more.importData}</div>
                <div style={{ fontSize: 11, color: "#9CA3AF" }}>{pt.more.importDesc}</div>
              </div>
            </button>
            <button onClick={handleReset} style={{ ...actionRow, borderBottom: "none" }}>
              <Trash2 size={16} color="#E85D5D" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#E85D5D" }}>{pt.more.resetData}</div>
                <div style={{ fontSize: 11, color: "#9CA3AF" }}>{pt.more.resetDesc}</div>
              </div>
            </button>
          </div>
        </>
      )}

      {/* Prototype note */}
      <div style={{ marginTop: 20, padding: "12px 14px", background: "#F9FAFB", borderRadius: 12, border: "1px solid #E5E7EB" }}>
        <div style={{ fontSize: 11, color: "#9CA3AF", lineHeight: 1.5 }}>
          {pt.more.prototypeNote}
        </div>
      </div>
    </div>
  );
}
