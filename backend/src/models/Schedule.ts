import mongoose, { Document, Schema } from 'mongoose';

// Show Schedule Model
export interface ISchedule extends Document {
  title: string;
  description: string;
  presenters: Array<{
    userId: mongoose.Types.ObjectId;
    name: string;
    role?: string;
  }>;
  startTime: Date;
  endTime: Date;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  isRecurring: boolean;
  category: string;
  tags: string[];
  isLive: boolean;
  streamUrl?: string;
  recordingEnabled: boolean;
  recordingUrl?: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  listeners: number;
  maxListeners: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduleSchema = new Schema<ISchedule>({
  title: {
    type: String,
    required: [true, 'Show title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  presenters: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    role: {
      type: String,
      default: 'Host'
    }
  }],
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required']
  },
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0,
    max: 6
  },
  isRecurring: {
    type: Boolean,
    default: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Music', 'Talk', 'News', 'Sports', 'Entertainment', 'Education', 'Other']
  },
  tags: [String],
  isLive: {
    type: Boolean,
    default: false
  },
  streamUrl: {
    type: String,
    trim: true
  },
  recordingEnabled: {
    type: Boolean,
    default: true
  },
  recordingUrl: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  listeners: {
    type: Number,
    default: 0,
    min: 0
  },
  maxListeners: {
    type: Number,
    default: 0,
    min: 0
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
ScheduleSchema.index({ startTime: 1, endTime: 1 });
ScheduleSchema.index({ dayOfWeek: 1, startTime: 1 });
ScheduleSchema.index({ status: 1, startTime: 1 });
ScheduleSchema.index({ isLive: 1 });

export default mongoose.model<ISchedule>('Schedule', ScheduleSchema);