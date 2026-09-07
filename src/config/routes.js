/**
 * ENGINEERVERSE — Route Registry & Information Architecture
 * Canonical public route: https://rjshree.com/engineerverse
 * Strictly NO /engineersday routes.
 */

export const ROUTE_TYPES = {
  CORE: 'core',
  STORY: 'story',
  DISCOVER: 'discover',
  BUILD: 'build',
  COMMUNITY: 'community',
  LEGACY: 'legacy',
  DYNAMIC: 'dynamic',
  ADMIN: 'admin',
};

export const routes = [
  {
    path: '/engineerverse',
    title: 'ENGINEERVERSE Hub',
    type: ROUTE_TYPES.CORE,
    isCanonical: true,
    description: 'Central portal uniting narrative, Engineering DNA, missions, problems, and community.',
    status: 'foundation',
    navLabel: 'Hub',
    featureIds: ['EV-001', 'EV-002', 'EV-058', 'EV-059'],
    seo: {
      canonical: 'https://rjshree.com/engineerverse',
      indexable: true,
      title: 'ENGINEERVERSE — Discover the Engineer Within You',
      metaDescription: 'Engineering isn\'t a degree. It\'s the instinct to solve what others learn to live with. Discover your Engineering DNA.',
    }
  },
  {
    path: '/engineerverse/invisible-engineering',
    title: 'The Invisible Engineering',
    type: ROUTE_TYPES.STORY,
    description: 'Explore the hidden feats of engineering in daily life that disappear when they work perfectly.',
    status: 'foundation',
    navLabel: 'Invisible Story',
    featureIds: ['EV-003'],
    seo: {
      canonical: 'https://rjshree.com/engineerverse/invisible-engineering',
      indexable: true,
      title: 'The Invisible Engineering — ENGINEERVERSE',
      metaDescription: 'When engineering works perfectly, it becomes invisible. Uncover the hidden systems shaping modern civilization.',
    }
  },
  {
    path: '/engineerverse/engineering-dna',
    title: 'Engineering DNA Discovery',
    type: ROUTE_TYPES.DISCOVER,
    description: 'Scenario-based assessment evaluating 12 engineering dimensions with deterministic scoring.',
    status: 'foundation',
    navLabel: 'Take DNA Test',
    featureIds: ['EV-004', 'EV-005', 'EV-006'],
    seo: {
      canonical: 'https://rjshree.com/engineerverse/engineering-dna',
      indexable: true,
      title: 'Discover Your Engineering DNA — ENGINEERVERSE',
      metaDescription: 'Take the deterministic Engineering DNA assessment. Discover your dimensional strengths and archetype.',
    }
  },
  {
    path: '/engineerverse/engineer-archetypes',
    title: 'Engineer Archetype Directory',
    type: ROUTE_TYPES.DISCOVER,
    description: 'Detailed profiles of the 10 core engineer archetypes, their superpowers, and growth vectors.',
    status: 'foundation',
    navLabel: 'Archetypes',
    featureIds: ['EV-007'],
    seo: {
      canonical: 'https://rjshree.com/engineerverse/engineer-archetypes',
      indexable: true,
      title: 'Engineer Archetypes Guide — ENGINEERVERSE',
      metaDescription: 'From The Architect to The Automator: Explore the 10 distinct ways builders perceive and transform reality.',
    }
  },
  {
    path: '/engineerverse/the-problem-wall',
    title: 'The Problem Wall',
    type: ROUTE_TYPES.COMMUNITY,
    description: '"India Still Has Problems. Engineers Still Have Work." Curated gallery of verified engineering problems.',
    status: 'foundation',
    navLabel: 'The Problem Wall',
    featureIds: ['EV-020', 'EV-021', 'EV-022'],
    aliases: ['/engineerverse/the-problems-wall'],
    seo: {
      canonical: 'https://rjshree.com/engineerverse/the-problem-wall',
      indexable: true,
      title: 'The Problem Wall — India Still Has Problems. Engineers Still Have Work.',
      metaDescription: 'Explore real-world challenges across healthcare, agriculture, clean water, and infrastructure awaiting engineering minds.',
    }
  },
  {
    path: '/engineerverse/engineering-problems',
    title: 'Engineer a Problem',
    type: ROUTE_TYPES.BUILD,
    description: 'Submit an unsolved real-world dilemma into the engineering pipeline for framing and collaboration.',
    status: 'foundation',
    navLabel: 'Submit Problem',
    featureIds: ['EV-019'],
    seo: {
      canonical: 'https://rjshree.com/engineerverse/engineering-problems',
      indexable: true,
      title: 'Submit a Challenge — Engineer a Problem',
      metaDescription: 'Frame real-world challenges affecting communities to rally engineers around practical solutions.',
    }
  },
  {
    path: '/engineerverse/visvesvaraya',
    title: 'Sir M. Visvesvaraya Legacy',
    type: ROUTE_TYPES.LEGACY,
    description: 'Historical exploration of Bharat Ratna Sir M. Visvesvaraya\'s timeless principles and nation-building impact.',
    status: 'foundation',
    navLabel: 'Sir M.V. Legacy',
    featureIds: ['EV-034', 'EV-008'],
    seo: {
      canonical: 'https://rjshree.com/engineerverse/visvesvaraya',
      indexable: true,
      title: 'Sir M. Visvesvaraya: The Father of Indian Engineering — ENGINEERVERSE',
      metaDescription: 'The engineering legacy of Sir M. Visvesvaraya: Automatic floodgates, Krishnarajasagara Dam, and industrial vision.',
    }
  },
  {
    path: '/engineerverse/engineering-in-india',
    title: 'Engineering in India',
    type: ROUTE_TYPES.LEGACY,
    description: 'Celebrating high-frugality, high-scale engineering: UPI, Chandrayaan, Konkan Railway, and rural infrastructure.',
    status: 'foundation',
    navLabel: 'India Engineering',
    featureIds: ['EV-035'],
    seo: {
      canonical: 'https://rjshree.com/engineerverse/engineering-in-india',
      indexable: true,
      title: 'Engineering at Indian Scale — ENGINEERVERSE',
      metaDescription: 'How Indian engineers conquer extreme constraints to build UPI, space missions, and nation-scale systems.',
    }
  },
  {
    path: '/engineerverse/software-engineering',
    title: 'Software Engineering Discipline',
    type: ROUTE_TYPES.STORY,
    description: 'Evergreen deep-dive into the architecture of modern software, distributed systems, and reliability.',
    status: 'foundation',
    navLabel: 'Software Eng',
    featureIds: ['EV-036'],
    seo: {
      canonical: 'https://rjshree.com/engineerverse/software-engineering',
      indexable: true,
      title: 'What Is Software Engineering? Systems, Code, and Scale',
      metaDescription: 'Beyond coding: How software engineers tame complexity, design distributed systems, and ensure 99.999% uptime.',
    }
  },
  {
    path: '/engineerverse/ai-engineering',
    title: 'AI Engineering Discipline',
    type: ROUTE_TYPES.STORY,
    description: 'The shift from deterministic logic to probabilistic models, neural architectures, and intelligent agents.',
    status: 'foundation',
    navLabel: 'AI Eng',
    featureIds: ['EV-036'],
    seo: {
      canonical: 'https://rjshree.com/engineerverse/ai-engineering',
      indexable: true,
      title: 'AI Engineering: Building Reliable Systems on Probabilistic Foundations',
      metaDescription: 'Explore the modern AI stack: Foundation models, agent orchestration, inference scaling, and evaluation.',
    }
  },
  {
    path: '/engineerverse/engineering-stories',
    title: 'Engineer Stories Wall',
    type: ROUTE_TYPES.COMMUNITY,
    description: '"What did engineering teach you?" Personal anecdotes and hard-won wisdom from builders.',
    status: 'foundation',
    navLabel: 'Stories',
    featureIds: ['EV-023', 'EV-024'],
    seo: {
      canonical: 'https://rjshree.com/engineerverse/engineering-stories',
      indexable: true,
      title: 'Engineer Stories — Voices from the Trenches',
      metaDescription: 'Read what engineering actually taught practitioners about resilience, failure, and creative persistence.',
    }
  },
  {
    path: '/engineerverse/engineering-poetry',
    title: 'Engineering Poetry',
    type: ROUTE_TYPES.STORY,
    description: 'Lyrical reflections on circuits, gravity, logic gates, and the beauty of human design.',
    status: 'foundation',
    navLabel: 'Poetry',
    featureIds: ['EV-017'],
    seo: {
      canonical: 'https://rjshree.com/engineerverse/engineering-poetry',
      indexable: true,
      title: 'The Poetry of Engineering — ENGINEERVERSE',
      metaDescription: 'A literary ode to the invisible harmony between mathematics, code, physical forces, and imagination.',
    }
  },
  {
    path: '/engineerverse/challenges',
    title: 'Engineering Challenges Series',
    type: ROUTE_TYPES.BUILD,
    description: 'Weekly engineering design sprints testing feasibility, innovation, impact, and scalability.',
    status: 'foundation',
    navLabel: 'Challenges',
    featureIds: ['EV-030', 'EV-031', 'EV-032'],
    seo: {
      canonical: 'https://rjshree.com/engineerverse/challenges',
      indexable: true,
      title: 'Engineering Challenges — Test Your Problem-Solving Limits',
      metaDescription: 'Tackle real-world crisis scenarios: low-bandwidth digital education, micro-irrigation, cold storage logistics.',
    }
  },
  {
    path: '/engineerverse/future-engineer',
    title: 'Future Engineer Mission Architect',
    type: ROUTE_TYPES.BUILD,
    description: 'Select a humanitarian mission and receive a concrete 5-year engineering prototype roadmap.',
    status: 'foundation',
    navLabel: 'Future Mission',
    featureIds: ['EV-018'],
    seo: {
      canonical: 'https://rjshree.com/engineerverse/future-engineer',
      indexable: true,
      title: 'Future Engineer Mission Architect — ENGINEERVERSE',
      metaDescription: 'Design your engineering roadmap to tackle clean water, clean energy, or universal assistive access.',
    }
  },
  {
    path: '/admin/engineerverse',
    title: 'Admin Command Center',
    type: ROUTE_TYPES.ADMIN,
    description: 'Protected moderation console for problem approvals, story curation, telemetry, and AI budget controls.',
    status: 'foundation',
    navLabel: 'Admin',
    featureIds: ['EV-042', 'EV-043', 'EV-044'],
    seo: {
      canonical: 'https://rjshree.com/admin/engineerverse',
      indexable: false,
      title: 'Admin Command Center — ENGINEERVERSE',
      metaDescription: 'Restricted administrative portal for Shree Labs operators.',
    }
  }
];

