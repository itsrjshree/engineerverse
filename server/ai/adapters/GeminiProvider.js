/**
 * ENGINEERVERSE — Gemini AI Provider Adapter
 * Uses @google/genai SDK with server-side GEMINI_API_KEY.
 * Adheres strictly to modern, active models (gemini-3.8-flash).
 * Zero deprecated models (gemini-1.5, gemini-2.0, gemini-2.5, gemini-pro strictly prohibited).
 */

import { GoogleGenAI } from '@google/genai';
import { AIProviderAdapter } from './AIProviderAdapter.js';
import { CAPABILITY_TYPES, ERROR_TYPES } from '../types.js';

export const GEMINI_CONFIGURED_MODELS = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    isFree: true,
    capabilities: [
      CAPABILITY_TYPES.REASONING,
      CAPABILITY_TYPES.GENERAL_CHAT,
      CAPABILITY_TYPES.EDUCATIONAL_EXPLANATION,
      CAPABILITY_TYPES.STRUCTURED_JSON,
      CAPABILITY_TYPES.FAST_RESPONSE,
      CAPABILITY_TYPES.LOW_COST_FREE,
    ],
    contextWindow: 1048576,
    priority: 10,
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    isFree: true,
    capabilities: [
      CAPABILITY_TYPES.GENERAL_CHAT,
      CAPABILITY_TYPES.FAST_RESPONSE,
      CAPABILITY_TYPES.LOW_COST_FREE,
    ],
    contextWindow: 1048576,
    priority: 8,
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro (Preview)',
    isFree: false, // Paid only model per system skill guidelines
    capabilities: [
      CAPABILITY_TYPES.REASONING,
      CAPABILITY_TYPES.HIGH_QUALITY,
      CAPABILITY_TYPES.LONG_CONTEXT,
      CAPABILITY_TYPES.STRUCTURED_JSON,
    ],
    contextWindow: 2097152,
    priority: 5,
  },
];

export class GeminiProvider extends AIProviderAdapter {
  constructor(config = {}) {
    super('gemini', config);
    this.apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY || '';
    this.client = null;
    this.models = [...GEMINI_CONFIGURED_MODELS];
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey !== 'MY_GEMINI_API_KEY');
  }

  getClient() {
    if (!this.isConfigured()) return null;
    if (!this.client) {
      this.client = new GoogleGenAI({
        apiKey: this.apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'engineerverse-platform',
          },
        },
      });
    }
    return this.client;
  }

  getSupportedCapabilities() {
    const caps = new Set();
    this.models.forEach((m) => m.capabilities.forEach((c) => caps.add(c)));
    return Array.from(caps);
  }

  getAvailableModels() {
    return this.models;
  }

  async discoverModels() {
    // Return verified current Gemini models
    return this.models;
  }

  classifyError(err) {
    if (!err) {
      return { type: ERROR_TYPES.UNKNOWN, retryable: false, message: 'Unknown Gemini error' };
    }
    const msg = String(err.message || err);
    const status = err.status || err.statusCode;

    if (status === 429 || /429|resource_exhausted|quota|rate limit/i.test(msg)) {
      return { type: ERROR_TYPES.RATE_LIMIT, retryable: true, message: msg, status: 429 };
    }
    if (status === 401 || status === 403 || /401|403|api_key_invalid|invalid api key|permission_denied/i.test(msg)) {
      return { type: ERROR_TYPES.AUTH, retryable: false, message: msg, status: status || 401 };
    }
    if (status === 404 || /not_found|model not found|unsupported model/i.test(msg)) {
      return { type: ERROR_TYPES.NOT_FOUND, retryable: false, message: msg, status: 404 };
    }
    if (err.name === 'AbortError' || /timeout|timed out/i.test(msg)) {
      return { type: ERROR_TYPES.TIMEOUT, retryable: true, message: msg };
    }
    if (status >= 500 || /internal|server error|unavailable|503/i.test(msg)) {
      return { type: ERROR_TYPES.SERVER_ERROR, retryable: true, message: msg, status: status || 500 };
    }

    return super.classifyError(err);
  }

  async generate({
    modelId = 'gemini-3.8-flash',
    systemInstruction = '',
    prompt = '',
    messages = [],
    temperature = 0.7,
    maxTokens = 1000,
    responseFormat = 'text',
    schema = null,
    timeoutMs = 30000,
  }) {
    const client = this.getClient();
    if (!client) {
      const err = new Error('Gemini API key is unconfigured or invalid.');
      return this.normalizeError({
        errorType: ERROR_TYPES.AUTH,
        retryable: false,
        model: modelId,
        message: err.message,
      });
    }

    const startTime = Date.now();

    // Prepare contents: merge conversation messages or prompt
    let contents = prompt;
    if (messages && messages.length > 0) {
      contents = messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
      if (prompt) contents += `\n\nUSER: ${prompt}`;
    }

    const generationConfig = {
      systemInstruction,
      temperature,
      maxOutputTokens: maxTokens,
    };

    if (responseFormat === 'json') {
      generationConfig.responseMimeType = 'application/json';
      if (schema) {
        generationConfig.responseSchema = schema;
      }
    }

    // Wrap call in timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const responsePromise = client.models.generateContent({
        model: modelId,
        contents,
        config: generationConfig,
      });

      const response = await Promise.race([
        responsePromise,
        new Promise((_, reject) => {
          controller.signal.addEventListener('abort', () => {
            const abortErr = new Error(`Gemini request timed out after ${timeoutMs}ms`);
            abortErr.name = 'AbortError';
            reject(abortErr);
          });
        }),
      ]);

      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;
      const textOutput = response.text || '';

      let structured = null;
      if (responseFormat === 'json' && textOutput) {
        try {
          structured = JSON.parse(textOutput);
        } catch (_) {
          // Leave structured as null for StructuredOutputValidator to recover
        }
      }

      const inputTokens = response.usageMetadata?.promptTokenCount || 0;
      const outputTokens = response.usageMetadata?.candidatesTokenCount || 0;

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
      return { healthy: false, latencyMs: 0, message: 'Gemini API key not configured' };
    }
    const client = this.getClient();
    if (!client) {
      return { healthy: false, latencyMs: 0, message: 'Client initialization failed' };
    }
    return { healthy: true, latencyMs: 10 };
  }
}

export default GeminiProvider;
