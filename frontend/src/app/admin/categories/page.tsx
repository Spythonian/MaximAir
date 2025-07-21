'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Category {
  _id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  isActive: boolean;
  episodeCount: number;
  createdBy: {
    username: string;
    _id: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface CategoryStats {
  total: number;
  active: number;
  inactive: number;
  totalEpisodes: number;
}

export default function CategoriesPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<CategoryStats>({
    total: 0,
    active: 0,
    inactive: 0,
    totalEpisodes: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // New category form state
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    icon: '🎵',
    color: '#FF4B4B'
  });
  
  // Edit category state
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  // Color presets
  const colorPresets = [
    '#FF4B4B', // Red
    '#FF9500', // Orange
    '#FFCC00', // Yellow
    '#34C759', // Green
    '#00B8D4', // Cyan
    '#2196F3', // Blue
    '#9C27B0', // Purple
    '#FF6B8E', // Pink
    '#795548', // Brown
    '#607D8B'  // Gray
  ];
  
  // Icon presets
  const iconPresets = [
    '🎵', '🎙️', '🎧', '📻', '🎸', '🥁', '🎹', '🎷', '🎺', '🎻',
    '📰', '📊', '💬', '🎮', '🏆', '⚽', '🏀', '🎬', '📚', '🎭',
    '💻', '📱', '🔬', '🌍', '🍔', '☕', '🎯', '💼', '🏛️', '🎨'
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/api/categories/admin', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      
      const data = await response.json();
      setCategories(data.categories);
      setStats(data.stats);
      setError(null);
    } catch (err) {
      setError('Failed to load categories. Please try again.');
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:5001/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newCategory)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create category');
      }
      
      // Reset form and refresh categories
      setNewCategory({
        name: '',
        description: '',
        icon: '🎵',
        color: '#FF4B4B'
      });
      
      fetchCategories();
    } catch (err: any) {
      setError(err.message || 'Failed to create category');
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingCategory) return;
    
    try {
      const response = await fetch(`http://localhost:5001/api/categories/${editingCategory._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: editingCategory.name,
          description: editingCategory.description,
          icon: editingCategory.icon,
          color: editingCategory.color,
          isActive: editingCategory.isActive
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update category');
      }
      
      // Reset editing state and refresh categories
      setEditingCategory(null);
      fetchCategories();
    } catch (err: any) {
      setError(err.message || 'Failed to update category');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`http://localhost:5001/api/categories/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to toggle category status');
      }
      
      // Update local state
      setCategories(categories.map(cat => 
        cat._id === id ? { ...cat, isActive: !currentStatus } : cat
      ));
      
      // Update stats
      setStats({
        ...stats,
        active: currentStatus ? stats.active - 1 : stats.active + 1,
        inactive: currentStatus ? stats.inactive + 1 : stats.inactive - 1
      });
    } catch (err) {
      setError('Failed to update category status');
      console.error('Error toggling category status:', err);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:5001/api/categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete category');
      }
      
      // Remove from local state
      setCategories(categories.filter(cat => cat._id !== id));
      
      // Update stats
      const deletedCategory = categories.find(cat => cat._id === id);
      if (deletedCategory) {
        setStats({
          ...stats,
          total: stats.total - 1,
          active: deletedCategory.isActive ? stats.active - 1 : stats.active,
          inactive: !deletedCategory.isActive ? stats.inactive - 1 : stats.inactive,
          totalEpisodes: stats.totalEpisodes - deletedCategory.episodeCount
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete category');
      console.error('Error deleting category:', err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Categories</h1>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700">Total Categories</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-green-700">Active Categories</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">{stats.active}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-500">Inactive Categories</h3>
          <p className="text-3xl font-bold text-gray-500 mt-2">{stats.inactive}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-blue-700">Total Episodes</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalEpisodes}</p>
        </div>
      </div>
      
      {/* Create Category Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Create New Category</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Name
              </label>
              <input
                type="text"
                required
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="e.g., Music, Technology, News"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <input
                type="text"
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Brief description of this category"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Icon
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {iconPresets.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setNewCategory({ ...newCategory, icon })}
                    className={`w-10 h-10 flex items-center justify-center text-xl rounded-lg border ${
                      newCategory.icon === icon 
                        ? 'border-red-500 bg-red-50' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={newCategory.icon}
                onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Emoji icon"
                maxLength={2}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {colorPresets.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewCategory({ ...newCategory, color })}
                    className={`w-10 h-10 rounded-lg border ${
                      newCategory.color === color 
                        ? 'border-black' 
                        : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <input
                type="color"
                value={newCategory.color}
                onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                className="w-full h-10 px-1 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
          
          {/* Preview */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Preview</h3>
            <div className="flex items-center space-x-2">
              <span className="text-2xl" style={{ color: newCategory.color }}>{newCategory.icon}</span>
              <span className="font-medium">{newCategory.name || 'Category Name'}</span>
              {newCategory.description && (
                <span className="text-sm text-gray-500">- {newCategory.description}</span>
              )}
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
            >
              Create Category
            </button>
          </div>
        </form>
      </div>
      
      {/* Categories List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h2 className="text-xl font-semibold p-6 border-b">All Categories</h2>
        
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            <span className="ml-2 text-gray-600">Loading categories...</span>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No categories found. Create your first category above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Episodes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map((category) => (
                  <tr key={category._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-2xl mr-2" style={{ color: category.color }}>
                          {category.icon}
                        </span>
                        <div>
                          <div className="font-medium text-gray-900">{category.name}</div>
                          {category.description && (
                            <div className="text-sm text-gray-500">{category.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-900">{category.episodeCount}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        category.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category.createdBy?.username || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(category.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setEditingCategory(category)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(category._id, category.isActive)}
                        className={`${
                          category.isActive 
                            ? 'text-amber-600 hover:text-amber-900' 
                            : 'text-green-600 hover:text-green-900'
                        } mr-3`}
                      >
                        {category.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category._id)}
                        className="text-red-600 hover:text-red-900"
                        disabled={category.episodeCount > 0}
                        title={category.episodeCount > 0 ? 'Cannot delete category with episodes' : 'Delete category'}
                      >
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
      
      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Edit Category</h2>
              <button 
                onClick={() => setEditingCategory(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleUpdateCategory} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    value={editingCategory.description || ''}
                    onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Icon
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {iconPresets.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setEditingCategory({ ...editingCategory, icon })}
                        className={`w-10 h-10 flex items-center justify-center text-xl rounded-lg border ${
                          editingCategory.icon === icon 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={editingCategory.icon}
                    onChange={(e) => setEditingCategory({ ...editingCategory, icon: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={2}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {colorPresets.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setEditingCategory({ ...editingCategory, color })}
                        className={`w-10 h-10 rounded-lg border ${
                          editingCategory.color === color 
                            ? 'border-black' 
                            : 'border-gray-200'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <input
                    type="color"
                    value={editingCategory.color}
                    onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })}
                    className="w-full h-10 px-1 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editingCategory.isActive}
                  onChange={(e) => setEditingCategory({ ...editingCategory, isActive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Active (visible to users)
                </label>
              </div>
              
              {/* Preview */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Preview</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl" style={{ color: editingCategory.color }}>{editingCategory.icon}</span>
                  <span className="font-medium">{editingCategory.name}</span>
                  {editingCategory.description && (
                    <span className="text-sm text-gray-500">- {editingCategory.description}</span>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}