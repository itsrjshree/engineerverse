/**
 * ENGINEERVERSE — Authentication & Admin RBAC Middleware
 * Validates Firebase ID tokens and strictly enforces Admin authorization.
 * Sole authorized admin: rajshreeakm@gmail.com
 */

import { config } from '../config.js';

export const AUTHORIZED_ADMIN_EMAIL = 'rajshreeakm@gmail.com';

/**
 * Resolves the configured Admin Firebase UID.
 * 
 * Strict Contract:
 * - Production: ADMIN_FIREBASE_UID (or ADMIN_UID) is MANDATORY. If unset or empty,
 *   returns null (FAIL CLOSED — administrative authorization is completely unavailable).
 * - Standard Runtime / Dev: If unset, returns null (FAIL CLOSED — no admin privileges).
 * - Isolated Test Mode ONLY (NODE_ENV === 'test' && ENGINEERVERSE_TEST_RUNNER === 'true'):
 *   Returns process.env.ADMIN_FIREBASE_UID if configured, otherwise falls back to
 *   the deterministic test fixture UID ('admin_sole_rajshree').
 */
export function getAuthorizedAdminUid() {
  const envUid = (process.env.ADMIN_FIREBASE_UID || process.env.ADMIN_UID || '').trim();
  if (envUid) {
    return envUid;
  }

  // In production, FAIL CLOSED immediately: zero fallback, admin privileges impossible
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  // Strictly isolated automated test runner fallback
  const isTestEnvironment =
    process.env.NODE_ENV === 'test' &&
    (process.env.ENGINEERVERSE_TEST_RUNNER === 'true' || process.env.VITEST === 'true');

  if (isTestEnvironment) {
    return 'admin_sole_rajshree';
  }

  // Standard runtime without configured admin UID: fail closed
  return null;
}

/**
 * Server-side Admin Authorization Verification Helper
 * Verifies:
 * 1. Non-anonymous, non-empty UID
 * 2. Matches authorized admin email (rajshreeakm@gmail.com)
 * 3. Requires emailVerified === true
 * 4. Requires configured ADMIN_FIREBASE_UID matching user.uid (FAIL CLOSED)
 * 5. Requires active status in authoritative store (not suspended/blocked)
 * 6. Requires role === 'admin' and isAdmin === true in authoritative store
 */
