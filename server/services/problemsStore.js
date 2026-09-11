/**
 * ENGINEERVERSE — Authoritative Problems Store Proxy
 * Pure JavaScript (ZERO TypeScript).
 *
 * This module delegates directly to `firestoreProblemsService.js` to ensure
 * ONE authoritative Firestore source of truth with zero RAM drift.
 */

import * as firestoreProblemsService from './firestoreProblemsService.js';
import { initialSeedProblems } from './firestoreProblemsService.js';

class ProblemsStoreProxy {
  async getAllApproved(currentUid = null, filters = {}) {
    return await firestoreProblemsService.getAllApproved(currentUid, filters);
  }

  async getById(id, currentUid = null) {
    return await firestoreProblemsService.getById(id, currentUid);
  }

  async getRawById(id) {
    return await firestoreProblemsService.getById(id, null);
  }

  async createProblem(data, user) {
    return await firestoreProblemsService.createProblem({ ...data, user });
  }

  async updateProblem(id, updates, user) {
    return await firestoreProblemsService.updateProblem(id, updates, user);
  }

  async deleteProblem(id, user) {
    return await firestoreProblemsService.deleteProblem(id, user);
  }

  async toggleResolveProblem(id, user, isResolvedStatus = undefined) {
    return await firestoreProblemsService.toggleResolveProblem(id, user, isResolvedStatus);
  }

  async toggleSupport(id, user) {
    return await firestoreProblemsService.toggleSupport(id, user);
  }

  async proposeSolution(problemId, payload, user) {
    return await firestoreProblemsService.proposeSolution(problemId, payload, user);
  }

  async respondToSolution(problemId, solutionId, action, user) {
    return await firestoreProblemsService.respondToSolution(problemId, solutionId, action, user);
  }

  async getByAuthor(authorUid) {
    return await firestoreProblemsService.getByAuthor(authorUid);
  }

  async getSupportedByUser(userUid) {
    return await firestoreProblemsService.getSupportedByUser(userUid);
  }

  async getSolutionsProposedByUser(solverUid) {
    return await firestoreProblemsService.getSolutionsProposedByUser(solverUid);
  }

  async getAllForAdmin() {
    return await firestoreProblemsService.getAllForAdmin();
  }

  async adminSetStatus(id, status, isResolved) {
    return await firestoreProblemsService.adminSetStatus(id, status, isResolved);
  }

  async purgeUserData(uid) {
    return await firestoreProblemsService.purgeUserData(uid);
  }
}

export const problemsStore = new ProblemsStoreProxy();
export { initialSeedProblems };
export default problemsStore;
