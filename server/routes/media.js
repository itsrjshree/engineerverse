/**
 * ENGINEERVERSE — Media Pipeline Router (Cloudinary & Local Avatar Storage)
 */

import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { standardRateLimiter } from '../middleware/rateLimiter.js';
import { generateUploadSignature } from '../services/cloudinaryService.js';

const router = Router();
const AVATARS_DIR = path.resolve(process.cwd(), 'server/storage/avatars');

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
      return res.status(404).json({ success: false, error: 'Avatar not found.' });
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
    return fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error('[MediaRouter] Error serving avatar:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to retrieve avatar.' });
  }
});

export default router;
