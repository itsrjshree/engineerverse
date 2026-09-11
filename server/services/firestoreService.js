/**
 * ENGINEERVERSE — Authoritative Server-Side Firestore Service
 * Pure JavaScript (ZERO TypeScript).
 *
 * Single Source of Truth for Users and Profiles:
 * - Canonical user documents stored at: `users/{firebaseUid}`
 * - Whitelisted field validation (no arbitrary request-body injection)
 * - Cloudinary asset reference decoupling (binary in Cloudinary, metadata in Firestore)
 * - Safe asset replacement: new uploaded -> persisted to Firestore -> old cleaned up
 * - Safe asset deletion: clears photo reference only, preserves all other profile fields
 * - Strict production fail-closed semantics: ZERO fallback to local JSON or RAM in production
 */

import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { config } from '../config.js';
import { AUTHORIZED_ADMIN_EMAIL, getAuthorizedAdminUid } from '../middleware/auth.js';
import { uploadImageToCloudinary, deleteImageFromCloudinary } from './cloudinaryService.js';

// Allowed fields for profile updates by authenticated users
const ALLOWED_PROFILE_FIELDS = new Set([
  'displayName',
  'bio',
  'discipline',
  'portfolioUrl',
  'photoURL',
  'photoMetadata',
]);

let _firestoreDb = null;
let _testRepository = null;

/**
 * Initializes and retrieves the authoritative Firestore instance
 */
export function getFirestoreInstance() {
  if (_testRepository) {
    return _testRepository;
  }

  if (_firestoreDb) {
    return _firestoreDb;
  }

  const projectId = (
    process.env.FIREBASE_PROJECT_ID ||
    process.env.VITE_FIREBASE_PROJECT_ID ||
    config.firebaseAdmin?.projectId ||
    ''
  ).trim();

  const clientEmail = (
    process.env.FIREBASE_CLIENT_EMAIL ||
    config.firebaseAdmin?.clientEmail ||
    ''
  ).trim();

  const privateKey = (
    process.env.FIREBASE_PRIVATE_KEY ||
    config.firebaseAdmin?.privateKey ||
    ''
  ).replace(/\\n/g, '\n').trim();

  if (!projectId) {
    if (process.env.NODE_ENV === 'production') {
      const err = new Error('Database service unavailable. FIREBASE_PROJECT_ID is not configured.');
      err.code = 'firestore/missing-config';
      err.status = 503;
      throw err;
    }
  }

  let adminApp;
  if (getApps().length > 0) {
    adminApp = getApp();
  } else {
    const appOptions = {};
    if (projectId) appOptions.projectId = projectId;
    if (clientEmail && privateKey) {
      appOptions.credential = cert({
        projectId,
        clientEmail,
        privateKey,
      });
    }
    adminApp = initializeApp(appOptions);
  }

  _firestoreDb = getFirestore(adminApp);
  return _firestoreDb;
}

/**
 * Allows injecting an isolated Firestore repository for testing failure modes and contracts
 */
export function setTestFirestoreRepository(repo) {
  _testRepository = repo;
}

export function clearTestFirestoreRepository() {
  _testRepository = null;
}

/**
 * Canonical User Document Sanitizer
 * Strips sensitive internal keys and ensures consistent response shapes
 */
