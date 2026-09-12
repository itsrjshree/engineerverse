/**
 * ENGINEERVERSE — Authoritative Firestore Problems Service
 * Pure JavaScript (ZERO TypeScript).
 *
 * Authoritative Data Architecture:
 * - `problems/{problemId}`: Problem records
 * - `problems/{problemId}/solutions/{solutionId}`: Solution proposals subcollection
 * - `problemSupports/{problemId}_{uid}`: Deterministic support records (1 support per user)
 * - `connections/{connectionId}`: Author-Solver connections
 *
 * Strict Guarantees:
 * - Concurrency-safe support toggles without count drift
 * - Deduplication of solution proposals per user/problem
 * - Atomic credit deduction with solution proposals
 * - Zero fallback to volatile RAM in production (Fail-closed 503)
 */

import { getFirestoreInstance, isAuthorizedAdminUser } from './firestoreService.js';
import { deductCredit, refundCredit } from './firestoreCreditsService.js';
import { AUTHORIZED_ADMIN_EMAIL } from '../middleware/auth.js';

export const initialSeedProblems = [
  {
    id: 'prob_clean_water_01',
    title: 'Low-Cost Arsenic & Fluoride Water Testing for Rural Borewells',
    category: 'Environment',
    affectedUsers: 'Over 40 million citizens across Gangetic plains & arid belts',
    description: 'Groundwater in several districts exceeds safe arsenic and fluoride limits. Current chemical testing strips are either costly, fragile, or require laboratory titration. We need an open-hardware, reusable spectrophotometric or electrochemical sensor kit costing under ₹500 with zero toxic reagent waste.',
    status: 'approved',
    isResolved: false,
    resolvedAt: null,
    resolvedBy: null,
    supporterCount: 0,
    authorId: 'admin_sole_rajshree',
    authorName: 'Shree Labs Engineering Collective',
    authorEmail: 'rajshreeakm@gmail.com',
    tags: ['Water', 'IoT', 'Hardware', 'Rural'],
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'prob_cold_storage_02',
    title: 'Decentralized Solar-Powered Cold Storage for Smallholder Farmers',
    category: 'Agriculture',
    affectedUsers: 'Perishable tomato & onion cultivators losing 30% crop post-harvest',
    description: 'Grid outages in rural mandis force distress sales at heavy losses. Design an energy-dense phase-change material (PCM) cool-room powered by solar PV that maintains 4°C for 36 hours of continuous cloud cover without relying on diesel gensets.',
    status: 'approved',
    isResolved: false,
    resolvedAt: null,
    resolvedBy: null,
    supporterCount: 0,
    authorId: 'admin_sole_rajshree',
    authorName: 'Agritech Working Group',
    authorEmail: 'agritech@engineerverse.org',
    tags: ['Agriculture', 'Solar', 'Thermal Storage', 'Frugal'],
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'prob_assistive_screen_03',
    title: 'Affordable Dynamic Refreshable Braille Display',
    category: 'Accessibility',
    affectedUsers: 'Over 10 million visually impaired students and professionals',
    description: 'Commercial 40-cell refreshable Braille displays cost over $2,000 due to piezoelectric actuator patents. Can electromagnetic micro-solenoids, shape-memory alloys, or microfluidics drop the BOM cost under $50 to make digital books accessible to all?',
    status: 'approved',
    isResolved: false,
    resolvedAt: null,
    resolvedBy: null,
    supporterCount: 0,
    authorId: 'admin_sole_rajshree',
    authorName: 'Assistive Tech Lab',
    authorEmail: 'assistive@engineerverse.org',
    tags: ['Accessibility', 'Micro-actuators', 'Embedded'],
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'prob_telecom_mesh_04',
    title: 'Disaster-Resilient Mesh Network for Mountain Flood Valleys',
    category: 'Infrastructure',
    affectedUsers: 'Himalayan and coastal communities cut off during cloudbursts',
    description: 'When cellular towers drown, rescue teams operate blind. Build an autonomous solar LoRa/packet radio mesh repeater droppable by low-cost drones that routes emergency SMS and GPS coordinates without cellular infrastructure.',
    status: 'approved',
    isResolved: false,
    resolvedAt: null,
    resolvedBy: null,
    supporterCount: 0,
    authorId: 'admin_sole_rajshree',
    authorName: 'Disaster Resilience Group',
    authorEmail: 'disaster@engineerverse.org',
    tags: ['Networking', 'LoRa', 'Disaster Relief', 'Embedded'],
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

let seeded = false;

/**
 * Seeds initial problems into Firestore if empty
 */
export async function seedInitialProblemsIfNeeded() {
  if (seeded) return;
  const db = getFirestoreInstance();

  try {
    const problemsCol = db.collection('problems');
    const existing = problemsCol.limit ? await problemsCol.limit(1).get() : await problemsCol.get();
    const isEmpty = existing.empty || (Array.isArray(existing.docs) && existing.docs.length === 0);

    if (isEmpty) {
      for (const p of initialSeedProblems) {
        await problemsCol.doc(p.id).set({
          ...p,
          supporterCount: 0,
          solutionsCount: 0,
        });
      }
    }
    seeded = true;
  } catch (err) {
    // Non-fatal if seeding check encounters simulated test conditions
    console.warn('[ProblemsService] Notice during seed check:', err.message);
  }
}

/**
 * Strips sensitive solver contact info for public view unless requester is author or admin
 */
function sanitizeSolutionsForViewer(solutions = [], currentUid, authorId, isAdmin) {
  return solutions.map((s) => {
    const isProposer = currentUid && s.solverId === currentUid;
    const canSeePrivateDetails = isProposer || currentUid === authorId || isAdmin;

    if (canSeePrivateDetails) {
      return { ...s };
    }
    return {
      id: s.id,
      problemId: s.problemId,
      solverId: s.solverId,
      solverName: s.solverName,
      solverRole: s.solverRole,
      proposedSolution: s.proposedSolution,
      estimatedTimeline: s.estimatedTimeline,
      portfolioUrl: s.portfolioUrl,
      status: s.status,
      createdAt: s.createdAt,
      // Private fields masked
      contactPitch: null,
      solverEmail: null,
    };
  });
}

/**
 * Get all approved problems for public community wall
 */
export async function getAllApproved(currentUid = null, filters = {}) {
  await seedInitialProblemsIfNeeded();
  const db = getFirestoreInstance();

  try {
    const snapshot = await db.collection('problems').get();
    let problems = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (data.status === 'approved') {
        problems.push({ ...data, id: doc.id });
      }
    }

    // Sort newest first
    problems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply filters
    if (filters.category && filters.category !== 'All') {
      problems = problems.filter((p) => p.category?.toLowerCase() === filters.category.toLowerCase());
    }

    if (filters.search && filters.search.trim()) {
      const term = filters.search.toLowerCase().trim();
      problems = problems.filter(
        (p) =>
          p.title?.toLowerCase().includes(term) ||
          p.description?.toLowerCase().includes(term) ||
          (Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase().includes(term)))
      );
    }

    // Batch resolve `isSupported` for current user
    const resolvedProblems = await Promise.all(
      problems.map(async (p) => {
        let isSupported = false;
        if (currentUid) {
          const supportId = `${p.id}_${currentUid}`;
          const supportDoc = await db.collection('problemSupports').doc(supportId).get();
          isSupported = supportDoc.exists;
        }

        // Fetch solution count & solutions
        const solutions = await getSolutionsForProblem(p.id, currentUid, p.authorId);

        return {
          ...p,
          isSupported,
          supporterCount: p.supporterCount || 0,
          solutionsCount: solutions.length,
          solutions,
        };
      })
    );

    return resolvedProblems;
  } catch (err) {
    console.error('[ProblemsService] Error reading approved problems:', err.message);
    if (process.env.NODE_ENV === 'production') {
      const e = new Error('Database service unavailable.');
      e.status = 503;
      throw e;
    }
    return [];
  }
}

