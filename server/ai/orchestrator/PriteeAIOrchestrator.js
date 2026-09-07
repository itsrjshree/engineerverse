/**
 * ENGINEERVERSE — Pritee AI Orchestrator
 * Central intelligence engine coordinating classification, provider-agnostic routing,
 * circuit-breaker protected execution, cross-provider fallbacks, and structured validation.
 */

import { aiConfig } from '../config.js';
import { globalProviderRegistry } from '../registry/ProviderRegistry.js';
import { globalHealthRegistry } from '../registry/HealthRegistry.js';
import { ModelRouter } from '../router/ModelRouter.js';
import { classifyRequest } from '../classifier/RequestClassifier.js';
import { StructuredOutputValidator } from '../validation/StructuredOutputValidator.js';
import { globalTelemetry } from '../telemetry/AITelemetry.js';
import {
  PRITEE_GRACEFUL_FALLBACK_TEXT,
  getSystemInstructionForMode,
} from '../personality/PriteePrompts.js';
import { GeminiProvider } from '../adapters/GeminiProvider.js';
import { OpenRouterProvider } from '../adapters/OpenRouterProvider.js';
import { ERROR_TYPES } from '../types.js';

export class PriteeAIOrchestrator {
  constructor(options = {}) {
    this.config = { ...aiConfig, ...options };
    this.providerRegistry = options.providerRegistry || globalProviderRegistry;
    this.healthRegistry = options.healthRegistry || globalHealthRegistry;
    this.telemetry = options.telemetry || globalTelemetry;

    // Initialize & register default providers if not explicitly disabled
    if (options.autoRegisterProviders !== false && !options.providerRegistry) {
      this._initializeProviders();
    }

    this.router = new ModelRouter({
      providerRegistry: this.providerRegistry,
      healthRegistry: this.healthRegistry,
      costPolicy: this.config.costPolicy,
    });
  }

  _initializeProviders() {
    // Register Gemini Provider if not already present
    if (!this.providerRegistry.getProvider('gemini')) {
      this.providerRegistry.registerProvider(
        new GeminiProvider({ geminiApiKey: this.config.geminiApiKey })
      );
    }

    // Register OpenRouter Provider if not already present
    if (!this.providerRegistry.getProvider('openrouter')) {
      this.providerRegistry.registerProvider(
        new OpenRouterProvider({
          openrouterApiKey: this.config.openrouterApiKey,
          modelCacheTtlMs: this.config.modelCacheTtlMs,
        })
      );
    }
  }

  /**
   * Main conversational interface for Pritee Mentor inquiries.
   */
  async askPritee({ question, mode = 'engineer', context = {}, format = 'text', schema = null }) {
    const classified = classifyRequest({
      question,
      mode,
      format,
      structured: Boolean(schema || format === 'json'),
      context,
    });

    const systemInstruction = getSystemInstructionForMode(mode);

    return this.execute({
      classified,
      systemInstruction,
      prompt: question,
      schema,
    });
  }

