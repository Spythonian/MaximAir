import mongoose, { Document, Schema } from 'mongoose';

// Listening Session Model
export interface IListeningSession extends Document {
  sessionId: string;
  userId?: mongoose.Types.ObjectId;
  episodeId: mongoose.Types.ObjectId;
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
  completionRate: number; // 0-100 (percentage completed)
  episodeDuration: number; // total episode duration in seconds
  skipCount: number;
  pauseCount: number;
  seekCount: number;
  deviceType?: string;
  ipAddress?: string;
  userAgent?: string;
  country?: string;
  city?: string;
  region?: string;
  referrer?: string;
  createdAt: Date;
}

const ListeningSessionSchema = new Schema<IListeningSession>({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  episodeId: {
    type: Schema.Types.ObjectId,
    ref: 'Episode',
    required: true
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  completionRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 0
  },
  episodeDuration: {
    type: Number,
    required: true,
    min: 0
  },
  skipCount: {
    type: Number,
    default: 0,
    min: 0
  },
  pauseCount: {
    type: Number,
    default: 0,
    min: 0
  },
  seekCount: {
    type: Number,
    default: 0,
    min: 0
  },
  deviceType: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet', 'unknown'],
    default: 'unknown'
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  region: {
    type: String,
    trim: true
  },
  referrer: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Page View Model
export interface IPageView extends Document {
  userId?: mongoose.Types.ObjectId;
  path: string;
  referrer?: string;
  userAgent?: string;
  ipAddress?: string;
  sessionId?: string;
  createdAt: Date;
}

const PageViewSchema = new Schema<IPageView>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  path: {
    type: String,
    required: true,
    trim: true
  },
  referrer: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  ipAddress: {
    type: String,
    trim: true
  },
  sessionId: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Episode Analytics Model
export interface IEpisodeAnalytics extends Document {
  episodeId: mongoose.Types.ObjectId;
  totalPlays: number;
  totalListeningTime: number;
  averageCompletionRate: number;
  uniqueListeners: number;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Daily Analytics Model
export interface IDailyAnalytics extends Document {
  date: Date;
  totalSessions: number;
  totalListeningTime: number;
  uniqueListeners: number;
  averageSessionDuration: number;
  topEpisodes: Array<{
    episodeId: mongoose.Types.ObjectId;
    plays: number;
    listeningTime: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const EpisodeAnalyticsSchema = new Schema<IEpisodeAnalytics>({
  episodeId: {
    type: Schema.Types.ObjectId,
    ref: 'Episode',
    required: true
  },
  totalPlays: {
    type: Number,
    default: 0,
    min: 0
  },
  totalListeningTime: {
    type: Number,
    default: 0,
    min: 0
  },
  averageCompletionRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  uniqueListeners: {
    type: Number,
    default: 0,
    min: 0
  },
  date: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

const DailyAnalyticsSchema = new Schema<IDailyAnalytics>({
  date: {
    type: Date,
    required: true,
    unique: true
  },
  totalSessions: {
    type: Number,
    default: 0,
    min: 0
  },
  totalListeningTime: {
    type: Number,
    default: 0,
    min: 0
  },
  uniqueListeners: {
    type: Number,
    default: 0,
    min: 0
  },
  averageSessionDuration: {
    type: Number,
    default: 0,
    min: 0
  },
  topEpisodes: [{
    episodeId: {
      type: Schema.Types.ObjectId,
      ref: 'Episode',
      required: true
    },
    plays: {
      type: Number,
      default: 0,
      min: 0
    },
    listeningTime: {
      type: Number,
      default: 0,
      min: 0
    }
  }]
}, {
  timestamps: true
});

// Indexes for better performance
ListeningSessionSchema.index({ sessionId: 1 });
ListeningSessionSchema.index({ userId: 1, startTime: -1 });
ListeningSessionSchema.index({ episodeId: 1, startTime: -1 });
ListeningSessionSchema.index({ startTime: -1 });
ListeningSessionSchema.index({ ipAddress: 1, startTime: -1 });
PageViewSchema.index({ userId: 1, createdAt: -1 });
PageViewSchema.index({ path: 1, createdAt: -1 });
EpisodeAnalyticsSchema.index({ episodeId: 1, date: -1 });
EpisodeAnalyticsSchema.index({ date: -1 });
DailyAnalyticsSchema.index({ date: -1 });

export const ListeningSession = mongoose.model<IListeningSession>('ListeningSession', ListeningSessionSchema);
export const PageView = mongoose.model<IPageView>('PageView', PageViewSchema);
export const EpisodeAnalytics = mongoose.model<IEpisodeAnalytics>('EpisodeAnalytics', EpisodeAnalyticsSchema);
export const DailyAnalytics = mongoose.model<IDailyAnalytics>('DailyAnalytics', DailyAnalyticsSchema);