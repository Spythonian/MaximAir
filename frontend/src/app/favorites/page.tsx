'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Favorite {
  _id: string;
  itemId: {
    _id: string;
    title: string;
    description?: string;
    category?: string;
    duration?: string;
    createdAt: string;
  };
  itemType: 'episode' | 'presenter';
  createdAt: string;
}

export default function FavoritesPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'episode' | 'presenter'>('all');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !token) {
      router.push('/auth/login');
      return;
    }
    fetchFavorites();
  }, [user, token, router]);

  const fetchFavorites = async () => {
    try {
      setError('');
      const response = await fetch(`http://localhost:5001/api/community/favorites`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Ensure favorites is always an array
        setFavorites(Array.isArray(data.favorites) ? data.favorites : []);
      } else {
        setError('Failed to load favorites');
        setFavorites([]);
      }
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
      setError('Failed to load favorites');
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (favoriteId: string) => {
    try {
      const response = await fetch(`http://localhost:5001/api/community/favorites/${favoriteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setFavorites(favorites.filter(fav => fav._id !== favoriteId));
      }
    } catch (error) {
      console.error('Failed to remove favorite:', error);
    }
  };

  // Safely filter favorites with null checks
  const filteredFavorites = Array.isArray(favorites) ? favorites.filter(fav => 
    fav && (filter === 'all' || fav.itemType === filter)
  ) : [];

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
          <div className="flex items-center space-x-4">
            <Link href="/profile" className="text-red-200 hover:text-white">
              ← Back to Profile
            </Link>
          </div>
          <h1 className="text-4xl font-bold mt-4">My Favorites</h1>
          <p className="text-red-100 text-lg">
            Your saved episodes and favorite presenters
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md font-medium ${
                filter === 'all'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All ({favorites.length || 0})
            </button>
            <button
              onClick={() => setFilter('episode')}
              className={`px-4 py-2 rounded-md font-medium ${
                filter === 'episode'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Episodes ({favorites.filter(f => f && f.itemType === 'episode').length || 0})
            </button>
            <button
              onClick={() => setFilter('presenter')}
              className={`px-4 py-2 rounded-md font-medium ${
                filter === 'presenter'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Presenters ({favorites.filter(f => f && f.itemType === 'presenter').length || 0})
            </button>
          </div>
        </div>

        {/* Favorites List */}
        {filteredFavorites.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">❤️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No favorites yet</h3>
            <p className="text-gray-600 mb-6">
              Start exploring episodes and add them to your favorites!
            </p>
            <Link
              href="/episodes"
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
            >
              Browse Episodes
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFavorites.map((favorite) => {
              // Safety check for favorite and itemId
              if (!favorite || !favorite.itemId) {
                return null;
              }

              return (
                <div key={favorite._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-32 bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="text-3xl mb-2">
                        {favorite.itemType === 'episode' ? '🎧' : '🎙️'}
                      </div>
                      <div className="text-sm opacity-75 capitalize">
                        {favorite.itemType}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {favorite.itemId.title || 'Untitled'}
                      </h3>
                      <button
                        onClick={() => removeFavorite(favorite._id)}
                        className="text-red-500 hover:text-red-700 ml-2"
                        title="Remove from favorites"
                      >
                        ❤️
                      </button>
                    </div>
                    
                    {favorite.itemId.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {favorite.itemId.description}
                      </p>
                    )}
                    
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>
                        Added {new Date(favorite.createdAt).toLocaleDateString()}
                      </span>
                      {favorite.itemId.duration && (
                        <span>{favorite.itemId.duration}</span>
                      )}
                    </div>
                    
                    {favorite.itemType === 'episode' && (
                      <div className="mt-3">
                        <Link
                          href={`/episodes/${favorite.itemId._id}`}
                          className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 transition-colors"
                        >
                          Listen Now
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}