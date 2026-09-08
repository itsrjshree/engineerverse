/**
 * ENGINEERVERSE — The Problem Wall Store
 * Pure JavaScript.
 * Strictly enforces zero fake metrics, verified user attribution,
 * persistent support counts, solution proposal exchanges, and status toggles.
 */

import { usersStore } from './usersStore.js';

// Curated seed problems with zero fake counts (all real counts start at 0)
const initialSeedProblems = [
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
    supportedByUids: [],
    authorId: 'admin_sole_rajshree',
    authorName: 'Shree Labs Engineering Collective',
    authorEmail: 'rajshreeakm@gmail.com',
    tags: ['Water', 'IoT', 'Hardware', 'Rural'],
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    solutions: [],
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
    supportedByUids: [],
    authorId: 'admin_sole_rajshree',
    authorName: 'Agritech Working Group',
    authorEmail: 'agritech@engineerverse.org',
    tags: ['Agriculture', 'Solar', 'Thermal Storage', 'Frugal'],
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    solutions: [],
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
    supportedByUids: [],
    authorId: 'admin_sole_rajshree',
    authorName: 'Assistive Tech Lab',
    authorEmail: 'assistive@engineerverse.org',
    tags: ['Accessibility', 'Micro-actuators', 'Embedded'],
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    solutions: [],
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
    supportedByUids: [],
    authorId: 'admin_sole_rajshree',
    authorName: 'Disaster Resilience Group',
    authorEmail: 'disaster@engineerverse.org',
    tags: ['Networking', 'LoRa', 'Disaster Relief', 'Embedded'],
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    solutions: [],
  },
];

class ProblemsStore {
  constructor() {
    this.problems = new Map();
    for (const p of initialSeedProblems) {
      this.problems.set(p.id, { ...p, supportedByUids: [...p.supportedByUids], solutions: [...p.solutions] });
    }
  }

