/**
 * ENGINEERVERSE — Phase 1 Security Remediation Automated Verification
 * Validates:
 * Fix 1: POST /api/auth/session auth bypass closed (requires valid Firebase ID token)
 * Fix 2: SESSION_SECRET enforced without fallback; server throws if missing
 * Fix 3: CORS allowlist enforced; unauthorized origins get no CORS headers
 * Fix 4: Content-Security-Policy header present
 * Fix 5: Recursive input sanitization strips tags from nested request bodies
 * Fix 6: requireVerifiedIdentity middleware blocks unverified identities with 403
 * Fix 7: users.json scrubbed to clean seed state
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';

process.env.NODE_ENV = 'test';
process.env.ENGINEERVERSE_TEST_RUNNER = 'true';
process.env.SESSION_SECRET = 'a_very_secure_test_session_secret_with_more_than_32_characters';

console.log('='.repeat(70));
console.log('ENGINEERVERSE — PHASE 1 CRITICAL SECURITY REMEDIATION VERIFICATION');
console.log('='.repeat(70));

// 1. Verify Fix 2: Server fails loudly without SESSION_SECRET
console.log('\n1. Testing Fix 2: SESSION_SECRET Startup Enforcement...');
{
  const origSecret = process.env.SESSION_SECRET;
  process.env.SESSION_SECRET = '';

  const { createServer } = await import('../server/index.js');
  let threw = false;
  try {
    createServer();
  } catch (err) {
    threw = true;
    assert.ok(
      err.message.includes('SESSION_SECRET'),
      'Error message must mention missing SESSION_SECRET'
    );
  }
  assert.strictEqual(threw, true, 'createServer must throw if SESSION_SECRET is unset');

  const { getSessionSecret } = await import('../server/services/sessionService.js');
  let sessionThrew = false;
  try {
    getSessionSecret();
  } catch (err) {
    sessionThrew = true;
    assert.ok(
      err.message.includes('SESSION_SECRET'),
      'sessionService must throw if SESSION_SECRET is unset'
    );
  }
  assert.strictEqual(sessionThrew, true, 'sessionService must fail loudly without SESSION_SECRET');

  process.env.SESSION_SECRET = origSecret;
  console.log('   ✓ Server refuses startup and sessionService refuses operation without SESSION_SECRET');
}

// 2. Start server for HTTP route testing
const { createServer } = await import('../server/index.js');
const app = createServer();
const server = app.listen(0);
const port = server.address().port;
const baseUrl = `http://127.0.0.1:${port}`;

try {
  // 3. Verify Fix 1: POST /api/auth/session rejects forged body without token
  console.log('\n2. Testing Fix 1: POST /api/auth/session Auth Bypass Closure...');
  {
    // Attempt 1: Raw body with admin email without Authorization header
    const resNoAuth = await fetch(`${baseUrl}/api/auth/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: { email: 'rajshreeakm@gmail.com', uid: 'admin_forged' } }),
    });
    assert.strictEqual(resNoAuth.status, 401, 'Unauthenticated session minting attempt must return 401');
    const dataNoAuth = await resNoAuth.json();
    assert.strictEqual(dataNoAuth.success, false);
    assert.strictEqual(dataNoAuth.token, undefined);

    // Attempt 2: Forged token in Authorization header
    const resForged = await fetch(`${baseUrl}/api/auth/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer forged.fake.jwt_token',
      },
      body: JSON.stringify({ user: { email: 'rajshreeakm@gmail.com', uid: 'admin_forged' } }),
    });
    assert.strictEqual(resForged.status, 401, 'Forged ID token must return 401');
    const dataForged = await resForged.json();
    assert.strictEqual(dataForged.success, false);
    console.log('   ✓ POST /api/auth/session rejects raw user body and requires cryptographically verified Firebase ID token');
  }

  // 4. Verify Fix 3: CORS allowlist
  console.log('\n3. Testing Fix 3: CORS Strict Allowlist...');
  {
    // Case A: Disallowed origin (e.g. attacker domain)
    const resEvil = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: 'https://attacker.evil.com' },
    });
    assert.strictEqual(
      resEvil.headers.get('access-control-allow-origin'),
      null,
      'Disallowed origin must NOT receive Access-Control-Allow-Origin header'
    );
    assert.strictEqual(
      resEvil.headers.get('access-control-allow-credentials'),
      null,
      'Disallowed origin must NOT receive Access-Control-Allow-Credentials header'
    );

    // Case B: Allowed production origin
    const resProd = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: 'https://engineerverse.vercel.app' },
    });
    assert.strictEqual(
      resProd.headers.get('access-control-allow-origin'),
      'https://engineerverse.vercel.app',
      'Allowed production origin must receive matched Access-Control-Allow-Origin header'
    );
    assert.strictEqual(
      resProd.headers.get('access-control-allow-credentials'),
      'true',
      'Allowed production origin must receive Access-Control-Allow-Credentials'
    );
    console.log('   ✓ CORS strict allowlist enforced: attacker origin rejected, canonical domain accepted');
  }

  // 5. Verify Fix 4: Content-Security-Policy header
  console.log('\n4. Testing Fix 4: Content-Security-Policy Header...');
  {
    const resCsp = await fetch(`${baseUrl}/api/health`);
    const csp = resCsp.headers.get('content-security-policy');
    assert.ok(csp, 'Content-Security-Policy header must be present');
    assert.ok(csp.includes("default-src 'self'"), 'CSP must specify default-src self');
    assert.ok(csp.includes("img-src 'self' https://res.cloudinary.com"), 'CSP must permit Cloudinary images');
    assert.ok(csp.includes("connect-src 'self'"), 'CSP must restrict connect-src');
    assert.ok(csp.includes("frame-ancestors 'self'"), 'CSP must enforce frame-ancestors self');
    console.log('   ✓ Content-Security-Policy header present and properly configured');
  }

  // 6. Verify Fix 5: Recursive input sanitization
  console.log('\n5. Testing Fix 5: Recursive Input Sanitization on Request Bodies...');
  {
    // Test deep sanitization via middleware
    const { sanitizeInputs } = await import('../server/middleware/security.js');
    const mockReq = {
      body: {
        title: 'Safe Title <script>alert("xss")</script>',
        description: 'Hello <b>Bold</b> world',
        nested: {
          comment: '<a href="javascript:void(0)">Click</a> Normal Text',
          tags: ['<script>evil()</script>', 'clean-tag'],
        },
      },
    };
    sanitizeInputs(mockReq, {}, () => {});

    assert.strictEqual(mockReq.body.title, 'Safe Title');
    assert.strictEqual(mockReq.body.description, 'Hello Bold world');
    assert.strictEqual(mockReq.body.nested.comment, 'Click Normal Text');
    assert.deepStrictEqual(mockReq.body.nested.tags, ['', 'clean-tag']);
    console.log('   ✓ Recursive sanitization strips all HTML tags across arbitrary nested objects and arrays');
  }

  // 7. Verify Fix 6: requireVerifiedIdentity middleware
  console.log('\n6. Testing Fix 6: requireVerifiedIdentity Middleware...');
  {
    const { requireVerifiedIdentity } = await import('../server/middleware/auth.js');
    assert.strictEqual(
      typeof requireVerifiedIdentity,
      'function',
      'requireVerifiedIdentity must be exported as a function'
    );

    // Case A: Anonymous / Unauthenticated
    let resCode = null;
    let resBody = null;
    const mockRes = {
      status(code) {
        resCode = code;
        return {
          json(b) {
            resBody = b;
          },
        };
      },
    };

    let nextCalled = false;
    requireVerifiedIdentity({ user: { isAnonymous: true } }, mockRes, () => {
      nextCalled = true;
    });
    assert.strictEqual(resCode, 401, 'Anonymous request must be rejected with 401');
    assert.strictEqual(nextCalled, false);

    // Case B: Authenticated but email NOT verified
    resCode = null;
    resBody = null;
    nextCalled = false;
    requireVerifiedIdentity(
      { user: { isAnonymous: false, emailVerified: false, email: 'unverified@example.com' } },
      mockRes,
      () => {
        nextCalled = true;
      }
    );
    assert.strictEqual(resCode, 403, 'Unverified user must be rejected with 403');
    assert.strictEqual(resBody.emailVerified, false);
    assert.strictEqual(nextCalled, false);

    // Case C: Authenticated AND email verified
    resCode = null;
    nextCalled = false;
    requireVerifiedIdentity(
      { user: { isAnonymous: false, emailVerified: true, email: 'verified@example.com' } },
      mockRes,
      () => {
        nextCalled = true;
      }
    );
    assert.strictEqual(nextCalled, true, 'Verified identity must pass through to next()');
    assert.strictEqual(resCode, null);
    console.log('   ✓ requireVerifiedIdentity blocks anonymous (401) and unverified (403), passes verified');
  }

  // 8. Verify Fix 7: users.json PII scrubbed
  console.log('\n7. Testing Fix 7: server/data/users.json PII Scrub...');
  {
    const usersPath = path.resolve('server/data/users.json');
    assert.ok(fs.existsSync(usersPath), 'users.json must exist');
    const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    assert.strictEqual(users.length, 1, 'users.json must only contain seed admin');
    assert.strictEqual(users[0].email, 'rajshreeakm@gmail.com');
    assert.strictEqual(users[0].uid, 'admin_sole_rajshree');

    // Confirm avatars storage directory has no leaked webp file
    const avatarDir = path.resolve('server/storage/avatars');
    if (fs.existsSync(avatarDir)) {
      const files = fs.readdirSync(avatarDir);
      const webpFiles = files.filter((f) => f.endsWith('.webp'));
      assert.strictEqual(webpFiles.length, 0, 'No personal avatar webp files should exist');
    }
    console.log('   ✓ server/data/users.json contains only seed admin record; no personal avatars in storage');
  }

  console.log('\n' + '='.repeat(70));
  console.log('✓ ALL 7 PHASE 1 CRITICAL SECURITY REMEDIATION CHECKS PASSED CLEANLY');
  console.log('='.repeat(70) + '\n');
} finally {
  server.close();
}
