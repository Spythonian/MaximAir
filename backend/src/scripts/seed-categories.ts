import mongoose from 'mongoose';
import { Category } from '../models/Category';
import dotenv from 'dotenv';

dotenv.config();

const categories = [
  {
    name: 'Music',
    description: 'Music shows, reviews, and discussions',
    icon: '🎵',
    color: '#FF4B4B',
    isActive: true,
    episodeCount: 0,
    createdBy: '687a704d10aaf2bcaadb6b63' // Admin user ID
  },
  {
    name: 'News',
    description: 'Latest news and current events',
    icon: '📰',
    color: '#2196F3',
    isActive: true,
    episodeCount: 0,
    createdBy: '687a704d10aaf2bcaadb6b63'
  },
  {
    name: 'Technology',
    description: 'Tech news, reviews, and discussions',
    icon: '💻',
    color: '#00B8D4',
    isActive: true,
    episodeCount: 0,
    createdBy: '687a704d10aaf2bcaadb6b63'
  },
  {
    name: 'Interview',
    description: 'In-depth interviews with interesting people',
    icon: '🎙️',
    color: '#9C27B0',
    isActive: true,
    episodeCount: 0,
    createdBy: '687a704d10aaf2bcaadb6b63'
  },
  {
    name: 'Community',
    description: 'Community events and discussions',
    icon: '👥',
    color: '#34C759',
    isActive: true,
    episodeCount: 0,
    createdBy: '687a704d10aaf2bcaadb6b63'
  },
  {
    name: 'Sports',
    description: 'Sports news, analysis, and discussions',
    icon: '⚽',
    color: '#FF9500',
    isActive: true,
    episodeCount: 0,
    createdBy: '687a704d10aaf2bcaadb6b63'
  }
];

async function seedCategories() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB');

    // Clear existing categories
    await Category.deleteMany({});
    console.log('Cleared existing categories');

    // Insert new categories
    const result = await Category.insertMany(categories);
    console.log(`Seeded ${result.length} categories`);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
}

// Run the seed function
seedCategories();