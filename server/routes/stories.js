/**
 * ENGINEERVERSE — Engineer Stories Wall Router
 * Prompt: "What did engineering teach you?"
 * Pure JavaScript (ZERO TypeScript).
 *
 * Backed authoritatively by Firestore `stories` collection.
 */

import { Router } from 'express';
import { verifyToken, requireVerifiedIdentity, requireAuth } from '../middleware/auth.js';
import { submissionRateLimiter } from '../middleware/rateLimiter.js';
import * as firestoreStoriesService from '../services/firestoreStoriesService.js';

const router = Router();

router.use(verifyToken);

/**
 * GET /api/stories
 * Returns all approved community stories from Firestore.
 */
router.get('/', async (req, res) => {
  const currentUid = req.user && !req.user.isAnonymous ? req.user.uid : null;
  try {
    const approved = await firestoreStoriesService.getAllApproved(currentUid);
    res.json({
      success: true,
      stories: approved,
    });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/stories
 * Authenticated submission of engineering story to Firestore.
 */
router.post('/', requireVerifiedIdentity, submissionRateLimiter, async (req, res) => {
  const { author, discipline, quote } = req.body;

  if (!discipline || !quote) {
    return res.status(400).json({
      success: false,
      error: 'Discipline and story quote are required.',
    });
  }

  try {
    const result = await firestoreStoriesService.submitStory({
      author,
      discipline,
      quote,
      user: req.user,
    });

    if (!result.success) {
      return res.status(result.status || 400).json(result);
    }

    res.status(201).json({
      success: true,
      message: 'Your story has been recorded in the community archive.',
      story: result.story,
    });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/stories/:id/upvote
 * Upvote a story in Firestore (deterministic 1-per-user).
 */
router.patch('/:id/upvote', requireAuth, async (req, res) => {
  try {
    const result = await firestoreStoriesService.toggleUpvote(req.params.id, req.user);
    if (!result.success) {
      return res.status(result.status || 400).json(result);
    }
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

export default router;
