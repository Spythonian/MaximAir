'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface UserProfile {
  _id: string;
  username: string;
  email: string;
  role: string;
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
    favoritesCount: number;
    averageSessionDuration: number;
    lastActiveAt: string;
  };
  createdAt: string;
}

export default function ProfilePage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    location: '',
    website: '',
    favoriteCategories: [] as string[],
    emailNotifications: true,
    publicProfile: true,
  });

  useEffect(() => {
    if (loading) return; 

    if (!user || !token) {
      router.push('/auth/login?message=Please log in to view your profile.');
      return;
    }

    if (user.role === 'visitor') {
      router.push('/?message=You are logged in as a visitor. This content is for registered users only.');
      return;
    }
    
    fetchProfile();
  }, [user, token, router, loading]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setFormData({
          firstName: data.profile?.firstName || '',
          lastName: data.profile?.lastName || '',
          bio: data.profile?.bio || '',
          location: data.profile?.location || '',
          website: data.profile?.website || '',
          favoriteCategories: data.preferences?.favoriteCategories || [],
          emailNotifications: data.preferences?.emailNotifications ?? true,
          publicProfile: data.preferences?.publicProfile ?? true,
        });
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch profile' }));
        console.error('Profile fetch error:', errorData);
        if (response.status === 401) {
          router.push('/auth/login');
        }
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          profile: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            bio: formData.bio,
            location: formData.location,
            website: formData.website,
          },
          preferences: {
            favoriteCategories: formData.favoriteCategories,
            emailNotifications: formData.emailNotifications,
            publicProfile: formData.publicProfile,
          },
        }),
      });

      if (response.ok) {
        await fetchProfile();
        setEditing(false);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update profile' }));
        console.error('Profile update error:', errorData);
        alert(`Failed to update profile: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const categories = ['Music', 'Technology', 'Interview', 'Community', 'News', 'Sports', 'Entertainment', 'Other'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile not found</h2>
          <p className="text-gray-600">Unable to load your profile information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
              {profile.profile.avatar ? (
                <Image
                  src={profile.profile.avatar}
                  alt="Profile"
                  width={96}
                  height={96}
                  className="rounded-full"
                />
              ) : (
                <span className="text-3xl font-bold">
                  {profile.username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-4xl font-bold">
                {profile.profile.firstName && profile.profile.lastName
                  ? `${profile.profile.firstName} ${profile.profile.lastName}`
                  : profile.username}
              </h1>
              <p className="text-red-100 text-lg">@{profile.username}</p>
              {profile.profile.location && (
                <p className="text-red-200 flex items-center mt-1">
                  <span className="mr-1">📍</span>
                  {profile.profile.location}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">About</h2>
                <button
                  onClick={() => setEditing(!editing)}
                  className="text-red-600 hover:text-red-700 font-medium"
                >
                  {editing ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>

              {editing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bio
                    </label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="City, Country"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Website
                      </label>
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setEditing(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {profile.profile.bio ? (
                    <p className="text-gray-700">{profile.profile.bio}</p>
                  ) : (
                    <p className="text-gray-500 italic">No bio added yet.</p>
                  )}
                  
                  {profile.profile.website && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Website: </span>
                      <a
                        href={profile.profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-600 hover:text-red-700"
                      >
                        {profile.profile.website}
                      </a>
                    </div>
                  )}
                  
                  <div className="text-sm text-gray-500">
                    Member since {new Date(profile.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long'
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Favorite Categories */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Favorite Categories</h2>
              {editing ? (
                <div className="space-y-2">
                  {categories.map((category) => (
                    <label key={category} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.favoriteCategories.includes(category)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              favoriteCategories: [...formData.favoriteCategories, category]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              favoriteCategories: formData.favoriteCategories.filter(c => c !== category)
                            });
                          }
                        }}
                        className="mr-2"
                      />
                      {category}
                    </label>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.preferences.favoriteCategories.length > 0 ? (
                    profile.preferences.favoriteCategories.map((category) => (
                      <span
                        key={category}
                        className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                      >
                        {category}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">No favorite categories selected.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Listening Stats</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Episodes Listened</span>
                  <span className="font-semibold">{profile.stats.episodesListened}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Time</span>
                  <span className="font-semibold">{formatDuration(profile.stats.totalListeningTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Comments</span>
                  <span className="font-semibold">{profile.stats.commentsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Playlists</span>
                  <span className="font-semibold">{profile.stats.playlistsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Favorites</span>
                  <span className="font-semibold">{profile.stats.favoritesCount}</span>
                </div>
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Privacy & Notifications</h2>
              {editing ? (
                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.publicProfile}
                      onChange={(e) => setFormData({ ...formData, publicProfile: e.target.checked })}
                      className="mr-2"
                    />
                    Public Profile
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.emailNotifications}
                      onChange={(e) => setFormData({ ...formData, emailNotifications: e.target.checked })}
                      className="mr-2"
                    />
                    Email Notifications
                  </label>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Public Profile</span>
                    <span className={profile.preferences.publicProfile ? 'text-green-600' : 'text-red-600'}>
                      {profile.preferences.publicProfile ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email Notifications</span>
                    <span className={profile.preferences.emailNotifications ? 'text-green-600' : 'text-red-600'}>
                      {profile.preferences.emailNotifications ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