export function sanitizeUserDocument(docData) {
  if (!docData) return null;
  const {
    uid,
    email,
    emailVerified,
    displayName,
    bio,
    discipline,
    portfolioUrl,
    photoURL,
    photoMetadata,
    role,
    isAdmin,
    status,
    warningReason,
    warnedAt,
    suspendedReason,
    suspendedAt,
    blockedReason,
    blockedAt,
    connectionCredits,
    problemsCount,
    solutionsCount,
    supportsCount,
    createdAt,
    updatedAt,
    lastActiveAt,
  } = docData;

  return {
    uid: String(uid),
    email: email ? String(email).toLowerCase() : '',
    emailVerified: Boolean(emailVerified),
    displayName: displayName || (email ? email.split('@')[0] : 'Community Engineer'),
    bio: bio || '',
    discipline: discipline || 'Full Stack Systems',
    portfolioUrl: portfolioUrl || '',
    photoURL: photoURL || null,
    photoMetadata: photoMetadata || null,
    role: role === 'admin' ? 'admin' : 'member',
    isAdmin: Boolean(isAdmin),
    status: status || 'active',
    warningReason: warningReason || null,
    warnedAt: warnedAt || null,
    suspendedReason: suspendedReason || null,
    suspendedAt: suspendedAt || null,
    blockedReason: blockedReason || null,
    blockedAt: blockedAt || null,
    connectionCredits: typeof connectionCredits === 'number' ? connectionCredits : 5,
    problemsCount: typeof problemsCount === 'number' ? problemsCount : 0,
    solutionsCount: typeof solutionsCount === 'number' ? solutionsCount : 0,
    supportsCount: typeof supportsCount === 'number' ? supportsCount : 0,
    createdAt: createdAt || new Date().toISOString(),
    updatedAt: updatedAt || new Date().toISOString(),
    lastActiveAt: lastActiveAt || new Date().toISOString(),
  };
}

/**
 * Checks if the user payload qualifies as the sole authorized administrator
 */
export function isAuthorizedAdminUser(email, uid, emailVerified) {
  const normEmail = (email || '').toLowerCase().trim();
  if (normEmail !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) return false;
  if (!emailVerified) return false;

  const adminUid = getAuthorizedAdminUid();
  if (!adminUid) return false;

  return uid === adminUid;
}

/**
 * Reads a user document by Firebase UID from Firestore
 */
export async function getUserByUid(uid) {
  if (!uid || typeof uid !== 'string') return null;
  const db = getFirestoreInstance();

  try {
    const docRef = db.collection('users').doc(uid);
    const snap = await docRef.get();
    if (!snap.exists) return null;
    return sanitizeUserDocument(snap.data());
  } catch (err) {
    console.error(`[FirestoreService] Error reading user ${uid}:`, err.message);
    if (process.env.NODE_ENV === 'production') {
      const e = new Error('Database service unavailable. Failed to query user record from Firestore.');
      e.code = 'firestore/read-failure';
      e.status = 503;
      throw e;
    }
    throw err;
  }
}

/**
 * Reads a user document by Email from Firestore
 */
export async function getUserByEmail(email) {
  if (!email || typeof email !== 'string') return null;
  const normEmail = email.toLowerCase().trim();
  const db = getFirestoreInstance();

  try {
    const querySnap = await db
      .collection('users')
      .where('email', '==', normEmail)
      .limit(1)
      .get();

    if (querySnap.empty) return null;
    const doc = querySnap.docs[0];
    return sanitizeUserDocument(doc.data());
  } catch (err) {
    console.error(`[FirestoreService] Error reading user by email ${normEmail}:`, err.message);
    if (process.env.NODE_ENV === 'production') {
      const e = new Error('Database service unavailable. Failed to query user by email from Firestore.');
      e.code = 'firestore/read-failure';
      e.status = 503;
      throw e;
    }
    throw err;
  }
}

/**
 * Reconciles or creates a canonical user record in Firestore `users/{uid}`.
 * Single entry point for verified identity synchronization.
 * Idempotent, duplicate-safe, and preserves user-authored profile data.
 */
