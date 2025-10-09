'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Home, Users, BarChart, Settings, Menu, X } from 'lucide-react';

export default function AdminDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <section className="bg-gray-900 p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">Welcome, Admin!</h2>
            <p className="text-gray-300 text-lg">
              This is your dashboard. Overview of all activities, quick stats, and recent updates are here.
            </p>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-lg font-medium">Total Users</h3>
                <p className="text-2xl font-bold text-blue-400">1,234</p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-lg font-medium">Active Sessions</h3>
                <p className="text-2xl font-bold text-green-400">567</p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-lg font-medium">Revenue</h3>
                <p className="text-2xl font-bold text-yellow-400">$12,345</p>
              </div>
            </div>
          </section>
        );
      case 'users':
        return (
          <section className="bg-gray-900 p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">Manage Users</h2>
            <p className="text-gray-300 text-lg">View and manage user accounts, roles, and permissions.</p>
            <div className="mt-6">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-400">
                    <th className="py-2">Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-gray-700">
                    <td className="py-3">John Doe</td>
                    <td>john@example.com</td>
                    <td>User</td>
                    <td>
                      <button className="text-blue-400 hover:text-blue-300">Edit</button>
                      <button className="text-red-400 hover:text-red-300 ml-4">Delete</button>
                    </td>
                  </tr>
                  <tr className="border-t border-gray-700">
                    <td className="py-3">Jane Smith</td>
                    <td>jane@example.com</td>
                    <td>Admin</td>
                    <td>
                      <button className="text-blue-400 hover:text-blue-300">Edit</button>
                      <button className="text-red-400 hover:text-red-300 ml-4">Delete</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        );
      case 'stats':
        return (
          <section className="bg-gray-900 p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">Statistics</h2>
            <p className="text-gray-300 text-lg">View detailed analytics and performance metrics.</p>
            <div className="mt-6">
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-lg font-medium">User Activity</h3>
                <p className="text-gray-400">Graph placeholder: User activity over time</p>
              </div>
            </div>
          </section>
        );
      case 'settings':
        return (
          <section className="bg-gray-900 p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">Settings</h2>
            <p className="text-gray-300 text-lg">Configure system settings and preferences.</p>
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-gray-300 block mb-1">Site Name</label>
                <input
                  type="text"
                  className="w-full p-2 bg-gray-800 text-white border border-gray-700 rounded-lg"
                  placeholder="Enter site name"
                />
              </div>
              <div>
                <label className="text-gray-300 block mb-1">Enable Notifications</label>
                <input type="checkbox" className="bg-gray-800 text-white border-gray-700" />
              </div>
              <button className="bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition">
                Save Settings
              </button>
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-[Poppins] flex">
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 bg-gray-900 border-r border-gray-800 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:w-64 p-6 flex flex-col justify-between z-50`}
      >
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">Admin Panel</h2>
            <button className="lg:hidden text-white" onClick={toggleSidebar}>
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 p-3 rounded-lg ${
                activeTab === 'dashboard' ? 'bg-gray-800 text-blue-400' : 'hover:bg-gray-800'
              }`}
            >
              <Home className="w-5 h-5" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 p-3 rounded-lg ${
                activeTab === 'users' ? 'bg-gray-800 text-blue-400' : 'hover:bg-gray-800'
              }`}
            >
              <Users className="w-5 h-5" />
              Users
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`w-full flex items-center gap-3 p-3 rounded-lg ${
                activeTab === 'stats' ? 'bg-gray-800 text-blue-400' : 'hover:bg-gray-800'
              }`}
            >
              <BarChart className="w-5 h-5" />
              Stats
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 p-3 rounded-lg ${
                activeTab === 'settings' ? 'bg-gray-800 text-blue-400' : 'hover:bg-gray-800'
              }`}
            >
              <Settings className="w-5 h-5" />
              Settings
            </button>
          </nav>
        </div>
        <Link href="/admin/login">
          <button className="w-full bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition">
            Logout
          </button>
        </Link>
      </aside>

      {/* Main Content */}
      <div className="flex-1 p-10">
        <header className="flex items-center justify-between mb-10">
          <button className="lg:hidden text-white" onClick={toggleSidebar}>
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="hidden lg:block">
            <Link href="/admin/login">
              <button className="bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition">
                Logout
              </button>
            </Link>
          </div>
        </header>

        <main>{renderContent()}</main>
      </div>
    </div>
  );
}