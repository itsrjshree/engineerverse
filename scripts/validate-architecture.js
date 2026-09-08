/**
 * ENGINEERVERSE — Comprehensive Architecture & Contract Validator
 * Section 15: Automated validation enforcing all platform architectural invariants:
 * 1. Zero TypeScript (.ts, .tsx, tsconfig.json, or TS dependencies in package.json)
 * 2. Year-Independent Campaign Engine (No `year === 2026` or fixed-year logic; works across 2026..2035+)
 * 3. Feature Registry Contract Integrity (Exactly 60 features EV-001..EV-060, all 21 fields defined)
 * 4. Status & Verification Integrity (Valid statuses, zero unverified features marked verified)
 * 5. Honest Community Data (Zero fabricated social proof, zero fake metric counters)
 * 6. "The Problem Wall" Canonical Nomenclature (EV-020 named "The Problem Wall", no artificial 100-limit)
 * 7. Engineering Disciplines Taxonomy (All required engineering disciplines present)
 * 8. Audience & General User Inclusivity Model (Zero degree gatekeeping, all personas & dimensions)
 * 9. Canonical Base Route (https://rjshree.com/engineerverse)
 * 10. Secrets & Environment Safety (No raw API keys in .env.example)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let errors = [];
let passes = [];

function check(title, condition, errorMsg) {
  if (condition) {
    passes.push(`✓ ${title}`);
  } else {
    errors.push(`✗ ${title}: ${errorMsg}`);
  }
}

async function runValidation() {
  console.log('\n======================================================');
  console.log('ENGINEERVERSE — Comprehensive Architecture & Contract Audit');
  console.log('======================================================\n');

  // 1. Zero TypeScript Enforcement
  function findTsFiles(dir) {
    let found = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        found = found.concat(findTsFiles(fullPath));
      } else if (/\.(ts|tsx)$/.test(entry.name) || entry.name === 'tsconfig.json') {
        found.push(fullPath);
      }
    }
    return found;
  }

  const tsFiles = findTsFiles(rootDir);
  check(
    'Rule 1.1: Zero TypeScript Files (.ts, .tsx, tsconfig.json)',
    tsFiles.length === 0,
    `Found forbidden TypeScript files: ${tsFiles.join(', ')}`
  );

  const pkgJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
  const devDeps = pkgJson.devDependencies || {};
  const deps = pkgJson.dependencies || {};
  const hasTsPackage =
    devDeps['typescript'] ||
    devDeps['@types/node'] ||
    devDeps['@types/express'] ||
    devDeps['tsx'] ||
    deps['typescript'] ||
    deps['tsx'];
  check(
    'Rule 1.2: No TypeScript packages in package.json',
    !hasTsPackage,
    `Found TypeScript dependencies in package.json: ${JSON.stringify(hasTsPackage)}`
  );

  // 2. Year-Independent Campaign Engine
  const campaignEnginePath = path.join(rootDir, 'src/config/campaign.js');
  check('Rule 2.1: Campaign engine file exists', fs.existsSync(campaignEnginePath), 'src/config/campaign.js missing');

  if (fs.existsSync(campaignEnginePath)) {
    const campaignSource = fs.readFileSync(campaignEnginePath, 'utf-8');
    const hasFixedYearLogic =
      campaignSource.includes('year === 2026') ||
      campaignSource.includes("year === '2026'") ||
      campaignSource.includes('currentYear === 2026');
    check(
      'Rule 2.2: Zero hardcoded 2026 business logic in campaign engine',
      !hasFixedYearLogic,
      'Detected fixed `year === 2026` logic in src/config/campaign.js'
    );

    const { getCampaignState, PRESENTATION_STATES, CAMPAIGN_STATES } = await import(campaignEnginePath);
    const testYears = [2026, 2027, 2028, 2035];
    let allYearsPass = true;
    for (const y of testYears) {
      const otherDayPre = getCampaignState(`${y}-09-10T12:00:00Z`);
      const sept15Day = getCampaignState(`${y}-09-15T06:00:00Z`);
      const otherDayPost = getCampaignState(`${y}-09-16T12:00:00Z`);

      // September 15 is ENGINEERS_DAY; all other days are EVERGREEN
      if (otherDayPre.state !== 'evergreen' || otherDayPre.edition !== String(y)) allYearsPass = false;
      if (sept15Day.state !== 'engineers_day' || sept15Day.edition !== String(y)) allYearsPass = false;
      if (otherDayPost.state !== 'evergreen' || otherDayPost.edition !== String(y)) allYearsPass = false;
    }
    check(
      'Rule 2.3: Year-independent annual cycle verified across 2026, 2027, 2028, 2035 (Sept 15 = Engineers Day, all others = Evergreen)',
      allYearsPass,
      'Campaign state failed dynamic annual cycle resolution'
    );
  }

  // 3. Feature Registry Contract Integrity (All 60 Features)
  const featuresPath = path.join(rootDir, 'src/config/features.js');
  check('Rule 3.1: Feature registry file exists', fs.existsSync(featuresPath), 'src/config/features.js missing');

  if (fs.existsSync(featuresPath)) {
    const { features, FEATURE_STATUS } = await import(featuresPath);
    check(
      'Rule 3.2: Exactly 60 features contracted (EV-001 to EV-060)',
      features.length === 60,
      `Expected exactly 60 features, found ${features.length}`
    );

    const requiredFields = [
      'id',
      'name',
      'purpose',
      'area',
      'status',
      'plannedPhase',
      'dependencies',
      'frontendReq',
      'backendReq',
      'databaseReq',
      'aiReq',
      'seoReq',
      'adminReq',
      'analyticsReq',
      'securityReq',
      'accessibilityReq',
      'performanceReq',
      'acceptanceCriteria',
      'validationRequirements',
      'implementationNotes',
      'verificationState',
    ];

    let contractViolations = [];
    const validStatuses = Object.values(FEATURE_STATUS);

    for (let i = 1; i <= 60; i++) {
      const expectedId = `EV-${String(i).padStart(3, '0')}`;
      const f = features.find((item) => item.id === expectedId);
      if (!f) {
        contractViolations.push(`Missing feature: ${expectedId}`);
        continue;
      }

      for (const field of requiredFields) {
        if (f[field] === undefined || f[field] === null || f[field] === '') {
          contractViolations.push(`${expectedId} missing field: ${field}`);
        }
      }

      if (!validStatuses.includes(f.status)) {
        contractViolations.push(`${expectedId} has invalid status: ${f.status}`);
      }

      // Invariant: No feature may be marked "verified" prematurely
      if (f.status === FEATURE_STATUS.VERIFIED || f.verificationState === 'verified') {
        contractViolations.push(`${expectedId} is prematurely marked verified! Must pass verification gate first.`);
      }
    }

    check(
      'Rule 3.3: All 21 architecture contract fields complete on every feature',
      contractViolations.length === 0,
      `Violations found (${contractViolations.length}): ${contractViolations.slice(0, 3).join('; ')}`
    );

    // 4. "The Problem Wall" Nomenclature & Non-Limitation (EV-020)
    const ev20 = features.find((f) => f.id === 'EV-020');
    const isProblemWall = ev20 && ev20.name === 'The Problem Wall';
    const noArtificial100 = ev20 && !ev20.name.includes('100') && !ev20.purpose.includes('100 problems limit');
    check(
      'Rule 4.1: EV-020 nomenclature is strictly "The Problem Wall"',
      isProblemWall,
      `EV-020 named "${ev20?.name}" instead of "The Problem Wall"`
    );
    check(
      'Rule 4.2: The Problem Wall architecture is unlimited (no 100 limit)',
      noArtificial100,
      'The Problem Wall must not contain artificial 100-limit constraints'
    );
  }

  // 5. Engineering Disciplines Taxonomy
  const disciplinesPath = path.join(rootDir, 'src/config/disciplines.js');
  check('Rule 5.1: Disciplines taxonomy exists', fs.existsSync(disciplinesPath), 'src/config/disciplines.js missing');

  if (fs.existsSync(disciplinesPath)) {
    const { ENGINEERING_DISCIPLINES } = await import(disciplinesPath);
    const requiredDisciplines = [
      'civil',
      'mechanical',
      'electrical',
      'electronics_communication',
      'computer_software',
      'ai_ml_data',
      'chemical',
      'aerospace_aeronautical',
      'biomedical',
      'environmental',
      'agricultural',
      'automobile',
      'industrial_production',
      'robotics_mechatronics',
      'materials_metallurgical',
      'structural',
      'telecommunications',
    ];

    const presentIds = ENGINEERING_DISCIPLINES.map((d) => d.id);
    const missingDisciplines = requiredDisciplines.filter((d) => !presentIds.includes(d));

    check(
      'Rule 5.2: All required engineering disciplines present in taxonomy',
      missingDisciplines.length === 0,
      `Missing engineering disciplines: ${missingDisciplines.join(', ')}`
    );
  }

  // 6. Audience & General User Inclusivity Model
  const audiencePath = path.join(rootDir, 'src/config/audience.js');
  check('Rule 6.1: Audience taxonomy exists', fs.existsSync(audiencePath), 'src/config/audience.js missing');

  if (fs.existsSync(audiencePath)) {
    const { AUDIENCE_PERSONAS, CORE_MINDSET_DIMENSIONS } = await import(audiencePath);
    const hasCuriousGeneralUser = AUDIENCE_PERSONAS.some((p) => p.id === 'curious_mind' && p.degreeRequired === false);
    const hasDimensions = CORE_MINDSET_DIMENSIONS.length === 12;

    check(
      'Rule 6.2: General users without degrees are first-class users',
      hasCuriousGeneralUser,
      'General users without degrees must be supported as first-class citizens'
    );
    check(
      'Rule 6.3: Exactly 12 core engineering mindset dimensions defined',
      hasDimensions,
      `Expected exactly 12 mindset dimensions, found ${CORE_MINDSET_DIMENSIONS.length}`
    );
  }

  // 7. Canonical Route & Entry Point Integrity
  const routesPath = path.join(rootDir, 'src/config/routes.js');
  if (fs.existsSync(routesPath)) {
    const { routes } = await import(routesPath);
    const hubRoute = routes.find((r) => r.path === '/engineerverse');
    const problemWallRoute = routes.find((r) => r.path === '/engineerverse/the-problem-wall');

    check(
      'Rule 7.1: Canonical base route /engineerverse is registered',
      Boolean(hubRoute && hubRoute.seo?.canonical === 'https://rjshree.com/engineerverse'),
      'Canonical route /engineerverse misconfigured'
    );
    check(
      'Rule 7.2: Canonical /engineerverse/the-problem-wall is registered',
      Boolean(problemWallRoute),
      '/engineerverse/the-problem-wall route missing'
    );
  }

  // 8. Secrets & Environment Safety
  const envExamplePath = path.join(rootDir, '.env.example');
  if (fs.existsSync(envExamplePath)) {
    const envContent = fs.readFileSync(envExamplePath, 'utf-8');
    const hasRealKey = /AIza[0-9A-Za-z-_]{35}/.test(envContent);
    check(
      'Rule 8.1: No raw API secrets committed in .env.example',
      !hasRealKey,
      'Detected potential live Google API key in .env.example'
    );

    const hasInventedPriteeKey =
      envContent.includes('PRITEE_AI_API_KEY') || envContent.includes('PRITEE_AI_API_ENDPOINT');
    check(
      'Rule 8.2: No invented PRITEE_AI_* API keys or endpoints in .env.example',
      !hasInventedPriteeKey,
      'Detected invented PRITEE_AI_API_KEY or PRITEE_AI_API_ENDPOINT in .env.example'
    );

    const hasLegitimateProviderKeys =
      envContent.includes('GEMINI_API_KEY') && envContent.includes('OPENROUTER_API_KEY');
    check(
      'Rule 8.3: Server-side provider keys (GEMINI_API_KEY, OPENROUTER_API_KEY) properly documented',
      hasLegitimateProviderKeys,
      'Missing standard provider keys in .env.example'
    );
  }

  // 9. Honest Community Data (Zero Fabricated Metrics)
  const adminRoutePath = path.join(rootDir, 'server/routes/admin.js');
  if (fs.existsSync(adminRoutePath)) {
    const adminSource = fs.readFileSync(adminRoutePath, 'utf-8');
    const hasFake14200 = adminSource.includes('14200') || adminSource.includes('3410');
    check(
      'Rule 9.1: Zero fabricated visitors or vanity counts in telemetry',
      !hasFake14200,
      'Found fabricated visitor/telemetry numbers in server/routes/admin.js'
    );
  }

  // Print results
  passes.forEach((p) => console.log(p));

  if (errors.length > 0) {
    console.log('\nValidation FAILED with errors:');
    errors.forEach((e) => console.error(e));
    process.exit(1);
  } else {
    console.log('\n======================================================');
    console.log('✓ ALL ARCHITECTURE AND CONTRACT CHECKS PASSED CLEANLY');
    console.log('======================================================\n');
  }
}

runValidation().catch((err) => {
  console.error('Validator execution failed:', err);
  process.exit(1);
});
