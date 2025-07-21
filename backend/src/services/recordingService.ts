import Schedule from '../models/Schedule';
import LiveStream from '../models/LiveStream';
import Episode from '../models/Episode';
import cron from 'node-cron';

interface RecordingJob {
  scheduleId: string;
  streamId?: string;
  startTime: Date;
  endTime: Date;
  title: string;
  description: string;
  category: string;
  presenters: Array<{
    userId: string;
    name: string;
    role: string;
  }>;
}

class RecordingService {
  private activeRecordings: Map<string, any> = new Map();
  private scheduledJobs: Map<string, cron.ScheduledTask> = new Map();

  constructor() {
    this.initializeScheduler();
  }

  // Initialize the recording scheduler
  private initializeScheduler() {
    // Check for recordings to start every minute
    cron.schedule('* * * * *', () => {
      this.checkForRecordingsToStart();
    });

    // Check for recordings to stop every minute
    cron.schedule('* * * * *', () => {
      this.checkForRecordingsToStop();
    });

    console.log('📹 Recording scheduler initialized');
  }

  // Check for shows that should start recording
  private async checkForRecordingsToStart() {
    try {
      const now = new Date();
      const in2Minutes = new Date(now.getTime() + 2 * 60 * 1000);

      // Find shows that should start recording soon
      const showsToRecord = await Schedule.find({
        recordingEnabled: true,
        status: 'scheduled',
        startTime: {
          $gte: now,
          $lte: in2Minutes
        }
      });

      for (const show of showsToRecord) {
        if (!this.activeRecordings.has(show._id.toString())) {
          await this.scheduleRecording(show);
        }
      }
    } catch (error) {
      console.error('Error checking for recordings to start:', error);
    }
  }

  // Check for recordings that should stop
  private async checkForRecordingsToStop() {
    try {
      const now = new Date();

      for (const [scheduleId, recording] of this.activeRecordings.entries()) {
        if (recording.endTime <= now) {
          await this.stopRecording(scheduleId);
        }
      }
    } catch (error) {
      console.error('Error checking for recordings to stop:', error);
    }
  }

  // Schedule a recording for a show
  private async scheduleRecording(schedule: any) {
    try {
      const recordingJob: RecordingJob = {
        scheduleId: schedule._id.toString(),
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        title: schedule.title,
        description: schedule.description,
        category: schedule.category,
        presenters: schedule.presenters || []
      };

      // In a real implementation, you would:
      // 1. Set up actual audio recording from the stream
      // 2. Use FFmpeg or similar to capture the audio
      // 3. Store the recording file

      // For demo purposes, we'll simulate the recording process
      console.log(`📹 Starting recording for: ${schedule.title}`);
      
      this.activeRecordings.set(schedule._id.toString(), {
        ...recordingJob,
        startedAt: new Date(),
        recordingPath: `/recordings/${schedule._id}_${Date.now()}.mp3`
      });

      // Update schedule status
      await Schedule.findByIdAndUpdate(schedule._id, {
        status: 'recording'
      });

    } catch (error) {
      console.error('Error scheduling recording:', error);
    }
  }

