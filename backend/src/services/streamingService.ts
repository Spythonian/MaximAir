import crypto from 'crypto';
import LiveStream, { ILiveStream } from '../models/LiveStream';
import { Types } from 'mongoose';

export class StreamingService {
  private static instance: StreamingService;
  private activeStreams = new Map<string, ILiveStream>();

  public static getInstance(): StreamingService {
    if (!StreamingService.instance) {
      StreamingService.instance = new StreamingService();
    }
    return StreamingService.instance;
  }

  // Generate unique stream key
  generateStreamKey(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  // Create new stream
  async createStream(data: {
    title: string;
    description?: string;
    quality?: 'low' | 'medium' | 'high' | 'ultra';
    recordingEnabled?: boolean;
    createdBy: string;
  }): Promise<ILiveStream> {
    const streamKey = this.generateStreamKey();
    const domain = process.env.DOMAIN || 'localhost';
    const rtmpPort = process.env.RTMP_PORT || '1935';
    
    const qualitySettings = {
      low: { bitrate: 64000 },
      medium: { bitrate: 128000 },
      high: { bitrate: 256000 },
      ultra: { bitrate: 320000 }
    };

    const quality = data.quality || 'medium';
    
    const stream = new LiveStream({
      title: data.title,
      description: data.description,
      streamKey,
      streamUrl: `rtmp://${domain}:${rtmpPort}/live/${streamKey}`,
      playbackUrl: `http://${domain}/hls/${streamKey}.m3u8`,
      quality,
      bitrate: qualitySettings[quality].bitrate,
      recordingEnabled: data.recordingEnabled ?? true,
      createdBy: new Types.ObjectId(data.createdBy)
    });

    return await stream.save();
  }

  // Authenticate stream key
  async authenticateStream(streamKey: string): Promise<boolean> {
    try {
      const stream = await LiveStream.findOne({ 
        streamKey, 
        status: { $in: ['preparing', 'live'] } 
      });
      return !!stream;
    } catch (error) {
      console.error('Stream authentication error:', error);
      return false;
    }
  }

  // Start stream
  async startStream(streamKey: string): Promise<ILiveStream | null> {
    try {
      const stream = await LiveStream.findOneAndUpdate(
        { streamKey },
        {
          $set: {
            isActive: true,
            status: 'live',
            startedAt: new Date()
          }
        },
        { new: true }
      );

      if (stream) {
        this.activeStreams.set(streamKey, stream);
        console.log(`Stream started: ${stream.title} (${streamKey})`);
      }

      return stream;
    } catch (error) {
      console.error('Error starting stream:', error);
      return null;
    }
  }

  // End stream
  async endStream(streamKey: string): Promise<ILiveStream | null> {
    try {
      const stream = await LiveStream.findOne({ streamKey });
      if (!stream) return null;

      const duration = stream.startedAt 
        ? Math.floor((Date.now() - stream.startedAt.getTime()) / 1000)
        : 0;

      const updatedStream = await LiveStream.findOneAndUpdate(
        { streamKey },
        {
          $set: {
            isActive: false,
            status: 'ended',
            endedAt: new Date(),
            duration
          }
        },
        { new: true }
      );

      if (updatedStream) {
        this.activeStreams.delete(streamKey);
        console.log(`Stream ended: ${updatedStream.title} (${streamKey}), Duration: ${duration}s`);
      }

      return updatedStream;
    } catch (error) {
      console.error('Error ending stream:', error);
      return null;
    }
  }

  // Update stream metadata
  async updateMetadata(streamKey: string, metadata: {
    currentTrack?: string;
    artist?: string;
    album?: string;
    genre?: string;
  }): Promise<ILiveStream | null> {
    try {
      return await LiveStream.findOneAndUpdate(
        { streamKey },
        { $set: { metadata } },
        { new: true }
      );
    } catch (error) {
      console.error('Error updating metadata:', error);
      return null;
    }
  }

  // Update listener count
  async updateListenerCount(streamKey: string, count: number): Promise<void> {
    try {
      const stream = await LiveStream.findOne({ streamKey });
      if (!stream) return;

      const updateData: any = {
        currentListeners: count,
        totalListeners: Math.max(stream.totalListeners, count)
      };

      if (count > stream.peakListeners) {
        updateData.peakListeners = count;
      }

      await LiveStream.updateOne({ streamKey }, { $set: updateData });
    } catch (error) {
      console.error('Error updating listener count:', error);
    }
  }

  // Get active streams
  async getActiveStreams(): Promise<ILiveStream[]> {
    try {
      return await LiveStream.find({ isActive: true })
        .populate('createdBy', 'username email')
        .sort({ startedAt: -1 });
    } catch (error) {
      console.error('Error getting active streams:', error);
      return [];
    }
  }

  // Get stream by key
  async getStreamByKey(streamKey: string): Promise<ILiveStream | null> {
    try {
      return await LiveStream.findOne({ streamKey })
        .populate('createdBy', 'username email');
    } catch (error) {
      console.error('Error getting stream:', error);
      return null;
    }
  }

  // Get user streams
  async getUserStreams(userId: string, limit = 10): Promise<ILiveStream[]> {
    try {
      return await LiveStream.find({ createdBy: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .limit(limit);
    } catch (error) {
      console.error('Error getting user streams:', error);
      return [];
    }
  }

  // Delete stream
  async deleteStream(streamKey: string, userId: string): Promise<boolean> {
    try {
      const result = await LiveStream.deleteOne({ 
        streamKey, 
        createdBy: new Types.ObjectId(userId) 
      });
      
      if (result.deletedCount > 0) {
        this.activeStreams.delete(streamKey);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting stream:', error);
      return false;
    }
  }

  // Get stream statistics
  async getStreamStats(streamKey: string): Promise<any> {
    try {
      const stream = await LiveStream.findOne({ streamKey });
      if (!stream) return null;

      return {
        title: stream.title,
        status: stream.status,
        isActive: stream.isActive,
        currentListeners: stream.currentListeners,
        peakListeners: stream.peakListeners,
        totalListeners: stream.totalListeners,
        duration: stream.duration,
        startedAt: stream.startedAt,
        endedAt: stream.endedAt,
        quality: stream.quality,
        bitrate: stream.bitrate,
        metadata: stream.metadata
      };
    } catch (error) {
      console.error('Error getting stream stats:', error);
      return null;
    }
  }
}

export default StreamingService.getInstance();