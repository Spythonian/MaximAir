import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export interface Presenter {
  name: string;
  role?: string;
  bio?: string;
  image?: string;
}

export interface Guest {
  name: string;
  title?: string;
  company?: string;
  bio?: string;
  image?: string;
}

export interface Episode {
  _id: string;
  title: string;
  description: string;
  duration: string;
  category: string;
  status: 'published' | 'draft';
  audioFile?: string;
  imageFile?: string;
  createdBy: {
    _id: string;
    username: string;
  };
  plays: number;
  likes: number;
  tags: string[];
  presenters: Presenter[];
  guests: Guest[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface User {
  _id: string;
  username: string;
  email: string;
  role: 'admin' | 'editor' | 'user' | 'visitor';
  isActive: boolean;
  profile: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatar?: string;
    location?: string;
    website?: string;
  };
  preferences: {
    favoriteCategories: string[];
    emailNotifications: boolean;
    publicProfile: boolean;
  };
  stats: {
    totalListeningTime: number;
    episodesListened: number;
    commentsCount: number;
    playlistsCount: number;
    favoritesCount: number;
    averageSessionDuration: number;
    lastActiveAt: string;
  };
  createdAt: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
}

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (username: string, email: string, password: string, role?: string) => {
    const response = await api.post('/auth/register', { username, email, password, role });
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  refreshToken: async () => {
    const response = await api.post('/auth/refresh');
    return response.data;
  }
};

// Episodes API
export const episodesAPI = {
  getPublic: async (params?: { page?: number; limit?: number; category?: string; search?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    const response = await fetch(`${API_BASE_URL}/episodes/public?${query}`, {
      next: { revalidate: 10 }, // Revalidate every 10 seconds
    });
    if (!response.ok) {
      throw new Error('Failed to fetch episodes');
    }
    return response.json();
  },

  getAll: async (params?: { page?: number; limit?: number; status?: string; category?: string }) => {
    const response = await api.get('/episodes', { params });
    return response.data;
  },

  getOne: async (id: string) => {
    const response = await api.get(`/episodes/${id}`);
    return response.data.episode;
  },

  getById: async (id: string) => {
    const response = await api.get(`/episodes/${id}`);
    return response.data;
  },

  create: async (episodeData: FormData) => {
    const response = await api.post('/episodes', episodeData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  update: async (id: string, episodeData: FormData) => {
    const response = await api.put(`/episodes/${id}`, episodeData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/episodes/${id}`);
    return response.data;
  },

  incrementPlay: async (id: string) => {
    const response = await api.post(`/episodes/${id}/play`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/episodes/stats/overview');
    return response.data;
  }
};

// Users API
export const usersAPI = {
  getAll: async (params?: { page?: number; limit?: number; role?: string; search?: string }) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  update: async (id: string, userData: Partial<User>) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  updateProfile: async (profileData: { username?: string; email?: string; currentPassword?: string; newPassword?: string }) => {
    const response = await api.put('/users/profile/me', profileData);
    return response.data;
  }
};

export default api;
