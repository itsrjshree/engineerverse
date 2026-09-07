/**
 * ENGINEERVERSE — Deterministic DNA Engine & Taxonomy
 * Non-random mathematical scoring model: "Algorithm decides -> AI explains"
 * Includes 12 dimensions, 10 archetypes, and trait-based legend resonance.
 */

export const DIMENSIONS = {
  LOGICAL_THINKING: {
    id: 'LOGICAL_THINKING',
    name: 'Logical Thinking',
    category: 'Analysis',
    description: 'Deconstructing ambiguous problems into deterministic, verifiable cause-and-effect components.',
  },
  CREATIVE_PROBLEM_SOLVING: {
    id: 'CREATIVE_PROBLEM_SOLVING',
    name: 'Creative Problem Solving',
    category: 'Synthesis',
    description: 'Inventing non-obvious combinations and lateral shortcuts when conventional solutions fail.',
  },
  SYSTEMS_THINKING: {
    id: 'SYSTEMS_THINKING',
    name: 'Systems Thinking',
    category: 'Architecture',
    description: 'Mapping feedback loops, hidden bottlenecks, dependencies, and second-order consequences.',
  },
  INNOVATION: {
    id: 'INNOVATION',
    name: 'Innovation',
    category: 'Creation',
    description: 'Challenging fundamental axioms to introduce paradigm shifts rather than incremental tweaks.',
  },
  RESOURCEFULNESS: {
    id: 'RESOURCEFULNESS',
    name: 'Resourcefulness (Jugaad & Frugality)',
    category: 'Execution',
    description: 'Achieving 10x outcomes with 0.1x budget using scavenged parts, open tools, and sheer grit.',
  },
  RISK_ANALYSIS: {
    id: 'RISK_ANALYSIS',
    name: 'Risk Analysis',
    category: 'Reliability',
    description: 'Anticipating catastrophic edge cases, failover conditions, and safety margins before disaster strikes.',
  },
  EMPATHY: {
    id: 'EMPATHY',
    name: 'Empathy & Human Focus',
    category: 'Humanity',
    description: 'Designing for the end user\'s dignity, ergonomics, and everyday friction rather than vanity metrics.',
  },
  EXECUTION: {
    id: 'EXECUTION',
    name: 'Execution & Delivery',
    category: 'Output',
    description: 'Translating whiteboard theories into ship-ready, robust, physical or digital artifacts.',
  },
  CURIOSITY: {
    id: 'CURIOSITY',
    name: 'Curiosity & First Principles',
    category: 'Discovery',
    description: 'An obsessive urge to know "how things actually work" beneath the shiny user interface.',
  },
  RESILIENCE: {
    id: 'RESILIENCE',
    name: 'Resilience (Debugging Grit)',
    category: 'Mindset',
    description: 'Viewing failure as telemetry; tenaciously hunting obscure bugs across sleepless nights.',
  },
  AUTOMATION_MINDSET: {
    id: 'AUTOMATION_MINDSET',
    name: 'Automation Mindset',
    category: 'Efficiency',
    description: '"If it happens twice, automate it." Ruthlessly eliminating repetitive manual cognitive toil.',
  },
  IMPACT_ORIENTATION: {
    id: 'IMPACT_ORIENTATION',
    name: 'Impact Orientation',
    category: 'Mission',
    description: 'Measuring engineering success by lives elevated and public good generated at societal scale.',
  },
};

