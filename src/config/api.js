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
