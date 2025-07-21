'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import UserMenu from './UserMenu';

export default function AuthButton() {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
    );
  }

  if (user) {
    return <UserMenu />;
  }

  return (
    <>
      <div className="flex items-center space-x-3">
        <button
          onClick={() => setShowLogin(true)}
          className="text-gray-600 hover:text-gray-900 font-medium"
        >
          Sign In
        </button>
        <button
          onClick={() => setShowRegister(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Sign Up
        </button>
      </div>

      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSwitchToRegister={() => {
          setShowLogin(false);
          setShowRegister(true);
        }}
      />

      <RegisterModal
        isOpen={showRegister}
        onClose={() => setShowRegister(false)}
        onSwitchToLogin={() => {
          setShowRegister(false);
          setShowLogin(true);
        }}
      />
    </>
  );
}