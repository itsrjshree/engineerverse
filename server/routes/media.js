/**
 * ENGINEERVERSE — Media Pipeline Router (Cloudinary Signed Gateway)
 */

import { Router } from 'express';
import { standardRateLimiter } from '../middleware/rateLimiter.js';
import { generateUploadSignature } from '../services/cloudinaryService.js';

const router = Router();

router.post('/signature', standardRateLimiter, (req, res) => {
  const { mediaType, folder } = req.body;
  const signatureData = generateUploadSignature({ folder, mediaType });
  res.json(signatureData);
});

export default router;
