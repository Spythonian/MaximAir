import mongoose, { Document, Schema } from 'mongoose';

// Live Chat Message Model
export interface ILiveChatMessage extends Document {
  streamId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  username: string;
  message: string;
  messageType: 'text' | 'emoji' | 'system' | 'moderator';
  isDeleted: boolean;
  deletedBy?: mongoose.Types.ObjectId;
  deletedAt?: Date;
  reactions: Array<{
    userId: mongoose.Types.ObjectId;
    emoji: string;
    createdAt: Date;
  }>;
  mentions: mongoose.Types.ObjectId[];
  isHighlighted: boolean;
  createdAt: Date;
}

const LiveChatMessageSchema = new Schema<ILiveChatMessage>({
  streamId: {
    type: Schema.Types.ObjectId,
    ref: 'LiveStream',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  username: {
    type: String,
    required: true,
    trim: true,
    maxlength: [50, 'Username cannot exceed 50 characters']
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  messageType: {
    type: String,
    enum: ['text', 'emoji', 'system', 'moderator'],
    default: 'text'
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  deletedAt: {
    type: Date
  },
  reactions: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    emoji: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  mentions: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  isHighlighted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
LiveChatMessageSchema.index({ streamId: 1, createdAt: -1 });
LiveChatMessageSchema.index({ userId: 1, createdAt: -1 });
LiveChatMessageSchema.index({ isDeleted: 1, createdAt: -1 });

export default mongoose.model<ILiveChatMessage>('LiveChatMessage', LiveChatMessageSchema);