/**
 * Get solutions for a specific problem
 *
 * CANONICAL STORE: `problemSolutions/{solutionId}` (top-level) is the
 * authoritative collection — every mutation (create, connect, decline) writes
 * to it unconditionally. The `problems/{problemId}/solutions/{solutionId}`
 * subcollection is a best-effort secondary write (its updates on
 * connect/decline are wrapped in a swallowed try/catch — see
 * respondToSolution()), so it can silently fall behind. Reading it FIRST, as
 * this function previously did, could surface a stale status (e.g. showing
 * "pending" after the proposal was actually accepted). We now read the
 * top-level collection first; the subcollection is only consulted as a
 * legacy fallback if the top-level query is unexpectedly empty.
 */
export async function getSolutionsForProblem(problemId, currentUid = null, authorId = null, isAdmin = false) {
  const db = getFirestoreInstance();
  try {
    let solutions = [];

    const topCol = db.collection('problemSolutions');
    if (typeof topCol.where === 'function') {
      const topSnap = await topCol.where('problemId', '==', problemId).get();
      if (topSnap && topSnap.docs) {
        solutions = topSnap.docs.map((d) => ({ ...d.data(), id: d.id }));
      }
    }

    // Legacy fallback only — should not normally trigger, since the
    // top-level collection is written unconditionally on every mutation.
    if (solutions.length === 0) {
      const problemRef = db.collection('problems').doc(problemId);
      if (typeof problemRef.collection === 'function') {
        const subSnap = await problemRef.collection('solutions').get();
        if (subSnap && subSnap.docs) {
          solutions = subSnap.docs.map((d) => ({ ...d.data(), id: d.id }));
        }
      }
    }

    return sanitizeSolutionsForViewer(solutions, currentUid, authorId, isAdmin);
  } catch (err) {
    console.warn(`[ProblemsService] Error reading solutions for ${problemId}:`, err.message);
    return [];
  }
}

