'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

interface Episode {
  _id: string;
  title: string;
  duration: string;
  category: string;
  createdAt: string;
}

interface Playlist {
  _id: string;
  name: string;
  description: string;
  isPublic: boolean;
  episodes: Array<{
    episodeId: Episode;
    addedAt: string;
    order: number;
  }>;
  followers: string[];
  tags: string[];
  createdAt: string;
}

export default function PlaylistsPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylist, setNewPlaylist] = useState({
    name: '',
    description: '',
    isPublic: true
  });

  useEffect(() => {
    if (!user || !token) {
      router.push('/auth/login');
      return;
    }
    fetchPlaylists();
  }, [user, token, router]);

  const fetchPlaylists = async () => {
    try {
      const response = await api.get('/community/playlists');
      setPlaylists(Array.isArray(response.data.playlists) ? response.data.playlists : []);
    } catch (error) {
      console.error('Failed to fetch playlists:', error);
      setPlaylists([]);
    } finally {
      setLoading(false);
    }
  };

  const createPlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/community/playlists', newPlaylist);
      if (response.data.playlist) {
        setPlaylists([response.data.playlist, ...playlists]);
        setNewPlaylist({ name: '', description: '', isPublic: true });
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error('Failed to create playlist:', error);
      alert('Failed to create playlist. Please try again.');
    }
  };

  const deletePlaylist = async (playlistId: string) => {
    if (!confirm('Are you sure you want to delete this playlist?')) return;

    try {
      await api.delete(`/community/playlists/${playlistId}`);
      setPlaylists(playlists.filter(p => p._id !== playlistId));
    } catch (error) {
      console.error('Failed to delete playlist:', error);
      alert('Failed to delete playlist. Please try again.');
    }
  };

  const removeEpisodeFromPlaylist = async (playlistId: string, episodeId: string) => {
    if (!confirm('Remove this episode from the playlist?')) return;

    try {
      await api.delete(`/community/playlists/${playlistId}/episodes/${episodeId}`);
      // Update the local state
      setPlaylists(playlists.map(playlist => 
        playlist._id === playlistId 
          ? {
              ...playlist,
              episodes: playlist.episodes.filter(ep => ep.episodeId._id !== episodeId)
            }
          : playlist
      ));
    } catch (error) {
      console.error('Failed to remove episode:', error);
      alert('Failed to remove episode. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-4">
                <Link href="/profile" className="text-red-200 hover:text-white">
                  ← Back to Profile
                </Link>
              </div>
              <h1 className="text-4xl font-bold mt-4">My Playlists</h1>
              <p className="text-red-100 text-lg">
                Organize your favorite episodes into custom playlists
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-white text-red-600 px-6 py-3 rounded-lg font-semibold hover:bg-red-50 transition-colors"
            >
              Create Playlist
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Create Playlist Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Create New Playlist</h2>
            <form onSubmit={createPlaylist} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Playlist Name
                </label>
                <input
                  type="text"
                  value={newPlaylist.name}
                  onChange={(e) => setNewPlaylist({ ...newPlaylist, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newPlaylist.description}
                  onChange={(e) => setNewPlaylist({ ...newPlaylist, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={newPlaylist.isPublic}
                  onChange={(e) => setNewPlaylist({ ...newPlaylist, isPublic: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="isPublic" className="text-sm text-gray-700">
                  Make this playlist public
                </label>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Create Playlist
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Playlists Grid */}
        {playlists.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No playlists yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first playlist to organize your favorite episodes!
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
            >
              Create Your First Playlist
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {playlists.map((playlist) => (
              <div key={playlist._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Playlist Header */}
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">{playlist.name}</h3>
                      {playlist.description && (
                        <p className="text-purple-100 mb-2">{playlist.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-purple-200">
                        <span>{playlist.episodes.length} episodes</span>
                        <span>{playlist.isPublic ? '🌍 Public' : '🔒 Private'}</span>
                        <span>Created {new Date(playlist.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => deletePlaylist(playlist._id)}
                      className="text-purple-200 hover:text-white p-2"
                      title="Delete playlist"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Episodes List */}
                <div className="p-6">
                  {playlist.episodes.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">🎧</div>
                      <p className="text-gray-600 mb-4">No episodes in this playlist yet</p>
                      <p className="text-sm text-gray-500">
                        Browse episodes and use "Add to Playlist" to add them here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 mb-4">Episodes ({playlist.episodes.length})</h4>
                      {playlist.episodes
                        .sort((a, b) => a.order - b.order)
                        .map((episodeItem, index) => (
                          <div key={episodeItem.episodeId._id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="text-gray-400 font-mono text-sm w-8">
                              {String(index + 1).padStart(2, '0')}
                            </div>
                            <div className="flex-1">
                              <Link 
                                href={`/episodes/${episodeItem.episodeId._id}`}
                                className="font-medium text-gray-900 hover:text-red-600 transition-colors"
                              >
                                {episodeItem.episodeId.title}
                              </Link>
                              <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                                <span>⏱️ {episodeItem.episodeId.duration}</span>
                                <span>🏷️ {episodeItem.episodeId.category}</span>
                                <span>📅 Added {new Date(episodeItem.addedAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => removeEpisodeFromPlaylist(playlist._id, episodeItem.episodeId._id)}
                              className="text-red-500 hover:text-red-700 p-2"
                              title="Remove from playlist"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}