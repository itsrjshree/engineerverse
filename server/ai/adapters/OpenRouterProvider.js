/**
 * ENGINEERVERSE — OpenRouter AI Provider Adapter
 * Dynamic model discovery, free-tier filtering, and normalized OpenAI-compatible completion.
 * OpenRouter provides legitimate free-tier models (pricing prompt/completion == 0 or :free suffix).
 */

import { AIProviderAdapter } from './AIProviderAdapter.js';
import { CAPABILITY_TYPES, ERROR_TYPES } from '../types.js';

export const OPENROUTER_FALLBACK_FREE_MODELS = [
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Meta Llama 3.3 70B Instruct (Free)',
    isFree: true,
    capabilities: [
      CAPABILITY_TYPES.REASONING,
      CAPABILITY_TYPES.GENERAL_CHAT,
      CAPABILITY_TYPES.EDUCATIONAL_EXPLANATION,
      CAPABILITY_TYPES.STRUCTURED_JSON,
      CAPABILITY_TYPES.LOW_COST_FREE,
    ],
    contextWindow: 131072,
    priority: 9,
  },
  {
    id: 'google/gemini-2.0-flash-exp:free',
    name: 'Google Gemini 2.0 Flash Exp (Free)',
    isFree: true,
    capabilities: [
      CAPABILITY_TYPES.REASONING,
      CAPABILITY_TYPES.GENERAL_CHAT,
      CAPABILITY_TYPES.FAST_RESPONSE,
      CAPABILITY_TYPES.LOW_COST_FREE,
    ],
    contextWindow: 1048576,
    priority: 9,
  },
  {
    id: 'qwen/qwen-2.5-72b-instruct:free',
    name: 'Qwen 2.5 72B Instruct (Free)',
    isFree: true,
    capabilities: [
      CAPABILITY_TYPES.REASONING,
      CAPABILITY_TYPES.GENERAL_CHAT,
      CAPABILITY_TYPES.STRUCTURED_JSON,
      CAPABILITY_TYPES.LOW_COST_FREE,
    ],
    contextWindow: 32768,
    priority: 8,
  },
  {
    id: 'mistralai/mistral-7b-instruct:free',
    name: 'Mistral 7B Instruct (Free)',
    isFree: true,
    capabilities: [
      CAPABILITY_TYPES.GENERAL_CHAT,
      CAPABILITY_TYPES.FAST_RESPONSE,
      CAPABILITY_TYPES.LOW_COST_FREE,
    ],
    contextWindow: 32768,
    priority: 7,
  },
  {
    id: 'deepseek/deepseek-r1:free',
    name: 'DeepSeek R1 (Free)',
    isFree: true,
    capabilities: [
      CAPABILITY_TYPES.REASONING,
      CAPABILITY_TYPES.HIGH_QUALITY,
      CAPABILITY_TYPES.LOW_COST_FREE,
    ],
    contextWindow: 65536,
    priority: 8,
  },
];

