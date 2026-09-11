/**
 * ENGINEERVERSE — Engineering Pledge Router
 * "My Engineering Pledge"
 * Connects Sir M. Visvesvaraya's legacy to today's builder.
 * Pure JavaScript (ZERO TypeScript).
 *
 * Backed authoritatively by Firestore `pledges` collection & atomic counter.
 */

import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { standardRateLimiter } from '../middleware/rateLimiter.js';
import * as firestorePledgesService from '../services/firestorePledgesService.js';

const router = Router();

router.use(verifyToken);

/**
 * GET /api/pledges/stats
 * Real aggregate pledge count from Firestore
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await firestorePledgesService.getPledgeStats();
    res.json(stats);
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/pledges
 * Signs the engineering pledge and generates an immutable certificate
 */
router.post('/', standardRateLimiter, async (req, res) => {
  const { name, commitment, role } = req.body;

  if (!name || !commitment) {
    return res.status(400).json({
      success: false,
      error: 'Name and commitment are required to sign the Engineering Pledge.',
    });
  }

  try {
    const result = await firestorePledgesService.createPledge({
      name,
      commitment,
      role,
      user: req.user && !req.user.isAnonymous ? req.user : null,
    });

    if (!result.success) {
      return res.status(result.status || 400).json(result);
    }

    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

export default router;
