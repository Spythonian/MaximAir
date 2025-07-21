'use client';

import { useState, useEffect } from 'react';
import LiveStreamPlayer from '@/components/LiveStreamPlayer';

interface LiveStream {
  id: string;
  title: string;
  description?: string;
  playbackUrl: string;
  currentListeners: number;
  startedAt: string;
  quality: string;
  metadata: {
    currentTrack?: string;
    artist?: string;
    album?: string;
    genre?: string;
  };
}

export default function LivePage() {
  const [activeStreams, setActiveStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveStreams();
    
    // Poll for active streams every 30 seconds
    const interval = setInterval(fetchActiveStreams, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveStreams = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/livestream/active');
      if (response.ok) {
        const data = await response.json();
        setActiveStreams(data.streams);
      }
    } catch (error) {
      console.error('Error fetching active streams:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (startedAt: string) => {
    const start = new Date(startedAt);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
    
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-4 h-4 bg-red-300 rounded-full mr-3 animate-pulse"></div>
              <h1 className="text-4xl font-bold">LIVE RADIO</h1>
            </div>
            <p className="text-xl text-red-100">
              Tune in to Iconic FM's live broadcasts
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Live Stream Player */}
          <div className="mb-8">
            <LiveStreamPlayer autoplay={false} showControls={true} />
          </div>

          {/* Stream Information */}
          {!loading && activeStreams.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Current Shows */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></span>
                  Live Now
                </h2>
                <div className="space-y-4">
                  {activeStreams.map((stream) => (
                    <div key={stream.id} className="border-l-4 border-red-500 pl-4">
                      <h3 className="font-semibold text-gray-900">{stream.title}</h3>
                      {stream.description && (
                        <p className="text-gray-600 text-sm mt-1">{stream.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>👥 {stream.currentListeners} listening</span>
                        <span>⏱️ {formatDuration(stream.startedAt)}</span>
                        <span className="capitalize">📡 {stream.quality} quality</span>
                      </div>
                      {stream.metadata.currentTrack && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium text-gray-900">
                            🎵 {stream.metadata.currentTrack}
                          </div>
                          {stream.metadata.artist && (
                            <div className="text-sm text-gray-600">
                              by {stream.metadata.artist}
                            </div>
                          )}
                          {stream.metadata.album && (
                            <div className="text-xs text-gray-500">
                              from {stream.metadata.album}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* How to Listen */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">How to Listen</h2>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-600 font-semibold text-sm">1</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Web Player</h3>
                      <p className="text-gray-600 text-sm">
                        Click the play button above to listen directly in your browser
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-600 font-semibold text-sm">2</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Mobile Apps</h3>
                      <p className="text-gray-600 text-sm">
                        Use any HLS-compatible radio app with our stream URL
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-600 font-semibold text-sm">3</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Smart Speakers</h3>
                      <p className="text-gray-600 text-sm">
                        Ask your smart speaker to "play Iconic FM"
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Stream Quality Options</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <div>• Low: 64 kbps (mobile-friendly)</div>
                    <div>• Medium: 128 kbps (recommended)</div>
                    <div>• High: 256 kbps (high quality)</div>
                    <div>• Ultra: 320 kbps (premium quality)</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* No Live Streams */}
          {!loading && activeStreams.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">We're Currently Off Air</h2>
              <p className="text-gray-600 mb-6">
                No live broadcasts are currently active. Check back later or browse our podcast episodes!
              </p>
              <div className="flex justify-center space-x-4">
                <a
                  href="/episodes"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Browse Episodes
                </a>
                <a
                  href="/schedule"
                  className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  View Schedule
                </a>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-12 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          )}

          {/* Technical Information */}
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Technical Information</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Streaming Technology</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• HLS (HTTP Live Streaming)</li>
                  <li>• AAC Audio Codec</li>
                  <li>• Adaptive Bitrate Streaming</li>
                  <li>• Low Latency Delivery</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Compatibility</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• All modern web browsers</li>
                  <li>• iOS and Android devices</li>
                  <li>• Smart TVs and streaming devices</li>
                  <li>• Voice assistants and smart speakers</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}