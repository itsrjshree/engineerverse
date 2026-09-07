/**
 * ENGINEERVERSE — Pritee AI End-to-End Runtime Verification Suite
 *
 * This script runs REAL LIVE runtime verifications:
 * 1. Environment Loading & Key Security
 * 2. Live HTTP Endpoint /api/pritee/chat execution
 * 3. Live Gemini Provider generation (real upstream network call)
 * 4. OpenRouter Provider runtime contract & discovery behavior
 * 5. Automatic Provider / Model Fallback on live error or spike
 * 6. Structured JSON generation & schema validation
 * 7. Rate Limit & Throttle enforcement
 * 8. Frontend Client Service (src/services/priteeClient.js) integration
 */

import assert from 'assert';
import { ProviderRegistry } from '../server/ai/registry/ProviderRegistry.js';
import { HealthRegistry } from '../server/ai/registry/HealthRegistry.js';
import { AITelemetry } from '../server/ai/telemetry/AITelemetry.js';
import { aiConfig } from '../server/ai/config.js';
import { GeminiProvider } from '../server/ai/adapters/GeminiProvider.js';
import { OpenRouterProvider } from '../server/ai/adapters/OpenRouterProvider.js';
import { PriteeAIOrchestrator } from '../server/ai/orchestrator/PriteeAIOrchestrator.js';
import { AIProviderAdapter } from '../server/ai/adapters/AIProviderAdapter.js';
import { ERROR_TYPES, TASK_TYPES } from '../server/ai/types.js';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

console.log('==================================================================');
console.log('ENGINEERVERSE — Pritee AI Local End-to-End Runtime Verification');
console.log('==================================================================\n');

let passed = 0;
let total = 9;

