'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { episodesAPI, Episode } from '@/lib/api';
import AudioPlayer from '@/components/AudioPlayer';
import FavoriteButton from '@/components/community/FavoriteButton';
import SocialShare from '@/components/community/SocialShare';
import CommentsSection from '@/components/community/CommentsSection';
import AddToPlaylistButton from '@/components/community/AddToPlaylistButton';
import Link from 'next/link';

export default function EpisodeDetailPage() {
  const params = useParams();
  const episodeId = params.id as string;
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (episodeId) {
      fetchEpisode();
    }
  }, [episodeId]);

  const fetchEpisode = async () => {
    try {
      setLoading(true);
      // For now, we'll get the episode from the episodes list
      // In a real app, you'd have a dedicated endpoint for single episodes
      const response = await episodesAPI.getPublic({ limit: 100 });
      const foundEpisode = response.episodes.find((ep: Episode) => ep._id === episodeId);
      
      if (foundEpisode) {
        setEpisode(foundEpisode);
      } else {
        setError('Episode not found');
      }
    } catch (error) {
      console.error('Failed to fetch episode:', error);
      setError('Failed to load episode');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="h-64 bg-gray-200 rounded mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !episode) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Episode Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The episode you\'re looking for doesn\'t exist.'}</p>
          <Link
            href="/episodes"
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Browse Episodes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center space-x-2 mb-4">
            <Link href="/episodes" className="text-red-200 hover:text-white">
              Episodes
            </Link>
            <span className="text-red-200">→</span>
            <span className="text-white">{episode.title}</span>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{episode.title}</h1>
              <p className="text-xl text-red-100 mb-6">{episode.description}</p>
              
              {/* Episode Meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-red-200">
                <span className="flex items-center">
                  <span className="mr-1">📅</span>
                  {new Date(episode.publishedAt || episode.createdAt).toLocaleDateString()}
                </span>
                <span className="flex items-center">
                  <span className="mr-1">⏱️</span>
                  {episode.duration}
                </span>
                <span className="flex items-center">
                  <span className="mr-1">🏷️</span>
                  {episode.category}
                </span>
                <span className="flex items-center">
                  <span className="mr-1">👥</span>
                  {episode.plays} plays
                </span>
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Actions</h3>
                </div>
                <div className="space-y-3">
                  <FavoriteButton 
                    itemType="episode" 
                    itemId={episode._id}
                    className="w-full justify-center bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors"
                  />
                  <SocialShare 
                    episodeId={episode._id}
                    episodeTitle={episode.title}
                    episodeDescription={episode.description}
                    className="w-full justify-center bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors"
                  />
                  <AddToPlaylistButton
                    episodeId={episode._id}
                    className="w-full justify-center bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Audio Player */}
            {episode.audioFile && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Listen Now</h2>
                <AudioPlayer 
                  audioFile={episode.audioFile} 
                  episodeId={episode._id} 
                  className="w-full"
                />
              </div>
            )}

            {/* Presenters and Guests */}
            {((episode.presenters && episode.presenters.length > 0) || (episode.guests && episode.guests.length > 0)) && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Featured</h2>
                <div className="space-y-4">
                  {/* Presenters */}
                  {episode.presenters && episode.presenters.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-blue-600 mb-2">🎙️ Hosted by</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {episode.presenters.map((presenter, idx) => (
                          <div key={idx} className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium">
                                {presenter.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{presenter.name}</div>
                              {presenter.role && (
                                <div className="text-sm text-gray-600">{presenter.role}</div>
                              )}
                              {presenter.bio && (
                                <div className="text-sm text-gray-500 mt-1">{presenter.bio}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Guests */}
                  {episode.guests && episode.guests.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-green-600 mb-2">👥 Featuring</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {episode.guests.map((guest, idx) => (
                          <div key={idx} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium">
                                {guest.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{guest.name}</div>
                              {guest.title && (
                                <div className="text-sm text-gray-600">{guest.title}</div>
                              )}
                              {guest.company && (
                                <div className="text-sm text-gray-500">{guest.company}</div>
                              )}
                              {guest.bio && (
                                <div className="text-sm text-gray-500 mt-1">{guest.bio}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Comments Section */}
            <CommentsSection episodeId={episode._id} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Episode Stats */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Episode Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Plays</span>
                    <span className="font-medium">{episode.plays.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Likes</span>
                    <span className="font-medium">{episode.likes.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-medium">{episode.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category</span>
                    <span className="font-medium">{episode.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Published</span>
                    <span className="font-medium">
                      {new Date(episode.publishedAt || episode.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Related Episodes */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">More Episodes</h3>
                <div className="text-center text-gray-500">
                  <div className="text-2xl mb-2">🎧</div>
                  <p className="text-sm">Related episodes coming soon!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
