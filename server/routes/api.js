/**
 * ENGINEERVERSE — Core API & Health Status Router
 */

import { Router } from 'express';
import { getCampaignState } from '../../src/config/campaign.js';
import { config } from '../config.js';
import { standardRateLimiter } from '../middleware/rateLimiter.js';

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

// Issues a cryptographic session token for authenticated Firebase members
router.post('/auth/session', standardRateLimiter, async (req, res) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || typeof authHeader !== 'string') {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Missing Authorization header.',
    });
  }

  const idToken = authHeader.replace(/^bearer\s+/i, '').replace(/^["']|["']$/g, '').trim();
  if (!idToken) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Missing Firebase ID token.',
    });
  }

  const { verifyFirebaseIdToken } = await import('../services/firebaseAdminService.js');
  const verifiedUser = await verifyFirebaseIdToken(idToken);

  if (!verifiedUser || !verifiedUser.uid) {
    return res.status(401).json({
      success: false,
      error: 'Invalid, malformed, or unverified Firebase authentication token.',
    });
  }

  const email = (verifiedUser.email || '').toLowerCase();
  const emailVerified = verifiedUser.emailVerified === true;

  const userPayload = {
    uid: verifiedUser.uid,
    email,
    name: verifiedUser.name || (email ? email.split('@')[0] : 'Engineer'),
    isAnonymous: false,
    emailVerified,
  };

  const { usersStore } = await import('../services/usersStore.js');
  const storeUser = usersStore.getOrCreateUser(userPayload);

  if (storeUser && (storeUser.status === 'suspended' || storeUser.status === 'blocked')) {
    return res.status(403).json({
      success: false,
      error: `Account ${storeUser.status} by administration for guideline violations.`,
      status: storeUser.status,
    });
  }

  const { isAuthorizedAdmin } = await import('../middleware/auth.js');
  const isAdmin = isAuthorizedAdmin(userPayload, storeUser);

  const { createSessionToken } = await import('../services/sessionService.js');
  const token = createSessionToken(userPayload);

  res.json({
    success: true,
    token,
    user: {
      uid: userPayload.uid,
      email,
      name: storeUser?.displayName || userPayload.name,
      role: isAdmin ? 'admin' : (storeUser?.role || 'member'),
      isAdmin,
      isAnonymous: false,
      emailVerified,
      status: storeUser?.status || 'active',
      warningReason: storeUser?.warningReason || null,
      connectionCredits: isAdmin ? 9999 : (storeUser?.connectionCredits ?? 5),
    },
  });
});

// Authenticated current user profile endpoint (with credits, warnings, status)
router.get('/auth/me', async (req, res) => {
  const { verifyToken } = await import('../middleware/auth.js');
  verifyToken(req, res, async () => {
    if (!req.user || req.user.isAnonymous) {
      return res.json({
        success: true,
        authenticated: false,
        user: null,
      });
    }

    const { usersStore } = await import('../services/usersStore.js');
    const storeUser = usersStore.getOrCreateUser(req.user);

    res.json({
      success: true,
      authenticated: true,
      user: {
        ...req.user,
        ...storeUser,
      },
    });
  });
});

// Update authenticated user profile endpoint
router.put('/auth/profile', async (req, res) => {
  const { verifyToken } = await import('../middleware/auth.js');
  verifyToken(req, res, async () => {
    if (!req.user || req.user.isAnonymous) {
      return res.status(401).json({
        success: false,
        error: 'Authentication is required to update profile settings.',
      });
    }

    const { displayName, bio, discipline, photoURL, portfolioUrl } = req.body || {};
    const { usersStore } = await import('../services/usersStore.js');

    // Ensure user exists first
    usersStore.getOrCreateUser(req.user);

    const updatedUser = usersStore.updateUserProfile(req.user.uid, {
      displayName,
      bio,
      discipline,
      photoURL,
      portfolioUrl,
    });

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        ...req.user,
        ...(updatedUser || {}),
      },
    });
  });
});

// Dedicated avatar upload endpoint
router.post('/auth/upload-avatar', async (req, res) => {
  const { verifyToken } = await import('../middleware/auth.js');
  verifyToken(req, res, async () => {
    if (!req.user || req.user.isAnonymous) {
      return res.status(401).json({
        success: false,
        error: 'Authentication is required to upload a profile photo.',
      });
    }

    const { dataUrl, photoURL } = req.body || {};
    const finalPhoto = photoURL || dataUrl;

    if (!finalPhoto || typeof finalPhoto !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'A valid image file or photo URL is required.',
      });
    }

    const { usersStore } = await import('../services/usersStore.js');
    usersStore.getOrCreateUser(req.user);

    const updatedUser = usersStore.updateUserProfile(req.user.uid, {
      photoURL: finalPhoto,
    });

    const activePhoto = updatedUser ? updatedUser.photoURL : finalPhoto;

    res.json({
      success: true,
      message: 'Profile photo uploaded successfully.',
      photoURL: activePhoto,
      user: {
        ...req.user,
        ...(updatedUser || {}),
        photoURL: activePhoto,
      },
    });
  });
});

// Delete user account & real-time cleanup across database
router.delete('/auth/account', async (req, res) => {
  const { verifyToken } = await import('../middleware/auth.js');
  verifyToken(req, res, async () => {
    if (!req.user || req.user.isAnonymous) {
      return res.status(401).json({
        success: false,
        error: 'Authentication is required to delete account.',
      });
    }

    const { usersStore } = await import('../services/usersStore.js');
    const result = usersStore.deleteUser(req.user.uid);
    res.json(result);
  });
});

// Compatibility POST alias for account deletion
router.post('/auth/delete-account', async (req, res) => {
  const { verifyToken } = await import('../middleware/auth.js');
  verifyToken(req, res, async () => {
    if (!req.user || req.user.isAnonymous) {
      return res.status(401).json({
        success: false,
        error: 'Authentication is required to delete account.',
      });
    }

    const { usersStore } = await import('../services/usersStore.js');
    const result = usersStore.deleteUser(req.user.uid);
    res.json(result);
  });
});

export default router;
