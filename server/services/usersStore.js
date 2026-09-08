/**
 * ENGINEERVERSE — Centralized Users & Moderation Store
 * Pure JavaScript.
 * Manages registered community members, admin records, moderation status, and connection credits.
 */

import { AUTHORIZED_ADMIN_EMAIL } from '../middleware/auth.js';

class UsersStore {
  constructor() {
    this.users = new Map();
    this.auditLogs = [];

    // Pre-seed the sole authorized administrator record
    const adminUser = {
      uid: 'admin_sole_rajshree',
      email: AUTHORIZED_ADMIN_EMAIL.toLowerCase(),
      displayName: 'Rajshree (Admin)',
      role: 'admin',
      isAdmin: true,
      status: 'active', // 'active' | 'warned' | 'suspended'
      warningReason: null,
      warnedAt: null,
      suspendedAt: null,
      problemsCount: 0,
      solutionsCount: 0,
      supportsCount: 0,
      connectionCredits: 9999,
      createdAt: '2026-01-01T00:00:00.000Z',
      lastActiveAt: new Date().toISOString(),
    };
    this.users.set(adminUser.uid, adminUser);
    this.users.set(adminUser.email, adminUser);
  }

  /**
   * Finds or provisions a user record upon authenticated activity
   */
  getOrCreateUser(userObj) {
    if (!userObj || !userObj.uid) return null;

    const email = (userObj.email || '').toLowerCase();
    const uid = userObj.uid;

    let existing = this.users.get(uid) || (email ? this.users.get(email) : null);

    if (existing) {
      existing.lastActiveAt = new Date().toISOString();
      const isAdminUser = (existing.email || email) === AUTHORIZED_ADMIN_EMAIL.toLowerCase();
      if (isAdminUser) {
        existing.isAdmin = true;
        existing.role = 'admin';
        existing.connectionCredits = 9999;
      }
      if (userObj.displayName && !existing.displayName) {
        existing.displayName = userObj.displayName;
      }
      return existing;
    }

    const isAdmin = email === AUTHORIZED_ADMIN_EMAIL.toLowerCase();

    const newUser = {
      uid,
      email: email || `member_${uid}@engineerverse.local`,
      displayName: userObj.displayName || userObj.name || (email ? email.split('@')[0] : 'Community Engineer'),
      role: isAdmin ? 'admin' : 'member',
      isAdmin,
      status: 'active',
      warningReason: null,
      warnedAt: null,
      suspendedAt: null,
      problemsCount: 0,
      solutionsCount: 0,
      supportsCount: 0,
      connectionCredits: isAdmin ? 9999 : 5, // 9999 for admin, 5 free connection credits for community engineers
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    };

    this.users.set(uid, newUser);
    if (email) {
      this.users.set(email, newUser);
    }

    return newUser;
  }

  getUserByUid(uid) {
    return this.users.get(uid) || null;
  }

  getUserByEmail(email) {
    if (!email) return null;
    return this.users.get(email.toLowerCase()) || null;
  }

  getAllUsers() {
    const set = new Set();
    const list = [];
    for (const user of this.users.values()) {
      if (!set.has(user.uid)) {
        set.add(user.uid);
        list.push({ ...user });
      }
    }
    return list;
  }

  warnUser(uid, reason, moderatorId) {
    const user = this.users.get(uid);
    if (!user) return { success: false, error: 'User not found.' };

    if (user.isAdmin) {
      return { success: false, error: 'Cannot issue warning to administrator.' };
    }

    user.status = 'warned';
    user.warningReason = reason || 'Administrative warning regarding community guidelines compliance.';
    user.warnedAt = new Date().toISOString();

    this.logAudit({
      action: 'USER_WARNED',
      targetUid: uid,
      targetEmail: user.email,
      reason: user.warningReason,
      moderatorId,
      timestamp: new Date().toISOString(),
    });

    return { success: true, user: { ...user } };
  }

