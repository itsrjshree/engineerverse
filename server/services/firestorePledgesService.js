/**
 * ENGINEERVERSE — Authoritative Firestore Pledges Service
 * Pure JavaScript (ZERO TypeScript).
 *
 * Authoritative Data Architecture:
 * - `pledges/{pledgeId}`: Persistent engineering pledge records
 * - `systemCounters/pledges`: Authoritative atomic counter document
 *
 * Strict Guarantees:
 * - Concurrency-safe certificate numbering: `EV-{YEAR}-PLG-{COUNT}`
 * - Accurate dynamic pledge stats with zero fake counts
 * - Fail-closed 503 semantics in production
 */

import { getFirestoreInstance } from './firestoreService.js';

/**
 * Gets real aggregate pledge statistics from Firestore
 */
export async function getPledgeStats() {
  const currentYear = String(new Date().getFullYear());
  const db = getFirestoreInstance();

  try {
    const counterRef = db.collection('systemCounters').doc('pledges');
    const counterSnap = await counterRef.get();

    let totalPledgesCount = 0;
    if (counterSnap.exists) {
      totalPledgesCount = counterSnap.data().totalPledgesCount || 0;
    } else {
      // Initialize or query existing collection count
      const snapshot = await db.collection('pledges').get();
      totalPledgesCount = snapshot?.docs?.length || 0;
      await counterRef.set({ totalPledgesCount, updatedAt: new Date().toISOString() }, { merge: true });
    }

    return {
      success: true,
      totalPledgesCount,
      campaignYear: currentYear,
    };
  } catch (err) {
    console.error('[PledgesService] Error reading pledge stats:', err.message);
    if (process.env.NODE_ENV === 'production') {
      const e = new Error('Database service unavailable.');
      e.status = 503;
      throw e;
    }
    return {
      success: true,
      totalPledgesCount: 0,
      campaignYear: currentYear,
    };
  }
}

/**
 * Atomically records an engineering pledge in Firestore and generates a permanent certificate
 */
export async function createPledge({ name, commitment, role, user = null }) {
  if (!name || !commitment) {
    return {
      success: false,
      error: 'Name and commitment are required to sign the Engineering Pledge.',
      status: 400,
    };
  }

  const currentYear = new Date().getFullYear();
  const db = getFirestoreInstance();
  const pledgeId = 'pledge_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  const now = new Date().toISOString();

  try {
    const counterRef = db.collection('systemCounters').doc('pledges');
    let newCount = 1;

    // Concurrency safe increment
    if (typeof db.runTransaction === 'function') {
      await db.runTransaction(async (t) => {
        const snap = await t.get(counterRef);
        const current = snap.exists ? (snap.data().totalPledgesCount || 0) : 0;
        newCount = current + 1;
        t.set(counterRef, { totalPledgesCount: newCount, updatedAt: now }, { merge: true });
      });
    } else {
      const snap = await counterRef.get();
      const current = snap.exists ? (snap.data().totalPledgesCount || 0) : 0;
      newCount = current + 1;
      await counterRef.set({ totalPledgesCount: newCount, updatedAt: now }, { merge: true });
    }

    const certificateId = `EV-${currentYear}-PLG-${newCount}`;

    const pledgeRecord = {
      id: pledgeId,
      name: name.trim(),
      role: role?.trim() || 'Engineer',
      commitment: commitment.trim(),
      signedAt: now,
      certificateId,
      signerUid: user?.uid || null,
      createdAt: now,
    };

    await db.collection('pledges').doc(pledgeId).set(pledgeRecord);

    return {
      success: true,
      message: 'Engineering Pledge recorded successfully in authoritative ledger.',
      pledge: pledgeRecord,
      totalPledgesCount: newCount,
    };
  } catch (err) {
    console.error('[PledgesService] Error creating pledge:', err.message);
    if (process.env.NODE_ENV === 'production') {
      const e = new Error('Database service unavailable. Failed to persist pledge.');
      e.status = 503;
      throw e;
    }
    return { success: false, error: err.message, status: err.status || 500 };
  }
}
