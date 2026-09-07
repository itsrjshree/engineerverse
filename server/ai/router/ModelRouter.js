/**
 * ENGINEERVERSE — Intelligent AI Model Router
 * Evaluates classified requirements, enforces cost policy, checks health & circuit breakers,
 * and yields optimal primary and fallback candidates across providers.
 */

import { COST_POLICY } from '../types.js';

export class ModelRouter {
  constructor(options = {}) {
    this.providerRegistry = options.providerRegistry;
    this.healthRegistry = options.healthRegistry;
    this.costPolicy = options.costPolicy || COST_POLICY.FREE_ONLY;
  }

  /**
   * Evaluates available models and returns ranked candidates.
   * @param {object} classifiedRequest
   * @returns {{ primary: object|null, fallbacks: object[], allCandidates: object[] }}
   */
  route(classifiedRequest) {
    const { capabilities = [], format = 'text', structured = false } = classifiedRequest;
    const allModels = this.providerRegistry.getAllAvailableModels();

    // 1. Filter models based on configuration, health, and policy
    const eligible = allModels.filter((model) => {
      // Must have configured provider
      if (!model.providerConfigured) return false;

      // Enforce Cost Policy
      if (this.costPolicy === COST_POLICY.FREE_ONLY && !model.isFree) {
        return false;
      }

      // Check Circuit Breaker / Cooldown Health
      if (this.healthRegistry && !this.healthRegistry.isAvailable(model.provider, model.id)) {
        return false;
      }

      // Check required capabilities
      if (structured || format === 'json') {
        const canJson = model.capabilities.includes('structured_json') || model.capabilities.includes('reasoning');
        if (!canJson) return false;
      }

      return true;
    });

    if (eligible.length === 0) {
      return { primary: null, fallbacks: [], allCandidates: [] };
    }

    // 2. Score candidates
    const scored = eligible.map((model) => {
      let score = model.priority || 5;

      // Free model bonus
      if (model.isFree) score += 20;

      // Capability overlap
      const matchingCaps = capabilities.filter((c) => model.capabilities.includes(c));
      score += matchingCaps.length * 3;

      // Health / Latency adjustments
      if (this.healthRegistry) {
        const health = this.healthRegistry.getHealth(model.provider, model.id);
        if (health.consecutiveFailures > 0) {
          score -= health.consecutiveFailures * 5;
        }
        if (health.averageLatencyMs > 0 && health.averageLatencyMs < 1000) {
          score += 2;
        }
      }

      return {
        provider: model.provider,
        modelId: model.id,
        name: model.name,
        isFree: model.isFree,
        score,
      };
    });

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);

    // Group to ensure provider diversity in fallbacks
    // (e.g. if Gemini is primary, prioritize OpenRouter as first fallback)
    const primary = scored[0];
    const otherProviderCandidates = scored.slice(1).filter((c) => c.provider !== primary.provider);
    const sameProviderCandidates = scored.slice(1).filter((c) => c.provider === primary.provider);

    // Interleave providers for resilient cross-provider fallback
    const fallbacks = [];
    let i = 0;
    while (otherProviderCandidates[i] || sameProviderCandidates[i]) {
      if (otherProviderCandidates[i]) fallbacks.push(otherProviderCandidates[i]);
      if (sameProviderCandidates[i]) fallbacks.push(sameProviderCandidates[i]);
      i++;
    }

    return {
      primary,
      fallbacks,
      allCandidates: scored,
    };
  }
}

export default ModelRouter;
