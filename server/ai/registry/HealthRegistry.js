/**
 * ENGINEERVERSE — AI Provider & Model Health Registry
 * Implements circuit breaker, exponential cooldown, failure classification, and latency telemetry.
 */

import { CIRCUIT_BREAKER_STATES, ERROR_TYPES } from '../types.js';

export class HealthRegistry {
  constructor(options = {}) {
    this.cooldownMs = options.cooldownMs || 60000; // 1 minute
    this.failureThreshold = options.consecutiveFailureThreshold || 2;
    this.registry = new Map(); // key: `${provider}:${modelId}`
  }

  _getKey(provider, modelId) {
    return `${provider}:${modelId}`;
  }

  _getOrCreate(provider, modelId) {
    const key = this._getKey(provider, modelId);
    if (!this.registry.has(key)) {
      this.registry.set(key, {
        provider,
        modelId,
        healthy: true,
        circuitBreakerState: CIRCUIT_BREAKER_STATES.CLOSED,
        consecutiveFailures: 0,
        lastFailureAt: null,
        lastSuccessAt: null,
        lastErrorType: null,
        cooldownUntil: null,
        totalRequests: 0,
        totalSuccesses: 0,
        totalFailures: 0,
        averageLatencyMs: 0,
      });
    }
    return this.registry.get(key);
  }

  /**
   * Checks if a provider + model candidate is eligible for routing.
   * Handles HALF_OPEN probe transitions when cooldown expires.
   */
  isAvailable(provider, modelId) {
    const state = this._getOrCreate(provider, modelId);
    const now = Date.now();

    if (state.circuitBreakerState === CIRCUIT_BREAKER_STATES.CLOSED) {
      return true;
    }

    if (state.circuitBreakerState === CIRCUIT_BREAKER_STATES.OPEN) {
      if (state.cooldownUntil && now >= state.cooldownUntil) {
        // Transition to HALF_OPEN to allow a single test probe
        state.circuitBreakerState = CIRCUIT_BREAKER_STATES.HALF_OPEN;
        return true;
      }
      return false; // Still cooling down
    }

    if (state.circuitBreakerState === CIRCUIT_BREAKER_STATES.HALF_OPEN) {
      return true; // Probe in progress
    }

    return true;
  }

  recordSuccess(provider, modelId, latencyMs = 0) {
    const state = this._getOrCreate(provider, modelId);
    state.healthy = true;
    state.circuitBreakerState = CIRCUIT_BREAKER_STATES.CLOSED;
    state.consecutiveFailures = 0;
    state.cooldownUntil = null;
    state.lastSuccessAt = Date.now();
    state.totalRequests += 1;
    state.totalSuccesses += 1;

    // Moving average of latency
    if (state.averageLatencyMs === 0) {
      state.averageLatencyMs = latencyMs;
    } else {
      state.averageLatencyMs = Math.round(state.averageLatencyMs * 0.8 + latencyMs * 0.2);
    }
  }

  recordFailure(provider, modelId, errorType = ERROR_TYPES.UNKNOWN) {
    const state = this._getOrCreate(provider, modelId);
    const now = Date.now();

    state.totalRequests += 1;
    state.totalFailures += 1;
    state.consecutiveFailures += 1;
    state.lastFailureAt = now;
    state.lastErrorType = errorType;

    // Fast trip on critical non-recoverable errors
    const isCritical = errorType === ERROR_TYPES.AUTH || errorType === ERROR_TYPES.NOT_FOUND;
    const shouldTrip = isCritical || state.consecutiveFailures >= this.failureThreshold;

    if (shouldTrip) {
      state.healthy = false;
      state.circuitBreakerState = CIRCUIT_BREAKER_STATES.OPEN;

      // Exponential backoff multiplier based on failure count past threshold
      const multiplier = Math.min(Math.pow(2, Math.max(0, state.consecutiveFailures - this.failureThreshold)), 8);
      const maxJitter = Math.min(2000, Math.floor(this.cooldownMs * 0.1));
      const jitter = maxJitter > 0 ? Math.floor(Math.random() * maxJitter) : 0;
      state.cooldownUntil = now + this.cooldownMs * multiplier + jitter;
    }
  }

  getHealth(provider, modelId) {
    return this._getOrCreate(provider, modelId);
  }

  getAllHealth() {
    return Array.from(this.registry.values());
  }

  reset(provider, modelId) {
    if (provider && modelId) {
      this.registry.delete(this._getKey(provider, modelId));
    } else {
      this.registry.clear();
    }
  }
}

export const globalHealthRegistry = new HealthRegistry();
export default globalHealthRegistry;
