'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface Show {
  _id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  dayOfWeek: number;
  category: string;
  isLive: boolean;
  status: string;
}

interface ScheduleWidgetProps {
  limit?: number;
  showLive?: boolean;
  className?: string;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const CATEGORIES = {
  Music: '🎵',
  Talk: '🎙️',
  News: '📰',
  Sports: '⚽',
  Entertainment: '🎭',
  Education: '📚',
  Other: '📻'
};

export default function ScheduleWidget({ limit = 3, showLive = true, className = '' }: ScheduleWidgetProps) {
  const [liveShows, setLiveShows] = useState<Show[]>([]);
  const [upcomingShows, setUpcomingShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShows();
    
    // Refresh live shows every minute
    const interval = setInterval(fetchShows, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchShows = async () => {
    try {
      // Fetch live shows
      if (showLive) {
        const liveResponse = await api.get('/schedule/live');
        setLiveShows(liveResponse.data.liveShows || []);
      }
      
      // Fetch upcoming shows
      const upcomingResponse = await api.get('/schedule?upcoming=true');
      setUpcomingShows(upcomingResponse.data.schedule || []);
    } catch (error) {
      console.error('Failed to fetch schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDay = (timeString: string) => {
    const date = new Date(timeString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return DAYS[date.getDay()];
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      <div className="bg-gradient-to-r from-red-600 to-red-800 text-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold">Radio Schedule</h3>
          <Link href="/schedule" className="text-xs text-red-100 hover:text-white">
            View Full Schedule
          </Link>
        </div>
      </div>

      <div className="p-4">
        {/* Live Shows */}
        {showLive && liveShows.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
              Live Now
            </h4>
            <div className="space-y-3">
              {liveShows.slice(0, 1).map((show) => (
                <div key={show._id} className="flex items-start space-x-3 bg-red-50 p-3 rounded-lg">
                  <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-lg">
                      {CATEGORIES[show.category as keyof typeof CATEGORIES]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">{show.title}</h5>
                    <p className="text-xs text-gray-600 mb-1">
                      {formatTime(show.startTime)} - {formatTime(show.endTime)}
                    </p>
                    <Link
                      href="/livestream"
                      className="text-xs text-red-600 hover:text-red-800 font-medium"
                    >
                      Listen Live →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Shows */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Coming Up Next
          </h4>
          {upcomingShows.length === 0 ? (
            <p className="text-sm text-gray-500 italic">
              No upcoming shows scheduled.
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingShows.slice(0, limit).map((show) => (
                <div key={show._id} className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-700 text-lg">
                      {CATEGORIES[show.category as keyof typeof CATEGORIES]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">{show.title}</h5>
                    <p className="text-xs text-gray-600 mb-1">
                      {formatDay(show.startTime)} at {formatTime(show.startTime)}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {show.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* View More Link */}
        {upcomingShows.length > limit && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <Link
              href="/schedule"
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              View {upcomingShows.length - limit} more shows →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}