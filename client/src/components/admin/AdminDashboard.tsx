import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';

interface DashboardStats {
  rsvpStats: {
    totalRsvps: number;
    attendingCount: number;
    notAttendingCount: number;
    pendingCount: number;
  };
  photoStats: {
    totalPhotos: number;
    approvedPhotos: number;
    pendingPhotos: number;
  };
  googleDriveConnected: boolean;
  recentRsvps: any[];
  recentPhotos: any[];
  driveIntegration?: any;
}

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [templateId, setTemplateId] = useState('default-harut-tatev'); // Default template
  const [location, setLocation] = useLocation();

  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setLocation('/admin/login');
      return null;
    }
    return { 'Authorization': `Bearer ${token}` };
  };

  const fetchDashboardData = async () => {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/admin-panel/${templateId}/dashboard`, {
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else if (response.status === 401) {
        // Token expired
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        setLocation('/admin/login');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load dashboard');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const exportRsvps = async (format: 'excel' | 'csv') => {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      const response = await fetch(`/api/admin-panel/${templateId}/rsvps/export?format=${format}`, {
        headers,
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `rsvps-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Export failed');
      }
    } catch (err) {
      setError('Export failed. Please try again.');
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setLocation('/admin/login');
  };

  useEffect(() => {
    fetchDashboardData();
  }, [templateId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">{error}</div>
          <button
            onClick={fetchDashboardData}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const user = JSON.parse(localStorage.getItem('adminUser') || '{}');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Wedding Admin Panel</h1>
              <p className="text-gray-600">Welcome, {user.firstName} {user.lastName}</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => fetchDashboardData()}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
              >
                Refresh
              </button>
              <button
                onClick={logout}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold">R</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total RSVPs</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats?.rsvpStats.totalRsvps || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold">✓</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Attending</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats?.rsvpStats.attendingCount || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold">📷</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Photos</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats?.photoStats.totalPhotos || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 ${stats?.googleDriveConnected ? 'bg-green-500' : 'bg-gray-400'} rounded-md flex items-center justify-center`}>
                    <span className="text-white font-bold">G</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Google Drive</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.googleDriveConnected ? 'Connected' : 'Not Connected'}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Export & Management
            </h3>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => exportRsvps('excel')}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Export RSVPs (Excel)
              </button>
              <button
                onClick={() => exportRsvps('csv')}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Export RSVPs (CSV)
              </button>
              <button
                onClick={() => alert('Photo management coming soon!')}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
              >
                Manage Photos
              </button>
              <button
                onClick={() => alert('Google Drive setup coming soon!')}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Configure Google Drive
              </button>
            </div>
          </div>
        </div>

        {/* RSVP Details */}
        {stats && stats.rsvpStats.totalRsvps > 0 && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                RSVP Breakdown
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.rsvpStats.attendingCount}
                  </div>
                  <div className="text-sm text-gray-500">Attending</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {stats.rsvpStats.notAttendingCount}
                  </div>
                  <div className="text-sm text-gray-500">Not Attending</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {stats.rsvpStats.pendingCount}
                  </div>
                  <div className="text-sm text-gray-500">Pending</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};