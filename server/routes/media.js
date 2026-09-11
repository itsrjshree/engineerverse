/**
 * ENGINEERVERSE — Media Pipeline Router (Cloudinary & Authoritative Avatar Redirection)
 * Pure JavaScript (ZERO TypeScript).
 *
 * All binary media is stored authoritatively in Cloudinary.
 * Avatars are served by redirecting to the authoritative Cloudinary URL
 * or serving a deterministic SVG fallback. No local disk storage.
 */

import { Router } from 'express';
import { standardRateLimiter } from '../middleware/rateLimiter.js';
import { generateUploadSignature } from '../services/cloudinaryService.js';
import { usersStore } from '../services/usersStore.js';

const router = Router();

function generateInitialAvatarSvg(letter = 'U') {
  const char = String(letter).charAt(0).toUpperCase() || 'U';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="avatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7c3aed"/>
      <stop offset="100%" stop-color="#4f46e5"/>
    </linearGradient>
  </defs>
  <rect width="120" height="120" rx="60" fill="url(#avatarGrad)"/>
  <text x="60" y="74" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="900" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${char}</text>
</svg>`;
}

router.post('/signature', standardRateLimiter, (req, res) => {
  const { mediaType, folder } = req.body || {};
  const signatureData = generateUploadSignature({ folder, mediaType });
  res.json(signatureData);
});

/**
 * Serves stored user profile avatar directly with caching headers.
 * Resolves authoritatively from Firestore/Cloudinary; falls back to dynamic SVG.
 * Zero local disk storage dependencies.
 */
router.get('/avatar/:uid', async (req, res) => {
  const { uid } = req.params;
  if (!uid) {
    return res.status(400).json({ success: false, error: 'User ID is required.' });
  }

  const cleanUid = String(uid).replace(/[^a-zA-Z0-9_-]/g, '');
  if (!cleanUid) {
    return res.status(400).json({ success: false, error: 'Invalid user ID format.' });
  }

  try {
    const user = await usersStore.getUserByUid(cleanUid);

    // If user has an authoritative cloud-hosted photo URL (Cloudinary or CDN), redirect directly
    if (user?.photoURL && (user.photoURL.startsWith('https://') || user.photoURL.startsWith('http://'))) {
      return res.redirect(302, user.photoURL);
    }

    // Dynamic initial avatar SVG fallback (zero disk dependence)
    const initialChar = (user?.displayName || user?.email || 'U').charAt(0).toUpperCase();
    const svg = generateInitialAvatarSvg(initialChar);

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    return res.send(svg);
  } catch (err) {
    console.error('[MediaRouter] Error serving avatar:', err.message);
    const svg = generateInitialAvatarSvg('U');
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.send(svg);
  }
});

export default router;
