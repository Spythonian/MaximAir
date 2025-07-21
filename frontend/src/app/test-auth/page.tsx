'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function TestAuthPage() {
  const { user, token, login, register, logout, loading } = useAuth();
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [username, setUsername] = useState('testuser');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async () => {
    try {
      setError('');
      setSuccess('');
      await login(email, password);
      setSuccess('Login successful!');
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleRegister = async () => {
    try {
      setError('');
      setSuccess('');
      await register(username, email, password);
      setSuccess('Registration successful!');
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleLogout = () => {
    logout();
    setSuccess('Logged out successfully!');
    setError('');
  };

  const testBackend = async () => {
    try {
      setError('');
      setSuccess('');
      const response = await fetch('http://localhost:5001/api/debug');
      const data = await response.json();
      setSuccess(`Backend test successful: ${data.message}`);
    } catch (error: any) {
      setError(`Backend test failed: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p>Loading authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Authentication Test Page</h1>
        
        {/* Current User Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Status</h2>
          {user ? (
            <div className="space-y-2">
              <p><strong>Logged in as:</strong> {user.username}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Role:</strong> {user.role}</p>
              <p><strong>Token:</strong> {token ? 'Present' : 'Missing'}</p>
              <div className="mt-4">
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">Not logged in</p>
          )}
        </div>

        {/* Backend Test */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Backend Connection Test</h2>
          <button
            onClick={testBackend}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Test Backend Connection
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            <strong>Success:</strong> {success}
          </div>
        )}

        {!user && (
          <>
            {/* Login Form */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Login Test</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <button
                  onClick={handleLogin}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
                >
                  Test Login
                </button>
              </div>
            </div>

            {/* Register Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Registration Test</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <button
                  onClick={handleRegister}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
                >
                  Test Registration
                </button>
              </div>
            </div>
          </>
        )}

        {/* Debug Info */}
        <div className="bg-gray-100 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Backend URL:</strong> http://localhost:5001</p>
            <p><strong>Frontend URL:</strong> {typeof window !== 'undefined' ? window.location.origin : 'N/A'}</p>
            <p><strong>User Agent:</strong> {typeof window !== 'undefined' ? navigator.userAgent : 'N/A'}</p>
            <p><strong>Local Storage Available:</strong> {typeof window !== 'undefined' && window.localStorage ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}