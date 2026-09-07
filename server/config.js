/**
 * ENGINEERVERSE — Backend Server Configuration
 * Loads environment variables with safe defaults.
 * Strictly avoids logging or leaking sensitive credentials.
 */

import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // Canonical base URL
  appUrl: process.env.APP_URL || 'https://rjshree.com/engineerverse',

  // Server-side Gemini AI configuration
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: 'gemini-3.8-flash',
    isAvailable: Boolean(process.env.GEMINI_API_KEY),
  },

  // Firebase Admin configuration (Server Only)
  firebaseAdmin: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
    isConfigured: Boolean(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY),
  },

  // Cloudinary media pipeline (Server Only)
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    isConfigured: Boolean(process.env.CLOUDINARY_API_SECRET && process.env.CLOUDINARY_CLOUD_NAME),
  },

  // Security & Rate Limits
  security: {
    rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
    rateLimitMaxRequests: 100, // 100 req per window
    aiRateLimitMaxRequests: 20, // 20 AI prompts per window per IP
  },
};

export default config;
