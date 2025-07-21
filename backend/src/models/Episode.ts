import mongoose, { Document, Schema } from 'mongoose';

export interface IPresenter {
  name: string;
  role?: string;
  bio?: string;
  image?: string;
}

export interface IGuest {
  name: string;
  title?: string;
  company?: string;
  bio?: string;
  image?: string;
}

export interface IEpisode extends Document {
  title: string;
  description: string;
  duration: string;
  category: string;
  audioFile?: string;
  imageFile?: string;
  status: 'published' | 'draft';
  publishedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  plays: number;
  likes: number;
  tags: string[];
  presenters: IPresenter[];
  guests: IGuest[];
  createdAt: Date;
  updatedAt: Date;
}

const EpisodeSchema = new Schema<IEpisode>({
  title: {
    type: String,
    required: [true, 'Episode title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Episode description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  duration: {
    type: String,
    required: [true, 'Episode duration is required'],
    match: [/^\d{1,2}:\d{2}:\d{2}$/, 'Duration must be in format HH:MM:SS (e.g., 1:30:00)']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  audioFile: {
    type: String,
    trim: true
  },
  imageFile: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['published', 'draft'],
    default: 'draft'
  },
  publishedAt: {
    type: Date
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plays: {
    type: Number,
    default: 0,
    min: 0
  },
  likes: {
    type: Number,
    default: 0,
    min: 0
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  presenters: [{
    name: {
      type: String,
      required: [true, 'Presenter name is required'],
      trim: true,
      maxlength: [100, 'Presenter name cannot exceed 100 characters']
    },
    role: {
      type: String,
      trim: true,
      maxlength: [100, 'Presenter role cannot exceed 100 characters']
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, 'Presenter bio cannot exceed 500 characters']
    },
    image: {
      type: String,
      trim: true
    }
  }],
  guests: [{
    name: {
      type: String,
      required: [true, 'Guest name is required'],
      trim: true,
      maxlength: [100, 'Guest name cannot exceed 100 characters']
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, 'Guest title cannot exceed 100 characters']
    },
    company: {
      type: String,
      trim: true,
      maxlength: [100, 'Guest company cannot exceed 100 characters']
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, 'Guest bio cannot exceed 500 characters']
    },
    image: {
      type: String,
      trim: true
    }
  }]
}, {
  timestamps: true
});

// Index for better query performance
EpisodeSchema.index({ status: 1, publishedAt: -1 });
EpisodeSchema.index({ category: 1, status: 1 });
EpisodeSchema.index({ createdBy: 1 });

// Set publishedAt when status changes to published
EpisodeSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

export default mongoose.model<IEpisode>('Episode', EpisodeSchema);