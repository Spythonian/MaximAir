'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { episodesAPI, Episode } from '@/lib/api';
import AudioPlayer from '@/components/AudioPlayer';
import FavoriteButton from '@/components/community/FavoriteButton';
import SocialShare from '@/components/community/SocialShare';
import AddToPlaylistButton from '@/components/community/AddToPlaylistButton';
import Link from 'next/link';

interface Category {
  _id: string;
  name: string;
  icon: string;
  color: string;
  episodeCount: number;
}

export default function EpisodesPage() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get('category') || 'All';

  useEffect(() => {
    fetchCategories();
    fetchEpisodes();
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchEpisodes = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 20 };
      if (selectedCategory !== 'All') {
        params.category = selectedCategory;
      }
      const response = await episodesAPI.getPublic(params);
      setEpisodes(response.episodes);
    } catch (error) {
      console.error('Failed to fetch episodes:', error);
      setEpisodes([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-red-600 to-red-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">Episodes</h1>
          <p className="text-xl text-red-100">
            Catch up on all your favorite shows and discover new content
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filter Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Filter by Category</h3>
              <div className="space-y-2">
                <Link
                  key="all"
                  href={`/episodes?category=All`}
                  className={`block px-4 py-2 rounded-lg ${selectedCategory === 'All' ? 'bg-red-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                >
                  All Episodes
                </Link>
                {categories.map((category) => (
                  <Link
                    key={category._id}
                    href={`/episodes?category=${category.name}`}
                    className={`block px-4 py-2 rounded-lg ${selectedCategory === category.name ? 'bg-red-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                  >
                    <span className="inline-flex items-center">
                      <span className="mr-2" style={{ color: category.color }}>{category.icon}</span>
                      {category.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Episodes Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                <span className="ml-2 text-gray-600">Loading episodes...</span>
              </div>
            ) : episodes.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🎧</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Episodes Found</h3>
                <p className="text-gray-600">
                  {selectedCategory === 'All'
                    ? 'No episodes have been published yet.'
                    : `No episodes found in the ${selectedCategory} category.`}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {episodes.map((episode: Episode) => (
                  <div key={episode._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="h-48 bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center">
                      <div className="text-white text-center">
                        <div className="text-4xl mb-2">🎧</div>
                        <div className="text-sm opacity-75">{episode.category}</div>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <Link href={`/episodes/${episode._id}`}>
                          <h3 className="text-xl font-semibold text-gray-900 hover:text-red-600 transition-colors cursor-pointer">
                            {episode.title}
                          </h3>
                        </Link>
                        <span className="text-sm text-gray-500">{episode.duration}</span>
                      </div>
                      <p className="text-gray-600 mb-4">{episode.description}</p>
                      
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
                      
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-gray-500">
                          {new Date(episode.publishedAt || episode.createdAt).toLocaleDateString()}
                        </span>
                        {!episode.audioFile && (
                          <button
                            onClick={() => episodesAPI.incrementPlay(episode._id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                          >
                            Play Episode
                          </button>
                        )}
                      </div>
                      {episode.audioFile && (
                        <div className="mb-3">
                          <AudioPlayer audioFile={episode.audioFile} episodeId={episode._id} className="w-full" />
                        </div>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-500">
                          <span>👥 {episode.plays} plays</span>
                          <span className="mx-2">•</span>
                          <span>❤️ {episode.likes} likes</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <FavoriteButton 
                            itemType="episode" 
                            itemId={episode._id}
                            className="text-sm"
                          />
                          <AddToPlaylistButton 
                            episodeId={episode._id}
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}