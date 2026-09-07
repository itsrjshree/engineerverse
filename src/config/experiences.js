/**
 * ENGINEERVERSE — Public Experience Pillars & Feature Mapping Architecture
 * Public Production View ≠ Feature Registry (Rule 1)
 *
 * This module defines the user-facing Information Architecture:
 * 1. DISCOVER: Invisible Engineering, Engineering DNA, Archetypes, Engineering Identity
 * 2. BUILD: Engineer a Problem, Future Engineer Missions, Challenges, Architecture Sandboxes
 * 3. HUMANITY: The Problem Wall, Engineer Stories, Engineering Pledge
 * 4. LEARN: Ask Pritee AI, Engineering in India, Discipline Explorers
 * 5. LEGACY: Sir M. Visvesvaraya, Nation-Building Engineering
 * 6. COMMUNITY: Public Profiles, Shared Results, Peer Review, Challenges
 *
 * Every feature EV-001..EV-060 is formally mapped to an experience pillar or platform foundation.
 * Zero features are dropped, faked, or bypassed.
 */

export const EXPERIENCE_PILLARS = {
  DISCOVER: {
    id: 'discover',
    title: 'Discover',
    tagline: 'Uncover the hidden systems shaping reality and discover your builder instinct.',
    navLabel: 'Discover',
    items: [
      {
        id: 'invisible-engineering',
        title: 'The Invisible Engineering',
        description: 'When engineering works perfectly, it disappears. Explore the silent systems keeping civilization alive.',
        route: '/engineerverse/invisible-engineering',
        featureIds: ['EV-003'],
      },
      {
        id: 'engineering-dna',
        title: 'Engineering DNA Assessment',
        description: 'Scenario-based assessment evaluating 12 engineering dimensions with deterministic scoring.',
        route: '/engineerverse/engineering-dna',
        featureIds: ['EV-004', 'EV-005', 'EV-006'],
      },
      {
        id: 'engineer-archetypes',
        title: 'Engineer Archetypes',
        description: 'Profiles of 10 distinct ways builders perceive, deconstruct, and transform reality.',
        route: '/engineerverse/engineer-archetypes',
        featureIds: ['EV-007', 'EV-008', 'EV-009'],
      },
      {
        id: 'engineering-identity',
        title: 'Your Engineering Identity',
        description: 'Generate, certify, and share your verified engineering identity card and archetype badge.',
        route: '/engineerverse/engineering-dna#identity',
        featureIds: ['EV-010', 'EV-011', 'EV-012', 'EV-013', 'EV-014'],
      },
    ],
  },

  BUILD: {
    id: 'build',
    title: 'Build',
    tagline: 'Tackle real-world dilemmas, design architectures, and prototype humanitarian missions.',
    navLabel: 'Build',
    items: [
      {
        id: 'engineer-a-problem',
        title: 'Engineer a Problem',
        description: 'Submit an unsolved real-world dilemma into the engineering pipeline for structured problem framing.',
        route: '/engineerverse/engineering-problems',
        featureIds: ['EV-019'],
      },
      {
        id: 'future-engineer-mission',
        title: 'Future Engineer Mission',
        description: 'Choose a humanitarian engineering mission and architect a concrete 5-year prototype roadmap.',
        route: '/engineerverse/future-engineer',
        featureIds: ['EV-018'],
      },
      {
        id: 'debug-the-world',
        title: 'Debug the World',
        description: 'Interactive failure simulations and architecture sandboxes to test systems under crisis.',
        route: '/engineerverse/challenges#debug',
        featureIds: ['EV-027', 'EV-028', 'EV-029'],
      },
      {
        id: 'engineering-challenges',
        title: 'Engineering Challenges',
        description: 'Weekly constraint-based engineering design sprints testing feasibility, impact, and scale.',
        route: '/engineerverse/challenges',
        featureIds: ['EV-030', 'EV-031', 'EV-032', 'EV-033'],
      },
    ],
  },

  HUMANITY: {
    id: 'humanity',
    title: 'Humanity',
    tagline: '"India Still Has Problems. Engineers Still Have Work." Bridging engineering and human need.',
    navLabel: 'Humanity',
    items: [
      {
        id: 'the-problem-wall',
        title: 'The Problem Wall',
        description: 'Dynamic, unlimited gallery of verified real-world challenges across healthcare, water, and infrastructure.',
        route: '/engineerverse/the-problem-wall',
        featureIds: ['EV-020', 'EV-021', 'EV-022'],
      },
      {
        id: 'engineer-stories',
        title: 'Engineer Stories',
        description: '"What did engineering teach you?" Authentic voices, lessons from failure, and wisdom from the trenches.',
        route: '/engineerverse/engineering-stories',
        featureIds: ['EV-023', 'EV-024'],
      },
      {
        id: 'engineering-pledge',
        title: 'Engineering Pledge',
        description: 'A personal covenant to engineer with integrity, empathy, sustainability, and human responsibility.',
        route: '/engineerverse/pledge',
        featureIds: ['EV-025', 'EV-026'],
      },
      {
        id: 'engineering-poetry',
        title: 'The Poetry of Engineering',
        description: 'Literary reflections on circuits, concrete, gravity, logic gates, and human craftsmanship.',
        route: '/engineerverse/engineering-poetry',
        featureIds: ['EV-017'],
      },
    ],
  },

  LEARN: {
    id: 'learn',
    title: 'Learn',
    tagline: 'Demystify deep tech, learn from AI mentors, and explore diverse engineering disciplines.',
    navLabel: 'Learn',
    items: [
      {
        id: 'ask-pritee',
        title: 'Ask Pritee — Engineering Edition',
        description: 'AI engineering mentor explaining concepts from first principles, from ELI5 to production architecture.',
        route: '/engineerverse/ask-pritee',
        featureIds: ['EV-015', 'EV-016'],
      },
      {
        id: 'engineering-in-india',
        title: 'Engineering in India',
        description: 'High-frugality, high-scale engineering feats: UPI, Chandrayaan, Konkan Railway, and rural solutions.',
        route: '/engineerverse/engineering-in-india',
        featureIds: ['EV-035'],
      },
      {
        id: 'discipline-explorers',
        title: 'Engineering Discipline Explorers',
        description: 'Interactive sandboxes for Civil, Mechanical, Electrical, Computer Science, and AI Engineering.',
        route: '/engineerverse/disciplines',
        featureIds: ['EV-036', 'EV-037', 'EV-038', 'EV-039', 'EV-040', 'EV-041'],
      },
    ],
  },

  LEGACY: {
    id: 'legacy',
    title: 'Legacy',
    tagline: 'Honoring the visionaries who built modern civilization from the ground up.',
    navLabel: 'Legacy',
    items: [
      {
        id: 'sir-mv',
        title: 'Sir M. Visvesvaraya',
        description: 'The father of Indian engineering: Automatic floodgates, Krishnarajasagara, and nation-building vision.',
        route: '/engineerverse/visvesvaraya',
        featureIds: ['EV-034', 'EV-008'],
      },
      {
        id: 'nation-building',
        title: 'Engineering & Nation Building',
        description: 'How engineering transforms resources into prosperity, public health, and sovereign self-reliance.',
        route: '/engineerverse/engineering-in-india#nation-building',
        featureIds: ['EV-035'],
      },
    ],
  },

  COMMUNITY: {
    id: 'community',
    title: 'Community',
    tagline: 'Connect with fellow builders, team up, compare instincts, and collaborate on shared solutions.',
    navLabel: 'Community',
    items: [
      {
        id: 'public-profiles',
        title: 'Public Profiles & Shared Results',
        description: 'Verified public results, showcase badges, and canonical shareable links.',
        route: '/engineerverse/community/profiles',
        featureIds: ['EV-011', 'EV-012', 'EV-013', 'EV-014'],
      },
      {
        id: 'challenge-a-friend',
        title: 'Challenge a Friend',
        description: 'Compare engineering instincts head-to-head across scenario dilemmas and trade-offs.',
        route: '/engineerverse/community/challenge',
        featureIds: ['EV-045'],
      },
      {
        id: 'team-combinator',
        title: 'Engineering Team DNA Combinator',
        description: 'Simulate team composition and dimensional synergy across different engineering archetypes.',
        route: '/engineerverse/community/team',
        featureIds: ['EV-047'],
      },
      {
        id: 'leaderboards-pulse',
        title: 'Leaderboards & Activity Pulse',
        description: 'Genuine contribution activity, verified solution ratings, and real-time community pulse.',
        route: '/engineerverse/community/leaderboard',
        featureIds: ['EV-046', 'EV-048'],
      },
    ],
  },
};

