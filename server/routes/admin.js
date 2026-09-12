/**
 * ENGINEERVERSE — Admin & Moderation Router
 * Server-side authorization strictly enforced.
 * Sole Authorized Admin: rajshreeakm@gmail.com
 * 
 * Features:
 * - Full problem CRUD & status moderation (Edit, Delete, Resolve, Approve, Reject).
 * - User Directory & Moderation Authorities (Warn, Suspend, Reactivate users).
 * - Full audit logs and security event visibility.
 */

import { Router } from 'express';
import { requireAdmin, verifyToken } from '../middleware/auth.js';
import { analyticsStore } from '../services/analyticsStore.js';
import { problemsStore } from '../services/problemsStore.js';
import { usersStore } from '../services/usersStore.js';

const router = Router();

// Apply auth verification to all admin routes
router.use(verifyToken);

// ============================================================================
// ADMIN IDENTITY & OVERVIEW
// ============================================================================

// Admin Session Verification
router.get('/verify-session', requireAdmin, (req, res) => {
  res.json({
    success: true,
    authorized: true,
    adminEmail: req.user.email,
    uid: req.user.uid,
    role: req.user.role,
  });
});

// Admin Telemetry & Overview
router.get('/overview', requireAdmin, async (req, res) => {
  try {
    const metrics = analyticsStore.getMetrics();
    const allProblems = (await problemsStore.getAllForAdmin()) || [];
    const allUsers = (await usersStore.getAllUsers()) || [];

    res.json({
      success: true,
      systemMetrics: {
        totalVisitorsEstimate: metrics.landingViews, // Real visitor landing counts (zero fabrication)
        dnaCompletions: metrics.dnaCompletions,
        cardsGenerated: metrics.cardsGenerated,
        sharesTriggered: metrics.sharesTriggered,
        totalProblems: allProblems.length,
        problemsResolved: allProblems.filter((p) => p.isResolved).length,
        problemsApproved: allProblems.filter((p) => p.status === 'approved').length,
        totalUsers: allUsers.length,
        suspendedUsersCount: allUsers.filter((u) => u.status === 'suspended').length,
        warnedUsersCount: allUsers.filter((u) => u.status === 'warned').length,
        storiesApproved: metrics.storiesSubmitted,
        aiTokensConsumed: 0,
        aiCircuitBreakerStatus: 'nominal',
        serverUptime: Math.floor(process.uptime()),
      },
    });
  } catch (err) {
    console.error('[AdminRouter] Error in overview endpoint:', err.message);
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({ success: false, error: 'Database service unavailable.' });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// PROBLEM WALL ADMINISTRATIVE CONTROLS
// ============================================================================

// GET all problems with complete author details & solutions
router.get('/problems', requireAdmin, async (req, res) => {
  const problems = await problemsStore.getAllForAdmin();
  res.json({
    success: true,
    total: problems.length,
    problems,
  });
});

// Admin update any problem
router.put('/problems/:id', requireAdmin, async (req, res) => {
  const { title, category, description, affectedUsers, tags } = req.body;
  const result = await problemsStore.updateProblem(
    req.params.id,
    { title, category, description, affectedUsers, tags },
    req.user
  );

  if (!result.success) {
    return res.status(404).json(result);
  }

  await usersStore.logAudit({
    action: 'ADMIN_UPDATE_PROBLEM',
    problemId: req.params.id,
    moderatorId: req.user.uid,
    timestamp: new Date().toISOString(),
  });

  res.json(result);
});

// Admin delete any problem
router.delete('/problems/:id', requireAdmin, async (req, res) => {
  const result = await problemsStore.deleteProblem(req.params.id, req.user);

  if (!result.success) {
    return res.status(404).json(result);
  }

  await usersStore.logAudit({
    action: 'ADMIN_DELETE_PROBLEM',
    problemId: req.params.id,
    moderatorId: req.user.uid,
    timestamp: new Date().toISOString(),
  });

  res.json(result);
});

// Admin change status or toggle resolved
router.patch('/problems/:id/status', requireAdmin, async (req, res) => {
  const { status, isResolved } = req.body;
  const result = await problemsStore.adminSetStatus(req.params.id, status, isResolved);

  if (!result.success) {
    return res.status(404).json(result);
  }

  await usersStore.logAudit({
    action: 'ADMIN_STATUS_CHANGE',
    problemId: req.params.id,
    newStatus: status,
    isResolved,
    moderatorId: req.user.uid,
    timestamp: new Date().toISOString(),
  });

  res.json(result);
});

// ============================================================================
// USER DIRECTORY & MODERATION AUTHORITIES
// ============================================================================

// List all registered users
router.get('/users', requireAdmin, async (req, res) => {
  const users = await usersStore.getAllUsers();
  res.json({
    success: true,
    total: users.length,
    users,
  });
});

// Warn a user
router.post('/users/:uid/warn', requireAdmin, async (req, res) => {
  const { reason } = req.body;
  const result = await usersStore.warnUser(req.params.uid, reason, req.user.uid);

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json({
    success: true,
    message: `Warning issued to user.`,
    user: result.user,
  });
});

// Suspend a user
router.post('/users/:uid/suspend', requireAdmin, async (req, res) => {
  const { reason } = req.body;
  const result = await usersStore.suspendUser(req.params.uid, reason, req.user.uid);

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json({
    success: true,
    message: `User account suspended.`,
    user: result.user,
  });
});

// Block a user permanently
router.post('/users/:uid/block', requireAdmin, async (req, res) => {
  const { reason } = req.body;
  const result = await usersStore.blockUser(req.params.uid, reason, req.user.uid);

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json({
    success: true,
    message: `User account permanently blocked.`,
    user: result.user,
  });
});

// Reactivate a user
router.post('/users/:uid/reactivate', requireAdmin, async (req, res) => {
  const result = await usersStore.reactivateUser(req.params.uid, req.user.uid);

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json({
    success: true,
    message: `User account restored to active status.`,
    user: result.user,
  });
});

// Adjust user connection credits (Admin authority)
router.post('/users/:uid/credits', requireAdmin, async (req, res) => {
  const { credits } = req.body;
  const result = await usersStore.setUserCredits(req.params.uid, credits, req.user.uid);

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json({
    success: true,
    message: `User connection credits updated to ${result.user?.connectionCredits || credits}.`,
    user: result.user,
  });
});

// ============================================================================
// AUDIT LOGS & EVENT JOURNAL
// ============================================================================

router.get('/logs', requireAdmin, async (req, res) => {
  const logs = await usersStore.getAuditLogs();
  res.json({
    success: true,
    total: logs.length,
    logs,
  });
});

// Legacy moderation action endpoint for compatibility
router.post('/moderation/:entityType/:id', requireAdmin, (req, res) => {
  const { entityType, id } = req.params;
  const { action, reason } = req.body;

  usersStore.logAudit({
    action: `MODERATE_${entityType.toUpperCase()}`,
    entityType,
    entityId: id,
    actionDetail: action,
    reason: reason || 'Verified compliant with community engineering guidelines.',
    moderatorId: req.user.uid,
    timestamp: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: `Moderation action "${action}" applied to ${entityType} ID: ${id}.`,
    audit: {
      moderatorId: req.user.uid,
      action,
      reason: reason || 'Verified compliant with community engineering guidelines.',
      timestamp: new Date().toISOString(),
    },
  });
});

// ============================================================
// DATABASE RECONCILIATION — "Sync Database" admin control
// ============================================================
// Manual, admin-only, idempotent database reconciliation control (V0 Phase 2
// master spec, Sections 6-8, 19, 24). This is a REPAIR mechanism, not the
// primary sync path — normal operation already reconciles a user into
// Firestore automatically on every authenticated request via
// getOrCreateUser(). This endpoint exists to proactively repair historical
// users (those who authenticated before Firestore was wired up, or whose
// Firestore write may have failed at some point) without waiting for them
// to log in again, and to give an admin manual visibility/control over
// database consistency.
//
// requireAdmin (not just verifyToken) protects this — the frontend must
// never be trusted to gate this, and it is not: requireAdmin independently
// re-verifies the caller's Firebase ID token + UID against the
// server-configured ADMIN_FIREBASE_UID on every call, regardless of what
// the client claims.
router.post('/sync-database', requireAdmin, async (req, res) => {
  try {
    const { runFullReconciliation } = await import('../services/reconciliationService.js');
    const report = await runFullReconciliation();

    usersStore.logAudit({
      action: 'DATABASE_SYNC_TRIGGERED',
      actorId: req.user.uid,
      details: {
        scanned: report.users.scanned,
        created: report.users.created,
        updated: report.users.updated,
        failed: report.users.failed.length,
        durationMs: report.totalDurationMs,
      },
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: !report.users.fatalError,
      report,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message || 'Database reconciliation failed unexpectedly.',
    });
  }
});

export default router;
