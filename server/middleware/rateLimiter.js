/**
 * ENGINEERVERSE — In-Memory Rate Limiter Middleware
 * Protects AI orchestration and UGC submission endpoints from abuse and DoS.
 */

const ipStore = new Map();

// Periodic sweep to prevent memory leaks
const sweepTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, data] of ipStore.entries()) {
    if (now - data.resetTime > 0) {
      ipStore.delete(key);
    }
  }
}, 60 * 1000);
sweepTimer.unref();

export function createRateLimiter({
  windowMs = 15 * 60 * 1000,
  maxRequests = 100,
  message = 'Too many requests. Please cool down before retrying.',
} = {}) {
  return function rateLimiter(req, res, next) {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown-ip';
    const routeKey = `${ip}:${req.baseUrl || req.path}`;
    const now = Date.now();

    let record = ipStore.get(routeKey);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      ipStore.set(routeKey, record);
    } else {
      record.count += 1;
    }

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > maxRequests) {
      return res.status(429).json({
        success: false,
        error: message,
        retryAfterSeconds: Math.ceil((record.resetTime - now) / 1000),
      });
    }

    next();
  };
}

export const standardRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 100,
});

export const aiRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  maxRequests: 15,
  message: 'AI query limit reached for this session. Please wait 10 minutes to protect compute resources.',
});

export const submissionRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 10,
  message: 'Submission limit reached. Please wait an hour before submitting another problem or story.',
});

export default {
  createRateLimiter,
  standardRateLimiter,
  aiRateLimiter,
  submissionRateLimiter,
};