  // Stop a recording and create an episode
  private async stopRecording(scheduleId: string) {
    try {
      const recording = this.activeRecordings.get(scheduleId);
      if (!recording) return;

      console.log(`⏹️ Stopping recording for: ${recording.title}`);

      // In a real implementation, you would:
      // 1. Stop the audio recording process
      // 2. Process the audio file (normalize, compress, etc.)
      // 3. Generate metadata and thumbnails

      // Simulate recording completion
      const recordingUrl = `https://recordings.iconicfm.com/${scheduleId}.mp3`;
      const duration = this.calculateDuration(recording.startTime, recording.endTime);

      // Create an episode from the recording
      const episode = new Episode({
        title: `${recording.title} - Live Recording`,
        description: `Live recording of ${recording.title}. ${recording.description}`,
        duration: duration,
        category: recording.category,
        status: 'published',
        audioFile: recording.recordingPath,
        recordingUrl: recordingUrl,
        isRecording: true,
        recordedAt: recording.startedAt,
        presenters: recording.presenters,
        tags: ['live-recording', recording.category.toLowerCase()],
        createdBy: recording.presenters[0]?.userId || null
      });

      await episode.save();

      // Update schedule with recording info
      await Schedule.findByIdAndUpdate(scheduleId, {
        status: 'completed',
        recordingUrl: recordingUrl
      });

      // Clean up
      this.activeRecordings.delete(scheduleId);

      console.log(`✅ Recording completed and episode created: ${episode.title}`);

    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  }

  // Calculate duration in HH:MM:SS format
  private calculateDuration(startTime: Date, endTime: Date): string {
    const durationMs = endTime.getTime() - startTime.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  // Manually start recording for a show
  async startManualRecording(scheduleId: string, streamId?: string) {
    try {
      const schedule = await Schedule.findById(scheduleId);
      if (!schedule) {
        throw new Error('Schedule not found');
      }

      if (this.activeRecordings.has(scheduleId)) {
        throw new Error('Recording already in progress');
      }

      const recordingJob: RecordingJob = {
        scheduleId: scheduleId,
        streamId: streamId,
        startTime: new Date(),
        endTime: schedule.endTime,
        title: schedule.title,
        description: schedule.description,
        category: schedule.category,
        presenters: schedule.presenters || []
      };

      this.activeRecordings.set(scheduleId, {
        ...recordingJob,
        startedAt: new Date(),
        recordingPath: `/recordings/${scheduleId}_${Date.now()}.mp3`
      });

      await Schedule.findByIdAndUpdate(scheduleId, {
        status: 'recording'
      });

      console.log(`📹 Manual recording started for: ${schedule.title}`);
      return { success: true, message: 'Recording started successfully' };

    } catch (error) {
      console.error('Error starting manual recording:', error);
      throw error;
    }
  }

  // Manually stop recording
  async stopManualRecording(scheduleId: string) {
    try {
      if (!this.activeRecordings.has(scheduleId)) {
        throw new Error('No active recording found');
      }

      await this.stopRecording(scheduleId);
      return { success: true, message: 'Recording stopped successfully' };

    } catch (error) {
      console.error('Error stopping manual recording:', error);
      throw error;
    }
  }

  // Get active recordings
  getActiveRecordings() {
    return Array.from(this.activeRecordings.entries()).map(([id, recording]) => ({
      scheduleId: id,
      ...recording
    }));
  }

  // Get recording status for a schedule
  getRecordingStatus(scheduleId: string) {
    const recording = this.activeRecordings.get(scheduleId);
    if (!recording) {
      return { isRecording: false };
    }

    const now = new Date();
    const duration = Math.floor((now.getTime() - recording.startedAt.getTime()) / 1000);

    return {
      isRecording: true,
      startedAt: recording.startedAt,
      duration: duration,
      title: recording.title
    };
  }

  // Schedule recurring recordings
  async scheduleRecurringRecordings() {
    try {
      const recurringShows = await Schedule.find({
        isRecurring: true,
        recordingEnabled: true,
        status: { $ne: 'cancelled' }
      });

      for (const show of recurringShows) {
        const cronExpression = this.generateCronExpression(show.dayOfWeek, show.startTime);
        
        if (this.scheduledJobs.has(show._id.toString())) {
          // Update existing job
          this.scheduledJobs.get(show._id.toString())?.destroy();
        }

        const job = cron.schedule(cronExpression, async () => {
          await this.scheduleRecording(show);
        }, {
          scheduled: true,
          timezone: 'America/New_York' // Adjust timezone as needed
        });

        this.scheduledJobs.set(show._id.toString(), job);
        console.log(`📅 Scheduled recurring recording for: ${show.title}`);
      }

    } catch (error) {
      console.error('Error scheduling recurring recordings:', error);
    }
  }

  // Generate cron expression for recurring shows
  private generateCronExpression(dayOfWeek: number, startTime: Date): string {
    const hour = startTime.getHours();
    const minute = startTime.getMinutes();
    
    // Convert Sunday (0) to Sunday (7) for cron
    const cronDay = dayOfWeek === 0 ? 7 : dayOfWeek;
    
    return `${minute} ${hour} * * ${cronDay}`;
  }

  // Clean up resources
  destroy() {
    // Stop all scheduled jobs
    for (const job of this.scheduledJobs.values()) {
      job.destroy();
    }
    this.scheduledJobs.clear();

    // Stop all active recordings
    for (const scheduleId of this.activeRecordings.keys()) {
      this.stopRecording(scheduleId);
    }
    this.activeRecordings.clear();

    console.log('📹 Recording service destroyed');
  }
}

export const recordingService = new RecordingService();