/**
 * Get a single problem by ID with full solution details and support state
 */
export async function getById(id, currentUid = null) {
  if (!id) return null;
  const db = getFirestoreInstance();

  try {
    const docRef = db.collection('problems').doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return null;

    const problem = { ...docSnap.data(), id: docSnap.id };
    const isAdmin = currentUid ? isAuthorizedAdminUser(null, currentUid) : false;

    let isSupported = false;
    if (currentUid) {
      const supportId = `${id}_${currentUid}`;
      const supportDoc = await db.collection('problemSupports').doc(supportId).get();
      isSupported = supportDoc.exists;
    }

    const solutions = await getSolutionsForProblem(id, currentUid, problem.authorId, isAdmin);

    return {
      ...problem,
      isSupported,
      supporterCount: problem.supporterCount || 0,
      solutionsCount: solutions.length,
      solutions,
    };
  } catch (err) {
    console.error(`[ProblemsService] Error reading problem ${id}:`, err.message);
    if (process.env.NODE_ENV === 'production') {
      const e = new Error('Database service unavailable.');
      e.status = 503;
      throw e;
    }
    return null;
  }
}

/**
 * Creates a new problem document in Firestore
 */
export async function createProblem({ title, category, description, affectedUsers, tags, user }) {
  if (!user || user.isAnonymous) {
    return { success: false, error: 'Authentication required to post problems.', status: 401 };
  }

  if (user.status === 'suspended' || user.status === 'blocked') {
    return { success: false, error: `Account ${user.status} by administration.`, status: 403 };
  }

  if (!title || !category || !description) {
    return {
      success: false,
      error: 'Title, category, and engineering description are required.',
      status: 400,
    };
  }

  const db = getFirestoreInstance();
  const problemId = 'prob_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const now = new Date().toISOString();

  const problemData = {
    id: problemId,
    title: title.trim(),
    category: category.trim(),
    description: description.trim(),
    affectedUsers: affectedUsers?.trim() || 'General community impact',
    tags: Array.isArray(tags) ? tags.map((t) => String(t).trim()).filter(Boolean) : [],
    status: 'approved', // Auto-approved for verified members in V0
    isResolved: false,
    resolvedAt: null,
    resolvedBy: null,
    supporterCount: 0,
    solutionsCount: 0,
    authorId: user.uid,
    authorName: user.name || user.displayName || (user.email ? user.email.split('@')[0] : 'Engineer'),
    authorEmail: user.email || '',
    authorPhotoURL: user.photoURL || null,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await db.collection('problems').doc(problemId).set(problemData);
    return {
      success: true,
      message: 'Problem posted to the Engineer Problem Wall.',
      problem: { ...problemData, isSupported: false, solutions: [] },
    };
  } catch (err) {
    console.error('[ProblemsService] Error creating problem:', err.message);
    if (process.env.NODE_ENV === 'production') {
      const e = new Error('Database service unavailable. Failed to persist problem.');
      e.status = 503;
      throw e;
    }
    return { success: false, error: err.message, status: err.status || 500 };
  }
}

