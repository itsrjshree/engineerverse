/**
 * ENGINEERVERSE — Reconciliation Engine Test Suite
 * Pure JavaScript (ZERO TypeScript).
 *
 * Tests server/services/reconciliationService.js against a mock Firestore
 * repository (mirroring the pattern established in test-phase2-firestore.js)
 * and a mock Firebase Auth client (injected via setTestAuthClient, mirroring
 * setTestFirestoreRepository). No live Firebase project required.
 *
 * Verifies:
 * 1. A Firebase Auth user missing from Firestore gets created.
 * 2. Re-running reconciliation is idempotent (no duplicate creation, second
 *    run reports "alreadySynced" instead of "created" again).
 * 3. A Firestore user doc whose UID no longer exists in Firebase Auth is
 *    reported as orphaned (not silently ignored or deleted).
 * 4. Two Firebase Auth UIDs sharing the same email are reported as a
 *    duplicate, not silently merged.
 * 5. A user-authored field (bio) already reconciled is not clobbered by a
 *    second reconciliation pass.
 */

import assert from 'assert';

process.env.NODE_ENV = 'test';
process.env.ENGINEERVERSE_TEST_RUNNER = 'true';
process.env.ADMIN_FIREBASE_UID = 'admin_sole_rajshree';

const firestoreService = await import('../server/services/firestoreService.js');
const reconciliationService = await import('../server/services/reconciliationService.js');

// --- Minimal mock Firestore (same shape/contract as test-phase2-firestore.js's MockFirestoreDatabase) ---
class MockFirestoreDatabase {
  constructor() {
    this.collections = new Map();
  }

