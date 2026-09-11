/**
 * ENGINEERVERSE — Authoritative Firestore Credits Service
 * Pure JavaScript (ZERO TypeScript).
 *
 * Implements an atomic ledger architecture:
 * - `creditAccounts/{uid}`: Current balance & metadata
 * - `creditTransactions/{txId}`: Immutable transactional history
 *
 * Enforces:
 * - Atomic credit deduction with solution proposals & connection requests
 * - Zero overdraft (balance cannot drop below 0)
 * - Administrative exemption (Admin has 9999 connection credits)
 * - Strict production fail-closed semantics (503 on Firestore error)
 */

import { FieldValue } from 'firebase-admin/firestore';
import { getFirestoreInstance, isAuthorizedAdminUser } from './firestoreService.js';
import { AUTHORIZED_ADMIN_EMAIL } from '../middleware/auth.js';

/**
 * Retrieves the credit balance for a user
 */
export async function getCreditBalance(uid) {
  if (!uid) return 0;
  const db = getFirestoreInstance();

  try {
    const userDocRef = db.collection('users').doc(uid);
    const userSnap = await userDocRef.get();
    if (!userSnap.exists) return 0;

    const userData = userSnap.data();
    if (userData.isAdmin || userData.role === 'admin') {
      return 9999;
    }

    // Check dedicated creditAccounts doc if present, fallback to user document
    const accountRef = db.collection('creditAccounts').doc(uid);
    const accountSnap = await accountRef.get();

    if (accountSnap.exists) {
      return accountSnap.data().balance ?? userData.connectionCredits ?? 5;
    }

    return userData.connectionCredits ?? 5;
  } catch (err) {
    console.error(`[CreditsService] Error reading balance for ${uid}:`, err.message);
    if (process.env.NODE_ENV === 'production') {
      const e = new Error('Database service unavailable. Failed to query credit balance.');
      e.code = 'firestore/read-failure';
      e.status = 503;
      throw e;
    }
    return 5;
  }
}

/**
 * Atomically deducts 1 connection credit and records an immutable ledger entry.
 * Can be called with an optional active transaction context.
 * Returns { success: boolean, remainingCredits: number, txId: string }
 */
export async function deductCredit({ uid, reason = 'SOLUTION_PROPOSAL', referenceId = null, txContext = null }) {
  if (!uid) return { success: false, error: 'User ID is required.' };
  const db = getFirestoreInstance();

  const executeDeduction = async (transaction) => {
    const userRef = db.collection('users').doc(uid);
    const userSnap = await (transaction ? transaction.get(userRef) : userRef.get());

    if (!userSnap.exists) {
      return { success: false, error: 'User account not found in database.' };
    }

    const userData = userSnap.data();
    const isAdmin = isAuthorizedAdminUser(userData.email, userData.uid, userData.emailVerified);

    if (isAdmin) {
      // Admin is exempted from credit exhaustion
      return { success: true, remainingCredits: 9999, txId: `tx_admin_${Date.now()}` };
    }

    const currentBalance = typeof userData.connectionCredits === 'number' ? userData.connectionCredits : 5;
    if (currentBalance <= 0) {
      return {
        success: false,
        error: 'Insufficient connection credits. You need at least 1 credit to propose a solution or connect with the author.',
        remainingCredits: 0,
      };
    }

    const newBalance = currentBalance - 1;
    const nowIso = new Date().toISOString();
    const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const transactionRecord = {
      id: txId,
      uid,
      amount: -1,
      balanceAfter: newBalance,
      reason,
      referenceId: referenceId ? String(referenceId) : null,
      timestamp: nowIso,
    };

    const accountRef = db.collection('creditAccounts').doc(uid);
    const txRef = db.collection('creditTransactions').doc(txId);

    if (transaction) {
      transaction.update(userRef, { connectionCredits: newBalance, updatedAt: nowIso });
      transaction.set(accountRef, { uid, balance: newBalance, updatedAt: nowIso }, { merge: true });
      transaction.set(txRef, transactionRecord);
    } else {
      await userRef.update({ connectionCredits: newBalance, updatedAt: nowIso });
      await accountRef.set({ uid, balance: newBalance, updatedAt: nowIso }, { merge: true });
      await txRef.set(transactionRecord);
    }

    return { success: true, remainingCredits: newBalance, txId };
  };

  try {
    if (txContext) {
      return await executeDeduction(txContext);
    }
    // If running in Firestore transaction mode
    if (typeof db.runTransaction === 'function') {
      return await db.runTransaction(async (t) => executeDeduction(t));
    }
    return await executeDeduction(null);
  } catch (err) {
    console.error(`[CreditsService] Credit deduction error for ${uid}:`, err.message);
    if (process.env.NODE_ENV === 'production') {
      const e = new Error('Database service unavailable. Credit transaction failed.');
      e.code = 'firestore/write-failure';
      e.status = 503;
      throw e;
    }
    throw err;
  }
}

/**
 * Refunds 1 connection credit (e.g. if a proposal is cancelled or rejected)
 */
export async function refundCredit({ uid, reason = 'PROPOSAL_REFUND', referenceId = null }) {
  if (!uid) return { success: false, error: 'User ID is required.' };
  const db = getFirestoreInstance();

  try {
    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) return { success: false, error: 'User not found.' };

    const userData = userSnap.data();
    if (userData.isAdmin || userData.role === 'admin') {
      return { success: true, remainingCredits: 9999 };
    }

    const currentBalance = typeof userData.connectionCredits === 'number' ? userData.connectionCredits : 5;
    const newBalance = currentBalance + 1;
    const nowIso = new Date().toISOString();
    const txId = `tx_refund_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const txRef = db.collection('creditTransactions').doc(txId);
    await txRef.set({
      id: txId,
      uid,
      amount: 1,
      balanceAfter: newBalance,
      reason,
      referenceId: referenceId ? String(referenceId) : null,
      timestamp: nowIso,
    });

    await userRef.update({ connectionCredits: newBalance, updatedAt: nowIso });
    await db.collection('creditAccounts').doc(uid).set({ uid, balance: newBalance, updatedAt: nowIso }, { merge: true });

    return { success: true, remainingCredits: newBalance, txId };
  } catch (err) {
    console.error(`[CreditsService] Error refunding credit for ${uid}:`, err.message);
    return { success: false, error: err.message };
  }
}
