'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface LiveStream {
  id: string;
  title: string;
  description?: string;
  streamKey: string;
  streamUrl: string;
  playbackUrl: string;
  isActive: boolean;
  status: 'preparing' | 'live' | 'ended' | 'error';
  currentListeners: number;
  peakListeners: number;
  duration: number;
  startedAt?: string;
  endedAt?: string;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  recordingEnabled: boolean;
  metadata: {
    currentTrack?: string;
    artist?: string;
    album?: string;
    genre?: string;
  };
  createdAt: string;
}

export default function LiveStreamAdmin() {
  const { user } = useAuth();
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [activeStreams, setActiveStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    quality: 'medium' as const,
    recordingEnabled: true
  });

  // Metadata form state
  const [metadataForm, setMetadataForm] = useState({
    currentTrack: '',
    artist: '',
    album: '',
    genre: ''
  });

  useEffect(() => {
    fetchStreams();
    fetchActiveStreams();
    
    // Poll for active streams every 30 seconds
    const interval = setInterval(() => {
      fetchActiveStreams();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchStreams = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/livestream/my-streams', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStreams(data.streams);
      }
    } catch (error) {
      console.error('Error fetching streams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveStreams = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/livestream/active');
      if (response.ok) {
        const data = await response.json();
        setActiveStreams(data.streams);
      }
    } catch (error) {
      console.error('Error fetching active streams:', error);
    }
  };

  const createStream = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:5001/api/livestream/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setStreams([data.stream, ...streams]);
        setShowCreateForm(false);
        setFormData({
          title: '',
          description: '',
          quality: 'medium',
          recordingEnabled: true
        });
        alert('Stream created successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating stream:', error);
      alert('Failed to create stream');
    }
  };

  const updateMetadata = async (streamKey: string) => {
    try {
      const response = await fetch(`http://localhost:5001/api/livestream/${streamKey}/metadata`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(metadataForm)
      });

      if (response.ok) {
        alert('Metadata updated successfully!');
        fetchStreams();
        setSelectedStream(null);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating metadata:', error);
      alert('Failed to update metadata');
    }
  };

  const deleteStream = async (streamKey: string) => {
    if (!confirm('Are you sure you want to delete this stream?')) return;

    try {
      const response = await fetch(`http://localhost:5001/api/livestream/${streamKey}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setStreams(streams.filter(s => s.streamKey !== streamKey));
        alert('Stream deleted successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting stream:', error);
      alert('Failed to delete stream');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'text-green-600 bg-green-100';
      case 'preparing': return 'text-yellow-600 bg-yellow-100';
      case 'ended': return 'text-gray-600 bg-gray-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Live Stream Management</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create New Stream
        </button>
      </div>

      {/* Active Streams */}
      {activeStreams.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-red-600">🔴 Currently Live</h2>
          <div className="grid gap-4">
            {activeStreams.map((stream) => (
              <div key={stream.id} className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{stream.title}</h3>
                    <p className="text-gray-600 mt-1">{stream.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        🔴 LIVE
                      </span>
                      <span className="text-sm text-gray-600">
                        👥 {stream.currentListeners} listeners
                      </span>
                      <span className="text-sm text-gray-600">
                        📊 Peak: {stream.peakListeners}
                      </span>
                    </div>
                    {stream.metadata?.currentTrack && (
                      <div className="mt-2 text-sm text-gray-600">
                        🎵 Now Playing: {stream.metadata.currentTrack}
                        {stream.metadata.artist && ` by ${stream.metadata.artist}`}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      Started: {new Date(stream.startedAt!).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      Duration: {formatDuration(stream.duration)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Stream Form */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create New Stream</h2>
            <form onSubmit={createStream}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stream Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter stream title"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter stream description"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quality
                </label>
                <select
                  value={formData.quality}
                  onChange={(e) => setFormData({...formData, quality: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low (64 kbps)</option>
                  <option value="medium">Medium (128 kbps)</option>
                  <option value="high">High (256 kbps)</option>
                  <option value="ultra">Ultra (320 kbps)</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.recordingEnabled}
                    onChange={(e) => setFormData({...formData, recordingEnabled: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Enable Recording</span>
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Create Stream
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Metadata Update Form */}
      {selectedStream && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Update Now Playing</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Track Title
              </label>
              <input
                type="text"
                value={metadataForm.currentTrack}
                onChange={(e) => setMetadataForm({...metadataForm, currentTrack: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter track title"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Artist
              </label>
              <input
                type="text"
                value={metadataForm.artist}
                onChange={(e) => setMetadataForm({...metadataForm, artist: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter artist name"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Album
              </label>
              <input
                type="text"
                value={metadataForm.album}
                onChange={(e) => setMetadataForm({...metadataForm, album: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter album name"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Genre
              </label>
              <input
                type="text"
                value={metadataForm.genre}
                onChange={(e) => setMetadataForm({...metadataForm, genre: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter genre"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => updateMetadata(selectedStream.streamKey)}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Update
              </button>
              <button
                onClick={() => setSelectedStream(null)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* All Streams */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">All Streams</h2>
        {streams.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No streams created yet. Create your first stream to get started!
          </div>
        ) : (
          <div className="grid gap-6">
            {streams.map((stream) => (
              <div key={stream.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{stream.title}</h3>
                    <p className="text-gray-600 mt-1">{stream.description}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(stream.status)}`}>
                    {stream.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">OBS Settings</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Server:</span>
                        <div className="flex items-center gap-2">
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {stream.streamUrl ? stream.streamUrl.replace(`/${stream.streamKey}`, '') : 'N/A'}
                          </code>
                          <button
                            onClick={() => copyToClipboard(stream.streamUrl ? stream.streamUrl.replace(`/${stream.streamKey}`, '') : '')}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            📋
                          </button>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Stream Key:</span>
                        <div className="flex items-center gap-2">
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {stream.streamKey || 'N/A'}
                          </code>
                          <button
                            onClick={() => copyToClipboard(stream.streamKey || '')}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            📋
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Stream Info</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div>Quality: {stream.quality} ({stream.quality === 'low' ? '64' : stream.quality === 'medium' ? '128' : stream.quality === 'high' ? '256' : '320'} kbps)</div>
                      <div>Recording: {stream.recordingEnabled ? 'Enabled' : 'Disabled'}</div>
                      <div>Created: {new Date(stream.createdAt).toLocaleDateString()}</div>
                      {stream.isActive && (
                        <>
                          <div>👥 Current: {stream.currentListeners} listeners</div>
                          <div>📊 Peak: {stream.peakListeners} listeners</div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedStream(stream);
                      setMetadataForm({
                        currentTrack: stream.metadata?.currentTrack || '',
                        artist: stream.metadata?.artist || '',
                        album: stream.metadata?.album || '',
                        genre: stream.metadata?.genre || ''
                      });
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm"
                  >
                    Update Now Playing
                  </button>
                  <button
                    onClick={() => copyToClipboard(stream.playbackUrl || '')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    Copy Playback URL
                  </button>
                  <button
                    onClick={() => deleteStream(stream.streamKey)}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}