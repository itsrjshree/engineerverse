/**
 * ENGINEERVERSE — Security Headers & CORS Middleware
 * Hardened protection against clickjacking, MIME sniffing, XSS, and CORS abuse.
 */

const DEFAULT_ALLOWED_ORIGINS = [
  'https://rjshree.com',
  'https://engineerverse.vercel.app',
];

/**
 * Resolves CORS allowlist based on environment variables and runtime mode.
 */
export function getAllowedOrigins() {
  const custom = process.env.ALLOWED_ORIGINS;
  const list = custom
    ? custom
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean)
    : [...DEFAULT_ALLOWED_ORIGINS];

  if (process.env.NODE_ENV !== 'production') {
    const devOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
    ];
    for (const devOrigin of devOrigins) {
      if (!list.includes(devOrigin)) {
        list.push(devOrigin);
      }
    }
  }

  return list;
}

export function securityHeaders(req, res, next) {
  // Prevent MIME-sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking in outside iframes (allow same-origin or preview container)
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Allow OAuth popups (Google, GitHub, etc.) to communicate window.closed and message back without COOP block
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

  // XSS Auditor
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Strict Permissions Policy
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  // Content Security Policy
  const isDev = process.env.NODE_ENV !== 'production';
  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://*.firebaseapp.com https://www.gstatic.com"
    : "script-src 'self' 'unsafe-inline' https://apis.google.com https://*.firebaseapp.com https://www.gstatic.com";

  const cspDirectives = [
    "default-src 'self'",
    "img-src 'self' https://res.cloudinary.com https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://*.vercel.app https://3d-port-folio-git-main-rajshrees-projects.vercel.app data: blob:",
    scriptSrc,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://api.cloudinary.com https://generativelanguage.googleapis.com https://openrouter.ai https://www.googleapis.com https://oauth2.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.firebaseio.com https://*.googleapis.com ws: wss:",
    "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com",
    "frame-ancestors 'self'",
  ];
  res.setHeader('Content-Security-Policy', cspDirectives.join('; '));

  next();
}

export function corsMiddleware(req, res, next) {
  const origin = req.headers.origin;
  const allowedOrigins = getAllowedOrigins();

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With, x-admin-token, x-auth-token, Accept'
    );
    res.setHeader('Vary', 'Origin');
  }

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
}

/**
 * Strips script tags, style tags, and all HTML markup from a string.
 * Native implementation avoids CommonJS / ESM cross-version dependency issues on Node 20+.
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  // Strip <script>...</script> tags and enclosed code
  let sanitized = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gis, '');
  // Strip <style>...</style> tags and enclosed css
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gis, '');
  // Strip all remaining HTML tags
  sanitized = sanitized.replace(/<[^>]+>/g, '');
  return sanitized.trim();
}

function deepSanitize(val) {
  if (typeof val === 'string') {
    return sanitizeString(val);
  }
  if (Array.isArray(val)) {
    return val.map(deepSanitize);
  }
  if (val && typeof val === 'object') {
    const sanitizedObj = {};
    for (const [k, v] of Object.entries(val)) {
      sanitizedObj[k] = deepSanitize(v);
    }
    return sanitizedObj;
  }
  return val;
}

export function sanitizeInputs(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = deepSanitize(req.body);
  }
  next();
}

export default {
  getAllowedOrigins,
  securityHeaders,
  corsMiddleware,
  sanitizeInputs,
};
