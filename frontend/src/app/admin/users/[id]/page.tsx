'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  _id: string;
  username: string;
  email: string;
  role: 'admin' | 'editor' | 'user';
  isActive: boolean;
  profile: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatar?: string;
    location?: string;
    website?: string;
  };
  preferences: {
    favoriteCategories: string[];
    emailNotifications: boolean;
    publicProfile: boolean;
  };
  stats: {
    totalListeningTime: number;
    episodesListened: number;
    commentsCount: number;
    playlistsCount: number;
    lastActiveAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const { token } = useAuth();
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<User>>({});

  useEffect(() => {
    if (token && userId) {
      fetchUserDetails();
    }
  }, [token, userId]);

  const fetchUserDetails = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setEditForm(userData);
      } else if (response.status === 404) {
        alert('User not found');
        router.push('/admin/users');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5001/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        setIsEditing(false);
        alert('User updated successfully');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || 'Failed to update user'}`);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
    }
  };

  const handleToggleStatus = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`http://localhost:5001/api/users/${userId}/toggle-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        alert(`User ${updatedUser.isActive ? 'activated' : 'deactivated'} successfully`);
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      alert('Failed to update user status');
    }
  };

  const handleDeleteUser = async () => {
    if (!user) return;
    
    if (!confirm(`Are you sure you want to delete user "${user.username}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5001/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('User deleted successfully');
        router.push('/admin/users');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || 'Failed to delete user'}`);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDisplayName = (user: User) => {
    if (user.profile?.firstName && user.profile?.lastName) {
      return `${user.profile.firstName} ${user.profile.lastName}`;
    }
    return user.username;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <span className="ml-3 text-gray-600">Loading user details...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">User Not Found</h2>
          <Link href="/admin/users" className="text-red-600 hover:text-red-800">
            Back to Users
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/admin/users" className="text-gray-600 hover:text-gray-900">
                ← Back to Users
              </Link>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">FM</span>
                </div>
                <span className="text-xl font-bold text-gray-900">User Details</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                {isEditing ? 'Cancel Edit' : 'Edit User'}
              </button>
              <button
                onClick={handleToggleStatus}
                className={`px-4 py-2 rounded-lg ${
                  user.isActive
                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {user.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={handleDeleteUser}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Profile Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mr-6">
                {user.profile?.avatar ? (
                  <img
                    src={user.profile.avatar}
                    alt={getDisplayName(user)}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-2xl">
                    {user.username.substring(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{getDisplayName(user)}</h1>
                <p className="text-gray-600">@{user.username}</p>
                <p className="text-gray-600">{user.email}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    user.role === 'admin' ? 'bg-red-100 text-red-800' :
                    user.role === 'editor' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role}
                  </span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Member since</p>
              <p className="font-semibold">{formatDate(user.createdAt)}</p>
              <p className="text-sm text-gray-600 mt-2">Last active</p>
              <p className="font-semibold">{user.stats?.lastActiveAt ? formatDate(user.stats.lastActiveAt) : 'Never'}</p>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        {isEditing && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Edit User Details</h2>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={editForm.username || ''}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editForm.email || ''}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={editForm.profile?.firstName || ''}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      profile: { ...editForm.profile, firstName: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={editForm.profile?.lastName || ''}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      profile: { ...editForm.profile, lastName: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={editForm.role || 'user'}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-gray-900"
                  >
                    <option value="user">User</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={editForm.profile?.location || ''}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      profile: { ...editForm.profile, location: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-gray-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  value={editForm.profile?.bio || ''}
                  onChange={(e) => setEditForm({
                    ...editForm,
                    profile: { ...editForm.profile, bio: e.target.value }
                  })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-gray-900"
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Activity Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">🎧</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Listening Time</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatDuration(user.stats?.totalListeningTime || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">📻</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Episodes</p>
                <p className="text-2xl font-semibold text-gray-900">{user.stats?.episodesListened || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <span className="text-2xl">💬</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Comments</p>
                <p className="text-2xl font-semibold text-gray-900">{user.stats?.commentsCount || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-2xl">📋</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Playlists</p>
                <p className="text-2xl font-semibold text-gray-900">{user.stats?.playlistsCount || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* User Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">User Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Personal Details</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">Full Name</p>
                  <p className="text-gray-900">{getDisplayName(user)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Email</p>
                  <p className="text-gray-900">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Location</p>
                  <p className="text-gray-900">{user.profile?.location || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Website</p>
                  <p className="text-gray-900">{user.profile?.website || 'Not specified'}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Preferences</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">Email Notifications</p>
                  <p className="text-gray-900">{user.preferences?.emailNotifications ? 'Enabled' : 'Disabled'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Public Profile</p>
                  <p className="text-gray-900">{user.preferences?.publicProfile ? 'Yes' : 'No'}</p>
                </div>
                {user.preferences?.favoriteCategories && user.preferences.favoriteCategories.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Favorite Categories</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {user.preferences.favoriteCategories.map((category, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 text-sm rounded">
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {user.profile?.bio && (
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-2">Bio</h4>
              <p className="text-gray-700">{user.profile.bio}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}