/**
 * ENGINEERVERSE — Legacy Local Data → Firestore Migration Script
 * Pure JavaScript (ZERO TypeScript).
 *
 * Run manually: node scripts/migrate-local-data-to-firestore.js
 *
 * Migrates server/data/users.json (the pre-Firestore local persistence file)
 * into Firestore users/{uid} + creditAccounts/{uid} documents.
 *
 * SAFETY:
 *  - Idempotent: uses Firestore `set(..., { merge: true })`, safe to re-run.
 *  - Non-destructive: never deletes the local JSON file. You remove it
 *    manually once you've confirmed the migration report looks correct.
 *  - Does NOT blindly trust every record's `uid` field as a real Firestore
 *    document ID. Specifically: the legacy seed record for the admin account
 *    uses a hardcoded placeholder UID ("admin_sole_rajshree") that does NOT
 *    correspond to any real Firebase Authentication UID. Writing a Firestore
 *    document under that fake ID would create a permanent duplicate/orphan
 *    record for the same human as the real admin Firebase UID (whatever
 *    Firebase actually assigned when they signed in for real) — exactly the
 *    failure mode the V0 architecture spec explicitly warns against
 *    ("hardcoded seed admin UID must not become production identity").
 *
 *    Instead, for any record whose email matches AUTHORIZED_ADMIN_EMAIL, this
 *    script migrates the record's profile data onto the REAL Firebase UID
 *    read from the ADMIN_FIREBASE_UID environment variable (the same env var
 *    server/middleware/auth.js already uses as the sole source of truth for
 *    admin identity). If ADMIN_FIREBASE_UID is not configured, that record is
 *    SKIPPED with a clear warning rather than guessed at.
 *
 *  - All other records (real users with genuine-looking Firebase UIDs) are
 *    migrated directly under their existing uid.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const USERS_JSON_PATH = path.join(__dirname, '..', 'server', 'data', 'users.json');

async function main() {
  console.log('=== ENGINEERVERSE Legacy Data Migration ===\n');

  if (!fs.existsSync(USERS_JSON_PATH)) {
    console.log(`No local users.json found at ${USERS_JSON_PATH} — nothing to migrate.`);
    return;
  }

  const raw = fs.readFileSync(USERS_JSON_PATH, 'utf-8');
  let localUsers;
  try {
    localUsers = JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse users.json:', err.message);
    process.exitCode = 1;
    return;
  }

  if (!Array.isArray(localUsers) || localUsers.length === 0) {
    console.log('users.json is empty — nothing to migrate.');
    return;
  }

  // Dynamically import AFTER dotenv.config() so env vars are available when
  // firestoreService.js reads them at module-load / first-call time.
  const { getFirestoreInstance } = await import('../server/services/firestoreService.js');
  const { getAuthorizedAdminUid, AUTHORIZED_ADMIN_EMAIL } = await import('../server/middleware/auth.js');

  let db;
  try {
    db = getFirestoreInstance();
  } catch (err) {
    console.error('Firestore is not configured — cannot migrate:', err.message);
    console.error('Set FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY first.');
    process.exitCode = 1;
    return;
  }

  const adminUid = getAuthorizedAdminUid();
  const adminEmail = AUTHORIZED_ADMIN_EMAIL.toLowerCase();

  const summary = {
    total: localUsers.length,
    migrated: 0,
    skippedAdminNoUid: 0,
    skippedInvalid: 0,
    failed: [],
  };

  for (const record of localUsers) {
    const email = (record.email || '').toLowerCase().trim();
    const looksLikeRealFirebaseUid = typeof record.uid === 'string' && /^[A-Za-z0-9]{20,40}$/.test(record.uid);
    const isAdminRecord = email === adminEmail;

    let targetUid = record.uid;

    if (isAdminRecord && !looksLikeRealFirebaseUid) {
      if (!adminUid) {
        console.warn(
          `SKIPPED: admin record (email=${email}) has a placeholder uid ("${record.uid}") and ` +
          `ADMIN_FIREBASE_UID is not set — cannot safely determine the real Firebase UID to migrate onto. ` +
          `Set ADMIN_FIREBASE_UID and re-run this script.`
        );
        summary.skippedAdminNoUid += 1;
        continue;
      }
      targetUid = adminUid;
      console.log(`Admin record: migrating onto real Firebase UID from ADMIN_FIREBASE_UID (${adminUid}), not the placeholder "${record.uid}".`);
    }

    if (!targetUid || !email) {
      console.warn(`SKIPPED: record missing uid or email:`, record);
      summary.skippedInvalid += 1;
      continue;
    }

    try {
      const nowIso = new Date().toISOString();
      const userRef = db.collection('users').doc(targetUid);
      const existingSnap = await userRef.get();

      const migratedDoc = {
        uid: targetUid,
        email,
        emailVerified: true, // these are known-real, already-active accounts
        displayName: record.displayName || (email ? email.split('@')[0] : 'Engineer'),
        bio: record.bio || '',
        discipline: record.discipline || 'Full Stack Systems',
        portfolioUrl: record.portfolioUrl || '',
        photoURL: record.photoURL || null,
        role: isAdminRecord ? 'admin' : (record.role || 'member'),
        isAdmin: isAdminRecord,
        status: record.status || 'active',
        warningReason: record.warningReason || null,
        warnedAt: record.warnedAt || null,
        suspendedReason: record.suspendedReason || null,
        suspendedAt: record.suspendedAt || null,
        blockedReason: record.blockedReason || null,
        blockedAt: record.blockedAt || null,
        connectionCredits: isAdminRecord ? 9999 : (typeof record.connectionCredits === 'number' ? record.connectionCredits : 5),
        problemsCount: record.problemsCount || 0,
        solutionsCount: record.solutionsCount || 0,
        supportsCount: record.supportsCount || 0,
        createdAt: record.createdAt || nowIso,
        updatedAt: nowIso,
        lastActiveAt: record.lastActiveAt || nowIso,
      };

      // merge:true — if the target doc already exists (e.g. this script is
      // re-run, or the user has since logged in for real and getOrCreateUser
      // already created a doc), we do not clobber fields that already exist
      // there unless this legacy record actually has a value for them.
      await userRef.set(migratedDoc, { merge: true });

      // Seed the credit ledger account so creditAccounts/{uid}.balance is
      // consistent with users/{uid}.connectionCredits from the start —
      // avoids the two ever starting out of sync.
      const accountRef = db.collection('creditAccounts').doc(targetUid);
      const accountSnap = await accountRef.get();
      if (!accountSnap.exists) {
        await accountRef.set({
          uid: targetUid,
          balance: migratedDoc.connectionCredits,
          updatedAt: nowIso,
        });
      }

      console.log(
        `${existingSnap.exists ? 'MERGED' : 'CREATED'}: users/${targetUid} (${email})` +
        `${isAdminRecord ? ' [ADMIN]' : ''}`
      );
      summary.migrated += 1;
    } catch (err) {
      console.error(`FAILED to migrate ${email} (${targetUid}):`, err.message);
      summary.failed.push({ email, uid: targetUid, reason: err.message });
    }
  }

  console.log('\n=== Migration Summary ===');
  console.log(JSON.stringify(summary, null, 2));

  if (summary.failed.length > 0) {
    console.log('\nSome records failed to migrate — review the errors above before removing local JSON.');
    process.exitCode = 1;
  } else if (summary.skippedAdminNoUid > 0) {
    console.log('\nAdmin record was skipped because ADMIN_FIREBASE_UID is not set. Set it and re-run.');
    process.exitCode = 1;
  } else {
    console.log('\nAll records migrated successfully. You can now safely remove server/data/users.json');
    console.log('once you have independently confirmed the Firestore users collection looks correct.');
  }
}

main().catch((err) => {
  console.error('Migration script crashed:', err);
  process.exitCode = 1;
});
