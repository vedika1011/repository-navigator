// app.js — Express application setup, middleware, and route registration.

const express = require('express');
const cors = require('cors');
const analyzeRoutes = require('./routes/analyze');
const requestLogger = require('./middleware/requestLogger');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Health check endpoint (fast response)
app.get('/health', (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// Routes
app.use('/analyze', analyzeRoutes);
app.use('/summarize', require('./routes/summarize'));
app.use('/query', require('./routes/query'));

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested endpoint does not exist.'
    }
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Error]', err.stack || err.message);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred on the server.'
    }
  });
});

module.exports = app;
