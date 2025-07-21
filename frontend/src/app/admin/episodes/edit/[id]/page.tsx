'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { episodesAPI, Episode, Presenter, Guest } from '@/lib/api';

interface Category {
  _id: string;
  name: string;
  icon: string;
  color: string;
}

export default function EditEpisodePage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [episode, setEpisode] = useState<Episode | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [updatedEpisode, setUpdatedEpisode] = useState({
        title: '',
        description: '',
        duration: '',
        category: 'Music',
        audioFile: null as File | null,
        status: 'draft' as 'published' | 'draft',
        presenters: [] as Presenter[],
        guests: [] as Guest[]
    });
    const [isCalculatingDuration, setIsCalculatingDuration] = useState(false);

    useEffect(() => {
        if (id) {
            fetchEpisode(id);
        }
        fetchCategories();
    }, [id]);

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

    const fetchEpisode = async (id: string) => {
        try {
            const response = await episodesAPI.getOne(id);
            setEpisode(response);
            setUpdatedEpisode({
                title: response.title,
                description: response.description,
                duration: response.duration,
                category: response.category,
                status: response.status,
                presenters: response.presenters || [],
                guests: response.guests || [],
                audioFile: null
            });
        } catch (error) {
            console.error('Failed to fetch episode:', error);
        }
    };

    const calculateAudioDuration = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            const url = URL.createObjectURL(file);
            audio.addEventListener('loadedmetadata', () => {
                const duration = audio.duration;
                const hours = Math.floor(duration / 3600);
                const minutes = Math.floor((duration % 3600) / 60);
                const seconds = Math.floor(duration % 60);
                const formattedDuration = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                URL.revokeObjectURL(url);
                resolve(formattedDuration);
            });
            audio.addEventListener('error', () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load audio file'));
            });
            audio.src = url;
        });
    };

    const handleAudioFileChange = async (file: File | null) => {
        setUpdatedEpisode({ ...updatedEpisode, audioFile: file });
        if (file) {
            setIsCalculatingDuration(true);
            try {
                const duration = await calculateAudioDuration(file);
                setUpdatedEpisode(prev => ({ ...prev, audioFile: file, duration }));
            } catch (error) {
                console.error('Error calculating duration:', error);
                setUpdatedEpisode(prev => ({ ...prev, audioFile: file }));
            } finally {
                setIsCalculatingDuration(false);
            }
        }
    };

    const addPresenter = () => {
        setUpdatedEpisode({
            ...updatedEpisode,
            presenters: [...updatedEpisode.presenters, { name: '', role: '', bio: '' }]
        });
    };

    const updatePresenter = (index: number, field: keyof Presenter, value: string) => {
        const updatedPresenters = [...updatedEpisode.presenters];
        updatedPresenters[index] = { ...updatedPresenters[index], [field]: value };
        setUpdatedEpisode({ ...updatedEpisode, presenters: updatedPresenters });
    };

    const removePresenter = (index: number) => {
        const updatedPresenters = updatedEpisode.presenters.filter((_, i) => i !== index);
        setUpdatedEpisode({ ...updatedEpisode, presenters: updatedPresenters });
    };

    const addGuest = () => {
        setUpdatedEpisode({
            ...updatedEpisode,
            guests: [...updatedEpisode.guests, { name: '', title: '', company: '', bio: '' }]
        });
    };

    const updateGuest = (index: number, field: keyof Guest, value: string) => {
        const updatedGuests = [...updatedEpisode.guests];
        updatedGuests[index] = { ...updatedGuests[index], [field]: value };
        setUpdatedEpisode({ ...updatedEpisode, guests: updatedGuests });
    };

    const removeGuest = (index: number) => {
        const updatedGuests = updatedEpisode.guests.filter((_, i) => i !== index);
        setUpdatedEpisode({ ...updatedEpisode, guests: updatedGuests });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('title', updatedEpisode.title);
            formData.append('description', updatedEpisode.description);
            formData.append('duration', updatedEpisode.duration);
            formData.append('category', updatedEpisode.category);
            formData.append('status', updatedEpisode.status);
            formData.append('presenters', JSON.stringify(updatedEpisode.presenters));
            formData.append('guests', JSON.stringify(updatedEpisode.guests));

            if (updatedEpisode.audioFile) {
                formData.append('audioFile', updatedEpisode.audioFile);
            }

            await episodesAPI.update(id, formData);
            alert('Episode updated successfully!');
            router.push('/admin/episodes');
        } catch (error) {
            console.error('Error updating episode:', error);
            alert('Failed to update episode');
        }
    };

    if (!episode) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                <span className="ml-2 text-gray-600">Loading episode...</span>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Episode</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Episode Title</label>
                    <input
                        type="text"
                        required
                        value={updatedEpisode.title}
                        onChange={(e) => setUpdatedEpisode({ ...updatedEpisode, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                        required
                        value={updatedEpisode.description}
                        onChange={(e) => setUpdatedEpisode({ ...updatedEpisode, description: e.target.value })}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Duration {isCalculatingDuration && <span className="text-blue-600">(calculating...)</span>}
                        </label>
                        <input
                            type="text"
                            required
                            value={updatedEpisode.duration}
                            onChange={(e) => setUpdatedEpisode({ ...updatedEpisode, duration: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                            disabled={isCalculatingDuration}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                        <select
                            value={updatedEpisode.category}
                            onChange={(e) => setUpdatedEpisode({ ...updatedEpisode, category: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                            {categories.length === 0 ? (
                                <option>Loading categories...</option>
                            ) : (
                                categories.map((category) => (
                                    <option key={category._id} value={category.name}>
                                        {category.name}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Audio File (optional)</label>
                    <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => handleAudioFileChange(e.target.files?.[0] || null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        disabled={isCalculatingDuration}
                    />
                </div>
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <label className="block text-sm font-medium text-gray-700">Presenters</label>
                        <button type="button" onClick={addPresenter} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
                            + Add Presenter
                        </button>
                    </div>
                    {updatedEpisode.presenters.map((presenter, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 mb-3">
                            <div className="flex justify-between items-start mb-3">
                                <h4 className="text-sm font-medium text-gray-700">Presenter {index + 1}</h4>
                                <button type="button" onClick={() => removePresenter(index)} className="text-red-600 hover:text-red-800 text-sm">
                                    Remove
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    placeholder="Presenter name"
                                    value={presenter.name}
                                    onChange={(e) => updatePresenter(index, 'name', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                                <input
                                    type="text"
                                    placeholder="Role (e.g., Host, Co-host)"
                                    value={presenter.role || ''}
                                    onChange={(e) => updatePresenter(index, 'role', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                            </div>
                        </div>
                    ))}
                </div>
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <label className="block text-sm font-medium text-gray-700">Guests</label>
                        <button type="button" onClick={addGuest} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm">
                            + Add Guest
                        </button>
                    </div>
                    {updatedEpisode.guests.map((guest, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 mb-3">
                            <div className="flex justify-between items-start mb-3">
                                <h4 className="text-sm font-medium text-gray-700">Guest {index + 1}</h4>
                                <button type="button" onClick={() => removeGuest(index)} className="text-red-600 hover:text-red-800 text-sm">
                                    Remove
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    placeholder="Guest name"
                                    value={guest.name}
                                    onChange={(e) => updateGuest(index, 'name', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                                <input
                                    type="text"
                                    placeholder="Title/Position"
                                    value={guest.title || ''}
                                    onChange={(e) => updateGuest(index, 'title', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                            </div>
                        </div>
                    ))}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                        value={updatedEpisode.status}
                        onChange={(e) => setUpdatedEpisode({ ...updatedEpisode, status: e.target.value as 'published' | 'draft' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                    </select>
                </div>
                <div className="flex justify-end space-x-4">
                    <button type="button" onClick={() => router.back()} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                        Cancel
                    </button>
                    <button type="submit" className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold">
                        Update Episode
                    </button>
                </div>
            </form>
        </div>
    );
}