  /**
   * Generalized execution engine with routing, retries, and cross-provider fallbacks.
   */
  async execute({
    classified,
    systemInstruction = '',
    prompt = '',
    messages = [],
    schema = null,
  }) {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const routePlan = this.router.route(classified);

    const candidates = [];
    if (routePlan.primary) candidates.push(routePlan.primary);
    if (routePlan.fallbacks && routePlan.fallbacks.length > 0) {
      candidates.push(...routePlan.fallbacks);
    }

    // If no candidate is available due to config, cost policy, or circuit breakers
    if (candidates.length === 0) {
      this.telemetry.logAttempt({
        requestId,
        task: classified.task,
        provider: 'none',
        model: 'none',
        attempt: 0,
        success: false,
        errorType: ERROR_TYPES.NOT_FOUND,
        latencyMs: 0,
      });

      return {
        success: false,
        isFinalFallback: true,
        text: PRITEE_GRACEFUL_FALLBACK_TEXT,
        structured: null,
        error: {
          type: ERROR_TYPES.NOT_FOUND,
          message: 'No eligible AI providers or models available under current policy/credentials.',
        },
        requestId,
      };
    }

    let fallbackAttempt = 0;
    const maxFallbacks = Math.min(candidates.length, this.config.maxFallbacks);

    for (let i = 0; i < maxFallbacks; i++) {
      const candidate = candidates[i];
      const providerAdapter = this.providerRegistry.getProvider(candidate.provider);

      if (!providerAdapter) continue;

      let retriesLeft = this.config.maxRetries;
      let candidateSucceeded = false;
      let lastError = null;

      while (retriesLeft >= 0 && !candidateSucceeded) {
        const attemptStartTime = Date.now();

        try {
          const result = await providerAdapter.generate({
            modelId: candidate.modelId,
            systemInstruction,
            prompt,
            messages,
            responseFormat: classified.format,
            schema,
            timeoutMs: this.config.requestTimeoutMs,
          });

          const latencyMs = Date.now() - attemptStartTime;

          if (result.success) {
            // Check structured validation if requested
            if (classified.structured || classified.format === 'json') {
              const validation = StructuredOutputValidator.validate(result.text, schema);
              if (!validation.valid) {
                // If model failed to produce valid JSON, treat as error and try next
                const valErr = new Error(validation.error);
                valErr.type = ERROR_TYPES.MALFORMED_OUTPUT;
                throw valErr;
              }
              result.structured = validation.data;
            }

            // Record success in health registry and telemetry
            this.healthRegistry.recordSuccess(candidate.provider, candidate.modelId, latencyMs);
            this.telemetry.logAttempt({
              requestId,
              task: classified.task,
              provider: candidate.provider,
              model: candidate.modelId,
              attempt: fallbackAttempt,
              success: true,
              latencyMs,
              tokens: result.usage,
            });

            return {
              ...result,
              requestId,
              fallbackAttempt,
            };
          } else {
            // Result returned error object
            const errorObj = new Error(result.error?.message || 'Provider execution failed');
            errorObj.type = result.error?.type || ERROR_TYPES.UNKNOWN;
            errorObj.retryable = result.error?.retryable || false;
            throw errorObj;
          }
        } catch (err) {
          const latencyMs = Date.now() - attemptStartTime;
          const errorType = err.type || ERROR_TYPES.UNKNOWN;
          const isRetryable = err.retryable !== false && errorType !== ERROR_TYPES.AUTH && errorType !== ERROR_TYPES.NOT_FOUND;

          lastError = err;

          // Record failure in health registry
          this.healthRegistry.recordFailure(candidate.provider, candidate.modelId, errorType);

          this.telemetry.logAttempt({
            requestId,
            task: classified.task,
            provider: candidate.provider,
            model: candidate.modelId,
            attempt: fallbackAttempt,
            success: false,
            errorType,
            latencyMs,
          });

          // If error is not retryable (e.g. invalid API key), break immediately to fallback
          if (!isRetryable) {
            break;
          }

          retriesLeft -= 1;
          const baseBackoff = this.config.backoffBaseMs !== undefined ? this.config.backoffBaseMs : 1000;
          if (retriesLeft >= 0 && baseBackoff > 0) {
            // Exponential backoff with jitter
            const backoffMs = Math.min(baseBackoff * Math.pow(2, this.config.maxRetries - retriesLeft), 4000) + Math.floor(Math.random() * 200);
            await new Promise((resolve) => setTimeout(resolve, backoffMs));
          }
        }
      }

      // Candidate failed across all retries, advance to next candidate
      fallbackAttempt += 1;
    }

    // All candidates failed — return graceful final failure
    return {
      success: false,
      isFinalFallback: true,
      text: PRITEE_GRACEFUL_FALLBACK_TEXT,
      structured: null,
      error: {
        type: ERROR_TYPES.SERVER_ERROR,
        message: 'All configured AI providers exhausted or unavailable.',
      },
      requestId,
      fallbackAttempt,
    };
  }

  /**
   * Internal diagnostics for administrative inspection.
   */
  getDiagnostics() {
    return {
      policy: this.config.costPolicy,
      circuitBreakerEnabled: this.config.circuitBreakerEnabled,
      providers: this.providerRegistry.getAllProviders().map((p) => ({
        name: p.name,
        configured: p.isConfigured(),
        modelsCount: p.getAvailableModels().length,
      })),
      health: this.healthRegistry.getAllHealth(),
      telemetry: this.telemetry.getMetrics(),
    };
  }
}

export const globalPriteeOrchestrator = new PriteeAIOrchestrator();
export default globalPriteeOrchestrator;
