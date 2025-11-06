require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

// Import routes
const qrRoutes = require('./routes/qrRoutes');
const trackRoutes = require('./routes/trackRoutes');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    process.env.FRONTEND_URL,
    // Allow any origin from your local network
    /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d+$/,
    /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/qr', qrRoutes);
app.use('/track', trackRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'QR Code Tracker API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      generateQR: 'POST /api/qr/generate',
      listQR: 'GET /api/qr/list',
      getQR: 'GET /api/qr/:id',
      deleteQR: 'DELETE /api/qr/:id',
      stats: 'GET /api/qr/stats/:id',
      track: 'GET /track/:shortId'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
  🚀 Server is running!
  📍 Port: ${PORT}
  🌍 Environment: ${process.env.NODE_ENV || 'development'}
  🔗 API: http://localhost:${PORT}
  📊 Health Check: http://localhost:${PORT}/api/health
  `);
});

module.exports = app;