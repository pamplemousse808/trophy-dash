import React, { useState, useEffect, useCallback } from 'react';;
import { createClient } from '@supabase/supabase-js';
import { Mail, Download, Users, TrendingUp } from 'lucide-react';

// Initialize Supabase (same as your main app)
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

const EmailSignupsAdmin = () => {
  const [signups, setSignups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0
  });

 useEffect(() => {
  fetchSignups();
}, [fetchSignups]);

  const fetchSignups = useCallback(async () => {
  try {
    const { data, error } = await supabase
      .from('email_signups')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    setSignups(data || []);
    calculateStats(data || []);
  } catch (error) {
    console.error('Error fetching signups:', error);
  } finally {
    setLoading(false);
  }
}, []);

  const calculateStats = (data) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const todayCount = data.filter(s => new Date(s.created_at) >= today).length;
    const weekCount = data.filter(s => new Date(s.created_at) >= weekAgo).length;
    const monthCount = data.filter(s => new Date(s.created_at) >= monthAgo).length;

    setStats({
      total: data.length,
      today: todayCount,
      thisWeek: weekCount,
      thisMonth: monthCount
    });
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Email', 'Signup Date', 'Active', 'Source'],
      ...signups.map(s => [
        s.email,
        new Date(s.created_at).toLocaleDateString('en-GB'),
        s.is_active ? 'Yes' : 'No',
        s.referral_source || 'Unknown'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trophy-dash-signups-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const copyAllEmails = () => {
    const emails = signups.filter(s => s.is_active).map(s => s.email).join(', ');
    navigator.clipboard.writeText(emails);
    alert(`Copied ${signups.filter(s => s.is_active).length} email addresses to clipboard!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Mail className="mx-auto text-blue-600 animate-pulse mb-4" size={64} />
          <p className="text-gray-600 text-lg">Loading signups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Signups</h1>
          <p className="text-gray-600">Trophy Dash newsletter subscribers</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Subscribers</h3>
              <Users className="text-blue-600" size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Today</h3>
              <TrendingUp className="text-green-600" size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.today}</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">This Week</h3>
              <TrendingUp className="text-blue-600" size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.thisWeek}</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">This Month</h3>
              <TrendingUp className="text-purple-600" size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.thisMonth}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-8">
          <div className="flex gap-4">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download size={18} />
              Export to CSV
            </button>
            <button
              onClick={copyAllEmails}
              className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Mail size={18} />
              Copy All Emails
            </button>
          </div>
        </div>

        {/* Signups Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Signup Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {signups.map((signup) => (
                  <tr key={signup.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {signup.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(signup.created_at).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {signup.referral_source || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {signup.is_active ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                          Inactive
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {signups.length === 0 && (
          <div className="text-center py-12">
            <Mail className="mx-auto text-gray-300 mb-4" size={64} />
            <p className="text-gray-500 text-lg">No signups yet. Share your site to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailSignupsAdmin;