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
async function getGooglePublicCertificates(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedCerts && now < certsExpiryTime) {
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
  if (!header || header.alg !== 'RS256' || !header.kid || typeof header.kid !== 'string') {
    return null;
  }

  // 2. Verify temporal validity
  const now = Math.floor(Date.now() / 1000);
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  if (!payload.exp || typeof payload.exp !== 'number' || now > payload.exp) {
    return null; // Expired
  }
  if (!payload.iat || typeof payload.iat !== 'number' || now < payload.iat - 300) {
    return null; // Issued in the future
  }
  if (payload.auth_time && (typeof payload.auth_time !== 'number' || now < payload.auth_time - 300)) {
    return null; // Invalid auth_time in future
  }

  // 3. Verify Subject / UID (must be non-empty string, max 128 characters)
  const uid = payload.sub || payload.user_id;
  if (!uid || typeof uid !== 'string' || uid.trim().length === 0 || uid.length > 128) {
    return null;
  }
  if (payload.sub && payload.user_id && payload.sub !== payload.user_id) {
    return null; // Inconsistent subject / user_id
  }

  // 4. Verify Project ID / Audience and Issuer
  const configuredProjectId = (
    process.env.FIREBASE_PROJECT_ID ||
    process.env.VITE_FIREBASE_PROJECT_ID ||
    config.firebaseAdmin?.projectId ||
    ''
  ).trim();

  if (configuredProjectId) {
    if (!payload.aud || payload.aud !== configuredProjectId) {
      return null; // Wrong or missing audience
    }
    const expectedIss = `https://securetoken.google.com/${configuredProjectId}`;
    if (!payload.iss || payload.iss !== expectedIss) {
      return null; // Wrong or missing issuer
    }
  } else {
    // If not explicitly configured, enforce canonical Firebase securetoken issuer structure
    if (!payload.iss || typeof payload.iss !== 'string' || !payload.iss.startsWith('https://securetoken.google.com/')) {
      return null;
    }
    const derivedProject = payload.iss.replace('https://securetoken.google.com/', '').trim();
    if (!derivedProject || payload.aud !== derivedProject) {
      return null;
    }
  }

  // 5. Retrieve Google public certificates
  let certs = await getGooglePublicCertificates();
  let cert = certs && typeof certs === 'object' ? certs[header.kid] : null;

  if (!cert) {
    // If cert for kid is not found in cache, attempt one forced refresh in case of key rotation
    certs = await getGooglePublicCertificates(true);
    cert = certs && typeof certs === 'object' ? certs[header.kid] : null;
  }

  if (!cert) {
    // Unknown or untrusted key ID; reject token immediately
    return null;
  }

  // 6. Cryptographic RS256 signature check with Node's native crypto
  try {
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(`${parts[0]}.${parts[1]}`);
    const isSignatureValid = verifier.verify(cert, Buffer.from(parts[2], 'base64url'));

    if (!isSignatureValid) {
      return null;
    }

    return {
      uid,
      email: (payload.email || '').trim().toLowerCase(),
      name: payload.name || '',
      picture: payload.picture || '',
      emailVerified: payload.email_verified === true,
    };
  } catch (err) {
    console.warn('[Token Verifier] Native crypto verification error:', err.message);
    return null;
  }
}

export default {
  verifyFirebaseIdToken,
};
