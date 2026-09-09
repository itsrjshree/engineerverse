/**
 * ENGINEERVERSE — Native Cryptographic Token Verification Service
 * Verifies Google Firebase ID tokens using standard Node.js crypto and Google Public x509 Certificates.
 * Completely eliminates heavy transitive dependencies (firebase-admin, jwks-rsa, jose)
 * that cause [ERR_REQUIRE_ESM] conflicts in Vite and cross-platform environments.
 */

import crypto from 'crypto';
import { config } from '../config.js';

const GOOGLE_PUBLIC_CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

let cachedCerts = null;
let certsExpiryTime = 0;

/**
 * Fetches and caches Google's public x509 certificates for Firebase ID Token verification
 */
async function getGooglePublicCertificates() {
  const now = Date.now();
  if (cachedCerts && now < certsExpiryTime) {
    return cachedCerts;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(GOOGLE_PUBLIC_CERTS_URL, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn('[Token Verifier] Failed to fetch Google public certs:', res.status);
      return cachedCerts || {};
    }

    // Parse Cache-Control header for max-age
    const cacheControl = res.headers.get('cache-control') || '';
    const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
    const maxAgeSec = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 21600; // default 6h

    const certs = await res.json();
    cachedCerts = certs;
    certsExpiryTime = now + maxAgeSec * 1000;

    return certs;
  } catch (err) {
    console.warn('[Token Verifier] Network error fetching Google public certs:', err.message);
    return cachedCerts || {};
  }
}

/**
 * Cryptographically verifies a Firebase ID Token.
 * 1. Checks JWT structure (header, payload, signature)
 * 2. Matches header kid against Google's published public certificates
 * 3. Verifies RS256 signature using Node native crypto
 * 4. Verifies expiration and issuer/audience claims
 */
export async function verifyFirebaseIdToken(token) {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  let header = null;
  let payload = null;

  try {
    const headerJson = Buffer.from(parts[0], 'base64url').toString('utf-8');
    header = JSON.parse(headerJson);

    const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf-8');
    payload = JSON.parse(payloadJson);
  } catch {
    return null;
  }

  // 1. Verify algorithm and key ID
  if (header.alg !== 'RS256' || !header.kid) {
    return null;
  }

  // 2. Verify temporal validity
  const now = Math.floor(Date.now() / 1000);
  if (!payload.exp || now > payload.exp) {
    return null; // Expired
  }
  if (payload.iat && now < payload.iat - 300) {
    return null; // Issued in the future
  }

  // 3. Verify Project ID / Audience if configured
  const configuredProjectId = config.firebaseAdmin?.projectId || process.env.VITE_FIREBASE_PROJECT_ID;
  if (configuredProjectId) {
    if (payload.aud && payload.aud !== configuredProjectId) {
      return null; // Wrong audience
    }
    const expectedIss = `https://securetoken.google.com/${configuredProjectId}`;
    if (payload.iss && payload.iss !== expectedIss) {
      return null; // Wrong issuer
    }
  }

  // 4. Retrieve Google public certs
  const certs = await getGooglePublicCertificates();
  const cert = certs[header.kid];

  if (!cert) {
    // If cert for kid is not found directly, attempt Google tokeninfo fallback
    return await verifyWithGoogleTokenInfo(token, payload.sub);
  }

  // 5. Cryptographic signature check with Node's native crypto
  try {
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(`${parts[0]}.${parts[1]}`);
    const isSignatureValid = verifier.verify(cert, Buffer.from(parts[2], 'base64url'));

    if (!isSignatureValid) {
      return null;
    }

    return {
      uid: payload.user_id || payload.sub || payload.uid,
      email: payload.email || '',
      name: payload.name || '',
      picture: payload.picture || '',
      emailVerified: payload.email_verified === true,
    };
  } catch (err) {
    console.warn('[Token Verifier] Native crypto verification error:', err.message);
    return null;
  }
}

/**
 * Fallback verification via Google's tokeninfo endpoint if public certs are unreachable
 */
async function verifyWithGoogleTokenInfo(token, expectedSub) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) return null;

    const info = await res.json();
    if (!info || (expectedSub && info.sub !== expectedSub)) {
      return null;
    }

    return {
      uid: info.sub,
      email: info.email || '',
      name: info.name || '',
      picture: info.picture || '',
      emailVerified: info.email_verified === true || info.email_verified === 'true',
    };
  } catch {
    return null;
  }
}

export default {
  verifyFirebaseIdToken,
};