export const dynamicRouteTemplates = [
  {
    pattern: '/engineerverse/identity/:slug',
    title: 'Public Engineer Identity Card',
    featureIds: ['EV-013', 'EV-010', 'EV-014'],
    indexableRule: 'Only if user explicitly enabled public indexing. Default noindex.',
  },
  {
    pattern: '/engineerverse/mission/:slug',
    title: 'Public Mission Blueprint',
    featureIds: ['EV-018'],
    indexableRule: 'Public if published by creator and approved.',
  },
  {
    pattern: '/engineerverse/problem/:slug',
    title: 'Individual Problem Page',
    featureIds: ['EV-019', 'EV-020'],
    indexableRule: 'Indexable if approved by moderation.',
  },
  {
    pattern: '/engineerverse/story/:slug',
    title: 'Individual Engineer Story',
    featureIds: ['EV-023'],
    indexableRule: 'Indexable if approved by moderation.',
  },
  {
    pattern: '/engineerverse/pledge/:slug',
    title: 'Engineering Pledge Card',
    featureIds: ['EV-025', 'EV-026'],
    indexableRule: 'Only if user opted into public showcase.',
  }
];

export const ROUTES = Object.fromEntries(
  routes.map((r) => [
    r.path.replace(/^\/engineerverse\/?/, '').replace(/-/g, '_').toUpperCase() || 'HUB',
    r,
  ])
);

export default routes;
