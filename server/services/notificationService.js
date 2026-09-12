/**
 * ENGINEERVERSE — In-App Notifications Service
 * Pure JavaScript (Rule 1).
 * 
 * Backed authoritatively by Firestore `notifications` collection:
 * notifications/{notificationId}
 * - id: string
 * - recipientUid: string (the user who receives the alert)
 * - actorUid: string (who triggered it, e.g. solver or author)
 * - actorName: string
 * - type: 'PROPOSAL_RECEIVED' | 'CONNECTION_ACCEPTED' | 'SYSTEM_ALERT'
 * - title: string
 * - message: string
 * - referenceType: 'problem' | 'solution' | 'connection'
 * - referenceId: string
 * - isRead: boolean
 * - createdAt: ISO string
 */

import { getFirestoreInstance, isFirestoreConfigured } from './firestoreService.js';

// In-memory fallback for local dev / test runners when Firestore is offline
const inMemoryNotifications = new Map();

/**
 * Creates an in-app notification document for a user.
 */
export async function createNotification({
  recipientUid,
  actorUid,
  actorName,
  type,
  title,
  message,
  referenceType,
  referenceId,
}) {
  if (!recipientUid) return { success: false, error: 'Recipient UID is required.' };

  // Do not notify a user about their own actions
  if (recipientUid === actorUid) {
    return { success: true, skipped: true };
  }

  const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const record = {
    id: notificationId,
    recipientUid,
    actorUid: actorUid || null,
    actorName: actorName || 'An Engineer',
    type: type || 'SYSTEM_ALERT',
    title: title || 'New Notification',
    message: message || '',
    referenceType: referenceType || 'general',
    referenceId: referenceId || null,
    isRead: false,
    createdAt: now,
  };

  if (!isFirestoreConfigured()) {
    const list = inMemoryNotifications.get(recipientUid) || [];
    list.unshift(record);
    inMemoryNotifications.set(recipientUid, list);
    return { success: true, notification: record };
  }

  try {
    const db = getFirestoreInstance();
    await db.collection('notifications').doc(notificationId).set(record);
    return { success: true, notification: record };
  } catch (err) {
    console.error(`[NotificationService] Failed to create notification for ${recipientUid}:`, err.message);
    // Graceful fallback to memory in dev/test
    const list = inMemoryNotifications.get(recipientUid) || [];
    list.unshift(record);
    inMemoryNotifications.set(recipientUid, list);
    return { success: true, notification: record, fallback: true };
  }
}

/**
 * Retrieves notifications for an authenticated user.
 */
export async function getNotificationsForUser(recipientUid, { limit = 30, unreadOnly = false } = {}) {
  if (!recipientUid) return [];

  if (!isFirestoreConfigured()) {
    let list = inMemoryNotifications.get(recipientUid) || [];
    if (unreadOnly) list = list.filter((n) => !n.isRead);
    return list.slice(0, limit);
  }

  try {
    const db = getFirestoreInstance();
    let query = db.collection('notifications').where('recipientUid', '==', recipientUid);
    if (unreadOnly) {
      query = query.where('isRead', '==', false);
    }
    const snap = await query.get();

    const results = [];
    snap.forEach((doc) => {
      results.push({ id: doc.id, ...doc.data() });
    });

    // Sort newest first
    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return results.slice(0, limit);
  } catch (err) {
    console.warn(`[NotificationService] Error reading notifications for ${recipientUid}:`, err.message);
    let list = inMemoryNotifications.get(recipientUid) || [];
    if (unreadOnly) list = list.filter((n) => !n.isRead);
    return list.slice(0, limit);
  }
}

/**
 * Marks a notification as read.
 */
export async function markAsRead(notificationId, recipientUid) {
  if (!notificationId || !recipientUid) {
    return { success: false, error: 'Missing notificationId or recipientUid.' };
  }

  if (!isFirestoreConfigured()) {
    const list = inMemoryNotifications.get(recipientUid) || [];
    const item = list.find((n) => n.id === notificationId);
    if (item) item.isRead = true;
    return { success: true };
  }

  try {
    const db = getFirestoreInstance();
    const docRef = db.collection('notifications').doc(notificationId);
    const snap = await docRef.get();
    if (!snap.exists) {
      return { success: false, error: 'Notification not found.', status: 404 };
    }
    const data = snap.data();
    if (data.recipientUid !== recipientUid) {
      return { success: false, error: 'Unauthorized.', status: 403 };
    }

    await docRef.update({ isRead: true, readAt: new Date().toISOString() });
    return { success: true };
  } catch (err) {
    console.error(`[NotificationService] Error marking notification read:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Marks all notifications for a user as read.
 */
export async function markAllAsRead(recipientUid) {
  if (!recipientUid) return { success: false, error: 'Recipient UID is required.' };

  if (!isFirestoreConfigured()) {
    const list = inMemoryNotifications.get(recipientUid) || [];
    list.forEach((n) => (n.isRead = true));
    return { success: true };
  }

  try {
    const db = getFirestoreInstance();
    const snap = await db.collection('notifications').where('recipientUid', '==', recipientUid).where('isRead', '==', false).get();

    const batch = db.batch();
    const now = new Date().toISOString();
    snap.forEach((doc) => {
      batch.update(doc.ref, { isRead: true, readAt: now });
    });
    await batch.commit();
    return { success: true, updatedCount: snap.size };
  } catch (err) {
    console.error(`[NotificationService] Error marking all notifications read:`, err.message);
    return { success: false, error: err.message };
  }
}
