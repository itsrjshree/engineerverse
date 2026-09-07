/**
 * ENGINEERVERSE — Engineering Disciplines Taxonomy
 * Canonical, extensible centralized data source for all engineering fields.
 * Engineering coverage must naturally represent ALL engineering, not just software or AI.
 */

export const DISCIPLINE_CATEGORIES = {
  INFRASTRUCTURE: 'Infrastructure & Built Environment',
  MECHANICAL_SYSTEMS: 'Mechanical, Materials & Aerospace',
  ELECTRICAL_ELECTRONICS: 'Electrical, Electronics & Communications',
  COMPUTATION_DATA: 'Computation, Systems & Intelligence',
  CHEMICAL_BIO_ENVIRONMENT: 'Chemical, Biological & Ecological',
  PRODUCTION_LOGISTICS: 'Production, Systems & Operations',
};

export const ENGINEERING_DISCIPLINES = [
  {
    id: 'civil',
    name: 'Civil Engineering',
    shortName: 'Civil',
    category: DISCIPLINE_CATEGORIES.INFRASTRUCTURE,
    tagline: 'Shaping the physical foundations of human civilization.',
    description: 'Design, construction, and maintenance of physical and naturally built environments, including bridges, dams, canals, highways, and water supply networks.',
    coreQuestions: ['How do we distribute structural loads safely over centuries?', 'How can municipal water flow sustainably without energy waste?'],
    legendAssociation: 'Sir M. Visvesvaraya (Krishna Raja Sagara Dam, automatic sluice floodgates)',
  },
  {
    id: 'mechanical',
    name: 'Mechanical Engineering',
    shortName: 'Mechanical',
    category: DISCIPLINE_CATEGORIES.MECHANICAL_SYSTEMS,
    tagline: 'Harnessing kinematics, thermodynamics, and energy conversion.',
    description: 'Design, analysis, and manufacturing of mechanical systems, engines, fluid machinery, thermal cycles, and robotic kinematics.',
    coreQuestions: ['How do we maximize thermal efficiency under extreme friction?', 'How can mechanisms convert rotary to linear work with zero backlash?'],
    legendAssociation: 'Nikola Tesla & James Watt',
  },
  {
    id: 'electrical',
    name: 'Electrical Engineering',
    shortName: 'Electrical',
    category: DISCIPLINE_CATEGORIES.ELECTRICAL_ELECTRONICS,
    tagline: 'Electrifying continents and controlling electron flows at scale.',
    description: 'Generation, transmission, distribution, and utilization of electrical power, heavy machinery, power electronics, and electromagnetic systems.',
    coreQuestions: ['How do we maintain grid frequency stability during sudden renewable surges?', 'How can high-voltage DC reduce transmission losses across 1,000 kilometers?'],
    legendAssociation: 'Michael Faraday & Charles Proteus Steinmetz',
  },
  {
    id: 'electronics_communication',
    name: 'Electronics & Communication Engineering',
    shortName: 'ECE',
    category: DISCIPLINE_CATEGORIES.ELECTRICAL_ELECTRONICS,
    tagline: 'Bridging distances through waves, silicon, and photonics.',
    description: 'Microelectronic circuits, semiconductor devices, RF communication, antenna theory, signal processing, and optical fiber networks.',
    coreQuestions: ['How can millivolt signals survive noise over noisy wireless channels?', 'How can optical multiplexing pack terabits into a glass hair?'],
    legendAssociation: 'Sir Jagadish Chandra Bose (Millimetre wave microwave optics)',
  },
  {
    id: 'computer_software',
    name: 'Computer & Software Engineering',
    shortName: 'Software',
    category: DISCIPLINE_CATEGORIES.COMPUTATION_DATA,
    tagline: 'Architecting digital reality from logic, memory, and concurrency.',
    description: 'Operating systems, compilers, distributed architectures, database engines, network protocols, and reliable user software systems.',
    coreQuestions: ['How can distributed replicas agree on state in an untrusted network?', 'How do we make mission-critical systems fail predictably?'],
    legendAssociation: 'Alan Turing & Margaret Hamilton',
  },
  {
    id: 'ai_ml_data',
    name: 'AI, Machine Learning & Data Engineering',
    shortName: 'AI & Data',
    category: DISCIPLINE_CATEGORIES.COMPUTATION_DATA,
    tagline: 'Transforming high-dimensional patterns into deterministic decisions.',
    description: 'Statistical learning, neural network architectures, streaming data pipelines, model optimization, safety alignment, and inference systems.',
    coreQuestions: ['How do we prevent hallucinations in safety-critical automated diagnosis?', 'How can petabyte data streams be indexed with sub-millisecond latency?'],
    legendAssociation: 'Claude Shannon & Geoffrey Hinton',
  },
  {
    id: 'chemical',
    name: 'Chemical Engineering',
    shortName: 'Chemical',
    category: DISCIPLINE_CATEGORIES.CHEMICAL_BIO_ENVIRONMENT,
    tagline: 'Transforming raw molecules into clean fuels, fertilizers, and materials.',
    description: 'Chemical process design, reaction kinetics, separation processes, polymers, catalysis, and scalable manufacturing of life-saving pharmaceuticals.',
    coreQuestions: ['How do we optimize catalytic turnover while eliminating toxic effluents?', 'How can membrane filtration separate pure hydrogen at room temperature?'],
    legendAssociation: 'Prafulla Chandra Ray & Fritz Haber',
  },
  {
    id: 'aerospace_aeronautical',
    name: 'Aerospace & Aeronautical Engineering',
    shortName: 'Aerospace',
    category: DISCIPLINE_CATEGORIES.MECHANICAL_SYSTEMS,
    tagline: 'Defying gravity across Earth atmosphere and interplanetary space.',
    description: 'Aerodynamics, propulsion systems, structural dynamics, avionics, orbital mechanics, and spacecraft navigation.',
    coreQuestions: ['How do we prevent aerodynamic flutter at Mach 5?', 'How can ion thrusters achieve years of continuous thrust on grams of propellant?'],
    legendAssociation: 'Dr. A.P.J. Abdul Kalam & Satish Dhawan',
  },
  {
    id: 'biomedical',
    name: 'Biomedical Engineering',
    shortName: 'Biomedical',
    category: DISCIPLINE_CATEGORIES.CHEMICAL_BIO_ENVIRONMENT,
    tagline: 'Engineering at the convergence of biology, electronics, and medicine.',
    description: 'Medical instrumentation, biocompatible prosthetics, neural interfaces, diagnostic imaging, and artificial organs.',
    coreQuestions: ['How can neural implants record synaptic potentials without immune rejection?', 'How can ultra-low-cost ventilators be manufactured entirely from standard parts?'],
    legendAssociation: 'Robert Jarvik & Willem Kolff',
  },
  {
    id: 'environmental',
    name: 'Environmental Engineering',
    shortName: 'Environmental',
    category: DISCIPLINE_CATEGORIES.CHEMICAL_BIO_ENVIRONMENT,
    tagline: 'Purifying water, air, and soil through regenerative systems.',
    description: 'Remediation of ecological contamination, municipal wastewater treatment, carbon sequestration, solid waste recycling, and pollution prevention.',
    coreQuestions: ['How can biological wetlands remove heavy metals from industrial runoff?', 'How do we design closed-loop circular packaging that degrades within 90 days?'],
    legendAssociation: 'Ellen Swallow Richards',
  },
  {
    id: 'agricultural',
    name: 'Agricultural & Food Engineering',
    shortName: 'Agricultural',
    category: DISCIPLINE_CATEGORIES.INFRASTRUCTURE,
    tagline: 'Nourishing billions through smart mechanization, irrigation, and post-harvest engineering.',
    description: 'Precision irrigation, soil kinematics, automated harvesters, cold chain thermal logistics, and food preservation engineering.',
    coreQuestions: ['How can precision drip irrigation reduce water consumption by 70% while raising crop yields?', 'How do we design passive evaporative coolers for remote mandis?'],
    legendAssociation: 'M.S. Swaminathan & Norman Borlaug',
  },
  {
    id: 'automobile',
    name: 'Automobile Engineering',
    shortName: 'Automobile',
    category: DISCIPLINE_CATEGORIES.MECHANICAL_SYSTEMS,
    tagline: 'Pioneering clean mobility, electric powertrains, and autonomous transit.',
    description: 'Vehicle dynamics, battery thermal management systems, chassis design, crash safety engineering, and hybrid/electric propulsion.',
    coreQuestions: ['How do we prevent thermal runaway in high-density lithium-ion packs?', 'How can vehicle chassis absorb kinetic energy during frontal collisions?'],
    legendAssociation: 'Henry Ford & Ferdinand Porsche',
  },
  {
    id: 'industrial_production',
    name: 'Industrial & Production Engineering',
    shortName: 'Industrial',
    category: DISCIPLINE_CATEGORIES.PRODUCTION_LOGISTICS,
    tagline: 'Eliminating waste and orchestrating human-machine manufacturing harmony.',
    description: 'Operations research, manufacturing process optimization, statistical quality control, supply chain logistics, and ergonomic workstation design.',
    coreQuestions: ['How do we reduce line changeover time from hours to single-digit minutes (SMED)?', 'How can predictive queueing prevent factory bottlenecks?'],
    legendAssociation: 'Taiichi Ohno (Toyota Production System) & W. Edwards Deming',
  },
  {
    id: 'robotics_mechatronics',
    name: 'Robotics & Mechatronics Engineering',
    shortName: 'Robotics',
    category: DISCIPLINE_CATEGORIES.MECHANICAL_SYSTEMS,
    tagline: 'Infusing mechanical precision with electronic reflexes and code.',
    description: 'Autonomous mobile robots, industrial manipulators, embedded motor control, computer vision, sensor fusion, and actuator dynamics.',
    coreQuestions: ['How do we achieve real-time impedance control during delicate surgical manipulation?', 'How can multi-legged robots maintain dynamic balance on slippery gravel?'],
    legendAssociation: 'George Devol & Joseph Engelberger',
  },
  {
    id: 'materials_metallurgical',
    name: 'Materials & Metallurgical Engineering',
    shortName: 'Materials',
    category: DISCIPLINE_CATEGORIES.MECHANICAL_SYSTEMS,
    tagline: 'Synthesizing the atoms and crystals that enable all other engineering.',
    description: 'Crystallography, metallurgy, superalloys, advanced ceramics, carbon composites, smart metamaterials, and nano-coatings.',
    coreQuestions: ['How can single-crystal nickel turbine blades withstand temperatures hotter than their melting point?', 'How do we design high-entropy alloys with extreme fracture toughness?'],
    legendAssociation: 'Henry Clifton Sorby & Cyril Stanley Smith',
  },
  {
    id: 'structural',
    name: 'Structural Engineering',
    shortName: 'Structural',
    category: DISCIPLINE_CATEGORIES.INFRASTRUCTURE,
    tagline: 'Defying tectonic quakes, wind vortexes, and the forces of gravity.',
    description: 'Finite element analysis, earthquake-resistant damping, skyscraper design, deep subterranean foundations, and cable-stayed spans.',
    coreQuestions: ['How do tuned mass dampers keep 500-meter skyscrapers from oscillating in typhoons?', 'How do base isolators decouple buildings from seismic shock waves?'],
    legendAssociation: 'Fazlur Rahman Khan (Father of tubular designs for skyscrapers)',
  },
  {
    id: 'telecommunications',
    name: 'Telecommunications Engineering',
    shortName: 'Telecom',
    category: DISCIPLINE_CATEGORIES.ELECTRICAL_ELECTRONICS,
    tagline: 'Connecting every human voice across undersea cables, satellite constellations, and 6G.',
    description: 'Cellular network architectures, beamforming, software-defined radio, satellite constellations, and low-latency packet routing.',
    coreQuestions: ['How does massive MIMO steer electromagnetic energy directly to moving receivers?', 'How can satellite inter-links establish orbital internet backbones?'],
    legendAssociation: 'Guglielmo Marconi & Hedy Lamarr',
  },
];

/**
 * Extensible helper functions
 */
export function getAllDisciplines() {
  return ENGINEERING_DISCIPLINES;
}

export function getDisciplineById(id) {
  if (!id) return null;
  return ENGINEERING_DISCIPLINES.find((d) => d.id.toLowerCase() === id.toLowerCase()) || null;
}

export function getDisciplinesByCategory(category) {
  if (!category) return ENGINEERING_DISCIPLINES;
  return ENGINEERING_DISCIPLINES.filter((d) => d.category === category);
}

/**
 * Extensible register method allowing dynamic future discipline additions
 */
export function registerDiscipline(newDiscipline) {
  if (!newDiscipline || !newDiscipline.id || !newDiscipline.name) {
    throw new Error('Discipline must include id and name.');
  }
  const existingIndex = ENGINEERING_DISCIPLINES.findIndex((d) => d.id === newDiscipline.id);
  if (existingIndex >= 0) {
    ENGINEERING_DISCIPLINES[existingIndex] = { ...ENGINEERING_DISCIPLINES[existingIndex], ...newDiscipline };
  } else {
    ENGINEERING_DISCIPLINES.push(newDiscipline);
  }
  return ENGINEERING_DISCIPLINES;
}

export default ENGINEERING_DISCIPLINES;