  getAllApproved(currentUid = null, { category = null, search = null } = {}) {
    let list = Array.from(this.problems.values()).filter((p) => p.status === 'approved');

    if (category && category !== 'All') {
      list = list.filter((p) => p.category.toLowerCase().includes(category.toLowerCase()));
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Sort: unresolved first, then by supporter count descending, then by creation date
    list.sort((a, b) => {
      if (a.isResolved !== b.isResolved) return a.isResolved ? 1 : -1;
      if (b.supporterCount !== a.supporterCount) return b.supporterCount - a.supporterCount;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return list.map((p) => this._formatPublicProblem(p, currentUid));
  }

  getById(id, currentUid = null) {
    const p = this.problems.get(id);
    if (!p) return null;
    return this._formatPublicProblem(p, currentUid);
  }

  getRawById(id) {
    return this.problems.get(id) || null;
  }

  createProblem({ title, category, description, affectedUsers, tags, user }) {
    if (!user || user.isAnonymous) {
      throw new Error('Authentication required to submit problems.');
    }

    const id = 'prob_' + Math.random().toString(36).substring(2, 10);
    const authorName = user.displayName || user.name || (user.email ? user.email.split('@')[0] : 'Engineer');

    const newProblem = {
      id,
      title: title.trim(),
      category: category?.trim() || 'General Engineering',
      affectedUsers: affectedUsers?.trim() || 'General Public',
      description: description.trim(),
      status: 'approved',
      isResolved: false,
      resolvedAt: null,
      resolvedBy: null,
      supporterCount: 0, // Starts at zero real supporters
      supportedByUids: [],
      authorId: user.uid,
      authorName,
      authorEmail: user.email || '',
      tags: Array.isArray(tags) && tags.length > 0 ? tags : [category || 'General', 'Community'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      solutions: [],
    };

    this.problems.set(id, newProblem);
    usersStore.incrementProblemsCount(user.uid);

    return this._formatPublicProblem(newProblem, user.uid);
  }

  updateProblem(id, updates, user) {
    const p = this.problems.get(id);
    if (!p) return { success: false, error: 'Problem not found.' };

    const isAuthor = p.authorId === user.uid;
    const isAdmin = Boolean(user.isAdmin);

    if (!isAuthor && !isAdmin) {
      return { success: false, error: 'Unauthorized. Only the author or administrator can edit this problem.' };
    }

    if (updates.title) p.title = updates.title.trim();
    if (updates.category) p.category = updates.category.trim();
    if (updates.affectedUsers) p.affectedUsers = updates.affectedUsers.trim();
    if (updates.description) p.description = updates.description.trim();
    if (Array.isArray(updates.tags)) p.tags = updates.tags;

    p.updatedAt = new Date().toISOString();

    return { success: true, problem: this._formatPublicProblem(p, user.uid) };
  }

  deleteProblem(id, user) {
    const p = this.problems.get(id);
    if (!p) return { success: false, error: 'Problem not found.' };

    const isAuthor = p.authorId === user.uid;
    const isAdmin = Boolean(user.isAdmin);

    if (!isAuthor && !isAdmin) {
      return { success: false, error: 'Unauthorized. Only the author or administrator can delete this problem.' };
    }

    this.problems.delete(id);
    usersStore.decrementProblemsCount(p.authorId);

    return { success: true, message: 'Problem deleted successfully.' };
  }

  toggleResolveProblem(id, user, isResolvedStatus = null) {
    const p = this.problems.get(id);
    if (!p) return { success: false, error: 'Problem not found.' };

    const isAuthor = p.authorId === user.uid;
    const isAdmin = Boolean(user.isAdmin);

    if (!isAuthor && !isAdmin) {
      return { success: false, error: 'Unauthorized. Only the author or administrator can toggle resolved state.' };
    }

    const nextResolved = isResolvedStatus !== null ? Boolean(isResolvedStatus) : !p.isResolved;
    p.isResolved = nextResolved;
    p.resolvedAt = nextResolved ? new Date().toISOString() : null;
    p.resolvedBy = nextResolved ? (user.displayName || user.email) : null;
    p.updatedAt = new Date().toISOString();

    return { success: true, problem: this._formatPublicProblem(p, user.uid) };
  }

  toggleSupport(id, user) {
    if (!user || user.isAnonymous) {
      return { success: false, error: 'Authentication required to support problems.' };
    }

    const p = this.problems.get(id);
    if (!p) return { success: false, error: 'Problem not found.' };

    const userUid = user.uid;
    const index = p.supportedByUids.indexOf(userUid);
    let supported = false;

    if (index >= 0) {
      // Unsupport
      p.supportedByUids.splice(index, 1);
      p.supporterCount = Math.max(0, p.supporterCount - 1);
      usersStore.decrementSupportsCount(userUid);
      supported = false;
    } else {
      // Support
      p.supportedByUids.push(userUid);
      p.supporterCount = p.supportedByUids.length;
      usersStore.incrementSupportsCount(userUid);
      supported = true;
    }

    p.updatedAt = new Date().toISOString();

    return {
      success: true,
      supported,
      supporterCount: p.supporterCount,
      problemId: id,
    };
  }

  proposeSolution(problemId, { proposedSolution, contactPitch, estimatedTimeline, portfolioUrl }, user) {
    if (!user || user.isAnonymous) {
      return { success: false, error: 'Authentication required to propose a solution.' };
    }

    const p = this.problems.get(problemId);
    if (!p) return { success: false, error: 'Problem not found.' };

    if (p.authorId === user.uid) {
      return { success: false, error: 'You are the author of this problem.' };
    }

    // Check user connection credits
    const hasCredit = usersStore.deductConnectionCredit(user.uid);
    if (!hasCredit) {
      return {
        success: false,
        error: 'Insufficient connection credits. You need at least 1 credit to propose a direct solution or connect with the author.',
      };
    }

    const solutionId = 'sol_' + Math.random().toString(36).substring(2, 10);
    const solutionProposal = {
      id: solutionId,
      problemId,
      problemTitle: p.title,
      solverId: user.uid,
      solverName: user.displayName || user.name || (user.email ? user.email.split('@')[0] : 'Engineer'),
      solverEmail: user.email || '',
      proposedSolution: proposedSolution.trim(),
      contactPitch: contactPitch?.trim() || '',
      estimatedTimeline: estimatedTimeline?.trim() || '2-4 weeks',
      portfolioUrl: portfolioUrl?.trim() || '',
      status: 'pending', // 'pending' | 'connected' | 'declined'
      createdAt: new Date().toISOString(),
    };

    p.solutions.unshift(solutionProposal);
    p.updatedAt = new Date().toISOString();

    usersStore.incrementSolutionsCount(user.uid);

    return {
      success: true,
      message: 'Solution proposed successfully! The author has been notified in their dashboard.',
      solution: solutionProposal,
    };
  }

  respondToSolution(problemId, solutionId, action, user) {
    const p = this.problems.get(problemId);
    if (!p) return { success: false, error: 'Problem not found.' };

    const isAuthor = p.authorId === user.uid;
    const isAdmin = Boolean(user.isAdmin);

    if (!isAuthor && !isAdmin) {
      return { success: false, error: 'Unauthorized. Only the problem author or admin can respond to solution proposals.' };
    }

    const sol = p.solutions.find((s) => s.id === solutionId);
    if (!sol) return { success: false, error: 'Solution proposal not found.' };

    if (action === 'connect' || action === 'approve') {
      sol.status = 'connected';
      sol.connectedAt = new Date().toISOString();
      usersStore.deductConnectionCredit(user.uid);
    } else if (action === 'decline' || action === 'reject') {
      sol.status = 'declined';
    }

    p.updatedAt = new Date().toISOString();

    return {
      success: true,
      message: `Proposal marked as ${sol.status}.`,
      solution: sol,
    };
  }

  getByAuthor(authorUid) {
    const list = Array.from(this.problems.values()).filter((p) => p.authorId === authorUid);
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return list.map((p) => ({
      ...p,
      hasSupported: p.supportedByUids.includes(authorUid),
    }));
  }

  getSupportedByUser(userUid) {
    const list = Array.from(this.problems.values()).filter((p) => p.supportedByUids.includes(userUid));
    return list.map((p) => this._formatPublicProblem(p, userUid));
  }

  getSolutionsProposedByUser(solverUid) {
    const proposals = [];
    for (const p of this.problems.values()) {
      for (const sol of p.solutions) {
        if (sol.solverId === solverUid) {
          proposals.push({
            ...sol,
            problemTitle: p.title,
            problemCategory: p.category,
            problemResolved: p.isResolved,
          });
        }
      }
    }
    proposals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return proposals;
  }

  getAllForAdmin() {
    return Array.from(this.problems.values()).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  adminSetStatus(id, status, isResolved = null) {
    const p = this.problems.get(id);
    if (!p) return { success: false, error: 'Problem not found.' };

    if (status) p.status = status;
    if (isResolved !== null) {
      p.isResolved = Boolean(isResolved);
      p.resolvedAt = p.isResolved ? new Date().toISOString() : null;
      p.resolvedBy = 'Administrator';
    }
    p.updatedAt = new Date().toISOString();

    return { success: true, problem: p };
  }

  _formatPublicProblem(problem, currentUid = null) {
    const hasSupported = Boolean(currentUid && problem.supportedByUids.includes(currentUid));
    return {
      id: problem.id,
      title: problem.title,
      category: problem.category,
      affectedUsers: problem.affectedUsers,
      description: problem.description,
      status: problem.status,
      isResolved: Boolean(problem.isResolved),
      resolvedAt: problem.resolvedAt,
      resolvedBy: problem.resolvedBy,
      supporterCount: problem.supporterCount,
      hasSupported,
      submittedBy: problem.authorName,
      authorId: problem.authorId,
      // Mask author email for privacy on public endpoints
      authorEmailMasked: problem.authorEmail ? this._maskEmail(problem.authorEmail) : '',
      tags: problem.tags,
      createdAt: problem.createdAt,
      updatedAt: problem.updatedAt,
      solutionsCount: problem.solutions ? problem.solutions.length : 0,
      connectedSolversCount: problem.solutions
        ? problem.solutions.filter((s) => s.status === 'connected').length
        : 0,
    };
  }

  purgeUserData(uid) {
    if (!uid) return;
    for (const p of this.problems.values()) {
      if (p.supportedByUids && p.supportedByUids.includes(uid)) {
        p.supportedByUids = p.supportedByUids.filter((u) => u !== uid);
        p.supporterCount = Math.max(0, (p.supporterCount || 0) - 1);
      }
      if (p.authorId === uid) {
        p.authorName = '[Deactivated Member]';
        p.authorEmail = '';
      }
      if (p.solutions && Array.isArray(p.solutions)) {
        for (const sol of p.solutions) {
          if (sol.authorId === uid) {
            sol.authorName = '[Deactivated Member]';
          }
        }
      }
    }
  }

  _maskEmail(email) {
    if (!email || !email.includes('@')) return '';
    const [name, domain] = email.split('@');
    if (name.length <= 2) return `${name[0]}***@${domain}`;
    return `${name[0]}***${name[name.length - 1]}@${domain}`;
  }
}

export const problemsStore = new ProblemsStore();
export default problemsStore;