export const ARCHETYPES = {
  ARCHITECT: {
    id: 'ARCHITECT',
    title: 'The Architect',
    tagline: 'Sees systems where others see isolated chaos.',
    motto: 'Everything is a system with inputs, constraints, and feedback loops.',
    superpower: 'Global topology mapping & bottleneck anticipation',
    growthEdge: 'Beware over-abstracting before prototyping a crude MVP.',
    dimensionWeights: {
      SYSTEMS_THINKING: 0.35,
      LOGICAL_THINKING: 0.25,
      RISK_ANALYSIS: 0.2,
      AUTOMATION_MINDSET: 0.2,
    },
  },
  BUILDER: {
    id: 'BUILDER',
    title: 'The Builder',
    tagline: 'Learns by making, soldering, and committing code.',
    motto: 'Until it compiles and ships to users, it\'s just philosophy.',
    superpower: 'High-velocity tangible prototyping and tactile debugging',
    growthEdge: 'Step back periodically to audit long-term architectural debt.',
    dimensionWeights: {
      EXECUTION: 0.35,
      RESOURCEFULNESS: 0.25,
      CURIOSITY: 0.2,
      RESILIENCE: 0.2,
    },
  },
  EXPLORER: {
    id: 'EXPLORER',
    title: 'The Explorer',
    tagline: 'Driven by an insatiable hunger to look under the hood.',
    motto: 'I don\'t just want to use it; I want to reverse engineer it.',
    superpower: 'First-principles curiosity & cutting-edge experimentation',
    growthEdge: 'Channel endless curiosity into finished, shippable deliverables.',
    dimensionWeights: {
      CURIOSITY: 0.35,
      INNOVATION: 0.25,
      LOGICAL_THINKING: 0.2,
      CREATIVE_PROBLEM_SOLVING: 0.2,
    },
  },
  FIXER: {
    id: 'FIXER',
    title: 'The Fixer',
    tagline: 'Physically cannot ignore broken, leaking, or inefficient systems.',
    motto: 'Why are we tolerating this failure mode when a fix is obvious?',
    superpower: 'Immediate triage, pragmatic patches, and zero tolerance for waste',
    growthEdge: 'Ensure short-term hotfixes don\'t permanently mask systemic roots.',
    dimensionWeights: {
      RESOURCEFULNESS: 0.3,
      EXECUTION: 0.25,
      LOGICAL_THINKING: 0.25,
      RESILIENCE: 0.2,
    },
  },
  VISIONARY: {
    id: 'VISIONARY',
    title: 'The Visionary',
    tagline: 'Solves the problems that humanity will stumble into tomorrow.',
    motto: 'The best way to predict the future is to engineer the infrastructure for it.',
    superpower: 'Long-horizon forecasting & bold architectural moonshots',
    growthEdge: 'Stay grounded in present-day user empathy and pragmatic milestones.',
    dimensionWeights: {
      INNOVATION: 0.35,
      SYSTEMS_THINKING: 0.25,
      IMPACT_ORIENTATION: 0.2,
      CREATIVE_PROBLEM_SOLVING: 0.2,
    },
  },
  AUTOMATOR: {
    id: 'AUTOMATOR',
    title: 'The Automator',
    tagline: '"If it happens twice, automate it."',
    motto: 'Human brilliance shouldn\'t be squandered on robotic routine.',
    superpower: 'Workflow pipelines, zero-touch infrastructure & compounding efficiency',
    growthEdge: 'Avoid spending 40 hours automating a 5-minute task that runs once a year.',
    dimensionWeights: {
      AUTOMATION_MINDSET: 0.4,
      SYSTEMS_THINKING: 0.25,
      LOGICAL_THINKING: 0.2,
      EXECUTION: 0.15,
    },
  },
  CREATIVE_ENGINEER: {
    id: 'CREATIVE_ENGINEER',
    title: 'The Creative Engineer',
    tagline: 'Where rigorous mathematics meets playful imagination.',
    motto: 'Logic is the engine, but imagination chooses the destination.',
    superpower: 'Lateral synthesis, expressive interfaces & poetic technology',
    growthEdge: 'Anchor radical aesthetic ideas in disciplined performance budgets.',
    dimensionWeights: {
      CREATIVE_PROBLEM_SOLVING: 0.35,
      INNOVATION: 0.25,
      EMPATHY: 0.2,
      CURIOSITY: 0.2,
    },
  },
  RESILIENT_DEBUGGER: {
    id: 'RESILIENT_DEBUGGER',
    title: 'The Resilient Debugger',
    tagline: 'Failure is just another informative telemetry log.',
    motto: 'The system will work. It\'s just a matter of isolating the delta.',
    superpower: 'Infinite tenacity under fire & root-cause forensic analysis',
    growthEdge: 'Recognize when to pivot architectures instead of polishing flawed assumptions.',
    dimensionWeights: {
      RESILIENCE: 0.35,
      LOGICAL_THINKING: 0.25,
      RISK_ANALYSIS: 0.2,
      CURIOSITY: 0.2,
    },
  },
  HUMAN_ENGINEER: {
    id: 'HUMAN_ENGINEER',
    title: 'The Human Engineer',
    tagline: 'People first, technology second.',
    motto: 'If a grandmother or a child cannot navigate it safely, the engineering is incomplete.',
    superpower: 'Radical empathy, universal accessibility & ethical safeguards',
    growthEdge: 'Balance user warmth with hard infrastructural robustness.',
    dimensionWeights: {
      EMPATHY: 0.4,
      IMPACT_ORIENTATION: 0.25,
      CREATIVE_PROBLEM_SOLVING: 0.2,
      EXECUTION: 0.15,
    },
  },
  IMPACT_ENGINEER: {
    id: 'IMPACT_ENGINEER',
    title: 'The Impact Engineer',
    tagline: 'Builds exclusively for societal scale and lasting uplift.',
    motto: 'Don\'t ask how much revenue it makes; ask how many lives it emancipated.',
    superpower: 'Extreme scalability, public-good focus & institutional transformation',
    growthEdge: 'Protect the individual while optimizing for the million.',
    dimensionWeights: {
      IMPACT_ORIENTATION: 0.35,
      SYSTEMS_THINKING: 0.25,
      RESOURCEFULNESS: 0.2,
      EXECUTION: 0.2,
    },
  },
};

