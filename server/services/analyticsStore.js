/**
 * ENGINEERVERSE — Privacy-Preserving Durable Analytics Service
 * 
 * Master Architecture Contract:
 * - Real incoming client events only (zero fabricated/vanity numbers).
 * - Strict PII boundary: Strips email, password, token, name, IP, credentials, secrets.
 * - Session tracking: Truncated 16-char ephemeral session ID or 'anon' (never persistent device fingerprinting).
 * - Durable persistence: Writes sanitized events to Firestore `analyticsEvents/{id}` and
 *   maintains aggregate metrics atomically in Firestore `systemCounters/analytics`.
 * - Compatible with serverless environments (Vercel) without reliance on process RAM.
 * - In-memory buffer provides instant local dev/test feedback and offline continuity.
 * - Data Retention Strategy: Event-level records in `analyticsEvents` have a recommended 90-day retention,
 *   while aggregated totals in `systemCounters/analytics` persist permanently.
 */

import { getFirestoreInstance } from './firestoreService.js';
import { FieldValue } from 'firebase-admin/firestore';

const ALLOWED_EVENTS = new Set([
  'landing_view',
  'result_view',
  'dna_complete',
  'card_generate',
  'share_trigger',
  'problem_submit',
  'story_submit',
  'pledge_submit',
]);

const COUNTER_KEY_MAP = {
  landing_view: 'landingViews',
  result_view: 'resultViews',
  dna_complete: 'dnaCompletions',
  card_generate: 'cardsGenerated',
  share_trigger: 'sharesTriggered',
  problem_submit: 'problemsSubmitted',
  story_submit: 'storiesSubmitted',
  pledge_submit: 'pledgesSubmitted',
};

function makeThenable(syncData, asyncPromise) {
  const target = syncData ? { ...syncData } : {};
  return Object.assign(Object.create(target), target, {
    then(onFulfilled, onRejected) {
      return asyncPromise.then(onFulfilled, onRejected);
    },
    catch(onRejected) {
      return asyncPromise.catch(onRejected);
    },
    finally(onFinally) {
      return asyncPromise.finally(onFinally);
    },
  });
}

class AnalyticsStore {
  constructor() {
    this.counters = {
      landingViews: 0,
      resultViews: 0,
      dnaCompletions: 0,
      cardsGenerated: 0,
      sharesTriggered: 0,
      problemsSubmitted: 0,
      storiesSubmitted: 0,
      pledgesSubmitted: 0,
    };
    this.recentEvents = []; // Last 50 sanitized events
  }

  /**
   * Sanitizes an event payload, removing all PII and sensitive fields.
   */
  sanitizePayload(eventData) {
    if (!eventData || typeof eventData !== 'object') return null;

    const rawEvent = String(eventData.event || '').trim().toLowerCase();
    if (!ALLOWED_EVENTS.has(rawEvent)) {
      return null;
    }

    const sanitized = {
      event: rawEvent,
      timestamp: eventData.timestamp || new Date().toISOString(),
      sessionId:
        typeof eventData.sessionId === 'string' && eventData.sessionId.length > 0
          ? eventData.sessionId.slice(0, 16).replace(/[^a-zA-Z0-9_-]/g, '')
          : 'anon',
      properties:
        typeof eventData.properties === 'object' && eventData.properties !== null
          ? { ...eventData.properties }
          : {},
    };

    // Strict PII and secret stripping
    const sensitiveKeys = [
      'email',
      'password',
      'token',
      'name',
      'ip',
      'phone',
      'auth',
      'authorization',
      'bearer',
      'secret',
      'credential',
      'address',
    ];
    for (const key of Object.keys(sanitized.properties)) {
      if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
        delete sanitized.properties[key];
      }
    }

    return sanitized;
  }

  /**
   * Records a single event. Writes to Firestore durably while updating the memory buffer.
   */
  async recordEvent(eventData) {
    const sanitized = this.sanitizePayload(eventData);
    if (!sanitized) return null;

    // Update in-memory counters
    const counterKey = COUNTER_KEY_MAP[sanitized.event];
    if (counterKey && this.counters[counterKey] !== undefined) {
      this.counters[counterKey]++;
    }

    // Keep circular memory trail (max 50)
    this.recentEvents.push(sanitized);
    if (this.recentEvents.length > 50) {
      this.recentEvents.shift();
    }

    // Persist to Firestore durably
    try {
      const db = getFirestoreInstance();
      const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      // 1. Raw event record in analyticsEvents collection (90-day retention window)
      const writeEventPromise = db.collection('analyticsEvents').doc(eventId).set({
        id: eventId,
        ...sanitized,
        createdAt: sanitized.timestamp,
      });

      // 2. Aggregate counter in systemCounters/analytics
      const updateCountersPromise = db
        .collection('systemCounters')
        .doc('analytics')
        .set(
          {
            [counterKey]: FieldValue.increment(1),
            totalEvents: FieldValue.increment(1),
            lastEventAt: sanitized.timestamp,
          },
          { merge: true }
        );

      await Promise.all([writeEventPromise, updateCountersPromise]);
    } catch (err) {
      // In production or test, log if not in test runner
      if (process.env.NODE_ENV === 'production') {
        console.warn('[AnalyticsStore] Firestore persistence notice:', err.message);
      }
    }

    return sanitized;
  }

  /**
   * Retrieves aggregated metrics. Authoritative from Firestore in production.
   */
  getMetrics() {
    const syncResult = {
      ...this.counters,
      totalEvents: Object.values(this.counters).reduce((sum, c) => sum + c, 0),
    };

    const asyncPromise = (async () => {
      try {
        const db = getFirestoreInstance();
        const doc = await db.collection('systemCounters').doc('analytics').get();
        if (doc.exists) {
          const data = doc.data() || {};
          const merged = { ...syncResult };
          for (const [k, v] of Object.entries(COUNTER_KEY_MAP)) {
            if (typeof data[v] === 'number') {
              merged[v] = Math.max(merged[v], data[v]);
            }
          }
          merged.totalEvents = Object.values(merged).reduce((sum, c) => (typeof c === 'number' ? sum + c : sum), 0);
          return merged;
        }
      } catch (err) {
        // Fall back to in-memory counters on error
      }
      return syncResult;
    })();

    return makeThenable(syncResult, asyncPromise);
  }

  /**
   * Retrieves recent sanitized events
   */
  async getRecentEvents(limitCount = 50) {
    try {
      const db = getFirestoreInstance();
      const snap = await db
        .collection('analyticsEvents')
        .orderBy('timestamp', 'desc')
        .limit(Math.min(limitCount, 100))
        .get();

      if (!snap.empty) {
        return snap.docs.map((d) => d.data());
      }
    } catch (err) {
      // Fall through to memory
    }
    return [...this.recentEvents];
  }
}

export const analyticsStore = new AnalyticsStore();
export default analyticsStore;
