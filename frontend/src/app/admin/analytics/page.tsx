'use client';

import { useState, useEffect } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface AnalyticsData {
  overview: {
    totalSessions: number;
    uniqueListeners: number;
    averageSessionDuration: number;
    totalListeningTime: number;
  };
  peakTimes: Array<{
    hour: number;
    count: number;
  }>;
  popularEpisodes: Array<{
    id: string;
    title: string;
    category: string;
    totalListeners: number;
    averageCompletion: number;
    totalDuration: number;
  }>;
  geographicData: Array<{
    country: string;
    count: number;
  }>;
  deviceBreakdown: Record<string, number>;
  dailyTrends: Array<{
    date: string;
    listeners: number;
    uniqueListeners: number;
    totalDuration: number;
    averageCompletion: number;
  }>;
}

interface TrendingData {
  trendingEpisodes: Array<{
    id: string;
    title: string;
    category: string;
    recentListeners: number;
    averageCompletion: number;
    engagementScore: number;
  }>;
  trendingCategories: Array<{
    category: string;
    listeners: number;
    averageCompletion: number;
  }>;
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [trendingData, setTrendingData] = useState<TrendingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState(30); // days

  useEffect(() => {
    fetchAnalytics();
    fetchTrending();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/analytics/dashboard?days=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      } else {
        setError('Failed to fetch analytics data');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Network error while fetching analytics');
    }
  };

  const fetchTrending = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/analytics/trending?days=7');
      if (response.ok) {
        const data = await response.json();
        setTrendingData(data);
      }
    } catch (error) {
      console.error('Error fetching trending data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <span className="ml-3 text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  if (error || !analyticsData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <span className="text-red-500 text-xl mr-3">⚠️</span>
          <div>
            <h3 className="text-red-800 font-semibold">Analytics Error</h3>
            <p className="text-red-700 text-sm mt-1">{error || 'Failed to load analytics data'}</p>
            <button 
              onClick={() => {
                setError(null);
                setLoading(true);
                fetchAnalytics();
                fetchTrending();
              }} 
              className="mt-3 bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Chart configurations
  const dailyTrendsChart = {
    labels: analyticsData.dailyTrends.map(d => new Date(d.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Total Listeners',
        data: analyticsData.dailyTrends.map(d => d.listeners),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.1,
      },
      {
        label: 'Unique Listeners',
        data: analyticsData.dailyTrends.map(d => d.uniqueListeners),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
      }
    ],
  };

  const peakTimesChart = {
    labels: Array.from({length: 24}, (_, i) => `${i}:00`),
    datasets: [
      {
        label: 'Listening Sessions',
        data: Array.from({length: 24}, (_, hour) => {
          const peak = analyticsData.peakTimes.find(p => p.hour === hour);
          return peak ? peak.count : 0;
        }),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1,
      }
    ],
  };

  const deviceChart = {
    labels: Object.keys(analyticsData.deviceBreakdown),
    datasets: [
      {
        data: Object.values(analyticsData.deviceBreakdown),
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
        ],
        borderColor: [
          'rgb(239, 68, 68)',
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
        ],
        borderWidth: 2,
      }
    ],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button
            onClick={() => {
              fetchAnalytics();
              fetchTrending();
            }}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-full">
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Sessions</p>
              <p className="text-2xl font-semibold text-gray-900">{formatNumber(analyticsData.overview.totalSessions)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <span className="text-2xl">🎯</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Unique Listeners</p>
              <p className="text-2xl font-semibold text-gray-900">{formatNumber(analyticsData.overview.uniqueListeners)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <span className="text-2xl">⏱️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Session</p>
              <p className="text-2xl font-semibold text-gray-900">{formatDuration(analyticsData.overview.averageSessionDuration)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <span className="text-2xl">🎧</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Listening</p>
              <p className="text-2xl font-semibold text-gray-900">{formatDuration(analyticsData.overview.totalListeningTime)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trends */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Listening Trends</h3>
          <div className="h-64">
            <Line 
              data={dailyTrendsChart} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Peak Times */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Peak Listening Hours</h3>
          <div className="h-64">
            <Bar 
              data={peakTimesChart}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Device Breakdown and Geographic Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Types</h3>
          <div className="h-64 flex items-center justify-center">
            <Doughnut 
              data={deviceChart}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom' as const,
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Geographic Data */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Countries</h3>
          <div className="space-y-3">
            {analyticsData.geographicData.slice(0, 8).map((country, index) => (
              <div key={country.country} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-600 w-8">#{index + 1}</span>
                  <span className="text-sm text-gray-900">{country.country || 'Unknown'}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                    <div 
                      className="bg-red-600 h-2 rounded-full" 
                      style={{ 
                        width: `${(country.count / analyticsData.geographicData[0]?.count * 100) || 0}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{country.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Popular Episodes */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Popular Episodes</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Episode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Listeners</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Time</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analyticsData.popularEpisodes.map((episode) => (
                <tr key={episode.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{episode.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                      {episode.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(episode.totalListeners)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {episode.averageCompletion}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDuration(episode.totalDuration)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trending Content */}
      {trendingData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trending Episodes */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🔥 Trending Episodes</h3>
            <div className="space-y-4">
              {trendingData.trendingEpisodes.map((episode, index) => (
                <div key={episode.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-sm font-bold text-red-600 w-6">#{index + 1}</span>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{episode.title}</div>
                      <div className="text-xs text-gray-500">{episode.category}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{episode.recentListeners} listeners</div>
                    <div className="text-xs text-gray-500">{episode.averageCompletion}% completion</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trending Categories */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Trending Categories</h3>
            <div className="space-y-4">
              {trendingData.trendingCategories.map((category, index) => (
                <div key={category.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-sm font-bold text-blue-600 w-6">#{index + 1}</span>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{category.category}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{category.listeners} listeners</div>
                    <div className="text-xs text-gray-500">{category.averageCompletion}% avg completion</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}