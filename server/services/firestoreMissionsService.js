/**
 * ENGINEERVERSE — Firestore Missions Service
 * Pure JavaScript (ZERO TypeScript).
 * Backed authoritatively by Firestore `missions` collection with local fallback.
 */

import { getFirestoreInstance } from './firestoreService.js';

export const SEED_MISSIONS = [
  {
    id: 'mission_clean_water',
    title: 'Autonomous Solar Desalination & Arsenic Filter',
    pillar: 'Water & Health',
    impact: 'Safe drinking water for 12,000 coastal & arid villages',
    difficulty: 'Intermediate Hardware / Fluid Dynamics',
    objective:
      'Design a passive, multi-stage solar thermal evaporator with integrated graphene-oxide arsenic remediation pads that operates without grid power or recurring consumable costs.',
    specifications: [
      'Daily yield: ≥25 liters per m² collector area',
      'Target production cost: ≤₹3,500 ($42)',
      'Maintenance cycle: Semi-annual saline purge with zero tools',
    ],
    disciplines: ['Mechanical', 'Chemical', 'Environmental'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'mission_mesh_network',
    title: 'Disaster-Resilient Off-Grid Mesh Relay Node',
    pillar: 'Emergency Telecom',
    impact: 'Zero-downtime emergency communications during cloudbursts and cyclones',
    difficulty: 'Embedded Systems / RF Engineering',
    objective:
      'Build an ultra-low power LoRa-mesh transceiver housed in a ruggedized IP67 enclosure capable of 14-day standby on a single 18650 LiFePO4 cell with micro-solar harvesting.',
    specifications: [
      'Packet latency across 5 hops: <3.2 seconds',
      'RF Range: Line-of-sight 12 km (868/433 MHz)',
      'Standby power draw: <18 μA during sleep cycles',
    ],
    disciplines: ['Electronics', 'Embedded Systems', 'Computer Networks'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'mission_assistive_actuator',
    title: 'Tactile Haptic Matrix for Spatial Navigation',
    pillar: 'Accessibility & Inclusion',
    impact: 'Independent mobility for 10M+ visually impaired pedestrians',
    difficulty: 'Mechatronics / Firmware',
    objective:
      'Develop a wearable tactile belt that translates stereo ultrasonic and LiDAR depth streams into real-time tactile vibrations indicating obstacle distances and safe walking paths.',
    specifications: [
      'Haptic refresh rate: 50 Hz with <30ms end-to-end latency',
      'Battery endurance: ≥10 hours of active navigation',
      'Weight: ≤180 grams with ergonomic breathable strap',
    ],
    disciplines: ['Biomedical', 'Robotics', 'Firmware'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'mission_cold_chain',
    title: 'Biomass Phase-Change Vaccine & Produce Cooler',
    pillar: 'Agriculture & Healthcare',
    impact: 'Zero spoilage of essential vaccines and perishable harvests in remote health centers',
    difficulty: 'Thermodynamics / Materials Science',
    objective:
      'Construct a thermal storage container combining solid-state PCM (Phase Change Material) chilling with indirect solar-biomass regenerative absorption cycles.',
    specifications: [
      'Holding temperature: 2°C to 8°C continuously for 72 hours without power',
      'Insulation: Recycled agricultural chaff aerogel',
      'Capacity: 45 liters payload volume',
    ],
    disciplines: ['Thermal Engineering', 'Agricultural', 'Materials Science'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

let missionsSeeded = false;

async function ensureMissionsSeeded(db) {
  if (missionsSeeded) return;
  try {
    const col = db.collection('missions');
    const snap = await col.limit(1).get();
    if (snap.empty) {
      console.log('[MissionsService] Seeding initial societal missions into Firestore...');
      for (const m of SEED_MISSIONS) {
        await col.doc(m.id).set({ ...m });
      }
    }
    missionsSeeded = true;
  } catch (err) {
    // Non-fatal if offline/unconfigured
  }
}

/**
 * Returns all missions from Firestore (falls back to SEED_MISSIONS)
 */
export async function getAllMissions() {
  try {
    const db = getFirestoreInstance();
    await ensureMissionsSeeded(db);
    const snap = await db.collection('missions').get();
    if (!snap.empty) {
      const docs = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
      docs.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      return docs;
    }
  } catch (err) {
    console.warn('[MissionsService] Firestore read notice, using local seed missions:', err.message);
  }
  return [...SEED_MISSIONS];
}

/**
 * Get single mission by ID
 */
export async function getMissionById(id) {
  if (!id) return null;
  try {
    const db = getFirestoreInstance();
    const docSnap = await db.collection('missions').doc(id).get();
    if (docSnap.exists) {
      return { ...docSnap.data(), id: docSnap.id };
    }
  } catch (err) {
    console.warn(`[MissionsService] Notice reading mission ${id}:`, err.message);
  }
  return SEED_MISSIONS.find((m) => m.id === id) || null;
}

/**
 * Create mission (admin only)
 */
export async function createMission(missionData) {
  const db = getFirestoreInstance();
  const id = missionData.id || 'mission_' + Date.now().toString(36);
  const now = new Date().toISOString();
  const record = {
    ...missionData,
    id,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection('missions').doc(id).set(record);
  return { success: true, mission: record };
}

/**
 * Update mission (admin only)
 */
export async function updateMission(id, updates) {
  const db = getFirestoreInstance();
  const now = new Date().toISOString();
  await db.collection('missions').doc(id).update({
    ...updates,
    updatedAt: now,
  });
  return { success: true, id };
}

/**
 * Delete mission (admin only)
 */
export async function deleteMission(id) {
  const db = getFirestoreInstance();
  await db.collection('missions').doc(id).delete();
  return { success: true, id };
}
