import React, { useState, useEffect } from 'react';
import { Users, MessageSquare, AlertCircle, CheckCircle, TrendingUp, Clock, Phone, Mail, Globe, Check, X, Key, Lock } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';

interface Statistics {
  total_users: number;
  total_complaints: number;
  pending_complaints: number;
  resolved_complaints: number;
  last_updated: string;
}

interface AdminDashboardProps {
  adminUser: any;
}

interface User {
  id: string;
  email: string;
  name: string;
  institution?: string;
  phone?: string;
  created_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ adminUser }) => {
  const { isDarkMode } = useTheme();
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recentComplaints, setRecentComplaints] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  useEffect(() => {
    loadStatistics();
    loadRecentComplaints();
    loadAllUsers();
    
    // Set up real-time updates
    const interval = setInterval(() => {
      loadStatistics();
      loadRecentComplaints();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const loadAllUsers = async () => {
    try {
      const { data, error } = await supabase.rpc('get_all_users_for_admin', {
        admin_id: adminUser.id
      });
      
      if (error) throw error;
      setAllUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handlePasswordReset = async () => {
    if (!selectedUser || !newPassword.trim()) return;

    setIsResettingPassword(true);
    try {
      const { data, error } = await supabase.rpc('reset_user_password', {
        target_user_id: selectedUser.id,
        new_password: newPassword.trim(),
        admin_id: adminUser.id
      });

      if (error) throw error;

      if (data.success) {
        alert('Password reset successfully!');
        setShowPasswordReset(false);
        setSelectedUser(null);
        setNewPassword('');
      } else {
        alert(data.error || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('Failed to reset password. Please try again.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const markComplaintResolved = async (complaintId: string) => {
    try {
      const { error } = await supabase
        .from('complaints')
        .update({ 
          status: 'resolved',
          replied_at: new Date().toISOString(),
          replied_by: adminUser.id,
          admin_reply: 'Issue marked as resolved by admin.'
        })
        .eq('id', complaintId);

      if (error) throw error;
      
      // Reload complaints
      loadRecentComplaints();
      alert('Complaint marked as resolved!');
    } catch (error) {
      console.error('Error marking complaint as resolved:', error);
      alert('Failed to mark complaint as resolved.');
    }
  };

  const loadStatistics = async () => {
    try {
      const { data, error } = await supabase.rpc('get_current_statistics');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setStatistics(data[0]);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecentComplaints = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_complaints_view')
        .select('*')
        .limit(5);

      if (error) throw error;
      setRecentComplaints(data || []);
    } catch (error) {
      console.error('Error loading recent complaints:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return isDarkMode ? 'text-red-300 bg-red-900 bg-opacity-30' : 'text-red-700 bg-red-100';
      case 'high':
        return isDarkMode ? 'text-orange-300 bg-orange-900 bg-opacity-30' : 'text-orange-700 bg-orange-100';
      case 'normal':
        return isDarkMode ? 'text-blue-300 bg-blue-900 bg-opacity-30' : 'text-blue-700 bg-blue-100';
      case 'low':
        return isDarkMode ? 'text-gray-300 bg-gray-700' : 'text-gray-700 bg-gray-100';
      default:
        return isDarkMode ? 'text-gray-300 bg-gray-700' : 'text-gray-700 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-sm border p-6`}>
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Users</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                {statistics?.total_users || 0}
              </p>
            </div>
          </div>
        </div>

        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-sm border p-6`}>
          <div className="flex items-center">
            <MessageSquare className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Messages</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                {statistics?.total_complaints || 0}
              </p>
            </div>
          </div>
        </div>

        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-sm border p-6`}>
          <div className="flex items-center">
            <AlertCircle className="w-8 h-8 text-yellow-600" />
            <div className="ml-4">
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pending</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                {statistics?.pending_complaints || 0}
              </p>
            </div>
          </div>
        </div>

        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-sm border p-6`}>
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Resolved</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                {statistics?.resolved_complaints || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Complaints */}
      <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-lg border`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
              Recent Messages & Complaints
            </h2>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>Last updated: {statistics?.last_updated ? formatDate(statistics.last_updated) : 'Never'}</span>
            </div>
          </div>

          {recentComplaints.length > 0 ? (
            <div className="space-y-4">
              {recentComplaints.map((complaint) => (
                <div key={complaint.id} className={`p-4 border rounded-lg ${isDarkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                          {complaint.subject}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${getPriorityColor(complaint.priority || 'normal')}`}>
                          {complaint.priority || 'normal'}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          complaint.status === 'resolved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {complaint.status}
                        </span>
                      </div>
                      
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2 flex items-center space-x-4`}>
                        <span className="flex items-center space-x-1">
                          <Mail className="w-4 h-4" />
                          <span>{complaint.email}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Phone className="w-4 h-4" />
                          <span>{complaint.phone}</span>
                        </span>
                      </div>
                      
                      <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} text-sm mb-2`}>
                        {complaint.message.length > 150 
                          ? `${complaint.message.substring(0, 150)}...` 
                          : complaint.message
                        }
                      </p>
                      
                      {complaint.admin_reply && (
                        <div className={`mt-3 p-3 rounded border-l-4 border-blue-500 ${isDarkMode ? 'bg-gray-800' : 'bg-blue-50'}`}>
                          <div className={`text-sm font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-700'} mb-1`}>
                            Reply by {complaint.replied_by_name || 'Admin'}:
                            {complaint.status === 'pending' && (
                              <button
                                onClick={() => markComplaintResolved(complaint.id)}
                                className="p-1 bg-green-600 hover:bg-green-700 text-white rounded-full transition-colors duration-200"
                                title="Mark as resolved"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {complaint.admin_reply}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} text-right ml-4`}>
                      <div>{formatDate(complaint.created_at)}</div>
                      {complaint.age_category && (
                        <div className={`mt-1 px-2 py-1 rounded text-xs ${
                          complaint.age_category === 'new' 
                            ? 'bg-green-100 text-green-800'
                            : complaint.age_category === 'recent'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {complaint.age_category}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div 
              onClick={() => setShowUserManagement(true)}
              className={`p-4 rounded-lg border ${isDarkMode ? 'border-gray-600 hover:border-green-500' : 'border-gray-200 hover:border-green-300'} transition-colors cursor-pointer`}
            >
              <MessageSquare className={`w-16 h-16 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'} mx-auto mb-4`} />
                <Users className="w-6 h-6 text-green-600" />
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-lg border p-6`}>
        <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} mb-4`}>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg border ${isDarkMode ? 'border-gray-600 hover:border-blue-500' : 'border-gray-200 hover:border-blue-300'} transition-colors cursor-pointer`}>
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>View Analytics</h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Detailed user statistics</p>
              </div>
            </div>
          </div>
          
          <div className={`p-4 rounded-lg border ${isDarkMode ? 'border-gray-600 hover:border-green-500' : 'border-gray-200 hover:border-green-300'} transition-colors cursor-pointer`}>
            <div className="flex items-center space-x-3">
              <MessageSquare className="w-6 h-6 text-green-600" />
                  <h3 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>User Management</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Manage user accounts</p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Reply to multiple messages</p>
              </div>
            </div>
          </div>
          
          <div className={`p-4 rounded-lg border ${isDarkMode ? 'border-gray-600 hover:border-purple-500' : 'border-gray-200 hover:border-purple-300'} transition-colors cursor-pointer`}>
            <div className="flex items-center space-x-3">
              <Globe className="w-6 h-6 text-purple-600" />
              <div>
                <h3 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>System Status</h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Monitor system health</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Management Modal */}
      {showUserManagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                User Management
              </h2>
              <button
                onClick={() => setShowUserManagement(false)}
                className={`p-2 ${isDarkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'} rounded-lg transition-colors duration-200`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {allUsers.map((user) => (
                <div key={user.id} className={`p-4 border rounded-lg ${isDarkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {user.name || 'No name'}
                      </h3>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {user.email}
                      </p>
                      {user.institution && (
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {user.institution}
                        </p>
                      )}
                      <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        Joined: {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowPasswordReset(true);
                      }}
                      className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors duration-200"
                    >
                      <Key className="w-4 h-4" />
                      <span>Reset Password</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordReset && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 w-full max-w-md shadow-2xl`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                Reset Password
              </h2>
              <button
                onClick={() => {
                  setShowPasswordReset(false);
                  setSelectedUser(null);
                  setNewPassword('');
                }}
                className={`p-2 ${isDarkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'} rounded-lg transition-colors duration-200`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Resetting password for:
              </p>
              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <p className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  {selectedUser.name || 'No name'}
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {selectedUser.email}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                New Password
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500'} border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200`}
                  placeholder="Enter new password"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowPasswordReset(false);
                  setSelectedUser(null);
                  setNewPassword('');
                }}
                className={`px-4 py-2 ${isDarkMode ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-800'} font-medium transition-colors duration-200`}
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordReset}
                disabled={isResettingPassword || !newPassword.trim()}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResettingPassword ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;