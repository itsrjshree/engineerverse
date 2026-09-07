/**
 * ENGINEERVERSE — Pritee AI Orchestration Configuration
 * Loads AI runtime configurations, API keys, rate limits, and policies.
 * Never leaks credentials.
 */

import dotenv from 'dotenv';
dotenv.config();

import { COST_POLICY } from './types.js';

export const aiConfig = {
  // Cost Policy: 'free_only' (default), 'free_preferred', 'balanced', 'paid_enabled'
  costPolicy: process.env.AI_COST_POLICY || COST_POLICY.FREE_ONLY,

  // Provider Keys
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  openrouterApiKey: process.env.OPENROUTER_API_KEY || '',

  // Runtime Controls
  requestTimeoutMs: parseInt(process.env.AI_REQUEST_TIMEOUT_MS || '30000', 10),
  maxRetries: parseInt(process.env.AI_MAX_RETRIES || '2', 10),
  maxFallbacks: parseInt(process.env.AI_MAX_FALLBACKS || '3', 10),

  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.AI_RATE_LIMIT_WINDOW_MS || '60000', 10),
  rateLimitMaxRequests: parseInt(process.env.AI_RATE_LIMIT_MAX_REQUESTS || '10', 10),

  // Model Discovery & Cache
  modelDiscoveryEnabled: process.env.AI_MODEL_DISCOVERY_ENABLED !== 'false',
  modelCacheTtlMs: parseInt(process.env.AI_MODEL_CACHE_TTL_MS || '3600000', 10), // 1 hour

  // Health & Circuit Breaker
  healthCheckEnabled: process.env.AI_HEALTH_CHECK_ENABLED !== 'false',
  circuitBreakerEnabled: process.env.AI_CIRCUIT_BREAKER_ENABLED !== 'false',
  cooldownMs: parseInt(process.env.AI_COOLDOWN_MS || '60000', 10), // 1 minute
  consecutiveFailureThreshold: 2,
};

export default aiConfig;
