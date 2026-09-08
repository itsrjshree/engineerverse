/**
 * ENGINEERVERSE — High-Reliability, Persistent & Deduplicated Users Store
 * Pure JavaScript.
 * Strictly enforces:
 * 1. Zero duplicate users (canonical 1:1 UID/email indexing, seamless identity reconciliation)
 * 2. Automatic deletion of previous avatar images on update or removal (zero orphan files)
 * 3. Real-time complete account deletion (purges user record, avatar file, and problem data)
 * 4. Resilient file-backed persistence (server/data/users.json with atomic tmp+rename writes)
 * 5. Full backwards compatibility with all administrative and moderation workflows
 */

import fs from 'fs';
import path from 'path';
import { AUTHORIZED_ADMIN_EMAIL } from '../middleware/auth.js';
import { problemsStore } from './problemsStore.js';
import { uploadImageToCloudinary, deleteImageFromCloudinary } from './cloudinaryService.js';

const DATA_DIR = path.resolve(process.cwd(), 'server/data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const AUDIT_FILE = path.join(DATA_DIR, 'audit.json');
const AVATARS_DIR = path.resolve(process.cwd(), 'server/storage/avatars');

class UsersStore {
  constructor() {
    this.usersById = new Map();
    this.emailToUid = new Map();
    this.auditLogs = [];
    this._saveTimer = null;

    // Ensure required storage directories exist
    this._ensureDirectories();

    // Load persisted state from disk or initialize
    this._loadFromDisk();

    // Perform database health check & deduplication on boot
    this.cleanAndDeduplicateDatabase();
  }

  _ensureDirectories() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (!fs.existsSync(AVATARS_DIR)) {
        fs.mkdirSync(AVATARS_DIR, { recursive: true });
      }
    } catch (err) {
      console.warn('[UsersStore] Failed to ensure storage directories:', err.message);
    }
  }

  _loadFromDisk() {
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
      console.warn('[UsersStore] Error loading users from disk:', err.message);
    }

    try {
      if (fs.existsSync(AUDIT_FILE)) {
        const rawAudit = fs.readFileSync(AUDIT_FILE, 'utf-8');
        const logs = JSON.parse(rawAudit);
        if (Array.isArray(logs)) {
          this.auditLogs = logs.slice(0, 500);
        }
      }
    } catch (err) {
      console.warn('[UsersStore] Error loading audit logs from disk:', err.message);
    }

    // Ensure pre-seeded admin user always exists
    const adminEmail = AUTHORIZED_ADMIN_EMAIL.toLowerCase();
    const existingAdminUid = this.emailToUid.get(adminEmail);
    if (!existingAdminUid) {
      const adminUser = {
        uid: 'admin_sole_rajshree',
        email: adminEmail,
        displayName: 'Rajshree (Admin)',
        role: 'admin',
        isAdmin: true,
        status: 'active',
        warningReason: null,
        warnedAt: null,
        suspendedAt: null,
        problemsCount: 0,
        solutionsCount: 0,
        supportsCount: 0,
        connectionCredits: 9999,
        photoURL: null,
        bio: 'Platform Lead & Sole Administrator of ENGINEERVERSE.',
        discipline: 'Systems & Software Engineering',
        portfolioUrl: '',
        createdAt: '2026-01-01T00:00:00.000Z',
        lastActiveAt: new Date().toISOString(),
      };
      this.usersById.set(adminUser.uid, adminUser);
      this.emailToUid.set(adminEmail, adminUser.uid);
      this._saveToDiskImmediate();
    } else {
      const adminObj = this.usersById.get(existingAdminUid);
      if (adminObj) {
        adminObj.isAdmin = true;
        adminObj.role = 'admin';
        adminObj.connectionCredits = 9999;
      }
    }
  }

  _scheduleSave() {
    if (this._saveTimer) return;
    this._saveTimer = setTimeout(() => {
      this._saveTimer = null;
      this._saveToDiskImmediate();
    }, 200);
  }

  _saveToDiskImmediate() {
    this._ensureDirectories();
    try {
      const userList = Array.from(this.usersById.values());
      const tmpFile = `${USERS_FILE}.tmp_${Date.now()}`;
      fs.writeFileSync(tmpFile, JSON.stringify(userList, null, 2), 'utf-8');
      fs.renameSync(tmpFile, USERS_FILE);

      const auditTmp = `${AUDIT_FILE}.tmp_${Date.now()}`;
      fs.writeFileSync(auditTmp, JSON.stringify(this.auditLogs, null, 2), 'utf-8');
      fs.renameSync(auditTmp, AUDIT_FILE);
    } catch (err) {
      console.error('[UsersStore] Failed to write persistent data to disk:', err.message);
    }
  }

  /**
   * Cleans database, eliminates duplicate entries, and removes orphaned avatar files.
   */
  cleanAndDeduplicateDatabase() {
    const seenEmails = new Map();
    let duplicatesRemoved = 0;

    for (const [uid, user] of Array.from(this.usersById.entries())) {
      const email = (user.email || '').trim().toLowerCase();
      if (email) {
        if (seenEmails.has(email)) {
          // Merge duplicate into canonical record
          const canonicalUid = seenEmails.get(email);
          const canonical = this.usersById.get(canonicalUid);
          if (canonical) {
            canonical.connectionCredits = Math.max(canonical.connectionCredits || 0, user.connectionCredits || 0);
            canonical.problemsCount = (canonical.problemsCount || 0) + (user.problemsCount || 0);
            canonical.solutionsCount = (canonical.solutionsCount || 0) + (user.solutionsCount || 0);
            canonical.supportsCount = (canonical.supportsCount || 0) + (user.supportsCount || 0);
            if (!canonical.photoURL && user.photoURL) canonical.photoURL = user.photoURL;
            if (!canonical.bio && user.bio) canonical.bio = user.bio;
          }
          this._deleteAvatarFilesForUid(uid);
          this.usersById.delete(uid);
          duplicatesRemoved++;
        } else {
          seenEmails.set(email, uid);
          this.emailToUid.set(email, uid);
        }
      }
    }

    // Garbage-collect orphaned avatar files on disk
    try {
      if (fs.existsSync(AVATARS_DIR)) {
        const files = fs.readdirSync(AVATARS_DIR);
        for (const file of files) {
          const dotIdx = file.indexOf('.');
          const fileUid = dotIdx !== -1 ? file.substring(0, dotIdx) : file;
          if (!this.usersById.has(fileUid)) {
            const orphanPath = path.join(AVATARS_DIR, file);
            try {
              fs.unlinkSync(orphanPath);
            } catch {}
          }
        }
      }
    } catch {}

    if (duplicatesRemoved > 0) {
      this._saveToDiskImmediate();
      console.log(`[UsersStore] Deduplication cleaned up ${duplicatesRemoved} duplicate user record(s).`);
    }
  }

  /**
   * Helper to permanently delete avatar files from disk for a given user.
   */
  _deleteAvatarFilesForUid(uid) {
    if (!uid) return;
    const cleanUid = String(uid).replace(/[^a-zA-Z0-9_-]/g, '');
    if (!cleanUid) return;

    try {
      if (fs.existsSync(AVATARS_DIR)) {
        const files = fs.readdirSync(AVATARS_DIR);
        for (const file of files) {
          if (file.startsWith(`${cleanUid}.`)) {
            const filePath = path.join(AVATARS_DIR, file);
            try {
              fs.unlinkSync(filePath);
            } catch (err) {
              console.warn(`[UsersStore] Could not unlink avatar ${file}:`, err.message);
            }
          }
        }
      }
    } catch (err) {
      console.warn('[UsersStore] Error inspecting avatar directory:', err.message);
    }
  }

  /**
   * Finds or provisions a user record with zero duplication guarantee.
   */
  getOrCreateUser(userObj) {
    if (!userObj || (!userObj.uid && !userObj.email)) return null;

    const email = (userObj.email || '').trim().toLowerCase();
    const uid = String(userObj.uid || '').trim();

    // 1. Look up by UID
    let existing = uid ? this.usersById.get(uid) : null;

    // 2. If not found by UID, check if email is registered under another UID (identity reconciliation)
    if (!existing && email && this.emailToUid.has(email)) {
      const canonicalUid = this.emailToUid.get(email);
      existing = this.usersById.get(canonicalUid);
      if (existing && uid && existing.uid !== uid) {
        // Migrate / link UID to the new authenticated credential
        this.usersById.delete(existing.uid);
        this._deleteAvatarFilesForUid(existing.uid);
        existing.uid = uid;
        this.usersById.set(uid, existing);
        this.emailToUid.set(email, uid);
      }
    }

    if (existing) {
      existing.lastActiveAt = new Date().toISOString();
      const isAdmin = (existing.email || email) === AUTHORIZED_ADMIN_EMAIL.toLowerCase();
      if (isAdmin) {
        existing.isAdmin = true;
        existing.role = 'admin';
        existing.connectionCredits = 9999;
      }
      if (userObj.displayName && (!existing.displayName || existing.displayName === 'Community Member')) {
        existing.displayName = userObj.displayName.trim();
      }
      this._scheduleSave();
      return { ...existing };
    }

    // 3. Create single unique record
    const finalUid = uid || 'user_' + Math.random().toString(36).substring(2, 10);
    const isAdmin = email === AUTHORIZED_ADMIN_EMAIL.toLowerCase();

    const newUser = {
      uid: finalUid,
      email: email || `member_${finalUid}@engineerverse.local`,
      displayName: (userObj.displayName || userObj.name || (email ? email.split('@')[0] : 'Community Engineer')).trim(),
      role: isAdmin ? 'admin' : 'member',
      isAdmin,
      status: 'active',
      warningReason: null,
      warnedAt: null,
      suspendedAt: null,
      problemsCount: 0,
      solutionsCount: 0,
      supportsCount: 0,
      connectionCredits: isAdmin ? 9999 : 5,
      photoURL: userObj.photoURL || null,
      bio: userObj.bio || '',
      discipline: userObj.discipline || 'Full Stack Systems',
      portfolioUrl: userObj.portfolioUrl || '',
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    };

    this.usersById.set(finalUid, newUser);
    if (email) {
      this.emailToUid.set(email, finalUid);
    }

    this._scheduleSave();
    return { ...newUser };
  }

  getUserByUid(uid) {
    if (!uid) return null;
    return this.usersById.get(uid) || null;
  }

  getUserByEmail(email) {
    if (!email) return null;
    const uid = this.emailToUid.get(email.trim().toLowerCase());
    if (!uid) return null;
    return this.usersById.get(uid) || null;
  }

  getAllUsers() {
    return Array.from(this.usersById.values()).map((u) => ({ ...u }));
  }

  /**
   * Updates user profile with immediate cleanup of previous avatar files
   */
  async updateUserProfile(uid, updates = {}) {
    let user = this.usersById.get(uid);
    if (!user) {
      // Fallback lookup if uid is an email
      if (typeof uid === 'string' && uid.includes('@')) {
        user = this.getUserByEmail(uid);
      }
    }
    if (!user) return null;

    if (updates.displayName && typeof updates.displayName === 'string') {
      user.displayName = updates.displayName.trim().slice(0, 80);
    }
    if (updates.bio !== undefined) {
      user.bio = typeof updates.bio === 'string' ? updates.bio.trim().slice(0, 500) : '';
    }
    if (updates.discipline !== undefined) {
      user.discipline = typeof updates.discipline === 'string' ? updates.discipline.trim() : 'Full Stack Systems';
    }
    if (updates.portfolioUrl !== undefined) {
      user.portfolioUrl = typeof updates.portfolioUrl === 'string' ? updates.portfolioUrl.trim().slice(0, 255) : '';
    }

    // Photo Management & Automatic Cleanup
    if (updates.photoURL !== undefined) {
      const newPhoto = updates.photoURL;

      if (!newPhoto) {
        // User removed photo: delete any local avatar file from disk and Cloudinary
        this._deleteAvatarFilesForUid(user.uid);
        if (user.cloudinaryPublicId) {
          await deleteImageFromCloudinary(user.cloudinaryPublicId).catch(() => {});
          user.cloudinaryPublicId = null;
        }
        user.photoURL = null;
      } else if (typeof newPhoto === 'string' && newPhoto.startsWith('data:image/')) {
        // User uploaded new image file (base64):
        // 1. Delete previous avatar files from disk
        this._deleteAvatarFilesForUid(user.uid);

        const cleanUid = String(user.uid).replace(/[^a-zA-Z0-9_-]/g, '');

        // 2. Try uploading to Cloudinary first if configured
        let cloudinaryUploaded = null;
        try {
          cloudinaryUploaded = await uploadImageToCloudinary(newPhoto, {
            folder: 'engineerverse/avatars',
            publicId: `avatar_${cleanUid}`,
          });
        } catch (err) {
          console.warn('[UsersStore] Cloudinary upload notice:', err.message);
        }

        if (cloudinaryUploaded?.url) {
          user.photoURL = cloudinaryUploaded.url;
          user.cloudinaryPublicId = cloudinaryUploaded.publicId;
        } else {
          // Fallback to local disk storage
          try {
            const match = newPhoto.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
            if (match) {
              let ext = match[1].toLowerCase();
              if (ext === 'jpeg') ext = 'jpg';
              const base64Data = match[2];
              const buffer = Buffer.from(base64Data, 'base64');
              const filename = `${cleanUid}.${ext}`;
              const destPath = path.join(AVATARS_DIR, filename);

              this._ensureDirectories();
              fs.writeFileSync(destPath, buffer);

              // Assign clean, cache-busted, relative URL
              user.photoURL = `/api/media/avatar/${cleanUid}?t=${Date.now()}`;
            } else {
              user.photoURL = newPhoto;
            }
          } catch (err) {
            console.error('[UsersStore] Error saving avatar image to disk:', err.message);
            user.photoURL = newPhoto;
          }
        }
      } else if (typeof newPhoto === 'string' && (newPhoto.startsWith('http://') || newPhoto.startsWith('https://'))) {
        // User specified external URL: delete any existing local avatar file & Cloudinary
        this._deleteAvatarFilesForUid(user.uid);
        if (user.cloudinaryPublicId) {
          await deleteImageFromCloudinary(user.cloudinaryPublicId).catch(() => {});
          user.cloudinaryPublicId = null;
        }
        user.photoURL = newPhoto.trim();
      } else if (typeof newPhoto === 'string' && newPhoto.startsWith('/api/media/avatar/')) {
        // Re-affirming existing avatar URL
        user.photoURL = newPhoto;
      }
    }

    user.lastActiveAt = new Date().toISOString();
    this._saveToDiskImmediate();

    return { ...user };
  }

  /**
   * Permanently deletes user account, avatar file, and cascades cleanup through the database.
   */
  async deleteUser(uid) {
    if (!uid) return { success: false, error: 'User ID is required for deletion.' };

    let user = this.usersById.get(uid);
    if (!user && typeof uid === 'string' && uid.includes('@')) {
      user = this.getUserByEmail(uid);
    }

    if (!user) {
      return { success: false, error: 'User record not found.' };
    }

    if (user.isAdmin && user.email.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
      return { success: false, error: 'Cannot delete the sole authorized administrator account.' };
    }

    const targetUid = user.uid;
    const targetEmail = (user.email || '').toLowerCase();

    // 1. Delete user's avatar files from server disk and Cloudinary immediately
    this._deleteAvatarFilesForUid(targetUid);
    if (user.cloudinaryPublicId) {
      await deleteImageFromCloudinary(user.cloudinaryPublicId).catch(() => {});
    }

    // 2. Cascade cleanup across problems wall (remove supports, mark author as deactivated)
    try {
      problemsStore.purgeUserData(targetUid);
    } catch (err) {
      console.warn('[UsersStore] Error purging problem data during user deletion:', err.message);
    }

    // 3. Remove from memory maps
    this.usersById.delete(targetUid);
    if (targetEmail) {
      this.emailToUid.delete(targetEmail);
    }

    // 4. Log audit entry
    this.logAudit({
      action: 'USER_ACCOUNT_DELETED',
      targetUid,
      targetEmail,
      moderatorId: 'user_self_action',
      timestamp: new Date().toISOString(),
    });

    // 5. Commit immediately to disk
    this._saveToDiskImmediate();

    return {
      success: true,
      message: 'User account and all associated records permanently deleted.',
    };
  }

  warnUser(uid, reason, moderatorId) {
    const user = this.usersById.get(uid);
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

    this._saveToDiskImmediate();
    return { success: true, user: { ...user } };
  }

  suspendUser(uid, reason, moderatorId) {
    const user = this.usersById.get(uid);
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

    this._saveToDiskImmediate();
    return { success: true, user: { ...user } };
  }

  reactivateUser(uid, moderatorId) {
    const user = this.usersById.get(uid);
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

    this._saveToDiskImmediate();
    return { success: true, user: { ...user } };
  }

  incrementProblemsCount(uid) {
    const user = this.usersById.get(uid);
    if (user) {
      user.problemsCount = (user.problemsCount || 0) + 1;
      this._scheduleSave();
    }
  }

  decrementProblemsCount(uid) {
    const user = this.usersById.get(uid);
    if (user && user.problemsCount > 0) {
      user.problemsCount -= 1;
      this._scheduleSave();
    }
  }

  incrementSupportsCount(uid) {
    const user = this.usersById.get(uid);
    if (user) {
      user.supportsCount = (user.supportsCount || 0) + 1;
      this._scheduleSave();
    }
  }

  decrementSupportsCount(uid) {
    const user = this.usersById.get(uid);
    if (user && user.supportsCount > 0) {
      user.supportsCount -= 1;
      this._scheduleSave();
    }
  }

  incrementSolutionsCount(uid) {
    const user = this.usersById.get(uid);
    if (user) {
      user.solutionsCount = (user.solutionsCount || 0) + 1;
      this._scheduleSave();
    }
  }

  deductConnectionCredit(uid) {
    const user = this.usersById.get(uid);
    if (!user) return false;
    if (user.isAdmin) return true;
    if ((user.connectionCredits || 0) <= 0) return false;
    user.connectionCredits -= 1;
    this._scheduleSave();
    return true;
  }

  setUserCredits(uid, amount, moderatorId) {
    const user = this.usersById.get(uid);
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

    this._saveToDiskImmediate();
    return { success: true, user: { ...user } };
  }

  logAudit(event) {
    this.auditLogs.unshift({
      id: 'audit_' + Math.random().toString(36).substring(2, 10),
      ...event,
    });
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
    this._scheduleSave();
  }

  getAuditLogs() {
    return [...this.auditLogs];
  }
}

export const usersStore = new UsersStore();
export default usersStore;
