import React from 'react';
import { Link } from 'wouter';

export const AdminAccess: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Ultimate Template Access
          </h2>
          <p className="mt-2 text-gray-600">
            Welcome to your premium wedding template management system
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Premium Customer Portal
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Access your admin panel to manage RSVPs, photos, and wedding details
            </p>
          </div>
          
          <div className="space-y-4">
            <Link 
              href="/admin/login"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Sign In to Admin Panel
            </Link>
            
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Only available for Ultimate template customers (37,000 AMD)
              </p>
            </div>
          </div>
          
          <div className="border-t pt-6">
            <div className="text-center">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                What's included:
              </h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• RSVP Management & Export</li>
                <li>• Guest Photo Approval</li>
                <li>• Google Drive Integration</li>
                <li>• Real-time Analytics</li>
                <li>• Premium Support</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <Link 
            href="/"
            className="text-indigo-600 hover:text-indigo-500 text-sm"
          >
            ← Back to Main Site
          </Link>
        </div>
      </div>
    </div>
  );
};