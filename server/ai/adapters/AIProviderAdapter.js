/**
 * ENGINEERVERSE — Abstract AI Provider Adapter
 * Defines the normalized contract for all AI model providers.
 * All concrete providers (Gemini, OpenRouter, etc.) must implement this interface.
 */

import { ERROR_TYPES } from '../types.js';

export class AIProviderAdapter {
  constructor(name, options = {}) {
    if (new.target === AIProviderAdapter) {
      throw new TypeError('Cannot construct AIProviderAdapter directly; subclass it.');
    }
    this.name = name;
    this.options = options;
  }

  /**
   * Whether the provider has the necessary credentials to be called.
   * @returns {boolean}
   */
  isConfigured() {
    throw new Error(`${this.name}.isConfigured() must be implemented.`);
  }

  /**
   * Set of capabilities supported by this provider across its models.
   * @returns {string[]}
   */
  getSupportedCapabilities() {
    throw new Error(`${this.name}.getSupportedCapabilities() must be implemented.`);
  }

  /**
   * Array of available model metadata objects.
   * @returns {Array<{ id: string, name: string, capabilities: string[], isFree: boolean, contextWindow?: number }>}
   */
  getAvailableModels() {
    throw new Error(`${this.name}.getAvailableModels() must be implemented.`);
  }

  /**
   * Discovers and refreshes models dynamically from the provider API.
   * @returns {Promise<Array<object>>}
   */
  async discoverModels() {
    return this.getAvailableModels();
  }

  /**
   * Executes prompt generation using the specified model.
   * @param {object} params
   * @param {string} params.modelId
   * @param {string} params.systemInstruction
   * @param {string} params.prompt
   * @param {Array<{ role: string, content: string }>} [params.messages]
   * @param {number} [params.temperature]
   * @param {number} [params.maxTokens]
   * @param {string} [params.responseFormat] - 'text' | 'json'
   * @param {object} [params.schema]
   * @param {number} [params.timeoutMs]
   * @returns {Promise<object>} Normalized AI response
   */
  async generate(params) {
    throw new Error(`${this.name}.generate() must be implemented.`);
  }

  /**
   * Classifies raw provider errors into canonical ERROR_TYPES.
   * @param {Error|any} err
   * @returns {{ type: string, retryable: boolean, message: string, status?: number }}
   */
  classifyError(err) {
    if (!err) {
      return { type: ERROR_TYPES.UNKNOWN, retryable: false, message: 'Unknown error' };
    }
    const msg = String(err.message || err);
    if (/429|resource_exhausted|rate limit|too many requests/i.test(msg)) {
      return { type: ERROR_TYPES.RATE_LIMIT, retryable: true, message: msg };
    }
    if (/401|403|unauthorized|forbidden|api key|invalid credentials/i.test(msg)) {
      return { type: ERROR_TYPES.AUTH, retryable: false, message: msg };
    }
    if (/404|not found|model not available|deprecated/i.test(msg)) {
      return { type: ERROR_TYPES.NOT_FOUND, retryable: false, message: msg };
    }
    if (/timeout|timed out|abort/i.test(msg)) {
      return { type: ERROR_TYPES.TIMEOUT, retryable: true, message: msg };
    }
    if (/500|502|503|504|server error|internal error/i.test(msg)) {
      return { type: ERROR_TYPES.SERVER_ERROR, retryable: true, message: msg };
    }
    if (/econnrefused|econnreset|fetch failed|network/i.test(msg)) {
      return { type: ERROR_TYPES.NETWORK_ERROR, retryable: true, message: msg };
    }
    return { type: ERROR_TYPES.UNKNOWN, retryable: false, message: msg };
  }

  /**
   * Health check implementation.
   * @returns {Promise<{ healthy: boolean, latencyMs: number, message?: string }>}
   */
  async healthCheck() {
    return { healthy: this.isConfigured(), latencyMs: 0 };
  }

  /**
   * Canonical response normalizer.
   */
  normalizeResponse({
    model,
    text,
    structured = null,
    usage = { inputTokens: 0, outputTokens: 0 },
    latencyMs = 0,
    requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    fallbackAttempt = 0,
  }) {
    return {
      success: true,
      provider: this.name,
      model,
      text: text || '',
      structured,
      usage,
      latencyMs,
      requestId,
      fallbackAttempt,
    };
  }

  /**
   * Canonical error normalizer.
   */
  normalizeError({
    errorType,
    retryable,
    model,
    message,
    fallbackAttempt = 0,
  }) {
    return {
      success: false,
      error: {
        type: errorType,
        retryable,
        provider: this.name,
        model,
        message: message || 'An error occurred during AI execution.',
        fallbackAttempt,
      },
    };
  }
}

export default AIProviderAdapter;
