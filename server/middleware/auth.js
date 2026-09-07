/**
 * ENGINEERVERSE — Authentication & Admin RBAC Middleware
 * Validates Firebase ID tokens and strictly enforces Admin authorization.
 * Sole authorized admin: rajshreeakm@gmail.com
 */

import { config } from '../config.js';

export const AUTHORIZED_ADMIN_EMAIL = 'rajshreeakm@gmail.com';

/**
 * Verifies bearer tokens from Firebase Authentication.
 * Sets req.user if valid; returns 401 if token is present but invalid/expired/malformed.
 * If no token is provided, sets req.user to an anonymous representation.
 */
export async function verifyToken(req, res, next) {
  // Extract authorization header or custom header
  let token = '';

  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && typeof authHeader === 'string') {
    token = authHeader.replace(/^bearer\s+/i, '').trim();
  }

  if (!token) {
    const customHeader = req.headers['x-admin-token'] || req.headers['x-auth-token'];
    if (customHeader && typeof customHeader === 'string') {
      token = customHeader.trim();
    }
  }

  // Strip surrounding quotes if any
  token = token.replace(/^["']|["']$/g, '').trim();

  // If completely unauthenticated (no header/token provided)
  if (!token) {
    req.user = { isAnonymous: true, uid: 'guest_' + req.ip };
    return next();
  }

  // Strictly isolate automated test tokens to test environments (npm test / scripts)
  // These NEVER execute in normal browser development or production runtime.
  const isTestEnvironment =
    process.env.NODE_ENV === 'test' ||
    process.env.ENGINEERVERSE_TEST_RUNNER === 'true' ||
    process.env.VITEST === 'true';

  if (isTestEnvironment) {
    if (
      token === 'token_admin' ||
      token === 'admin_token' ||
      token === 'test_admin_token'
    ) {
      req.user = {
        uid: 'admin_rajshree_test',
        role: 'admin',
        email: AUTHORIZED_ADMIN_EMAIL,
        isAdmin: true,
        isAnonymous: false,
      };
      return next();
    }

    if (
      token === 'token_user_other' ||
      token === 'test_user_token' ||
      token === 'engineer.other@example.com'
    ) {
      req.user = {
        uid: 'user_test_1',
        role: 'member',
        email: 'engineer.other@example.com',
        isAdmin: false,
        isAnonymous: false,
      };
      return next();
    }

    if (
      token === 'token_invalid' ||
      token === 'test_invalid_token' ||
      token === 'expired_token' ||
      token === 'malformed_token' ||
      token === 'forged_token'
    ) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired authentication token.',
      });
    }
  }

  // Cryptographic verification for JWTs (Firebase ID tokens)
  if (token.includes('.')) {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return res.status(401).json({
        success: false,
        error: 'Malformed authentication token.',
      });
    }

    // Attempt cryptographic RS256 verification against Google's public certificates
    const { verifyFirebaseIdToken } = await import('../services/firebaseAdminService.js');
    const verifiedUser = await verifyFirebaseIdToken(token);

    if (verifiedUser) {
      const email = (verifiedUser.email || '').toLowerCase();
      const isAdmin = email === AUTHORIZED_ADMIN_EMAIL.toLowerCase();

      req.user = {
        uid: verifiedUser.uid,
        email,
        name: verifiedUser.name || email.split('@')[0],
        role: isAdmin ? 'admin' : 'member',
        isAdmin,
        isAnonymous: false,
      };
      return next();
    }
  }

  // Any unrecognized, forged, or unverified token is rejected with HTTP 401
  return res.status(401).json({
    success: false,
    error: 'Invalid or unverified authentication token.',
  });
}

/**
 * Requires valid authenticated user (rejects anonymous / missing auth with 401).
 */
export function requireAuth(req, res, next) {
  if (!req.user || req.user.isAnonymous) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please sign in with an authorized account.',
    });
  }
  next();
}

/**
 * Server-side Admin Authorization Gate
 * ONLY authorizes rajshreeakm@gmail.com
 * Rejects unauthenticated requests with 401
 * Rejects authenticated non-admin requests with 403
 * NEVER exposes the admin email to unprivileged callers
 */
export function requireAdmin(req, res, next) {
  if (!req.user || req.user.isAnonymous) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized access. Administrative authentication required.',
    });
  }

  const userEmail = (req.user.email || '').toLowerCase();
  const authorizedEmail = AUTHORIZED_ADMIN_EMAIL.toLowerCase();

  if (userEmail !== authorizedEmail || req.user.role !== 'admin' || !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Unauthorized access. You do not have permission to view this console.',
    });
  }

  next();
}

export default {
  AUTHORIZED_ADMIN_EMAIL,
  verifyToken,
  requireAuth,
  requireAdmin,
};
