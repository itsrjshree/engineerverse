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
 * The 11 Core Mindset Dimensions (Zero Degree Gatekeeping)
 */
export const CORE_MINDSET_DIMENSIONS = [
  { id: 'thinking', label: 'Thinking & Analysis', description: 'Deconstructing ambiguous situations into logical cause-and-effect.' },
  { id: 'curiosity', label: 'Curiosity', description: 'An irresistible drive to know how things work beneath the surface.' },
  { id: 'systems_thinking', label: 'Systems Thinking', description: 'Seeing loops, bottlenecks, and interconnected dependencies.' },
  { id: 'problem_solving', label: 'Problem Solving', description: 'Tenaciously tackling what others accept as impossible or permanent.' },
  { id: 'creativity', label: 'Creativity', description: 'Combining disparate concepts into novel, non-obvious solutions.' },
  { id: 'resourcefulness', label: 'Resourcefulness', description: 'Achieving extraordinary results with limited budgets and existing materials.' },
  { id: 'execution', label: 'Execution', description: 'Moving from theoretical whiteboard designs to tangible, functioning reality.' },
  { id: 'resilience', label: 'Resilience', description: 'Treating bugs, failures, and structural fatigue as telemetry to learn from.' },
  { id: 'empathy', label: 'Empathy', description: 'Designing for human dignity, safety, ergonomics, and real lived experience.' },
  { id: 'innovation', label: 'Innovation', description: 'Questioning fundamental axioms to build superior paradigms.' },
  { id: 'impact_orientation', label: 'Impact Orientation', description: 'Measuring engineering worth by human lives uplifted.' },
];

export function getAllAudiencePersonas() {
  return AUDIENCE_PERSONAS;
}

export function getPersonaById(id) {
  return AUDIENCE_PERSONAS.find((p) => p.id === id) || null;
}

export default AUDIENCE_PERSONAS;
