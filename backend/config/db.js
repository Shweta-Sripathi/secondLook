const mongoose = require('mongoose');

// Disable buffering so Mongoose commands fail instantly if DB is disconnected instead of hanging/timing out
mongoose.set('bufferCommands', false);

/**
 * Asynchronously connects Express server to MongoDB database using Mongoose.
 */
const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/secondlook';
    const conn = await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });
    console.log(`[secondLook] MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[secondLook] MongoDB connection warning: ${error.message}`);
  }
};

module.exports = connectDB;