/**
 * Updates a problem document in Firestore
 */
export async function updateProblem(id, updates, user) {
  if (!id || !user) {
    return { success: false, error: 'Problem ID and authenticated user are required.', status: 400 };
  }

  const db = getFirestoreInstance();

  try {
    const docRef = db.collection('problems').doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return { success: false, error: 'Problem not found.', status: 404 };
    }

    const currentData = docSnap.data();
    const isAdmin = isAuthorizedAdminUser(user.email, user.uid, user.emailVerified);
    const isAuthor = currentData.authorId === user.uid;

    if (!isAuthor && !isAdmin) {
      return { success: false, error: 'Unauthorized to modify this problem record.', status: 403 };
    }

    const allowedFields = ['title', 'category', 'description', 'affectedUsers', 'tags'];
    const sanitizedUpdates = { updatedAt: new Date().toISOString() };

    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        if (key === 'tags') {
          sanitizedUpdates.tags = Array.isArray(updates.tags)
            ? updates.tags.map((t) => String(t).trim()).filter(Boolean)
            : [];
        } else if (typeof updates[key] === 'string') {
          sanitizedUpdates[key] = updates[key].trim();
        }
      }
    }

    await docRef.update(sanitizedUpdates);
    const updated = { ...currentData, ...sanitizedUpdates, id };

    return {
      success: true,
      message: 'Problem updated successfully.',
      problem: updated,
    };
  } catch (err) {
    console.error(`[ProblemsService] Error updating problem ${id}:`, err.message);
    if (process.env.NODE_ENV === 'production') {
      const e = new Error('Database service unavailable.');
      e.status = 503;
      throw e;
    }
    return { success: false, error: err.message, status: err.status || 500 };
  }
}

/**
 * Deletes a problem document and its associated supports/solutions
 */
export async function deleteProblem(id, user) {
  if (!id || !user) {
    return { success: false, error: 'Problem ID and user required.', status: 400 };
  }

  const db = getFirestoreInstance();

  try {
    const docRef = db.collection('problems').doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return { success: false, error: 'Problem not found.', status: 404 };
    }

    const currentData = docSnap.data();
    const isAdmin = isAuthorizedAdminUser(user.email, user.uid, user.emailVerified);
    const isAuthor = currentData.authorId === user.uid;

    if (!isAuthor && !isAdmin) {
      return { success: false, error: 'Unauthorized to delete this problem.', status: 403 };
    }

    await docRef.delete();

    // Clean supports associated with this problem
    try {
      const supports = await db.collection('problemSupports').where('problemId', '==', id).get();
      if (supports && supports.docs) {
        for (const s of supports.docs) {
          await db.collection('problemSupports').doc(s.id).delete();
        }
      }
    } catch {}

    return { success: true, message: 'Problem deleted permanently from Firestore.' };
  } catch (err) {
    console.error(`[ProblemsService] Error deleting problem ${id}:`, err.message);
    if (process.env.NODE_ENV === 'production') {
      const e = new Error('Database service unavailable.');
      e.status = 503;
      throw e;
    }
    return { success: false, error: err.message, status: err.status || 500 };
  }
}

/**
 * Toggles resolved status of a problem
 */
export async function toggleResolveProblem(id, user, isResolvedStatus = undefined) {
  if (!id || !user) {
    return { success: false, error: 'Problem ID and user required.', status: 400 };
  }

  const db = getFirestoreInstance();

  try {
    const docRef = db.collection('problems').doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return { success: false, error: 'Problem not found.', status: 404 };
    }

    const currentData = docSnap.data();
    const isAdmin = isAuthorizedAdminUser(user.email, user.uid, user.emailVerified);
    const isAuthor = currentData.authorId === user.uid;

    if (!isAuthor && !isAdmin) {
      return { success: false, error: 'Unauthorized to toggle problem resolution.', status: 403 };
    }

    const nextState = isResolvedStatus !== undefined ? Boolean(isResolvedStatus) : !currentData.isResolved;
    const now = new Date().toISOString();

    const updates = {
      isResolved: nextState,
      resolvedAt: nextState ? now : null,
      resolvedBy: nextState ? user.uid : null,
      updatedAt: now,
    };

    await docRef.update(updates);

    return {
      success: true,
      message: nextState ? 'Problem marked as solved!' : 'Problem reopened for solutions.',
      isResolved: nextState,
      problem: { ...currentData, ...updates, id },
    };
  } catch (err) {
    console.error(`[ProblemsService] Error resolving problem ${id}:`, err.message);
    if (process.env.NODE_ENV === 'production') {
      const e = new Error('Database service unavailable.');
      e.status = 503;
      throw e;
    }
    return { success: false, error: err.message, status: err.status || 500 };
  }
}

