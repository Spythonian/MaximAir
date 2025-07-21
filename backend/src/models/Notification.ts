import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId | 'all'; // 'all' for broadcast notifications
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
  link?: string; // Optional link to redirect user
  isRead: boolean;
  createdBy?: mongoose.Types.ObjectId; // Admin who created the notification
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date; // Optional expiration date
}

const NotificationSchema = new Schema<INotification>({
  userId: {
    type: Schema.Types.Mixed, // Can be ObjectId or string 'all'
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error', 'system'],
    default: 'info'
  },
  link: {
    type: String,
    trim: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
export default Notification;