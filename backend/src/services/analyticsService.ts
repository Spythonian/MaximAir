import { ListeningSession, DailyAnalytics, IListeningSession } from '../models/Analytics';
import Episode from '../models/Episode';
import { GeoService } from './geoService';
import { Request } from 'express';

export class AnalyticsService {
  // Get client IP address from request
  static getClientIP(req: Request): string {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress || 
           '127.0.0.1';
  }

  // Detect device type from user agent
  static getDeviceType(userAgent: string): 'desktop' | 'mobile' | 'tablet' | 'unknown' {
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('mobile') && !ua.includes('tablet')) {
      return 'mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'tablet';
    } else if (ua.includes('desktop') || ua.includes('windows') || ua.includes('macintosh')) {
      return 'desktop';
    }
    
    return 'unknown';
  }

  // Start a new listening session
  static async startListeningSession(
    episodeId: string,
    req: Request,
    userId?: string
  ): Promise<IListeningSession> {
    const episode = await Episode.findById(episodeId);
    if (!episode) {
      throw new Error('Episode not found');
    }

    // Convert duration string (HH:MM:SS) to seconds
    const durationParts = episode.duration.split(':').map(Number);
    const episodeDurationSeconds = durationParts[0] * 3600 + durationParts[1] * 60 + durationParts[2];

    const sessionId = `${episodeId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const ipAddress = this.getClientIP(req);
    
    // Get location data from IP address (async, but don't wait for it)
    const locationPromise = GeoService.getLocationFromIP(ipAddress);
    
    const session = new ListeningSession({
      episodeId,
      sessionId,
      userId: userId || undefined,
      ipAddress,
      userAgent: req.headers['user-agent'] || 'Unknown',
      startTime: new Date(),
      episodeDuration: episodeDurationSeconds,
      deviceType: this.getDeviceType(req.headers['user-agent'] || ''),
      referrer: req.headers.referer
    });

    const savedSession = await session.save();

    // Update with location data when available (don't block the response)
    locationPromise.then(async (location) => {
      try {
        await ListeningSession.findByIdAndUpdate(savedSession._id, {
          country: location.country,
          city: location.city,
          region: location.region
        });
      } catch (error) {
        console.error('Failed to update session with location:', error);
      }
    }).catch(error => {
      console.error('Failed to get location for session:', error);
    });

    return savedSession;
  }

  // Update listening session with progress
  static async updateListeningSession(
    sessionId: string,
    data: {
      currentTime?: number;
      skipCount?: number;
      pauseCount?: number;
      seekCount?: number;
      ended?: boolean;
    }
  ): Promise<IListeningSession | null> {
    const session = await ListeningSession.findOne({ sessionId });
    if (!session) return null;

    if (data.currentTime !== undefined) {
      session.duration = Math.max(session.duration, data.currentTime);
      session.completionRate = Math.min(100, (data.currentTime / session.episodeDuration) * 100);
    }

    if (data.skipCount !== undefined) session.skipCount = data.skipCount;
    if (data.pauseCount !== undefined) session.pauseCount = data.pauseCount;
    if (data.seekCount !== undefined) session.seekCount = data.seekCount;

    if (data.ended) {
      session.endTime = new Date();
    }

    return await session.save();
  }

  // Get listener analytics dashboard data
  static async getDashboardAnalytics(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Total listeners and sessions
    const totalSessions = await ListeningSession.countDocuments({
      startTime: { $gte: startDate }
    });

    const uniqueListeners = await ListeningSession.distinct('ipAddress', {
      startTime: { $gte: startDate }
    });

    // Peak listening times (by hour)
    const peakTimes = await ListeningSession.aggregate([
      { $match: { startTime: { $gte: startDate } } },
      {
        $group: {
          _id: { $hour: '$startTime' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 24 }
    ]);

    // Popular episodes
    const popularEpisodes = await ListeningSession.aggregate([
      { $match: { startTime: { $gte: startDate } } },
      {
        $group: {
          _id: '$episodeId',
          totalListeners: { $sum: 1 },
          averageCompletion: { $avg: '$completionRate' },
          totalDuration: { $sum: '$duration' }
        }
      },
      { $sort: { totalListeners: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'episodes',
          localField: '_id',
          foreignField: '_id',
          as: 'episode'
        }
      },
      { $unwind: '$episode' }
    ]);

    // Geographic data
    const geographicData = await ListeningSession.aggregate([
      { $match: { startTime: { $gte: startDate }, country: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$country',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Device breakdown
    const deviceBreakdown = await ListeningSession.aggregate([
      { $match: { startTime: { $gte: startDate } } },
      {
        $group: {
          _id: '$deviceType',
          count: { $sum: 1 }
        }
      }
    ]);

    // Daily listening trends
    const dailyTrends = await ListeningSession.aggregate([
      { $match: { startTime: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$startTime' },
            month: { $month: '$startTime' },
            day: { $dayOfMonth: '$startTime' }
          },
          listeners: { $sum: 1 },
          uniqueListeners: { $addToSet: '$ipAddress' },
          totalDuration: { $sum: '$duration' },
          averageCompletion: { $avg: '$completionRate' }
        }
      },
      {
        $project: {
          _id: 1,
          listeners: 1,
          uniqueListeners: { $size: '$uniqueListeners' },
          totalDuration: 1,
          averageCompletion: 1
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    return {
      overview: {
        totalSessions,
        uniqueListeners: uniqueListeners.length,
        averageSessionDuration: await this.getAverageSessionDuration(startDate),
        totalListeningTime: await this.getTotalListeningTime(startDate)
      },
      peakTimes: peakTimes.map(pt => ({
        hour: pt._id,
        count: pt.count
      })),
      popularEpisodes: popularEpisodes.map(ep => ({
        id: ep._id,
        title: ep.episode.title,
        category: ep.episode.category,
        totalListeners: ep.totalListeners,
        averageCompletion: Math.round(ep.averageCompletion),
        totalDuration: ep.totalDuration
      })),
      geographicData: geographicData.map(geo => ({
        country: geo._id,
        count: geo.count
      })),
      deviceBreakdown: deviceBreakdown.reduce((acc, device) => {
        acc[device._id] = device.count;
        return acc;
      }, {} as Record<string, number>),
      dailyTrends: dailyTrends.map(trend => ({
        date: new Date(trend._id.year, trend._id.month - 1, trend._id.day),
        listeners: trend.listeners,
        uniqueListeners: trend.uniqueListeners,
        totalDuration: trend.totalDuration,
        averageCompletion: Math.round(trend.averageCompletion)
      }))
    };
  }

  // Get episode-specific analytics
  static async getEpisodeAnalytics(episodeId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const sessions = await ListeningSession.find({
      episodeId,
      startTime: { $gte: startDate }
    });

    const totalListeners = sessions.length;
    const uniqueListeners = new Set(sessions.map(s => s.ipAddress)).size;
    const averageCompletion = sessions.reduce((sum, s) => sum + s.completionRate, 0) / totalListeners || 0;
    const totalSkips = sessions.reduce((sum, s) => sum + s.skipCount, 0);
    const totalPauses = sessions.reduce((sum, s) => sum + s.pauseCount, 0);

    // Completion rate distribution
    const completionRanges = {
      '0-25%': 0,
      '26-50%': 0,
      '51-75%': 0,
      '76-100%': 0
    };

    sessions.forEach(session => {
      if (session.completionRate <= 25) completionRanges['0-25%']++;
      else if (session.completionRate <= 50) completionRanges['26-50%']++;
      else if (session.completionRate <= 75) completionRanges['51-75%']++;
      else completionRanges['76-100%']++;
    });

    return {
      totalListeners,
      uniqueListeners,
      averageCompletion: Math.round(averageCompletion),
      totalSkips,
      totalPauses,
      completionRanges,
      sessions: sessions.slice(0, 100) // Return latest 100 sessions for detailed view
    };
  }

  // Helper methods
  private static async getAverageSessionDuration(startDate: Date): Promise<number> {
    const result = await ListeningSession.aggregate([
      { $match: { startTime: { $gte: startDate } } },
      { $group: { _id: null, avgDuration: { $avg: '$duration' } } }
    ]);
    return result[0]?.avgDuration || 0;
  }

  private static async getTotalListeningTime(startDate: Date): Promise<number> {
    const result = await ListeningSession.aggregate([
      { $match: { startTime: { $gte: startDate } } },
      { $group: { _id: null, totalDuration: { $sum: '$duration' } } }
    ]);
    return result[0]?.totalDuration || 0;
  }

  // Get trending content
  static async getTrendingContent(days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Trending episodes (high engagement in recent period)
    const trendingEpisodes = await ListeningSession.aggregate([
      { $match: { startTime: { $gte: startDate } } },
      {
        $group: {
          _id: '$episodeId',
          recentListeners: { $sum: 1 },
          averageCompletion: { $avg: '$completionRate' },
          engagementScore: {
            $avg: {
              $add: [
                '$completionRate',
                { $multiply: [{ $subtract: [10, '$skipCount'] }, 5] }, // Fewer skips = higher score
                { $multiply: [{ $subtract: [5, '$pauseCount'] }, 2] }   // Fewer pauses = higher score
              ]
            }
          }
        }
      },
      { $match: { recentListeners: { $gte: 5 } } }, // At least 5 listeners
      { $sort: { engagementScore: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'episodes',
          localField: '_id',
          foreignField: '_id',
          as: 'episode'
        }
      },
      { $unwind: '$episode' }
    ]);

    // Trending categories
    const trendingCategories = await ListeningSession.aggregate([
      { $match: { startTime: { $gte: startDate } } },
      {
        $lookup: {
          from: 'episodes',
          localField: 'episodeId',
          foreignField: '_id',
          as: 'episode'
        }
      },
      { $unwind: '$episode' },
      {
        $group: {
          _id: '$episode.category',
          listeners: { $sum: 1 },
          averageCompletion: { $avg: '$completionRate' }
        }
      },
      { $sort: { listeners: -1 } }
    ]);

    return {
      trendingEpisodes: trendingEpisodes.map(ep => ({
        id: ep._id,
        title: ep.episode.title,
        category: ep.episode.category,
        recentListeners: ep.recentListeners,
        averageCompletion: Math.round(ep.averageCompletion),
        engagementScore: Math.round(ep.engagementScore)
      })),
      trendingCategories: trendingCategories.map(cat => ({
        category: cat._id,
        listeners: cat.listeners,
        averageCompletion: Math.round(cat.averageCompletion)
      }))
    };
  }
}