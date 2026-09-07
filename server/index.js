/**
 * ENGINEERVERSE 2026 — Express Backend Server
 * JavaScript ONLY.
 * Responsible for API gateways, security headers, rate limiting, and asset serving.
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { corsMiddleware, sanitizeInputs, securityHeaders } from './middleware/security.js';

// Route Handlers
import adminRoutes from './routes/admin.js';
import analyticsRoutes from './routes/analytics.js';
import apiRoutes from './routes/api.js';
import dnaRoutes from './routes/dna.js';
import mediaRoutes from './routes/media.js';
import pledgesRoutes from './routes/pledges.js';
import priteeRoutes from './routes/pritee.js';
import problemsRoutes from './routes/problems.js';
import storiesRoutes from './routes/stories.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createServer() {
  const app = express();

  // Basic Middlewares
  app.use(express.json({ limit: '2mb' }));
  app.use(express.text({ type: ['text/*', 'application/json'], limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // Security Middleware Suite
  app.use(securityHeaders);
  app.use(corsMiddleware);
  app.use(sanitizeInputs);

  // Mount API Routers
  app.use('/api', apiRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/dna', dnaRoutes);
  app.use('/api/problems', problemsRoutes);
  app.use('/api/stories', storiesRoutes);
  app.use('/api/pledges', pledgesRoutes);
  app.use('/api/pritee', priteeRoutes);
  app.use('/api/media', mediaRoutes);
  app.use('/api/admin', adminRoutes);

  // Fallback 404 for unhandled API routes
  app.use('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      error: `API route not found: ${req.method} ${req.originalUrl}`,
    });
  });

  // Production static file serving
  if (config.isProduction) {
    const distPath = path.resolve(__dirname, '../dist');
    app.use(express.static(distPath));

    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Central Error Handler
  app.use((err, req, res, next) => {
    console.error('[Server Unhandled Error]:', err);
    res.status(500).json({
      success: false,
      error: 'An internal server error occurred.',
      message: config.isProduction ? undefined : err.message,
    });
  });

  return app;
}

// Start standalone if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const app = createServer();
  app.listen(config.port, config.host, () => {
    console.log(`[ENGINEERVERSE Backend] Running on http://${config.host}:${config.port}`);
    console.log(`[Canonical Route] https://rjshree.com/engineerverse`);
  });
}

export default createServer;
