import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth';
import LiveChat from '../models/LiveChat';
import LiveStream from '../models/LiveStream';
import Schedule from '../models/Schedule';

const router = express.Router();

// Get chat messages for a stream
router.get('/stream/:streamId', async (req: Request, res: Response) => {
  try {
    const { streamId } = req.params;
    const { limit = '50', before } = req.query;

    let query: any = { streamId };
    if (before) {
      query.createdAt = { $lt: new Date(before as string) };
    }

    const messages = await LiveChat.find(query)
      .populate('userId', 'username profile.firstName profile.lastName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string));

    // Reverse to get chronological order
    messages.reverse();

    res.json({ messages });
  } catch (error: any) {
    console.error('Get chat messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get chat messages for a scheduled show
router.get('/schedule/:scheduleId', async (req: Request, res: Response) => {
  try {
    const { scheduleId } = req.params;
    const { limit = '50', before } = req.query;

    let query: any = { scheduleId };
    if (before) {
      query.createdAt = { $lt: new Date(before as string) };
    }

    const messages = await LiveChat.find(query)
      .populate('userId', 'username profile.firstName profile.lastName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string));

    // Reverse to get chronological order
    messages.reverse();

    res.json({ messages });
  } catch (error: any) {
    console.error('Get chat messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a chat message
router.post('/message', authenticate, [
  body('message').isLength({ min: 1, max: 500 }).trim(),
  body('streamId').optional().isMongoId(),
  body('scheduleId').optional().isMongoId()
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { message, streamId, scheduleId } = req.body;

    // Must have either streamId or scheduleId
    if (!streamId && !scheduleId) {
      return res.status(400).json({ message: 'Either streamId or scheduleId is required' });
    }

    // Verify stream or schedule exists and is active
    if (streamId) {
      const stream = await LiveStream.findById(streamId);
      if (!stream || !stream.isActive) {
        return res.status(404).json({ message: 'Active stream not found' });
      }
    }

    if (scheduleId) {
      const schedule = await Schedule.findById(scheduleId);
      if (!schedule || !schedule.isLive) {
        return res.status(404).json({ message: 'Live show not found' });
      }
    }

    const chatMessage = new LiveChat({
      message,
      userId: req.user!._id,
      streamId,
      scheduleId,
      username: req.user!.username
    });

    await chatMessage.save();
    await chatMessage.populate('userId', 'username profile.firstName profile.lastName');

    res.status(201).json({
      message: 'Message sent successfully',
      chatMessage
    });
  } catch (error: any) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a chat message (admin/moderator only)
router.delete('/message/:messageId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.params;

    const message = await LiveChat.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only allow deletion by message author, admin, or editor
    if (message.userId.toString() !== req.user!._id.toString() && 
        req.user!.role !== 'admin' && 
        req.user!.role !== 'editor') {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    await LiveChat.findByIdAndDelete(messageId);

    res.json({ message: 'Message deleted successfully' });
  } catch (error: any) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Moderate chat (admin/editor only) - ban user from chat
router.post('/moderate/ban', authenticate, [
  body('userId').isMongoId(),
  body('streamId').optional().isMongoId(),
  body('scheduleId').optional().isMongoId(),
  body('reason').optional().isLength({ max: 200 }).trim(),
  body('duration').optional().isInt({ min: 1, max: 1440 }) // Max 24 hours in minutes
], async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is admin or editor
    if (req.user!.role !== 'admin' && req.user!.role !== 'editor') {
      return res.status(403).json({ message: 'Not authorized to moderate chat' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, streamId, scheduleId, reason, duration = 60 } = req.body;

    // Create ban record
    const banMessage = new LiveChat({
      message: `User has been temporarily banned from chat. Reason: ${reason || 'Violation of chat rules'}`,
      userId: req.user!._id,
      streamId,
      scheduleId,
      username: 'System',
      messageType: 'system',
      metadata: {
        action: 'user_banned',
        bannedUserId: userId,
        reason,
        duration,
        moderatorId: req.user!._id
      }
    });

    await banMessage.save();

    res.json({
      message: 'User banned from chat successfully',
      duration: `${duration} minutes`
    });
  } catch (error: any) {
    console.error('Ban user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Clear chat messages (admin/editor only)
router.delete('/clear', authenticate, [
  body('streamId').optional().isMongoId(),
  body('scheduleId').optional().isMongoId()
], async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is admin or editor
    if (req.user!.role !== 'admin' && req.user!.role !== 'editor') {
      return res.status(403).json({ message: 'Not authorized to clear chat' });
    }

    const { streamId, scheduleId } = req.body;

    let query: any = {};
    if (streamId) query.streamId = streamId;
    if (scheduleId) query.scheduleId = scheduleId;

    if (!streamId && !scheduleId) {
      return res.status(400).json({ message: 'Either streamId or scheduleId is required' });
    }

    const deletedCount = await LiveChat.deleteMany(query);

    // Add system message about chat being cleared
    const systemMessage = new LiveChat({
      message: 'Chat has been cleared by a moderator',
      userId: req.user!._id,
      streamId,
      scheduleId,
      username: 'System',
      messageType: 'system',
      metadata: {
        action: 'chat_cleared',
        moderatorId: req.user!._id,
        deletedCount: deletedCount.deletedCount
      }
    });

    await systemMessage.save();

    res.json({
      message: 'Chat cleared successfully',
      deletedCount: deletedCount.deletedCount
    });
  } catch (error: any) {
    console.error('Clear chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get chat statistics
router.get('/stats/:streamId', async (req: Request, res: Response) => {
  try {
    const { streamId } = req.params;

    const totalMessages = await LiveChat.countDocuments({ streamId });
    const uniqueUsers = await LiveChat.distinct('userId', { streamId });
    const recentMessages = await LiveChat.countDocuments({
      streamId,
      createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Last 5 minutes
    });

    res.json({
      totalMessages,
      uniqueUsers: uniqueUsers.length,
      recentMessages,
      chatActivity: recentMessages > 0 ? 'active' : 'quiet'
    });
  } catch (error: any) {
    console.error('Get chat stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get active chat rooms
router.get('/rooms/active', async (req: Request, res: Response) => {
  try {
    // Get active streams with recent chat activity
    const activeStreams = await LiveStream.find({ isActive: true });
    const activeSchedules = await Schedule.find({ isLive: true });

    const rooms = [];

    // Add stream-based chat rooms
    for (const stream of activeStreams) {
      const messageCount = await LiveChat.countDocuments({ streamId: stream._id });
      const recentActivity = await LiveChat.countDocuments({
        streamId: stream._id,
        createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) } // Last 10 minutes
      });

      rooms.push({
        id: stream._id,
        type: 'stream',
        title: stream.title,
        description: stream.description,
        messageCount,
        recentActivity,
        isActive: true
      });
    }

    // Add schedule-based chat rooms
    for (const schedule of activeSchedules) {
      const messageCount = await LiveChat.countDocuments({ scheduleId: schedule._id });
      const recentActivity = await LiveChat.countDocuments({
        scheduleId: schedule._id,
        createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) } // Last 10 minutes
      });

      rooms.push({
        id: schedule._id,
        type: 'schedule',
        title: schedule.title,
        description: schedule.description,
        messageCount,
        recentActivity,
        isActive: true
      });
    }

    res.json({ rooms });
  } catch (error: any) {
    console.error('Get active rooms error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;