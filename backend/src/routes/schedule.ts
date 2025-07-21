import express, { Request, Response } from 'express';
import { body, validationResult, query } from 'express-validator';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import Schedule from '../models/Schedule';
import User from '../models/User';

const router = express.Router();

// Get schedule (public)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { date, week, upcoming } = req.query;
    let query: any = {};
    
    if (date) {
      // Get schedule for specific date
      const targetDate = new Date(date as string);
      const dayOfWeek = targetDate.getDay();
      query.dayOfWeek = dayOfWeek;
    } else if (week) {
      // Get schedule for current week
      const today = new Date();
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
      const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
      query.startTime = { $gte: startOfWeek, $lte: endOfWeek };
    } else if (upcoming) {
      // Get upcoming shows
      query.startTime = { $gte: new Date() };
      query.status = { $in: ['scheduled', 'live'] };
    }

    const schedule = await Schedule.find(query)
      .populate('presenters.userId', 'username profile.firstName profile.lastName')
      .populate('createdBy', 'username')
      .sort({ dayOfWeek: 1, startTime: 1 })
      .limit(50);

    res.json({ schedule });
  } catch (error: any) {
    console.error('Get schedule error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current live shows
router.get('/live', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight

    const liveShows = await Schedule.find({
      $or: [
        { isLive: true },
        {
          dayOfWeek: currentDay,
          $expr: {
            $and: [
              { $lte: [{ $add: [{ $hour: '$startTime' }, { $multiply: [{ $minute: '$startTime' }, 1/60] }] }, currentTime/60] },
              { $gte: [{ $add: [{ $hour: '$endTime' }, { $multiply: [{ $minute: '$endTime' }, 1/60] }] }, currentTime/60] }
            ]
          }
        }
      ]
    })
      .populate('presenters.userId', 'username profile.firstName profile.lastName')
      .sort({ listeners: -1 });

    res.json({ liveShows });
  } catch (error: any) {
    console.error('Get live shows error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create schedule (admin/editor only)
router.post('/', authenticate, authorize('admin', 'editor'), [
  body('title').isLength({ min: 1, max: 200 }).trim(),
  body('description').optional().isLength({ max: 1000 }).trim(),
  body('startTime').isISO8601(),
  body('endTime').isISO8601(),
  body('dayOfWeek').isInt({ min: 0, max: 6 }),
  body('category').isIn(['Music', 'Talk', 'News', 'Sports', 'Entertainment', 'Education', 'Other']),
  body('presenters').isArray(),
  body('isRecurring').optional().isBoolean(),
  body('recordingEnabled').optional().isBoolean()
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      startTime,
      endTime,
      dayOfWeek,
      category,
      presenters,
      tags,
      isRecurring,
      recordingEnabled
    } = req.body;

    // Validate time range
    if (new Date(endTime) <= new Date(startTime)) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    // Check for scheduling conflicts
    const conflictingShows = await Schedule.find({
      dayOfWeek,
      isRecurring: true,
      $or: [
        {
          startTime: { $lt: new Date(endTime) },
          endTime: { $gt: new Date(startTime) }
        }
      ]
    });

    if (conflictingShows.length > 0) {
      return res.status(400).json({ 
        message: 'Time slot conflicts with existing show',
        conflicts: conflictingShows.map(show => ({
          title: show.title,
          startTime: show.startTime,
          endTime: show.endTime
        }))
      });
    }

    const schedule = new Schedule({
      title,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      dayOfWeek,
      category,
      presenters: presenters || [],
      tags: tags || [],
      isRecurring: isRecurring ?? true,
      recordingEnabled: recordingEnabled ?? true,
      createdBy: req.user!._id
    });

    await schedule.save();
    await schedule.populate('presenters.userId', 'username profile.firstName profile.lastName');

    res.status(201).json({
      message: 'Show scheduled successfully',
      schedule
    });
  } catch (error: any) {
    console.error('Create schedule error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update schedule
router.put('/:id', authenticate, authorize('admin', 'editor'), [
  body('title').optional().isLength({ min: 1, max: 200 }).trim(),
  body('description').optional().isLength({ max: 1000 }).trim(),
  body('startTime').optional().isISO8601(),
  body('endTime').optional().isISO8601(),
  body('status').optional().isIn(['scheduled', 'live', 'completed', 'cancelled'])
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updates = req.body;

    const schedule = await Schedule.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('presenters.userId', 'username profile.firstName profile.lastName');

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    res.json({
      message: 'Schedule updated successfully',
      schedule
    });
  } catch (error: any) {
    console.error('Update schedule error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete schedule
router.delete('/:id', authenticate, authorize('admin', 'editor'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const schedule = await Schedule.findByIdAndDelete(id);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    res.json({ message: 'Schedule deleted successfully' });
  } catch (error: any) {
    console.error('Delete schedule error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start live show
router.post('/:id/go-live', authenticate, authorize('admin', 'editor'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { streamUrl } = req.body;

    const schedule = await Schedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Update schedule to live status
    schedule.isLive = true;
    schedule.status = 'live';
    schedule.streamUrl = streamUrl;
    schedule.listeners = 0;
    await schedule.save();

    res.json({
      message: 'Show is now live',
      schedule
    });
  } catch (error: any) {
    console.error('Go live error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// End live show
router.post('/:id/end-live', authenticate, authorize('admin', 'editor'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { recordingUrl } = req.body;

    const schedule = await Schedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Update schedule to completed status
    schedule.isLive = false;
    schedule.status = 'completed';
    if (recordingUrl) {
      schedule.recordingUrl = recordingUrl;
    }
    await schedule.save();

    res.json({
      message: 'Show ended successfully',
      schedule
    });
  } catch (error: any) {
    console.error('End live error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update listener count
router.post('/:id/listeners', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { count } = req.body;

    const schedule = await Schedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    schedule.listeners = Math.max(0, count || 0);
    schedule.maxListeners = Math.max(schedule.maxListeners, schedule.listeners);
    await schedule.save();

    res.json({ listeners: schedule.listeners });
  } catch (error: any) {
    console.error('Update listeners error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start manual recording
router.post('/:id/start-recording', authenticate, authorize('admin', 'editor'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { streamId } = req.body;

    const { recordingService } = await import('../services/recordingService');
    const result = await recordingService.startManualRecording(id, streamId);

    res.json(result);
  } catch (error: any) {
    console.error('Start recording error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Stop manual recording
router.post('/:id/stop-recording', authenticate, authorize('admin', 'editor'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { recordingService } = await import('../services/recordingService');
    const result = await recordingService.stopManualRecording(id);

    res.json(result);
  } catch (error: any) {
    console.error('Stop recording error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Get recording status
router.get('/:id/recording-status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { recordingService } = await import('../services/recordingService');
    const status = recordingService.getRecordingStatus(id);

    res.json(status);
  } catch (error: any) {
    console.error('Get recording status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all active recordings
router.get('/recordings/active', authenticate, authorize('admin', 'editor'), async (req: AuthRequest, res: Response) => {
  try {
    const { recordingService } = await import('../services/recordingService');
    const activeRecordings = recordingService.getActiveRecordings();

    res.json({ recordings: activeRecordings });
  } catch (error: any) {
    console.error('Get active recordings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;