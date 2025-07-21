import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';
import Notification from '../models/Notification';
import User from '../models/User';

const router = express.Router();

// Get notifications for current user
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const unreadOnly = req.query.unread === 'true';

    // Query for user-specific notifications or broadcast notifications
    const query: any = {
      $or: [
        { userId },
        { userId: 'all' }
      ]
    };

    if (unreadOnly) {
      query.isRead = false;
    }

    // Only show notifications that haven't expired or don't have an expiration
    query.$and = [
      {
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: null },
          { expiresAt: { $gt: new Date() } }
        ]
      }
    ];

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'username');

    const total = await Notification.countDocuments(query);

    res.json({
      notifications,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      },
      unreadCount: await Notification.countDocuments({
        $and: [
          {
            $or: [
              { userId },
              { userId: 'all' }
            ]
          },
          { isRead: false },
          {
            $or: [
              { expiresAt: { $exists: false } },
              { expiresAt: null },
              { expiresAt: { $gt: new Date() } }
            ]
          }
        ]
      })
    });
  } catch (error: any) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark notification as read
router.put('/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user!._id;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Check if this notification belongs to the user or is a broadcast
    if (notification.userId.toString() !== userId.toString() && notification.userId !== 'all') {
      return res.status(403).json({ message: 'Not authorized to update this notification' });
    }

    notification.isRead = true;
    await notification.save();

    res.json({ message: 'Notification marked as read', notification });
  } catch (error: any) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark all notifications as read
router.put('/read-all', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id;

    await Notification.updateMany(
      {
        $or: [
          { userId },
          { userId: 'all' }
        ],
        isRead: false
      },
      { isRead: true }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create notification (admin only)
router.post('/', authenticate, authorize('admin'), [
  body('title').isString().trim().isLength({ min: 1, max: 100 }),
  body('message').isString().trim().isLength({ min: 1, max: 500 }),
  body('type').isIn(['info', 'success', 'warning', 'error', 'system']),
  body('link').optional().isURL(),
  body('recipients').isIn(['all', 'specific']),
  body('userIds').optional().isArray(),
  body('expiresAt').optional().isISO8601()
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, message, type, link, recipients, userIds, expiresAt } = req.body;
    const adminId = req.user!._id;

    if (recipients === 'specific' && (!userIds || userIds.length === 0)) {
      return res.status(400).json({ message: 'User IDs are required for specific recipients' });
    }

    // For broadcast notifications
    if (recipients === 'all') {
      const notification = new Notification({
        userId: 'all',
        title,
        message,
        type,
        link,
        createdBy: adminId,
        expiresAt: expiresAt || undefined
      });

      await notification.save();
      return res.status(201).json({
        message: 'Broadcast notification created successfully',
        notification
      });
    }

    // For specific users
    const notifications = [];
    for (const userId of userIds) {
      // Verify user exists
      const userExists = await User.exists({ _id: userId });
      if (!userExists) continue;

      const notification = new Notification({
        userId,
        title,
        message,
        type,
        link,
        createdBy: adminId,
        expiresAt: expiresAt || undefined
      });

      notifications.push(notification);
    }

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.status(201).json({
      message: `Notifications sent to ${notifications.length} users`,
      count: notifications.length
    });
  } catch (error: any) {
    console.error('Create notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all notifications (admin only)
router.get('/admin/all', authenticate, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const type = req.query.type as string;
    const recipient = req.query.recipient as string;

    const query: any = {};
    if (type) query.type = type;
    if (recipient === 'broadcast') query.userId = 'all';
    else if (recipient === 'specific') query.userId = { $ne: 'all' };

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'username')
      .populate('userId', 'username email');

    const total = await Notification.countDocuments(query);

    res.json({
      notifications,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error: any) {
    console.error('Get all notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete notification (admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const notificationId = req.params.id;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await notification.deleteOne();

    res.json({ message: 'Notification deleted successfully' });
  } catch (error: any) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;