export const LEGENDS = [
  {
    id: 'VISVESVARAYA',
    name: 'Sir M. Visvesvaraya',
    era: '1861 – 1962',
    primaryTraits: ['SYSTEMS_THINKING', 'EXECUTION', 'IMPACT_ORIENTATION', 'RESOURCEFULNESS'],
    quote: 'Remember, your work may be only to sweep a railway crossing, but it must be so well done that no other crossing in the world shall be better swept.',
    alignmentNote: 'Resonates with engineers who blend deep practical frugality with massive civic infrastructure.',
  },
  {
    id: 'KALAM',
    name: 'Dr. A.P.J. Abdul Kalam',
    era: '1931 – 2015',
    primaryTraits: ['RESILIENCE', 'INNOVATION', 'EMPATHY', 'IMPACT_ORIENTATION'],
    quote: 'Dream, dream, dream. Dreams transform into thoughts and thoughts result in action.',
    alignmentNote: 'Resonates with mission-driven pioneers who turn failures into national launchpads.',
  },
  {
    id: 'TURING',
    name: 'Alan Turing',
    era: '1912 – 1954',
    primaryTraits: ['LOGICAL_THINKING', 'CURIOSITY', 'SYSTEMS_THINKING', 'INNOVATION'],
    quote: 'Sometimes it is the people no one can imagine anything of who do the things no one can imagine.',
    alignmentNote: 'Resonates with analytical minds who break complex cryptograms into universal computational machines.',
  },
  {
    id: 'HOPPER',
    name: 'Grace Hopper',
    era: '1906 – 1992',
    primaryTraits: ['AUTOMATION_MINDSET', 'CREATIVE_PROBLEM_SOLVING', 'EXECUTION', 'RESILIENCE'],
    quote: 'The most dangerous phrase in the language is, "We\'ve always done it this way."',
    alignmentNote: 'Resonates with automators who invent compilers so humans can talk to silicon naturally.',
  },
  {
    id: 'TESLA',
    name: 'Nikola Tesla',
    era: '1856 – 1943',
    primaryTraits: ['INNOVATION', 'CURIOSITY', 'CREATIVE_PROBLEM_SOLVING', 'SYSTEMS_THINKING'],
    quote: 'The present is theirs; the future, for which I really worked, is mine.',
    alignmentNote: 'Resonates with visionary inventors sensing unseen magnetic fields and wireless horizons.',
  },
  {
    id: 'LAMARR',
    name: 'Hedy Lamarr',
    era: '1914 – 2000',
    primaryTraits: ['CREATIVE_PROBLEM_SOLVING', 'RESOURCEFULNESS', 'INNOVATION', 'RISK_ANALYSIS'],
    quote: 'All creative people want to do the unexpected.',
    alignmentNote: 'Resonates with inventors who draw from unexpected artistic domains to invent spread-spectrum communication.',
  },
];

