import mongoose, { Document, Schema } from 'mongoose';

// Live Stream Model
export interface ILiveStream extends Document {
  scheduleId?: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  streamKey: string;
  streamUrl: string;
  playbackUrl: string;
  isActive: boolean;
  startedAt?: Date;
  endedAt?: Date;
  currentListeners: number;
  peakListeners: number;
  totalListeners: number;
  duration: number; // in seconds
  recordingEnabled: boolean;
  recordingUrl?: string;
  recordingSize?: number; // in bytes
  quality: 'low' | 'medium' | 'high' | 'ultra';
  bitrate: number;
  status: 'preparing' | 'live' | 'ended' | 'error';
  metadata: {
    currentTrack?: string;
    artist?: string;
    album?: string;
    genre?: string;
  };
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LiveStreamSchema = new Schema<ILiveStream>({
  scheduleId: {
    type: Schema.Types.ObjectId,
    ref: 'Schedule'
  },
  title: {
    type: String,
    required: [true, 'Stream title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  streamKey: {
    type: String,
    required: true,
    unique: true
  },
  streamUrl: {
    type: String,
    required: true
  },
  playbackUrl: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  startedAt: {
    type: Date
  },
  endedAt: {
    type: Date
  },
  currentListeners: {
    type: Number,
    default: 0,
    min: 0
  },
  peakListeners: {
    type: Number,
    default: 0,
    min: 0
  },
  totalListeners: {
    type: Number,
    default: 0,
    min: 0
  },
  duration: {
    type: Number,
    default: 0,
    min: 0
  },
  recordingEnabled: {
    type: Boolean,
    default: true
  },
  recordingUrl: {
    type: String
  },
  recordingSize: {
    type: Number,
    default: 0
  },
  quality: {
    type: String,
    enum: ['low', 'medium', 'high', 'ultra'],
    default: 'medium'
  },
  bitrate: {
    type: Number,
    default: 128000 // 128 kbps
  },
  status: {
    type: String,
    enum: ['preparing', 'live', 'ended', 'error'],
    default: 'preparing'
  },
  metadata: {
    currentTrack: String,
    artist: String,
    album: String,
    genre: String
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
LiveStreamSchema.index({ isActive: 1, createdAt: -1 });
LiveStreamSchema.index({ status: 1, startedAt: -1 });
// Note: streamKey already has unique: true, so no need for separate index

export default mongoose.model<ILiveStream>('LiveStream', LiveStreamSchema);