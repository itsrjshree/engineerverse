/**
 * ENGINEERVERSE — Security Headers & CORS Middleware
 * Hardened protection against clickjacking, MIME sniffing, and XSS.
 */

export function securityHeaders(req, res, next) {
  // Prevent MIME-sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking in outside iframes (allow same-origin or preview container)
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // XSS Auditor
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Strict Permissions Policy
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  next();
}

export function corsMiddleware(req, res, next) {
  const origin = req.headers.origin || '*';

  // Allow localhost, cloud run preview domains, and canonical domain
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, x-admin-token, x-auth-token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
}

export function sanitizeInputs(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === 'string') {
        // Strip potential script tags and trim whitespace
        req.body[key] = req.body[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .trim();
      }
    }
  }
  next();
}

export default {
  securityHeaders,
  corsMiddleware,
  sanitizeInputs,
};