/**
 * Cinematic Scenario Dilemmas for the DNA Assessment
 * Real engineering dilemmas based on section 7:
 * 1. City blackout
 * 2. Peak traffic crash
 * 3. ₹10,000 to solve for 10,000 people
 * 4. Low-bandwidth village digital education
 * 5. Annoying legacy system everybody tolerates
 */
export const SCENARIOS = [
  {
    id: 'SCENARIO_1_BLACKOUT',
    category: 'Crisis Triage',
    scenarioText: 'A sudden grid failure plunges a metropolitan hospital and surrounding district into total darkness. Backup generators are sputtering. What is your immediate instinct?',
    options: [
      {
        id: 'A',
        text: 'Trace the single point of failure in the distribution sub-station and isolate the tripped breaker.',
        dimensionDeltas: { LOGICAL_THINKING: 25, RISK_ANALYSIS: 20, SYSTEMS_THINKING: 15 },
      },
      {
        id: 'B',
        text: 'Immediately bypass the main busbar and jury-rig an auxiliary solar/battery bank directly to the ICU ventilators.',
        dimensionDeltas: { RESOURCEFULNESS: 30, EXECUTION: 20, EMPATHY: 15 },
      },
      {
        id: 'C',
        text: 'Reroute power telemetry through neighboring sub-grids using automated dynamic load-shedding algorithms.',
        dimensionDeltas: { SYSTEMS_THINKING: 30, AUTOMATION_MINDSET: 20, LOGICAL_THINKING: 15 },
      },
      {
        id: 'D',
        text: 'Grab tools and a multimeter; physically inspect the smoking relay in the basement before making assumptions.',
        dimensionDeltas: { EXECUTION: 25, CURIOSITY: 20, RESILIENCE: 20 },
      },
    ],
  },
  {
    id: 'SCENARIO_2_CRASH',
    category: 'Scale & Resilience',
    scenarioText: 'A high-impact public service portal crashes under 100x unexpected traffic on launch morning. Queries are timing out.',
    options: [
      {
        id: 'A',
        text: 'Spin up an aggressive rate-limiting queue, return cached stale data gracefully, and preserve core database integrity.',
        dimensionDeltas: { RISK_ANALYSIS: 25, SYSTEMS_THINKING: 20, LOGICAL_THINKING: 15 },
      },
      {
        id: 'B',
        text: 'Script a zero-downtime micro-caching proxy in front of the slowest endpoint and deploy in 10 minutes.',
        dimensionDeltas: { AUTOMATION_MINDSET: 25, RESOURCEFULNESS: 20, EXECUTION: 20 },
      },
      {
        id: 'C',
        text: 'Strip all secondary database queries and bloated assets down to bare essential text until load subsides.',
        dimensionDeltas: { CREATIVE_PROBLEM_SOLVING: 25, EMPATHY: 20, RESOURCEFULNESS: 15 },
      },
      {
        id: 'D',
        text: 'Dig into the core memory profile and slow-query logs to find the exact N+1 query leak causing thread exhaustion.',
        dimensionDeltas: { RESILIENCE: 25, LOGICAL_THINKING: 25, CURIOSITY: 15 },
      },
    ],
  },
  {
    id: 'SCENARIO_3_FRUGAL_SCALE',
    category: 'Extreme Frugality',
    scenarioText: 'You are handed ₹10,000 (roughly $120) and tasked with improving the lives of 10,000 citizens in an underserved area. How do you deploy it?',
    options: [
      {
        id: 'A',
        text: 'Design an SMS-based automated grievance and water tanker tracking bot using free community phone lines.',
        dimensionDeltas: { AUTOMATION_MINDSET: 25, IMPACT_ORIENTATION: 25, RESOURCEFULNESS: 20 },
      },
      {
        id: 'B',
        text: 'Fabricate 20 low-cost gravity water filtration test units using local sand, charcoal, and recycled vessels.',
        dimensionDeltas: { RESOURCEFULNESS: 30, EXECUTION: 25, EMPATHY: 20 },
      },
      {
        id: 'C',
        text: 'Architect an open-hardware monitoring blueprint that the community can self-replicate and maintain perpetually.',
        dimensionDeltas: { SYSTEMS_THINKING: 25, INNOVATION: 25, IMPACT_ORIENTATION: 20 },
      },
      {
        id: 'D',
        text: 'Conduct deep on-ground ethnographic interviews to find the single daily pain point that costs families the most time.',
        dimensionDeltas: { EMPATHY: 30, CURIOSITY: 25, CREATIVE_PROBLEM_SOLVING: 15 },
      },
    ],
  },
  {
    id: 'SCENARIO_4_OFFLINE_EDU',
    category: 'Access & Inequality',
    scenarioText: 'A remote village school has intermittent electricity, zero cellular 4G signal, but 80 eager students. How do you deliver modern interactive digital education?',
    options: [
      {
        id: 'A',
        text: 'Set up an offline Raspberry Pi Wi-Fi hotspot caching Wikipedia, Khan Academy, and interactive labs with local solar.',
        dimensionDeltas: { RESOURCEFULNESS: 25, SYSTEMS_THINKING: 20, INNOVATION: 20, EXECUTION: 15 },
      },
      {
        id: 'B',
        text: 'Build a tactile physical learning device with modular electronic blocks and mechanical gears that needs zero screens.',
        dimensionDeltas: { CREATIVE_PROBLEM_SOLVING: 30, EMPATHY: 20, CURIOSITY: 20 },
      },
      {
        id: 'C',
        text: 'Design an automated low-frequency packet radio sync that downloads textbooks over long-range ham waves overnight.',
        dimensionDeltas: { INNOVATION: 25, CURIOSITY: 25, LOGICAL_THINKING: 20 },
      },
      {
        id: 'D',
        text: 'Train the local teacher to use physical simulations with simple beads and games that teach algorithmic logic.',
        dimensionDeltas: { EMPATHY: 30, IMPACT_ORIENTATION: 25, RESOURCEFULNESS: 20 },
      },
    ],
  },
  {
    id: 'SCENARIO_5_LEGACY_FRICTION',
    category: 'The Annoying Habit',
    scenarioText: 'A municipal queue or legacy ticketing system forces people to wait 3 hours every day. Everyone hates it, but everyone accepts it as "just how things are". What do you do?',
    options: [
      {
        id: 'A',
        text: 'Refuse to accept it. Build a prototype token scheduler on weekends and demonstrate the 90% time savings to authorities.',
        dimensionDeltas: { RESILIENCE: 25, EXECUTION: 25, IMPACT_ORIENTATION: 20 },
      },
      {
        id: 'B',
        text: 'Map the paperwork journey step-by-step; eliminate the 4 redundant approvals that produce zero real value.',
        dimensionDeltas: { SYSTEMS_THINKING: 30, LOGICAL_THINKING: 25, RISK_ANALYSIS: 15 },
      },
      {
        id: 'C',
        text: 'Introduce a WhatsApp/QR digital queue that lets citizens go about their day and shows up 5 minutes before their turn.',
        dimensionDeltas: { AUTOMATION_MINDSET: 25, EMPATHY: 25, CREATIVE_PROBLEM_SOLVING: 20 },
      },
      {
        id: 'D',
        text: 'Re-imagine the fundamental service: Why does this token even exist? Can it be entirely self-serve online?',
        dimensionDeltas: { INNOVATION: 30, SYSTEMS_THINKING: 20, CURIOSITY: 20 },
      },
    ],
  },
];

