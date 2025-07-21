// API configuration
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// App configuration
export const APP_NAME = 'MaximAir';
export const APP_DESCRIPTION = 'Modern radio station management system';

// Auth configuration
export const TOKEN_KEY = 'maximair_token';
export const USER_KEY = 'maximair_user';

// Feature flags
export const FEATURES = {
  LIVE_STREAMING: true,
  COMMENTS: true,
  PLAYLISTS: true,
  FAVORITES: true,
  ANALYTICS: true,
};