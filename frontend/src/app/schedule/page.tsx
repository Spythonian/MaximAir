'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface Show {
  _id: string;
  title: string;
  description: string;
  presenters: Array<{
    userId: string;
    name: string;
    role: string;
  }>;
  startTime: string;
  endTime: string;
  dayOfWeek: number;
  category: string;
  isLive: boolean;
  status: string;
  streamUrl?: string;
  recordingUrl?: string;
  listeners: number;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const CATEGORIES = {
  Music: { icon: '🎵', color: 'bg-purple-100 text-purple-800' },
  Talk: { icon: '🎙️', color: 'bg-blue-100 text-blue-800' },
  News: { icon: '📰', color: 'bg-green-100 text-green-800' },
  Sports: { icon: '⚽', color: 'bg-orange-100 text-orange-800' },
  Entertainment: { icon: '🎭', color: 'bg-pink-100 text-pink-800' },
  Education: { icon: '📚', color: 'bg-indigo-100 text-indigo-800' },
  Other: { icon: '📻', color: 'bg-gray-100 text-gray-800' }
};

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<Show[]>([]);
  const [liveShows, setLiveShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay());
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    fetchSchedule();
    fetchLiveShows();
    
    // Refresh live shows every 30 seconds
    const interval = setInterval(fetchLiveShows, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSchedule = async () => {
    try {
      const response = await api.get('/schedule');
      setSchedule(response.data.schedule || []);
    } catch (error) {
      console.error('Failed to fetch schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveShows = async () => {
    try {
      const response = await api.get('/schedule/live');
      setLiveShows(response.data.liveShows || []);
    } catch (error) {
      console.error('Failed to fetch live shows:', error);
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const filteredSchedule = schedule.filter(show => {
    const dayMatch = selectedDay === -1 || show.dayOfWeek === selectedDay;
    const categoryMatch = selectedCategory === 'All' || show.category === selectedCategory;
    return dayMatch && categoryMatch;
  });

  const groupedSchedule = filteredSchedule.reduce((acc, show) => {
    const day = show.dayOfWeek;
    if (!acc[day]) acc[day] = [];
    acc[day].push(show);
    return acc;
  }, {} as Record<number, Show[]>);

  // Sort shows by start time within each day
  Object.keys(groupedSchedule).forEach(day => {
    groupedSchedule[parseInt(day)].sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-md p-6">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Radio Schedule</h1>
          <p className="text-gray-600">
            Discover our programming lineup and never miss your favorite shows
          </p>
        </div>

        {/* Live Shows Banner */}
        {liveShows.length > 0 && (
          <div className="bg-gradient-to-r from-red-600 to-red-800 text-white rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold mb-2 flex items-center">
                  <span className="w-3 h-3 bg-white rounded-full mr-2 animate-pulse"></span>
                  Live Now
                </h2>
                <div className="space-y-2">
                  {liveShows.map((show) => (
                    <div key={show._id} className="flex items-center space-x-4">
                      <span className="text-lg">
                        {CATEGORIES[show.category as keyof typeof CATEGORIES]?.icon}
                      </span>
                      <div>
                        <h3 className="font-semibold">{show.title}</h3>
                        <p className="text-red-100 text-sm">
                          {formatTime(show.startTime)} - {formatTime(show.endTime)}
                          {show.listeners > 0 && ` • ${show.listeners} listeners`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Link
                href="/livestream"
                className="bg-white text-red-600 px-6 py-3 rounded-lg font-semibold hover:bg-red-50 transition-colors"
              >
                Listen Live
              </Link>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex flex-wrap items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Filter by Day:</label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value={-1}>All Days</option>
                {DAYS.map((day, index) => (
                  <option key={day} value={index}>{day}</option>
                ))}
              </select>
            </div>
            
            <div className="flex flex-wrap items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Filter by Category:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="All">All Categories</option>
                {Object.keys(CATEGORIES).map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Schedule Grid */}
        {Object.keys(groupedSchedule).length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Shows Scheduled</h3>
            <p className="text-gray-600">
              {selectedDay !== -1 || selectedCategory !== 'All' 
                ? 'Try adjusting your filters to see more shows.'
                : 'Check back later for upcoming programming.'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedSchedule)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([day, shows]) => (
                <div key={day} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">{DAYS[parseInt(day)]}</h2>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {shows.map((show) => (
                        <div key={show._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl">
                                {CATEGORIES[show.category as keyof typeof CATEGORIES]?.icon}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                CATEGORIES[show.category as keyof typeof CATEGORIES]?.color
                              }`}>
                                {show.category}
                              </span>
                            </div>
                            {show.isLive && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium flex items-center">
                                <span className="w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse"></span>
                                LIVE
                              </span>
                            )}
                          </div>
                          
                          <h3 className="font-bold text-gray-900 mb-2">{show.title}</h3>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{show.description}</p>
                          
                          <div className="space-y-2 text-sm text-gray-500">
                            <div className="flex items-center">
                              <span className="w-4 h-4 mr-2">🕐</span>
                              {formatTime(show.startTime)} - {formatTime(show.endTime)}
                              <span className="ml-2 text-xs">({formatDuration(show.startTime, show.endTime)})</span>
                            </div>
                            
                            {show.presenters.length > 0 && (
                              <div className="flex items-center">
                                <span className="w-4 h-4 mr-2">👤</span>
                                {show.presenters.map(p => p.name).join(', ')}
                              </div>
                            )}
                            
                            {show.isLive && show.listeners > 0 && (
                              <div className="flex items-center">
                                <span className="w-4 h-4 mr-2">👥</span>
                                {show.listeners} listeners
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-4 pt-3 border-t border-gray-200">
                            {show.isLive ? (
                              <Link
                                href="/livestream"
                                className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-center block font-medium"
                              >
                                Listen Live
                              </Link>
                            ) : show.recordingUrl ? (
                              <button className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors font-medium">
                                Listen to Recording
                              </button>
                            ) : (
                              <div className="text-center text-sm text-gray-500">
                                {show.status === 'scheduled' ? 'Upcoming' : 'Not Available'}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Call to Action */}
        <div className="bg-white rounded-lg shadow-md p-8 text-center mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Never Miss a Show</h2>
          <p className="text-gray-600 mb-6">
            Stay updated with our latest programming and get notified when your favorite shows go live.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            <Link
              href="/livestream"
              className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              Listen Live Now
            </Link>
            <Link
              href="/episodes"
              className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Browse Episodes
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}