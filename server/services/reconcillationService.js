/**
 * ENGINEERVERSE — Database Reconciliation Engine
 * Pure JavaScript (ZERO TypeScript).
 *
 * This is the "repair/control mechanism" described in the V0 Phase 2 master
 * spec, Sections 6-8 and 19. It is NOT the primary sync mechanism — normal
 * operation already reconciles a user into Firestore automatically on every
 * authenticated request via getOrCreateUser() (see firestoreService.js,
 * called from server/routes/api.js's /auth/session and /auth/me routes).
 *
 * This engine exists for two purposes:
 *  1. HISTORICAL REPAIR — users who authenticated with Firebase Auth before
 *     Firestore was wired up (or at any point where a Firestore write may
 *     have failed) will exist in Firebase Auth but be missing/stale in
 *     Firestore. Normal operation only reconciles a user when THEY log in
 *     again — this engine can proactively repair ALL such users without
 *     waiting for that.
 *  2. ADMIN-TRIGGERED "SYNC DATABASE" — a manual, idempotent, safe-to-repeat
 *     control surfaced in the admin panel for on-demand verification/repair.
 *
 * SAFETY GUARANTEES:
 *  - Never overwrites user-authored Firestore fields (bio, discipline,
 *    portfolioUrl, custom displayName, etc.) — it reuses getOrCreateUser(),
 *    which already implements this "don't clobber application data with
 *    identity data" rule.
 *  - Idempotent — running it twice produces the same end state and does not
 *    create duplicates (Firestore document ID is always the Firebase UID).
 *  - A single user's failure does not abort the whole run — failures are
 *    collected and reported, not thrown.
 */

import { getAuth } from 'firebase-admin/auth';
import { getFirestoreInstance, getOrCreateUser } from './firestoreService.js';

// Test-injection hook, mirroring firestoreService.js's setTestFirestoreRepository
// pattern — lets tests substitute a fake Firebase Auth client (with a
// listUsers() method) instead of requiring a live Firebase project.
let _testAuthClient = null;
export function setTestAuthClient(client) {
  _testAuthClient = client;
}
export function clearTestAuthClient() {
  _testAuthClient = null;
}
function getAuthClient() {
  return _testAuthClient || getAuth();
}

/**
 * Enumerates every Firebase Authentication user (paginated, 1000 per page)
 * and ensures each has a corresponding, correctly-reconciled Firestore
 * users/{uid} document. Also cross-checks for orphaned Firestore user
 * documents (a users/{uid} doc whose UID no longer exists in Firebase Auth —
 * e.g. the account was deleted directly in the Firebase console).
 *
 * @returns {Promise<object>} structured reconciliation report
 */
export async function reconcileUsers() {
  const startedAt = Date.now();
  const report = {
    scanned: 0,
    created: 0,
    updated: 0,
    alreadySynced: 0,
    duplicateEmailsDetected: [],
    orphanedFirestoreUsers: [],
    failed: [],
    skipped: [],
  };

  // Ensure the Admin SDK app is initialized (getFirestoreInstance() does this
  // as a side effect and is safe to call even though we don't use its return
  // value directly here beyond the initialization side effect).
  let db;
  try {
    db = getFirestoreInstance();
  } catch (err) {
    return {
      ...report,
      fatalError: `Firestore is not configured — cannot run reconciliation: ${err.message}`,
      durationMs: Date.now() - startedAt,
    };
  }

  const auth = getAuthClient();
  const seenUids = new Set();
  const emailToUids = new Map();

  // --- Pass 1: enumerate Firebase Auth, ensure each user exists correctly in Firestore ---
  let pageToken = undefined;
  do {
    let page;
    try {
      page = await auth.listUsers(1000, pageToken);
    } catch (err) {
      report.fatalError = `Failed to list Firebase Auth users: ${err.message}`;
      break;
    }

    for (const authUser of page.users) {
      report.scanned += 1;
      seenUids.add(authUser.uid);

      const email = (authUser.email || '').toLowerCase().trim();
      if (email) {
        const existingUids = emailToUids.get(email) || [];
        existingUids.push(authUser.uid);
        emailToUids.set(email, existingUids);
      }

      try {
        const beforeSnap = await db.collection('users').doc(authUser.uid).get();
        const existedBefore = beforeSnap.exists;

        await getOrCreateUser({
          uid: authUser.uid,
          email: authUser.email || '',
          emailVerified: Boolean(authUser.emailVerified),
          displayName: authUser.displayName || '',
          photoURL: authUser.photoURL || null,
        });

        if (!existedBefore) {
          report.created += 1;
        } else {
          // getOrCreateUser only writes if something actually changed —
          // we can't cheaply tell "updated" from "already synced" without
          // re-reading, so do a cheap second read only when needed.
          const afterSnap = await db.collection('users').doc(authUser.uid).get();
          const before = beforeSnap.data();
          const after = afterSnap.data();
          const changed = JSON.stringify(before) !== JSON.stringify(after);
          if (changed) report.updated += 1;
          else report.alreadySynced += 1;
        }
      } catch (err) {
        report.failed.push({ uid: authUser.uid, email, reason: err.message });
      }
    }

    pageToken = page.pageToken;
  } while (pageToken);

  // Report duplicate emails (same email string mapping to >1 Firebase Auth UID —
  // this can happen with certain provider-linking edge cases and is worth
  // surfacing to an admin rather than silently merging).
  for (const [email, uids] of emailToUids.entries()) {
    if (uids.length > 1) {
      report.duplicateEmailsDetected.push({ email, uids });
    }
  }

  // --- Pass 2: find orphaned Firestore user docs (exist in Firestore, gone from Auth) ---
  try {
    const allFirestoreUsers = await db.collection('users').get();
    for (const doc of allFirestoreUsers.docs) {
      if (!seenUids.has(doc.id)) {
        report.orphanedFirestoreUsers.push({ uid: doc.id, email: doc.data()?.email || null });
      }
    }
  } catch (err) {
    report.failed.push({ uid: null, email: null, reason: `Orphan scan failed: ${err.message}` });
  }

  report.durationMs = Date.now() - startedAt;
  report.status = report.failed.length === 0 ? 'success' : 'completed_with_errors';
  return report;
}

/**
 * Top-level reconciliation orchestrator. Currently runs reconcileUsers();
 * designed so future EV-phase reconciliation functions (reconcileProblems,
 * reconcileCredits, etc.) can be added here as additional keys in the
 * returned report without changing the admin endpoint that calls this.
 */
export async function runFullReconciliation() {
  const startedAt = Date.now();
  const users = await reconcileUsers();
  return {
    startedAt: new Date(startedAt).toISOString(),
    finishedAt: new Date().toISOString(),
    totalDurationMs: Date.now() - startedAt,
    users,
  };
}
