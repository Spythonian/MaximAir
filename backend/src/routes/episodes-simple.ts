import express from 'express';
import Episode from '../models/Episode';

const router = express.Router();

// Get all published episodes (public)
router.get('/public', async (req, res) => {
  try {
    console.log('Public episodes route hit');
    
    const episodes = await Episode.find({ status: 'published' })
      .populate('createdBy', 'username')
      .sort({ publishedAt: -1 })
      .limit(20);
    
    console.log('Found episodes:', episodes.length);
    
    res.json({
      episodes,
      pagination: {
        current: 1,
        pages: 1,
        total: episodes.length
      }
    });
  } catch (error: any) {
    console.error('Get public episodes error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Simple test route
router.get('/test', (req, res) => {
  res.json({ message: 'Episodes router is working!' });
});

export default router;