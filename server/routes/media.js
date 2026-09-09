/**
 * ENGINEERVERSE — Media Pipeline Router (Cloudinary & Local Avatar Storage)
 */

import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { standardRateLimiter } from '../middleware/rateLimiter.js';
import { generateUploadSignature } from '../services/cloudinaryService.js';
import { usersStore } from '../services/usersStore.js';

const router = Router();
const AVATARS_DIR = path.resolve(process.cwd(), 'server/storage/avatars');

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
  const { mediaType, folder } = req.body;
  const signatureData = generateUploadSignature({ folder, mediaType });
  res.json(signatureData);
});

/**
 * Serves stored user profile avatar directly with caching headers.
 */
router.get('/avatar/:uid', (req, res) => {
  const { uid } = req.params;
  if (!uid) {
    return res.status(400).json({ success: false, error: 'User ID is required.' });
  }

  const cleanUid = String(uid).replace(/[^a-zA-Z0-9_-]/g, '');
  if (!cleanUid) {
    return res.status(400).json({ success: false, error: 'Invalid user ID format.' });
  }

  if (!fs.existsSync(AVATARS_DIR)) {
    return res.status(404).json({ success: false, error: 'Avatar not found.' });
  }

  try {
    const files = fs.readdirSync(AVATARS_DIR);
    const match = files.find((f) => f.startsWith(`${cleanUid}.`));

    if (!match) {
      // Return user's first letter initial avatar SVG dynamically
      const user = usersStore.usersById.get(cleanUid);
      const initialChar = (user?.displayName || user?.email || 'U').charAt(0).toUpperCase();
      const svg = generateInitialAvatarSvg(initialChar);

      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      return res.send(svg);
    }

    const filePath = path.join(AVATARS_DIR, match);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Avatar not found.' });
    }

    const ext = path.extname(match).toLowerCase();
    const mimeMap = {
      '.webp': 'image/webp',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
    };

    res.setHeader('Content-Type', mimeMap[ext] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    return fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error('[MediaRouter] Error serving avatar:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to retrieve avatar.' });
  }
});

export default router;