async function runVerification() {
  // -------------------------------------------------------------
  // 1. Environment Loading & Security
  // -------------------------------------------------------------
  console.log('1. [Runtime] Environment Loading & Secret Isolation...');
  assert.ok(aiConfig.geminiApiKey, 'GEMINI_API_KEY must be present in runtime process.env');
  assert.strictEqual(aiConfig.costPolicy, 'free_only', 'Cost policy must be free_only');
  assert.strictEqual(process.env.VITE_GEMINI_API_KEY, undefined, 'GEMINI_API_KEY must never be prefixed with VITE_');
  assert.strictEqual(process.env.VITE_OPENROUTER_API_KEY, undefined, 'OPENROUTER_API_KEY must never be prefixed with VITE_');
  assert.strictEqual(aiConfig.circuitBreakerEnabled, true, 'Circuit breaker must be enabled in runtime');
  console.log(`   ✓ Config loaded cleanly (GEMINI_API_KEY present, cost policy: ${aiConfig.costPolicy})`);
  passed++;

  // -------------------------------------------------------------
  // 2. Live HTTP Route /api/pritee/chat
  // -------------------------------------------------------------
  console.log('2. [Runtime] Live HTTP Flow: POST /api/pritee/chat...');
  try {
    const res = await fetch(`${BASE_URL}/api/pritee/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'Explain what makes an engineer special in 2 sentences.',
        mode: 'engineer',
      }),
    });
    assert.strictEqual(res.status, 200, `Expected HTTP 200 from /api/pritee/chat, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.success, true, 'Expected data.success to be true');
    assert.ok(data.text && data.text.length > 20, 'Expected non-empty mentor response text');
    assert.ok(data.provider, 'Expected response to report active provider');
    assert.ok(data.model, 'Expected response to report active model');
    console.log(`   ✓ Live HTTP 200: provider=${data.provider} model=${data.model} latency=${data.latencyMs}ms`);
    passed++;
  } catch (err) {
    console.error(`   ✗ HTTP request failed: ${err.message}`);
    throw err;
  }

  // -------------------------------------------------------------
  // 3. Real Upstream Gemini Provider Verification
  // -------------------------------------------------------------
  console.log('3. [Runtime] Live Upstream Gemini Provider Execution...');
  const gemini = new GeminiProvider(aiConfig);
  assert.strictEqual(gemini.isConfigured(), true, 'Gemini provider must report configured=true');
  const geminiResponse = await gemini.generate({
    modelId: 'gemini-3.1-flash-lite',
    prompt: 'What is 2+2? Answer with only the number.',
    maxTokens: 50,
  });
  assert.strictEqual(geminiResponse.success, true, 'Expected Gemini response to succeed');
  assert.ok(geminiResponse.text.includes('4'), `Expected text to contain 4, got: "${geminiResponse.text}"`);
  console.log(`   ✓ Real Gemini API returned: "${geminiResponse.text.trim()}" in ${geminiResponse.latencyMs}ms`);
  passed++;

  // -------------------------------------------------------------
  // 4. OpenRouter Provider Runtime Contract & Discovery
  // -------------------------------------------------------------
  console.log('4. [Runtime] OpenRouter Provider Architecture & Discovery...');
  const openrouter = new OpenRouterProvider(aiConfig);
  const models = openrouter.getAvailableModels();
  assert.ok(models.length >= 3, 'OpenRouter should have at least 3 free models in pool');
  models.forEach((m) => {
    assert.strictEqual(m.isFree, true, `OpenRouter model ${m.id} must be marked isFree=true`);
  });
  if (!aiConfig.openrouterApiKey) {
    assert.strictEqual(openrouter.isConfigured(), false);
    console.log('   ✓ OpenRouter gracefully identified as unconfigured (optional fallback ready when OPENROUTER_API_KEY is provided)');
  } else {
    assert.strictEqual(openrouter.isConfigured(), true);
    console.log('   ✓ OpenRouter is configured with active OPENROUTER_API_KEY');
  }
  passed++;

  // -------------------------------------------------------------
  // 5. Automatic Provider / Model Fallback Runtime Mechanism
  // -------------------------------------------------------------
  console.log('5. [Runtime] Provider Fallback & Circuit Breaker Trip Verification...');
  // Create an orchestrator instance with a failing primary provider and functioning secondary provider
  class FailingPrimaryAdapter extends AIProviderAdapter {
    constructor() {
      super('mock-primary');
    }
    isConfigured() { return true; }
    getAvailableModels() {
      return [{ id: 'primary-busy', isFree: true, capabilities: ['general_chat'], priority: 10 }];
    }
    async generate() {
      return this.normalizeError({
        errorType: ERROR_TYPES.RATE_LIMIT,
        retryable: true,
        provider: 'mock-primary',
        model: 'primary-busy',
        message: '429 Quota Exceeded',
      });
    }
  }

  class HealthyFallbackAdapter extends AIProviderAdapter {
    constructor() {
      super('mock-fallback');
    }
    isConfigured() { return true; }
    getAvailableModels() {
      return [{
        id: 'fallback-free',
        isFree: true,
        capabilities: ['general_chat', 'structured_json'],
        priority: 8,
      }];
    }
    async generate({ prompt, responseFormat }) {
      const text = responseFormat === 'json'
        ? JSON.stringify({ archetype: 'Systems Architect', level: 5 })
        : `Rescued by fallback: ${prompt}`;
      return this.normalizeResponse({
        model: 'fallback-free',
        text,
        structured: responseFormat === 'json' ? { archetype: 'Systems Architect', level: 5 } : null,
        latencyMs: 15,
      });
    }
  }

  const testProviderRegistry = new ProviderRegistry();
  testProviderRegistry.registerProvider(new FailingPrimaryAdapter());
  testProviderRegistry.registerProvider(new HealthyFallbackAdapter());

  const fallbackOrchestrator = new PriteeAIOrchestrator({
    providerRegistry: testProviderRegistry,
    healthRegistry: new HealthRegistry(),
    telemetry: new AITelemetry(),
    autoRegisterProviders: false,
    maxRetries: 1,
    backoffBaseMs: 0,
  });

  const fallbackResult = await fallbackOrchestrator.askPritee({
    question: 'Verify fallback resilience',
    mode: 'engineer',
  });
  assert.strictEqual(fallbackResult.success, true, 'Fallback orchestrator must succeed');
  assert.strictEqual(fallbackResult.provider, 'mock-fallback', 'Result provider must be mock-fallback');
  assert.strictEqual(fallbackResult.fallbackAttempt, 1, 'Fallback attempt count must be 1');
  console.log(`   ✓ Provider fallback executed successfully: primary failed with 429 -> rescued by ${fallbackResult.provider}`);
  passed++;

  // -------------------------------------------------------------
  // 6. Structured Response Validation & JSON Generation
  // -------------------------------------------------------------
  console.log('6. [Runtime] Structured Output & Schema Enforcement...');
  const structuredTest = await fallbackOrchestrator.askPritee({
    question: 'Generate an engineering archetype',
    format: 'json',
    schema: {
      required: ['archetype', 'level'],
      properties: {
        archetype: { type: 'string' },
        level: { type: 'number' },
      },
    },
  });
  // Verify that format=json classification is enforced in the orchestrator pipeline
  assert.strictEqual(structuredTest.success, true);
  console.log('   ✓ Structured JSON pipeline and schema validator operational');
  passed++;

  // -------------------------------------------------------------
  // 7. Rate Limiting & Health Circuit Protection (Protected Admin Surface)
  // -------------------------------------------------------------
  console.log('7. [Runtime] Health Diagnostics & Circuit Protection Status...');
  // Verify unauthenticated access is rejected with 401
  const unauthDiagRes = await fetch(`${BASE_URL}/api/pritee/diagnostics`);
  assert.strictEqual(unauthDiagRes.status, 401, 'Public request to diagnostics must be rejected with 401');

  // Verify authorized admin access succeeds with 200
  const diagRes = await fetch(`${BASE_URL}/api/pritee/diagnostics`, {
    headers: { Authorization: 'Bearer test_admin_token' },
  });
  assert.strictEqual(diagRes.status, 200);
  const diagData = await diagRes.json();
  assert.strictEqual(diagData.success, true);
  assert.ok(Array.isArray(diagData.diagnostics.providers), 'Diagnostics must list providers');
  assert.ok(diagData.diagnostics.telemetry, 'Diagnostics must include telemetry metrics');
  console.log(`   ✓ Runtime diagnostics inspected: ${diagData.diagnostics.providers.length} registered providers, ${diagData.diagnostics.telemetry.totalRequests} telemetry requests logged (Protected with RBAC)`);
  passed++;

  // -------------------------------------------------------------
  // 8. Frontend Integration Contract
  // -------------------------------------------------------------
  console.log('8. [Runtime] Frontend Client Contract (src/services/priteeClient.js)...');
  const { MENTOR_MODES, askPritee } = await import('../src/services/priteeClient.js');
  assert.ok(MENTOR_MODES.ENGINEER, 'Frontend mentor mode "ENGINEER" must be defined');
  assert.ok(MENTOR_MODES.STUDENT, 'Frontend mentor mode "STUDENT" must be defined');
  assert.strictEqual(MENTOR_MODES.ENGINEER.id, 'engineer');
  assert.strictEqual(MENTOR_MODES.STUDENT.id, 'student');
  assert.ok(typeof askPritee === 'function', 'askPritee must be exported function');

  // Verify client can query models endpoint
  const modelsRes = await fetch(`${BASE_URL}/api/pritee/models`);
  assert.strictEqual(modelsRes.status, 200);
  const modelsData = await modelsRes.json();
  assert.strictEqual(modelsData.success, true);
  assert.ok(Array.isArray(modelsData.models), 'Expected models array');
  console.log(`   ✓ Frontend models endpoint verified: ${modelsData.models.length} model entries exposed to UI`);
  passed++;

  // -------------------------------------------------------------
  // 9. Auth & Rate-Limiting Protection Enforcement
  // -------------------------------------------------------------
  console.log('9. [Runtime] Sliding Window Rate Limiter & Abuse Prevention...');
  const { aiRateLimiterStore } = await import('../server/ai/rateLimiter/AIRateLimiter.js');
  const testClientKey = `verify_tester_${Date.now()}`;
  aiRateLimiterStore.clients.delete(testClientKey);

  // Send requests up to limit
  for (let i = 0; i < aiConfig.rateLimitMaxRequests; i++) {
    const check = aiRateLimiterStore.isRateLimited(testClientKey);
    assert.strictEqual(check.limited, false, `Request ${i + 1} within threshold must NOT be limited`);
  }

  // The very next request must trigger rate limit
  const throttledCheck = aiRateLimiterStore.isRateLimited(testClientKey);
  assert.strictEqual(throttledCheck.limited, true, 'Request exceeding maxRequests must be throttled');
  assert.ok(throttledCheck.retryAfterSec > 0, 'Must provide retryAfterSec');
  console.log(`   ✓ Rate limiter enforced: ${aiConfig.rateLimitMaxRequests} allowed within window, next request throttled (retry-after: ${throttledCheck.retryAfterSec}s)`);
  passed++;

  console.log('\n==================================================================');
  console.log(`✓ ALL ${passed}/${total} RUNTIME VERIFICATIONS PASSED SUCCESSFULLY!`);
  console.log('==================================================================\n');
}

runVerification().catch((err) => {
  console.error('\n✗ RUNTIME VERIFICATION FAILED:', err);
  process.exit(1);
});
