import mongoose from 'mongoose';
import Constants from 'expo-constants';

let isConnecting = false;
let mongoConnection: typeof mongoose | null = null;

export async function connectDB() {
  if (isConnecting) {
    return;
  }

  try {
    isConnecting = true;

    const mongoUri = Constants.expoConfig?.extra?.mongodbUri;
    if (!mongoUri) {
      throw new Error('MongoDB URI is not defined in app config');
    }

    if (mongoConnection) {
      isConnecting = false;
      return;
    }

    mongoConnection = await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
    isConnecting = false;
    return mongoConnection;
  } catch (error) {
    isConnecting = false;
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export function getConnection() {
  return mongoConnection;
}