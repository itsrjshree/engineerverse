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

    // Check if media is stored in mediaRegistry
    if (user?.photoMetadata?.sha256) {
      try {
        const { getFirestoreInstance } = await import('../services/firestoreService.js');
        const db = getFirestoreInstance();
        const mediaDoc = await db.collection('mediaRegistry').doc(user.photoMetadata.sha256).get();
        if (mediaDoc.exists) {
          const media = mediaDoc.data();
          if (media?.url && (media.url.startsWith('https://') || media.url.startsWith('http://'))) {
            return res.redirect(302, media.url);
          }
          if (media?.dataUrl && media.dataUrl.startsWith('data:image/')) {
            const commaIdx = media.dataUrl.indexOf(',');
            const header = media.dataUrl.substring(0, commaIdx);
            const base64 = media.dataUrl.substring(commaIdx + 1);
            const mime = (header.match(/data:(image\/[a-zA-Z0-9+.-]+);base64/) || [])[1] || 'image/webp';
            const buffer = Buffer.from(base64, 'base64');
            res.setHeader('Content-Type', mime);
            res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
            return res.send(buffer);
          }
        }
      } catch (mediaErr) {
        console.warn('[MediaRouter] mediaRegistry lookup notice:', mediaErr.message);
      }
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
