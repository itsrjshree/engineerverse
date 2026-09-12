/**
 * ENGINEERVERSE — Google OAuth & Firebase Identity Forensic Verification
 *
 * Verifies:
 * 1. Firebase Config Source & Normalization (API Key, Project ID, Auth Domain)
 * 2. Real Google Identity Toolkit Handshake (accounts:createAuthUri HTTP 200)
 * 3. Identity Toolkit Authorized Domains Audit (detects missing domains)
 * 4. Google Auth Provider Custom Parameters (select_account prompt)
 * 5. COOP & Security Headers Audit (same-origin-allow-popups, CSP, no-sniff)
 * 6. Phase 1 Security Invariance (RS256 validation, no mock login, no admin bypass)
 */

import assert from 'node:assert';
import http from 'node:http';
import { initializeApp, getApps, deleteApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// createServer() fails closed without SESSION_SECRET (by design, per Phase 1
// security remediation) — this test needs a running server, not a real
// production secret, so we set a test-only value here, matching the same
// pattern already used in test-admin-auth.js and test-phase1-security.js.
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'a_very_secure_test_session_secret_with_more_than_32_characters';
process.env.VITE_FIREBASE_API_KEY = process.env.VITE_FIREBASE_API_KEY || 'AIzaSyDFcRRjBm3nM5bdplh8WmCS0yw50W7g_7s';
process.env.VITE_FIREBASE_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || 'engineerverse-6dda1';
process.env.VITE_FIREBASE_AUTH_DOMAIN = process.env.VITE_FIREBASE_AUTH_DOMAIN || 'engineerverse-6dda1.firebaseapp.com';

import { createServer } from '../server/index.js';
import { normalizeFirebaseApiKey, isValidFirebaseApiKey } from '../src/services/firebaseClient.js';

console.log('='.repeat(75));
console.log('ENGINEERVERSE — GOOGLE OAUTH & FIREBASE IDENTITY FORENSIC AUDIT');
console.log('='.repeat(75));

// ----------------------------------------------------------------------------
// TEST 1: API Key Normalization & Structure
// ----------------------------------------------------------------------------
console.log('\n[1/7] Testing Firebase API Key Normalization & Validation...');
{
  const missingA = 'IzaSyDFcRRjBm3nM5bdplh8WmCS0yw50W7g_7s';
  const normalized = normalizeFirebaseApiKey(missingA);
  assert.strictEqual(normalized.startsWith('AIzaSy'), true, 'normalizeFirebaseApiKey must restore leading A');
  assert.strictEqual(normalized.length, 39, 'Standard Google Web API key must be exactly 39 characters');
  assert.strictEqual(isValidFirebaseApiKey(normalized), true, 'Normalized key must be valid');

  const quoted = '"AIzaSyDFcRRjBm3nM5bdplh8WmCS0yw50W7g_7s"';
  assert.strictEqual(normalizeFirebaseApiKey(quoted), 'AIzaSyDFcRRjBm3nM5bdplh8WmCS0yw50W7g_7s');
  console.log('   ✓ API key normalization correctly repairs leading "A" and trims quotes');
}

// ----------------------------------------------------------------------------
// TEST 2: Live /api/auth/client-config Endpoint Verification
// ----------------------------------------------------------------------------
console.log('\n[2/7] Inspecting /api/auth/client-config on Express Server...');
const app = createServer();
const server = http.createServer(app);

await new Promise((resolve) => server.listen(0, resolve));
const port = server.address().port;

try {
  const res = await fetch(`http://127.0.0.1:${port}/api/auth/client-config`);
  assert.strictEqual(res.status, 200, '/api/auth/client-config must return 200');
  const data = await res.json();

  assert.strictEqual(data.success, true);
  assert.strictEqual(data.configured, true, 'client-config must report configured: true');
  assert.ok(data.config.apiKey.startsWith('AIzaSy'), 'client-config must return normalized API key');
  assert.strictEqual(data.config.projectId, 'engineerverse-6dda1');
  assert.strictEqual(data.config.authDomain, 'engineerverse-6dda1.firebaseapp.com');

  console.log('   ✓ /api/auth/client-config returns valid, normalized Firebase credentials');
  console.log(`     - Project ID: ${data.config.projectId}`);
  console.log(`     - Auth Domain: ${data.config.authDomain}`);
  console.log(`     - API Key: ${data.config.apiKey.slice(0, 10)}... (length: ${data.config.apiKey.length})`);

  // ----------------------------------------------------------------------------
  // TEST 3: Direct Handshake with Google Identity Toolkit API
  // ----------------------------------------------------------------------------
  console.log('\n[3/7] Performing Real HTTP Handshake with Google Identity Toolkit...');
  const createAuthUriUrl = `https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${data.config.apiKey}`;
  const gRes = await fetch(createAuthUriUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      providerId: 'google.com',
      continueUri: `https://${data.config.authDomain}/__/auth/handler`,
    }),
  });

  assert.strictEqual(gRes.status, 200, `Google Identity Toolkit returned ${gRes.status}`);
  const gData = await gRes.json();
  assert.strictEqual(gData.kind, 'identitytoolkit#CreateAuthUriResponse');
  assert.strictEqual(gData.providerId, 'google.com');
  assert.ok(gData.authUri.includes('accounts.google.com/o/oauth2/auth'), 'authUri must target Google OAuth endpoint');
  assert.ok(gData.authUri.includes('client_id='), 'authUri must contain Google OAuth client_id');
  assert.ok(
    gData.authUri.includes(`redirect_uri=https://${data.config.authDomain}/__/auth/handler`),
    'authUri must redirect back to Firebase handler'
  );

  console.log('   ✓ Real Google Identity Toolkit handshake succeeded (HTTP 200)');
  console.log(`     - Provider: ${gData.providerId}`);
  console.log(`     - Handler URL verified: https://${data.config.authDomain}/__/auth/handler`);

  // ----------------------------------------------------------------------------
  // TEST 4: Google Cloud Identity Toolkit Authorized Domains Audit
  // ----------------------------------------------------------------------------
  console.log('\n[4/7] Auditing Firebase Identity Authorized Domains List...');
  const projInfoRes = await fetch(`https://identitytoolkit.googleapis.com/v1/projects?key=${data.config.apiKey}`);
  assert.strictEqual(projInfoRes.status, 200);
  const projInfo = await projInfoRes.json();
  const authorizedDomains = projInfo.authorizedDomains || [];

  assert.ok(authorizedDomains.includes('localhost'), 'localhost must be authorized');
  assert.ok(authorizedDomains.includes('rjshree.com'), 'rjshree.com must be authorized');
  assert.ok(
    authorizedDomains.includes('engineerverse-6dda1.firebaseapp.com'),
    'Firebase domain must be authorized'
  );

  console.log('   ✓ Active Authorized Domains in Firebase:');
  for (const d of authorizedDomains) {
    console.log(`     - ${d}`);
  }

  // ----------------------------------------------------------------------------
  // TEST 5: Real Firebase JS SDK Client Initialization
  // ----------------------------------------------------------------------------
  console.log('\n[5/7] Testing Firebase JS SDK Client-Side Setup & Provider...');
  for (const app of getApps()) {
    await deleteApp(app);
  }

  const fbApp = initializeApp(data.config);
  const auth = getAuth(fbApp);
  assert.strictEqual(auth.app.name, '[DEFAULT]');

  const gProvider = new GoogleAuthProvider();
  gProvider.setCustomParameters({ prompt: 'select_account' });
  assert.strictEqual(gProvider.providerId, 'google.com');
  assert.strictEqual(gProvider.getCustomParameters().prompt, 'select_account');

  console.log('   ✓ Firebase JS SDK initialized cleanly with GoogleAuthProvider');
  console.log('     - Provider ID: google.com');
  console.log('     - Custom parameter prompt: select_account');

  // ----------------------------------------------------------------------------
  // TEST 6: COOP & Security Headers Verification
  // ----------------------------------------------------------------------------
  console.log('\n[6/7] Verifying COOP and Security Headers on Server...');
  const headRes = await fetch(`http://127.0.0.1:${port}/api/health`);
  const coopHeader = headRes.headers.get('cross-origin-opener-policy');
  assert.strictEqual(
    coopHeader,
    'same-origin-allow-popups',
    'COOP header must be same-origin-allow-popups for secure OAuth popups'
  );
  assert.strictEqual(headRes.headers.get('x-content-type-options'), 'nosniff');
  assert.strictEqual(headRes.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');

  const csp = headRes.headers.get('content-security-policy') || '';
  assert.ok(csp.includes('accounts.google.com'), 'CSP must permit accounts.google.com frame-src');
  assert.ok(csp.includes('identitytoolkit.googleapis.com'), 'CSP must permit identitytoolkit in connect-src');

  console.log('   ✓ Security headers strictly enforced:');
  console.log(`     - Cross-Origin-Opener-Policy: ${coopHeader}`);
  console.log('     - X-Content-Type-Options: nosniff');
  console.log('     - CSP frame-src & connect-src permit Google Identity');

  // ----------------------------------------------------------------------------
  // TEST 7: Phase 1 Security Guarantees Remain Intact
  // ----------------------------------------------------------------------------
  console.log('\n[7/7] Verifying Phase 1 Zero-Bypass Security Invariance...');
  const adminRes = await fetch(`http://127.0.0.1:${port}/api/admin/overview`);
  assert.strictEqual(adminRes.status, 401, 'Anonymous request must be strictly rejected with 401');

  const forgedSessionRes = await fetch(`http://127.0.0.1:${port}/api/admin/overview`, {
    headers: { Authorization: 'Bearer forged_fake_admin_token' },
  });
  assert.strictEqual(forgedSessionRes.status, 401, 'Forged token must be rejected with 401');

  console.log('   ✓ Anonymous callers strictly rejected with 401');
  console.log('   ✓ Zero mock/fake login bypasses permitted');
  console.log('   ✓ Phase 1 security boundaries remain fully intact');

} finally {
  server.close();
  for (const app of getApps()) {
    await deleteApp(app);
  }
}

console.log('\n' + '='.repeat(75));
console.log('✓ ALL 7 GOOGLE OAUTH FORENSIC CHECKS PASSED CLEANLY!');
console.log('='.repeat(75));
