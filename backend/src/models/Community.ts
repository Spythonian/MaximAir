import mongoose, { Document, Schema } from 'mongoose';

// Comment Model
export interface IComment extends Document {
  userId: mongoose.Types.ObjectId;
  episodeId: mongoose.Types.ObjectId;
  content: string;
  isDeleted: boolean;
  likes: number;
  parentId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  episodeId: {
    type: Schema.Types.ObjectId,
    ref: 'Episode',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  likes: {
    type: Number,
    default: 0
  },
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'Comment'
  }
}, {
  timestamps: true
});

// Review Model
export interface IReview extends Document {
  userId: mongoose.Types.ObjectId;
  episodeId: mongoose.Types.ObjectId;
  rating: number;
  title?: string;
  content: string;
  isRecommended: boolean;
  helpfulVotes: number;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  episodeId: {
    type: Schema.Types.ObjectId,
    ref: 'Episode',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  content: {
    type: String,
    trim: true,
    maxlength: [500, 'Review cannot exceed 500 characters']
  },
  isRecommended: {
    type: Boolean,
    default: false
  },
  helpfulVotes: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Playlist Model
export interface IPlaylist extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  isPublic: boolean;
  episodes: Array<{
    episodeId: mongoose.Types.ObjectId;
    addedAt: Date;
    order: number;
  }>;
  followers: mongoose.Types.ObjectId[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const PlaylistSchema = new Schema<IPlaylist>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Playlist name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  episodes: [{
    episodeId: {
      type: Schema.Types.ObjectId,
      ref: 'Episode',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    order: {
      type: Number,
      default: 0
    }
  }],
  followers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  tags: [String]
}, {
  timestamps: true
});

// Favorite Model
export interface IFavorite extends Document {
  userId: mongoose.Types.ObjectId;
  itemId: mongoose.Types.ObjectId;
  itemType: 'episode' | 'presenter';
  createdAt: Date;
}

const FavoriteSchema = new Schema<IFavorite>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  itemId: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'itemType'
  },
  itemType: {
    type: String,
    required: true,
    enum: ['episode', 'presenter']
  }
}, {
  timestamps: true
});

// Compound indexes for better performance
CommentSchema.index({ userId: 1, createdAt: -1 });
CommentSchema.index({ episodeId: 1, createdAt: -1 });
ReviewSchema.index({ userId: 1, createdAt: -1 });
ReviewSchema.index({ episodeId: 1, createdAt: -1 });
PlaylistSchema.index({ userId: 1, createdAt: -1 });
FavoriteSchema.index({ userId: 1, createdAt: -1 });
FavoriteSchema.index({ userId: 1, itemType: 1, itemId: 1 }, { unique: true });

// Comment Like Model
export interface ICommentLike extends Document {
  userId: mongoose.Types.ObjectId;
  commentId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const CommentLikeSchema = new Schema<ICommentLike>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  commentId: {
    type: Schema.Types.ObjectId,
    ref: 'Comment',
    required: true
  }
}, {
  timestamps: true
});

// Review Helpful Model
export interface IReviewHelpful extends Document {
  userId: mongoose.Types.ObjectId;
  reviewId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const ReviewHelpfulSchema = new Schema<IReviewHelpful>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewId: {
    type: Schema.Types.ObjectId,
    ref: 'Review',
    required: true
  }
}, {
  timestamps: true
});

// Social Share Model
export interface ISocialShare extends Document {
  episodeId: mongoose.Types.ObjectId;
  platform: 'facebook' | 'twitter' | 'linkedin' | 'whatsapp' | 'email' | 'copy';
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

const SocialShareSchema = new Schema<ISocialShare>({
  episodeId: {
    type: Schema.Types.ObjectId,
    ref: 'Episode',
    required: true
  },
  platform: {
    type: String,
    required: true,
    enum: ['facebook', 'twitter', 'linkedin', 'whatsapp', 'email', 'copy']
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});



export const Comment = mongoose.model<IComment>('Comment', CommentSchema);
export const Review = mongoose.model<IReview>('Review', ReviewSchema);
export const Playlist = mongoose.model<IPlaylist>('Playlist', PlaylistSchema);
export const Favorite = mongoose.model<IFavorite>('Favorite', FavoriteSchema);
export const CommentLike = mongoose.model<ICommentLike>('CommentLike', CommentLikeSchema);
export const ReviewHelpful = mongoose.model<IReviewHelpful>('ReviewHelpful', ReviewHelpfulSchema);
export const SocialShare = mongoose.model<ISocialShare>('SocialShare', SocialShareSchema);