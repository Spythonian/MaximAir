'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

interface Playlist {
  _id: string;
  name: string;
}

interface AddToPlaylistButtonProps {
  episodeId: string;
  className?: string;
}

export default function AddToPlaylistButton({ episodeId, className }: AddToPlaylistButtonProps) {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);

  useEffect(() => {
    if (showPlaylistModal) {
      fetchPlaylists();
    }
  }, [showPlaylistModal]);

  const fetchPlaylists = async () => {
    try {
      const response = await api.get('/community/playlists');
      setPlaylists(response.data.playlists || []);
    } catch (error) {
      console.error('Failed to fetch playlists:', error);
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    try {
      await api.post(`/community/playlists/${playlistId}/episodes`, { episodeId });
      alert('Added to playlist!');
      setShowPlaylistModal(false);
    } catch (error) {
      console.error('Failed to add to playlist:', error);
      alert('Failed to add to playlist.');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowPlaylistModal(true)}
        className={`flex items-center space-x-1 text-gray-600 hover:text-red-600 transition-colors ${className}`}
        title="Add to playlist"
      >
        <span>📋</span>
        <span className="text-sm">Add to Playlist</span>
      </button>

      {showPlaylistModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4">Add to Playlist</h2>
            
            {playlists.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📋</div>
                <p className="text-gray-600 mb-4">No playlists found</p>
                <p className="text-sm text-gray-500">Create a playlist first to add episodes to it.</p>
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto">
                <div className="space-y-2">
                  {playlists.map((playlist) => (
                    <button
                      key={playlist._id}
                      onClick={() => handleAddToPlaylist(playlist._id)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-100 rounded-md border border-gray-200 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <span>📋</span>
                        <span className="font-medium">{playlist.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowPlaylistModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
