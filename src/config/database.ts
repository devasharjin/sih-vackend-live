import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  // If already connected or connecting, reuse existing connection
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  const URI: string = process.env.MONGODB_URI as string;
  if (!URI) {
    console.warn('⚠️ MONGODB_URI is not set in environment variables');
    return;
  }

  try {
    await mongoose.connect(URI, {
      maxPoolSize: 10,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    // Never crash the process in production/serverless environments (allows health checks and error responses)
    if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  } catch (error) {
    console.error('MongoDB disconnection error:', error);
    throw error;
  }
};