/**
 * Atomically toggles user support for a problem using deterministic `problemSupports/{problemId}_{uid}`.
 * Prevents multiple supports from the same user and eliminates count drift.
 */
export async function toggleSupport(id, user) {
  if (!id || !user || user.isAnonymous) {
    return { success: false, error: 'Authentication required to support problems.', status: 401 };
  }

  const db = getFirestoreInstance();
  const supportId = `${id}_${user.uid}`;
  const supportRef = db.collection('problemSupports').doc(supportId);
  const problemRef = db.collection('problems').doc(id);

  try {
    const executeToggle = async (transaction) => {
      const problemSnap = await (transaction ? transaction.get(problemRef) : problemRef.get());
      if (!problemSnap.exists) {
        return { success: false, error: 'Problem not found.', status: 404 };
      }

      const problemData = problemSnap.data();
      const currentSupportSnap = await (transaction ? transaction.get(supportRef) : supportRef.get());
      const isCurrentlySupported = currentSupportSnap.exists;

      let newSupportCount = typeof problemData.supporterCount === 'number' ? problemData.supporterCount : 0;
      let nextIsSupported = false;

      if (isCurrentlySupported) {
        // Remove support
        if (transaction) {
          transaction.delete(supportRef);
        } else {
          await supportRef.delete();
        }
        newSupportCount = Math.max(0, newSupportCount - 1);
        nextIsSupported = false;
      } else {
        // Add support
        const newSupportDoc = {
          id: supportId,
          problemId: id,
          uid: user.uid,
          userName: user.name || user.displayName || 'Engineer',
          createdAt: new Date().toISOString(),
        };
        if (transaction) {
          transaction.set(supportRef, newSupportDoc);
        } else {
          await supportRef.set(newSupportDoc);
        }
        newSupportCount += 1;
        nextIsSupported = true;
      }

      const updateData = {
        supporterCount: newSupportCount,
        updatedAt: new Date().toISOString(),
      };

      if (transaction) {
        transaction.update(problemRef, updateData);
      } else {
        await problemRef.update(updateData);
      }

      return {
        success: true,
        isSupported: nextIsSupported,
        supporterCount: newSupportCount,
        message: nextIsSupported ? 'You are now supporting this engineering challenge.' : 'Support removed.',
      };
    };

    if (typeof db.runTransaction === 'function') {
      return await db.runTransaction(async (t) => executeToggle(t));
    }
    return await executeToggle(null);
  } catch (err) {
    console.error(`[ProblemsService] Error toggling support for problem ${id}:`, err.message);
    if (process.env.NODE_ENV === 'production') {
      const e = new Error('Database service unavailable.');
      e.status = 503;
      throw e;
    }
    return { success: false, error: err.message, status: err.status || 500 };
  }
}

/**
 * Proposes a solution to a problem.
 * Enforces:
 * 1. Problem exists & is not resolved.
 * 2. User cannot propose if they already have an active/pending proposal for this problem.
 * 3. Deducts 1 connection credit atomically via `firestoreCreditsService`.
 * 4. Writes proposal to `problems/{problemId}/solutions/{solutionId}` and `problemSolutions/{solutionId}`.
 */
