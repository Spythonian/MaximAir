import mongoose, { Document, Schema } from 'mongoose';

export interface IPlaylist extends Document {
  name: string;
  description?: string;
  userId: mongoose.Types.ObjectId;
  episodes: mongoose.Types.ObjectId[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PlaylistSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    episodes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Episode',
      },
    ],
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Playlist || mongoose.model<IPlaylist>('Playlist', PlaylistSchema);
