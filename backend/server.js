const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const recruiterRoutes = require('./routes/recruiterRoutes');

dotenv.config({ path: path.resolve(__dirname, '.env') });

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/candidate', candidateRoutes);
app.use('/api/recruiter', recruiterRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'secondLook API active',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend in production
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDist));

// All non-API routes → serve React app (SPA routing)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const indexPath = path.join(frontendDist, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) next();
  });
});

// Error handlers (only for API routes)
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`[secondLook] Server running on port ${PORT}`);
  console.log(`[secondLook] Health: http://localhost:${PORT}/api/health`);
});

module.exports = app;
