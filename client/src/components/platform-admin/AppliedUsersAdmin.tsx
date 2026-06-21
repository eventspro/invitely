import React, { useEffect, useState } from 'react';

interface Lead {
  id: string;
  name: string;
  email?: string | null;
  phone: string;
  source?: string | null;
  createdAt: string;
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button
      onClick={copy}
      className="ml-1.5 rounded px-1.5 py-0.5 text-[11px] text-indigo-500 hover:bg-indigo-50 transition"
      title="Copy"
    >
      {copied ? '✓' : 'Copy'}
    </button>
  );
}

export function AppliedUsersAdmin() {
  const [leads, setLeads]     = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('admin-token') ?? '';
    fetch('/api/platform-admin/homepage-leads', {
      headers: { Authorization: 'Bearer ' + token },
    })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setLeads(data);
        } else {
          setError('Failed to load leads.');
        }
      })
      .catch(() => setError('Network error.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 px-5 py-4 text-sm text-red-600">{error}</div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400">
        <p className="text-4xl mb-3">📩</p>
        <p className="text-sm font-medium">Դեռ ոչ մի դիմում</p>
        <p className="text-xs mt-1">Submissions from the "Դիմել հիմա" button will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">{leads.length} submission{leads.length !== 1 ? 's' : ''} total</p>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Phone</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {leads.map(lead => (
              <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4 text-sm font-medium text-gray-900">{lead.name}</td>
                <td className="px-5 py-4 text-sm text-gray-700">
                  {lead.phone}
                  <CopyButton value={lead.phone} />
                </td>
                <td className="px-5 py-4 text-sm text-gray-500">
                  {lead.email ? (
                    <>
                      {lead.email}
                      <CopyButton value={lead.email} />
                    </>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="px-5 py-4 text-sm text-gray-400">{fmtDate(lead.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {leads.map(lead => (
          <div key={lead.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-1.5">
            <p className="font-semibold text-gray-900 text-sm">{lead.name}</p>
            <p className="text-sm text-gray-700 flex items-center gap-1">
              📞 {lead.phone}
              <CopyButton value={lead.phone} />
            </p>
            {lead.email && (
              <p className="text-sm text-gray-500 flex items-center gap-1">
                📧 {lead.email}
                <CopyButton value={lead.email} />
              </p>
            )}
            <p className="text-xs text-gray-400">{fmtDate(lead.createdAt)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
