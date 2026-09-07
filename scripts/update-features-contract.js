import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const featuresPath = path.resolve(__dirname, '../src/config/features.js');

import(featuresPath).then((m) => {
  const features = m.features;
  const FEATURE_AREAS = m.FEATURE_AREAS;
  const FEATURE_STATUS = m.FEATURE_STATUS;

  const enrichedFeatures = features.map((f) => {
    const isFoundation = ['EV-001', 'EV-004', 'EV-020', 'EV-058', 'EV-059', 'EV-060'].includes(f.id);
    const name = f.id === 'EV-020' ? 'The Problem Wall' : f.name;
    let purpose = f.purpose || f.description;
    purpose = purpose
      .replace(/My Engineering Pledge — 2026/g, 'My Engineering Pledge')
      .replace(/September 16, 2026/g, 'September 16 of each annual edition')
      .replace(/Engineers' Day 2026 is over/g, "Engineers' Day {YEAR} is over")
      .replace(/Sept 15, 2026/g, 'Sept 15 of each annual cycle');
    const acceptance = f.id === 'EV-020'
      ? 'Strictly named "The Problem Wall"; unlimited dynamic problem volume (10 to 100,000+); zero artificial 100-limit; real dynamic data counts; core tagline: India Still Has Problems. Engineers Still Have Work.'
      : f.acceptanceCriteria;

    return {
      id: f.id,
      name,
      purpose,
      area: f.area || (f.id === 'EV-037' ? FEATURE_AREAS.HUMANITY : FEATURE_AREAS.CORE),
      status: isFoundation ? FEATURE_STATUS.FOUNDATION : FEATURE_STATUS.PLANNED,
      plannedPhase: f.plannedPhase,
      dependencies: f.dependencies || [],
      frontendReq: f.frontendReq,
      backendReq: f.backendReq,
      databaseReq: f.databaseReq,
      aiReq: f.aiReq,
      seoReq: f.seoReq,
      adminReq: f.adminReq,
      analyticsReq: f.analyticsReq,
      securityReq: f.securityReq,
      accessibilityReq: f.accessibilityReq || 'WCAG AA compliant contrast (>4.5:1), full keyboard tab navigation, screen reader ARIA landmarks.',
      performanceReq: f.performanceReq || 'Sub-100ms interaction latency, zero layout shifts, optimized asset delivery.',
      acceptanceCriteria: acceptance,
      validationRequirements: f.validationRequirements || `Automated unit and contract validation for ${f.id}, verification gate check.`,
      implementationNotes: f.implementationNotes || `Sequential implementation governed by EV-001..EV-060 execution contract. Must complete frontend, backend, security, and verification gate before proceeding.`,
      verificationState: 'unverified',
      description: purpose, // Backwards compatibility
    };
  });

  const outputContent = `/**
 * ENGINEERVERSE — Canonical Feature Registry
 * All 60 mandatory features (EV-001 to EV-060)
 * Note: EV-020 is named "The Problem Wall" per section 12 of product architecture.
 * Allowed status values: planned | foundation | in_progress | implemented | verified | blocked
 *
 * Each card represents an authoritative architecture contract communicating:
 * 1. id, 2. name, 3. purpose, 4. area, 5. status, 6. plannedPhase, 7. dependencies,
 * 8. frontendReq, 9. backendReq, 10. databaseReq, 11. aiReq, 12. seoReq, 13. adminReq,
 * 14. analyticsReq, 15. securityReq, 16. accessibilityReq, 17. performanceReq,
 * 18. acceptanceCriteria, 19. validationRequirements, 20. implementationNotes, 21. verificationState.
 */

export const FEATURE_STATUS = {
  PLANNED: 'planned',
  FOUNDATION: 'foundation',
  IN_PROGRESS: 'in_progress',
  IMPLEMENTED: 'implemented',
  VERIFIED: 'verified',
  BLOCKED: 'blocked',
};

export const FEATURE_AREAS = {
  CORE: 'Core Experience',
  STORY: 'Story & Narrative',
  DISCOVER: 'Discover & DNA',
  IDENTITY: 'Identity & Manifesto',
  BUILD: 'Build & Missions',
  HUMANITY: 'Humanity & Community',
  LEARN: 'Learn & AI Mentor',
  CHALLENGES: 'Challenges & Leaderboard',
  LEGACY: 'Legacy & Heritage',
  SYSTEM: 'Infrastructure, Auth & SEO',
  ADMIN: 'Admin & Moderation',
};

export const features = ${JSON.stringify(enrichedFeatures, null, 2)};

export default features;
`;

  fs.writeFileSync(featuresPath, outputContent, 'utf-8');
  console.log('Successfully enriched features.js with full architecture contracts for all 60 features.');
});