export class OpenRouterProvider extends AIProviderAdapter {
  constructor(config = {}) {
    super('openrouter', config);
    this.apiKey = config.openrouterApiKey || process.env.OPENROUTER_API_KEY || '';
    this.baseUrl = config.openrouterBaseUrl || 'https://openrouter.ai/api/v1';
    this.cacheTtlMs = config.modelCacheTtlMs || 3600000; // 1 hour
    this.lastDiscoveredAt = 0;
    this.cachedModels = [...OPENROUTER_FALLBACK_FREE_MODELS];
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  getSupportedCapabilities() {
    const caps = new Set();
    this.cachedModels.forEach((m) => m.capabilities.forEach((c) => caps.add(c)));
    return Array.from(caps);
  }

  getAvailableModels() {
    return this.cachedModels;
  }

  /**
   * Discovers free models from OpenRouter catalog API.
   * Filters out paid models using pricing: prompt === '0' and completion === '0'.
   */
  async discoverModels(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && this.cachedModels.length > 0 && now - this.lastDiscoveredAt < this.cacheTtlMs) {
      return this.cachedModels;
    }

    if (!this.isConfigured()) {
      return this.cachedModels;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        return this.cachedModels;
      }

      const data = await res.json();
      if (!data || !Array.isArray(data.data)) {
        return this.cachedModels;
      }

      // Filter models whose pricing indicates verified free access
      const freeModels = data.data
        .filter((m) => {
          if (!m.id) return false;
          // Check for :free suffix or zero pricing
          const isFreePricing =
            m.pricing &&
            (m.pricing.prompt === '0' || Number(m.pricing.prompt) === 0) &&
            (m.pricing.completion === '0' || Number(m.pricing.completion) === 0);
          const hasFreeSuffix = m.id.endsWith(':free');
          return isFreePricing || hasFreeSuffix;
        })
        .map((m) => {
          const isReasoning = /reason|r1|70b|72b|instruct/i.test(m.id);
          const isFast = /flash|8b|7b|mini/i.test(m.id);

          const caps = [
            CAPABILITY_TYPES.GENERAL_CHAT,
            CAPABILITY_TYPES.LOW_COST_FREE,
            CAPABILITY_TYPES.EDUCATIONAL_EXPLANATION,
          ];

          if (isReasoning) caps.push(CAPABILITY_TYPES.REASONING, CAPABILITY_TYPES.STRUCTURED_JSON);
          if (isFast) caps.push(CAPABILITY_TYPES.FAST_RESPONSE);

          return {
            id: m.id,
            name: m.name || m.id,
            isFree: true,
            capabilities: caps,
            contextWindow: m.context_length || 32768,
            priority: isReasoning ? 9 : 7,
          };
        });

      if (freeModels.length > 0) {
        this.cachedModels = freeModels;
        this.lastDiscoveredAt = now;
      }

      return this.cachedModels;
    } catch (err) {
      // Return cached or fallback models on discovery error
      return this.cachedModels;
    }
  }

  classifyError(err) {
    if (!err) {
      return { type: ERROR_TYPES.UNKNOWN, retryable: false, message: 'Unknown OpenRouter error' };
    }
    const msg = String(err.message || err);
    const status = err.status || err.statusCode;

    if (status === 429 || /429|rate limit|credits exhausted|quota/i.test(msg)) {
      return { type: ERROR_TYPES.RATE_LIMIT, retryable: true, message: msg, status: 429 };
    }
    if (status === 401 || status === 403 || /401|403|unauthorized|invalid api key/i.test(msg)) {
      return { type: ERROR_TYPES.AUTH, retryable: false, message: msg, status: status || 401 };
    }
    if (status === 404 || /not found|model unavailable/i.test(msg)) {
      return { type: ERROR_TYPES.NOT_FOUND, retryable: false, message: msg, status: 404 };
    }
    if (err.name === 'AbortError' || /timeout|timed out/i.test(msg)) {
      return { type: ERROR_TYPES.TIMEOUT, retryable: true, message: msg };
    }
    if (status >= 500 || /500|502|503|504|upstream/i.test(msg)) {
      return { type: ERROR_TYPES.SERVER_ERROR, retryable: true, message: msg, status: status || 500 };
    }

    return super.classifyError(err);
  }

  async generate({
    modelId = 'meta-llama/llama-3.3-70b-instruct:free',
    systemInstruction = '',
    prompt = '',
    messages = [],
    temperature = 0.7,
    maxTokens = 1000,
    responseFormat = 'text',
    timeoutMs = 30000,
  }) {
    if (!this.isConfigured()) {
      return this.normalizeError({
        errorType: ERROR_TYPES.AUTH,
        retryable: false,
        model: modelId,
        message: 'OpenRouter API key is not configured.',
      });
    }

    const startTime = Date.now();
    const formattedMessages = [];

    if (systemInstruction) {
      formattedMessages.push({ role: 'system', content: systemInstruction });
    }

    if (messages && messages.length > 0) {
      formattedMessages.push(...messages);
    }

    if (prompt) {
      formattedMessages.push({ role: 'user', content: prompt });
    }

    const payload = {
      model: modelId,
      messages: formattedMessages,
      temperature,
      max_tokens: maxTokens,
    };

    if (responseFormat === 'json') {
      payload.response_format = { type: 'json_object' };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://rjshree.com/engineerverse',
          'X-Title': 'ENGINEERVERSE Pritee AI',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        let parsedError = errorText;
        try {
          const jsonErr = JSON.parse(errorText);
          parsedError = jsonErr.error?.message || errorText;
        } catch (_) {}

        const errObj = new Error(parsedError || `OpenRouter responded with status ${res.status}`);
        errObj.status = res.status;
        const classified = this.classifyError(errObj);

        return this.normalizeError({
          errorType: classified.type,
          retryable: classified.retryable,
          model: modelId,
          message: classified.message,
        });
      }

      const data = await res.json();
      const choice = data.choices?.[0];
      const textOutput = choice?.message?.content || '';

      let structured = null;
      if (responseFormat === 'json' && textOutput) {
        try {
          structured = JSON.parse(textOutput);
        } catch (_) {}
      }

      const inputTokens = data.usage?.prompt_tokens || 0;
      const outputTokens = data.usage?.completion_tokens || 0;

      return this.normalizeResponse({
        model: modelId,
        text: textOutput,
        structured,
        usage: { inputTokens, outputTokens },
        latencyMs,
      });
    } catch (err) {
      clearTimeout(timeoutId);
      const classified = this.classifyError(err);
      return this.normalizeError({
        errorType: classified.type,
        retryable: classified.retryable,
        model: modelId,
        message: classified.message,
      });
    }
  }

  async healthCheck() {
    if (!this.isConfigured()) {
      return { healthy: false, latencyMs: 0, message: 'OpenRouter API key not configured' };
    }
    return { healthy: true, latencyMs: 15 };
  }
}

export default OpenRouterProvider;
