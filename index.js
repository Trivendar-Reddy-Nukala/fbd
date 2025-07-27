// index.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const db = require('./db');
const createTables = require('./createTables');
require('dotenv').config();
// Import routes
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize database tables
createTables();

const errorhandler = require('errorhandler');
if (process.env.NODE_ENV === 'development') {
  app.use(errorhandler());
}


// Health check route
app.get('/health', (req, res) => {
  db.query('SELECT NOW() AS time', (err, result) => {
    if (err) return res.status(500).send('Database error');
    res.send({ 
      message: 'Financial Management API is running', 
      time: result[0].time,
      status: 'healthy'
    });
  });
});

// API routes
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(` Financial Management API running at http://localhost:${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/health`);
  console.log(` Auth endpoints: http://localhost:${PORT}/auth`);
  console.log(` API endpoints: http://localhost:${PORT}/api`);
  console.log(` Admin endpoints: http://localhost:${PORT}/api/admin`);
});
