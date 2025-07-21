'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { episodesAPI, Episode as APIEpisode, Presenter, Guest } from '@/lib/api';
import AudioPlayer from '@/components/AudioPlayer';

type Episode = APIEpisode;

export default function AdminEpisodesPage() {
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEpisodes();
    }, []);

    const fetchEpisodes = async () => {
        try {
            setLoading(true);
            const response = await episodesAPI.getAll();
            setEpisodes(response.episodes);
        } catch (error) {
            console.error('Failed to fetch episodes:', error);
            setEpisodes([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this episode?')) {
            try {
                await episodesAPI.delete(id);
                await fetchEpisodes();
                alert('Episode deleted successfully!');
            } catch (error) {
                console.error('Error deleting episode:', error);
                alert('Failed to delete episode');
            }
        }
    };

    const toggleStatus = async (id: string) => {
        const episode = episodes.find(ep => ep._id === id);
        if (!episode) return;

        try {
            const response = await fetch(`http://localhost:5001/api/episodes/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: episode.status === 'published' ? 'draft' : 'published'
                }),
            });

            if (response.ok) {
                await fetchEpisodes();
            } else {
                alert('Failed to update episode status');
            }
        } catch (error) {
            console.error('Error updating episode:', error);
            alert('Failed to update episode status');
        }
    };

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-semibold">Episode Management</h2>
                <Link href="/admin/episodes/new" className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold">
                    + New Episode
                </Link>
            </div>
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                    <span className="ml-2 text-gray-600">Loading episodes...</span>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Episode</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {episodes.map((episode) => (
                                <tr key={episode._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{episode.title}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                            {episode.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{episode.duration}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${episode.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {episode.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {new Date(episode.publishedAt || episode.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        <button onClick={() => toggleStatus(episode._id)} className="text-blue-600 hover:text-blue-900">
                                            {episode.status === 'published' ? 'Unpublish' : 'Publish'}
                                        </button>
                                        <Link href={`/admin/episodes/edit/${episode._id}`} className="text-green-600 hover:text-green-900">
                                            Edit
                                        </Link>
                                        <button onClick={() => handleDelete(episode._id)} className="text-red-600 hover:text-red-900">
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
