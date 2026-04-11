import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';

interface TemplateAdminDashboardProps {
  templateSlug: string;
}

interface AdminUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  templateId?: string;
  templateSlug?: string;
}

interface ConfigDraft {
  couple?: { groomName?: string; brideName?: string; combinedNames?: string };
  wedding?: { date?: string; displayDate?: string };
  hero?: { invitation?: string; welcomeMessage?: string };
}

export const TemplateAdminDashboard: React.FC<TemplateAdminDashboardProps> = ({ templateSlug }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  // Super-admin edit state
  const [activeTab, setActiveTab] = useState<'overview' | 'edit'>('overview');
  const [configDraft, setConfigDraft] = useState<ConfigDraft>({});
  const [configLoading, setConfigLoading] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('templateAdminToken');
    const userStr = localStorage.getItem('templateAdminUser');
    const storedSlug = localStorage.getItem('templateSlug');

    if (!token || !userStr || storedSlug !== templateSlug) {
      setLocation(`/${templateSlug}/admin`);
      return;
    }

    try {
      const userData = JSON.parse(userStr) as AdminUser;
      setUser(userData);
    } catch {
      setLocation(`/${templateSlug}/admin`);
      return;
    }

    setLoading(false);
  }, [templateSlug, setLocation]);

  // When super_admin opens the edit tab, load current config
  useEffect(() => {
    if (activeTab !== 'edit' || !user || user.role !== 'super_admin' || !user.templateId) return;

    setConfigLoading(true);
    setSaveMessage(null);

    fetch(`/api/templates/${user.templateId}/config`)
      .then(r => r.json())
      .then(data => {
        const c = data.config ?? data;
        setConfigDraft({
          couple: {
            groomName: c.couple?.groomName ?? '',
            brideName: c.couple?.brideName ?? '',
            combinedNames: c.couple?.combinedNames ?? '',
          },
          wedding: {
            date: c.wedding?.date ?? '',
            displayDate: c.wedding?.displayDate ?? '',
          },
          hero: {
            invitation: c.hero?.invitation ?? '',
            welcomeMessage: c.hero?.welcomeMessage ?? '',
          },
        });
      })
      .catch(() => setSaveMessage({ type: 'error', text: 'Failed to load current config.' }))
      .finally(() => setConfigLoading(false));
  }, [activeTab, user]);

  const handleLogout = () => {
    localStorage.removeItem('templateAdminToken');
    localStorage.removeItem('templateAdminUser');
    localStorage.removeItem('templateSlug');
    setLocation(`/${templateSlug}/admin`);
  };

  const handleSaveConfig = async () => {
    if (!user?.templateId) return;
    setSavingConfig(true);
    setSaveMessage(null);
    try {
      const token = localStorage.getItem('templateAdminToken');
      const resp = await fetch(`/api/admin-panel/${user.templateId}/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ config: configDraft }),
      });
      const data = await resp.json();
      if (resp.ok) {
        setSaveMessage({ type: 'success', text: 'Changes saved successfully.' });
      } else {
        setSaveMessage({ type: 'error', text: data.error ?? 'Save failed.' });
      }
    } catch {
      setSaveMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSavingConfig(false);
    }
  };

  const setCouple = (field: keyof NonNullable<ConfigDraft['couple']>, value: string) =>
    setConfigDraft(d => ({ ...d, couple: { ...d.couple, [field]: value } }));

  const setWedding = (field: keyof NonNullable<ConfigDraft['wedding']>, value: string) =>
    setConfigDraft(d => ({ ...d, wedding: { ...d.wedding, [field]: value } }));

  const setHero = (field: keyof NonNullable<ConfigDraft['hero']>, value: string) =>
    setConfigDraft(d => ({ ...d, hero: { ...d.hero, [field]: value } }));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Wedding Admin Panel
              </h1>
              <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                {templateSlug}
              </span>
              {isSuperAdmin && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  Super Admin
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Tab bar — only shown version for super admins */}
      {isSuperAdmin && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 text-sm font-medium ${
                  activeTab === 'overview'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('edit')}
                className={`py-2 px-1 border-b-2 text-sm font-medium ${
                  activeTab === 'edit'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Edit Template
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          {/* ─── Super Admin: Edit Template tab ─── */}
          {isSuperAdmin && activeTab === 'edit' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Edit Your Template</h2>

              {configLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Couple */}
                  <section>
                    <h3 className="text-base font-semibold text-gray-700 mb-3 border-b pb-2">Couple Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Groom Name</label>
                        <input
                          type="text"
                          value={configDraft.couple?.groomName ?? ''}
                          onChange={e => setCouple('groomName', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bride Name</label>
                        <input
                          type="text"
                          value={configDraft.couple?.brideName ?? ''}
                          onChange={e => setCouple('brideName', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Combined Names</label>
                        <input
                          type="text"
                          value={configDraft.couple?.combinedNames ?? ''}
                          onChange={e => setCouple('combinedNames', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Wedding Date */}
                  <section>
                    <h3 className="text-base font-semibold text-gray-700 mb-3 border-b pb-2">Wedding Date</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date (ISO: YYYY-MM-DDTHH:MM:SS)</label>
                        <input
                          type="text"
                          value={configDraft.wedding?.date ?? ''}
                          onChange={e => setWedding('date', e.target.value)}
                          placeholder="2025-09-15T18:00:00"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Display Date</label>
                        <input
                          type="text"
                          value={configDraft.wedding?.displayDate ?? ''}
                          onChange={e => setWedding('displayDate', e.target.value)}
                          placeholder="September 15, 2025"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Hero Section */}
                  <section>
                    <h3 className="text-base font-semibold text-gray-700 mb-3 border-b pb-2">Hero Section</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Invitation Text</label>
                        <input
                          type="text"
                          value={configDraft.hero?.invitation ?? ''}
                          onChange={e => setHero('invitation', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Welcome Message</label>
                        <textarea
                          value={configDraft.hero?.welcomeMessage ?? ''}
                          onChange={e => setHero('welcomeMessage', e.target.value)}
                          rows={3}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Save */}
                  {saveMessage && (
                    <div className={`rounded-md p-3 text-sm ${saveMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {saveMessage.text}
                    </div>
                  )}
                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveConfig}
                      disabled={savingConfig}
                      className="inline-flex items-center px-5 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {savingConfig ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── Overview tab (default for all roles) ─── */}
          {(!isSuperAdmin || activeTab === 'overview') && (
            <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Wedding Template Administration
                </h2>
                <p className="text-gray-600 mb-8">
                  Manage your wedding website content and settings
                </p>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900">Template</h3>
                    <p className="text-3xl font-bold text-indigo-600">{templateSlug}</p>
                    <p className="text-sm text-gray-500">Ultimate Package</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900">Status</h3>
                    <p className="text-3xl font-bold text-green-600">Active</p>
                    <p className="text-sm text-gray-500">Website is live</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900">Admin</h3>
                    <p className="text-lg font-medium text-gray-900">{user?.email}</p>
                    <p className="text-sm text-gray-500">
                      {isSuperAdmin ? 'Super Admin' : 'Administrator'}
                    </p>
                  </div>
                </div>

                {/* Admin Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {isSuperAdmin && (
                    <button
                      onClick={() => setActiveTab('edit')}
                      className="bg-indigo-50 border border-indigo-200 p-6 rounded-lg shadow hover:shadow-md transition-shadow text-left"
                    >
                      <h3 className="text-lg font-medium text-indigo-900 mb-2">Edit Template</h3>
                      <p className="text-sm text-indigo-600">Update couple names, date, hero text</p>
                    </button>
                  )}
                  <button className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-left">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Content Management</h3>
                    <p className="text-sm text-gray-600">Edit wedding details, photos, and story</p>
                  </button>
                  <button className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-left">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Guest Management</h3>
                    <p className="text-sm text-gray-600">Manage invitations and RSVPs</p>
                  </button>
                  <button className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-left">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Design Settings</h3>
                    <p className="text-sm text-gray-600">Customize colors, fonts, and layout</p>
                  </button>
                  <button className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-left">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Gallery</h3>
                    <p className="text-sm text-gray-600">Upload and organize photos</p>
                  </button>
                  <button className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-left">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics</h3>
                    <p className="text-sm text-gray-600">View site traffic and engagement</p>
                  </button>
                  <button className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-left">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Settings</h3>
                    <p className="text-sm text-gray-600">Domain, SEO, and technical settings</p>
                  </button>
                </div>

                {/* Quick Links */}
                <div className="mt-8 flex justify-center space-x-4">
                  <a
                    href={`/${templateSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    View Wedding Site
                    <svg className="ml-2 -mr-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </a>
                  <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    Help &amp; Support
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};