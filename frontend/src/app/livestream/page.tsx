'use client';

import { useState, useEffect } from 'react';
import LiveStreamPlayer from '@/components/LiveStreamPlayer';
import LiveChat from '@/components/LiveChat';
import ScheduleWidget from '@/components/ScheduleWidget';
import api from '@/lib/api';

interface LiveStream {
  _id: string;
  title: string;
  description: string;
  playbackUrl: string;
  isActive: boolean;
  currentListeners: number;
  peakListeners: number;
  quality: string;
  bitrate: number;
  metadata: {
    currentTrack?: string;
    artist?: string;
    album?: string;
    genre?: string;
  };
  scheduleId?: {
    _id: string;
    title: string;
  };
}

interface Show {
  _id: string;
  title: string;
  description: string;
  isLive: boolean;
  streamUrl?: string;
  listeners: number;
  category: string;
  presenters: Array<{
    name: string;
    role: string;
  }>;
}

export default function LiveStreamPage() {
  const [activeStreams, setActiveStreams] = useState<LiveStream[]>([]);
  const [liveShows, setLiveShows] = useState<Show[]>([]);
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    fetchLiveContent();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchLiveContent, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchLiveContent = async () => {
    try {
      // Fetch active streams
      const streamsResponse = await api.get('/livestream/active');
      const streams = streamsResponse.data.streams || [];
      setActiveStreams(streams);

      // Fetch live shows
      const showsResponse = await api.get('/schedule/live');
      const shows = showsResponse.data.liveShows || [];
      setLiveShows(shows);

      // Auto-select the first available stream or show
      if (!selectedStream && !selectedShow) {
        if (streams.length > 0) {
          setSelectedStream(streams[0]);
        } else if (shows.length > 0) {
          setSelectedShow(shows[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch live content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStreamSelect = (stream: LiveStream) => {
    setSelectedStream(stream);
    setSelectedShow(null);
    setIsPlaying(false);
  };

  const handleShowSelect = (show: Show) => {
    setSelectedShow(show);
    setSelectedStream(null);
    setIsPlaying(false);
  };

  const getCurrentStreamUrl = () => {
    if (selectedStream) {
      return selectedStream.playbackUrl;
    }
    if (selectedShow && selectedShow.streamUrl) {
      return selectedShow.streamUrl;
    }
    return '';
  };

  const getCurrentTitle = () => {
    if (selectedStream) {
      return selectedStream.title;
    }
    if (selectedShow) {
      return selectedShow.title;
    }
    return 'Iconic FM Live';
  };

  const getCurrentDescription = () => {
    if (selectedStream) {
      return selectedStream.description;
    }
    if (selectedShow) {
      return selectedShow.description;
    }
    return 'Live radio streaming';
  };

  const getCurrentMetadata = () => {
    if (selectedStream?.metadata) {
      return {
        currentTrack: selectedStream.metadata.currentTrack,
        artist: selectedStream.metadata.artist
      };
    }
    return {};
  };

  const getChatId = () => {
    if (selectedStream) {
      return { streamId: selectedStream._id };
    }
    if (selectedShow) {
      return { scheduleId: selectedShow._id };
    }
    return {};
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading live streams...</p>
        </div>
      </div>
    );
  }

  const hasLiveContent = activeStreams.length > 0 || liveShows.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Radio</h1>
          <p className="text-gray-600">
            Listen to live broadcasts and join the conversation
          </p>
        </div>

        {!hasLiveContent ? (
          /* No Live Content */
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">📻</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Live Streams</h2>
            <p className="text-gray-600 mb-6">
              There are currently no live broadcasts. Check back later or explore our episode library.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => window.location.reload()}
                className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Refresh
              </button>
              <a
                href="/episodes"
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Browse Episodes
              </a>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stream Selection */}
              {(activeStreams.length > 1 || liveShows.length > 1 || (activeStreams.length > 0 && liveShows.length > 0)) && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-lg font-semibold mb-4">Available Live Streams</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeStreams.map((stream) => (
                      <button
                        key={stream._id}
                        onClick={() => handleStreamSelect(stream)}
                        className={`p-4 rounded-lg border-2 text-left transition-colors ${
                          selectedStream?._id === stream._id
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{stream.title}</h3>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            LIVE
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{stream.description}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{stream.currentListeners} listeners</span>
                          <span>{stream.quality} quality</span>
                        </div>
                      </button>
                    ))}
                    
                    {liveShows.map((show) => (
                      <button
                        key={show._id}
                        onClick={() => handleShowSelect(show)}
                        className={`p-4 rounded-lg border-2 text-left transition-colors ${
                          selectedShow?._id === show._id
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{show.title}</h3>
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                            LIVE
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{show.description}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{show.listeners} listeners</span>
                          <span>{show.category}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Audio Player */}
              {getCurrentStreamUrl() && (
                <LiveStreamPlayer
                  streamUrl={getCurrentStreamUrl()}
                  title={getCurrentTitle()}
                  description={getCurrentDescription()}
                  currentTrack={getCurrentMetadata().currentTrack}
                  artist={getCurrentMetadata().artist}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
              )}

              {/* Stream Info */}
              {(selectedStream || selectedShow) && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-lg font-semibold mb-4">About This Stream</h2>
                  
                  {selectedStream && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium text-gray-900">{selectedStream.title}</h3>
                        <p className="text-gray-600">{selectedStream.description}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-50 p-3 rounded">
                          <div className="text-xs text-gray-500 mb-1">Listeners</div>
                          <div className="font-semibold">{selectedStream.currentListeners}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <div className="text-xs text-gray-500 mb-1">Peak</div>
                          <div className="font-semibold">{selectedStream.peakListeners}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <div className="text-xs text-gray-500 mb-1">Quality</div>
                          <div className="font-semibold">{selectedStream.quality}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <div className="text-xs text-gray-500 mb-1">Bitrate</div>
                          <div className="font-semibold">{selectedStream.bitrate / 1000}k</div>
                        </div>
                      </div>

                      {selectedStream.metadata?.currentTrack && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="text-sm text-blue-600 mb-1">Now Playing</div>
                          <div className="font-semibold text-blue-900">
                            {selectedStream.metadata.currentTrack}
                            {selectedStream.metadata.artist && (
                              <span className="text-blue-700"> by {selectedStream.metadata.artist}</span>
                            )}
                          </div>
                          {selectedStream.metadata.album && (
                            <div className="text-sm text-blue-600 mt-1">
                              Album: {selectedStream.metadata.album}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {selectedShow && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium text-gray-900">{selectedShow.title}</h3>
                        <p className="text-gray-600">{selectedShow.description}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-3 rounded">
                          <div className="text-xs text-gray-500 mb-1">Listeners</div>
                          <div className="font-semibold">{selectedShow.listeners}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <div className="text-xs text-gray-500 mb-1">Category</div>
                          <div className="font-semibold">{selectedShow.category}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <div className="text-xs text-gray-500 mb-1">Status</div>
                          <div className="font-semibold text-red-600">LIVE</div>
                        </div>
                      </div>

                      {selectedShow.presenters.length > 0 && (
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <div className="text-sm text-purple-600 mb-2">Presenters</div>
                          <div className="space-y-1">
                            {selectedShow.presenters.map((presenter, index) => (
                              <div key={index} className="text-purple-900">
                                <span className="font-semibold">{presenter.name}</span>
                                <span className="text-purple-700 ml-2">({presenter.role})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Live Chat */}
              {(selectedStream || selectedShow) && (
                <LiveChat
                  {...getChatId()}
                  title={getCurrentTitle()}
                  className="h-96"
                />
              )}

              {/* Schedule Widget */}
              <ScheduleWidget limit={5} showLive={false} />

              {/* Listening Stats */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-bold mb-4">Listening Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Listeners</span>
                    <span className="font-semibold">
                      {activeStreams.reduce((sum, stream) => sum + stream.currentListeners, 0) +
                       liveShows.reduce((sum, show) => sum + show.listeners, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Streams</span>
                    <span className="font-semibold">{activeStreams.length + liveShows.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Your Status</span>
                    <span className={`font-semibold ${isPlaying ? 'text-green-600' : 'text-gray-500'}`}>
                      {isPlaying ? 'Listening' : 'Not Playing'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}