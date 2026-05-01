import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'wouter';
import { TelegramBotAdmin } from './TelegramBotAdmin';
import { SaleWheelAdmin } from './SaleWheelAdmin';

// ─── Types ────────────────────────────────────────────────────────────────────
interface TemplateItem {
  id: string;
  name: string;
  slug: string;
  templateKey: string;
  ownerEmail?: string | null;
  isMain: boolean;
  sourceTemplateId?: string | null;
  maintenance?: boolean | null;
  createdAt: string;
}

interface Customer {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  isOwner?: boolean | null;
  templateId?: string | null;
  templateName?: string | null;
  templateSlug?: string | null;
  createdAt: string;
  isActive?: boolean | null;
  panelId?: string | null;
  role?: string | null;
}

interface CreateForm {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  templateId: string;
  templateSlug: string;
}

type Tab = 'overview' | 'customers' | 'templates' | 'telegram-bot' | 'sale-wheel';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const initials = (firstName?: string | null, lastName?: string | null) => {
  const value = `${(firstName?.[0] ?? '').toUpperCase()}${(lastName?.[0] ?? '').toUpperCase()}`;
  return value || '?';
};

const TEMPLATE_KEY_LABELS: Record<string, string> = {
  pro: 'Pro',
  classic: 'Classic',
  elegant: 'Elegant',
  romantic: 'Romantic',
  nature: 'Nature',
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const StatCard: React.FC<{
  label: string;
  value: number | string;
  color: string;
  icon: string;
}> = ({ label, value, color, icon }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  </div>
);

const Badge: React.FC<{ active: boolean }> = ({ active }) => (
  <span
    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
      active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
    }`}
  >
    <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-red-400'}`} />
    {active ? 'Active' : 'Inactive'}
  </span>
);

