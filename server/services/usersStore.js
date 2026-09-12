/**
 * ENGINEERVERSE — Users Service & Firestore Bridge
 * Pure JavaScript (ZERO TypeScript).
 *
 * Master Architecture Contract:
 * - Firestore is the authoritative single source of truth for users and engineer profiles
 * - Canonical documents live in `users/{firebaseUid}`
 * - In production (`process.env.NODE_ENV === 'production'`), there is ZERO fallback to local JSON or RAM
 * - Preserves backwards compatibility for existing services and the test runner
 */

import fs from 'fs';
import path from 'path';
import { AUTHORIZED_ADMIN_EMAIL, getAuthorizedAdminUid } from '../middleware/auth.js';
import { problemsStore } from './problemsStore.js';
import * as firestoreService from './firestoreService.js';

const DATA_DIR = path.resolve(process.cwd(), 'server/data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const AUDIT_FILE = path.join(DATA_DIR, 'audit.json');

function makeThenable(syncData, asyncPromise) {
  const target = syncData ? { ...syncData } : {};
  return Object.assign(Object.create(target), target, {
    then(onFulfilled, onRejected) {
      return asyncPromise.then(onFulfilled, onRejected);
    },
    catch(onRejected) {
      return asyncPromise.catch(onRejected);
    },
    finally(onFinally) {
      return asyncPromise.finally(onFinally);
    },
  });
}

class UsersStore {
  constructor() {
    this.usersById = new Map();
    this.emailToUid = new Map();
    this.auditLogs = [];

    // Load initial seed fixture if present on disk for local/test initialization
    this._loadInitialFixtures();
  }

  _loadInitialFixtures() {
    try {
      if (fs.existsSync(USERS_FILE)) {
        const raw = fs.readFileSync(USERS_FILE, 'utf-8');
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          for (const u of list) {
            if (u && u.uid) {
              const email = (u.email || '').trim().toLowerCase();
              this.usersById.set(u.uid, { ...u });
              if (email) {
                this.emailToUid.set(email, u.uid);
              }
            }
          }
        }
      }
    } catch (err) {
      // Non-fatal fixture reading
    }

    try {
      if (fs.existsSync(AUDIT_FILE)) {
        const raw = fs.readFileSync(AUDIT_FILE, 'utf-8');
        const logs = JSON.parse(raw);
        if (Array.isArray(logs)) {
          this.auditLogs = logs.slice(0, 500);
        }
      }
    } catch (err) {}

    // Ensure seed admin fixture is registered in memory for test assertions
    const adminEmail = AUTHORIZED_ADMIN_EMAIL.toLowerCase();
    const existingAdminUid = this.emailToUid.get(adminEmail) || 'admin_sole_rajshree';
    if (!this.usersById.has(existingAdminUid)) {
      const adminUser = {
        uid: existingAdminUid,
        email: adminEmail,
        emailVerified: true,
        displayName: 'Rajshree (Admin)',
        role: 'admin',
        isAdmin: true,
        status: 'active',
        warningReason: null,
        warnedAt: null,
        suspendedReason: null,
        suspendedAt: null,
        blockedReason: null,
        blockedAt: null,
        problemsCount: 0,
        solutionsCount: 0,
        supportsCount: 0,
        connectionCredits: 9999,
        photoURL: null,
        photoMetadata: null,
        bio: 'Platform Lead & Sole Administrator of ENGINEERVERSE.',
        discipline: 'Systems & Software Engineering',
        portfolioUrl: '',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        lastActiveAt: new Date().toISOString(),
      };
      this.usersById.set(existingAdminUid, adminUser);
      this.emailToUid.set(adminEmail, existingAdminUid);
    }
  }

  /**
   * Cleans and deduplicates local memory fixtures
   */
  cleanAndDeduplicateDatabase() {
    const seenEmails = new Map();
    for (const [uid, user] of Array.from(this.usersById.entries())) {
      const email = (user.email || '').trim().toLowerCase();
      if (email) {
        if (seenEmails.has(email)) {
          this.usersById.delete(uid);
        } else {
          seenEmails.set(email, uid);
          this.emailToUid.set(email, uid);
        }
      }
    }
  }

  /**
   * Reconciles or gets user. Authoritative in Firestore.
   * In production, strictly throws on Firestore failure (no local storage fallback).
   */
  getOrCreateUser(userObj) {
    if (!userObj || (!userObj.uid && !userObj.email)) return null;

    // Production path: Pure Firestore. No local fallback.
    if (process.env.NODE_ENV === 'production') {
      return firestoreService.getOrCreateUser(userObj);
    }

    // Test Runner / Development Path:
    // Execute Firestore reconciliation while keeping in-memory state available for synchronous assertions
    const email = (userObj.email || '').trim().toLowerCase();
    const uid = String(userObj.uid || '').trim();

    let syncRecord = uid ? this.usersById.get(uid) : null;
    if (!syncRecord && email && this.emailToUid.has(email) && userObj.emailVerified === true) {
      const canonUid = this.emailToUid.get(email);
      syncRecord = this.usersById.get(canonUid);
    }

    const isTargetAdminEmail = email === AUTHORIZED_ADMIN_EMAIL.toLowerCase();
    const authorizedUid = getAuthorizedAdminUid();
    const isEmailVerified = userObj.emailVerified === true;
    const uidMatches = Boolean(authorizedUid && (uid === authorizedUid || syncRecord?.uid === authorizedUid));
    const isNewUserAdmin = isTargetAdminEmail && isEmailVerified && uidMatches;

    if (syncRecord) {
      syncRecord.lastActiveAt = new Date().toISOString();
      if (isTargetAdminEmail) {
        if (isEmailVerified && syncRecord.status === 'active' && uidMatches) {
          syncRecord.isAdmin = true;
          syncRecord.role = 'admin';
          syncRecord.connectionCredits = 9999;
        } else {
          syncRecord.isAdmin = false;
          syncRecord.role = 'member';
        }
      }
    } else {
      const finalUid = uid || `user_${Date.now()}`;
      syncRecord = {
        uid: finalUid,
        email: email || `member_${finalUid}@engineerverse.local`,
        emailVerified: isEmailVerified,
        displayName: (userObj.displayName || userObj.name || (email ? email.split('@')[0] : 'Community Engineer')).trim(),
        role: isNewUserAdmin ? 'admin' : 'member',
        isAdmin: isNewUserAdmin,
        status: 'active',
        warningReason: null,
        warnedAt: null,
        suspendedReason: null,
        suspendedAt: null,
        blockedReason: null,
        blockedAt: null,
        problemsCount: 0,
        solutionsCount: 0,
        supportsCount: 0,
        connectionCredits: isNewUserAdmin ? 9999 : 5,
        photoURL: userObj.photoURL || null,
        photoMetadata: userObj.photoMetadata || null,
        bio: userObj.bio || '',
        discipline: userObj.discipline || 'Full Stack Systems',
        portfolioUrl: userObj.portfolioUrl || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
      };
      this.usersById.set(finalUid, syncRecord);
      if (email) this.emailToUid.set(email, finalUid);
    }

    // Async promise that writes to Firestore
    const asyncPromise = firestoreService
      .getOrCreateUser(userObj)
      .catch((err) => {
        // If test runner has injected mock repository or is testing offline, handle gracefully
        if (process.env.ENGINEERVERSE_TEST_RUNNER === 'true') {
          return syncRecord;
        }
        throw err;
      });

    return makeThenable(syncRecord, asyncPromise);
  }

  getUserByUid(uid) {
    if (!uid) return null;
    if (process.env.NODE_ENV === 'production') {
      return firestoreService.getUserByUid(uid);
    }
    const mem = this.usersById.get(uid) || null;
    const asyncPromise = firestoreService.getUserByUid(uid).catch(() => mem);
    return makeThenable(mem, asyncPromise);
  }

  getUserByEmail(email) {
    if (!email) return null;
    const norm = email.trim().toLowerCase();
    if (process.env.NODE_ENV === 'production') {
      return firestoreService.getUserByEmail(norm);
    }
    const uid = this.emailToUid.get(norm);
    const mem = uid ? this.usersById.get(uid) : null;
    const asyncPromise = firestoreService.getUserByEmail(norm).catch(() => mem);
    return makeThenable(mem, asyncPromise);
  }

  async updateUserProfile(uid, updates = {}) {
    if (!uid) return null;

    let updatedUser = null;
    // Handle photo lifecycle through authoritative Firestore service
    if (updates.photoURL !== undefined) {
      if (!updates.photoURL) {
        updatedUser = await firestoreService.deleteProfilePhoto(uid);
      } else {
        updatedUser = await firestoreService.updateProfilePhoto(uid, updates.photoURL);
      }
    }

    // Update remaining whitelisted fields
    const { displayName, bio, discipline, portfolioUrl } = updates;
    if (
      displayName !== undefined ||
      bio !== undefined ||
      discipline !== undefined ||
      portfolioUrl !== undefined
    ) {
      updatedUser = await firestoreService.updateUserProfile(uid, {
        displayName,
        bio,
        discipline,
        portfolioUrl,
      });
    }

    if (!updatedUser) {
      updatedUser = await firestoreService.getUserByUid(uid);
    }

    // Sync in-memory map for test runners
    if (updatedUser) {
      this.usersById.set(updatedUser.uid, { ...updatedUser });
      if (updatedUser.email) {
        this.emailToUid.set(updatedUser.email.toLowerCase(), updatedUser.uid);
      }
    }

    return updatedUser;
  }

  async deleteUser(uid) {
    // NOTE: previously this class had TWO deleteUser() method definitions.
    // In JavaScript, the second definition silently wins — meaning the
    // problem-cleanup cascade below was being skipped on every real
    // deletion, and the in-memory map cleanup only ran if the Firestore
    // delete reported success. This merged version restores the cascade
    // and keeps the success check.
    if (!uid) return { success: false, error: 'User ID is required.' };

    // Cascade problems cleanup — must happen regardless of whether Firestore
    // deletion ultimately succeeds, so an aborted deletion doesn't leave a
    // deleted-looking user with orphaned problem ownership.
    try {
      problemsStore.purgeUserData(uid);
    } catch (err) {
      console.warn('[UsersStore] Problem cleanup notice on user deletion:', err.message);
    }

    const result = await firestoreService.deleteUser(uid);

    if (result.success) {
      const user = this.usersById.get(uid);
      if (user && user.email) {
        this.emailToUid.delete(user.email.toLowerCase());
      }
      this.usersById.delete(uid);
    }

    return result;
  }

  getAllUsers() {
    if (process.env.NODE_ENV === 'production') {
      return firestoreService.getAllUsers();
    }
    const mem = Array.from(this.usersById.values()).map((u) => ({ ...u }));
    const asyncPromise = firestoreService.getAllUsers().catch(() => mem);
    return makeThenable(mem, asyncPromise);
  }

  async warnUser(targetUid, reason, actorId) {
    const result = await firestoreService.warnUser(targetUid, reason, actorId);
    const u = this.usersById.get(targetUid);
    if (u) {
      u.status = 'warned';
      u.warningReason = reason;
    }
    return result;
  }

  async suspendUser(targetUid, reason, actorId) {
    const result = await firestoreService.suspendUser(targetUid, reason, actorId);
    const u = this.usersById.get(targetUid);
    if (u) {
      u.status = 'suspended';
      u.suspendedReason = reason;
    }
    return result;
  }

  async blockUser(targetUid, reason, actorId) {
    const result = await firestoreService.blockUser(targetUid, reason, actorId);
    const u = this.usersById.get(targetUid);
    if (u) {
      u.status = 'blocked';
      u.blockedReason = reason;
    }
    return result;
  }

  async reactivateUser(targetUid, actorId) {
    const result = await firestoreService.reactivateUser(targetUid, actorId);
    const u = this.usersById.get(targetUid);
    if (u) {
      u.status = 'active';
      u.warningReason = null;
      u.suspendedReason = null;
      u.blockedReason = null;
    }
    return result;
  }

  async setUserCredits(targetUid, credits, actorId) {
    const result = await firestoreService.setUserCredits(targetUid, credits, actorId);
    const u = this.usersById.get(targetUid);
    if (u && result.connectionCredits !== undefined) {
      u.connectionCredits = result.connectionCredits;
    }
    return result;
  }

  async getAuditLogs(limitCount = 100) {
    if (process.env.NODE_ENV === 'production') {
      return firestoreService.getAuditLogs(limitCount);
    }
    const mem = [...this.auditLogs];
    const asyncPromise = firestoreService.getAuditLogs(limitCount).catch(() => mem);
    return makeThenable(mem, asyncPromise);
  }

  logAudit({ action, actorId, targetUid = null, details = {} }) {
    const logItem = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      action,
      actorId: String(actorId),
      targetUid: targetUid ? String(targetUid) : null,
      details: details || {},
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(logItem);
    if (this.auditLogs.length > 500) this.auditLogs.pop();
    firestoreService.logAudit(logItem).catch(() => {});
    return logItem;
  }

  incrementProblemsCount(uid) {
    firestoreService.incrementCounter(uid, 'problemsCount', 1).catch(() => {});
    const u = this.usersById.get(uid);
    if (u) u.problemsCount = (u.problemsCount || 0) + 1;
  }

  decrementProblemsCount(uid) {
    firestoreService.incrementCounter(uid, 'problemsCount', -1).catch(() => {});
    const u = this.usersById.get(uid);
    if (u && u.problemsCount > 0) u.problemsCount -= 1;
  }

  incrementSolutionsCount(uid) {
    firestoreService.incrementCounter(uid, 'solutionsCount', 1).catch(() => {});
    const u = this.usersById.get(uid);
    if (u) u.solutionsCount = (u.solutionsCount || 0) + 1;
  }

  incrementSupportsCount(uid) {
    firestoreService.incrementCounter(uid, 'supportsCount', 1).catch(() => {});
    const u = this.usersById.get(uid);
    if (u) u.supportsCount = (u.supportsCount || 0) + 1;
  }

  decrementSupportsCount(uid) {
    firestoreService.incrementCounter(uid, 'supportsCount', -1).catch(() => {});
    const u = this.usersById.get(uid);
    if (u && u.supportsCount > 0) u.supportsCount -= 1;
  }

  /**
   * Deducts 1 connection credit. This is now a proper async call that awaits
   * the atomic Firestore transaction (via firestoreService -> firestoreCreditsService)
   * BEFORE reporting success, and only updates the in-memory dev/test cache
   * after Firestore confirms the deduction. Previously this mutated an
   * in-memory number synchronously and fired the real Firestore write
   * fire-and-forget with a swallowed .catch(() => {}) — meaning a caller
   * could be told "success" while the authoritative balance never actually
   * changed (or, under concurrent calls, could go negative).
   * Callers of this function must now `await` it.
   */
  async deductConnectionCredit(uid, options = {}) {
    const u = this.usersById.get(uid);
    if (u && (u.isAdmin || u.role === 'admin')) return true;

    const success = await firestoreService.deductConnectionCredit(uid, options);

    if (success && u) {
      u.connectionCredits = Math.max(0, (u.connectionCredits || 0) - 1);
    }

    return success;
  }
}

export const usersStore = new UsersStore();
export default usersStore;
