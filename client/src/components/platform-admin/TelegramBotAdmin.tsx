/**
 * TelegramBotAdmin
 *
 * Platform-admin section for configuring Telegram bot commands and responses.
 * Read from / written to /api/platform-admin/telegram-bot/* endpoints.
 *
 * Security:
 * - Uses the same admin-token from localStorage as the rest of PlatformAdminPanel.
 * - Bot token is NEVER shown or passed through this component.
 * - URL button values are validated on the server.
 */

import React, { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface BotButton {
  id?: string;
  label: string;
  type: "url" | "command";
  value: string;
  orderIndex: number;
}

interface BotCommand {
  id: string;
  command: string;
  title: string;
  responseText: string;
  enabled: boolean;
  orderIndex: number;
  buttons: BotButton[];
}

interface BotUser {
  id: string;
  telegramUserId: string;
  telegramChatId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  languageCode: string | null;
  isConnectedCustomer: boolean;
  customerId: string | null;
  templateId: string | null;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  customerEmail: string | null;
  customerFirstName: string | null;
  customerLastName: string | null;
  templateName: string | null;
  templateSlug: string | null;
}

interface BotUsersResponse {
  total: number;
  connected: number;
  unconnected: number;
  users: BotUser[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const inputCls =
  "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";
const btnPrimary =
  "px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50";
const btnSecondary =
  "px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all";
const btnDanger =
  "px-3 py-1.5 bg-red-50 text-red-600 text-xs font-medium rounded-lg hover:bg-red-100 active:scale-95 transition-all";

function authHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("admin-token") ?? ""}`,
  };
}

const EMPTY_COMMAND: Omit<BotCommand, "id"> = {
  command: "/",
  title: "",
  responseText: "",
  enabled: true,
  orderIndex: 0,
  buttons: [],
};

// ─── Component ────────────────────────────────────────────────────────────────
export const TelegramBotAdmin: React.FC = () => {
  const [commands, setCommands] = useState<BotCommand[]>([]);
  const [fallback, setFallback] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  // Edit modal state
  const [editTarget, setEditTarget] = useState<BotCommand | null>(null);
  const [editForm, setEditForm] = useState<Omit<BotCommand, "id">>(EMPTY_COMMAND);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Preview panel
  const [previewCommand, setPreviewCommand] = useState<BotCommand | null>(null);

  // Fallback edit
  const [editingFallback, setEditingFallback] = useState(false);
  const [fallbackDraft, setFallbackDraft] = useState("");
  const [savingFallback, setSavingFallback] = useState(false);

  // ─── Bot users state ──────────────────────────────────────────────────────────
  const [usersData, setUsersData] = useState<BotUsersResponse | null>(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState<"all" | "connected" | "unconnected">("all");
  const [userSearchInput, setUserSearchInput] = useState("");

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  }, []);

  // ─── Load data ───────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [cRes, sRes] = await Promise.all([
        fetch("/api/platform-admin/telegram-bot/commands", { headers: authHeaders() }),
        fetch("/api/platform-admin/telegram-bot/settings", { headers: authHeaders() }),
      ]);

      if (!cRes.ok || !sRes.ok) {
        setError("Failed to load Telegram bot configuration.");
        return;
      }

      const [cmds, settings] = await Promise.all([cRes.json(), sRes.json()]);
      setCommands(cmds ?? []);
      setFallback(settings?.fallbackMessage ?? "");
    } catch {
      setError("Network error. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async (search: string, status: string) => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100", offset: "0" });
      if (search.trim()) params.set("search", search.trim());
      if (status !== "all") params.set("status", status);
      const res = await fetch(`/api/platform-admin/telegram-bot/users?${params}`, { headers: authHeaders() });
      if (res.ok) {
        setUsersData(await res.json());
      }
    } catch {
      // Non-fatal
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadUsers("", "all");
  }, [loadData, loadUsers]);

  // ─── Open edit modal ──────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditTarget(null);
    setEditForm({ ...EMPTY_COMMAND, orderIndex: commands.length });
    setFormError("");
  };

  const openEdit = (cmd: BotCommand) => {
    setEditTarget(cmd);
    setEditForm({
      command: cmd.command,
      title: cmd.title,
      responseText: cmd.responseText,
      enabled: cmd.enabled,
      orderIndex: cmd.orderIndex,
      buttons: cmd.buttons.map((b) => ({ ...b })),
    });
    setFormError("");
  };

  // ─── Button helpers ───────────────────────────────────────────────────────────
  const addButton = () => {
    setEditForm((prev) => ({
      ...prev,
      buttons: [
        ...prev.buttons,
        { label: "", type: "url", value: "https://", orderIndex: prev.buttons.length },
      ],
    }));
  };

  const updateButton = (idx: number, field: keyof BotButton, value: string) => {
    setEditForm((prev) => {
      const buttons = prev.buttons.map((b, i) =>
        i === idx ? { ...b, [field]: value } : b,
      );
      return { ...prev, buttons };
    });
  };

  const removeButton = (idx: number) => {
    setEditForm((prev) => ({
      ...prev,
      buttons: prev.buttons.filter((_, i) => i !== idx),
    }));
  };

  // ─── Save command ─────────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      const isNew = editTarget === null;
      const url = isNew
        ? "/api/platform-admin/telegram-bot/commands"
        : `/api/platform-admin/telegram-bot/commands/${editTarget!.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify({
          command: editForm.command.trim(),
          title: editForm.title.trim(),
          responseText: editForm.responseText.trim(),
          enabled: editForm.enabled,
          orderIndex: editForm.orderIndex,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error ?? "Failed to save command");
        return;
      }

      const commandId: string = data.id;

      // Save buttons
      const btnsRes = await fetch(
        `/api/platform-admin/telegram-bot/commands/${commandId}/buttons`,
        {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify({
            buttons: editForm.buttons.map((b, i) => ({
              label: b.label.trim(),
              type: b.type,
              value: b.value.trim(),
              orderIndex: i,
            })),
          }),
        },
      );

      if (!btnsRes.ok) {
        const bd = await btnsRes.json().catch(() => ({}));
        setFormError(bd.error ?? "Command saved but buttons failed to save");
        await loadData();
        return;
      }

      setEditTarget(undefined as any);
      showToast(isNew ? "✅ Command created" : "✅ Command updated");
      await loadData();
    } catch {
      setFormError("Network error while saving");
    } finally {
      setSaving(false);
    }
  };

  // ─── Toggle enabled ───────────────────────────────────────────────────────────
  const toggleEnabled = async (cmd: BotCommand) => {
    try {
      const res = await fetch(`/api/platform-admin/telegram-bot/commands/${cmd.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ enabled: !cmd.enabled }),
      });
      if (!res.ok) {
        showToast("❌ Failed to toggle command");
        return;
      }
      showToast(`✅ Command ${!cmd.enabled ? "enabled" : "disabled"}`);
      await loadData();
    } catch {
      showToast("❌ Network error");
    }
  };

  // ─── Delete command ───────────────────────────────────────────────────────────
  const deleteCommand = async (cmd: BotCommand) => {
    if (!window.confirm(`Delete command "${cmd.command}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/platform-admin/telegram-bot/commands/${cmd.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) {
        showToast("❌ Failed to delete command");
        return;
      }
      showToast(`✅ Command deleted`);
      await loadData();
    } catch {
      showToast("❌ Network error");
    }
  };

  // ─── Save fallback ────────────────────────────────────────────────────────────
  const saveFallback = async () => {
    setSavingFallback(true);
    try {
      const res = await fetch("/api/platform-admin/telegram-bot/settings", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ fallbackMessage: fallbackDraft }),
      });
      if (!res.ok) {
        showToast("❌ Failed to save fallback message");
        return;
      }
      setFallback(fallbackDraft);
      setEditingFallback(false);
      showToast("✅ Fallback message saved");
    } catch {
      showToast("❌ Network error");
    } finally {
      setSavingFallback(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-400 text-sm">Loading Telegram Bot configuration…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700 text-sm">
        {error}
      </div>
    );
  }

  const isEditing = editTarget !== null || editTarget === null && editForm.command !== "/";
  const showModal = editTarget !== undefined && editTarget !== null;
  const showCreateModal = editTarget === null && editForm.command !== EMPTY_COMMAND.command || editForm.title !== EMPTY_COMMAND.title;

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-xl">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Telegram Bot</h1>
          <p className="text-gray-500 text-sm mt-1">
            Configure bot commands, responses, and inline buttons. CONNECT and RSVP flows are not affected.
          </p>
        </div>
        <button onClick={openCreate} className={btnPrimary}>
          ＋ New Command
        </button>
      </div>

      {/* Commands list */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {commands.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-4xl mb-3">🤖</p>
            <p className="text-gray-500 font-medium">No commands configured yet</p>
            <p className="text-gray-400 text-sm mt-1">Create your first command to get started</p>
          </div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Command</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Title</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Buttons</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {commands.map((cmd) => (
                <tr key={cmd.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <span className="font-mono text-sm text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {cmd.command}
                    </span>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-sm text-gray-700">{cmd.title}</span>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <span className="text-sm text-gray-400">{cmd.buttons.length} button{cmd.buttons.length !== 1 ? "s" : ""}</span>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => toggleEnabled(cmd)}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors ${
                        cmd.enabled
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${cmd.enabled ? "bg-emerald-500" : "bg-gray-400"}`} />
                      {cmd.enabled ? "Enabled" : "Disabled"}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setPreviewCommand(cmd); }}
                        className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                      >
                        Preview
                      </button>
                      <button
                        onClick={() => openEdit(cmd)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteCommand(cmd)}
                        className={btnDanger}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Fallback message */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Fallback Message</h2>
            <p className="text-xs text-gray-400 mt-0.5">Sent when the bot receives an unknown message</p>
          </div>
          {!editingFallback && (
            <button
              onClick={() => { setFallbackDraft(fallback); setEditingFallback(true); }}
              className={btnSecondary}
            >
              Edit
            </button>
          )}
        </div>
        {editingFallback ? (
          <div className="space-y-3">
            <textarea
              value={fallbackDraft}
              onChange={(e) => setFallbackDraft(e.target.value)}
              rows={4}
              maxLength={4096}
              className={inputCls}
              placeholder="Enter fallback message…"
            />
            <div className="flex items-center gap-3">
              <button onClick={saveFallback} disabled={savingFallback || !fallbackDraft.trim()} className={btnPrimary}>
                {savingFallback ? "Saving…" : "Save"}
              </button>
              <button onClick={() => setEditingFallback(false)} className={btnSecondary}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">
            {fallback || <span className="text-gray-400 italic">Not configured</span>}
          </p>
        )}
      </div>

      {/* ─── Bot Users Analytics ─────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Bot Users</h2>
            <p className="text-xs text-gray-400 mt-0.5">Every Telegram user who has interacted with the bot</p>
          </div>
          <button
            onClick={() => loadUsers(userSearch, userStatusFilter)}
            className={btnSecondary}
          >
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Users", value: usersData?.total ?? 0, color: "text-indigo-600", bg: "bg-indigo-50" },
            { label: "Connected", value: usersData?.connected ?? 0, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Not Connected", value: usersData?.unconnected ?? 0, color: "text-gray-500", bg: "bg-gray-50" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`${bg} rounded-2xl p-4`}>
              <p className="text-xs text-gray-400 font-medium">{label}</p>
              <p className={`text-2xl font-bold mt-1 ${color}`}>{usersLoading ? "…" : value}</p>
            </div>
          ))}
        </div>

        {/* Search + filter */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={userSearchInput}
            onChange={(e) => setUserSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setUserSearch(userSearchInput);
                loadUsers(userSearchInput, userStatusFilter);
              }
            }}
            placeholder="Search username, name, or ID…"
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={() => { setUserSearch(userSearchInput); loadUsers(userSearchInput, userStatusFilter); }}
            className={btnPrimary}
          >
            Search
          </button>
          <select
            value={userStatusFilter}
            onChange={(e) => {
              const v = e.target.value as "all" | "connected" | "unconnected";
              setUserStatusFilter(v);
              loadUsers(userSearch, v);
            }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="all">All users</option>
            <option value="connected">Connected only</option>
            <option value="unconnected">Not connected</option>
          </select>
        </div>

        {/* Users table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {usersLoading ? (
            <div className="py-12 text-center text-gray-400 text-sm">Loading users…</div>
          ) : !usersData || usersData.users.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-3xl mb-2">👥</p>
              <p className="text-gray-500 text-sm">No bot users yet</p>
              <p className="text-gray-400 text-xs mt-1">Users appear here once they interact with the bot</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase">User</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase hidden sm:table-cell">Telegram ID</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase">Status</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase hidden md:table-cell">Connected To</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase hidden lg:table-cell">First Seen</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase hidden lg:table-cell">Last Seen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {usersData.users.map((u) => {
                    // Display name: @username → First Last → telegramUserId
                    const displayName = u.username
                      ? `@${u.username}`
                      : [u.firstName, u.lastName].filter(Boolean).join(" ") || u.telegramUserId;
                    const isUsername = !!u.username;
                    const fmt = (d: string | null) =>
                      d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

                    return (
                      <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-semibold shrink-0">
                              {(u.firstName?.[0] ?? u.username?.[0] ?? "?").toUpperCase()}
                            </div>
                            <div>
                              <p className={`text-sm font-medium ${isUsername ? "text-indigo-700" : "text-gray-800"}`}>
                                {displayName}
                              </p>
                              {u.firstName && u.username && (
                                <p className="text-xs text-gray-400">{[u.firstName, u.lastName].filter(Boolean).join(" ")}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 hidden sm:table-cell">
                          <span className="font-mono text-xs text-gray-400">{u.telegramUserId}</span>
                        </td>
                        <td className="px-5 py-4">
                          {u.isConnectedCustomer ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Connected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                              Not connected
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell">
                          {u.templateName ? (
                            <div>
                              <p className="text-xs font-medium text-gray-700">{u.templateName}</p>
                              {u.customerEmail && (
                                <p className="text-xs text-gray-400">{u.customerEmail}</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 hidden lg:table-cell">
                          <span className="text-xs text-gray-400">{fmt(u.firstSeenAt)}</span>
                        </td>
                        <td className="px-5 py-4 hidden lg:table-cell">
                          <span className="text-xs text-gray-400">{fmt(u.lastSeenAt)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {usersData.users.length === 100 && (
                <div className="px-5 py-3 border-t border-gray-50 text-xs text-gray-400 text-center">
                  Showing first 100 users — use search to narrow results
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit/Create Modal */}
      {(editTarget !== undefined) && (editTarget !== null || (editForm.command !== EMPTY_COMMAND.command || editForm.title !== EMPTY_COMMAND.title || editForm.responseText !== EMPTY_COMMAND.responseText)) && (
        <EditModal
          form={editForm}
          isNew={editTarget === null}
          saving={saving}
          error={formError}
          onChange={setEditForm}
          onAddButton={addButton}
          onUpdateButton={updateButton}
          onRemoveButton={removeButton}
          onSave={handleSave}
          onClose={() => { setEditTarget(undefined as any); setEditForm(EMPTY_COMMAND); setFormError(""); }}
        />
      )}

      {/* Preview Modal */}
      {previewCommand && (
        <PreviewModal command={previewCommand} onClose={() => setPreviewCommand(null)} />
      )}
    </div>
  );
};

// ─── Edit Modal ───────────────────────────────────────────────────────────────
const inputClsInModal =
  "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

const EditModal: React.FC<{
  form: Omit<BotCommand, "id">;
  isNew: boolean;
  saving: boolean;
  error: string;
  onChange: React.Dispatch<React.SetStateAction<Omit<BotCommand, "id">>>;
  onAddButton: () => void;
  onUpdateButton: (idx: number, field: keyof BotButton, value: string) => void;
  onRemoveButton: (idx: number) => void;
  onSave: (e: React.FormEvent) => void;
  onClose: () => void;
}> = ({ form, isNew, saving, error, onChange, onAddButton, onUpdateButton, onRemoveButton, onSave, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">
          {isNew ? "New Command" : `Edit ${form.command}`}
        </h2>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          ✕
        </button>
      </div>

      <form onSubmit={onSave} className="px-6 py-5 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Command <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.command}
              onChange={(e) => onChange((prev) => ({ ...prev, command: e.target.value }))}
              placeholder="/start"
              maxLength={32}
              required
              className={inputClsInModal + " font-mono"}
            />
            <p className="mt-1 text-xs text-gray-400">Must start with / (e.g. /pricing)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Internal Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => onChange((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Pricing Info"
              maxLength={100}
              required
              className={inputClsInModal}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Response Text <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.responseText}
            onChange={(e) => onChange((prev) => ({ ...prev, responseText: e.target.value }))}
            rows={6}
            maxLength={4096}
            required
            className={inputClsInModal}
            placeholder="Enter the bot response text (HTML tags like <b>, <i> are supported)"
          />
          <p className="mt-1 text-xs text-gray-400">
            Supports Telegram HTML: &lt;b&gt;bold&lt;/b&gt;, &lt;i&gt;italic&lt;/i&gt;, &lt;a href="…"&gt;link&lt;/a&gt; — {form.responseText.length}/4096
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Enabled</label>
          <button
            type="button"
            onClick={() => onChange((prev) => ({ ...prev, enabled: !prev.enabled }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              form.enabled ? "bg-indigo-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                form.enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Buttons section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">Inline Buttons</label>
            {form.buttons.length < 8 && (
              <button
                type="button"
                onClick={onAddButton}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                ＋ Add button
              </button>
            )}
          </div>

          {form.buttons.length === 0 && (
            <p className="text-xs text-gray-400 italic">No buttons. Click "Add button" to add one.</p>
          )}

          <div className="space-y-3">
            {form.buttons.map((btn, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">Button {idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveButton(idx)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Label</label>
                    <input
                      type="text"
                      value={btn.label}
                      onChange={(e) => onUpdateButton(idx, "label", e.target.value)}
                      placeholder="Button text"
                      maxLength={64}
                      required
                      className={inputClsInModal}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Type</label>
                    <select
                      value={btn.type}
                      onChange={(e) => {
                        onUpdateButton(idx, "type", e.target.value as "url" | "command");
                        onUpdateButton(idx, "value", e.target.value === "url" ? "https://" : "/");
                      }}
                      className={inputClsInModal}
                    >
                      <option value="url">URL link</option>
                      <option value="command">Bot command</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      {btn.type === "url" ? "URL (https://…)" : "Command (e.g. /pricing)"}
                    </label>
                    <input
                      type={btn.type === "url" ? "url" : "text"}
                      value={btn.value}
                      onChange={(e) => onUpdateButton(idx, "value", e.target.value)}
                      placeholder={btn.type === "url" ? "https://example.com" : "/pricing"}
                      maxLength={200}
                      required
                      className={inputClsInModal + " font-mono"}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
          <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50">
            {saving ? "Saving…" : isNew ? "Create Command" : "Save Changes"}
          </button>
          <button type="button" onClick={onClose} className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all">
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
);

// ─── Preview Modal ────────────────────────────────────────────────────────────
const PreviewModal: React.FC<{ command: BotCommand; onClose: () => void }> = ({
  command,
  onClose,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">
          Preview: <span className="font-mono text-indigo-700">{command.command}</span>
        </h2>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="p-6">
        {/* Telegram-style bubble */}
        <div className="bg-[#effdde] rounded-2xl rounded-tl-sm p-4 text-sm text-gray-800 shadow-sm whitespace-pre-wrap max-w-xs">
          {command.responseText}
        </div>

        {/* Buttons */}
        {command.buttons.length > 0 && (
          <div className="mt-3 space-y-2">
            {command.buttons.map((btn, i) => (
              <div
                key={i}
                className="bg-[#e4f2fb] hover:bg-[#d8ecf7] text-[#2c7dba] text-sm font-medium rounded-xl px-4 py-2 text-center cursor-default transition-colors"
              >
                {btn.label}
                <span className="ml-1 text-[10px] text-[#2c7dba]/60">
                  {btn.type === "url" ? "↗" : "▶"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);
