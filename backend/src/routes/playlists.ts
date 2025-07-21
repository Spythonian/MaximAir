import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth';
import Playlist, { IPlaylist } from '../models/Playlist';
import Episode from '../models/Episode';
import { Model } from 'mongoose';

const router = express.Router();
const PlaylistModel = Playlist as Model<IPlaylist>;

// Create a new playlist
router.post(
  '/',
  authenticate,
  [
    body('name').notEmpty().withMessage('Playlist name is required.'),
    body('description').optional().isString(),
    body('isPublic').optional().isBoolean(),
  ],
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      console.log('Creating playlist with body:', req.body);
      console.log('User from token:', req.user);
      const { name, description, isPublic } = req.body;
      const playlist = new PlaylistModel({
        name,
        description,
        isPublic,
        userId: req.user!._id,
      });
      await playlist.save();
      res.status(201).json(playlist);
    } catch (error) {
      console.error('Error creating playlist:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get all playlists for the current user
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const playlists = await PlaylistModel.find({ userId: req.user!._id }).populate('episodes');
    res.json(playlists);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single playlist by ID
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const playlist = await PlaylistModel.findOne({ _id: req.params.id, userId: req.user!._id }).populate('episodes');
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }
    res.json(playlist);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a playlist
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { name, description, isPublic } = req.body;
    const playlist = await PlaylistModel.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!._id },
      { name, description, isPublic },
      { new: true }
    );
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }
    res.json(playlist);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a playlist
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const playlist = await PlaylistModel.findOneAndDelete({ _id: req.params.id, userId: req.user!._id });
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }
    res.json({ message: 'Playlist deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add an episode to a playlist
router.post(
  '/:playlistId/episodes',
  authenticate,
  [body('episodeId').notEmpty().withMessage('Episode ID is required.')],
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { playlistId } = req.params;
      const { episodeId } = req.body;

      const playlist = await PlaylistModel.findOne({ _id: playlistId, userId: req.user!._id });
      if (!playlist) {
        return res.status(404).json({ message: 'Playlist not found' });
      }

      const episode = await Episode.findById(episodeId);
      if (!episode) {
        return res.status(404).json({ message: 'Episode not found' });
      }

      if (playlist.episodes.includes(episodeId)) {
        return res.status(400).json({ message: 'Episode already in playlist' });
      }

      playlist.episodes.push(episodeId);
      await playlist.save();
      res.json(playlist);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Remove an episode from a playlist
router.delete(
  '/:playlistId/episodes/:episodeId',
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      const { playlistId, episodeId } = req.params;

      const playlist = await PlaylistModel.findOne({ _id: playlistId, userId: req.user!._id });
      if (!playlist) {
        return res.status(404).json({ message: 'Playlist not found' });
      }

      playlist.episodes = playlist.episodes.filter(
        (id) => id.toString() !== episodeId
      );
      await playlist.save();
      res.json(playlist);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

export default router;
