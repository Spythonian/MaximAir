import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';

dotenv.config({ path: './.env' });

const MONGODB_URI = process.env.MONGODB_URI;

const updateUsers = async () => {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is not defined in your .env file');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const result = await User.updateMany(
      { role: 'user' },
      { $set: { role: 'visitor' } }
    );

    console.log(`Updated ${result.modifiedCount} users from 'user' to 'visitor'.`);

  } catch (error) {
    console.error('Error updating users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

updateUsers();