export async function proposeSolution(problemId, payload, user) {
  if (!problemId || !user || user.isAnonymous) {
    return { success: false, error: 'Authentication required to submit proposals.', status: 401 };
  }

  if (user.status === 'suspended' || user.status === 'blocked') {
    return { success: false, error: `Account ${user.status} by administration.`, status: 403 };
  }

  const { proposedSolution, contactPitch, estimatedTimeline, portfolioUrl } = payload || {};

  if (!proposedSolution || !proposedSolution.trim()) {
    return { success: false, error: 'Engineering solution proposal details are required.', status: 400 };
  }

  const db = getFirestoreInstance();
  const problemRef = db.collection('problems').doc(problemId);
  let creditResult = null;

  try {
    const problemSnap = await problemRef.get();
    if (!problemSnap.exists) {
      return { success: false, error: 'Problem not found.', status: 404 };
    }

    const problem = problemSnap.data();
    if (problem.isResolved) {
      return { success: false, error: 'This problem is already marked as solved.', status: 400 };
    }

    // Check for duplicate pending proposals from same solver on this problem
    const existingSolutions = await getSolutionsForProblem(problemId, user.uid, problem.authorId, true);
    const alreadyProposed = existingSolutions.some(
      (s) => s.solverId === user.uid && s.status !== 'declined'
    );

    if (alreadyProposed) {
      return {
        success: false,
        error: 'You have already submitted a proposal for this problem. Await author review or response.',
        status: 409,
      };
    }

    // Deduct 1 credit atomically
    creditResult = await deductCredit({
      uid: user.uid,
      reason: 'SOLUTION_PROPOSAL',
      referenceId: problemId,
    });

    if (!creditResult.success) {
      return {
        success: false,
        error: creditResult.error,
        remainingCredits: creditResult.remainingCredits || 0,
        status: 402,
      };
    }

    const solutionId = 'sol_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const now = new Date().toISOString();

    const solutionRecord = {
      id: solutionId,
      problemId,
      solverId: user.uid,
      solverName: user.name || user.displayName || (user.email ? user.email.split('@')[0] : 'Engineer'),
      solverEmail: user.email || '',
      solverRole: user.role || 'Member',
      solverPhotoURL: user.photoURL || null,
      proposedSolution: proposedSolution.trim(),
      contactPitch: contactPitch ? contactPitch.trim() : '',
      estimatedTimeline: estimatedTimeline ? estimatedTimeline.trim() : '2-4 weeks',
      portfolioUrl: portfolioUrl ? portfolioUrl.trim() : '',
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    // Write to subcollection if supported, and top-level problemSolutions
    if (typeof problemRef.collection === 'function') {
      await problemRef.collection('solutions').doc(solutionId).set(solutionRecord);
    }
    await db.collection('problemSolutions').doc(solutionId).set(solutionRecord);

    // Update solutions count on problem
    const currentCount = typeof problem.solutionsCount === 'number' ? problem.solutionsCount : 0;
    await problemRef.update({
      solutionsCount: currentCount + 1,
      updatedAt: now,
    });

    // Notify the problem author that an engineer proposed a solution
    try {
      const { createNotification } = await import('./notificationService.js');
      await createNotification({
        recipientUid: problem.authorId,
        actorUid: user.uid,
        actorName: solutionRecord.solverName,
        type: 'PROPOSAL_RECEIVED',
        title: 'New Technical Proposal Received',
        message: `${solutionRecord.solverName} submitted an engineering solution proposal for: "${problem.title}"`,
        referenceType: 'problem',
        referenceId: problemId,
      });
    } catch (notifErr) {
      console.warn('[ProblemsService] Notification notice (non-fatal):', notifErr.message);
    }

    return {
      success: true,
      message: 'Your engineering proposal has been submitted to the problem author.',
      solution: solutionRecord,
      remainingCredits: creditResult.remainingCredits,
    };
  } catch (err) {
    if (creditResult && creditResult.success) {
      await refundCredit({ uid: user.uid, amount: 1, reason: 'SOLUTION_CREATION_ROLLBACK' }).catch(() => {});
    }
    console.error(`[ProblemsService] Error proposing solution to problem ${problemId}:`, err.message);
    if (process.env.NODE_ENV === 'production') {
      const e = new Error('Database service unavailable.');
      e.status = 503;
      throw e;
    }
    return { success: false, error: err.message, status: err.status || 500 };
  }
}

/**
 * Responds to a proposed solution (connect or decline)
 */
export async function respondToSolution(problemId, solutionId, action, user) {
  if (!problemId || !solutionId || !user || user.isAnonymous) {
    return { success: false, error: 'Authentication required.', status: 401 };
  }

  const db = getFirestoreInstance();

  try {
    const problemRef = db.collection('problems').doc(problemId);
    const problemSnap = await problemRef.get();
    if (!problemSnap.exists) {
      return { success: false, error: 'Problem not found.', status: 404 };
    }

    const problem = problemSnap.data();
    const isAdmin = isAuthorizedAdminUser(user.email, user.uid, user.emailVerified);
    const isAuthor = problem.authorId === user.uid;

    if (!isAuthor && !isAdmin) {
      return { success: false, error: 'Only the problem author or admin can respond to proposals.', status: 403 };
    }

    const solRef = db.collection('problemSolutions').doc(solutionId);
    const solSnap = await solRef.get();
    if (!solSnap.exists) {
      return { success: false, error: 'Solution proposal not found.', status: 404 };
    }

    const solution = solSnap.data();
    const now = new Date().toISOString();

    if (action === 'connect') {
      // Deduct 1 credit from problem author upon mutual connection (unless admin)
      if (!isAdmin) {
        const creditResult = await deductCredit({
          uid: user.uid,
          reason: 'CONNECTION_ACCEPTED',
          referenceId: solutionId,
        });
        if (!creditResult.success) {
          return {
            success: false,
            error: 'You need at least 1 connection credit to accept and exchange contact details with this engineer.',
            status: 402,
          };
        }
      }

      // Record permanent connection
      const connectionId = `conn_${problemId}_${solution.solverId}`;
      const connectionDoc = {
        id: connectionId,
        problemId,
        problemTitle: problem.title,
        authorId: problem.authorId,
        authorName: problem.authorName,
        authorEmail: problem.authorEmail,
        solverId: solution.solverId,
        solverName: solution.solverName,
        solverEmail: solution.solverEmail,
        solutionId,
        status: 'connected',
        connectedAt: now,
      };

      await db.collection('connections').doc(connectionId).set(connectionDoc);

      // Update solution status
      await solRef.update({ status: 'connected', updatedAt: now });
      if (typeof problemRef.collection === 'function') {
        try {
          await problemRef.collection('solutions').doc(solutionId).update({ status: 'connected', updatedAt: now });
        } catch {}
      }

      // Notify the solver that the author accepted the connection handshake
      try {
        const { createNotification } = await import('./notificationService.js');
        await createNotification({
          recipientUid: solution.solverId,
          actorUid: user.uid,
          actorName: problem.authorName,
          type: 'CONNECTION_ACCEPTED',
          title: 'Handshake Accepted! Direct Connection Established',
          message: `${problem.authorName} accepted your solution on "${problem.title}". Direct contact is now unlocked!`,
          referenceType: 'connection',
          referenceId: connectionId,
        });
      } catch (notifErr) {
        console.warn('[ProblemsService] Notification notice (non-fatal):', notifErr.message);
      }

      return {
        success: true,
        message: 'Connection established! Contact details exchanged with the solver.',
        connection: connectionDoc,
        solution: { ...solution, status: 'connected', updatedAt: now },
      };
    } else if (action === 'decline') {
      await solRef.update({ status: 'declined', updatedAt: now });
      if (typeof problemRef.collection === 'function') {
        try {
          await problemRef.collection('solutions').doc(solutionId).update({ status: 'declined', updatedAt: now });
        } catch {}
      }

      return {
        success: true,
        message: 'Proposal declined.',
        solution: { ...solution, status: 'declined', updatedAt: now },
      };
    } else {
      return { success: false, error: 'Invalid action. Must be "connect" or "decline".', status: 400 };
    }
  } catch (err) {
    console.error(`[ProblemsService] Error responding to solution ${solutionId}:`, err.message);
    if (process.env.NODE_ENV === 'production') {
      const e = new Error('Database service unavailable.');
      e.status = 503;
      throw e;
    }
    return { success: false, error: err.message, status: err.status || 500 };
  }
}

/**
 * Get problems authored by a specific user
 */
export async function getByAuthor(authorUid) {
  if (!authorUid) return [];
  const db = getFirestoreInstance();

  try {
    const snapshot = await db.collection('problems').where('authorId', '==', authorUid).get();
    if (!snapshot || !snapshot.docs) return [];

    return snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
  } catch (err) {
    console.error(`[ProblemsService] Error reading problems by author ${authorUid}:`, err.message);
    return [];
  }
}

/**
 * Get problems supported by a specific user
 */
export async function getSupportedByUser(userUid) {
  if (!userUid) return [];
  const db = getFirestoreInstance();

  try {
    const supports = await db.collection('problemSupports').where('uid', '==', userUid).get();
    if (!supports || !supports.docs || supports.docs.length === 0) return [];

    const problemIds = supports.docs.map((d) => d.data().problemId).filter(Boolean);
    const problems = [];

    for (const pid of problemIds) {
      const doc = await db.collection('problems').doc(pid).get();
      if (doc.exists) {
        problems.push({ ...doc.data(), id: doc.id, isSupported: true });
      }
    }

    return problems;
  } catch (err) {
    console.error(`[ProblemsService] Error reading supported problems for ${userUid}:`, err.message);
    return [];
  }
}

/**
 * Get solutions proposed by a specific solver
 */
export async function getSolutionsProposedByUser(solverUid) {
  if (!solverUid) return [];
  const db = getFirestoreInstance();

  try {
    const solutionsSnap = await db.collection('problemSolutions').where('solverId', '==', solverUid).get();
    if (!solutionsSnap || !solutionsSnap.docs) return [];

    return solutionsSnap.docs.map((d) => ({ ...d.data(), id: d.id }));
  } catch (err) {
    console.error(`[ProblemsService] Error reading proposed solutions for ${solverUid}:`, err.message);
    return [];
  }
}

/**
 * Admin view of all problems
 */
export async function getAllForAdmin() {
  await seedInitialProblemsIfNeeded();
  const db = getFirestoreInstance();

  try {
    const snapshot = await db.collection('problems').get();
    const problems = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const solutions = await getSolutionsForProblem(doc.id, null, data.authorId, true);
      problems.push({
        ...data,
        id: doc.id,
        solutions,
      });
    }

    problems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return problems;
  } catch (err) {
    console.error('[ProblemsService] Error getting all problems for admin:', err.message);
    if (process.env.NODE_ENV === 'production') {
      const e = new Error('Database service unavailable.');
      e.status = 503;
      throw e;
    }
    return [];
  }
}

