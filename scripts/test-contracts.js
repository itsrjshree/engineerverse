/**
 * ENGINEERVERSE — Automated Contract & Engine Test Suite
 * Executed via `npm test`
 */

import assert from 'assert';
import { getCampaignState, CAMPAIGN_STATES } from '../src/config/campaign.js';
import { features, FEATURE_STATUS } from '../src/config/features.js';
import {
  ENGINEERING_DISCIPLINES,
  getDisciplineById,
  getDisciplinesByCategory,
  DISCIPLINE_CATEGORIES,
  registerDiscipline,
} from '../src/config/disciplines.js';
import { AUDIENCE_PERSONAS, CORE_MINDSET_DIMENSIONS, getPersonaById } from '../src/config/audience.js';

console.log('\n--- Running ENGINEERVERSE Automated Unit & Contract Suite ---\n');

// 1. Campaign Engine Tests
console.log('1. Testing Campaign Lifecycle State Engine...');
const sim2026Pre = getCampaignState('2026-09-14T10:00:00Z');
assert.strictEqual(sim2026Pre.state, CAMPAIGN_STATES.PRE_LAUNCH, 'Pre-launch state mismatch for Sept 14');
assert.strictEqual(sim2026Pre.edition, '2026');

const sim2026Launch = getCampaignState('2026-09-15T04:00:00Z');
assert.strictEqual(sim2026Launch.state, CAMPAIGN_STATES.LAUNCH_DAY, 'Launch day state mismatch for Sept 15');
assert.strictEqual(sim2026Launch.isEngineersDay, true);

const sim2026Post = getCampaignState('2026-09-16T04:00:00Z');
assert.strictEqual(sim2026Post.state, CAMPAIGN_STATES.EVERGREEN, 'Evergreen state mismatch for Sept 16');
assert.ok(sim2026Post.badgeText.includes("Engineers' Day 2026 is over. The problems aren't."));

// Test future year (2030)
const sim2030Launch = getCampaignState('2030-09-15T12:00:00Z');
assert.strictEqual(sim2030Launch.state, CAMPAIGN_STATES.LAUNCH_DAY);
assert.strictEqual(sim2030Launch.edition, '2030');
console.log('✓ Campaign Engine tests passed.');

// 2. Feature Registry Integrity Tests
console.log('2. Testing Feature Registry (EV-001..EV-060)...');
assert.strictEqual(features.length, 60, 'Features array must have exactly 60 entries.');
const evIds = new Set(features.map((f) => f.id));
assert.strictEqual(evIds.size, 60, 'All feature IDs must be unique.');

const ev20 = features.find((f) => f.id === 'EV-020');
assert.strictEqual(ev20.name, 'The Problem Wall', 'EV-020 must be strictly named "The Problem Wall"');
assert.strictEqual(ev20.verificationState, 'unverified', 'EV-020 verificationState must be unverified');
console.log('✓ Feature Registry contract tests passed.');

// 3. Disciplines Taxonomy Tests
console.log('3. Testing Engineering Disciplines Taxonomy...');
assert.ok(ENGINEERING_DISCIPLINES.length >= 17, 'Must have at least 17 canonical disciplines');
const civil = getDisciplineById('civil');
assert.ok(civil && civil.name === 'Civil Engineering', 'Civil discipline lookup failed');

const infra = getDisciplinesByCategory(DISCIPLINE_CATEGORIES.INFRASTRUCTURE);
assert.ok(infra.length >= 2, 'Infrastructure category count mismatch');

// Test extensible registration
const initialLen = ENGINEERING_DISCIPLINES.length;
registerDiscipline({
  id: 'quantum_engineering',
  name: 'Quantum Engineering',
  shortName: 'Quantum',
  category: DISCIPLINE_CATEGORIES.COMPUTATION_DATA,
  tagline: 'Manipulating coherent superposition and entanglement.',
  description: 'Design of cryogenic quantum processors, quantum sensors, and error-corrected qubit registers.',
  coreQuestions: ['How do we maintain quantum coherence against thermal noise?'],
  legendAssociation: 'Satyendra Nath Bose & Richard Feynman',
});
assert.strictEqual(ENGINEERING_DISCIPLINES.length, initialLen + 1, 'Extensible discipline registration failed');
console.log('✓ Disciplines taxonomy tests passed.');

// 4. Audience Model Tests
console.log('4. Testing Audience & General User Inclusivity Model...');
assert.ok(AUDIENCE_PERSONAS.length >= 7, 'Must have at least 7 audience personas');
const curious = getPersonaById('curious_mind');
assert.ok(curious && curious.degreeRequired === false, 'General user must not require a degree');
assert.strictEqual(CORE_MINDSET_DIMENSIONS.length, 11, 'Must have exactly 11 core mindset dimensions');
console.log('✓ Audience model tests passed.');

// 5. Backend Server API Integration Tests
console.log('5. Testing Backend Server API Routes...');
const { createServer } = await import('../server/index.js');
const app = createServer();
const server = app.listen(0);
const port = server.address().port;

try {
  const healthRes = await fetch(`http://127.0.0.1:${port}/api/health`);
  const healthData = await healthRes.json();
  assert.strictEqual(healthData.status, 'healthy');
  assert.strictEqual(healthData.featuresCount, 60);
  assert.strictEqual(healthData.canonicalUrl, 'https://rjshree.com/engineerverse');

  const problemsRes = await fetch(`http://127.0.0.1:${port}/api/problems`);
  const problemsData = await problemsRes.json();
  assert.strictEqual(problemsData.success, true);
  assert.strictEqual(problemsData.wallName, 'The Problem Wall');
  assert.strictEqual(problemsData.tagline, 'India Still Has Problems. Engineers Still Have Work.');
  console.log('✓ Backend Server API routes passed.');
} finally {
  server.close();
}

console.log('\n======================================================');
console.log('✓ ALL 5 AUTOMATED CONTRACT SUITES COMPLETED SUCCESSFULLY');
console.log('======================================================\n');
process.exit(0);
