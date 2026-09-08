/**
 * ENGINEERVERSE — Centralized API Client & URL Resolver
 * Handles routing API requests accurately across standalone, preview,
 * and canonical reverse-proxied deployments (e.g. rjshree.com/engineerverse).
 */

export function getApiUrl(endpoint) {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // Explicit override if configured in env
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) {
    const base = import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '');
    return `${base}${path}`;
  }

  // When loaded from rjshree.com (where /api belongs to the parent portfolio project),
  // route directly to the dedicated engineerverse backend deployment with full CORS support.
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('rjshree.com')) {
      return `https://engineerverse.vercel.app${path}`;
    }
  }

  return path;
}

/**
 * Resolves an avatar URL into a valid, reachable absolute URL across all domains
 * (e.g. rjshree.com, vercel.app, preview iframes, or local dev).
 */
export function resolveAvatarUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Data URLs (base64) are directly renderable
  if (trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  // Already fully qualified HTTP or HTTPS URL (e.g. Cloudinary, Unsplash, GitHub)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Relative backend path (e.g. /api/media/avatar/...)
  if (trimmed.startsWith('/')) {
    const resolved = getApiUrl(trimmed);
    if (resolved.startsWith('http://') || resolved.startsWith('https://')) {
      return resolved;
    }
    // In standalone or preview container, ensure full origin if window is defined
    if (typeof window !== 'undefined' && window.location?.origin) {
      if (window.location.hostname.includes('rjshree.com')) {
        return `https://engineerverse.vercel.app${trimmed}`;
      }
      return `${window.location.origin}${trimmed}`;
    }
    return resolved;
  }

  return trimmed;
}

export async function apiFetch(endpoint, options = {}) {
  const url = getApiUrl(endpoint);
  const headers = { ...(options.headers || {}) };

  // If authorization is not already set, check for active auth token
  if (!headers.Authorization && !headers.authorization && typeof window !== 'undefined') {
    try {
      const { authService } = await import('../services/firebaseClient.js');
      const token = await authService.getIdToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Non-blocking fallback
    }
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

export default apiFetch;
