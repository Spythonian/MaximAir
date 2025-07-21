'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface Show {
  _id: string;
  title: string;
  description: string;
  presenters: Array<{
    userId: string;
    name: string;
    role: string;
  }>;
  startTime: string;
  endTime: string;
  dayOfWeek: number;
  category: string;
  isLive: boolean;
  status: string;
  streamUrl?: string;
  recordingEnabled: boolean;
  recordingUrl?: string;
  listeners: number;
  maxListeners: number;
}

interface User {
  _id: string;
  username: string;
  profile: {
    firstName?: string;
    lastName?: string;
  };
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const CATEGORIES = ['Music', 'Talk', 'News', 'Sports', 'Entertainment', 'Education', 'Other'];

export default function AdminSchedulePage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [schedule, setSchedule] = useState<Show[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingShow, setEditingShow] = useState<Show | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    dayOfWeek: 0,
    category: 'Music',
    presenters: [] as Array<{ userId: string; name: string; role: string }>,
    isRecurring: true,
    recordingEnabled: true
  });

  useEffect(() => {
    if (!user || !token || (user.role !== 'admin' && user.role !== 'editor')) {
      router.push('/admin/login');
      return;
    }
    fetchSchedule();
    fetchUsers();
  }, [user, token, router]);

  const fetchSchedule = async () => {
    try {
      const response = await api.get('/schedule');
      setSchedule(response.data.schedule || []);
    } catch (error) {
      console.error('Failed to fetch schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingShow) {
        await api.put(`/schedule/${editingShow._id}`, formData);
      } else {
        await api.post('/schedule', formData);
      }
      fetchSchedule();
      resetForm();
    } catch (error) {
      console.error('Failed to save show:', error);
      alert('Failed to save show. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this show?')) return;
    
    try {
      await api.delete(`/schedule/${id}`);
      fetchSchedule();
    } catch (error) {
      console.error('Failed to delete show:', error);
      alert('Failed to delete show. Please try again.');
    }
  };

  const handleGoLive = async (show: Show) => {
    try {
      await api.post(`/schedule/${show._id}/go-live`, {
        streamUrl: `https://stream.iconicfm.com/live/${show._id}/playlist.m3u8`
      });
      fetchSchedule();
      alert(`${show.title} is now live!`);
    } catch (error) {
      console.error('Failed to go live:', error);
      alert('Failed to start live stream. Please try again.');
    }
  };

  const handleEndLive = async (show: Show) => {
    try {
      await api.post(`/schedule/${show._id}/end-live`, {
        recordingUrl: `https://recordings.iconicfm.com/${show._id}.mp3`
      });
      fetchSchedule();
      alert(`${show.title} has ended.`);
    } catch (error) {
      console.error('Failed to end live stream:', error);
      alert('Failed to end live stream. Please try again.');
    }
  };

  const handleStartRecording = async (show: Show) => {
    try {
      await api.post(`/schedule/${show._id}/start-recording`);
      fetchSchedule();
      alert(`Recording started for ${show.title}`);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Failed to start recording. Please try again.');
    }
  };

  const handleStopRecording = async (show: Show) => {
    try {
      await api.post(`/schedule/${show._id}/stop-recording`);
      fetchSchedule();
      alert(`Recording stopped for ${show.title}`);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      alert('Failed to stop recording. Please try again.');
    }
  };

  const editShow = (show: Show) => {
    setEditingShow(show);
    setFormData({
      title: show.title,
      description: show.description,
      startTime: new Date(show.startTime).toISOString().slice(0, 16),
      endTime: new Date(show.endTime).toISOString().slice(0, 16),
      dayOfWeek: show.dayOfWeek,
      category: show.category,
      presenters: show.presenters || [],
      isRecurring: true,
      recordingEnabled: show.recordingEnabled
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingShow(null);
    setFormData({
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      dayOfWeek: 0,
      category: 'Music',
      presenters: [],
      isRecurring: true,
      recordingEnabled: true
    });
    setShowForm(false);
  };

  const addPresenter = () => {
    if (users.length === 0) return;
    
    const firstUser = users[0];
    const newPresenter = {
      userId: firstUser._id,
      name: firstUser.profile.firstName && firstUser.profile.lastName
        ? `${firstUser.profile.firstName} ${firstUser.profile.lastName}`
        : firstUser.username,
      role: 'Host'
    };
    
    setFormData({
      ...formData,
      presenters: [...formData.presenters, newPresenter]
    });
  };

  const removePresenter = (index: number) => {
    setFormData({
      ...formData,
      presenters: formData.presenters.filter((_, i) => i !== index)
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Schedule Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          {showForm ? 'Cancel' : 'Add Show'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingShow ? 'Edit Show' : 'Add New Show'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Day of Week
                </label>
                <select
                  value={formData.dayOfWeek}
                  onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                >
                  {DAYS.map((day, index) => (
                    <option key={day} value={index}>{day}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Presenters
                </label>
                <button
                  type="button"
                  onClick={addPresenter}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  + Add Presenter
                </button>
              </div>
              
              {formData.presenters.length === 0 ? (
                <div className="text-sm text-gray-500 italic">
                  No presenters added. Click "Add Presenter" to add one.
                </div>
              ) : (
                <div className="space-y-2">
                  {formData.presenters.map((presenter, index) => (
                    <div key={index} className="flex items-center space-x-2 bg-gray-50 p-2 rounded">
                      <div className="flex-1">
                        <select
                          value={presenter.userId}
                          onChange={(e) => {
                            const selectedUser = users.find(u => u._id === e.target.value);
                            if (selectedUser) {
                              const updatedPresenters = [...formData.presenters];
                              updatedPresenters[index] = {
                                ...presenter,
                                userId: selectedUser._id,
                                name: selectedUser.profile.firstName && selectedUser.profile.lastName
                                  ? `${selectedUser.profile.firstName} ${selectedUser.profile.lastName}`
                                  : selectedUser.username
                              };
                              setFormData({ ...formData, presenters: updatedPresenters });
                            }
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                        >
                          {users.map((user) => (
                            <option key={user._id} value={user._id}>
                              {user.profile.firstName && user.profile.lastName
                                ? `${user.profile.firstName} ${user.profile.lastName}`
                                : user.username}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <select
                          value={presenter.role}
                          onChange={(e) => {
                            const updatedPresenters = [...formData.presenters];
                            updatedPresenters[index] = {
                              ...presenter,
                              role: e.target.value
                            };
                            setFormData({ ...formData, presenters: updatedPresenters });
                          }}
                          className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                        >
                          <option value="Host">Host</option>
                          <option value="Co-host">Co-host</option>
                          <option value="Guest">Guest</option>
                          <option value="DJ">DJ</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePresenter(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isRecurring}
                  onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Recurring weekly</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.recordingEnabled}
                  onChange={(e) => setFormData({ ...formData, recordingEnabled: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Enable recording</span>
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                {editingShow ? 'Update Show' : 'Create Show'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Scheduled Shows</h2>
        </div>

        {schedule.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">No shows scheduled yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Show
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Schedule
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Presenters
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {schedule.map((show) => (
                  <tr key={show._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{show.title}</div>
                      <div className="text-sm text-gray-500">{show.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{DAYS[show.dayOfWeek]}</div>
                      <div className="text-sm text-gray-500">
                        {formatTime(show.startTime)} - {formatTime(show.endTime)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {show.presenters.length > 0 ? (
                        <div className="text-sm text-gray-900">
                          {show.presenters.map(p => p.name).join(', ')}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">No presenters</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        show.status === 'live' ? 'bg-green-100 text-green-800' :
                        show.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        show.status === 'recording' ? 'bg-purple-100 text-purple-800' :
                        show.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {show.status.toUpperCase()}
                      </span>
                      {show.isLive && (
                        <div className="text-xs text-gray-500 mt-1">
                          {show.listeners} listeners
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {show.status === 'scheduled' && (
                          <>
                            <button
                              onClick={() => handleGoLive(show)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Go Live
                            </button>
                            {show.recordingEnabled && (
                              <button
                                onClick={() => handleStartRecording(show)}
                                className="text-purple-600 hover:text-purple-900"
                              >
                                Record
                              </button>
                            )}
                          </>
                        )}
                        {show.status === 'live' && (
                          <button
                            onClick={() => handleEndLive(show)}
                            className="text-red-600 hover:text-red-900"
                          >
                            End
                          </button>
                        )}
                        {show.status === 'recording' && (
                          <button
                            onClick={() => handleStopRecording(show)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Stop Recording
                          </button>
                        )}
                        <button
                          onClick={() => editShow(show)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(show._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}