export async function getOrCreateUser(userPayload) {
  if (!userPayload || (!userPayload.uid && !userPayload.email)) {
    const err = new Error('Invalid user payload. Both uid and email are missing.');
    err.code = 'auth/invalid-payload';
    err.status = 400;
    throw err;
  }

  const db = getFirestoreInstance();
  const uid = String(userPayload.uid || `user_${Date.now()}`);
  const email = (userPayload.email || '').toLowerCase().trim();
  const emailVerified = Boolean(userPayload.emailVerified);
  const nowIso = new Date().toISOString();

  try {
    const userDocRef = db.collection('users').doc(uid);
    const snap = await userDocRef.get();

    if (snap.exists) {
      const existing = snap.data();
      const isAdmin = isAuthorizedAdminUser(existing.email, existing.uid, emailVerified || existing.emailVerified);
      const effectiveRole = isAdmin ? 'admin' : (existing.role === 'admin' && !isAdmin ? 'member' : existing.role || 'member');

      const updates = {
        lastActiveAt: nowIso,
        updatedAt: nowIso,
      };

      if (emailVerified && !existing.emailVerified) {
        updates.emailVerified = true;
      }

      if (existing.role !== effectiveRole) {
        updates.role = effectiveRole;
        updates.isAdmin = isAdmin;
      }

      if (isAdmin && existing.connectionCredits < 9999) {
        updates.connectionCredits = 9999;
      }

      await userDocRef.update(updates);
      return sanitizeUserDocument({ ...existing, ...updates });
    }

    // Check if an existing account exists by verified email to prevent duplicate records
    if (email && emailVerified) {
      const existingByEmail = await getUserByEmail(email);
      if (existingByEmail) {
        // If this is the authorized admin or a verified identity claiming an unverified stub:
        const isIncomingAdmin = isAuthorizedAdminUser(email, uid, emailVerified);
        const canonicalUid = isIncomingAdmin ? uid : (existingByEmail.uid || uid);
        const isTargetAdmin = isAuthorizedAdminUser(email, canonicalUid, true);

        const targetRef = db.collection('users').doc(canonicalUid);
        const updates = {
          lastActiveAt: nowIso,
          updatedAt: nowIso,
          emailVerified: true,
          role: isTargetAdmin ? 'admin' : (existingByEmail.role === 'admin' ? 'member' : (existingByEmail.role || 'member')),
          isAdmin: isTargetAdmin,
        };

        if (isTargetAdmin && (existingByEmail.connectionCredits || 0) < 9999) {
          updates.connectionCredits = 9999;
        }

        // Clean up conflicting alias document if UID changed
        if (existingByEmail.uid && existingByEmail.uid !== canonicalUid) {
          try {
            await db.collection('users').doc(existingByEmail.uid).delete();
          } catch (e) {
            console.warn('[FirestoreService] Cleaned alias stub doc:', e.message);
          }
        }

        const mergedDoc = {
          ...existingByEmail,
          ...updates,
          uid: canonicalUid,
        };

        await targetRef.set(mergedDoc, { merge: true });
        return sanitizeUserDocument(mergedDoc);
      }
    }

    // Creating brand new canonical user record in Firestore
    const isAdmin = isAuthorizedAdminUser(email, uid, emailVerified);
    const initialDisplayName =
      (userPayload.displayName || userPayload.name || (email ? email.split('@')[0] : 'Engineer')).trim();

    const newUserDoc = {
      uid,
      email,
      emailVerified,
      displayName: initialDisplayName,
      bio: userPayload.bio || '',
      discipline: userPayload.discipline || 'Full Stack Systems',
      portfolioUrl: userPayload.portfolioUrl || '',
      photoURL: userPayload.photoURL || null,
      photoMetadata: userPayload.photoMetadata || null,
      role: isAdmin ? 'admin' : 'member',
      isAdmin,
      status: 'active',
      warningReason: null,
      warnedAt: null,
      suspendedReason: null,
      suspendedAt: null,
      blockedReason: null,
      blockedAt: null,
      connectionCredits: isAdmin ? 9999 : 5,
      problemsCount: 0,
      solutionsCount: 0,
      supportsCount: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
      lastActiveAt: nowIso,
    };

    await userDocRef.set(newUserDoc);
    return sanitizeUserDocument(newUserDoc);
  } catch (err) {
    console.error(`[FirestoreService] Error in getOrCreateUser for ${uid}:`, err.message);
    if (process.env.NODE_ENV === 'production') {
      const e = new Error('Database service unavailable. Failed to persist or reconcile user in Firestore.');
      e.code = 'firestore/write-failure';
      e.status = 503;
      throw e;
    }
    throw err;
  }
}