/**
 * Platform Core & Governance features (EV-042 to EV-060)
 * These back the security, performance, lifecycle, and administrative backbone.
 */
export const PLATFORM_GOVERNANCE_FEATURES = {
  title: 'Platform Architecture, Moderation & Execution Governance',
  description: 'Internal services, security boundaries, telemetry, and lifecycle state engines.',
  items: [
    { id: 'admin-moderation', title: 'Admin Moderation Pipeline', featureIds: ['EV-042'] },
    { id: 'ethical-telemetry', title: 'Ethical Zero-PII Telemetry', featureIds: ['EV-043'] },
    { id: 'ai-guardian', title: 'AI Cost & Rate Guardian', featureIds: ['EV-044'] },
    { id: 'privacy-dpdp', title: 'Privacy & DPDP Consent Management', featureIds: ['EV-049'] },
    { id: 'pwa-resilience', title: 'Offline PWA & Service Worker', featureIds: ['EV-050'] },
    { id: 'tokens-theme', title: 'Dynamic Dark/Light Token System', featureIds: ['EV-051'] },
    { id: 'accessibility', title: 'High-Contrast WCAG AAA Engine', featureIds: ['EV-052'] },
    { id: 'performance', title: 'Sub-Second Optimization Engine', featureIds: ['EV-053'] },
    { id: 'seo-engine', title: 'OpenGraph & JSON-LD Structured SEO', featureIds: ['EV-054'] },
    { id: 'security-guard', title: 'CSP, Sanitization & Defense-in-Depth', featureIds: ['EV-055'] },
    { id: 'contract-validator', title: 'Architecture Contract Validator', featureIds: ['EV-056'] },
    { id: 'test-suite', title: 'Automated E2E Test Suite', featureIds: ['EV-057'] },
    { id: 'campaign-prelaunch', title: 'Dynamic Pre-Launch Engine', featureIds: ['EV-058'] },
    { id: 'campaign-evergreen', title: 'Dynamic Evergreen Engine', featureIds: ['EV-059'] },
    { id: 'feature-registry', title: 'Feature Registry & Execution Contract', featureIds: ['EV-060', 'EV-001', 'EV-002'] },
  ],
};

/**
 * Returns the human experience category for any given EV-XXX feature ID.
 * @param {string} featureId
 * @returns {string} Pillar name
 */
export function getExperiencePillarForFeature(featureId) {
  for (const [pillarKey, pillar] of Object.entries(EXPERIENCE_PILLARS)) {
    for (const item of pillar.items) {
      if (item.featureIds.includes(featureId)) {
        return pillarKey;
      }
    }
  }
  return 'PLATFORM_GOVERNANCE';
}

export default EXPERIENCE_PILLARS;
