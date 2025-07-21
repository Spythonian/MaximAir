import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth';
import { 
  Favorite, 
  Comment, 
  Review, 
  Playlist, 
  CommentLike, 
  ReviewHelpful, 
  SocialShare 
} from '../models/Community';
import Episode from '../models/Episode';
import User from '../models/User';

const router = express.Router();

// FAVORITES ROUTES

// Add/Remove favorite
router.post('/favorites', authenticate, [
  body('itemType').isIn(['episode', 'presenter']),
  body('itemId').isMongoId()
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { itemType, itemId } = req.body;
    const userId = req.user!._id;

    // Check if already favorited
    const existingFavorite = await Favorite.findOne({ userId, itemType, itemId });

    if (existingFavorite) {
      // Remove favorite
      await Favorite.findByIdAndDelete(existingFavorite._id);
      res.json({ message: 'Removed from favorites', favorited: false });
    } else {
      // Add favorite
      const favorite = new Favorite({ userId, itemType, itemId });
      await favorite.save();
      res.json({ message: 'Added to favorites', favorited: true });
    }
  } catch (error: any) {
    console.error('Favorite error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's favorites
router.get('/favorites', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const { itemType } = req.query;

    const query: any = { userId };
    if (itemType) query.itemType = itemType;

    // Get favorites without populate first
    const favorites = await Favorite.find(query).sort({ createdAt: -1 });
    
    // Manually populate based on itemType
    const populatedFavorites = await Promise.all(
      favorites.map(async (favorite) => {
        try {
          let populatedItem = null;
          
          if (favorite.itemType === 'episode') {
            const Episode = require('../models/Episode').default;
            populatedItem = await Episode.findById(favorite.itemId)
              .select('title description category duration createdAt');
          } else if (favorite.itemType === 'presenter') {
            const User = require('../models/User').default;
            populatedItem = await User.findById(favorite.itemId)
              .select('username profile.firstName profile.lastName profile.bio');
          }
          
          return {
            ...favorite.toObject(),
            itemId: populatedItem || { _id: favorite.itemId, title: 'Item not found' }
          };
        } catch (populateError) {
          console.error('Error populating favorite:', populateError);
          return {
            ...favorite.toObject(),
            itemId: { _id: favorite.itemId, title: 'Item not found' }
          };
        }
      })
    );

    res.json({ favorites: populatedFavorites });
  } catch (error: any) {
    console.error('Get favorites error:', error);
    res.status(500).json({ message: 'Server error', favorites: [] });
  }
});

// Check if item is favorited
router.get('/favorites/check/:itemType/:itemId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { itemType, itemId } = req.params;
    const userId = req.user!._id;

    const favorite = await Favorite.findOne({ userId, itemType, itemId });
    res.json({ favorited: !!favorite });
  } catch (error: any) {
    console.error('Check favorite error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete specific favorite
router.delete('/favorites/:favoriteId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { favoriteId } = req.params;
    const userId = req.user!._id;

    const favorite = await Favorite.findOneAndDelete({ _id: favoriteId, userId });
    
    if (!favorite) {
      return res.status(404).json({ message: 'Favorite not found' });
    }

    // Update user stats
    await User.findByIdAndUpdate(userId, { $inc: { 'stats.favoritesCount': -1 } });

    res.json({ message: 'Favorite removed successfully' });
  } catch (error: any) {
    console.error('Delete favorite error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// COMMENTS ROUTES

// Add comment
router.post('/comments', authenticate, [
  body('episodeId').isMongoId(),
  body('content').isLength({ min: 1, max: 1000 }).trim(),
  body('parentId').optional().isMongoId()
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { episodeId, content, parentId } = req.body;
    const userId = req.user!._id;

    // Verify episode exists
    const episode = await Episode.findById(episodeId);
    if (!episode) {
      return res.status(404).json({ message: 'Episode not found' });
    }

    const comment = new Comment({
      userId,
      episodeId,
      content,
      parentId: parentId || undefined
    });

    await comment.save();
    await comment.populate('userId', 'username profile.firstName profile.lastName profile.avatar');

    // Update user stats
    await User.findByIdAndUpdate(userId, { $inc: { 'stats.commentsCount': 1 } });

    res.status(201).json({ message: 'Comment added successfully', comment });
  } catch (error: any) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get comments for episode
router.get('/comments/episode/:episodeId', async (req: Request, res: Response) => {
  try {
    const { episodeId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const comments = await Comment.find({ 
      episodeId, 
      isDeleted: false,
      parentId: { $exists: false } // Top-level comments only
    })
      .populate('userId', 'username profile.firstName profile.lastName profile.avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({ 
          parentId: comment._id, 
          isDeleted: false 
        })
          .populate('userId', 'username profile.firstName profile.lastName profile.avatar')
          .sort({ createdAt: 1 })
          .limit(10); // Limit replies per comment

        return {
          ...comment.toObject(),
          replies
        };
      })
    );

    const total = await Comment.countDocuments({ episodeId, isDeleted: false, parentId: { $exists: false } });

    res.json({
      comments: commentsWithReplies,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error: any) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like/Unlike comment
router.post('/comments/:commentId/like', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { commentId } = req.params;
    const userId = req.user!._id;

    const existingLike = await CommentLike.findOne({ userId, commentId });

    if (existingLike) {
      // Remove like
      await CommentLike.findByIdAndDelete(existingLike._id);
      await Comment.findByIdAndUpdate(commentId, { $inc: { likes: -1 } });
      res.json({ message: 'Like removed', liked: false });
    } else {
      // Add like
      const like = new CommentLike({ userId, commentId });
      await like.save();
      await Comment.findByIdAndUpdate(commentId, { $inc: { likes: 1 } });
      res.json({ message: 'Comment liked', liked: true });
    }
  } catch (error: any) {
    console.error('Like comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// REVIEWS ROUTES

// Add/Update review
router.post('/reviews', authenticate, [
  body('episodeId').isMongoId(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('title').optional().isLength({ max: 100 }).trim(),
  body('content').optional().isLength({ max: 2000 }).trim()
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { episodeId, rating, title, content } = req.body;
    const userId = req.user!._id;

    // Check if user already reviewed this episode
    const existingReview = await Review.findOne({ userId, episodeId });

    if (existingReview) {
      // Update existing review
      existingReview.rating = rating;
      existingReview.title = title;
      existingReview.content = content;
      existingReview.isRecommended = rating >= 4;
      await existingReview.save();

      res.json({ message: 'Review updated successfully', review: existingReview });
    } else {
      // Create new review
      const review = new Review({
        userId,
        episodeId,
        rating,
        title,
        content,
        isRecommended: rating >= 4
      });

      await review.save();
      await review.populate('userId', 'username profile.firstName profile.lastName profile.avatar');

      res.status(201).json({ message: 'Review added successfully', review });
    }
  } catch (error: any) {
    console.error('Add review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get reviews for episode
router.get('/reviews/episode/:episodeId', async (req: Request, res: Response) => {
  try {
    const { episodeId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ episodeId })
      .populate('userId', 'username profile.firstName profile.lastName profile.avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ episodeId });
    
    // Calculate average rating
    const ratingStats = await Review.aggregate([
      { $match: { episodeId: episodeId } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    const stats = ratingStats[0] || { averageRating: 0, totalReviews: 0, ratingDistribution: [] };

    res.json({
      reviews,
      stats: {
        averageRating: Math.round(stats.averageRating * 10) / 10,
        totalReviews: stats.totalReviews,
        ratingDistribution: stats.ratingDistribution
      },
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error: any) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark review as helpful
router.post('/reviews/:reviewId/helpful', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user!._id;

    const existingVote = await ReviewHelpful.findOne({ userId, reviewId });

    if (existingVote) {
      // Remove helpful vote
      await ReviewHelpful.findByIdAndDelete(existingVote._id);
      await Review.findByIdAndUpdate(reviewId, { $inc: { helpfulVotes: -1 } });
      res.json({ message: 'Helpful vote removed', helpful: false });
    } else {
      // Add helpful vote
      const vote = new ReviewHelpful({ userId, reviewId });
      await vote.save();
      await Review.findByIdAndUpdate(reviewId, { $inc: { helpfulVotes: 1 } });
      res.json({ message: 'Review marked as helpful', helpful: true });
    }
  } catch (error: any) {
    console.error('Mark helpful error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PLAYLISTS ROUTES

// Create playlist
router.post('/playlists', authenticate, [
  body('name').isLength({ min: 1, max: 100 }).trim(),
  body('description').optional().isLength({ max: 500 }).trim(),
  body('isPublic').optional().isBoolean()
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, isPublic = true } = req.body;
    const userId = req.user!._id;

    const playlist = new Playlist({
      userId,
      name,
      description,
      isPublic,
      episodes: [],
      followers: [],
      tags: []
    });

    await playlist.save();

    // Update user stats
    await User.findByIdAndUpdate(userId, { $inc: { 'stats.playlistsCount': 1 } });

    res.status(201).json({ message: 'Playlist created successfully', playlist });
  } catch (error: any) {
    console.error('Create playlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's playlists
router.get('/playlists', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id;

    const playlists = await Playlist.find({ userId })
      .populate('episodes.episodeId', 'title duration category')
      .sort({ createdAt: -1 });

    res.json({ playlists });
  } catch (error: any) {
    console.error('Get playlists error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add episode to playlist
router.post('/playlists/:playlistId/episodes', authenticate, [
  body('episodeId').isMongoId()
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { playlistId } = req.params;
    const { episodeId } = req.body;
    const userId = req.user!._id;

    const playlist = await Playlist.findOne({ _id: playlistId, userId });
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    // Check if episode already in playlist
    const existingEpisode = playlist.episodes.find(ep => ep.episodeId.toString() === episodeId);
    if (existingEpisode) {
      return res.status(400).json({ message: 'Episode already in playlist' });
    }

    // Add episode to playlist
    const order = playlist.episodes.length;
    playlist.episodes.push({
      episodeId,
      addedAt: new Date(),
      order
    });

    await playlist.save();

    res.json({ message: 'Episode added to playlist', playlist });
  } catch (error: any) {
    console.error('Add to playlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove episode from playlist
router.delete('/playlists/:playlistId/episodes/:episodeId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { playlistId, episodeId } = req.params;
    const userId = req.user!._id;

    const playlist = await Playlist.findOne({ _id: playlistId, userId });
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    // Remove episode from playlist
    playlist.episodes = playlist.episodes.filter(ep => ep.episodeId.toString() !== episodeId);
    await playlist.save();

    res.json({ message: 'Episode removed from playlist successfully' });
  } catch (error: any) {
    console.error('Remove from playlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete playlist
router.delete('/playlists/:playlistId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { playlistId } = req.params;
    const userId = req.user!._id;

    const playlist = await Playlist.findOneAndDelete({ _id: playlistId, userId });
    
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    // Update user stats
    await User.findByIdAndUpdate(userId, { $inc: { 'stats.playlistsCount': -1 } });

    res.json({ message: 'Playlist deleted successfully' });
  } catch (error: any) {
    console.error('Delete playlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// SOCIAL SHARING ROUTES

// Track social share
router.post('/share', [
  body('episodeId').isMongoId(),
  body('platform').isIn(['facebook', 'twitter', 'linkedin', 'whatsapp', 'email', 'copy'])
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { episodeId, platform } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const share = new SocialShare({
      episodeId,
      platform,
      ipAddress,
      userAgent
    });

    await share.save();

    res.json({ message: 'Share tracked successfully' });
  } catch (error: any) {
    console.error('Track share error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get share statistics
router.get('/share/stats/:episodeId', async (req: Request, res: Response) => {
  try {
    const { episodeId } = req.params;

    const shareStats = await SocialShare.aggregate([
      { $match: { episodeId: episodeId } },
      {
        $group: {
          _id: '$platform',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalShares = await SocialShare.countDocuments({ episodeId });

    res.json({
      totalShares,
      byPlatform: shareStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {} as Record<string, number>)
    });
  } catch (error: any) {
    console.error('Get share stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;