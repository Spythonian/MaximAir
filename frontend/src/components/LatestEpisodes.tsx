
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { episodesAPI, Episode } from '@/lib/api';
import AudioPlayer from './AudioPlayer';
import FavoriteButton from './community/FavoriteButton';
import SocialShare from './community/SocialShare';

export default function LatestEpisodes() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEpisodes() {
      try {
        const response = await episodesAPI.getPublic({ limit: 3 });
        setEpisodes(response.episodes);
      } catch (error) {
        console.error('Failed to fetch latest episodes:', error);
        setEpisodes([]);
      } finally {
        setLoading(false);
      }
    }
    fetchEpisodes();
  }, []);

  const handleListenNow = async (episodeId: string) => {
    try {
      await episodesAPI.incrementPlay(episodeId);
    } catch (error) {
      console.error('Failed to increment play count:', error);
    }
  };

  if (loading) {
    return (
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-100">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">Latest Episodes</h2>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            <span className="ml-2 text-gray-600">Loading episodes...</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-100">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">Latest Episodes</h2>

        {episodes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🎧</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Episodes Yet</h3>
            <p className="text-gray-600">Check back soon for our latest episodes!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {episodes.map((episode: Episode) => (
                <div key={episode._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="h-48 bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="text-4xl mb-2">🎧</div>
                      <div className="text-sm opacity-75">{episode.category}</div>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2 text-gray-900">
                      {episode.title}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {episode.description.length > 100
                        ? `${episode.description.substring(0, 100)}...`
                        : episode.description}
                    </p>
                    
                    {/* Presenters and Guests Display */}
                    {((episode.presenters && episode.presenters.length > 0) || (episode.guests && episode.guests.length > 0)) && (
                      <div className="mb-4 space-y-2">
                        {/* Presenters */}
                        {episode.presenters && episode.presenters.length > 0 && (
                          <div className="flex items-start">
                            <span className="text-sm font-medium text-blue-600 mr-2">🎙️ Hosted by:</span>
                            <div className="text-sm text-gray-700">
                              {episode.presenters.map((presenter, idx) => (
                                <div key={idx} className="inline">
                                  <span className="font-medium">{presenter.name}</span>
                                  {presenter.role && <span className="text-gray-500"> ({presenter.role})</span>}
                                  {idx < episode.presenters.length - 1 && <span>, </span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Guests */}
                        {episode.guests && episode.guests.length > 0 && (
                          <div className="flex items-start">
                            <span className="text-sm font-medium text-green-600 mr-2">👥 Featuring:</span>
                            <div className="text-sm text-gray-700">
                              {episode.guests.map((guest, idx) => (
                                <div key={idx} className="inline">
                                  <span className="font-medium">{guest.name}</span>
                                  {guest.title && <span className="text-gray-500"> ({guest.title})</span>}
                                  {guest.company && <span className="text-gray-500"> - {guest.company}</span>}
                                  {idx < episode.guests.length - 1 && <span>, </span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-500">
                        {new Date(episode.publishedAt || episode.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-sm text-gray-500">{episode.duration}</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center text-sm text-gray-500">
                          <span>👥 {episode.plays}</span>
                          <span className="mx-2">•</span>
                          <span>❤️ {episode.likes}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <FavoriteButton 
                            itemType="episode" 
                            itemId={episode._id}
                            className="text-sm"
                          />
                          <SocialShare 
                            episodeId={episode._id}
                            episodeTitle={episode.title}
                            episodeDescription={episode.description}
                            className="text-sm"
                          />
                        </div>
                      </div>
                      
                      {episode.audioFile ? (
                        <div className="w-full">
                          <AudioPlayer audioFile={episode.audioFile} episodeId={episode._id} className="w-full" />
                        </div>
                      ) : (
                        <button
                          onClick={() => handleListenNow(episode._id)}
                          className="text-red-600 hover:text-red-700 font-semibold"
                        >
                          Listen Now →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link
                href="/episodes"
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                View All Episodes
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
