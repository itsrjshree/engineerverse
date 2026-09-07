/**
 * ENGINEERVERSE — Engineering Pledge Router
 * "My Engineering Pledge"
 * Connects Sir M. Visvesvaraya's legacy to today's builder.
 */

import { Router } from 'express';
import { standardRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// In-memory store for pledges with genuine dynamic counts
const pledgesStore = [];

router.get('/stats', (req, res) => {
  const currentYear = String(new Date().getFullYear());
  res.json({
    success: true,
    totalPledgesCount: pledgesStore.length,
    campaignYear: currentYear,
  });
});

router.post('/', standardRateLimiter, (req, res) => {
  const { name, commitment, role } = req.body;
  const currentYear = new Date().getFullYear();

  if (!name || !commitment) {
    return res.status(400).json({
      success: false,
      error: 'Name and commitment are required to sign the Engineering Pledge.',
    });
  }

  const newPledgeCount = pledgesStore.length + 1;

  const pledgeRecord = {
    id: 'pledge_' + Math.random().toString(36).substring(2, 9),
    name: name.trim(),
    role: role?.trim() || 'Engineer',
    commitment: commitment.trim(),
    signedAt: new Date().toISOString(),
    certificateId: `EV-${currentYear}-PLG-${newPledgeCount}`,
  };

  pledgesStore.push(pledgeRecord);

  res.status(201).json({
    success: true,
    message: 'Engineering Pledge recorded successfully.',
    pledge: pledgeRecord,
    totalPledgesCount: pledgesStore.length,
  });
});

export default router;