  suspendUser(uid, reason, moderatorId) {
    const user = this.users.get(uid);
    if (!user) return { success: false, error: 'User not found.' };

    if (user.isAdmin) {
      return { success: false, error: 'Cannot suspend administrator account.' };
    }

    user.status = 'suspended';
    user.suspendedReason = reason || 'Account suspended for terms violation.';
    user.suspendedAt = new Date().toISOString();

    this.logAudit({
      action: 'USER_SUSPENDED',
      targetUid: uid,
      targetEmail: user.email,
      reason: user.suspendedReason,
      moderatorId,
      timestamp: new Date().toISOString(),
    });

    return { success: true, user: { ...user } };
  }

  reactivateUser(uid, moderatorId) {
    const user = this.users.get(uid);
    if (!user) return { success: false, error: 'User not found.' };

    user.status = 'active';
    user.warningReason = null;
    user.warnedAt = null;
    user.suspendedAt = null;
    user.suspendedReason = null;

    this.logAudit({
      action: 'USER_REACTIVATED',
      targetUid: uid,
      targetEmail: user.email,
      moderatorId,
      timestamp: new Date().toISOString(),
    });

    return { success: true, user: { ...user } };
  }

  incrementProblemsCount(uid) {
    const user = this.users.get(uid);
    if (user) user.problemsCount = (user.problemsCount || 0) + 1;
  }

  decrementProblemsCount(uid) {
    const user = this.users.get(uid);
    if (user && user.problemsCount > 0) user.problemsCount -= 1;
  }

  incrementSupportsCount(uid) {
    const user = this.users.get(uid);
    if (user) user.supportsCount = (user.supportsCount || 0) + 1;
  }

  decrementSupportsCount(uid) {
    const user = this.users.get(uid);
    if (user && user.supportsCount > 0) user.supportsCount -= 1;
  }

  incrementSolutionsCount(uid) {
    const user = this.users.get(uid);
    if (user) user.solutionsCount = (user.solutionsCount || 0) + 1;
  }

  deductConnectionCredit(uid) {
    const user = this.users.get(uid);
    if (!user) return false;
    if (user.isAdmin) return true; // Admin has infinite credits
    if ((user.connectionCredits || 0) <= 0) return false;
    user.connectionCredits -= 1;
    return true;
  }

  setUserCredits(uid, amount, moderatorId) {
    const user = this.users.get(uid);
    if (!user) return { success: false, error: 'User not found.' };

    const parsed = Math.max(0, Math.min(99999, parseInt(amount, 10) || 0));
    user.connectionCredits = parsed;
    user.lastActiveAt = new Date().toISOString();

    this.logAudit({
      action: 'USER_CREDITS_ADJUSTED',
      targetUid: uid,
      targetEmail: user.email,
      newCredits: parsed,
      moderatorId,
      timestamp: new Date().toISOString(),
    });

    return { success: true, user: { ...user } };
  }

  updateUserProfile(uid, updates = {}) {
    const user = this.users.get(uid);
    if (!user) return null;

    if (updates.displayName && typeof updates.displayName === 'string') {
      user.displayName = updates.displayName.trim();
    }
    if (updates.bio !== undefined) {
      user.bio = updates.bio;
    }
    if (updates.discipline !== undefined) {
      user.discipline = updates.discipline;
    }
    if (updates.photoURL !== undefined) {
      user.photoURL = updates.photoURL;
    }
    if (updates.portfolioUrl !== undefined) {
      user.portfolioUrl = updates.portfolioUrl;
    }

    user.lastActiveAt = new Date().toISOString();
    return { ...user };
  }

  logAudit(event) {
    this.auditLogs.unshift({
      id: 'audit_' + Math.random().toString(36).substring(2, 10),
      ...event,
    });
    // Keep max 500 logs
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
  }

  getAuditLogs() {
    return [...this.auditLogs];
  }
}

export const usersStore = new UsersStore();
export default usersStore;
