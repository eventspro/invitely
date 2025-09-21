import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';

interface TemplateAdminDashboardProps {
  templateSlug: string;
}

export const TemplateAdminDashboard: React.FC<TemplateAdminDashboardProps> = ({ templateSlug }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('templateAdminToken');
    const userStr = localStorage.getItem('templateAdminUser');
    const storedSlug = localStorage.getItem('templateSlug');

    if (!token || !userStr || storedSlug !== templateSlug) {
      setLocation(`/${templateSlug}/admin`);
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      setUser(userData);
    } catch (err) {
      setLocation(`/${templateSlug}/admin`);
      return;
    }

    setLoading(false);
  }, [templateSlug, setLocation]);

  const handleLogout = () => {
    localStorage.removeItem('templateAdminToken');
    localStorage.removeItem('templateAdminUser');
    localStorage.removeItem('templateSlug');
    setLocation(`/${templateSlug}/admin`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
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
                  <p className="text-sm text-gray-500">Administrator</p>
                </div>
              </div>

              {/* Admin Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  Help & Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};