/**
 * Updates an engineer's profile fields in Firestore.
 * Strictly whitelists allowed fields. Rejects privilege escalation attempts.
 * Supports atomic partial updates.
 */
export async function updateUserProfile(uid, rawUpdates) {
  if (!uid || typeof uid !== 'string') {
    const err = new Error('Missing or invalid user identifier.');
    err.code = 'auth/invalid-uid';
    err.status = 400;
    throw err;
  }

  if (!rawUpdates || typeof rawUpdates !== 'object') {
    const err = new Error('Update payload must be a non-empty object.');
    err.code = 'profile/invalid-payload';
    err.status = 400;
    throw err;
  }

  const db = getFirestoreInstance();

  try {
    const docRef = db.collection('users').doc(uid);
    const snap = await docRef.get();

    if (!snap.exists) {
      const err = new Error('User record not found in Firestore.');
      err.code = 'profile/user-not-found';
      err.status = 404;
      throw err;
    }

    const currentDoc = snap.data();
    const cleanUpdates = {};

    for (const key of Object.keys(rawUpdates)) {
      if (!ALLOWED_PROFILE_FIELDS.has(key)) {
        // Disallowed / privileged fields (e.g. role, isAdmin, status, connectionCredits)
        continue;
      }

      const val = rawUpdates[key];
      if (key === 'displayName') {
        if (typeof val === 'string' && val.trim()) {
          cleanUpdates.displayName = val.trim().slice(0, 100);
        }
      } else if (key === 'bio') {
        if (typeof val === 'string') {
          cleanUpdates.bio = val.slice(0, 1000);
        }
      } else if (key === 'discipline') {
        if (typeof val === 'string' && val.trim()) {
          cleanUpdates.discipline = val.trim().slice(0, 100);
        }
      } else if (key === 'portfolioUrl') {
        if (typeof val === 'string') {
          cleanUpdates.portfolioUrl = val.trim().slice(0, 500);
        }
      } else if (key === 'photoURL') {
        cleanUpdates.photoURL = val ? String(val).trim() : null;
      } else if (key === 'photoMetadata') {
        cleanUpdates.photoMetadata = val && typeof val === 'object' ? val : null;
      }
    }

    cleanUpdates.updatedAt = new Date().toISOString();
    cleanUpdates.lastActiveAt = new Date().toISOString();

    await docRef.update(cleanUpdates);
    return sanitizeUserDocument({ ...currentDoc, ...cleanUpdates });
  } catch (err) {
    if (err.status) throw err;
    console.error(`[FirestoreService] Error updating profile for ${uid}:`, err.message);
    if (process.env.NODE_ENV === 'production') {
      const e = new Error('Database service unavailable. Failed to update profile in Firestore.');
      e.code = 'firestore/write-failure';
      e.status = 503;
      throw e;
    }
    throw err;
  }
}

/**
 * Profile Photo Replacement Flow
 * 1. Upload new asset to Cloudinary
 * 2. Validate Cloudinary response
 * 3. Persist new photo reference & metadata to Firestore
 * 4. Only after Firestore write succeeds, clean up old Cloudinary asset
 * 5. If Firestore write fails, do not delete the valid old photo
 */
