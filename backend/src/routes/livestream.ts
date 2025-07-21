import express from 'express';
import StreamingService from '../services/streamingService';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = express.Router();

// NGINX RTMP authentication endpoint
router.post('/auth', async (req, res) => {
  try {
    const { name: streamKey } = req.body;

    if (!streamKey) {
      return res.status(400).json({ error: 'Stream key required' });
    }

    const isValid = await StreamingService.authenticateStream(streamKey);

    if (isValid) {
      res.status(200).send('OK');
    } else {
      res.status(403).send('Forbidden');
    }
  } catch (error) {
    console.error('Stream auth error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// NGINX RTMP stream start callback
router.post('/start', async (req, res) => {
  try {
    const { name: streamKey } = req.body;

    if (!streamKey) {
      return res.status(400).json({ error: 'Stream key required' });
    }

    const stream = await StreamingService.startStream(streamKey);

    if (stream) {
      res.status(200).json({ message: 'Stream started', stream });
    } else {
      res.status(404).json({ error: 'Stream not found' });
    }
  } catch (error) {
    console.error('Stream start error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// NGINX RTMP stream end callback
router.post('/end', async (req, res) => {
  try {
    const { name: streamKey } = req.body;

    if (!streamKey) {
      return res.status(400).json({ error: 'Stream key required' });
    }

    const stream = await StreamingService.endStream(streamKey);

    if (stream) {
      res.status(200).json({ message: 'Stream ended', stream });
    } else {
      res.status(404).json({ error: 'Stream not found' });
    }
  } catch (error) {
    console.error('Stream end error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new stream (authenticated)
router.post('/create', authenticate, async (req: AuthRequest, res) => {
  try {
    const { title, description, quality, recordingEnabled } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Stream title is required' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const stream = await StreamingService.createStream({
      title,
      description,
      quality,
      recordingEnabled,
      createdBy: req.user._id.toString()
    });

    res.status(201).json({
      message: 'Stream created successfully',
      stream: {
        id: stream._id,
        title: stream.title,
        description: stream.description,
        streamKey: stream.streamKey,
        streamUrl: stream.streamUrl,
        playbackUrl: stream.playbackUrl,
        quality: stream.quality,
        recordingEnabled: stream.recordingEnabled,
        status: stream.status
      }
    });
  } catch (error) {
    console.error('Create stream error:', error);
    res.status(500).json({ error: 'Failed to create stream' });
  }
});

// Get user's streams
router.get('/my-streams', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const limit = parseInt(req.query.limit as string) || 10;
    const streams = await StreamingService.getUserStreams(req.user._id.toString(), limit);

    res.json({
      streams: streams.map(stream => ({
        id: stream._id,
        title: stream.title,
        description: stream.description,
        streamKey: stream.streamKey,
        playbackUrl: stream.playbackUrl,
        isActive: stream.isActive,
        status: stream.status,
        currentListeners: stream.currentListeners,
        peakListeners: stream.peakListeners,
        duration: stream.duration,
        startedAt: stream.startedAt,
        endedAt: stream.endedAt,
        createdAt: stream.createdAt
      }))
    });
  } catch (error) {
    console.error('Get user streams error:', error);
    res.status(500).json({ error: 'Failed to get streams' });
  }
});

// Get active streams (public)
router.get('/active', async (req, res) => {
  try {
    const streams = await StreamingService.getActiveStreams();

    res.json({
      streams: streams.map(stream => ({
        id: stream._id,
        title: stream.title,
        description: stream.description,
        playbackUrl: stream.playbackUrl,
        currentListeners: stream.currentListeners,
        startedAt: stream.startedAt,
        quality: stream.quality,
        metadata: stream.metadata
      }))
    });
  } catch (error) {
    console.error('Get active streams error:', error);
    res.status(500).json({ error: 'Failed to get active streams' });
  }
});

// Get stream details
router.get('/:streamKey', async (req, res) => {
  try {
    const { streamKey } = req.params;
    const stream = await StreamingService.getStreamByKey(streamKey);

    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    res.json({
      stream: {
        id: stream._id,
        title: stream.title,
        description: stream.description,
        playbackUrl: stream.playbackUrl,
        isActive: stream.isActive,
        status: stream.status,
        currentListeners: stream.currentListeners,
        peakListeners: stream.peakListeners,
        totalListeners: stream.totalListeners,
        duration: stream.duration,
        startedAt: stream.startedAt,
        endedAt: stream.endedAt,
        quality: stream.quality,
        metadata: stream.metadata,
        createdAt: stream.createdAt
      }
    });
  } catch (error) {
    console.error('Get stream error:', error);
    res.status(500).json({ error: 'Failed to get stream' });
  }
});

// Update stream metadata (authenticated)
router.put('/:streamKey/metadata', authenticate, async (req: AuthRequest, res) => {
  try {
    const { streamKey } = req.params;
    const { currentTrack, artist, album, genre } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Verify stream ownership
    const stream = await StreamingService.getStreamByKey(streamKey);
    if (!stream || stream.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedStream = await StreamingService.updateMetadata(streamKey, {
      currentTrack,
      artist,
      album,
      genre
    });

    if (!updatedStream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    res.json({
      message: 'Metadata updated successfully',
      metadata: updatedStream.metadata
    });
  } catch (error) {
    console.error('Update metadata error:', error);
    res.status(500).json({ error: 'Failed to update metadata' });
  }
});

// Get stream statistics
router.get('/:streamKey/stats', async (req, res) => {
  try {
    const { streamKey } = req.params;
    const stats = await StreamingService.getStreamStats(streamKey);

    if (!stats) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    res.json({ stats });
  } catch (error) {
    console.error('Get stream stats error:', error);
    res.status(500).json({ error: 'Failed to get stream statistics' });
  }
});

// Delete stream (authenticated)
router.delete('/:streamKey', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const { streamKey } = req.params;
    const success = await StreamingService.deleteStream(streamKey, req.user._id.toString());

    if (success) {
      res.json({ message: 'Stream deleted successfully' });
    } else {
      res.status(404).json({ error: 'Stream not found or access denied' });
    }
  } catch (error) {
    console.error('Delete stream error:', error);
    res.status(500).json({ error: 'Failed to delete stream' });
  }
});

// Update listener count (internal use by NGINX)
router.post('/:streamKey/listeners', async (req, res) => {
  try {
    const { streamKey } = req.params;
    const { count } = req.body;

    if (typeof count !== 'number') {
      return res.status(400).json({ error: 'Invalid listener count' });
    }

    await StreamingService.updateListenerCount(streamKey, count);
    res.status(200).json({ message: 'Listener count updated' });
  } catch (error) {
    console.error('Update listener count error:', error);
    res.status(500).json({ error: 'Failed to update listener count' });
  }
});

export default router;