/**
 * Pure deterministic vector scoring algorithm
 * Guarantees that identical answers always produce identical results.
 */
export function computeDeterministicScores(answerSelections) {
  // Initialize normalized dimension scores at baseline 50
  const scores = {};
  Object.keys(DIMENSIONS).forEach((dimKey) => {
    scores[dimKey] = 50;
  });

  if (!answerSelections || !Array.isArray(answerSelections)) {
    return scores;
  }

  // Accumulate scenario deltas
  answerSelections.forEach((selection) => {
    const scenario = SCENARIOS.find((s) => s.id === selection.scenarioId);
    if (!scenario) return;
    const option = scenario.options.find((o) => o.id === selection.optionId);
    if (!option || !option.dimensionDeltas) return;

    Object.entries(option.dimensionDeltas).forEach(([dimKey, delta]) => {
      if (scores[dimKey] !== undefined) {
        scores[dimKey] += delta;
      }
    });
  });

  // Normalize scores into clean 0 - 100 integer range
  const normalized = {};
  Object.keys(scores).forEach((dimKey) => {
    normalized[dimKey] = Math.max(10, Math.min(100, Math.round(scores[dimKey])));
  });

  return normalized;
}

/**
 * Pure deterministic archetype classifier
 */
export function classifyArchetypes(normalizedScores) {
  const archetypeScores = [];

  Object.entries(ARCHETYPES).forEach(([archKey, archetype]) => {
    let score = 0;
    let totalWeight = 0;

    Object.entries(archetype.dimensionWeights).forEach(([dimKey, weight]) => {
      const dimScore = normalizedScores[dimKey] || 50;
      score += dimScore * weight;
      totalWeight += weight;
    });

    const finalScore = totalWeight > 0 ? Math.round(score / totalWeight) : 50;
    archetypeScores.push({
      key: archKey,
      ...archetype,
      matchScore: finalScore,
    });
  });

  // Sort descending by match score
  archetypeScores.sort((a, b) => b.matchScore - a.matchScore);

  const primary = archetypeScores[0];
  const secondary = archetypeScores[1] || archetypeScores[0];

  // Calculate overall DNA score (weighted average of top dimensions)
  const allDimensionValues = Object.values(normalizedScores);
  const overallDnaScore = Math.round(
    allDimensionValues.reduce((acc, val) => acc + val, 0) / allDimensionValues.length
  );

  return {
    primary,
    secondary,
    overallDnaScore,
    rankedArchetypes: archetypeScores,
  };
}

/**
 * Deterministic trait-based legend resonance calculation
 */
export function computeLegendResonance(normalizedScores) {
  const resonances = LEGENDS.map((legend) => {
    let traitSum = 0;
    legend.primaryTraits.forEach((traitKey) => {
      traitSum += normalizedScores[traitKey] || 50;
    });
    const alignmentScore = Math.round(traitSum / legend.primaryTraits.length);

    return {
      ...legend,
      alignmentScore: Math.min(99, Math.max(40, alignmentScore)),
    };
  });

  resonances.sort((a, b) => b.alignmentScore - a.alignmentScore);
  return resonances;
}
