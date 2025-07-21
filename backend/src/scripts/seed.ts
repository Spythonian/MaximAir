import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Episode from '../models/Episode';

dotenv.config();

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/iconic-fm');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Episode.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create admin user
    const adminUser = new User({
      username: 'admin',
      email: 'admin@iconicfm.com',
      password: 'admin123',
      role: 'admin'
    });

    await adminUser.save();
    console.log('👤 Created admin user');

    // Create editor user
    const editorUser = new User({
      username: 'editor',
      email: 'editor@iconicfm.com',
      password: 'editor123',
      role: 'editor'
    });

    await editorUser.save();
    console.log('👤 Created editor user');

    // Create sample episodes
    const sampleEpisodes = [
      {
        title: "The Morning Mix",
        description: "Start your day with the perfect blend of music and conversation. Join us for the latest hits, weather updates, and engaging discussions.",
        duration: "2:30:00",
        category: "Music",
        status: "published",
        createdBy: adminUser._id,
        tags: ["morning", "music", "hits"],
        plays: 1250,
        likes: 89
      },
      {
        title: "Tech Talk Tuesday",
        description: "Latest technology trends and innovations discussed with industry experts. From AI to blockchain, we cover it all.",
        duration: "1:45:00",
        category: "Technology",
        status: "published",
        createdBy: editorUser._id,
        tags: ["technology", "innovation", "ai"],
        plays: 890,
        likes: 67
      },
      {
        title: "Celebrity Spotlight",
        description: "Exclusive interviews with your favorite stars from music, movies, and entertainment industry.",
        duration: "1:20:00",
        category: "Interview",
        status: "published",
        createdBy: adminUser._id,
        tags: ["celebrity", "interview", "entertainment"],
        plays: 2100,
        likes: 156
      },
      {
        title: "Community Voices",
        description: "Highlighting amazing stories from our local community and the people who make a difference.",
        duration: "2:00:00",
        category: "Community",
        status: "published",
        createdBy: editorUser._id,
        tags: ["community", "local", "stories"],
        plays: 650,
        likes: 45
      },
      {
        title: "Weekend Vibes",
        description: "Relaxing tunes and feel-good music for your weekend. Perfect for unwinding and enjoying your free time.",
        duration: "3:00:00",
        category: "Music",
        status: "draft",
        createdBy: adminUser._id,
        tags: ["weekend", "relaxing", "music"],
        plays: 0,
        likes: 0
      }
    ];

    for (const episodeData of sampleEpisodes) {
      const episode = new Episode(episodeData);
      await episode.save();
    }

    console.log('🎧 Created sample episodes');
    console.log('\n🎉 Seed data created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Admin: admin@iconicfm.com / admin123');
    console.log('Editor: editor@iconicfm.com / editor123');

  } catch (error) {
    console.error('❌ Seed error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

seedData();