export async function updateProfilePhoto(uid, photoData) {
  if (!uid) {
    const err = new Error('User ID is required for photo update.');
    err.code = 'auth/invalid-uid';
    err.status = 400;
    throw err;
  }

  if (!photoData || typeof photoData !== 'string') {
    const err = new Error('Photo data must be a valid image string or URL.');
    err.code = 'photo/invalid-data';
    err.status = 400;
    throw err;
  }

  // Read current user document from Firestore to track existing photo asset
  const existingUser = await getUserByUid(uid);
  if (!existingUser) {
    const err = new Error('User record not found in Firestore.');
    err.code = 'profile/user-not-found';
    err.status = 404;
    throw err;
  }

  const oldPublicId = existingUser.photoMetadata?.publicId || null;
  const cleanUid = uid.replace(/[^a-zA-Z0-9_-]/g, '_');
  const uniqueTimestamp = Date.now();

  let uploadedAsset = null;

  // If photoData is already a remote HTTPS URL (e.g. Google avatar or existing CDN)
  if (photoData.startsWith('https://') && !photoData.startsWith('data:image')) {
    uploadedAsset = {
      url: photoData,
      publicId: null,
    };
  } else {
    // Binary/base64 upload to Cloudinary
    try {
      uploadedAsset = await uploadImageToCloudinary(photoData, {
        folder: 'engineerverse/avatars',
        publicId: `avatar_${cleanUid}_${uniqueTimestamp}`,
      });
    } catch (uploadErr) {
      const err = new Error(`Cloudinary upload failed: ${uploadErr.message}`);
      err.code = 'photo/upload-failed';
      err.status = 502;
      throw err;
    }

    if (!uploadedAsset || !uploadedAsset.url) {
      const err = new Error('Cloudinary failed to return a valid media URL.');
      err.code = 'photo/upload-failed';
      err.status = 502;
      throw err;
    }
  }

  const newPhotoMetadata = {
    publicId: uploadedAsset.publicId || null,
    url: uploadedAsset.url,
    updatedAt: new Date().toISOString(),
  };

  // Persist new photo reference to Firestore FIRST
  let updatedUser;
  try {
    updatedUser = await updateUserProfile(uid, {
      photoURL: uploadedAsset.url,
      photoMetadata: newPhotoMetadata,
    });
  } catch (firestoreErr) {
    // Firestore write failed: If we uploaded a new Cloudinary asset, clean it up to prevent orphaned asset
    if (uploadedAsset.publicId) {
      await deleteImageFromCloudinary(uploadedAsset.publicId).catch((e) => {
        console.warn('[FirestoreService] Warning: Could not delete orphaned asset after Firestore failure:', e.message);
      });
    }
    // Re-throw Firestore error — old photo in Firestore remains untouched!
    throw firestoreErr;
  }

  // Safe replacement: Only after Firestore write succeeds, clean up old Cloudinary asset
  if (oldPublicId && oldPublicId !== uploadedAsset.publicId) {
    try {
      await deleteImageFromCloudinary(oldPublicId);
    } catch (cleanupErr) {
      console.warn(`[FirestoreService] Notice: Old Cloudinary asset (${oldPublicId}) cleanup warning:`, cleanupErr.message);
    }
  }

  return updatedUser;
}

/**
 * Profile Photo Deletion Flow
 * 1. Read current photo metadata from Firestore
 * 2. Clear photo reference in Firestore (preserves all other profile fields: bio, discipline, etc.)
 * 3. Delete Cloudinary asset through server-side flow
 */
export async function deleteProfilePhoto(uid) {
  if (!uid) {
    const err = new Error('User ID is required for photo deletion.');
    err.code = 'auth/invalid-uid';
    err.status = 400;
    throw err;
  }

  const existingUser = await getUserByUid(uid);
  if (!existingUser) {
    const err = new Error('User record not found in Firestore.');
    err.code = 'profile/user-not-found';
    err.status = 404;
    throw err;
  }

  const oldPublicId = existingUser.photoMetadata?.publicId || null;

  // Clear photoURL and photoMetadata in Firestore
  const updatedUser = await updateUserProfile(uid, {
    photoURL: null,
    photoMetadata: null,
  });

  // Retire Cloudinary asset if it exists
  if (oldPublicId) {
    try {
      await deleteImageFromCloudinary(oldPublicId);
    } catch (cleanupErr) {
      console.warn(`[FirestoreService] Notice: Cloudinary asset deletion warning:`, cleanupErr.message);
    }
  }

  return updatedUser;
}

