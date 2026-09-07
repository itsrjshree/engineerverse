/**
 * ENGINEERVERSE — Core API & Health Status Router
 */

import { Router } from 'express';
import { getCampaignState } from '../../src/config/campaign.js';
import { config } from '../config.js';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  const campaign = getCampaignState();
  res.json({
    status: 'healthy',
    product: `ENGINEERVERSE ${campaign.edition}`,
    edition: campaign.edition,
    canonicalUrl: 'https://rjshree.com/engineerverse',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    featuresCount: 60,
    services: {
      gemini: config.gemini.isAvailable ? 'connected' : 'unconfigured_placeholder',
      firebase: config.firebaseAdmin.isConfigured ? 'connected' : 'unconfigured_placeholder',
      cloudinary: config.cloudinary.isConfigured ? 'connected' : 'unconfigured_placeholder',
    },
  });
});

// Campaign State endpoint
router.get('/campaign/state', (req, res) => {
  const simulatedDate = req.query.simulate_date || null;
  const state = getCampaignState(simulatedDate);
  res.json({
    success: true,
    campaign: state,
  });
});

// Client Authentication Configuration (public frontend Firebase config)
router.get('/auth/client-config', (req, res) => {
  const apiKey = (process.env.VITE_FIREBASE_API_KEY || '').trim();
  const projectId = (process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || '').trim();
  const authDomain = (process.env.VITE_FIREBASE_AUTH_DOMAIN || (projectId ? `${projectId}.firebaseapp.com` : '')).trim();
  const storageBucket = (process.env.VITE_FIREBASE_STORAGE_BUCKET || (projectId ? `${projectId}.firebasestorage.app` : '')).trim();
  const messagingSenderId = (process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '').trim();
  const appId = (process.env.VITE_FIREBASE_APP_ID || '').trim();

  res.json({
    success: true,
    configured: Boolean(apiKey && projectId),
    config: {
      apiKey,
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId,
      appId,
    },
  });
});

export default router;