const KeyBadge: React.FC<{ k: string }> = ({ k }) => {
  const colors: Record<string, string> = {
    pro: 'bg-violet-100 text-violet-700',
    classic: 'bg-amber-100 text-amber-700',
    elegant: 'bg-blue-100 text-blue-700',
    romantic: 'bg-pink-100 text-pink-700',
    nature: 'bg-green-100 text-green-700',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[k] ?? 'bg-gray-100 text-gray-600'}`}>
      {TEMPLATE_KEY_LABELS[k] ?? k}
    </span>
  );
};

const Modal: React.FC<{
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          ✕
        </button>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  </div>
);

const FormRow: React.FC<{
  label: string;
  children: React.ReactNode;
  hint?: string;
}> = ({ label, children, hint }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    {children}
    {hint ? <p className="mt-1 text-xs text-gray-400">{hint}</p> : null}
  </div>
);

const inputCls =
  'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';
const btnPrimary =
  'px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50';
const btnSecondary =
  'px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all';

// ─── Main Panel ───────────────────────────────────────────────────────────────
export const PlatformAdminPanel: React.FC = () => {
  const [, setLocation] = useLocation();

  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [mainTemplates, setMainTemplates] = useState<TemplateItem[]>([]);
  const [clonedTemplates, setClonedTemplates] = useState<TemplateItem[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Customer | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'customer' as string,
  });
  const [createForm, setCreateForm] = useState<CreateForm>({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    templateId: '',
    templateSlug: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [assignTarget, setAssignTarget] = useState<TemplateItem | null>(null);
  const [assignUserId, setAssignUserId] = useState('');
  const [assignSlug, setAssignSlug] = useState('');
  const [assigning, setAssigning] = useState(false);

  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);

    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = window.setTimeout(() => {
      setToast('');
      toastTimerRef.current = null;
    }, 3500);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const authHeaders = useCallback((): Record<string, string> => {
    const token = localStorage.getItem('admin-token') ?? '';
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    const token = localStorage.getItem('admin-token');
    if (!token) {
      setLocation('/platform-admin/login?next=/platform-admin');
      return;
    }

    try {
      const [cRes, tRes] = await Promise.all([
        fetch('/api/platform-admin/ultimate-customers', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/platform-admin/templates', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (cRes.status === 401 || tRes.status === 401) {
        localStorage.removeItem('admin-token');
        setLocation('/platform-admin/login?next=/platform-admin');
        return;
      }

      if (cRes.ok) {
        const customersData = (await cRes.json()) as Customer[];
        setCustomers(customersData ?? []);
      } else {
        setCustomers([]);
      }

      if (tRes.ok) {
        const d = await tRes.json();
        setMainTemplates(d.mainTemplates ?? []);
        setClonedTemplates(d.clonedTemplates ?? []);
      } else {
        setMainTemplates([]);
        setClonedTemplates([]);
      }
    } catch {
      setError('Failed to load data. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [setLocation]);

  useEffect(() => {
    if (!localStorage.getItem('admin-token')) {
      setLocation('/platform-admin/login?next=/platform-admin');
      return;
    }

    loadData();
  }, [loadData, setLocation]);

  const handleLogout = () => {
    localStorage.removeItem('admin-token');
    setLocation('/platform-admin/login');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/platform-admin/create-ultimate-customer', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(createForm),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? data.message ?? 'Failed to create customer');
        return;
      }

      const createdSlug = createForm.templateSlug;

      setShowCreate(false);
      setCreateForm({
        email: '',
        firstName: '',
        lastName: '',
        password: '',
        templateId: '',
        templateSlug: '',
      });

      showToast(`✅ Customer created — admin URL: /${createdSlug}/admin`);
      await loadData();
    } catch {
      setError('Network error while creating customer');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (c: Customer) => {
    setEditTarget(c);
    setEditForm({
      firstName: c.firstName ?? '',
      lastName: c.lastName ?? '',
      email: c.email,
      role: c.role ?? 'customer',
    });
    setError('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;

    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/platform-admin/customer/${editTarget.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(editForm),
      });

      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? 'Failed to update');
        return;
      }

      setEditTarget(null);
      showToast('✅ Customer updated');
      await loadData();
    } catch {
      setError('Network error while updating customer');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (c: Customer) => {
    const action = c.isActive ? 'deactivate' : 'activate';
    setError('');

    try {
      const res = await fetch(`/api/platform-admin/customer/${c.id}/${action}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('admin-token') ?? ''}`,
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? `Failed to ${action} customer`);
        return;
      }

      showToast(`✅ Customer ${action}d`);
      await loadData();
    } catch {
      setError(`Network error while trying to ${action} customer`);
    }
  };

  const toggleOwner = async (c: Customer) => {
    const next = !c.isOwner;
    setError('');
    try {
      const res = await fetch(`/api/platform-admin/customer/${c.id}/set-owner`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ isOwner: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Failed to update owner status');
        return;
      }
      showToast(next ? `👑 ${c.email} is now owner` : `👤 ${c.email} owner status removed`);
      await loadData();
    } catch {
      setError('Network error while updating owner status');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/platform-admin/customer/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('admin-token') ?? ''}` },
      });
      if (res.ok) {
        setDeleteTarget(null);
        showToast(`🗑️ Customer deleted`);
        await loadData();
      } else {
        const d = await res.json();
        setError(d.error ?? 'Failed to delete customer');
        setDeleteTarget(null);
      }
    } finally {
      setDeleting(false);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
    setCreateForm((f) => ({
      ...f,
      password: Array.from(
        { length: 12 },
        () => chars[Math.floor(Math.random() * chars.length)]
      ).join(''),
    }));
  };

  const openAssign = (t: TemplateItem) => {
    setAssignTarget(t);
    setAssignUserId('');
    setAssignSlug(t.slug);
    setError('');
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTarget) return;
    setAssigning(true);
    setError('');
    try {
      const res = await fetch('/api/platform-admin/assign-template', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          userId: assignUserId,
          templateId: assignTarget.id,
          templateSlug: assignSlug,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to assign template');
        return;
      }
      setAssignTarget(null);
      showToast(`✅ ${data.message} — admin: ${data.adminUrl}`);
      await loadData();
    } catch {
      setError('Network error while assigning template');
    } finally {
      setAssigning(false);
    }
  };

  const generateSlug = () => {
    const slug = `${createForm.firstName}${createForm.lastName}`
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    setCreateForm((f) => ({ ...f, templateSlug: slug }));
  };

  const activeCount = customers.filter((c) => c.isActive).length;
  const inactiveCount = customers.length - activeCount;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading platform data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">4A</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-semibold text-gray-900 text-sm">Platform Admin</span>
              <span className="ml-2 text-xs text-gray-400">4ever.am</span>
            </div>
          </div>

          <nav className="hidden sm:flex gap-1 bg-gray-100 rounded-xl p-1">
            {(['overview', 'customers', 'templates', 'telegram-bot', 'sale-wheel'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                  tab === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t === 'overview' ? '📊 Overview' : t === 'customers' ? '👥 Customers' : t === 'templates' ? '🎨 Templates' : t === 'telegram-bot' ? '🤖 Telegram Bot' : '🎡 Spin & Win'}
              </button>
            ))}
          </nav>

          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-red-500 transition-colors shrink-0"
          >
            Sign out
          </button>
        </div>

        <div className="sm:hidden flex border-t border-gray-100">
          {(['overview', 'customers', 'templates', 'telegram-bot', 'sale-wheel'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-xs font-medium capitalize transition-colors ${
                tab === t ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-gray-500'
              }`}
            >
              {t === 'telegram-bot' ? '🤖 Bot' : t === 'sale-wheel' ? '🎡 Spin' : t}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 ml-4">
              ✕
            </button>
          </div>
        )}

        {tab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
              <p className="text-gray-500 text-sm mt-1">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Customers" value={customers.length} color="bg-indigo-100 text-indigo-600" icon="👥" />
              <StatCard label="Active" value={activeCount} color="bg-emerald-100 text-emerald-600" icon="✅" />
              <StatCard label="Main Templates" value={mainTemplates.length} color="bg-violet-100 text-violet-600" icon="🎨" />
              <StatCard label="Cloned Templates" value={clonedTemplates.length} color="bg-amber-100 text-amber-600" icon="🔀" />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Recent Customers</h2>
                <button onClick={() => setTab('customers')} className="text-sm text-indigo-600 hover:text-indigo-700">
                  View all →
                </button>
              </div>

              <div className="divide-y divide-gray-50">
                {customers.slice(0, 5).map((c) => (
                  <div key={c.id} className="px-6 py-3 flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 shrink-0">
                      {initials(c.firstName, c.lastName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {c.firstName ?? ''} {c.lastName ?? ''}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{c.email}</p>
                    </div>
                    <p className="hidden sm:block text-xs text-gray-400 shrink-0">
                      {c.templateSlug ? `/${c.templateSlug}` : '—'}
                    </p>
                    <Badge active={!!c.isActive} />
                    {c.isOwner && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                        👑 Owner
                      </span>
                    )}
                    {c.role === 'super_admin' && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                        Super Admin
                      </span>
                    )}
                  </div>
                ))}

                {customers.length === 0 && (
                  <div className="px-6 py-10 text-center text-gray-400 text-sm">
                    No customers yet.{' '}
                    <button
                      onClick={() => {
                        setTab('customers');
                        setShowCreate(true);
                      }}
                      className="text-indigo-600 hover:underline"
                    >
                      Create the first one
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">Main Templates</h3>
                <div className="space-y-2">
                  {mainTemplates.slice(0, 5).map((t) => (
                    <div key={t.id} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 truncate">{t.name}</span>
                      <a
                        href={`/${t.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-500 hover:text-indigo-700 text-xs shrink-0 ml-2"
                      >
                        View ↗
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setTab('customers');
                      setShowCreate(true);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 text-sm hover:bg-indigo-100 transition-colors"
                  >
                    ＋ Create new customer
                  </button>

                  <button
                    onClick={() => setTab('templates')}
                    className="w-full text-left px-3 py-2 rounded-lg bg-violet-50 text-violet-700 text-sm hover:bg-violet-100 transition-colors"
                  >
                    🎨 Browse all templates
                  </button>

                  <a
                    href="/platform"
                    className="block px-3 py-2 rounded-lg bg-gray-50 text-gray-700 text-sm hover:bg-gray-100 transition-colors"
                  >
                    🔧 Advanced platform dashboard
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'customers' && (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
                <p className="text-gray-500 text-sm mt-1">
                  {activeCount} active · {inactiveCount} inactive · {customers.length} total
                </p>
              </div>

              <button
                onClick={() => {
                  setShowCreate(true);
                  setError('');
                }}
                className={btnPrimary}
              >
                ＋ New Customer
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {customers.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-4xl mb-3">👥</p>
                  <p className="text-gray-500 font-medium">No customers yet</p>
                  <p className="text-gray-400 text-sm mt-1">Create the first one to get started</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Customer</th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                          Template Access
                        </th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">
                          Created
                        </th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-50">
                      {customers.map((c) => (
                        <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600 shrink-0">
                                {initials(c.firstName, c.lastName)}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {c.firstName ?? ''} {c.lastName ?? ''}
                                </p>
                                <p className="text-xs text-gray-400">{c.email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4 hidden sm:table-cell">
                            {c.templateSlug ? (
                              <div>
                                <a
                                  href={`/${c.templateSlug}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                                >
                                  /{c.templateSlug}
                                </a>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className="text-xs text-gray-400">Admin:</span>
                                  <a
                                    href={`/${c.templateSlug}/admin`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-gray-500 hover:text-indigo-600"
                                  >
                                    /{c.templateSlug}/admin
                                  </a>
                                </div>
                                {c.templateName && <p className="text-xs text-gray-300 mt-0.5">{c.templateName}</p>}
                              </div>
                            ) : (
                              <span className="text-gray-300 text-sm">—</span>
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm text-gray-400 hidden md:table-cell">
                            {fmtDate(c.createdAt)}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge active={!!c.isActive} />
                              {c.isOwner && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                                  👑 Owner
                                </span>
                              )}
                              {c.role === 'super_admin' && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                                  Super Admin
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEdit(c)}
                                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() => toggleStatus(c)}
                                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                                  c.isActive
                                    ? 'border-red-200 text-red-600 hover:bg-red-50'
                                    : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                                }`}
                              >
                                {c.isActive ? 'Deactivate' : 'Activate'}
                              </button>

                              <button
                                onClick={() => toggleOwner(c)}
                                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                                  c.isOwner
                                    ? 'border-yellow-300 text-yellow-700 hover:bg-yellow-50'
                                    : 'border-gray-200 text-gray-400 hover:border-yellow-300 hover:text-yellow-600 hover:bg-yellow-50'
                                }`}
                                title={c.isOwner ? 'Remove owner access' : 'Grant owner access (all templates)'}
                              >
                                {c.isOwner ? '👑 Owner' : '👤 Owner'}
                              </button>

                              <button
                                onClick={() => setDeleteTarget(c)}
                                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                title="Delete customer"
                              >
                                🗑
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'templates' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
              <p className="text-gray-500 text-sm mt-1">
                {mainTemplates.length} main · {clonedTemplates.length} cloned
              </p>
            </div>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-6 rounded-full bg-violet-500" />
                <h2 className="text-base font-semibold text-gray-900">Main Templates</h2>
                <span className="text-xs bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full font-medium">
                  {mainTemplates.length}
                </span>
              </div>

              {mainTemplates.length === 0 ? (
                <p className="text-gray-400 text-sm py-4 pl-5">No main templates found.</p>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Name</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase hidden sm:table-cell">
                            Slug
                          </th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Style</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase hidden md:table-cell">
                            Owner Email
                          </th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase hidden md:table-cell">
                            Maintenance
                          </th>
                          <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Links</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-50">
                        {mainTemplates.map((t) => (
                          <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-3 text-sm font-medium text-gray-900">{t.name}</td>
                            <td className="px-5 py-3 font-mono text-xs text-indigo-500 hidden sm:table-cell">
                              /{t.slug}
                            </td>
                            <td className="px-5 py-3">
                              <KeyBadge k={t.templateKey} />
                            </td>
                            <td className="px-5 py-3 text-xs text-gray-400 hidden md:table-cell">
                              {t.ownerEmail ?? '—'}
                            </td>
                            <td className="px-5 py-3 hidden md:table-cell">
                              {t.maintenance ? (
                                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                                  On
                                </span>
                              ) : (
                                <span className="text-xs text-gray-300">Off</span>
                              )}
                            </td>
                            <td className="px-5 py-3 text-right">
                              <a
                                href={`/${t.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                              >
                                View ↗
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-6 rounded-full bg-amber-400" />
                <h2 className="text-base font-semibold text-gray-900">Cloned Templates</h2>
                <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-medium">
                  {clonedTemplates.length}
                </span>
              </div>

              {clonedTemplates.length === 0 ? (
                <p className="text-gray-400 text-sm py-4 pl-5">No cloned templates yet.</p>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Name</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase hidden sm:table-cell">
                            Slug
                          </th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Style</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase hidden md:table-cell">
                            Cloned From
                          </th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase hidden md:table-cell">
                            Owner Email
                          </th>
                          <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Links</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-50">
                        {clonedTemplates.map((t) => {
                          const parent =
                            mainTemplates.find((m) => m.id === t.sourceTemplateId) ??
                            clonedTemplates.find((m) => m.id === t.sourceTemplateId);

                          return (
                            <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-5 py-3 text-sm font-medium text-gray-900">{t.name}</td>
                              <td className="px-5 py-3 font-mono text-xs text-indigo-500 hidden sm:table-cell">
                                /{t.slug}
                              </td>
                              <td className="px-5 py-3">
                                <KeyBadge k={t.templateKey} />
                              </td>
                              <td className="px-5 py-3 text-xs text-gray-400 hidden md:table-cell">
                                {parent ? (
                                  <span className="bg-gray-100 px-2 py-0.5 rounded font-mono">{parent.name}</span>
                                ) : (
                                  <span className="text-gray-300">—</span>
                                )}
                              </td>
                              <td className="px-5 py-3 text-xs text-gray-400 hidden md:table-cell">
                                {t.ownerEmail ?? '—'}
                              </td>
                              <td className="px-5 py-3 text-right">
                                <div className="flex gap-2 justify-end">
                                  <a
                                    href={`/${t.slug}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                                  >
                                    View ↗
                                  </a>
                                  <a
                                    href={`/${t.slug}/admin`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs px-2.5 py-1 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                                  >
                                    Admin ↗
                                  </a>
                                  <button
                                    onClick={() => openAssign(t)}
                                    className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                    title="Assign this template to an existing customer"
                                  >
                                    Assign
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {tab === 'telegram-bot' && (
          <TelegramBotAdmin />
        )}

        {tab === 'sale-wheel' && (
          <SaleWheelAdmin />
        )}
      </main>

      {showCreate && (
        <Modal
          title="Create New Customer"
          onClose={() => {
            setShowCreate(false);
            setError('');
          }}
        >
          <form onSubmit={handleCreate} className="space-y-4">
            {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>}

            <div className="grid grid-cols-2 gap-3">
              <FormRow label="First Name">
                <input
                  required
                  className={inputCls}
                  value={createForm.firstName}
                  onChange={(e) => setCreateForm((f) => ({ ...f, firstName: e.target.value }))}
                />
              </FormRow>

              <FormRow label="Last Name">
                <input
                  required
                  className={inputCls}
                  value={createForm.lastName}
                  onChange={(e) => setCreateForm((f) => ({ ...f, lastName: e.target.value }))}
                />
              </FormRow>
            </div>

            <FormRow label="Email">
              <input
                type="email"
                required
                className={inputCls}
                value={createForm.email}
                onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
              />
            </FormRow>

            <FormRow label="Template">
              <select
                required
                className={inputCls}
                value={createForm.templateId}
                onChange={(e) => setCreateForm((f) => ({ ...f, templateId: e.target.value }))}
              >
                <option value="">— Select a template —</option>

                {mainTemplates.length > 0 && (
                  <optgroup label="⭐ Main Templates">
                    {mainTemplates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.slug})
                      </option>
                    ))}
                  </optgroup>
                )}

                {clonedTemplates.length > 0 && (
                  <optgroup label="🔀 Cloned Templates">
                    {clonedTemplates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.slug})
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </FormRow>

            <FormRow
              label="Template Slug (URL path)"
              hint={createForm.templateSlug ? `Customer admin: /${createForm.templateSlug}/admin` : undefined}
            >
              <div className="flex gap-2">
                <input
                  required
                  className={inputCls}
                  placeholder="e.g. harutatev"
                  value={createForm.templateSlug}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      templateSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                    }))
                  }
                />
                <button type="button" onClick={generateSlug} className={`${btnSecondary} shrink-0`}>
                  Auto
                </button>
              </div>
            </FormRow>

            <FormRow label="Password">
              <div className="flex gap-2">
                <input
                  required
                  className={inputCls}
                  value={createForm.password}
                  onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                />
                <button type="button" onClick={generatePassword} className={`${btnSecondary} shrink-0`}>
                  Generate
                </button>
              </div>
            </FormRow>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false);
                  setError('');
                }}
                className={btnSecondary}
              >
                Cancel
              </button>
              <button type="submit" disabled={saving} className={btnPrimary}>
                {saving ? 'Creating…' : 'Create Customer'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <Modal title="Delete Customer" onClose={() => setDeleteTarget(null)}>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700">
              <p className="font-semibold mb-1">This action cannot be undone.</p>
              <p>You are about to permanently delete the customer account for:</p>
              <p className="mt-2 font-medium">{deleteTarget.firstName ?? ''} {deleteTarget.lastName ?? ''} — {deleteTarget.email}</p>
              {deleteTarget.templateSlug && (
                <p className="mt-1 text-red-500 text-xs">Their admin panel access to <span className="font-mono">/{deleteTarget.templateSlug}</span> will also be removed.</p>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className={btnSecondary} disabled={deleting}>
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Yes, delete customer'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {editTarget && (
        <Modal title="Edit Customer" onClose={() => setEditTarget(null)}>
          <form onSubmit={handleSaveEdit} className="space-y-4">
            {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>}

            <div className="grid grid-cols-2 gap-3">
              <FormRow label="First Name">
                <input
                  className={inputCls}
                  value={editForm.firstName}
                  onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))}
                />
              </FormRow>

              <FormRow label="Last Name">
                <input
                  className={inputCls}
                  value={editForm.lastName}
                  onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
                />
              </FormRow>
            </div>

            <FormRow label="Email">
              <input
                type="email"
                required
                className={inputCls}
                value={editForm.email}
                onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
              />
            </FormRow>

            <FormRow label="Role">
              <select
                className={inputCls}
                value={editForm.role}
                onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
              >
                <option value="customer">Customer</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </FormRow>

            {editTarget.templateSlug && (
              <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-500 space-y-1">
                <div>
                  Site:{' '}
                  <a
                    href={`/${editTarget.templateSlug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline"
                  >
                    /{editTarget.templateSlug}
                  </a>
                </div>
                <div>
                  Admin:{' '}
                  <a
                    href={`/${editTarget.templateSlug}/admin`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline"
                  >
                    /{editTarget.templateSlug}/admin
                  </a>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setEditTarget(null)} className={btnSecondary}>
                Cancel
              </button>
              <button type="submit" disabled={saving} className={btnPrimary}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {assignTarget && (
        <Modal
          title={`Assign "${assignTarget.name}" to Customer`}
          onClose={() => { setAssignTarget(null); setError(''); }}
        >
          <form onSubmit={handleAssign} className="space-y-4">
            {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>}

            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
              This grants an existing customer full admin-panel access (Ultimate plan) to this template.
            </div>

            <FormRow label="Customer">
              <select
                required
                className={inputCls}
                value={assignUserId}
                onChange={(e) => setAssignUserId(e.target.value)}
              >
                <option value="">— Select a customer —</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName ?? ''} {c.lastName ?? ''} ({c.email})
                  </option>
                ))}
              </select>
            </FormRow>

            <FormRow
              label="Admin URL slug"
              hint={assignSlug ? `Customer admin: /${assignSlug}/admin` : undefined}
            >
              <input
                required
                className={inputCls}
                value={assignSlug}
                onChange={(e) =>
                  setAssignSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                }
              />
            </FormRow>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setAssignTarget(null); setError(''); }}
                className={btnSecondary}
              >
                Cancel
              </button>
              <button type="submit" disabled={assigning} className={btnPrimary}>
                {assigning ? 'Assigning…' : 'Grant Access'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};