/**
 * Permanently deletes user account, photo assets, and records from Firestore
 */
export async function deleteUser(uid) {
  if (!uid) return { success: false, error: 'User ID is required.' };

  const db = getFirestoreInstance();
  const existingUser = await getUserByUid(uid);

  if (!existingUser) {
    return { success: false, error: 'User not found in Firestore.' };
  }

  // Protect the sole administrator account from accidental deletion
  if (existingUser.email && existingUser.email.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
    return { success: false, error: 'Sole authorized administrator account cannot be deleted.' };
  }

  // 1. Clean up Cloudinary avatar asset if present
  if (existingUser.photoMetadata?.publicId) {
    await deleteImageFromCloudinary(existingUser.photoMetadata.publicId).catch(() => {});
  }

  // 1.5 Purge user problems, solutions, supports, and credit records
  try {
    const { purgeUserData } = await import('./firestoreProblemsService.js');
    await purgeUserData(uid);
  } catch (purgeErr) {
    console.warn(`[FirestoreService] Notice during purge of user ${uid} artifacts:`, purgeErr.message);
  }

  // 2. Delete document from Firestore
  try {
    await db.collection('users').doc(uid).delete();

    // 3. Write audit log entry
    await logAudit({
      action: 'USER_DELETED',
      actorId: uid,
      targetUid: uid,
      details: { email: existingUser.email },
    });

    return { success: true };
  } catch (err) {
    console.error(`[FirestoreService] Error deleting user ${uid}:`, err.message);
    if (process.env.NODE_ENV === 'production') {
      const e = new Error('Database service unavailable. Failed to delete user from Firestore.');
      e.code = 'firestore/write-failure';
      e.status = 503;
      throw e;
    }
    throw err;
  }
}

/**
 * Logs an administrative or security audit action into Firestore
 */
export async function logAudit({ action, actorId, targetUid = null, details = {} }) {
  try {
    const db = getFirestoreInstance();
    const auditId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const record = {
      id: auditId,
      action,
      actorId: String(actorId),
      targetUid: targetUid ? String(targetUid) : null,
      details: details || {},
      timestamp: new Date().toISOString(),
    };
    await db.collection('auditLogs').doc(auditId).set(record);
    return record;
  } catch (err) {
    console.warn('[FirestoreService] Audit log write notice:', err.message);
    return null;
  }
}

/**
 * Retrieves recent audit logs from Firestore
 */
export async function getAuditLogs(limitCount = 100) {
  try {
    const db = getFirestoreInstance();
    const snap = await db
      .collection('auditLogs')
      .orderBy('timestamp', 'desc')
      .limit(limitCount)
      .get();

    return snap.docs.map((doc) => doc.data());
  } catch (err) {
    console.warn('[FirestoreService] Error reading audit logs:', err.message);
    return [];
  }
}

/**
 * Admin Moderation Methods
 */
export async function warnUser(targetUid, reason, actorId) {
  const db = getFirestoreInstance();
  const docRef = db.collection('users').doc(targetUid);
  const snap = await docRef.get();
  if (!snap.exists) return { success: false, error: 'User not found' };

  const nowIso = new Date().toISOString();
  await docRef.update({
    status: 'warned',
    warningReason: reason,
    warnedAt: nowIso,
    updatedAt: nowIso,
  });

  await logAudit({
    action: 'USER_WARNED',
    actorId,
    targetUid,
    details: { reason },
  });

  return { success: true, status: 'warned' };
}

export async function suspendUser(targetUid, reason, actorId) {
  const db = getFirestoreInstance();
  const docRef = db.collection('users').doc(targetUid);
  const snap = await docRef.get();
  if (!snap.exists) return { success: false, error: 'User not found' };

  const nowIso = new Date().toISOString();
  await docRef.update({
    status: 'suspended',
    suspendedReason: reason,
    suspendedAt: nowIso,
    updatedAt: nowIso,
  });

  await logAudit({
    action: 'USER_SUSPENDED',
    actorId,
    targetUid,
    details: { reason },
  });

  return { success: true, status: 'suspended' };
}