  collection(name) {
    if (!this.collections.has(name)) this.collections.set(name, new Map());
    const store = this.collections.get(name);

    return {
      doc(id) {
        const docId = id || `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        return {
          id: docId,
          async get() {
            const data = store.get(docId);
            return { exists: Boolean(data), id: docId, data: () => (data ? { ...data } : null) };
          },
          async set(data) {
            store.set(docId, { id: docId, ...data });
          },
          async update(updates) {
            const current = store.get(docId);
            if (!current) {
              const err = new Error('Document not found');
              err.status = 404;
              throw err;
            }
            store.set(docId, { ...current, ...updates });
          },
          async delete() {
            store.delete(docId);
          },
        };
      },
      async get() {
        const results = [];
        for (const [id, item] of store.entries()) {
          results.push({ id, data: () => ({ ...item }) });
        }
        return { empty: results.length === 0, docs: results };
      },
      where(field, op, val) {
        const getDocs = async () => {
          const results = [];
          for (const [id, item] of store.entries()) {
            if (item[field] === val) {
              results.push({ id, data: () => ({ ...item }) });
            }
          }
          return { empty: results.length === 0, docs: results };
        };
        return {
          get: getDocs,
          limit() {
            return { get: getDocs };
          },
        };
      },
    };
  }

  async runTransaction(updateFunction) {
    const transaction = {
      get: async (docRef) => docRef.get(),
      set: (docRef, data) => docRef.set(data),
      update: (docRef, updates) => docRef.update(updates),
      delete: (docRef) => docRef.delete(),
    };
    return updateFunction(transaction);
  }
}

// --- Minimal mock Firebase Auth client with a single-page listUsers() ---
function makeMockAuthClient(users) {
  return {
    async listUsers(maxResults = 1000, pageToken = undefined) {
      // Single-page mock — real pagination behavior is Firebase's own SDK
      // contract and is not re-tested here.
      return { users, pageToken: undefined };
    },
  };
}

async function runReconciliationTests() {
  console.log('\n=== Reconciliation Engine Test Suite ===\n');
  let passed = 0;
  let failed = 0;

  const test = async (name, fn) => {
    try {
      await fn();
      console.log(`  \u2713 ${name}`);
      passed += 1;
    } catch (err) {
      console.error(`  \u2717 ${name}`);
      console.error(`      ${err.message}`);
      failed += 1;
    }
  };

  // --- Test 1: missing user gets created ---
  await test('creates a Firestore user for a Firebase Auth user missing from Firestore', async () => {
    const mockDb = new MockFirestoreDatabase();
    firestoreService.setTestFirestoreRepository(mockDb);

    const mockAuth = makeMockAuthClient([
      { uid: 'uid_alex_001', email: 'alex@example.com', emailVerified: true, displayName: 'Alex', photoURL: null },
    ]);
    reconciliationService.setTestAuthClient(mockAuth);

    const report = await reconciliationService.reconcileUsers();

    assert.strictEqual(report.scanned, 1);
    assert.strictEqual(report.created, 1);
    assert.strictEqual(report.failed.length, 0);

    const doc = await mockDb.collection('users').doc('uid_alex_001').get();
    assert.ok(doc.exists, 'Firestore user document must now exist');
    assert.strictEqual(doc.data().email, 'alex@example.com');

    firestoreService.clearTestFirestoreRepository();
    reconciliationService.clearTestAuthClient();
  });

  // --- Test 2: idempotency ---
  await test('re-running reconciliation is idempotent (no duplicate creation)', async () => {
    const mockDb = new MockFirestoreDatabase();
    firestoreService.setTestFirestoreRepository(mockDb);

    const mockAuth = makeMockAuthClient([
      { uid: 'uid_priya_002', email: 'priya@example.com', emailVerified: true, displayName: 'Priya', photoURL: null },
    ]);
    reconciliationService.setTestAuthClient(mockAuth);

    const firstRun = await reconciliationService.reconcileUsers();
    assert.strictEqual(firstRun.created, 1);

    const secondRun = await reconciliationService.reconcileUsers();
    assert.strictEqual(secondRun.created, 0, 'Second run must not re-create the same user');
    assert.strictEqual(secondRun.alreadySynced, 1, 'Second run must report the user as already synced');

    const usersCol = await mockDb.collection('users').get();
    assert.strictEqual(usersCol.docs.length, 1, 'Exactly one document must exist, not a duplicate');

    firestoreService.clearTestFirestoreRepository();
    reconciliationService.clearTestAuthClient();
  });

  // --- Test 3: orphan detection ---
  await test('detects a Firestore user document with no matching Firebase Auth account', async () => {
    const mockDb = new MockFirestoreDatabase();
    firestoreService.setTestFirestoreRepository(mockDb);

    // Seed an "orphan" directly into Firestore — simulates an account that
    // was deleted from Firebase Auth directly (e.g. via console) without
    // the corresponding Firestore document being cleaned up.
    await mockDb.collection('users').doc('uid_ghost_003').set({
      uid: 'uid_ghost_003',
      email: 'ghost@example.com',
      role: 'member',
    });

    const mockAuth = makeMockAuthClient([]); // no live Auth users at all
    reconciliationService.setTestAuthClient(mockAuth);

    const report = await reconciliationService.reconcileUsers();

    assert.strictEqual(report.orphanedFirestoreUsers.length, 1);
    assert.strictEqual(report.orphanedFirestoreUsers[0].uid, 'uid_ghost_003');

    firestoreService.clearTestFirestoreRepository();
    reconciliationService.clearTestAuthClient();
  });

  // --- Test 4: duplicate email detection ---
  await test('detects two Firebase Auth UIDs sharing the same email as a duplicate', async () => {
    const mockDb = new MockFirestoreDatabase();
    firestoreService.setTestFirestoreRepository(mockDb);

    const mockAuth = makeMockAuthClient([
      { uid: 'uid_dup_a', email: 'dup@example.com', emailVerified: true, displayName: 'A', photoURL: null },
      { uid: 'uid_dup_b', email: 'dup@example.com', emailVerified: true, displayName: 'B', photoURL: null },
    ]);
    reconciliationService.setTestAuthClient(mockAuth);

    const report = await reconciliationService.reconcileUsers();

    assert.strictEqual(report.duplicateEmailsDetected.length, 1);
    assert.strictEqual(report.duplicateEmailsDetected[0].email, 'dup@example.com');
    assert.deepStrictEqual(
      report.duplicateEmailsDetected[0].uids.sort(),
      ['uid_dup_a', 'uid_dup_b']
    );

    firestoreService.clearTestFirestoreRepository();
    reconciliationService.clearTestAuthClient();
  });

  // --- Test 5: user-authored data preserved across repeated reconciliation ---
  await test('does not clobber a user-authored bio on a second reconciliation pass', async () => {
    const mockDb = new MockFirestoreDatabase();
    firestoreService.setTestFirestoreRepository(mockDb);

    const mockAuth = makeMockAuthClient([
      { uid: 'uid_sam_004', email: 'sam@example.com', emailVerified: true, displayName: 'Sam', photoURL: null },
    ]);
    reconciliationService.setTestAuthClient(mockAuth);

    await reconciliationService.reconcileUsers();

    // Simulate the user editing their bio via the legitimate profile-update path.
    await mockDb.collection('users').doc('uid_sam_004').update({ bio: 'I build satellites.' });

    await reconciliationService.reconcileUsers();

    const doc = await mockDb.collection('users').doc('uid_sam_004').get();
    assert.strictEqual(doc.data().bio, 'I build satellites.', 'User-authored bio must survive re-reconciliation');

    firestoreService.clearTestFirestoreRepository();
    reconciliationService.clearTestAuthClient();
  });

  console.log(`\n  ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exitCode = 1;
}

runReconciliationTests();
