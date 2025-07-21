import mongoose from 'mongoose';
import { ListeningSession } from '../models/Analytics';
import Episode from '../models/Episode';
import dotenv from 'dotenv';

dotenv.config();

// Generate sample analytics data for testing
async function generateSampleAnalytics() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/iconic-fm');
    console.log('Connected to MongoDB');

    // Get all episodes
    const episodes = await Episode.find({ status: 'published' });
    if (episodes.length === 0) {
      console.log('No published episodes found. Please create some episodes first.');
      return;
    }

    console.log(`Found ${episodes.length} episodes. Generating sample analytics...`);

    const countries = ['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Japan', 'Brazil', 'India', 'South Africa'];
    const cities = ['New York', 'London', 'Toronto', 'Sydney', 'Berlin', 'Paris', 'Tokyo', 'São Paulo', 'Mumbai', 'Cape Town'];
    const deviceTypes = ['desktop', 'mobile', 'tablet', 'unknown'];
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
      'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X)',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      'Mozilla/5.0 (Android 11; Mobile; rv:68.0)'
    ];

    // Generate sessions for the last 30 days
    const sessionsToGenerate = 500;
    const sessions = [];

    for (let i = 0; i < sessionsToGenerate; i++) {
      const episode = episodes[Math.floor(Math.random() * episodes.length)];
      
      // Convert episode duration to seconds
      const durationParts = episode.duration.split(':').map(Number);
      const episodeDurationSeconds = durationParts[0] * 3600 + durationParts[1] * 60 + durationParts[2];
      
      // Random date within last 30 days
      const daysAgo = Math.floor(Math.random() * 30);
      const hoursAgo = Math.floor(Math.random() * 24);
      const startTime = new Date();
      startTime.setDate(startTime.getDate() - daysAgo);
      startTime.setHours(hoursAgo);

      // Random listening duration (0% to 100% completion)
      const completionRate = Math.random() * 100;
      const actualDuration = (completionRate / 100) * episodeDurationSeconds;

      // Generate realistic skip/pause/seek counts based on completion rate
      const skipCount = completionRate < 30 ? Math.floor(Math.random() * 8) : Math.floor(Math.random() * 3);
      const pauseCount = Math.floor(Math.random() * 5);
      const seekCount = Math.floor(Math.random() * 4);

      const session = {
        episodeId: episode._id,
        sessionId: `sample_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
        ipAddress: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
        country: countries[Math.floor(Math.random() * countries.length)],
        city: cities[Math.floor(Math.random() * cities.length)],
        region: 'Sample Region',
        startTime,
        endTime: completionRate > 90 ? new Date(startTime.getTime() + actualDuration * 1000) : undefined,
        duration: actualDuration,
        episodeDuration: episodeDurationSeconds,
        completionRate,
        skipCount,
        pauseCount,
        seekCount,
        deviceType: deviceTypes[Math.floor(Math.random() * deviceTypes.length)] as any,
        referrer: Math.random() > 0.5 ? 'https://google.com' : undefined
      };

      sessions.push(session);
    }

    // Insert all sessions
    await ListeningSession.insertMany(sessions);
    console.log(`✅ Generated ${sessionsToGenerate} sample listening sessions`);

    // Update episode play counts to match analytics
    for (const episode of episodes) {
      const sessionCount = sessions.filter(s => s.episodeId.toString() === episode._id.toString()).length;
      await Episode.findByIdAndUpdate(episode._id, { 
        plays: episode.plays + sessionCount 
      });
    }

    console.log('✅ Updated episode play counts');
    console.log('🎉 Sample analytics data generated successfully!');

  } catch (error) {
    console.error('❌ Error generating sample analytics:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  generateSampleAnalytics();
}

export { generateSampleAnalytics };