export async function blockUser(targetUid, reason, actorId) {
  const db = getFirestoreInstance();
  const docRef = db.collection('users').doc(targetUid);
  const snap = await docRef.get();
  if (!snap.exists) return { success: false, error: 'User not found' };

  const nowIso = new Date().toISOString();
  await docRef.update({
    status: 'blocked',
    blockedReason: reason,
    blockedAt: nowIso,
    updatedAt: nowIso,
  });

  await logAudit({
    action: 'USER_BLOCKED',
    actorId,
    targetUid,
    details: { reason },
  });

  return { success: true, status: 'blocked' };
}

export async function reactivateUser(targetUid, actorId) {
  const db = getFirestoreInstance();
  const docRef = db.collection('users').doc(targetUid);
  const snap = await docRef.get();
  if (!snap.exists) return { success: false, error: 'User not found' };

  const nowIso = new Date().toISOString();
  await docRef.update({
    status: 'active',
    warningReason: null,
    warnedAt: null,
    suspendedReason: null,
    suspendedAt: null,
    blockedReason: null,
    blockedAt: null,
    updatedAt: nowIso,
  });

  await logAudit({
    action: 'USER_REACTIVATED',
    actorId,
    targetUid,
    details: {},
  });

  return { success: true, status: 'active' };
}

export async function setUserCredits(targetUid, credits, actorId) {
  const db = getFirestoreInstance();
  const docRef = db.collection('users').doc(targetUid);
  const snap = await docRef.get();
  if (!snap.exists) return { success: false, error: 'User not found' };

  const target = snap.data();
  const isAdmin = isAuthorizedAdminUser(target.email, target.uid, target.emailVerified);
  const finalCredits = isAdmin ? 9999 : Math.max(0, parseInt(credits, 10) || 0);

  const nowIso = new Date().toISOString();
  await docRef.update({
    connectionCredits: finalCredits,
    updatedAt: nowIso,
  });

  await logAudit({
    action: 'CREDITS_ADJUSTED',
    actorId,
    targetUid,
    details: { credits: finalCredits },
  });

  return { success: true, connectionCredits: finalCredits };
}

export async function getAllUsers() {
  const db = getFirestoreInstance();
  try {
    const snap = await db.collection('users').get();
    return snap.docs.map((doc) => sanitizeUserDocument(doc.data()));
  } catch (err) {
    console.error('[FirestoreService] Error reading all users from Firestore:', err.message);
    if (process.env.NODE_ENV === 'production') {
      const e = new Error('Database service unavailable. Failed to query users.');
      e.code = 'firestore/read-failure';
      e.status = 503;
      throw e;
    }
    return [];
  }
}

/**
 * Counter atomic mutations
 */
export async function incrementCounter(uid, fieldName, amount = 1) {
  if (!uid || !['problemsCount', 'solutionsCount', 'supportsCount'].includes(fieldName)) return;
  try {
    const db = getFirestoreInstance();
    const docRef = db.collection('users').doc(uid);
    await docRef.update({
      [fieldName]: FieldValue.increment(amount),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn(`[FirestoreService] Counter increment warning for ${uid}.${fieldName}:`, err.message);
  }
}

export async function deductConnectionCredit(uid) {
  if (!uid) return false;
  try {
    const db = getFirestoreInstance();
    const docRef = db.collection('users').doc(uid);
    const snap = await docRef.get();
    if (!snap.exists) return false;

    const data = snap.data();
    if (data.isAdmin || data.role === 'admin') return true;
    if ((data.connectionCredits || 0) <= 0) return false;

    await docRef.update({
      connectionCredits: FieldValue.increment(-1),
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.warn(`[FirestoreService] Deduct credit warning for ${uid}:`, err.message);
    return false;
  }
}
