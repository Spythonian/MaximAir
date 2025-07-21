import mongoose from 'mongoose';
import User from '../models/User';
import { ListeningSession } from '../models/Analytics';
import { Comment, Review, Playlist, Favorite } from '../models/Community';

// Mock episode data
const mockEpisodes = [
  { _id: new mongoose.Types.ObjectId(), title: 'Tech Talk: AI Revolution' },
  { _id: new mongoose.Types.ObjectId(), title: 'Music Spotlight: Jazz Legends' },
  { _id: new mongoose.Types.ObjectId(), title: 'Community Chat: Local Events' },
  { _id: new mongoose.Types.ObjectId(), title: 'Interview: Startup Founders' },
  { _id: new mongoose.Types.ObjectId(), title: 'News Update: Weekly Roundup' }
];

async function seedUserActivity() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/iconic-fm');
    console.log('Connected to MongoDB');

    // Get all users
    const users = await User.find({ role: 'user' }).limit(10);
    
    if (users.length === 0) {
      console.log('No users found. Please create some users first.');
      return;
    }

    console.log(`Found ${users.length} users. Creating activity data...`);

    // Create listening sessions for each user
    for (const user of users) {
      const sessionCount = Math.floor(Math.random() * 20) + 5; // 5-25 sessions per user
      
      for (let i = 0; i < sessionCount; i++) {
        const episode = mockEpisodes[Math.floor(Math.random() * mockEpisodes.length)];
        const duration = Math.floor(Math.random() * 3600) + 300; // 5 minutes to 1 hour
        const completionRate = Math.random() * 0.8 + 0.2; // 20% to 100% completion
        
        const session = new ListeningSession({
          userId: user._id,
          episodeId: episode._id,
          startTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Last 30 days
          duration,
          completionRate,
          deviceType: ['desktop', 'mobile', 'tablet'][Math.floor(Math.random() * 3)]
        });
        
        await session.save();
      }

      // Create comments for each user
      const commentCount = Math.floor(Math.random() * 10) + 1; // 1-10 comments per user
      
      for (let i = 0; i < commentCount; i++) {
        const episode = mockEpisodes[Math.floor(Math.random() * mockEpisodes.length)];
        const comments = [
          'Great episode! Really enjoyed the discussion.',
          'Interesting perspective on this topic.',
          'Could you do more episodes like this?',
          'Thanks for sharing this information.',
          'Looking forward to the next episode!',
          'This was very informative.',
          'Love the format of this show.',
          'Great guest selection!',
          'Please cover more topics like this.',
          'Excellent content as always!'
        ];
        
        const comment = new Comment({
          userId: user._id,
          episodeId: episode._id,
          content: comments[Math.floor(Math.random() * comments.length)],
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        });
        
        await comment.save();
      }

      // Create reviews for each user
      const reviewCount = Math.floor(Math.random() * 5) + 1; // 1-5 reviews per user
      
      for (let i = 0; i < reviewCount; i++) {
        const episode = mockEpisodes[Math.floor(Math.random() * mockEpisodes.length)];
        const reviewTexts = [
          'Excellent episode with great insights.',
          'Good content but could be shorter.',
          'Really enjoyed this one!',
          'Informative and well-presented.',
          'One of my favorite episodes so far.'
        ];
        
        const review = new Review({
          userId: user._id,
          episodeId: episode._id,
          rating: Math.floor(Math.random() * 5) + 1, // 1-5 stars
          content: reviewTexts[Math.floor(Math.random() * reviewTexts.length)],
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        });
        
        await review.save();
      }

      // Create playlists for each user
      const playlistCount = Math.floor(Math.random() * 3) + 1; // 1-3 playlists per user
      
      for (let i = 0; i < playlistCount; i++) {
        const playlistNames = [
          'My Favorites',
          'Tech Episodes',
          'Music Collection',
          'Weekly Picks',
          'Best Interviews',
          'Learning Playlist'
        ];
        
        const episodeCount = Math.floor(Math.random() * 5) + 2; // 2-6 episodes per playlist
        const playlistEpisodes = [];
        
        for (let j = 0; j < episodeCount; j++) {
          const episode = mockEpisodes[Math.floor(Math.random() * mockEpisodes.length)];
          playlistEpisodes.push({
            episodeId: episode._id,
            addedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
          });
        }
        
        const playlist = new Playlist({
          userId: user._id,
          name: playlistNames[Math.floor(Math.random() * playlistNames.length)],
          description: 'A collection of my favorite episodes',
          isPublic: Math.random() > 0.3, // 70% public, 30% private
          episodes: playlistEpisodes,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        });
        
        await playlist.save();
      }

      // Create favorites for each user
      const favoriteCount = Math.floor(Math.random() * 8) + 2; // 2-10 favorites per user
      
      for (let i = 0; i < favoriteCount; i++) {
        const episode = mockEpisodes[Math.floor(Math.random() * mockEpisodes.length)];
        
        const favorite = new Favorite({
          userId: user._id,
          itemId: episode._id,
          itemType: 'episode',
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        });
        
        await favorite.save();
      }

      // Update user stats
      const totalSessions = await ListeningSession.countDocuments({ userId: user._id });
      const totalListeningTime = await ListeningSession.aggregate([
        { $match: { userId: user._id } },
        { $group: { _id: null, total: { $sum: '$duration' } } }
      ]);
      
      const totalComments = await Comment.countDocuments({ userId: user._id });
      const totalPlaylists = await Playlist.countDocuments({ userId: user._id });
      const totalFavorites = await Favorite.countDocuments({ userId: user._id });
      
      const avgSessionDuration = totalListeningTime.length > 0 && totalSessions > 0 
        ? Math.round(totalListeningTime[0].total / totalSessions) 
        : 0;

      await User.findByIdAndUpdate(user._id, {
        'stats.totalListeningTime': totalListeningTime.length > 0 ? totalListeningTime[0].total : 0,
        'stats.episodesListened': totalSessions,
        'stats.commentsCount': totalComments,
        'stats.playlistsCount': totalPlaylists,
        'stats.favoritesCount': totalFavorites,
        'stats.averageSessionDuration': avgSessionDuration,
        'stats.lastActiveAt': new Date()
      });

      console.log(`Created activity data for user: ${user.username}`);
    }

    console.log('User activity data seeded successfully!');
    
  } catch (error) {
    console.error('Error seeding user activity:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeder
if (require.main === module) {
  seedUserActivity();
}

export default seedUserActivity;