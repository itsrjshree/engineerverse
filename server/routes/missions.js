/**
 * ENGINEERVERSE — Missions API Routes
 * Pure JavaScript (ZERO TypeScript).
 * Backed authoritatively by Firestore `missions` collection with local seed fallback.
 */

import express from 'express';
import { requireAdmin } from '../middleware/auth.js';
import * as firestoreMissionsService from '../services/firestoreMissionsService.js';

const router = express.Router();

/**
 * GET /api/missions
 * Returns all active societal engineering missions from Firestore.
 */
router.get('/', async (req, res) => {
  try {
    const missions = await firestoreMissionsService.getAllMissions();
    res.json({
      success: true,
      missions,
      count: missions.length,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to retrieve missions.',
    });
  }
});

/**
 * GET /api/missions/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const mission = await firestoreMissionsService.getMissionById(req.params.id);
    if (!mission) {
      return res.status(404).json({ success: false, error: 'Mission not found.' });
    }
    res.json({ success: true, mission });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/missions (Admin only)
 */
router.post('/', requireAdmin, async (req, res) => {
  try {
    const result = await firestoreMissionsService.createMission(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/missions/:id (Admin only)
 */
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const result = await firestoreMissionsService.updateMission(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/missions/:id (Admin only)
 */
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const result = await firestoreMissionsService.deleteMission(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
