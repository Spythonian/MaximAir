'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface FavoriteButtonProps {
  itemType: 'episode' | 'presenter';
  itemId: string;
  className?: string;
}

export default function FavoriteButton({ itemType, itemId, className = '' }: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, token } = useAuth();

  useEffect(() => {
    if (user && token) {
      checkFavoriteStatus();
    }
  }, [user, token, itemId]);

  const checkFavoriteStatus = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/community/favorites/check/${itemType}/${itemId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsFavorited(data.favorited);
      }
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!user || !token) {
      // Could trigger login modal here
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/community/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ itemType, itemId }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsFavorited(data.favorited);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null; // Don't show favorite button for non-logged-in users
  }

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={`flex items-center space-x-1 transition-colors ${
        isFavorited
          ? 'text-red-600 hover:text-red-700'
          : 'text-gray-400 hover:text-red-600'
      } ${loading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <span className="text-lg">
        {isFavorited ? '❤️' : '🤍'}
      </span>
      <span className="text-sm font-medium">
        {isFavorited ? 'Favorited' : 'Favorite'}
      </span>
    </button>
  );
}
