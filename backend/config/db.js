const mongoose = require('mongoose');

let isConnected = false;

/**
 * Connect to MongoDB. For serverless (Vercel), reuses existing connection.
 */
const connectDB = async () => {
  if (isConnected) return;

  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/secondlook';
    const conn = await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
    });
    isConnected = true;
    console.log(`[secondLook] MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[secondLook] MongoDB connection warning: ${error.message}`);
  }
};

module.exports = connectDB;
