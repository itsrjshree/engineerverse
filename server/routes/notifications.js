/**
 * ENGINEERVERSE — Notifications Router
 * Allows authenticated users to view in-app notifications and mark them as read.
 */

import { Router } from 'express';
import { verifyToken, requireAuth } from '../middleware/auth.js';
import * as notificationService from '../services/notificationService.js';

const router = Router();

router.use(verifyToken);
router.use(requireAuth);

/**
 * GET /api/notifications
 * Get user's notifications.
 */
router.get('/', async (req, res) => {
  const unreadOnly = req.query.unread === 'true';
  const limit = parseInt(req.query.limit, 10) || 30;

  try {
    const notifications = await notificationService.getNotificationsForUser(req.user.uid, {
      limit,
      unreadOnly,
    });
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    res.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read.
 */
router.patch('/:id/read', async (req, res) => {
  try {
    const result = await notificationService.markAsRead(req.params.id, req.user.uid);
    if (!result.success) {
      return res.status(result.status || 400).json(result);
    }
    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/notifications/mark-all-read
 * Mark all user notifications as read.
 */
router.post('/mark-all-read', async (req, res) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.uid);
    if (!result.success) {
      return res.status(result.status || 400).json(result);
    }
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

export default router;
