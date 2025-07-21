'use client';

import { useState, useEffect } from 'react';
import { episodesAPI } from '@/lib/api';
import api from '@/lib/api';
import Link from 'next/link';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalEpisodes: 0,
        publishedEpisodes: 0,
        draftEpisodes: 0,
        totalPlays: 0
    });
    const [liveStats, setLiveStats] = useState({
        activeStreams: 0,
        totalListeners: 0,
        scheduledShows: 0,
        liveShows: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [backendStatus, setBackendStatus] = useState<'online' | 'offline' | 'checking'>('checking');
    const [demoMode, setDemoMode] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const checkBackendStatus = async () => {
            try {
                await api.get('/health');
                if (isMounted) setBackendStatus('online');
                return true;
            } catch (error) {
                if (isMounted) setBackendStatus('offline');
                return false;
            }
        };

        const loadData = async () => {
            if (!isMounted) return;
            
            setLoading(true);
            setError(null);
            
            const isOnline = await checkBackendStatus();
            
            if (isOnline && isMounted) {
                try {
                    await Promise.all([fetchStats(), fetchLiveStats()]);
                } catch (err) {
                    if (isMounted) {
                        setError('Failed to load dashboard data. Please check if the backend server is running.');
                    }
                }
            }
            
            if (isMounted) setLoading(false);
        };

        loadData();
        
        // Refresh live stats every 30 seconds
        const interval = setInterval(async () => {
            if (!isMounted) return;
            
            try {
                const isOnline = await checkBackendStatus();
                if (isOnline) {
                    await fetchLiveStats();
                }
            } catch (error) {
                // Silently handle refresh errors
                console.warn('Dashboard refresh failed:', error);
            }
        }, 30000);
        
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    const fetchStats = async () => {
        try {
            const response = await episodesAPI.getStats();
            setStats(response);
        } catch (error) {
            // Silently handle error and set default values
            setStats({
                totalEpisodes: 0,
                publishedEpisodes: 0,
                draftEpisodes: 0,
                totalPlays: 0
            });
            // Only log in development
            if (process.env.NODE_ENV === 'development') {
                console.warn('Failed to fetch episode stats:', error);
            }
        }
    };

    const fetchLiveStats = async () => {
        try {
            let streams: any[] = [];
            let schedule: any[] = [];
            let liveShows: any[] = [];

            // Fetch active streams with error handling
            try {
                const streamsResponse = await api.get('/livestream/active');
                streams = streamsResponse.data?.streams || [];
            } catch (streamError) {
                // Silently handle error
                if (process.env.NODE_ENV === 'development') {
                    console.warn('Could not fetch active streams:', streamError);
                }
            }
            
            // Fetch schedule with error handling
            try {
                const scheduleResponse = await api.get('/schedule');
                schedule = scheduleResponse.data?.schedule || [];
            } catch (scheduleError) {
                // Silently handle error
                if (process.env.NODE_ENV === 'development') {
                    console.warn('Could not fetch schedule:', scheduleError);
                }
            }
            
            // Fetch live shows with error handling
            try {
                const liveResponse = await api.get('/schedule/live');
                liveShows = liveResponse.data?.liveShows || [];
            } catch (liveError) {
                // Silently handle error
                if (process.env.NODE_ENV === 'development') {
                    console.warn('Could not fetch live shows:', liveError);
                }
            }
            
            const totalListeners = streams.reduce((sum: number, stream: any) => sum + (stream.currentListeners || 0), 0) +
                                 liveShows.reduce((sum: number, show: any) => sum + (show.listeners || 0), 0);
            
            setLiveStats({
                activeStreams: streams.length,
                totalListeners,
                scheduledShows: schedule.filter((show: any) => show.status === 'scheduled').length,
                liveShows: liveShows.length
            });
        } catch (error) {
            // Set default values on error
            setLiveStats({
                activeStreams: 0,
                totalListeners: 0,
                scheduledShows: 0,
                liveShows: 0
            });
            // Only log in development
            if (process.env.NODE_ENV === 'development') {
                console.warn('Failed to fetch live stats:', error);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                <span className="ml-3 text-gray-600">Loading dashboard...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center">
                    <span className="text-red-500 text-xl mr-3">⚠️</span>
                    <div>
                        <h3 className="text-red-800 font-semibold">Dashboard Error</h3>
                        <p className="text-red-700 text-sm mt-1">{error}</p>
                        <button 
                            onClick={() => window.location.reload()} 
                            className="mt-3 bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header with Status and Refresh */}
            <div className="flex justify-between items-center mb-6">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    backendStatus === 'online' ? 'bg-green-100 text-green-800' :
                    backendStatus === 'offline' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                }`}>
                    <span className={`w-2 h-2 rounded-full mr-2 ${
                        backendStatus === 'online' ? 'bg-green-500' :
                        backendStatus === 'offline' ? 'bg-red-500' :
                        'bg-yellow-500'
                    }`}></span>
                    Backend Server: {backendStatus === 'online' ? 'Online' : backendStatus === 'offline' ? 'Offline' : 'Checking...'}
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium"
                >
                    🔄 Refresh Dashboard
                </button>
            </div>

            {backendStatus === 'offline' && !demoMode && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <h3 className="text-yellow-800 font-semibold mb-2">Backend Server Offline</h3>
                    <p className="text-yellow-700 text-sm mb-3">
                        The backend server is not responding. To start the server:
                    </p>
                    <ol className="text-yellow-700 text-sm list-decimal list-inside space-y-1 mb-4">
                        <li>Open a terminal and navigate to the backend directory</li>
                        <li>Run: <code className="bg-yellow-100 px-2 py-1 rounded">cd backend</code></li>
                        <li>Run: <code className="bg-yellow-100 px-2 py-1 rounded">npm run dev</code></li>
                        <li>Wait for "Server running on port 5000" message</li>
                        <li>Refresh this page</li>
                    </ol>
                    <div className="flex space-x-3">
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-yellow-600 text-white px-4 py-2 rounded text-sm hover:bg-yellow-700"
                        >
                            Check Again
                        </button>
                        <button
                            onClick={() => {
                                setDemoMode(true);
                                setStats({
                                    totalEpisodes: 42,
                                    publishedEpisodes: 38,
                                    draftEpisodes: 4,
                                    totalPlays: 15420
                                });
                                setLiveStats({
                                    activeStreams: 2,
                                    totalListeners: 127,
                                    scheduledShows: 8,
                                    liveShows: 1
                                });
                            }}
                            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                        >
                            View Demo Data
                        </button>
                    </div>
                </div>
            )}

            {demoMode && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h3 className="text-blue-800 font-semibold mb-2">Demo Mode Active</h3>
                    <p className="text-blue-700 text-sm">
                        Showing sample data. Start the backend server and refresh to see real data.
                    </p>
                </div>
            )}

            {/* Live Stats */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Live Broadcasting</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-red-100 rounded-full">
                                <span className="text-2xl">🔴</span>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Live Shows</p>
                                <p className="text-2xl font-semibold text-gray-900">{liveStats.liveShows}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-green-100 rounded-full">
                                <span className="text-2xl">📡</span>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Active Streams</p>
                                <p className="text-2xl font-semibold text-gray-900">{liveStats.activeStreams}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-blue-100 rounded-full">
                                <span className="text-2xl">👥</span>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Current Listeners</p>
                                <p className="text-2xl font-semibold text-gray-900">{liveStats.totalListeners}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-purple-100 rounded-full">
                                <span className="text-2xl">📅</span>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Scheduled Shows</p>
                                <p className="text-2xl font-semibold text-gray-900">{liveStats.scheduledShows}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Episode Stats */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Episode Library</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-blue-100 rounded-full">
                                <span className="text-2xl">📻</span>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Episodes</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.totalEpisodes}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-green-100 rounded-full">
                                <span className="text-2xl">✅</span>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Published</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.publishedEpisodes}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-yellow-100 rounded-full">
                                <span className="text-2xl">📝</span>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Drafts</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.draftEpisodes}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-purple-100 rounded-full">
                                <span className="text-2xl">▶️</span>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Plays</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.totalPlays.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Link href="/admin/episodes/new" className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold text-center">
                        Upload New Episode
                    </Link>
                    <Link href="/admin/schedule" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold text-center">
                        Manage Schedule
                    </Link>
                    <Link href="/admin/livestream" className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold text-center">
                        Live Streaming
                    </Link>
                    <Link href="/admin/analytics" className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold text-center">
                        View Analytics
                    </Link>
                </div>
            </div>
        </div>
    );
}
