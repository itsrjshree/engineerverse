/**
 * ENGINEERVERSE — The Problem Wall Router
 * Long-term community initiative: "India Still Has Problems. Engineers Still Have Work."
 * Note: Named "The Problem Wall" per section 12 of product architecture.
 * Unlimited dynamic capacity (from 10 to 100,000+ problems). Zero artificial 100-limit.
 * 
 * Strict Security Guarantees:
 * - Zero fake support counts. All counts reflect genuine authenticated user interactions.
 * - Submissions, support actions, and solution proposals strictly require authentication.
 * - Problem authors and administrators can edit, update, delete, and mark problems as resolved.
 * - Secure connection handshake system between problem submitters and engineers.
 */

import { Router } from 'express';
import { verifyToken, requireAuth } from '../middleware/auth.js';
import { submissionRateLimiter } from '../middleware/rateLimiter.js';
import { problemsStore } from '../services/problemsStore.js';

const router = Router();

// Apply token verification to all problem routes so req.user is always populated
router.use(verifyToken);

// ============================================================================
// PUBLIC / GENERAL DISCOVERY ENDPOINTS
// ============================================================================

/**
 * GET /api/problems
 * List approved problems with category & search filters.
 * Returns real supporter counts, resolution status, and whether caller has supported.
 */
router.get('/', (req, res) => {
  const { category, search } = req.query;
  const currentUid = req.user && !req.user.isAnonymous ? req.user.uid : null;

  const results = problemsStore.getAllApproved(currentUid, { category, search });

  res.json({
    success: true,
    wallName: 'The Problem Wall',
    initiative: 'The Problem Wall',
    tagline: 'India Still Has Problems. Engineers Still Have Work.',
    total: results.length,
    problems: results,
  });
});

// ============================================================================
// USER SPECIFIC ENDPOINTS (DASHBOARD) - Must be before /:id parameterized routes
// ============================================================================

/**
 * GET /api/problems/user/my-problems
 * Returns all problems created by the logged-in user, along with solution proposals received.
 */
router.get('/user/my-problems', requireAuth, (req, res) => {
  const myProblems = problemsStore.getByAuthor(req.user.uid);

  res.json({
    success: true,
    problems: myProblems,
    count: myProblems.length,
  });
});

/**
 * GET /api/problems/user/my-supported
 * Returns all problems supported by the logged-in user.
 */
router.get('/user/my-supported', requireAuth, (req, res) => {
  const supported = problemsStore.getSupportedByUser(req.user.uid);

  res.json({
    success: true,
    problems: supported,
    count: supported.length,
  });
});

/**
 * GET /api/problems/user/my-solutions
 * Returns all solution proposals submitted by the logged-in user.
 */
router.get('/user/my-solutions', requireAuth, (req, res) => {
  const mySolutions = problemsStore.getSolutionsProposedByUser(req.user.uid);

  res.json({
    success: true,
    solutions: mySolutions,
    count: mySolutions.length,
  });
});

// ============================================================================
// CREATION, MUTATION & INTERACTION ENDPOINTS
// ============================================================================

/**
 * POST /api/problems
 * Strictly authenticated problem submission.
 * Zero fake numbers: starts with 0 supporters.
 */
router.post('/', requireAuth, submissionRateLimiter, (req, res) => {
  const { title, category, description, affectedUsers, tags } = req.body;

  if (!title || !title.trim() || !category || !category.trim() || !description || !description.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: title, category, and description are mandatory.',
    });
  }

  try {
    const created = problemsStore.createProblem({
      title,
      category,
      description,
      affectedUsers,
      tags,
      user: req.user,
    });

    res.status(201).json({
      success: true,
      message: 'Problem submitted successfully! It is now live on The Problem Wall and in your Dashboard.',
      problem: created,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to submit problem.',
    });
  }
});

/**
 * GET /api/problems/:id
 * Retrieve a single problem by ID.
 */
router.get('/:id', (req, res) => {
  const currentUid = req.user && !req.user.isAnonymous ? req.user.uid : null;
  const problem = problemsStore.getById(req.params.id, currentUid);

  if (!problem) {
    return res.status(404).json({ success: false, error: 'Problem not found.' });
  }

  res.json({ success: true, problem });
});

/**
 * PUT /api/problems/:id
 * Edit an existing problem. Author or Admin only.
 */
router.put('/:id', requireAuth, (req, res) => {
  const { title, category, description, affectedUsers, tags } = req.body;

  const result = problemsStore.updateProblem(
    req.params.id,
    { title, category, description, affectedUsers, tags },
    req.user
  );

  if (!result.success) {
    const status = result.error.includes('Unauthorized') ? 403 : 404;
    return res.status(status).json(result);
  }

  res.json(result);
});

/**
 * DELETE /api/problems/:id
 * Delete a problem. Author or Admin only.
 */
router.delete('/:id', requireAuth, (req, res) => {
  const result = problemsStore.deleteProblem(req.params.id, req.user);

  if (!result.success) {
    const status = result.error.includes('Unauthorized') ? 403 : 404;
    return res.status(status).json(result);
  }

  res.json(result);
});

/**
 * PATCH /api/problems/:id/resolve
 * Mark a problem as Resolved or Active. Author or Admin only.
 */
router.patch('/:id/resolve', requireAuth, (req, res) => {
  const { isResolved } = req.body;
  const result = problemsStore.toggleResolveProblem(req.params.id, req.user, isResolved);

  if (!result.success) {
    const status = result.error.includes('Unauthorized') ? 403 : 404;
    return res.status(status).json(result);
  }

  res.json(result);
});

/**
 * POST /api/problems/:id/support
 * Toggle support (upvote/remove upvote) by authenticated user.
 * Prevents double-voting and eliminates fake metrics.
 */
router.post('/:id/support', requireAuth, (req, res) => {
  const result = problemsStore.toggleSupport(req.params.id, req.user);

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
});

/**
 * POST /api/problems/:id/solutions
 * Propose a solution to an existing problem and request to connect with author.
 * Strictly requires authentication and deducts 1 connection credit.
 */
router.post('/:id/solutions', requireAuth, (req, res) => {
  const { proposedSolution, contactPitch, estimatedTimeline, portfolioUrl } = req.body;

  if (!proposedSolution || !proposedSolution.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Please describe your proposed technical approach or solution.',
    });
  }

  const result = problemsStore.proposeSolution(
    req.params.id,
    { proposedSolution, contactPitch, estimatedTimeline, portfolioUrl },
    req.user
  );

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.status(201).json(result);
});

/**
 * PATCH /api/problems/:id/solutions/:solutionId/connect
 * Author or Admin accepts/declines a solution connection request.
 */
router.patch('/:id/solutions/:solutionId/connect', requireAuth, (req, res) => {
  const { action } = req.body; // 'connect' | 'decline'

  const result = problemsStore.respondToSolution(
    req.params.id,
    req.params.solutionId,
    action,
    req.user
  );

  if (!result.success) {
    const status = result.error.includes('Unauthorized') ? 403 : 404;
    return res.status(status).json(result);
  }

  res.json(result);
});

export default router;
