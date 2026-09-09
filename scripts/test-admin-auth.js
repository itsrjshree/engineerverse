/**
 * ENGINEERVERSE — Admin Authentication & Authorization Verification Suite
 * Verifies strict server-side RBAC enforcement:
 * - Sole authorized admin: rajshreeakm@gmail.com
 * - 401 for unauthenticated or malformed/expired tokens
 * - 403 for authenticated non-admin accounts
 * - 200 for authenticated rajshreeakm@gmail.com
 */

import assert from 'node:assert';
import http from 'node:http';

// Ensure test runner mode is strictly asserted for automated tests
process.env.NODE_ENV = 'test';
process.env.ENGINEERVERSE_TEST_RUNNER = 'true';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test_session_secret_deterministic_32_bytes_long_min';

import { createServer } from '../server/index.js';
import {
  AUTHORIZED_ADMIN_EMAIL,
  verifyToken,
  requireAuth,
  requireAdmin,
} from '../server/middleware/auth.js';

console.log('='.repeat(70));
console.log('ENGINEERVERSE — ADMIN AUTHENTICATION & AUTHORIZATION AUDIT');
console.log(`Target Admin Email: ${AUTHORIZED_ADMIN_EMAIL}`);
console.log('='.repeat(70));

let passed = 0;

async function runAudit() {
  // -------------------------------------------------------------
  // Test 1: Sole Authorized Admin Email Constant
  // -------------------------------------------------------------
  console.log('\n1. Verifying Sole Admin Email Configuration...');
  assert.strictEqual(
    AUTHORIZED_ADMIN_EMAIL,
    'rajshreeakm@gmail.com',
    'Admin email must strictly be rajshreeakm@gmail.com'
  );
  console.log('   ✓ Sole authorized admin email matches rajshreeakm@gmail.com exactly');
  passed++;

  // -------------------------------------------------------------
  // Test 2: Unit Contract - verifyToken and requireAdmin Middleware
  // -------------------------------------------------------------
  console.log('\n2. Verifying Middleware Behavioral Contracts...');

  // 2a. Anonymous / No token
  {
    let nextCalled = false;
    const req = { headers: {}, ip: '127.0.0.1' };
    const res = {};
    await verifyToken(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.user.isAnonymous, true);

    // requireAdmin must reject anonymous with 401
    let statusCode = null;
    let jsonResponse = null;
    const adminRes = {
      status(c) { statusCode = c; return this; },
      json(j) { jsonResponse = j; return this; },
    };
    requireAdmin(req, adminRes, () => {
      assert.fail('requireAdmin must NOT allow anonymous caller');
    });
    assert.strictEqual(statusCode, 401, 'Anonymous caller must receive HTTP 401');
    assert.strictEqual(jsonResponse.success, false);
    console.log('   ✓ Case C verified: Unauthenticated request -> HTTP 401');
    passed++;
  }

  // 2b. Malformed / Invalid token
  {
    const req = { headers: { authorization: 'Bearer token_invalid' }, ip: '127.0.0.1' };
    let statusCode = null;
    let jsonResponse = null;
    const res = {
      status(c) { statusCode = c; return this; },
      json(j) { jsonResponse = j; return this; },
    };
    await verifyToken(req, res, () => {
      assert.fail('verifyToken must NOT call next() on invalid token');
    });
    assert.strictEqual(statusCode, 401, 'Invalid token must receive HTTP 401');
    assert.strictEqual(jsonResponse.success, false);
    console.log('   ✓ Case D verified: Invalid/malformed token -> HTTP 401');
    passed++;
  }

  // 2c. Authenticated Non-Admin User (someoneelse@example.com)
  {
    let nextCalled = false;
    const req = { headers: { authorization: 'Bearer token_user_other' }, ip: '127.0.0.1' };
    const res = {};
    await verifyToken(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.user.isAdmin, false);
    assert.notStrictEqual(req.user.email, AUTHORIZED_ADMIN_EMAIL);

    // requireAdmin must reject with 403
    let statusCode = null;
    let jsonResponse = null;
    const adminRes = {
      status(c) { statusCode = c; return this; },
      json(j) { jsonResponse = j; return this; },
    };
    requireAdmin(req, adminRes, () => {
      assert.fail('requireAdmin must NOT allow non-admin account');
    });
    assert.strictEqual(statusCode, 403, 'Non-admin user must receive HTTP 403 Forbidden');
    assert.strictEqual(jsonResponse.success, false);
    assert.ok(
      jsonResponse.error.toLowerCase().includes('unauthorized') ||
      jsonResponse.error.toLowerCase().includes('permission') ||
      jsonResponse.error.toLowerCase().includes('denied')
    );
    console.log('   ✓ Case B verified: Authenticated non-admin -> HTTP 403 Forbidden (sanitized error message)');
    passed++;
  }

  // 2d. Authenticated Admin (rajshreeakm@gmail.com)
  {
    let nextCalled = false;
    const req = { headers: { authorization: 'Bearer token_admin' }, ip: '127.0.0.1' };
    const res = {};
    await verifyToken(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.user.isAdmin, true);
    assert.strictEqual(req.user.email, AUTHORIZED_ADMIN_EMAIL);

    // requireAdmin must allow rajshreeakm@gmail.com through
    let adminPassed = false;
    const adminRes = {
      status() { return this; },
      json() { return this; },
    };
    requireAdmin(req, adminRes, () => {
      adminPassed = true;
    });
    assert.strictEqual(adminPassed, true, 'requireAdmin must allow rajshreeakm@gmail.com');
    console.log('   ✓ Case A verified: Authenticated rajshreeakm@gmail.com -> HTTP 200 Allowed');
    passed++;
  }

  // -------------------------------------------------------------
  // Test 3: End-to-End Route Protection Verification on Express Server
  // -------------------------------------------------------------
  console.log('\n3. Starting Ephemeral Express Server for End-to-End Endpoint Verification...');
  const app = createServer();
  const testServer = http.createServer(app);

  await new Promise((resolve) => testServer.listen(0, '127.0.0.1', resolve));
  const port = testServer.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`   Running temporary test server on port ${port}`);

  try {
    const endpointsToTest = [
      { path: '/api/admin/verify-session', method: 'GET' },
      { path: '/api/admin/overview', method: 'GET' },
      { path: '/api/admin/moderation/problem/123', method: 'POST', body: { action: 'approve' } },
      { path: '/api/pritee/diagnostics', method: 'GET' },
      { path: '/api/pritee/models/discover', method: 'POST' },
    ];

    for (const ep of endpointsToTest) {
      console.log(`\n   Testing Protection on Endpoint: ${ep.method} ${ep.path}`);

      // 3.1: Anonymous access -> 401
      const resAnon = await fetch(`${baseUrl}${ep.path}`, {
        method: ep.method,
        headers: ep.body ? { 'Content-Type': 'application/json' } : {},
        body: ep.body ? JSON.stringify(ep.body) : undefined,
      });
      assert.strictEqual(
        resAnon.status,
        401,
        `${ep.path} must reject anonymous caller with 401`
      );
      const anonData = await resAnon.json();
      assert.strictEqual(anonData.success, false);
      console.log(`     ✓ Anonymous caller rejected with 401`);

      // 3.2: Malformed / Invalid token -> 401
      const resInvalid = await fetch(`${baseUrl}${ep.path}`, {
        method: ep.method,
        headers: {
          Authorization: 'Bearer token_invalid',
          ...(ep.body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: ep.body ? JSON.stringify(ep.body) : undefined,
      });
      assert.strictEqual(
        resInvalid.status,
        401,
        `${ep.path} must reject invalid token with 401`
      );
      console.log(`     ✓ Invalid token rejected with 401`);

      // 3.3: Authenticated Non-Admin account -> 403
      const resNonAdmin = await fetch(`${baseUrl}${ep.path}`, {
        method: ep.method,
        headers: {
          Authorization: 'Bearer token_user_other',
          ...(ep.body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: ep.body ? JSON.stringify(ep.body) : undefined,
      });
      assert.strictEqual(
        resNonAdmin.status,
        403,
        `${ep.path} must reject non-admin user with 403`
      );
      const nonAdminData = await resNonAdmin.json();
      assert.strictEqual(nonAdminData.success, false);
      console.log(`     ✓ Non-admin account rejected with 403 Forbidden`);

      // 3.4: Authorized Admin (rajshreeakm@gmail.com) -> 200 OK
      const resAdmin = await fetch(`${baseUrl}${ep.path}`, {
        method: ep.method,
        headers: {
          Authorization: 'Bearer token_admin',
          ...(ep.body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: ep.body ? JSON.stringify(ep.body) : undefined,
      });
      assert.strictEqual(
        resAdmin.status,
        200,
        `${ep.path} must allow authorized admin with 200`
      );
      const adminData = await resAdmin.json();
      assert.strictEqual(adminData.success, true);
      console.log(`     ✓ Authorized admin accepted with 200 OK`);
      passed++;
    }

    // -------------------------------------------------------------
    // Test 4: Public Endpoints Remain Accessible
    // -------------------------------------------------------------
    console.log('\n4. Verifying Public Endpoints Remain Open...');
    const healthRes = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(healthRes.status, 200);
    const healthData = await healthRes.json();
    assert.strictEqual(healthData.status, 'healthy');
    console.log('   ✓ /api/health accessible to public visitors without authentication');
    passed++;

    // -------------------------------------------------------------
    // Test 5: Verify Simulator / Mock Tokens Are Inactive Outside Test Mode
    // -------------------------------------------------------------
    console.log('\n5. Verifying Simulator / Mock Tokens Are Strictly Inactive in Production...');
    // Simulate non-test production environment
    const prevNodeEnv = process.env.NODE_ENV;
    const prevTestRunner = process.env.ENGINEERVERSE_TEST_RUNNER;
    try {
      process.env.NODE_ENV = 'production';
      delete process.env.ENGINEERVERSE_TEST_RUNNER;

      const reqProd = {
        headers: { authorization: 'Bearer token_admin' },
        ip: '127.0.0.1',
      };
      let prodStatus = null;
      let prodJson = null;
      const resProd = {
        status(c) { prodStatus = c; return this; },
        json(j) { prodJson = j; return this; },
      };

      await verifyToken(reqProd, resProd, () => {
        assert.fail('verifyToken must NOT accept token_admin when not in test environment');
      });

      assert.strictEqual(prodStatus, 401, 'Production must reject token_admin with 401');
      assert.strictEqual(prodJson.success, false);
      console.log('   ✓ Production mode strictly rejects simulator token_admin with HTTP 401');
      passed++;
    } finally {
      process.env.NODE_ENV = prevNodeEnv;
      process.env.ENGINEERVERSE_TEST_RUNNER = prevTestRunner;
    }

    console.log('\n' + '='.repeat(70));
    console.log(`AUDIT COMPLETE: All ${passed} authorization verification checks PASSED!`);
    console.log('Admin Security Boundary strictly enforces rajshreeakm@gmail.com');
    console.log('='.repeat(70));
  } finally {
    testServer.close();
  }
}

runAudit().catch((err) => {
  console.error('\n❌ Admin auth audit FAILED:', err);
  process.exit(1);
});
