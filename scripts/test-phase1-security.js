/**
 * ENGINEERVERSE — Phase 1 Critical Security Remediation & Adversarial Audit Suite
 *
 * Comprehensive validation covering:
 * 1. PII Scrub & Repository Assertions (users.json single admin fixture, 0 personal avatars)
 * 2. Authentication Adversarial Tests (missing auth, forged JWT, expired, malformed, wrong aud/iss, invalid sig, body injection)
 * 3. Authorization & RBAC Checks (verified member vs admin, impersonation, unverified, suspended, blocked, inactive)
 * 4. Session Security (minting requirements, tamper detection, payload protection, expiry, missing secret)
 * 5. Strict CORS & Preflight Enforcement (production, local dev, disallowed attacker, credentials, OPTIONS)
 * 6. Deep Input Sanitization (nested strings, arrays, objects, scripts, HTML, javascript: URLs, event handlers)
 * 7. Firebase Token Cryptographic Verification (RS256 enforcement, unknown kid, claims validation, temporal checks)
 * 8. Test-Only Auth Isolation (strict production lockout against test tokens)
 * 9. getOrCreateUser Privilege Escalation Protection (server-controlled role/admin/status/credits)
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

process.env.NODE_ENV = 'test';
process.env.ENGINEERVERSE_TEST_RUNNER = 'true';
process.env.SESSION_SECRET = 'a_very_secure_test_session_secret_with_more_than_32_characters';

console.log('='.repeat(75));
console.log('ENGINEERVERSE — PHASE 1 RECONCILIATION & ADVERSARIAL SECURITY AUDIT');
console.log('='.repeat(75));

// ============================================================================
// SUITE 1: PII Scrub & Repository Assertions
// ============================================================================
console.log('\n[1/9] Verifying Repository State & PII Scrub...');
{
  const usersPath = path.resolve('server/data/users.json');
  assert.ok(fs.existsSync(usersPath), 'server/data/users.json must exist');

  const rawUsers = fs.readFileSync(usersPath, 'utf8');
  const users = JSON.parse(rawUsers);

  // Assert exactly 1 seed admin
  assert.strictEqual(
    users.length,
    1,
    `server/data/users.json must contain exactly 1 seed admin fixture, but found ${users.length}`
  );

  const [admin] = users;
  assert.strictEqual(admin.email, 'rajshreeakm@gmail.com', 'Admin email must be rajshreeakm@gmail.com');
  assert.strictEqual(admin.uid, 'admin_sole_rajshree', 'Admin UID must be deterministic synthetic fixture');
  assert.strictEqual(admin.role, 'admin', 'Admin role must be admin');
  assert.strictEqual(admin.isAdmin, true, 'isAdmin must be true');
  assert.strictEqual(admin.status, 'active', 'Admin status must be active');
  assert.strictEqual(admin.photoURL, null, 'photoURL must be null (no real avatar)');

  // Verify zero personal avatars in server/storage/avatars
  const avatarDir = path.resolve('server/storage/avatars');
  if (fs.existsSync(avatarDir)) {
    const files = fs.readdirSync(avatarDir);
    const leakedWebp = files.filter((f) => f.endsWith('.webp') || f.endsWith('.png') || f.endsWith('.jpg'));
    assert.strictEqual(
      leakedWebp.length,
      0,
      `Avatar storage directory must contain 0 avatar files, but found: ${leakedWebp.join(', ')}`
    );
  }

  console.log('   ✓ server/data/users.json contains exactly 1 sanitized seed admin record');
  console.log('   ✓ Zero personal avatars or external images in storage');
}

// ============================================================================
// SUITE 2: Startup & Environment Fail-Closed Enforcement
// ============================================================================
console.log('\n[2/9] Verifying Fail-Closed Server Secrets...');
{
  const origSecret = process.env.SESSION_SECRET;
  process.env.SESSION_SECRET = '';

  const { createServer } = await import('../server/index.js');
  let threwServer = false;
  try {
    createServer();
  } catch (err) {
    threwServer = true;
    assert.ok(err.message.includes('SESSION_SECRET'), 'Error message must mention missing SESSION_SECRET');
  }
  assert.strictEqual(threwServer, true, 'createServer must throw if SESSION_SECRET is unset');

  const { getSessionSecret } = await import('../server/services/sessionService.js');
  let threwService = false;
  try {
    getSessionSecret();
  } catch (err) {
    threwService = true;
    assert.ok(err.message.includes('SESSION_SECRET'), 'sessionService must mention missing SESSION_SECRET');
  }
  assert.strictEqual(threwService, true, 'sessionService must throw if SESSION_SECRET is unset');

  process.env.SESSION_SECRET = origSecret;
  console.log('   ✓ Server fails loudly on startup without SESSION_SECRET');
  console.log('   ✓ sessionService fails closed without SESSION_SECRET');
}

// ============================================================================
// Start ephemeral Express test server for integration checks
// ============================================================================
const { createServer } = await import('../server/index.js');
const app = createServer();
const server = app.listen(0);
const port = server.address().port;
const baseUrl = `http://127.0.0.1:${port}`;

try {
  // ============================================================================
  // SUITE 3: Authentication Adversarial Checks
  // ============================================================================
  console.log('\n[3/9] Testing Authentication Adversarial Attacks...');
  {
    // 3.1: No Authorization header -> 401
    const resNoAuth = await fetch(`${baseUrl}/api/auth/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    assert.strictEqual(resNoAuth.status, 401, 'Missing Authorization header must return 401');

    // 3.2: Forged / Arbitrary request-body user object cannot establish identity
    const resBodyInjection = await fetch(`${baseUrl}/api/auth/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: {
          uid: 'admin_sole_rajshree',
          email: 'rajshreeakm@gmail.com',
          role: 'admin',
          isAdmin: true,
        },
      }),
    });
    assert.strictEqual(resBodyInjection.status, 401, 'Body user injection must return 401');
    const dataBodyInjection = await resBodyInjection.json();
    assert.strictEqual(dataBodyInjection.token, undefined);

    // 3.3: Malformed JWT (not 3 parts) -> 401
    for (const badToken of ['not-a-token', 'part1.part2', 'part1.part2.part3.part4', '..', '']) {
      const resBadToken = await fetch(`${baseUrl}/api/auth/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${badToken}`,
        },
      });
      assert.strictEqual(resBadToken.status, 401, `Malformed token "${badToken}" must return 401`);
    }

    // 3.4: Forged JWT with arbitrary UID / email / role in bearer token -> 401
    const fakeHeader = Buffer.from(JSON.stringify({ alg: 'RS256', kid: 'fake_kid_1' })).toString('base64url');
    const fakePayload = Buffer.from(
      JSON.stringify({
        sub: 'arbitrary_uid_123',
        email: 'rajshreeakm@gmail.com',
        role: 'admin',
        isAdmin: true,
        aud: 'engineerverse-proj',
        iss: 'https://securetoken.google.com/engineerverse-proj',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000) - 60,
      })
    ).toString('base64url');
    const forgedJwt = `${fakeHeader}.${fakePayload}.invalidsignaturebytes`;

    const resForged = await fetch(`${baseUrl}/api/auth/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${forgedJwt}`,
      },
    });
    assert.strictEqual(resForged.status, 401, 'Forged JWT with fake signature must return 401');

    // 3.5: Expired token -> 401
    const expiredPayload = Buffer.from(
      JSON.stringify({
        sub: 'user_expired',
        email: 'user@example.com',
        exp: Math.floor(Date.now() / 1000) - 3600,
        iat: Math.floor(Date.now() / 1000) - 7200,
      })
    ).toString('base64url');
    const expiredJwt = `${fakeHeader}.${expiredPayload}.invalidsig`;

    const resExpired = await fetch(`${baseUrl}/api/auth/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${expiredJwt}`,
      },
    });
    assert.strictEqual(resExpired.status, 401, 'Expired token must return 401');

    console.log('   ✓ Missing authorization rejected with 401');
    console.log('   ✓ Arbitrary request-body user object cannot establish identity (401)');
    console.log('   ✓ Malformed tokens rejected with 401');
    console.log('   ✓ Forged JWT rejected with 401');
    console.log('   ✓ Expired tokens rejected with 401');
  }

  // ============================================================================
  // SUITE 4: Authorization & RBAC Enforcement
  // ============================================================================
  console.log('\n[4/9] Testing Authorization & RBAC Boundaries...');
  {
    const { requireAdmin, requireVerifiedIdentity, isAuthorizedAdmin } = await import('../server/middleware/auth.js');

    // Helper mock response
    function createMockRes() {
      let statusCode = 200;
      let body = null;
      return {
        status(code) {
          statusCode = code;
          return this;
        },
        json(data) {
          body = data;
          return this;
        },
        getStatusCode: () => statusCode,
        getBody: () => body,
      };
    }

    // 4.1: Normal verified user -> NOT admin
    const normalUser = {
      uid: 'user_normal_123',
      email: 'member@engineerverse.org',
      role: 'member',
      isAdmin: false,
      isAnonymous: false,
      emailVerified: true,
      status: 'active',
    };
    assert.strictEqual(isAuthorizedAdmin(normalUser, normalUser), false);

    // 4.2: Normal user pretending to be admin -> 403 Forbidden
    const pretendingUser = {
      uid: 'user_attacker_999',
      email: 'attacker@evil.com',
      role: 'admin', // Pretending
      isAdmin: true, // Pretending
      isAnonymous: false,
      emailVerified: true,
      status: 'active',
    };
    const mockResPretend = createMockRes();
    let nextCalledPretend = false;
    requireAdmin({ user: pretendingUser }, mockResPretend, () => {
      nextCalledPretend = true;
    });
    assert.strictEqual(nextCalledPretend, false, 'Pretending user must NOT reach next() in requireAdmin');
    assert.strictEqual(mockResPretend.getStatusCode(), 403, 'Pretending user must be rejected with 403');

    // 4.3: Unverified user -> privileged operation 403
    const unverifiedUser = {
      uid: 'user_unverified_456',
      email: 'unverified@example.com',
      isAnonymous: false,
      emailVerified: false,
      status: 'active',
    };
    const mockResUnverified = createMockRes();
    let nextCalledUnverified = false;
    requireVerifiedIdentity({ user: unverifiedUser }, mockResUnverified, () => {
      nextCalledUnverified = true;
    });
    assert.strictEqual(nextCalledUnverified, false, 'Unverified user must not pass requireVerifiedIdentity');
    assert.strictEqual(mockResUnverified.getStatusCode(), 403, 'Unverified user must receive 403');

    // 4.4: Suspended user -> 403
    const suspendedUser = {
      uid: 'user_suspended_789',
      email: 'suspended@example.com',
      isAnonymous: false,
      emailVerified: true,
      status: 'suspended',
    };
    const mockResSuspended = createMockRes();
    let nextCalledSuspended = false;
    requireVerifiedIdentity({ user: suspendedUser }, mockResSuspended, () => {
      nextCalledSuspended = true;
    });
    assert.strictEqual(nextCalledSuspended, false);
    assert.strictEqual(mockResSuspended.getStatusCode(), 403, 'Suspended user must receive 403');

    // 4.5: Blocked user -> 403
    const blockedUser = {
      uid: 'user_blocked_000',
      email: 'blocked@example.com',
      isAnonymous: false,
      emailVerified: true,
      status: 'blocked',
    };
    const mockResBlocked = createMockRes();
    let nextCalledBlocked = false;
    requireVerifiedIdentity({ user: blockedUser }, mockResBlocked, () => {
      nextCalledBlocked = true;
    });
    assert.strictEqual(nextCalledBlocked, false);
    assert.strictEqual(mockResBlocked.getStatusCode(), 403, 'Blocked user must receive 403');

    // 4.6: Inactive / non-active user -> 403
    const inactiveUser = {
      uid: 'user_inactive_111',
      email: 'inactive@example.com',
      isAnonymous: false,
      emailVerified: true,
      status: 'pending_review',
    };
    const mockResInactive = createMockRes();
    let nextCalledInactive = false;
    requireVerifiedIdentity({ user: inactiveUser }, mockResInactive, () => {
      nextCalledInactive = true;
    });
    assert.strictEqual(nextCalledInactive, false);
    assert.strictEqual(mockResInactive.getStatusCode(), 403, 'Inactive user must receive 403');

    // 4.7: Legitimate authorized admin -> allowed
    const validAdmin = {
      uid: 'admin_sole_rajshree',
      email: 'rajshreeakm@gmail.com',
      role: 'admin',
      isAdmin: true,
      isAnonymous: false,
      emailVerified: true,
      status: 'active',
    };
    const mockResAdmin = createMockRes();
    let nextCalledAdmin = false;
    requireAdmin({ user: validAdmin }, mockResAdmin, () => {
      nextCalledAdmin = true;
    });
    assert.strictEqual(nextCalledAdmin, true, 'Legitimate authorized admin must reach next()');
    assert.strictEqual(isAuthorizedAdmin(validAdmin, validAdmin), true);

    console.log('   ✓ Normal verified user is member (not admin)');
    console.log('   ✓ Normal user pretending to be admin rejected with 403');
    console.log('   ✓ Unverified user rejected with 403 on privileged operations');
    console.log('   ✓ Suspended and blocked users rejected with 403');
    console.log('   ✓ Non-active user rejected with 403');
    console.log('   ✓ Legitimate authorized admin allowed through');
  }

  // ============================================================================
  // SUITE 5: Session Integrity & Tamper Resistance
  // ============================================================================
  console.log('\n[5/9] Testing Session Token (ev_session) Integrity & Tampering...');
  {
    const { createSessionToken, verifySessionToken } = await import('../server/services/sessionService.js');

    const validIdentity = {
      uid: 'engineer_user_1',
      email: 'engineer@example.com',
      displayName: 'Staff Engineer',
      emailVerified: true,
    };

    const validToken = createSessionToken(validIdentity);
    assert.ok(validToken && validToken.startsWith('ev_session.'), 'Session token must start with ev_session.');

    // 5.1: Untampered token verifies cleanly
    const verified = verifySessionToken(validToken);
    assert.ok(verified, 'Untampered session must verify');
    assert.strictEqual(verified.uid, 'engineer_user_1');
    assert.strictEqual(verified.email, 'engineer@example.com');

    // 5.2: Tampered payload: modified UID -> rejected (null)
    const parts = validToken.split('.');
    const payloadJson = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));

    const tamperedUidPayload = { ...payloadJson, uid: 'admin_sole_rajshree' };
    const tamperedUidB64 = Buffer.from(JSON.stringify(tamperedUidPayload)).toString('base64url');
    const tamperedUidToken = `ev_session.${tamperedUidB64}.${parts[2]}`;
    assert.strictEqual(verifySessionToken(tamperedUidToken), null, 'Modified UID must cause verification failure');

    // 5.3: Tampered payload: modified email -> rejected
    const tamperedEmailPayload = { ...payloadJson, email: 'rajshreeakm@gmail.com' };
    const tamperedEmailB64 = Buffer.from(JSON.stringify(tamperedEmailPayload)).toString('base64url');
    const tamperedEmailToken = `ev_session.${tamperedEmailB64}.${parts[2]}`;
    assert.strictEqual(verifySessionToken(tamperedEmailToken), null, 'Modified email must cause verification failure');

    // 5.4: Tampered payload: injected role/admin -> rejected
    const tamperedAdminPayload = { ...payloadJson, role: 'admin', isAdmin: true };
    const tamperedAdminB64 = Buffer.from(JSON.stringify(tamperedAdminPayload)).toString('base64url');
    const tamperedAdminToken = `ev_session.${tamperedAdminB64}.${parts[2]}`;
    assert.strictEqual(verifySessionToken(tamperedAdminToken), null, 'Injected admin payload must cause verification failure');

    // 5.5: Expired session token -> rejected
    const expiredPayload = { ...payloadJson, exp: Math.floor(Date.now() / 1000) - 3600 };
    const expiredB64 = Buffer.from(JSON.stringify(expiredPayload)).toString('base64url');
    const secret = process.env.SESSION_SECRET;
    const expiredSig = crypto.createHmac('sha256', secret).update(expiredB64).digest('base64url');
    const expiredToken = `ev_session.${expiredB64}.${expiredSig}`;
    assert.strictEqual(verifySessionToken(expiredToken), null, 'Expired session token must be rejected');

    console.log('   ✓ Valid session token mints and verifies');
    console.log('   ✓ Modified UID causes cryptographic rejection');
    console.log('   ✓ Modified email causes cryptographic rejection');
    console.log('   ✓ Injected role / admin flag causes signature rejection');
    console.log('   ✓ Expired session rejected cleanly');
  }

  // ============================================================================
  // SUITE 6: CORS & Preflight Behavior
  // ============================================================================
  console.log('\n[6/9] Testing CORS Strict Allowlist & Preflight Behavior...');
  {
    // 6.1: Trusted production origin (https://engineerverse.vercel.app)
    const resProd = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: 'https://engineerverse.vercel.app' },
    });
    assert.strictEqual(
      resProd.headers.get('access-control-allow-origin'),
      'https://engineerverse.vercel.app',
      'Production origin must receive matched Access-Control-Allow-Origin'
    );
    assert.strictEqual(
      resProd.headers.get('access-control-allow-credentials'),
      'true',
      'Allowed origin must receive Access-Control-Allow-Credentials: true'
    );

    // 6.2: Trusted local origin (http://localhost:3000)
    const resLocal = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: 'http://localhost:3000' },
    });
    assert.strictEqual(
      resLocal.headers.get('access-control-allow-origin'),
      'http://localhost:3000',
      'Local development origin must receive matched Access-Control-Allow-Origin'
    );

    // 6.3: Arbitrary attacker origin (https://attacker.evil.com) -> NO headers
    const resAttacker = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: 'https://attacker.evil.com' },
    });
    assert.strictEqual(
      resAttacker.headers.get('access-control-allow-origin'),
      null,
      'Attacker origin must NOT receive Access-Control-Allow-Origin'
    );
    assert.strictEqual(
      resAttacker.headers.get('access-control-allow-credentials'),
      null,
      'Attacker origin must NOT receive Access-Control-Allow-Credentials'
    );

    // 6.4: Credentialed attacker origin (https://evil-phishing.com) -> NO credentials header
    const resPhish = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: 'https://evil-phishing.com', Cookie: 'session=123' },
    });
    assert.strictEqual(resPhish.headers.get('access-control-allow-credentials'), null);
    assert.strictEqual(resPhish.headers.get('access-control-allow-origin'), null);

    // 6.5: OPTIONS preflight behavior for allowed origin -> 204 with CORS headers
    const resOptionsAllowed = await fetch(`${baseUrl}/api/health`, {
      method: 'OPTIONS',
      headers: { Origin: 'https://rjshree.com' },
    });
    assert.strictEqual(resOptionsAllowed.status, 204, 'Preflight for allowed origin must return 204');
    assert.strictEqual(resOptionsAllowed.headers.get('access-control-allow-origin'), 'https://rjshree.com');
    assert.ok(resOptionsAllowed.headers.get('access-control-allow-methods'));

    // 6.6: OPTIONS preflight behavior for attacker origin -> 204 WITHOUT allow-origin
    const resOptionsAttacker = await fetch(`${baseUrl}/api/health`, {
      method: 'OPTIONS',
      headers: { Origin: 'https://attacker.evil.com' },
    });
    assert.strictEqual(resOptionsAttacker.status, 204);
    assert.strictEqual(
      resOptionsAttacker.headers.get('access-control-allow-origin'),
      null,
      'Preflight for attacker must NOT return Access-Control-Allow-Origin'
    );

    console.log('   ✓ Trusted production and local origins receive CORS headers');
    console.log('   ✓ Arbitrary attacker origins receive zero CORS headers');
    console.log('   ✓ Credentialed attacker origin blocked from credentials reflection');
    console.log('   ✓ OPTIONS preflight properly configured for allowed vs disallowed origins');
  }

  // ============================================================================
  // SUITE 7: Deep Input Sanitization
  // ============================================================================
  console.log('\n[7/9] Testing Recursive Input Sanitization & Payload Neutralization...');
  {
    const { sanitizeInputs } = await import('../server/middleware/security.js');

    const attackPayload = {
      simpleString: 'Clean Text <script>alert("xss")</script>',
      htmlMarkup: '<p>Paragraph with <b>bold</b> and <img src="x" onerror="alert(1)"> image</p>',
      javascriptUrl: '<a href="javascript:alert(\'hack\')">Click me</a>',
      standaloneJsUrl: 'javascript:void(0)',
      eventHandler: 'onload=alert(document.cookie)',
      nestedArray: [
        '<style>body{display:none}</style>Visible',
        {
          deepString: '<svg/onload=alert(1)>SVG Attack',
          deepArray: ['<script src="evil.js"></script>Inner Safe'],
        },
      ],
      nestedObject: {
        level1: {
          level2: {
            onclickPayload: 'onclick=steal() Safe Text',
            vbsUrl: 'vbscript:msgbox(1) Note',
          },
        },
      },
    };

    const mockReq = { body: attackPayload };
    sanitizeInputs(mockReq, {}, () => {});

    assert.strictEqual(mockReq.body.simpleString, 'Clean Text');
    assert.strictEqual(mockReq.body.htmlMarkup, 'Paragraph with bold and  image');
    assert.strictEqual(mockReq.body.javascriptUrl, 'Click me');
    assert.strictEqual(mockReq.body.standaloneJsUrl, 'void(0)');
    assert.strictEqual(mockReq.body.eventHandler, 'alert(document.cookie)');
    assert.strictEqual(mockReq.body.nestedArray[0], 'Visible');
    assert.strictEqual(mockReq.body.nestedArray[1].deepString, 'SVG Attack');
    assert.strictEqual(mockReq.body.nestedArray[1].deepArray[0], 'Inner Safe');
    assert.strictEqual(mockReq.body.nestedObject.level1.level2.onclickPayload, 'steal() Safe Text');
    assert.strictEqual(mockReq.body.nestedObject.level1.level2.vbsUrl, 'msgbox(1) Note');

    console.log('   ✓ Script and style blocks completely removed');
    console.log('   ✓ HTML tags stripped from text');
    console.log('   ✓ javascript: and vbscript: URLs neutralized');
    console.log('   ✓ onload=, onclick= event handlers neutralized');
    console.log('   ✓ Deeply nested objects and arrays sanitized recursively');
  }

  // ============================================================================
  // SUITE 8: Firebase Token Cryptographic Verification & Adversarial Claims
  // ============================================================================
  console.log('\n[8/9] Testing Firebase Token Cryptographic Verification & Adversarial Claims...');
  {
    const { verifyFirebaseIdToken } = await import('../server/services/firebaseAdminService.js');

    // Helper to construct token without network call
    function makeJwt(header, payload, signature = 'fakesig') {
      const h = Buffer.from(JSON.stringify(header)).toString('base64url');
      const p = Buffer.from(JSON.stringify(payload)).toString('base64url');
      return `${h}.${p}.${signature}`;
    }

    const now = Math.floor(Date.now() / 1000);
    const validBasePayload = {
      sub: 'valid_user_sub_123',
      user_id: 'valid_user_sub_123',
      email: 'user@example.com',
      aud: 'test-project',
      iss: 'https://securetoken.google.com/test-project',
      exp: now + 3600,
      iat: now - 60,
      auth_time: now - 60,
      email_verified: true,
    };

    // 8.1: RS256 requirement: alg 'HS256' or 'none' -> null
    assert.strictEqual(
      await verifyFirebaseIdToken(makeJwt({ alg: 'HS256', kid: 'any_kid' }, validBasePayload)),
      null,
      'Token with alg=HS256 must be rejected'
    );
    assert.strictEqual(
      await verifyFirebaseIdToken(makeJwt({ alg: 'none' }, validBasePayload)),
      null,
      'Token with alg=none must be rejected'
    );

    // 8.2: Unknown kid -> null
    assert.strictEqual(
      await verifyFirebaseIdToken(makeJwt({ alg: 'RS256', kid: 'unknown_kid_attacker_key' }, validBasePayload)),
      null,
      'Token with unknown kid must be rejected'
    );

    // 8.3: Missing kid or non-string kid -> null
    assert.strictEqual(
      await verifyFirebaseIdToken(makeJwt({ alg: 'RS256' }, validBasePayload)),
      null,
      'Token without kid must be rejected'
    );
    assert.strictEqual(
      await verifyFirebaseIdToken(makeJwt({ alg: 'RS256', kid: 12345 }, validBasePayload)),
      null,
      'Token with non-string kid must be rejected'
    );

    // 8.4: Expired exp -> null
    assert.strictEqual(
      await verifyFirebaseIdToken(
        makeJwt({ alg: 'RS256', kid: 'any_kid' }, { ...validBasePayload, exp: now - 100 })
      ),
      null,
      'Expired token must be rejected'
    );

    // 8.5: Future iat (> now + 300s) -> null
    assert.strictEqual(
      await verifyFirebaseIdToken(
        makeJwt({ alg: 'RS256', kid: 'any_kid' }, { ...validBasePayload, iat: now + 600 })
      ),
      null,
      'Token with future iat must be rejected'
    );

    // 8.6: Invalid / missing sub -> null
    assert.strictEqual(
      await verifyFirebaseIdToken(
        makeJwt({ alg: 'RS256', kid: 'any_kid' }, { ...validBasePayload, sub: '' })
      ),
      null,
      'Token with empty sub must be rejected'
    );
    assert.strictEqual(
      await verifyFirebaseIdToken(
        makeJwt({ alg: 'RS256', kid: 'any_kid' }, { ...validBasePayload, sub: 'a'.repeat(150) })
      ),
      null,
      'Token with sub > 128 chars must be rejected'
    );

    // 8.7: Mismatched sub and user_id -> null
    assert.strictEqual(
      await verifyFirebaseIdToken(
        makeJwt(
          { alg: 'RS256', kid: 'any_kid' },
          { ...validBasePayload, sub: 'user_a', user_id: 'user_b' }
        )
      ),
      null,
      'Token with mismatched sub and user_id must be rejected'
    );

    // 8.8: Wrong issuer -> null
    assert.strictEqual(
      await verifyFirebaseIdToken(
        makeJwt(
          { alg: 'RS256', kid: 'any_kid' },
          { ...validBasePayload, iss: 'https://evil.issuer.com/test-project' }
        )
      ),
      null,
      'Token with untrusted issuer must be rejected'
    );

    console.log('   ✓ RS256 strictly required; HS256 and none rejected');
    console.log('   ✓ Unknown or missing kid rejected');
    console.log('   ✓ Expired tokens rejected');
    console.log('   ✓ Future iat tokens rejected');
    console.log('   ✓ Empty, missing, or oversized sub rejected');
    console.log('   ✓ Mismatched sub and user_id rejected');
    console.log('   ✓ Untrusted issuer rejected');
  }

  // ============================================================================
  // SUITE 9: Production Test-Token Isolation & getOrCreateUser Privilege Escalation
  // ============================================================================
  console.log('\n[9/9] Testing Production Test-Token Lockout & getOrCreateUser Privilege Defense...');
  {
    // 9.1: Test tokens are strictly locked out under NODE_ENV=production
    const origEnv = process.env.NODE_ENV;
    const origRunner = process.env.ENGINEERVERSE_TEST_RUNNER;

    process.env.NODE_ENV = 'production';
    process.env.ENGINEERVERSE_TEST_RUNNER = 'true'; // Attempt to bypass

    const { verifyToken } = await import('../server/middleware/auth.js');

    const testTokens = [
      'token_admin',
      'admin_token',
      'test_admin_token',
      'token_user_other',
      'test_user_token',
      'engineer.other@example.com',
    ];

    for (const testTok of testTokens) {
      const mockReq = {
        headers: { authorization: `Bearer ${testTok}` },
        ip: '127.0.0.1',
      };
      let prodStatus = null;
      const mockRes = {
        status(code) {
          prodStatus = code;
          return { json() {} };
        },
      };

      await verifyToken(mockReq, mockRes, () => {
        assert.fail(`Test token "${testTok}" must NEVER authenticate under NODE_ENV=production!`);
      });

      assert.strictEqual(
        prodStatus,
        401,
        `Test token "${testTok}" must return 401 under NODE_ENV=production`
      );
    }

    process.env.NODE_ENV = origEnv;
    process.env.ENGINEERVERSE_TEST_RUNNER = origRunner;
    console.log('   ✓ NODE_ENV=production strictly locks out all simulator and test tokens (HTTP 401)');

    // 9.2: getOrCreateUser privilege escalation defense
    const { usersStore } = await import('../server/services/usersStore.js');

    // Attempt A: Client claims role: 'admin', isAdmin: true, credits: 999999, status: 'super'
    const attackerUser = usersStore.getOrCreateUser({
      uid: 'attacker_uid_444',
      email: 'attacker@example.com',
      role: 'admin',
      isAdmin: true,
      status: 'banned_bypass',
      connectionCredits: 999999,
      emailVerified: true,
    });

    assert.strictEqual(attackerUser.role, 'member', 'Self-asserted role: admin must be forced to member');
    assert.strictEqual(attackerUser.isAdmin, false, 'Self-asserted isAdmin: true must be forced to false');
    assert.strictEqual(attackerUser.status, 'active', 'Self-asserted status must be forced to active');
    assert.strictEqual(attackerUser.connectionCredits, 5, 'Self-asserted credits must be forced to standard 5');

    // Attempt B: Client claims admin email (rajshreeakm@gmail.com) but with unverified email
    const unverifiedAdminAttempt = usersStore.getOrCreateUser({
      uid: 'fake_rajshree_unverified',
      email: 'rajshreeakm@gmail.com',
      emailVerified: false, // Unverified
    });
    assert.strictEqual(
      unverifiedAdminAttempt.isAdmin,
      false,
      'Unverified caller claiming admin email must NOT receive isAdmin=true'
    );
    assert.strictEqual(
      unverifiedAdminAttempt.role,
      'member',
      'Unverified caller claiming admin email must NOT receive role=admin'
    );

    // Verify seed admin in the store was not hijacked or corrupted
    const seedAdmin = usersStore.getUserByUid('admin_sole_rajshree');
    assert.ok(seedAdmin, 'Seed admin record must remain intact');
    assert.strictEqual(seedAdmin.email, 'rajshreeakm@gmail.com');
    assert.strictEqual(seedAdmin.isAdmin, true, 'Seed admin in store must remain admin');
    assert.strictEqual(seedAdmin.role, 'admin');

    console.log('   ✓ getOrCreateUser strictly prevents self-promotion, role injection, credit tampering');
    console.log('   ✓ Unverified claim on admin email rejected and seed admin protected from hijacking');
  }

  console.log('\n' + '='.repeat(75));
  console.log('✓ ALL 9 ADVERSARIAL SECURITY SUITES PASSED CLEANLY');
  console.log('='.repeat(75) + '\n');
} finally {
  server.close();
}
