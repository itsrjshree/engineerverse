/**
 * ENGINEERVERSE — In-Memory Privacy-Preserving Analytics Store
 * Aggregates real incoming client events (zero PII, zero vanity data).
 */

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
    this.recentEvents = []; // Last 50 events (sanitized, zero PII)
  }

  recordEvent(eventData) {
    if (!eventData || typeof eventData !== 'object') return;

    const eventName = eventData.event || 'unknown';

    switch (eventName) {
      case 'landing_view':
        this.counters.landingViews++;
        break;
      case 'result_view':
        this.counters.resultViews++;
        break;
      case 'dna_complete':
        this.counters.dnaCompletions++;
        break;
      case 'card_generate':
        this.counters.cardsGenerated++;
        break;
      case 'share_trigger':
        this.counters.sharesTriggered++;
        break;
      case 'problem_submit':
        this.counters.problemsSubmitted++;
        break;
      case 'story_submit':
        this.counters.storiesSubmitted++;
        break;
      case 'pledge_submit':
        this.counters.pledgesSubmitted++;
        break;
      default:
        break;
    }

    // Keep sanitized trail (max 50)
    const sanitized = {
      event: eventName,
      timestamp: eventData.timestamp || new Date().toISOString(),
      sessionId: typeof eventData.sessionId === 'string' ? eventData.sessionId.slice(0, 16) : 'anon',
      properties: typeof eventData.properties === 'object' && eventData.properties ? { ...eventData.properties } : {},
    };

    // Strict PII strip
    delete sanitized.properties.email;
    delete sanitized.properties.password;
    delete sanitized.properties.token;
    delete sanitized.properties.name;

    this.recentEvents.push(sanitized);
    if (this.recentEvents.length > 50) {
      this.recentEvents.shift();
    }
  }

  getMetrics() {
    return {
      ...this.counters,
      totalEvents: Object.values(this.counters).reduce((sum, c) => sum + c, 0),
    };
  }

  getRecentEvents() {
    return [...this.recentEvents];
  }
}

export const analyticsStore = new AnalyticsStore();
export default analyticsStore;
