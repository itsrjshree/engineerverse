/**
 * ENGINEERVERSE — Future Engineer Missions (Build Pillar)
 * Hands-on engineering blueprints, real societal challenges, and builder pledges.
 * Fully public-facing, inspiring, zero internal EV numbers.
 */

import { useState } from 'react';
import { Card } from './ui/Card.jsx';
import { Badge } from './ui/Badge.jsx';
import { Button } from './ui/Button.jsx';
import { TabPill } from './ui/TabPill.jsx';
import {
  Compass,
  Zap,
  Droplet,
  Cpu,
  HeartHandshake,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Shield,
  Download,
  Share2,
} from 'lucide-react';
import { BRAND_CONFIG } from '../config/branding.js';
import { generateShortPublicId, buildCanonicalShareUrl } from '../services/artifacts.js';

const MISSIONS = [
  {
    id: 'mission_clean_water',
    title: 'Autonomous Solar Desalination & Arsenic Filter',
    pillar: 'Water & Health',
    icon: Droplet,
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
  },
  {
    id: 'mission_mesh_network',
    title: 'Disaster-Resilient Off-Grid Mesh Relay Node',
    pillar: 'Emergency Telecom',
    icon: Zap,
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
  },
  {
    id: 'mission_assistive_actuator',
    title: 'Tactile Haptic Matrix for Spatial Navigation',
    pillar: 'Accessibility & Inclusion',
    icon: Cpu,
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
  },
  {
    id: 'mission_cold_chain',
    title: 'Biomass Phase-Change Vaccine & Produce Cooler',
    pillar: 'Agriculture & Healthcare',
    icon: HeartHandshake,
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
  },
];

export function FutureMissionsView({ onSelectMission }) {
  const [selectedPillar, setSelectedPillar] = useState('All');
  const [pledgedMissions, setPledgedMissions] = useState(new Set());
  const [pledgeNotice, setPledgeNotice] = useState(null);

  const pillars = ['All', 'Water & Health', 'Emergency Telecom', 'Accessibility & Inclusion', 'Agriculture & Healthcare'];

  const filteredMissions = MISSIONS.filter(
    (m) => selectedPillar === 'All' || m.pillar === selectedPillar
  );

  const handleTakePledge = (missionId, missionTitle) => {
    const updated = new Set(pledgedMissions);
    if (updated.has(missionId)) {
      updated.delete(missionId);
    } else {
      updated.add(missionId);
      setPledgeNotice(`You have pledged to build or research: "${missionTitle}"!`);
      setTimeout(() => setPledgeNotice(null), 4000);
    }
    setPledgedMissions(updated);
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* View Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="purple" size="xs">Build & Engineering Missions</Badge>
          <span className="text-xs text-purple-400 font-semibold">Societal Impact Engineering</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          Future Engineer Missions.
        </h2>
        <p className="text-sm text-slate-300 mt-1 max-w-2xl font-normal leading-relaxed">
          The highest purpose of an engineer is solving systemic human vulnerabilities. Explore verified mission blueprints, commit to open-source solutions, and pledge your skills.
        </p>
      </div>

      {pledgeNotice && (
        <div className="p-4 rounded-xl bg-purple-950/70 border border-purple-500/60 text-purple-200 text-xs flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0" />
          <span>{pledgeNotice}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {pillars.map((pill) => (
          <TabPill
            key={pill}
            label={pill}
            active={selectedPillar === pill}
            onClick={() => setSelectedPillar(pill)}
          />
        ))}
      </div>

      {/* Missions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredMissions.map((mission) => {
          const IconComp = mission.icon;
          const isPledged = pledgedMissions.has(mission.id);

          return (
            <Card key={mission.id} className="p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-purple-900/50 border border-purple-700/40 flex items-center justify-center text-purple-300 shrink-0">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-purple-400 font-bold">
                        {mission.pillar}
                      </span>
                      <div className="text-xs text-slate-400 font-medium">
                        {mission.difficulty}
                      </div>
                    </div>
                  </div>
                  {isPledged && (
                    <Badge variant="glow" size="xs">
                      Pledged Builder
                    </Badge>
                  )}
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
                  {mission.title}
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {mission.objective}
                </p>

                {/* Key specs */}
                <div className="p-3.5 rounded-xl bg-[#060613] border border-purple-950/50 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">
                    Target Engineering Specifications:
                  </span>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {mission.specifications.map((spec, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-purple-400 font-mono font-bold">•</span>
                        <span>{spec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Disciplines involved */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-400 mr-1">Disciplines:</span>
                  {mission.disciplines.map((d) => (
                    <span
                      key={d}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950/60 text-purple-300 border border-purple-800/30"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Footer */}
              <div className="pt-4 border-t border-purple-950/40 flex items-center justify-between gap-3">
                <span className="text-[11px] text-slate-400 italic">
                  Impact: {mission.impact}
                </span>

                <Button
                  variant={isPledged ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={() => handleTakePledge(mission.id, mission.title)}
                >
                  {isPledged ? 'Pledge Recorded ✓' : 'Take the Mission'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default FutureMissionsView;
