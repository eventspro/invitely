/**
 * CustomerEditsAdmin.tsx
 * Platform-admin section for Demo Leads (customerEdits records).
 * Shows list of demo submissions, allows status/notes management.
 */
import React, { useState, useEffect, useCallback } from "react";
import { Loader2, Search, X } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type DemoStatus = "demo" | "contacted" | "converted" | "archived";

interface CustomerEdit {
  id: string;
  sourceTemplateSlug: string;
  groomName: string | null;
  brideName: string | null;
  weddingDate: string | null;
  paletteId: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  customerInstagram: string | null;
  heroImageUrl: string | null;
  galleryImageUrls: string[];
  status: DemoStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_LABELS: Record<DemoStatus, { label: string; cls: string }> = {
  demo:      { label: "Demo",      cls: "bg-stone-100 text-stone-600" },
  contacted: { label: "Contacted", cls: "bg-blue-100 text-blue-700" },
  converted: { label: "Converted", cls: "bg-green-100 text-green-700" },
  archived:  { label: "Archived",  cls: "bg-red-100 text-red-600" },
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── Detail modal ─────────────────────────────────────────────────────────────
function DetailModal({ lead, onClose, onSave }: {
  lead: CustomerEdit;
  onClose: () => void;
  onSave: (id: string, status: DemoStatus, notes: string) => Promise<void>;
}) {
  const [status, setStatus] = useState<DemoStatus>(lead.status);
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  async function handleSave() {
    setSaving(true);
    setSaveError("");
    try {
      await onSave(lead.id, status, notes);
      onClose();
    } catch {
      setSaveError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const couples = [lead.groomName, lead.brideName].filter(Boolean).join(" & ") || "—";

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <div>
            <h3 className="font-semibold text-stone-800">{couples}</h3>
            <p className="text-xs text-stone-400">{fmtDate(lead.createdAt)}</p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 p-1">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          {/* Hero image */}
          {lead.heroImageUrl && (
            <div className="rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
              <img src={lead.heroImageUrl} alt="Hero" className="w-full h-full object-cover" />
            </div>
          )}

          {/* Gallery */}
          {lead.galleryImageUrls?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-stone-500 mb-2">Gallery ({lead.galleryImageUrls.length})</p>
              <div className="grid grid-cols-4 gap-2">
                {lead.galleryImageUrls.map((url, i) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden bg-stone-100">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-stone-400 mb-0.5">Email</p>
              <p className="text-stone-700 font-medium">{lead.customerEmail ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-stone-400 mb-0.5">Phone</p>
              <p className="text-stone-700 font-medium">{lead.customerPhone ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-stone-400 mb-0.5">Instagram</p>
              <p className="text-stone-700 font-medium">{lead.customerInstagram ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-stone-400 mb-0.5">Wedding date</p>
              <p className="text-stone-700 font-medium">{lead.weddingDate ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-stone-400 mb-0.5">Palette</p>
              <p className="text-stone-700 font-medium">{lead.paletteId ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-stone-400 mb-0.5">Template</p>
              <p className="text-stone-700 font-medium">{lead.sourceTemplateSlug}</p>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as DemoStatus)}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-800 focus:outline-none focus:border-rose-400"
            >
              {(Object.keys(STATUS_LABELS) as DemoStatus[]).map(s => (
                <option key={s} value={s}>{STATUS_LABELS[s].label}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Internal notes about this lead..."
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-rose-400 resize-none"
            />
          </div>

          {saveError && <p className="text-sm text-red-600">{saveError}</p>}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-stone-100">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm hover:bg-stone-50">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-[2] py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "#9f1239" }}
          >
            {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export const CustomerEditsAdmin: React.FC = () => {
  const [leads, setLeads] = useState<CustomerEdit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | DemoStatus>("");
  const [selectedLead, setSelectedLead] = useState<CustomerEdit | null>(null);
  const [toast, setToast] = useState("");

  const authHeaders = useCallback((): Record<string, string> => {
    const token = localStorage.getItem("admin-token") ?? "";
    return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  }, []);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/platform-admin/customer-edits", { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as CustomerEdit[];
      setLeads(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load leads.");
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  async function handleSaveStatus(id: string, status: DemoStatus, notes: string) {
    const res = await fetch(`/api/platform-admin/customer-edits/${id}/status`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ status, notes }),
    });
    if (!res.ok) throw new Error("Save failed");
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status, notes } : l));
    showToast("Lead updated.");
  }

  const filtered = leads.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (l.customerEmail ?? "").toLowerCase().includes(q) ||
      (l.groomName ?? "").toLowerCase().includes(q) ||
      (l.brideName ?? "").toLowerCase().includes(q) ||
      (l.customerPhone ?? "").toLowerCase().includes(q);
    const matchStatus = !statusFilter || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Stats
  const totalLeads = leads.length;
  const contacted = leads.filter(l => l.status === "contacted").length;
  const converted = leads.filter(l => l.status === "converted").length;
  const withEmail = leads.filter(l => !!l.customerEmail).length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total leads", value: totalLeads, cls: "text-stone-700" },
          { label: "With email", value: withEmail, cls: "text-blue-600" },
          { label: "Contacted", value: contacted, cls: "text-amber-600" },
          { label: "Converted", value: converted, cls: "text-green-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-stone-100 px-5 py-4">
            <p className={`text-2xl font-bold ${s.cls}`}>{s.value}</p>
            <p className="text-xs text-stone-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-stone-100 px-5 py-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, phone…"
            className="w-full pl-8 pr-4 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-rose-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as "" | DemoStatus)}
          className="rounded-xl border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:border-rose-400"
        >
          <option value="">All statuses</option>
          {(Object.keys(STATUS_LABELS) as DemoStatus[]).map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s].label}</option>
          ))}
        </select>
        <button onClick={loadLeads} disabled={loading} className="px-4 py-2 rounded-xl bg-stone-100 text-stone-600 text-sm hover:bg-stone-200 disabled:opacity-50">
          {loading ? <Loader2 size={14} className="animate-spin" /> : "Refresh"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Loading */}
      {loading && !leads.length && (
        <div className="flex justify-center py-12">
          <Loader2 size={28} className="text-rose-400 animate-spin" />
        </div>
      )}

      {/* Table */}
      {!loading && filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-stone-100 px-5 py-12 text-center text-stone-400 text-sm">
          {search || statusFilter ? "No leads match your filters." : "No demo leads yet."}
        </div>
      )}

      {filtered.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-100 text-left">
                  <th className="px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Couple</th>
                  <th className="px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Contact</th>
                  <th className="px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Palette</th>
                  <th className="px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Submitted</th>
                  <th className="px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {filtered.map(lead => {
                  const statusMeta = STATUS_LABELS[lead.status];
                  const names = [lead.groomName, lead.brideName].filter(Boolean).join(" & ") || "—";
                  return (
                    <tr key={lead.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-stone-800">{names}</p>
                        {lead.heroImageUrl && (
                          <span className="text-xs text-stone-400">📸 has photo</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {lead.customerEmail
                          ? <a href={`mailto:${lead.customerEmail}`} className="text-blue-600 hover:underline">{lead.customerEmail}</a>
                          : <span className="text-stone-400">—</span>}
                        {lead.customerPhone && (
                          <p className="text-xs text-stone-400 mt-0.5">{lead.customerPhone}</p>
                        )}
                        {lead.customerInstagram && (
                          <p className="text-xs text-stone-400 mt-0.5">{lead.customerInstagram}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-stone-600 whitespace-nowrap">{lead.weddingDate ?? "—"}</td>
                      <td className="px-5 py-3.5 text-stone-600">{lead.paletteId ?? "—"}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusMeta.cls}`}>
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-stone-400 text-xs whitespace-nowrap">{fmtDate(lead.createdAt)}</td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => setSelectedLead(lead)}
                          className="px-3 py-1.5 rounded-lg bg-stone-100 text-stone-600 text-xs font-medium hover:bg-stone-200 transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-stone-100 text-xs text-stone-400">
            {filtered.length} of {totalLeads} lead{totalLeads !== 1 ? "s" : ""}
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selectedLead && (
        <DetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onSave={handleSaveStatus}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-800 text-white text-sm px-5 py-3 rounded-xl shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
};
