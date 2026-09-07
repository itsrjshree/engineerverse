/**
 * ENGINEERVERSE — AI Rate Limiter Middleware
 * Protects free AI provider pools against abuse and rapid multi-prompt hammering.
 * Uses sliding window counter per client IP / session.
 */

import { aiConfig } from '../config.js';

class AIRateLimiterStore {
  constructor(windowMs, maxRequests) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.clients = new Map(); // key: ip, value: array of timestamps
  }

  isRateLimited(key) {
    const now = Date.now();
    const timestamps = this.clients.get(key) || [];

    // Filter timestamps within sliding window
    const validTimestamps = timestamps.filter((t) => now - t < this.windowMs);

    if (validTimestamps.length >= this.maxRequests) {
      const oldest = validTimestamps[0];
      const retryAfterSec = Math.max(1, Math.ceil((this.windowMs - (now - oldest)) / 1000));
      return { limited: true, retryAfterSec };
    }

    validTimestamps.push(now);
    this.clients.set(key, validTimestamps);
    return { limited: false, retryAfterSec: 0 };
  }

  reset() {
    this.clients.clear();
  }
}

export const aiRateLimiterStore = new AIRateLimiterStore(
  aiConfig.rateLimitWindowMs,
  aiConfig.rateLimitMaxRequests
);

export function aiOrchestratorRateLimiter(req, res, next) {
  const clientKey =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'anonymous_client';

  const check = aiRateLimiterStore.isRateLimited(clientKey);

  if (check.limited) {
    res.set('Retry-After', String(check.retryAfterSec));
    return res.status(429).json({
      success: false,
      error: 'Too many engineering inquiries in a short duration. Please reflect and try again shortly.',
      retryAfterSeconds: check.retryAfterSec,
    });
  }

  next();
}

export default aiOrchestratorRateLimiter;
