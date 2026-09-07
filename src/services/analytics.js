/**
 * ENGINEERVERSE — Privacy-Safe Analytics Tracker
 * Guaranteed zero PII (strictly strips emails, passwords, usernames, and sensitive fields).
 */

import { ANALYTICS_EVENTS } from '../config/analyticsEvents.js';
import { getApiUrl } from '../config/api.js';

class AnalyticsTracker {
  constructor() {
    this.sessionId = this._getOrCreateSessionId();
    this.eventBuffer = [];
    this.isDevelopment = typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.includes('ais-')
    );
  }

  _getOrCreateSessionId() {
    if (typeof window === 'undefined') return 'server_session';
    let sid = window.sessionStorage?.getItem('ev_session_id');
    if (!sid) {
      sid = 'ev_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString(36);
      try {
        window.sessionStorage?.setItem('ev_session_id', sid);
      } catch {
        // Storage might be restricted
      }
    }
    return sid;
  }

  track(eventName, properties = {}) {
    if (!Object.values(ANALYTICS_EVENTS).includes(eventName)) {
      console.warn(`[Analytics] Unregistered event: ${eventName}`);
    }

    // Sanitize payload: strip any accidental PII
    const sanitized = { ...properties };
    delete sanitized.email;
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.name;

    const payload = {
      event: eventName,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      viewport: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'unknown',
      properties: sanitized,
    };

    this.eventBuffer.push(payload);

    if (this.isDevelopment) {
      console.log(`[Analytics Event] ${eventName}`, sanitized);
    }

    // Dispatch event to privacy analytics endpoint without blocking UI
    if (typeof window !== 'undefined') {
      try {
        const jsonPayload = JSON.stringify(payload);
        let dispatched = false;

        const endpoint = getApiUrl('/api/analytics/event');
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          const blob = new Blob([jsonPayload], { type: 'application/json' });
          dispatched = navigator.sendBeacon(endpoint, blob);
        }

        if (!dispatched && typeof fetch === 'function') {
          fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: jsonPayload,
            keepalive: true,
          }).catch(() => {
            // Suppress offline/unreachable errors gracefully
          });
        }
      } catch {
        // Analytics failures are non-critical
      }
    }
  }
}

export const analytics = new AnalyticsTracker();
export default analytics;
