'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const getDisplayName = () => {
    if (user?.profile?.firstName && user?.profile?.lastName) {
      return `${user.profile.firstName} ${user.profile.lastName}`;
    }
    return user?.username || 'User';
  };

  const getInitials = () => {
    if (user?.profile?.firstName && user?.profile?.lastName) {
      return `${user.profile.firstName[0]}${user.profile.lastName[0]}`.toUpperCase();
    }
    return user?.username?.substring(0, 2).toUpperCase() || 'U';
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none"
      >
        <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
          {user?.profile?.avatar ? (
            <img
              src={user.profile.avatar}
              alt={getDisplayName()}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <span className="text-white text-sm font-medium">{getInitials()}</span>
          )}
        </div>
        <span className="hidden md:block text-sm font-medium">{getDisplayName()}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                {user?.profile?.avatar ? (
                  <img
                    src={user.profile.avatar}
                    alt={getDisplayName()}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white font-medium">{getInitials()}</span>
                )}
              </div>
              <div>
                <div className="font-medium text-gray-900">{getDisplayName()}</div>
                <div className="text-sm text-gray-500">{user?.email || 'No email'}</div>
              </div>
            </div>
          </div>

          {/* User Stats */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-gray-900">{user?.stats?.playlistsCount || 0}</div>
                <div className="text-xs text-gray-500">Playlists</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">{user?.stats?.commentsCount || 0}</div>
                <div className="text-xs text-gray-500">Comments</div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {user?.role !== 'visitor' && (
              <Link
                href="/profile"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                <span className="mr-3">👤</span>
                My Profile
              </Link>
            )}
            <Link
              href="/favorites"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              <span className="mr-3">❤️</span>
              My Favorites
            </Link>
            <Link
              href="/playlists"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              <span className="mr-3">📋</span>
              My Playlists
            </Link>
            <Link
              href="/settings"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              <span className="mr-3">⚙️</span>
              Settings
            </Link>
            
            {user?.role === 'admin' && (
              <Link
                href="/admin"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                <span className="mr-3">🛠️</span>
                Admin Dashboard
              </Link>
            )}
          </div>

          {/* Logout */}
          <div className="border-t border-gray-100 pt-2">
            <button
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <span className="mr-3">🚪</span>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
