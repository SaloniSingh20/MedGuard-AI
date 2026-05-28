require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const verificationRoutes = require('./routes/verification');
const analyticsRoutes = require('./routes/analytics');
const alertRoutes = require('./routes/alerts');
const settingsRoutes = require('./routes/settings');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/medguard';

// Security middleware
let helmet = null;
try { helmet = require('helmet'); } catch {}
if (helmet) app.use(helmet());

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api', apiLimiter);

// Health check
app.get('/api/health', (_, res) => {
  res.json({
    ok: true,
    service: 'medguard-backend',
    port: PORT,
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api', verificationRoutes);
app.use('/api', analyticsRoutes);
app.use('/api', alertRoutes);
app.use('/api', settingsRoutes);

// 404
app.use((req, res) => res.status(404).json({ success: false, error: 'Route not found' }));

// Error handler
app.use(errorHandler);

// MongoDB connection
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('[DB] MongoDB connected:', MONGODB_URI);
    app.listen(PORT, () => console.log(`[Server] Running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('[DB] MongoDB connection failed:', err.message);
    console.log('[Server] Starting without MongoDB (limited functionality)...');
    app.listen(PORT, () => console.log(`[Server] Running on http://localhost:${PORT}`));
  });

module.exports = app;
