'use client';

import { useState, useEffect, useRef } from 'react';

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

interface LiveStreamPlayerProps {
  streamKey?: string;
  autoplay?: boolean;
  showControls?: boolean;
}

export default function LiveStreamPlayer({ 
  streamKey, 
  autoplay = false, 
  showControls = true 
}: LiveStreamPlayerProps) {
  const [activeStreams, setActiveStreams] = useState<LiveStream[]>([]);
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    fetchActiveStreams();
    
    // Poll for active streams every 30 seconds
    const interval = setInterval(fetchActiveStreams, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (streamKey && activeStreams.length > 0) {
      const stream = activeStreams.find(s => s.playbackUrl.includes(streamKey));
      if (stream) {
        setSelectedStream(stream);
        if (autoplay) {
          playStream(stream);
        }
      }
    } else if (activeStreams.length > 0 && !selectedStream) {
      // Auto-select first active stream
      setSelectedStream(activeStreams[0]);
      if (autoplay) {
        playStream(activeStreams[0]);
      }
    }
  }, [streamKey, activeStreams, autoplay]);

  const fetchActiveStreams = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/livestream/active');
      if (response.ok) {
        const data = await response.json();
        setActiveStreams(data.streams);
        setError(null);
      } else {
        setError('Failed to fetch active streams');
      }
    } catch (error) {
      console.error('Error fetching active streams:', error);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const playStream = async (stream: LiveStream) => {
    if (!audioRef.current) return;

    try {
      setError(null);
      audioRef.current.src = stream.playbackUrl;
      audioRef.current.volume = volume;
      
      await audioRef.current.play();
      setIsPlaying(true);
      setSelectedStream(stream);
    } catch (error) {
      console.error('Error playing stream:', error);
      setError('Failed to play stream. Please try again.');
      setIsPlaying(false);
    }
  };

  const stopStream = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      setIsPlaying(false);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (activeStreams.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <div className="text-gray-500 mb-4">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Live Streams</h3>
        <p className="text-gray-500">There are currently no active live streams. Check back later!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        onError={() => {
          setError('Stream playback error');
          setIsPlaying(false);
        }}
        onLoadStart={() => setError(null)}
      />

      {/* Stream Selection */}
      {activeStreams.length > 1 && (
        <div className="border-b border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Stream:
          </label>
          <select
            value={selectedStream?.id || ''}
            onChange={(e) => {
              const stream = activeStreams.find(s => s.id === e.target.value);
              if (stream) {
                setSelectedStream(stream);
                if (isPlaying) {
                  playStream(stream);
                }
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {activeStreams.map((stream) => (
              <option key={stream.id} value={stream.id}>
                {stream.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedStream && (
        <>
          {/* Stream Info */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{selectedStream.title}</h3>
                {selectedStream.description && (
                  <p className="text-gray-600 mt-1">{selectedStream.description}</p>
                )}
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
                  LIVE
                </span>
                <span>👥 {selectedStream.currentListeners}</span>
                <span>⏱️ {formatDuration(selectedStream.startedAt)}</span>
              </div>
            </div>

            {/* Now Playing */}
            {selectedStream.metadata.currentTrack && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12c0-2.21-.895-4.21-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 12a5.983 5.983 0 01-.757 2.829 1 1 0 11-1.415-1.414A3.987 3.987 0 0014 12a3.987 3.987 0 00-.172-1.415 1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">Now Playing</div>
                    <div className="text-lg font-semibold text-gray-900">{selectedStream.metadata.currentTrack}</div>
                    {selectedStream.metadata.artist && (
                      <div className="text-sm text-gray-600">by {selectedStream.metadata.artist}</div>
                    )}
                    {selectedStream.metadata.album && (
                      <div className="text-xs text-gray-500">from {selectedStream.metadata.album}</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Controls */}
            {showControls && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => isPlaying ? stopStream() : playStream(selectedStream)}
                    className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors ${
                      isPlaying 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isPlaying ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                  
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12c0-2.21-.895-4.21-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 12a5.983 5.983 0 01-.757 2.829 1 1 0 11-1.415-1.414A3.987 3.987 0 0014 12a3.987 3.987 0 00-.172-1.415 1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-sm text-gray-500 w-8">{Math.round(volume * 100)}%</span>
                  </div>
                </div>

                <div className="text-sm text-gray-500">
                  Quality: {selectedStream.quality}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}