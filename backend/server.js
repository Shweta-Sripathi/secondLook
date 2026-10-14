const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Import Route Handlers
const authRoutes = require('./routes/authRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const recruiterRoutes = require('./routes/recruiterRoutes');

// Load environment variables from .env file into process.env
dotenv.config();

// Connect to MongoDB Database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware configuration
app.use(cors()); // Enable Cross-Origin Resource Sharing for React frontend requests
app.use(express.json()); // Enable JSON parsing for incoming HTTP request bodies

// API Route Registration
app.use('/api/auth', authRoutes);
app.use('/api/candidate', candidateRoutes);
app.use('/api/recruiter', recruiterRoutes);

// Health check endpoint to verify backend server status
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'secondLook API active',
    database: 'Mongoose models initialized',
    routes: ['/api/auth', '/api/candidate', '/api/recruiter'],
    timestamp: new Date().toISOString()
  });
});

// Root route handler
app.get('/', (req, res) => {
  res.send('secondLook API Server');
});

// Error Handling Middlewares (Must be registered after all route handlers)
app.use(notFound);
app.use(errorHandler);

// Start listening for HTTP requests
app.listen(PORT, () => {
  console.log(`[secondLook] Server running on port ${PORT}`);
  console.log(`[secondLook] Health: http://localhost:${PORT}/api/health`);
});
