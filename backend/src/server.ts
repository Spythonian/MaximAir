import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

// Import routes
import authRoutes from './routes/auth';
import episodeRoutes from './routes/episodes';
import userRoutes from './routes/users';
import communityRoutes from './routes/community';
import notificationRoutes from './routes/notifications';
import playlistRoutes from './routes/playlists';
import scheduleRoutes from './routes/schedule';
import livestreamRoutes from './routes/livestream';
import livechatRoutes from './routes/livechat';
import categoryRoutes from './routes/categories';
import { AnalyticsService } from './services/analyticsService';
import { recordingService } from './services/recordingService';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false
}));
// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL?.split(',') || ['https://yourdomain.com']
    : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Range'],
  exposedHeaders: ['Content-Range', 'Content-Length', 'Accept-Ranges'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

// Rate limiting
const isProduction = process.env.NODE_ENV === 'production';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 100 : 5000, // Production: 100, Development: 5000 (increased for dev)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks in development
    if (!isProduction && req.path === '/api/health') {
      return true;
    }
    return false;
  }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Multer for handling multipart/form-data
const multer = require('multer');
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Static files - serve uploads directory with proper headers for audio
app.use('/uploads', (req, res, next) => {
  // Set proper headers for audio files
  if (req.path.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) {
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=3600');
  }

  // Set proper headers for image files
  if (req.path.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours for images
  }

  next();
}, express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
// Temporarily disable episodes router due to conflicts
// app.use('/api/episodes', episodeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/categories', categoryRoutes);

// Add logging middleware for livestream routes
app.use('/api/livestream', (req, res, next) => {
  console.log(`Livestream API: ${req.method} ${req.path}`, {
    body: req.body,
    headers: {
      authorization: req.headers.authorization ? 'Present' : 'Missing'
    }
  });
  next();
});
app.use('/api/livestream', livestreamRoutes);
app.use('/api/livechat', livechatRoutes);

// Debug route to test server
app.get('/api/debug', (req, res) => {
  res.json({
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test route working!' });
});

// Episodes routes (temporary fix)
app.get('/api/episodes/public', async (req, res) => {
  try {
    const Episode = require('./models/Episode').default;
    const { category, limit = '20' } = req.query;

    let query: any = { status: 'published' };
    if (category && category !== 'All') {
      query.category = category;
    }

    const episodes = await Episode.find(query)
      .populate('createdBy', 'username')
      .sort({ publishedAt: -1 })
      .limit(parseInt(limit as string));

    res.json({
      episodes,
      pagination: {
        current: 1,
        pages: 1,
        total: episodes.length
      }
    });
  } catch (error: any) {
    console.error('Episodes error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get episode by ID
app.get('/api/episodes/:id', async (req, res) => {
  try {
    const Episode = require('./models/Episode').default;
    const episode = await Episode.findById(req.params.id).populate('createdBy', 'username');
    if (!episode) {
      return res.status(404).json({ message: 'Episode not found' });
    }
    res.json({ episode });
  } catch (error: any) {
    console.error('Get episode by ID error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all episodes (admin/editor)
app.get('/api/episodes', async (req, res) => {
  try {
    const Episode = require('./models/Episode').default;
    const episodes = await Episode.find()
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      episodes,
      pagination: {
        current: 1,
        pages: 1,
        total: episodes.length
      }
    });
  } catch (error: any) {
    console.error('Episodes error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create episode
app.post('/api/episodes', upload.fields([{ name: 'audioFile', maxCount: 1 }, { name: 'imageFile', maxCount: 1 }]), async (req, res) => {
  try {
    const Episode = require('./models/Episode').default;

    // Handle both JSON and FormData
    let title, description, duration, category, status, presenters, guests;

    if (req.headers['content-type']?.includes('multipart/form-data')) {
      // Handle FormData (from file uploads)
      title = req.body.title;
      description = req.body.description;
      duration = req.body.duration;
      category = req.body.category;
      status = req.body.status;
      // Parse JSON strings for complex data
      presenters = req.body.presenters ? JSON.parse(req.body.presenters) : [];
      guests = req.body.guests ? JSON.parse(req.body.guests) : [];
    } else {
      // Handle JSON
      ({ title, description, duration, category, status, presenters =[], guests =[] } = req.body);
    }

    // Normalize duration format
    let normalizedDuration = duration;
    if (duration) {
      // Convert common formats to HH:MM:SS
      if (/^\d{1,2}:\d{2}$/.test(duration)) {
        // Convert MM:SS to 0:MM:SS
        normalizedDuration = `0:${duration}`;
      } else if (/^\d+$/.test(duration)) {
        // Convert minutes to 0:MM:00
        const minutes = parseInt(duration);
        normalizedDuration = `0:${minutes.toString().padStart(2, '0')}:00`;
      } else if (/^\d{1,2}:\d{1,2}:\d{1,2}$/.test(duration)) {
        // Ensure proper padding (e.g., 1:5:30 -> 1:05:30)
        const parts = duration.split(':');
        normalizedDuration = `${parts[0]}:${parts[1].padStart(2, '0')}:${parts[2].padStart(2, '0')}`;
      }
    }

    console.log('Creating episode with data:', { title, description, duration: normalizedDuration, category, status });

    if (!title || !description || !normalizedDuration || !category) {
      return res.status(400).json({
        message: 'Missing required fields',
        received: { title, description, duration: normalizedDuration, category, status }
      });
    }

    // Handle file uploads
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const episode = new Episode({
      title,
      description,
      duration: normalizedDuration,
      category,
      status: status || 'draft',
      createdBy: '687a704d10aaf2bcaadb6b63', // Default admin user ID from seed
      tags: [],
      plays: 0,
      likes: 0,
      presenters: presenters || [],
      guests: guests || [],
      audioFile: files?.audioFile?.[0]?.filename,
      imageFile: files?.imageFile?.[0]?.filename
    });

    await episode.save();
    await episode.populate('createdBy', 'username');

    res.status(201).json({
      message: 'Episode created successfully',
      episode
    });
  } catch (error: any) {
    console.error('Create episode error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update episode by ID
app.put('/api/episodes/:id', upload.fields([{ name: 'audioFile', maxCount: 1 }, { name: 'imageFile', maxCount: 1 }]), async (req, res) => {
  try {
    const Episode = require('./models/Episode').default;
    const { id } = req.params;

    // Handle both JSON and FormData
    let updates: any = {};

    if (req.headers['content-type']?.includes('multipart/form-data')) {
      // Handle FormData (from file uploads)
      updates = {
        title: req.body.title,
        description: req.body.description,
        duration: req.body.duration,
        category: req.body.category,
        status: req.body.status
      };

      // Parse JSON strings for complex data
      if (req.body.presenters) {
        updates.presenters = JSON.parse(req.body.presenters);
      }
      if (req.body.guests) {
        updates.guests = JSON.parse(req.body.guests);
      }

      // Handle file uploads
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      if (files?.audioFile?.[0]) {
        updates.audioFile = files.audioFile[0].filename;
      }
      if (files?.imageFile?.[0]) {
        updates.imageFile = files.imageFile[0].filename;
      }
    } else {
      // Handle JSON
      updates = req.body;
    }

    // Remove undefined values
    Object.keys(updates).forEach(key => {
      if (updates[key] === undefined || updates[key] === '') {
        delete updates[key];
      }
    });

    const updatedEpisode = await Episode.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('createdBy', 'username');

    if (!updatedEpisode) {
      return res.status(404).json({ message: 'Episode not found' });
    }

    res.json({
      message: 'Episode updated successfully',
      episode: updatedEpisode
    });
  } catch (error: any) {
    console.error('Update episode error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete episode by ID
app.delete('/api/episodes/:id', async (req, res) => {
  try {
    const Episode = require('./models/Episode').default;
    const { id } = req.params;

    const episode = await Episode.findByIdAndDelete(id);

    if (!episode) {
      return res.status(404).json({ message: 'Episode not found' });
    }

    res.json({ message: 'Episode deleted successfully' });
  } catch (error: any) {
    console.error('Delete episode error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Increment play count
app.post('/api/episodes/:id/play', async (req, res) => {
  try {
    const Episode = require('./models/Episode').default;
    const { id } = req.params;

    const episode = await Episode.findByIdAndUpdate(
      id,
      { $inc: { plays: 1 } },
      { new: true }
    );

    if (!episode) {
      return res.status(404).json({ message: 'Episode not found' });
    }

    res.json({ message: 'Play count updated', plays: episode.plays });
  } catch (error: any) {
    console.error('Update play count error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get episode stats
app.get('/api/episodes/stats/overview', async (req, res) => {
  try {
    const Episode = require('./models/Episode').default;

    const totalEpisodes = await Episode.countDocuments();
    const publishedEpisodes = await Episode.countDocuments({ status: 'published' });
    const draftEpisodes = await Episode.countDocuments({ status: 'draft' });
    const totalPlays = await Episode.aggregate([
      { $group: { _id: null, total: { $sum: '$plays' } } }
    ]);

    res.json({
      totalEpisodes,
      publishedEpisodes,
      draftEpisodes,
      totalPlays: totalPlays[0]?.total || 0,
      categoryStats: []
    });
  } catch (error: any) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Analytics API Routes

// Start listening session
app.post('/api/analytics/session/start', async (req, res) => {
  try {
    const { episodeId, userId } = req.body;

    if (!episodeId) {
      return res.status(400).json({ message: 'Episode ID is required' });
    }

    const session = await AnalyticsService.startListeningSession(episodeId, req, userId);
    res.json({ sessionId: session._id });
  } catch (error: any) {
    console.error('Start session error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update listening session
app.put('/api/analytics/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { currentTime, skipCount, pauseCount, seekCount, ended } = req.body;

    const session = await AnalyticsService.updateListeningSession(sessionId, {
      currentTime,
      skipCount,
      pauseCount,
      seekCount,
      ended
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    res.json({ message: 'Session updated successfully' });
  } catch (error: any) {
    console.error('Update session error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get dashboard analytics
app.get('/api/analytics/dashboard', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const analytics = await AnalyticsService.getDashboardAnalytics(days);
    res.json(analytics);
  } catch (error: any) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get episode-specific analytics
app.get('/api/analytics/episode/:episodeId', async (req, res) => {
  try {
    const { episodeId } = req.params;
    const days = parseInt(req.query.days as string) || 30;

    const analytics = await AnalyticsService.getEpisodeAnalytics(episodeId, days);
    res.json(analytics);
  } catch (error: any) {
    console.error('Episode analytics error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get trending content
app.get('/api/analytics/trending', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const trending = await AnalyticsService.getTrendingContent(days);
    res.json(trending);
  } catch (error: any) {
    console.error('Trending content error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Track page view
app.post('/api/analytics/pageview', async (req, res) => {
  try {
    const { PageView } = require('./models/Analytics');
    const { path, userId, referrer, userAgent } = req.body;

    const pageView = new PageView({
      path,
      userId: userId || undefined,
      referrer,
      userAgent,
      ipAddress: req.ip || req.connection.remoteAddress,
      sessionId: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

    await pageView.save();
    res.json({ success: true });
  } catch (error: any) {
    console.error('Page view tracking error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});



// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: 'Server is running - UPDATED!'
  });
});

// Test login endpoint
app.post('/api/test-login', async (req, res) => {
  try {
    const User = require('./models/User').default;
    const user = await User.findOne({ email: 'admin@iconicfm.com' });

    if (!user) {
      return res.json({
        success: false,
        message: 'Admin user not found in database',
        dbConnected: true
      });
    }

    const isMatch = await user.comparePassword('admin123');
    res.json({
      success: true,
      message: 'Test login successful',
      userExists: true,
      passwordMatch: isMatch,
      dbConnected: true
    });
  } catch (error) {
    res.json({
      success: false,
      message: 'Database connection error',
      error: (error as any).message,
      dbConnected: false
    });
  }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler - only for unmatched routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Database connection with retry logic
const connectDB = async (retries = 5) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    if (retries > 0) {
      console.log(`🔄 Retrying connection... (${retries} attempts left)`);
      setTimeout(() => connectDB(retries - 1), 5000);
    } else {
      console.error('❌ Failed to connect to MongoDB after multiple attempts');
      process.exit(1);
    }
  }
};

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

// Start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 API available at http://localhost:${PORT}/api`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
});

export default app;
