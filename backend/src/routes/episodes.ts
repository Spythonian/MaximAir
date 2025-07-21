import express from 'express';
import { body, validationResult, query } from 'express-validator';
import Episode from '../models/Episode';
import * as mm from 'music-metadata';
import path from 'path';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { uploadEpisodeFiles } from '../middleware/upload';

const router = express.Router();

// Get all published episodes (public)
router.get('/public', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('category').optional().isString(),
  query('search').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const category = req.query.category as string;
    const search = req.query.search as string;

    // Build query
    const query: any = { status: 'published' };

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const episodes = await Episode.find(query)
      .populate('createdBy', 'username')
      .sort({ publishedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Episode.countDocuments(query);

    res.json({
      episodes,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error: any) {
    console.error('Get public episodes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all episodes (admin/editor only)
router.get('/', authenticate, authorize('admin', 'editor'), [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().isIn(['published', 'draft']),
  query('category').optional().isString()
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const category = req.query.category as string;

    // Build query
    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    // If user is editor, only show their episodes
    if (req.user!.role === 'editor') {
      query.createdBy = req.user!._id;
    }

    const episodes = await Episode.find(query)
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Episode.countDocuments(query);

    res.json({
      episodes,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error: any) {
    console.error('Get episodes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get episode statistics (admin only)
router.get('/stats/overview', authenticate, authorize('admin'), async (req: AuthRequest, res) => {
  try {
    const totalEpisodes = await Episode.countDocuments();
    const publishedEpisodes = await Episode.countDocuments({ status: 'published' });
    const draftEpisodes = await Episode.countDocuments({ status: 'draft' });
    const totalPlays = await Episode.aggregate([
      { $group: { _id: null, total: { $sum: '$plays' } } }
    ]);

    const categoryStats = await Episode.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      totalEpisodes,
      publishedEpisodes,
      draftEpisodes,
      totalPlays: totalPlays[0]?.total || 0,
      categoryStats
    });
  } catch (error: any) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single episode
router.get('/:id', async (req, res) => {
  try {
    const episode = await Episode.findById(req.params.id)
      .populate('createdBy', 'username');

    if (!episode) {
      return res.status(404).json({ message: 'Episode not found' });
    }

    // If episode is draft, only allow admin/editor/creator to view
    if (episode.status === 'draft') {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      if (!token) {
        return res.status(404).json({ message: 'Episode not found' });
      }
      // Add authentication check here if needed
    }

    res.json(episode);
  } catch (error: any) {
    console.error('Get episode error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create episode
router.post('/', authenticate, authorize('admin', 'editor'), uploadEpisodeFiles, [
  body('title').isLength({ min: 1, max: 200 }).trim().escape(),
  body('description').isLength({ min: 1, max: 1000 }).trim(),
  body('category').isIn(['Music', 'Technology', 'Interview', 'Community', 'News', 'Sports', 'Entertainment', 'Other']),
  body('status').optional().isIn(['published', 'draft']),
  body('tags').optional().isArray()
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, category, status, tags } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    let duration;

    if (files?.audioFile?.[0]) {
      const metadata = await mm.parseFile(path.join(__dirname, '../../uploads', files.audioFile[0].filename));
      duration = new Date(metadata.format.duration! * 1000).toISOString().substr(11, 8);
    }


    const newEpisode = new Episode({
      title,
      description,
      duration,
      category,
      status: status || 'draft',
      tags: tags || [],
      createdBy: req.user!._id,
      audioFile: files?.audioFile?.[0]?.filename,
      imageFile: files?.imageFile?.[0]?.filename,
      publishedAt: status === 'published' ? new Date() : undefined,
    });

    await newEpisode.save();
    await newEpisode.populate('createdBy', 'username');

    res.status(201).json({
      message: 'Episode created successfully',
      episode: newEpisode,
    });
  } catch (error: any) {
    console.error('Create episode error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update episode
router.put('/:id', authenticate, authorize('admin', 'editor'), uploadEpisodeFiles, [
  body('title').optional().isLength({ min: 1, max: 200 }).trim().escape(),
  body('description').optional().isLength({ min: 1, max: 1000 }).trim(),
  body('category').optional().isIn(['Music', 'Technology', 'Interview', 'Community', 'News', 'Sports', 'Entertainment', 'Other']),
  body('status').optional().isIn(['published', 'draft']),
  body('tags').optional().isArray()
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const episode = await Episode.findById(req.params.id);
    if (!episode) {
      return res.status(404).json({ message: 'Episode not found' });
    }

    // Check permissions
    if (req.user!.role === 'editor' && episode.createdBy.toString() !== req.user!._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const updates: any = { ...req.body };

    if (files?.audioFile?.[0]) {
      updates.audioFile = files.audioFile[0].filename;
      const metadata = await mm.parseFile(path.join(__dirname, '../../uploads', files.audioFile[0].filename));
      updates.duration = new Date(metadata.format.duration! * 1000).toISOString().substr(11, 8);
    }

    if (files?.imageFile?.[0]) {
      updates.imageFile = files.imageFile[0].filename;
    }

    const updatedEpisode = await Episode.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('createdBy', 'username');

    res.json({
      message: 'Episode updated successfully',
      episode: updatedEpisode
    });
  } catch (error: any) {
    console.error('Update episode error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete episode
router.delete('/:id', authenticate, authorize('admin', 'editor'), async (req: AuthRequest, res) => {
  try {
    const episode = await Episode.findById(req.params.id);
    if (!episode) {
      return res.status(404).json({ message: 'Episode not found' });
    }

    // Check permissions
    if (req.user!.role === 'editor' && episode.createdBy.toString() !== req.user!._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Episode.findByIdAndDelete(req.params.id);

    res.json({ message: 'Episode deleted successfully' });
  } catch (error: any) {
    console.error('Delete episode error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Increment play count
router.post('/:id/play', async (req, res) => {
  try {
    const episode = await Episode.findByIdAndUpdate(
      req.params.id,
      { $inc: { plays: 1 } },
      { new: true }
    );

    if (!episode) {
      return res.status(404).json({ message: 'Episode not found' });
    }

    res.json({ message: 'Play count updated', plays: episode.plays });
  } catch (error: any) {
    console.error('Update play count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