export function isAuthorizedAdmin(user, storeUser) {
  if (!user || user.isAnonymous || !user.uid) return false;

  const email = (user.email || '').trim().toLowerCase();
  if (email !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) return false;

  // Strict email verification requirement for administrative actions
  if (user.emailVerified !== true) return false;

  // Administrative authorization MUST NOT rely on email alone.
  // ADMIN_FIREBASE_UID must be configured and match user.uid (FAIL CLOSED).
  const authorizedUid = getAuthorizedAdminUid();
  if (!authorizedUid || user.uid !== authorizedUid) {
    return false;
  }

  // Authoritative store status and role verification
  if (storeUser) {
    if (storeUser.status !== 'active') return false;
    if (storeUser.role !== 'admin' || storeUser.isAdmin !== true) return false;
    if ((storeUser.email || '').trim().toLowerCase() !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) return false;
  }

  return true;
}

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
    req.user = { isAnonymous: true, uid: 'guest_' + req.ip, emailVerified: false };
    return next();
  }

  // Strictly isolate automated test tokens to test environments (npm test / scripts)
  // These NEVER execute in production (NODE_ENV === 'production')
  const isTestEnvironment =
    process.env.NODE_ENV !== 'production' &&
    (process.env.NODE_ENV === 'test' ||
      process.env.ENGINEERVERSE_TEST_RUNNER === 'true' ||
      process.env.VITEST === 'true');

  if (isTestEnvironment) {
    if (
      token === 'token_admin' ||
      token === 'admin_token' ||
      token === 'test_admin_token'
    ) {
      const adminUid = getAuthorizedAdminUid() || 'admin_sole_rajshree';
      req.user = {
        uid: adminUid,
        role: 'admin',
        email: AUTHORIZED_ADMIN_EMAIL,
        isAdmin: true,
        isAnonymous: false,
        emailVerified: true,
        status: 'active',
        connectionCredits: 9999,
      };
      return next();
    }

    if (
      token === 'token_user_other' ||
      token === 'test_user_token'
    ) {
      req.user = {
        uid: 'user_test_1',
        role: 'member',
        email: 'engineer.other@example.com',
        isAdmin: false,
        isAnonymous: false,
        emailVerified: true,
        status: 'active',
        connectionCredits: 5,
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

  // Cryptographic verification for native session tokens (ev_session)
  if (token.startsWith('ev_session.')) {
    const { verifySessionToken } = await import('../services/sessionService.js');
    const sessionUser = verifySessionToken(token);
    if (sessionUser && sessionUser.uid) {
      const email = (sessionUser.email || '').toLowerCase();
      const emailVerified = Boolean(sessionUser.emailVerified);

      const userObj = {
        uid: sessionUser.uid,
        email,
        name: sessionUser.name || (email ? email.split('@')[0] : 'Engineer'),
        isAnonymous: false,
        emailVerified,
      };

      const { usersStore } = await import('../services/usersStore.js');
      const storeUser = await usersStore.getOrCreateUser(userObj);

      if (storeUser && (storeUser.status === 'suspended' || storeUser.status === 'blocked')) {
        return res.status(403).json({
          success: false,
          error: `Account ${storeUser.status} by administration for guideline violations.`,
          status: storeUser.status,
        });
      }

      const isAdmin = isAuthorizedAdmin(userObj, storeUser);
      const effectiveRole = isAdmin ? 'admin' : (storeUser?.role || 'member');

      req.user = {
        uid: userObj.uid,
        email,
        name: storeUser?.displayName || userObj.name || (email ? email.split('@')[0] : 'Engineer'),
        role: effectiveRole,
        isAdmin,
        isAnonymous: false,
        emailVerified,
        status: storeUser?.status || 'active',
        warningReason: storeUser?.warningReason || null,
        connectionCredits: isAdmin ? 9999 : (storeUser?.connectionCredits ?? 5),
      };
      return next();
    }
  }

  // Cryptographic RS256 verification against Google's public certificates (Firebase ID tokens)
  if (token.includes('.')) {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return res.status(401).json({
        success: false,
        error: 'Malformed authentication token.',
      });
    }

    const { verifyFirebaseIdToken } = await import('../services/firebaseAdminService.js');
    const verifiedUser = await verifyFirebaseIdToken(token);

    if (verifiedUser && verifiedUser.uid) {
      const email = (verifiedUser.email || '').toLowerCase();
      const emailVerified = verifiedUser.emailVerified === true;

      const userObj = {
        uid: verifiedUser.uid,
        email,
        name: verifiedUser.name || (email ? email.split('@')[0] : 'Engineer'),
        isAnonymous: false,
        emailVerified,
      };

      const { usersStore } = await import('../services/usersStore.js');
      const storeUser = await usersStore.getOrCreateUser(userObj);

      if (storeUser && (storeUser.status === 'suspended' || storeUser.status === 'blocked')) {
        return res.status(403).json({
          success: false,
          error: `Account ${storeUser.status} by administration for guideline violations.`,
          status: storeUser.status,
        });
      }

      const isAdmin = isAuthorizedAdmin(userObj, storeUser);
      const effectiveRole = isAdmin ? 'admin' : (storeUser?.role || 'member');

      req.user = {
        uid: userObj.uid,
        email,
        name: storeUser?.displayName || userObj.name || (email ? email.split('@')[0] : 'Engineer'),
        role: effectiveRole,
        isAdmin,
        isAnonymous: false,
        emailVerified,
        status: storeUser?.status || 'active',
        warningReason: storeUser?.warningReason || null,
        connectionCredits: isAdmin ? 9999 : (storeUser?.connectionCredits ?? 5),
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
 * Rejects suspended or blocked users with 403.
 */
export function requireAuth(req, res, next) {
  if (!req.user || req.user.isAnonymous) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please sign in with an authorized account.',
    });
  }
  if (req.user.status === 'suspended' || req.user.status === 'blocked') {
    return res.status(403).json({
      success: false,
      error: `Account ${req.user.status} by administration for guideline violations.`,
      status: req.user.status,
    });
  }
  next();
}

/**
 * Requires an authenticated user with an active account and verified identity (emailVerified: true).
 * Rejects unauthenticated callers with 401.
 * Rejects unverified or inactive callers with 403.
 */
export function requireVerifiedIdentity(req, res, next) {
  if (!req.user || req.user.isAnonymous) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please sign in with an authorized account.',
    });
  }
  if (req.user.status === 'suspended' || req.user.status === 'blocked') {
    return res.status(403).json({
      success: false,
      error: `Account ${req.user.status} by administration for guideline violations.`,
      status: req.user.status,
    });
  }
  if (req.user.emailVerified !== true) {
    return res.status(403).json({
      success: false,
      error: 'Email verification required. Please verify your email address to perform this action.',
      emailVerified: false,
    });
  }
  if (req.user.status && req.user.status !== 'active') {
    return res.status(403).json({
      success: false,
      error: 'Account must be active to perform this action.',
      status: req.user.status,
    });
  }
  next();
}

/**
 * Server-side Admin Authorization Gate
 * ONLY authorizes rajshreeakm@gmail.com with verified email, active status, and server-side role
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

  if (req.user.status === 'suspended' || req.user.status === 'blocked') {
    return res.status(403).json({
      success: false,
      error: `Account ${req.user.status} by administration.`,
      status: req.user.status,
    });
  }

  if (req.user.status !== 'active') {
    return res.status(403).json({
      success: false,
      error: 'Account must be active for administrative operations.',
      status: req.user.status,
    });
  }

  if (req.user.emailVerified !== true) {
    return res.status(403).json({
      success: false,
      error: 'Unauthorized access. Verified email required for administrative actions.',
      emailVerified: false,
    });
  }

  const userEmail = (req.user.email || '').toLowerCase();
  const authorizedEmail = AUTHORIZED_ADMIN_EMAIL.toLowerCase();

  const authorizedUid = getAuthorizedAdminUid();
  if (!authorizedUid) {
    return res.status(403).json({
      success: false,
      error: 'Unauthorized access. Administrative authorization is not configured.',
    });
  }

  if (req.user.uid !== authorizedUid) {
    return res.status(403).json({
      success: false,
      error: 'Unauthorized access. You do not have permission to view this console.',
    });
  }

  if (userEmail !== authorizedEmail || req.user.role !== 'admin' || req.user.isAdmin !== true) {
    return res.status(403).json({
      success: false,
      error: 'Unauthorized access. You do not have permission to view this console.',
    });
  }

  next();
}

export default {
  AUTHORIZED_ADMIN_EMAIL,
  getAuthorizedAdminUid,
  isAuthorizedAdmin,
  verifyToken,
  requireAuth,
  requireVerifiedIdentity,
  requireAdmin,
};
