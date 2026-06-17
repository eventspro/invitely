/**
 * SaleWheelAdmin.tsx
 * Platform-admin section for Spin & Win leads.
 * Shows participant list, prize distribution, claimed status, and search/filter.
 */
import React, { useState, useEffect, useCallback } from "react";
import { Loader2, Search, CheckCircle2, XCircle } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Spin {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  weddingDate: string | null;
  prizeKey: string;
  prizeLabel: string;
  claimed: boolean;
  ipAddress: string | null;
  createdAt: string;
}

interface SpinsResponse {
  total: number;
  claimed: number;
  unclaimed: number;
  distribution: Record<string, number>;
  spins: Spin[];
}

interface NotificationSettings {
  enabled: boolean;
  privacy: "minimal" | "masked";
  hasChatId: boolean;
  chatIdMasked: string | null;
}

const PRIZE_EMOJIS: Record<string, string> = {
  discount_10:       "🏷️",
  discount_20:       "🎫",
  admin_panel_free:  "⚙️",
  music_free:        "🎵",
  gallery_free:      "📸",
  all_features:      "✨",
  free_template:     "🎁",
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("hy-AM", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Component ────────────────────────────────────────────────────────────────
export const SaleWheelAdmin: React.FC = () => {
  const [data, setData] = useState<SpinsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [claimedFilter, setClaimedFilter] = useState<"" | "true" | "false">("");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [notificationChatId, setNotificationChatId] = useState("");
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [testingNotifications, setTestingNotifications] = useState(false);

  const authHeaders = useCallback((): Record<string, string> => {
    const token = localStorage.getItem("admin-token") ?? "";
    return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (claimedFilter) params.set("claimed", claimedFilter);

      const res = await fetch(
        `/api/platform-admin/sale-wheel/spins?${params.toString()}`,
        { headers: authHeaders() }
      );
      if (!res.ok) throw new Error("Failed to load");
      const json = await res.json();
      setData(json);
    } catch {
      setError("Չհաջողվեց բեռնել տվյալները:");
    } finally {
      setLoading(false);
    }
  }, [search, claimedFilter, authHeaders]);

  const loadNotificationSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/platform-admin/sale-wheel/notification-settings", {
        headers: authHeaders(),
      });
      if (!res.ok) return;
      const json = await res.json();
      setNotificationSettings(json);
    } catch {
      // Non-fatal: the lead list can still be used.
    }
  }, [authHeaders]);

  useEffect(() => {
    loadData();
    loadNotificationSettings();
  }, [loadData, loadNotificationSettings]);

  const saveNotificationSettings = async () => {
    if (!notificationSettings) return;
    setSavingNotifications(true);
    try {
      const body: Record<string, unknown> = {
        enabled: notificationSettings.enabled,
        privacy: notificationSettings.privacy,
      };
      if (notificationChatId.trim()) body.chatId = notificationChatId.trim();

      const res = await fetch("/api/platform-admin/sale-wheel/notification-settings", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(json.error ?? "Failed to save notification settings");
        return;
      }
      setNotificationSettings(json);
      setNotificationChatId("");
      showToast("Notification settings saved");
    } catch {
      showToast("Failed to save notification settings");
    } finally {
      setSavingNotifications(false);
    }
  };

  const clearNotificationChatId = async () => {
    if (!notificationSettings) return;
    setSavingNotifications(true);
    try {
      const res = await fetch("/api/platform-admin/sale-wheel/notification-settings", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          enabled: false,
          privacy: notificationSettings.privacy,
          clearChatId: true,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(json.error ?? "Failed to clear notification recipient");
        return;
      }
      setNotificationSettings(json);
      setNotificationChatId("");
      showToast("Notification recipient cleared");
    } catch {
      showToast("Failed to clear notification recipient");
    } finally {
      setSavingNotifications(false);
    }
  };

  const sendTestNotification = async () => {
    setTestingNotifications(true);
    try {
      const res = await fetch("/api/platform-admin/sale-wheel/notification-settings/test", {
        method: "POST",
        headers: authHeaders(),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(json.error ?? "Failed to send test notification");
        return;
      }
      showToast("Test notification sent");
    } catch {
      showToast("Failed to send test notification");
    } finally {
      setTestingNotifications(false);
    }
  };

  const toggleClaimed = async (spin: Spin) => {
    setTogglingId(spin.id);
    try {
      const res = await fetch(
        `/api/platform-admin/sale-wheel/spins/${spin.id}/claimed`,
        {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({ claimed: !spin.claimed }),
        }
      );
      if (!res.ok) throw new Error();
      showToast(spin.claimed ? "✅ Marked as unclaimed" : "✅ Marked as claimed");
      await loadData();
    } catch {
      showToast("❌ Failed to update");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">🎡 Spin & Win Leads</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Բոլոր մասնակիցների ցուցակ
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Բեռնում..." : "Թարմացնել"}
        </button>
      </div>

      {notificationSettings && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Telegram notifications</h3>
              <p className="text-xs text-gray-500 mt-1">
                Send a privacy-conscious admin alert after a new wheel spin is saved.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={sendTestNotification}
                disabled={testingNotifications || !notificationSettings.hasChatId}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {testingNotifications ? "Sending..." : "Send test"}
              </button>
              <button
                onClick={saveNotificationSettings}
                disabled={savingNotifications}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {savingNotifications ? "Saving..." : "Save settings"}
              </button>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[160px_1fr_180px]">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={notificationSettings.enabled}
                onChange={(event) =>
                  setNotificationSettings((prev) =>
                    prev ? { ...prev, enabled: event.target.checked } : prev,
                  )
                }
                className="h-4 w-4 rounded border-gray-300 text-indigo-600"
              />
              Enabled
            </label>

            <div>
              <input
                type="password"
                value={notificationChatId}
                onChange={(event) => setNotificationChatId(event.target.value)}
                placeholder={
                  notificationSettings.hasChatId
                    ? "Paste a new Telegram chat ID to replace current recipient"
                    : "Paste Telegram chat ID"
                }
                autoComplete="off"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <p className="mt-1 text-xs text-gray-400">
                Current recipient: {notificationSettings.chatIdMasked ?? "not set"}
              </p>
            </div>

            <select
              value={notificationSettings.privacy}
              onChange={(event) =>
                setNotificationSettings((prev) =>
                  prev
                    ? { ...prev, privacy: event.target.value as "minimal" | "masked" }
                    : prev,
                )
              }
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="masked">Masked</option>
              <option value="minimal">Minimal</option>
            </select>
          </div>

          {notificationSettings.hasChatId && (
            <button
              onClick={clearNotificationChatId}
              disabled={savingNotifications}
              className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
            >
              Clear recipient and disable notifications
            </button>
          )}
        </div>
      )}

      {/* Stat cards */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Ընդհանուր", value: data.total, color: "bg-indigo-50 text-indigo-700", icon: "👥" },
            { label: "Հաստատված", value: data.claimed, color: "bg-green-50 text-green-700", icon: "✅" },
            { label: "Չհաստատված", value: data.unclaimed, color: "bg-amber-50 text-amber-700", icon: "⏳" },
            {
              label: "Մրց. տեսակ",
              value: Object.keys(data.distribution).length,
              color: "bg-purple-50 text-purple-700",
              icon: "🎁",
            },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl p-4 ${s.color} flex items-center gap-3`}>
              <span className="text-2xl">{s.icon}</span>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs font-medium opacity-70">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Prize distribution */}
      {data && Object.keys(data.distribution).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-3 text-sm">Մրցանակների բաշխում</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.distribution).map(([key, count]) => (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
              >
                <span>{PRIZE_EMOJIS[key] ?? "🎁"}</span>
                <span className="text-gray-700 font-medium">{key.replace(/_/g, " ")}</span>
                <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded text-xs font-bold">
                  {count}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Փնտրել անուն, հեռ., էլ. հասցե..."
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <select
          value={claimedFilter}
          onChange={(e) => setClaimedFilter(e.target.value as "" | "true" | "false")}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
        >
          <option value="">Բոլոր կարգավիճակները</option>
          <option value="true">Հաստատված</option>
          <option value="false">Չհաստատված</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-indigo-500" />
        </div>
      )}

      {/* Table */}
      {!loading && data && data.spins.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center text-gray-400 text-sm">
          Ոչ մի մասնակից դեռ չի գրանցվել:
        </div>
      )}

      {!loading && data && data.spins.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Անուն</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Հեռ.</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Էլ. հասցե</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Հարս. ամս.</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Մրցանակ</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Կարգ.</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Ամսաթիվ</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.spins.map((spin) => (
                  <tr key={spin.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{spin.name}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{spin.phone}</td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                      {spin.email ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                      {spin.weddingDate ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium rounded-lg">
                        {PRIZE_EMOJIS[spin.prizeKey] ?? "🎁"} {spin.prizeLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {spin.claimed ? (
                        <span className="inline-flex items-center gap-1 text-green-600 text-xs font-semibold">
                          <CheckCircle2 size={13} /> Հաստ.
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-400 text-xs">
                          <XCircle size={13} /> Ոչ
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell whitespace-nowrap">
                      {fmtDate(spin.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggleClaimed(spin)}
                        disabled={togglingId === spin.id}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                          spin.claimed
                            ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                        }`}
                      >
                        {togglingId === spin.id
                          ? "..."
                          : spin.claimed
                          ? "Հետ վերց."
                          : "Հաստ."}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
