/**
 * ENGINEERVERSE — Native Cryptographic Session Token Service
 * Pure JavaScript using Node.js native crypto.
 * Signs and verifies sessions for authenticated community members,
 * guaranteeing zero external token dependencies.
 */

import crypto from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET || 'engineerverse_auth_secret_session_2026';

export function createSessionToken(user) {
  if (!user || !user.uid) return null;

  const payload = {
    uid: user.uid,
    email: (user.email || '').toLowerCase(),
    name: user.displayName || user.name || (user.email ? user.email.split('@')[0] : 'Engineer'),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 14 * 86400, // 14 days expiration
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('base64url');

  return `ev_session.${payloadB64}.${signature}`;
}

export function verifySessionToken(token) {
  if (!token || typeof token !== 'string' || !token.startsWith('ev_session.')) {
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [, payloadB64, signature] = parts;

  try {
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('base64url');
    // Constant time comparison to prevent timing attacks
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSig);
    if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      return null;
    }

    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf-8');
    const payload = JSON.parse(payloadJson);

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && now > payload.exp) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

export default {
  createSessionToken,
  verifySessionToken,
};
