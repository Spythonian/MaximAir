import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'editor' | 'user';
  isActive: boolean;
  profile: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatar?: string;
    location?: string;
    website?: string;
  };
  preferences: {
    favoriteCategories: string[];
    emailNotifications: boolean;
    publicProfile: boolean;
  };
  stats: {
    totalListeningTime: number;
    episodesListened: number;
    commentsCount: number;
    playlistsCount: number;
    favoritesCount: number;
    averageSessionDuration: number;
    lastActiveAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  role: {
    type: String,
    enum: ['admin', 'editor', 'user'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profile: {
    firstName: {
      type: String,
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, 'Bio cannot exceed 500 characters']
    },
    avatar: {
      type: String,
      trim: true
    },
    location: {
      type: String,
      trim: true,
      maxlength: [100, 'Location cannot exceed 100 characters']
    },
    website: {
      type: String,
      trim: true,
      maxlength: [200, 'Website URL cannot exceed 200 characters']
    }
  },
  preferences: {
    favoriteCategories: [{
      type: String,
      enum: ['Music', 'Technology', 'Interview', 'Community', 'News', 'Sports', 'Entertainment', 'Other']
    }],
    emailNotifications: {
      type: Boolean,
      default: true
    },
    publicProfile: {
      type: Boolean,
      default: true
    }
  },
  stats: {
    totalListeningTime: {
      type: Number,
      default: 0,
      min: 0
    },
    episodesListened: {
      type: Number,
      default: 0,
      min: 0
    },
    commentsCount: {
      type: Number,
      default: 0,
      min: 0
    },
    playlistsCount: {
      type: Number,
      default: 0,
      min: 0
    },
    favoritesCount: {
      type: Number,
      default: 0,
      min: 0
    },
    averageSessionDuration: {
      type: Number,
      default: 0,
      min: 0
    },
    lastActiveAt: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
UserSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

export default mongoose.model<IUser>('User', UserSchema);