import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';

interface UltimateCustomer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  templateId: string;
  templateSlug: string;
  createdAt: string;
  isActive: boolean;
}

export const PlatformAdminPanel: React.FC = () => {
  const [customers, setCustomers] = useState<UltimateCustomer[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    templateId: '',
    templateSlug: ''
  });
  const [, setLocation] = useLocation();

  // Platform admin authentication check
  useEffect(() => {
    const checkAuth = async () => {
      // For now, simple password protection. You can enhance this
      const password = prompt('Enter platform admin password:');
      if (password !== 'admin123') { // Change this password!
        alert('Access denied');
        setLocation('/');
        return;
      }
      loadData();
    };
    checkAuth();
  }, []);

  const loadData = async () => {
    try {
      // Load templates
      const templatesResponse = await fetch('/api/templates');
      if (templatesResponse.ok) {
        const templatesData = await templatesResponse.json();
        setTemplates(templatesData);
      }

      // Load Ultimate customers - we'll create this endpoint
      const customersResponse = await fetch('/api/platform-admin/ultimate-customers');
      if (customersResponse.ok) {
        const customersData = await customersResponse.json();
        setCustomers(customersData);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/platform-admin/create-ultimate-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomer)
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Customer created successfully!\n\nLogin URL: ${window.location.origin}/${newCustomer.templateSlug}/admin\nEmail: ${newCustomer.email}\nPassword: ${newCustomer.password}\n\nPlease provide these credentials to your customer.`);
        
        setNewCustomer({
          email: '',
          firstName: '',
          lastName: '',
          password: '',
          templateId: '',
          templateSlug: ''
        });
        setShowCreateForm(false);
        loadData(); // Refresh the list
      } else {
        const error = await response.json();
        alert('Error: ' + error.message);
      }
    } catch (error) {
      alert('Network error: ' + error);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCustomer({ ...newCustomer, password });
  };

  const generateSlug = () => {
    const slug = `${newCustomer.firstName}${newCustomer.lastName}`.toLowerCase().replace(/[^a-z0-9]/g, '');
    setNewCustomer({ ...newCustomer, templateSlug: slug });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Platform Admin Panel</h1>
              <p className="text-gray-600">Manage Ultimate Template Customers</p>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              {showCreateForm ? 'Cancel' : 'Create New Customer'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Create Customer Form */}
        {showCreateForm && (
          <div className="bg-white shadow rounded-lg mb-8 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Create Ultimate Customer</h2>
            <form onSubmit={createCustomer} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    required
                    value={newCustomer.firstName}
                    onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    required
                    value={newCustomer.lastName}
                    onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    required
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Template</label>
                  <select
                    required
                    value={newCustomer.templateId}
                    onChange={(e) => setNewCustomer({ ...newCustomer, templateId: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select Template</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name} ({template.slug})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Template Slug (URL)</label>
                  <div className="flex">
                    <input
                      type="text"
                      required
                      value={newCustomer.templateSlug}
                      onChange={(e) => setNewCustomer({ ...newCustomer, templateSlug: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="johndoe"
                    />
                    <button
                      type="button"
                      onClick={generateSlug}
                      className="ml-2 px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                      Auto
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Customer will access: /{newCustomer.templateSlug}/admin
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <div className="flex">
                    <input
                      type="text"
                      required
                      value={newCustomer.password}
                      onChange={(e) => setNewCustomer({ ...newCustomer, password: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="ml-2 px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                      Generate
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Create Customer
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Customers List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Ultimate Customers ({customers.length})
            </h3>
            
            {customers.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No Ultimate customers yet. Create your first one above!
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Template Access
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customers.map((customer) => (
                      <tr key={customer.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {customer.firstName} {customer.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{customer.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <a 
                              href={`/${customer.templateSlug}`} 
                              target="_blank" 
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              /{customer.templateSlug}
                            </a>
                          </div>
                          <div className="text-sm text-gray-500">
                            Admin: 
                            <a 
                              href={`/${customer.templateSlug}/admin`} 
                              target="_blank" 
                              className="text-indigo-600 hover:text-indigo-900 ml-1"
                            >
                              /{customer.templateSlug}/admin
                            </a>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(customer.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            customer.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {customer.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={() => alert('Customer management features coming soon!')}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => alert('Deactivation feature coming soon!')}
                            className="text-red-600 hover:text-red-900"
                          >
                            Deactivate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};