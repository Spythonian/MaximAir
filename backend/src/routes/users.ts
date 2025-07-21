import express from 'express';
import { body, validationResult, query } from 'express-validator';
import User from '../models/User';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticate, authorize('admin'), [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('role').optional().isIn(['admin', 'editor', 'user']),
  query('search').optional().isString()
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const role = req.query.role as string;
    const search = req.query.search as string;

    // Build query
    const query: any = {};
    
    if (role) {
      query.role = role;
    }
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error: any) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single user (admin only)
router.get('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user (admin only)
router.put('/:id', authenticate, authorize('admin'), [
  body('username').optional().isLength({ min: 3, max: 30 }).trim().escape(),
  body('email').optional().isEmail().normalizeEmail(),
  body('role').optional().isIn(['admin', 'editor', 'user']),
  body('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, role, isActive } = req.body;

    // Check if username or email already exists (excluding current user)
    if (username || email) {
      const existingUser = await User.findOne({
        _id: { $ne: req.params.id },
        $or: [
          ...(username ? [{ username }] : []),
          ...(email ? [{ email }] : [])
        ]
      });

      if (existingUser) {
        return res.status(400).json({ 
          message: 'Username or email already exists' 
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { username, email, role, isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error: any) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle user status (admin only)
router.put('/:id/toggle-status', authenticate, authorize('admin'), async (req: AuthRequest, res) => {
  try {
    // Prevent admin from deactivating themselves
    if (req.params.id === req.user!._id.toString()) {
      return res.status(400).json({ message: 'Cannot deactivate your own account' });
    }

    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json(user);
  } catch (error: any) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req: AuthRequest, res) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user!._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get own profile
router.get('/profile', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Ensure all required fields exist with defaults
    const profileData = {
      ...user.toObject(),
      profile: {
        firstName: user.profile?.firstName || '',
        lastName: user.profile?.lastName || '',
        bio: user.profile?.bio || '',
        avatar: user.profile?.avatar || '',
        location: user.profile?.location || '',
        website: user.profile?.website || '',
        ...user.profile
      },
      preferences: {
        favoriteCategories: user.preferences?.favoriteCategories || [],
        emailNotifications: user.preferences?.emailNotifications ?? true,
        publicProfile: user.preferences?.publicProfile ?? true,
        ...user.preferences
      },
      stats: {
        totalListeningTime: user.stats?.totalListeningTime || 0,
        episodesListened: user.stats?.episodesListened || 0,
        commentsCount: user.stats?.commentsCount || 0,
        playlistsCount: user.stats?.playlistsCount || 0,
        favoritesCount: user.stats?.favoritesCount || 0,
        averageSessionDuration: user.stats?.averageSessionDuration || 0,
        lastActiveAt: user.stats?.lastActiveAt || new Date(),
        ...user.stats
      }
    };

    res.json(profileData);
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update own profile
router.put('/profile', authenticate, [
  body('profile.firstName').optional().isLength({ max: 50 }).trim(),
  body('profile.lastName').optional().isLength({ max: 50 }).trim(),
  body('profile.bio').optional().isLength({ max: 500 }).trim(),
  body('profile.location').optional().isLength({ max: 100 }).trim(),
  body('profile.website').optional().isURL(),
  body('preferences.favoriteCategories').optional().isArray(),
  body('preferences.emailNotifications').optional().isBoolean(),
  body('preferences.publicProfile').optional().isBoolean()
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { profile, preferences } = req.body;
    const userId = req.user!._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update profile fields
    if (profile) {
      if (profile.firstName !== undefined) user.profile.firstName = profile.firstName;
      if (profile.lastName !== undefined) user.profile.lastName = profile.lastName;
      if (profile.bio !== undefined) user.profile.bio = profile.bio;
      if (profile.location !== undefined) user.profile.location = profile.location;
      if (profile.website !== undefined) user.profile.website = profile.website;
    }

    // Update preferences
    if (preferences) {
      if (preferences.favoriteCategories !== undefined) {
        user.preferences.favoriteCategories = preferences.favoriteCategories;
      }
      if (preferences.emailNotifications !== undefined) {
        user.preferences.emailNotifications = preferences.emailNotifications;
      }
      if (preferences.publicProfile !== undefined) {
        user.preferences.publicProfile = preferences.publicProfile;
      }
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: await User.findById(userId).select('-password')
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update account settings (username, email, password)
router.put('/profile/account', authenticate, [
  body('username').optional().isLength({ min: 3, max: 30 }).trim().escape(),
  body('email').optional().isEmail().normalizeEmail(),
  body('currentPassword').optional().isLength({ min: 6 }),
  body('newPassword').optional().isLength({ min: 6 })
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, currentPassword, newPassword } = req.body;
    const userId = req.user!._id;

    // Check if username or email already exists
    if (username || email) {
      const existingUser = await User.findOne({
        _id: { $ne: userId },
        $or: [
          ...(username ? [{ username }] : []),
          ...(email ? [{ email }] : [])
        ]
      });

      if (existingUser) {
        return res.status(400).json({ 
          message: 'Username or email already exists' 
        });
      }
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required' });
      }

      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      user.password = newPassword;
    }

    // Update other fields
    if (username) user.username = username;
    if (email) user.email = email;

    await user.save();

    res.json({
      message: 'Account updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error: any) {
    console.error('Update account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user activity/statistics (admin only)
router.get('/:id/activity', authenticate, authorize('admin'), async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Import models dynamically to avoid circular dependencies
    const { ListeningSession } = require('../models/Analytics');
    const { Comment, Review, Playlist, Favorite } = require('../models/Community');
    
    // Get user's listening sessions
    const listeningSessions = await ListeningSession.find({ userId })
      .populate('episodeId', 'title category')
      .sort({ startTime: -1 })
      .limit(20);

    // Get user's comments
    const comments = await Comment.find({ userId, isDeleted: false })
      .populate('episodeId', 'title')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get user's reviews
    const reviews = await Review.find({ userId })
      .populate('episodeId', 'title')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get user's playlists
    const playlists = await Playlist.find({ userId })
      .populate('episodes.episodeId', 'title')
      .sort({ createdAt: -1 });

    // Get user's favorites
    const favorites = await Favorite.find({ userId })
      .populate('itemId')
      .sort({ createdAt: -1 })
      .limit(20);

    // Calculate activity statistics
    const totalListeningTime = listeningSessions.reduce((sum, session) => sum + session.duration, 0);
    const averageSessionDuration = listeningSessions.length > 0 ? totalListeningTime / listeningSessions.length : 0;
    const totalSessions = listeningSessions.length;

    // Get listening activity by day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const dailyActivity = await ListeningSession.aggregate([
      { 
        $match: { 
          userId: userId,
          startTime: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$startTime' },
            month: { $month: '$startTime' },
            day: { $dayOfMonth: '$startTime' }
          },
          sessions: { $sum: 1 },
          totalDuration: { $sum: '$duration' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    res.json({
      user: await require('../models/User').default.findById(userId).select('-password'),
      activity: {
        listeningSessions: listeningSessions.slice(0, 10), // Latest 10 sessions
        comments: comments.slice(0, 5), // Latest 5 comments
        reviews: reviews.slice(0, 5), // Latest 5 reviews
        playlists,
        favorites: favorites.slice(0, 10), // Latest 10 favorites
      },
      statistics: {
        totalListeningTime: Math.round(totalListeningTime),
        averageSessionDuration: Math.round(averageSessionDuration),
        totalSessions,
        totalComments: comments.length,
        totalReviews: reviews.length,
        totalPlaylists: playlists.length,
        totalFavorites: favorites.length,
        dailyActivity
      }
    });
  } catch (error: any) {
    console.error('Get user activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user overview statistics (admin only)
router.get('/stats/overview', authenticate, authorize('admin'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const editorUsers = await User.countDocuments({ role: 'editor' });
    const regularUsers = await User.countDocuments({ role: 'user' });

    // Get new users in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsers = await User.countDocuments({ 
      createdAt: { $gte: thirtyDaysAgo } 
    });

    // Get user registration trends (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    
    const registrationTrends = await User.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get most active users (by listening time)
    const { ListeningSession } = require('../models/Analytics');
    const mostActiveUsers = await ListeningSession.aggregate([
      {
        $group: {
          _id: '$userId',
          totalListeningTime: { $sum: '$duration' },
          totalSessions: { $sum: 1 }
        }
      },
      { $sort: { totalListeningTime: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          username: '$user.username',
          email: '$user.email',
          totalListeningTime: 1,
          totalSessions: 1
        }
      }
    ]);

    res.json({
      overview: {
        totalUsers,
        activeUsers,
        newUsers,
        usersByRole: {
          admin: adminUsers,
          editor: editorUsers,
          user: regularUsers
        }
      },
      trends: {
        registrationTrends: registrationTrends.map(trend => ({
          month: `${trend._id.year}-${trend._id.month.toString().padStart(2, '0')}`,
          count: trend.count
        }))
      },
      mostActiveUsers
    });
  } catch (error: any) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk user actions (admin only)
router.post('/bulk-action', authenticate, authorize('admin'), [
  body('action').isIn(['activate', 'deactivate', 'delete', 'change-role']),
  body('userIds').isArray().notEmpty(),
  body('role').optional().isIn(['admin', 'editor', 'user'])
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { action, userIds, role } = req.body;
    const currentUserId = req.user!._id.toString();

    // Prevent admin from performing bulk actions on themselves
    if (userIds.includes(currentUserId)) {
      return res.status(400).json({ message: 'Cannot perform bulk actions on your own account' });
    }

    let updateQuery: any = {};
    let message = '';

    switch (action) {
      case 'activate':
        updateQuery = { isActive: true };
        message = 'Users activated successfully';
        break;
      case 'deactivate':
        updateQuery = { isActive: false };
        message = 'Users deactivated successfully';
        break;
      case 'change-role':
        if (!role) {
          return res.status(400).json({ message: 'Role is required for role change action' });
        }
        updateQuery = { role };
        message = `Users role changed to ${role} successfully`;
        break;
      case 'delete':
        await User.deleteMany({ _id: { $in: userIds } });
        return res.json({ message: 'Users deleted successfully' });
    }

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      updateQuery
    );

    res.json({
      message,
      modifiedCount: result.modifiedCount
    });
  } catch (error: any) {
    console.error('Bulk action error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;