'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: '📊' },
  { name: 'Episodes', href: '/admin/episodes', icon: '📻' },
  { name: 'Categories', href: '/admin/categories', icon: '🏷️' },
  { name: 'Schedule', href: '/admin/schedule', icon: '📅' },
  { name: 'Live Stream', href: '/admin/livestream', icon: '🔴' },
  { name: 'Users', href: '/admin/users', icon: '👥' },
  { name: 'Analytics', href: '/admin/analytics', icon: '📈' },
];

function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && (!user || !['admin', 'editor'].includes(user.role))) {
      router.push('/admin/login');
    }
  }, [user, loading, router]);

  if (loading || !user || !['admin', 'editor'].includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-64 bg-white shadow-md flex-shrink-0 flex flex-col">
        <div className="p-6">
          <Link href="/admin" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">FM</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">Iconic FM</span>
          </Link>
        </div>
        <nav className="mt-6 flex-1">
          <ul>
            {navItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center px-6 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors ${
                    pathname === item.href ? 'bg-red-100 text-red-700 font-semibold' : ''
                  }`}
                >
                  <span className="mr-3 text-xl">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-6">
          <Link href="/" className="text-gray-600 hover:text-gray-900 block mb-4">
            ← View Site
          </Link>
          <div className="text-sm text-gray-500">
            Logged in as <span className="font-semibold">{user.username}</span>
          </div>
        </div>
      </aside>

      <main className="flex-1">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-2xl font-semibold text-gray-900">
                {navItems.find(item => pathname.startsWith(item.href))?.name || 'Admin'}
              </h1>
              <button 
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
              >
                Logout
              </button>
            </div>
          </div>
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return <ProtectedAdminLayout>{children}</ProtectedAdminLayout>;
}