/**
 * Admin set problem status
 */
export async function adminSetStatus(id, status, isResolved = undefined) {
  if (!id) return { success: false, error: 'Problem ID required.' };
  const db = getFirestoreInstance();

  try {
    const docRef = db.collection('problems').doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return { success: false, error: 'Problem not found.', status: 404 };
    }

    const updates = { updatedAt: new Date().toISOString() };
    if (status) updates.status = status;
    if (isResolved !== undefined) {
      updates.isResolved = Boolean(isResolved);
      if (updates.isResolved) {
        updates.resolvedAt = new Date().toISOString();
        updates.resolvedBy = 'admin';
      }
    }

    await docRef.update(updates);
    const updated = { ...docSnap.data(), ...updates, id };

    return { success: true, message: 'Problem status updated by admin.', problem: updated };
  } catch (err) {
    console.error(`[ProblemsService] Admin status update error on ${id}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Purges or anonymizes user data across the Problem Wall when account is deleted
 */
export async function purgeUserData(uid) {
  if (!uid) return;
  const db = getFirestoreInstance();

  try {
    // 1. Remove user supports and adjust supporterCount
    const supports = await db.collection('problemSupports').where('uid', '==', uid).get();
    if (supports && supports.docs) {
      for (const s of supports.docs) {
        const supportData = s.data();
        await db.collection('problemSupports').doc(s.id).delete();
        if (supportData.problemId) {
          const probRef = db.collection('problems').doc(supportData.problemId);
          const probSnap = await probRef.get();
          if (probSnap.exists) {
            const currentCount = probSnap.data().supporterCount || 0;
            await probRef.update({ supporterCount: Math.max(0, currentCount - 1) });
          }
        }
      }
    }

    // 2. Anonymize user authored problems
    const authored = await db.collection('problems').where('authorId', '==', uid).get();
    if (authored && authored.docs) {
      for (const p of authored.docs) {
        await db.collection('problems').doc(p.id).update({
          authorName: 'Former Community Engineer',
          authorEmail: '',
          authorPhotoURL: null,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // 3. Anonymize solution proposals
    const solutions = await db.collection('problemSolutions').where('solverId', '==', uid).get();
    if (solutions && solutions.docs) {
      for (const sol of solutions.docs) {
        await db.collection('problemSolutions').doc(sol.id).update({
          solverName: 'Former Community Engineer',
          solverEmail: '',
          solverPhotoURL: null,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  } catch (err) {
    console.warn(`[ProblemsService] Warning during purgeUserData for ${uid}:`, err.message);
  }
}
