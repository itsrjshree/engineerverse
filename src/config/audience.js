/**
 * ENGINEERVERSE — Audience & Universal Inclusivity Model
 * Section 5: General users are first-class users.
 * A degree is NEVER required to participate in ENGINEERVERSE.
 * "Engineering is not a degree. It's the instinct to solve what others learn to live with."
 */

export const AUDIENCE_PERSONAS = [
  {
    id: 'curious_mind',
    title: 'Curious General User / Everyday Solver',
    tagline: 'Loves taking things apart, understanding how things work, and fixing daily friction.',
    degreeRequired: false,
    entryPoint: 'Engineering DNA Simulator & The Problem Wall',
    description: 'You might not have studied engineering in college, but your instinct to question how things work and improve them makes you a builder at heart.',
  },
  {
    id: 'school_student',
    title: 'School Student / Future Explorer',
    tagline: 'Fascinated by rockets, bridges, microchips, and experiments.',
    degreeRequired: false,
    entryPoint: 'Interactive Stories & STEM Missions',
    description: 'Discover that engineering isn\'t about memorizing formulas; it is about building physical gadgets, software, and creative experiments that touch lives.',
  },
  {
    id: 'aspirant',
    title: 'Engineering Aspirant / College Student',
    tagline: 'Preparing for examinations and wondering what real-world engineering looks like.',
    degreeRequired: false,
    entryPoint: 'Engineering DNA & Live Problem Wall',
    description: 'Look past entrance rankings and syllabus sheets to discover which engineering archetype resonates with your authentic problem-solving instincts.',
  },
  {
    id: 'working_engineer',
    title: 'Working Engineer / Practicing Builder',
    tagline: 'Building production hardware, software, structures, and systems in industry.',
    degreeRequired: false, // In practice might have one, but not gatekept
    entryPoint: 'Engineering Challenges, The Problem Wall, & Mentorship',
    description: 'Reignite the raw craft and purpose of engineering. Connect with interdisciplinary peers solving grand engineering challenges.',
  },
  {
    id: 'creator_innovator',
    title: 'Creator, Maker & Innovator',
    tagline: 'Tinkers with 3D printers, microcontrollers, open-source code, and craft.',
    degreeRequired: false,
    entryPoint: 'Engineering Missions & Jugaad Resourcefulness',
    description: 'Celebrate grassroots improvisation, rapid physical prototyping, and the joy of turning scrap parts into working inventions.',
  },
  {
    id: 'entrepreneur',
    title: 'Founder & Tech Entrepreneur',
    tagline: 'Translating engineering breakthroughs into sustainable economic engines.',
    degreeRequired: false,
    entryPoint: 'The Problem Wall & Systems Architecture',
    description: 'Find real unsolved problems facing millions of people and build the technological foundations to solve them.',
  },
  {
    id: 'educator',
    title: 'Educator, Teacher & Academic Guide',
    tagline: 'Inspiring the next generation of builders with rigor, curiosity, and ethics.',
    entryPoint: 'Heritage Stories, Visvesvaraya Legacy & Architecture Hub',
    description: 'Equip your classrooms with living case studies of engineering ingenuity, ethics, and human impact.',
  },
];

/**
 * The 12 Locked Core Mindset Dimensions (Zero Degree Gatekeeping)
 * Strictly matches Section 9 of the Constitution.
 */
export const CORE_MINDSET_DIMENSIONS = [
  { id: 'logical_thinking', label: 'Logical Thinking', description: 'Deconstructing ambiguous situations into deterministic cause-and-effect components.' },
  { id: 'creative_problem_solving', label: 'Creative Problem Solving', description: 'Inventing non-obvious combinations and lateral shortcuts when conventional methods fail.' },
  { id: 'systems_thinking', label: 'Systems Thinking', description: 'Mapping feedback loops, hidden bottlenecks, dependencies, and second-order consequences.' },
  { id: 'innovation', label: 'Innovation', description: 'Challenging fundamental axioms to introduce paradigm shifts rather than incremental tweaks.' },
  { id: 'resourcefulness', label: 'Resourcefulness', description: 'Achieving 10x outcomes with 0.1x budget using scavenged parts, open tools, and grit.' },
  { id: 'risk_analysis', label: 'Risk Analysis', description: 'Anticipating catastrophic edge cases, failover conditions, and safety margins before failure.' },
  { id: 'empathy', label: 'Empathy', description: 'Designing for human dignity, safety, ergonomics, and real lived user friction.' },
  { id: 'execution', label: 'Execution', description: 'Translating whiteboard theories into ship-ready, robust, physical or digital artifacts.' },
  { id: 'curiosity', label: 'Curiosity', description: 'An obsessive urge to understand how things actually work beneath the surface.' },
  { id: 'resilience', label: 'Resilience', description: 'Viewing failure as telemetry; tenaciously hunting obscure bugs across adversity.' },
  { id: 'automation_mindset', label: 'Automation Mindset', description: 'Eliminating repetitive cognitive toil: "If it happens twice, automate it."' },
  { id: 'impact_orientation', label: 'Impact Orientation', description: 'Measuring engineering worth by human lives uplifted and societal public good created.' },
];

export function getAllAudiencePersonas() {
  return AUDIENCE_PERSONAS;
}

export function getPersonaById(id) {
  return AUDIENCE_PERSONAS.find((p) => p.id === id) || null;
}

export default AUDIENCE_PERSONAS;
