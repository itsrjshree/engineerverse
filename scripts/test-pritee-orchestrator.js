/**
 * ENGINEERVERSE — Automated Pritee AI Orchestration Test Suite
 * Tests all 18 architectural scenarios for multi-provider routing, fallbacks,
 * circuit breakers, structured validation, rate limiting, and secret safety.
 */

import assert from 'assert';
import {
  AIProviderAdapter,
  GeminiProvider,
  OpenRouterProvider,
  HealthRegistry,
  ProviderRegistry,
  ModelRouter,
  classifyRequest,
  StructuredOutputValidator,
  PriteeAIOrchestrator,
  AITelemetry,
  PRITEE_GRACEFUL_FALLBACK_TEXT,
  TASK_TYPES,
  CAPABILITY_TYPES,
  COST_POLICY,
  ERROR_TYPES,
  CIRCUIT_BREAKER_STATES,
} from '../server/ai/index.js';

console.log('\n==================================================================');
console.log('--- Running Pritee AI Orchestration Automated Verification Suite ---');
console.log('==================================================================\n');

// Mock adapter helper for deterministic scenario testing
class MockAdapter extends AIProviderAdapter {
  constructor(name, models = [], behavior = {}) {
    super(name);
    this.models = models;
    this.behavior = behavior;
    this.callCount = 0;
    this.configured = behavior.configured !== false;
  }

  isConfigured() {
    return this.configured;
  }

  getSupportedCapabilities() {
    const caps = new Set();
    this.models.forEach((m) => m.capabilities.forEach((c) => caps.add(c)));
    return Array.from(caps);
  }

  getAvailableModels() {
    return this.models;
  }

  async generate(params) {
    this.callCount += 1;
    const modelBehavior = this.behavior[params.modelId] || this.behavior.default || {};

    if (modelBehavior.error) {
      const err = new Error(modelBehavior.error.message || 'Mock failure');
      err.type = modelBehavior.error.type || ERROR_TYPES.SERVER_ERROR;
      err.retryable = modelBehavior.error.retryable;
      throw err;
    }

    if (modelBehavior.timeout) {
      const err = new Error('Mock timeout');
      err.type = ERROR_TYPES.TIMEOUT;
      err.retryable = true;
      throw err;
    }

    return this.normalizeResponse({
      model: params.modelId,
      text: modelBehavior.text || 'Engineering insight response.',
      usage: { inputTokens: 50, outputTokens: 100 },
      latencyMs: 15,
    });
  }
}

async function runAllTests() {
  let passedCount = 0;

  // 1. Gemini Provider Success
  console.log('1. Testing Gemini Provider adapter contracts...');
  const gemini = new GeminiProvider({ geminiApiKey: 'test-key-mock' });
  assert.strictEqual(gemini.name, 'gemini');
  assert.strictEqual(gemini.isConfigured(), true);
  const geminiModels = gemini.getAvailableModels();
  assert.ok(geminiModels.some((m) => m.id === 'gemini-3.8-flash' && m.isFree === true));
  // Zero deprecated models
  assert.ok(!geminiModels.some((m) => m.id.includes('1.5') || m.id.includes('2.0') || m.id === 'gemini-pro'));
  console.log('✓ Gemini adapter verified with active models (gemini-3.8-flash, no deprecated models).');
  passedCount++;

  // 2. OpenRouter Provider Success & Contract
  console.log('2. Testing OpenRouter Provider adapter contracts...');
  const openrouter = new OpenRouterProvider({ openrouterApiKey: 'test-or-key' });
  assert.strictEqual(openrouter.name, 'openrouter');
  assert.strictEqual(openrouter.isConfigured(), true);
  const orModels = openrouter.getAvailableModels();
  assert.ok(orModels.length >= 3, 'Must have initial free models');
  assert.ok(orModels.every((m) => m.isFree === true), 'All initial fallback models must be free');
  console.log('✓ OpenRouter adapter verified with free model pool.');
  passedCount++;

  // 3. Provider Timeout handling
  console.log('3. Testing Provider Timeout error classification...');
  const timeoutErr = new Error('Request timed out after 30000ms');
  timeoutErr.name = 'AbortError';
  const classifiedTimeout = gemini.classifyError(timeoutErr);
  assert.strictEqual(classifiedTimeout.type, ERROR_TYPES.TIMEOUT);
  assert.strictEqual(classifiedTimeout.retryable, true);
  console.log('✓ Timeout classified correctly as retryable TIMEOUT.');
  passedCount++;

  // 4. 429 Rate Limit error classification
  console.log('4. Testing 429 Rate Limit classification...');
  const rateLimitErr = new Error('Resource exhausted: 429 Rate limit reached');
  rateLimitErr.status = 429;
  const classified429 = gemini.classifyError(rateLimitErr);
  assert.strictEqual(classified429.type, ERROR_TYPES.RATE_LIMIT);
  assert.strictEqual(classified429.retryable, true);
  console.log('✓ 429 classified correctly as retryable RATE_LIMIT.');
  passedCount++;

  // 5. 401/403 Invalid key handling (must NOT be retryable)
  console.log('5. Testing 401/403 Auth error classification (non-retryable)...');
  const authErr = new Error('API_KEY_INVALID: 401 Unauthorized');
  authErr.status = 401;
  const classifiedAuth = gemini.classifyError(authErr);
  assert.strictEqual(classifiedAuth.type, ERROR_TYPES.AUTH);
  assert.strictEqual(classifiedAuth.retryable, false, 'Auth errors must NOT be retryable');
  console.log('✓ 401/403 classified as non-retryable AUTH.');
  passedCount++;

  // 6. 404 / Deprecated model handling
  console.log('6. Testing 404 Not Found error classification...');
  const notFoundErr = new Error('Model not found: 404');
  notFoundErr.status = 404;
  const classified404 = gemini.classifyError(notFoundErr);
  assert.strictEqual(classified404.type, ERROR_TYPES.NOT_FOUND);
  assert.strictEqual(classified404.retryable, false);
  console.log('✓ 404 classified as non-retryable NOT_FOUND.');
  passedCount++;

  // 7. 5xx Server Error handling
  console.log('7. Testing 5xx Server Error classification...');
  const serverErr = new Error('Internal Server Error 500');
  serverErr.status = 500;
  const classified500 = openrouter.classifyError(serverErr);
  assert.strictEqual(classified500.type, ERROR_TYPES.SERVER_ERROR);
  assert.strictEqual(classified500.retryable, true);
  console.log('✓ 5xx classified as retryable SERVER_ERROR.');
  passedCount++;

  // 8. Malformed response & JSON recovery
  console.log('8. Testing Structured Output Validator & Markdown Recovery...');
  // Case A: Direct JSON
  const directRes = StructuredOutputValidator.validate('{"answer": "GPS uses relativity"}');
  assert.strictEqual(directRes.valid, true);
  assert.strictEqual(directRes.data.answer, 'GPS uses relativity');

  // Case B: Wrapped in markdown code block
  const markdownRes = StructuredOutputValidator.validate(
    'Here is the analysis:\n```json\n{"plan": "Step 1: Isolate constraints"}\n```\nHope this helps!'
  );
  assert.strictEqual(markdownRes.valid, true);
  assert.strictEqual(markdownRes.data.plan, 'Step 1: Isolate constraints');

  // Case C: Unescaped conversational wrapper
  const conversationalRes = StructuredOutputValidator.validate(
    'Sure thing! {"score": 95, "status": "approved"}. What else would you like to know?'
  );
  assert.strictEqual(conversationalRes.valid, true);
  assert.strictEqual(conversationalRes.data.score, 95);

  // Case D: Schema enforcement
  const schemaRes = StructuredOutputValidator.validate('{"missing": true}', {
    required: ['expectedField'],
  });
  assert.strictEqual(schemaRes.valid, false);
  assert.ok(schemaRes.error.includes('Missing required schema field'));
  console.log('✓ StructuredOutputValidator recovered JSON from code blocks, text wrappers, and verified schemas.');
  passedCount++;

  // 9. Circuit Breaker trip & Cooldown
  console.log('9. Testing Circuit Breaker tripping and cooldown mechanics...');
  const healthReg = new HealthRegistry({ cooldownMs: 200, consecutiveFailureThreshold: 2 });
  assert.strictEqual(healthReg.isAvailable('provider-a', 'model-1'), true);

  // Failure 1
  healthReg.recordFailure('provider-a', 'model-1', ERROR_TYPES.SERVER_ERROR);
  assert.strictEqual(healthReg.isAvailable('provider-a', 'model-1'), true, 'Still available after 1 failure');

  // Failure 2 -> Should trip circuit breaker to OPEN
  healthReg.recordFailure('provider-a', 'model-1', ERROR_TYPES.SERVER_ERROR);
  const healthAfterTrip = healthReg.getHealth('provider-a', 'model-1');
  assert.strictEqual(healthAfterTrip.circuitBreakerState, CIRCUIT_BREAKER_STATES.OPEN);
  assert.strictEqual(healthReg.isAvailable('provider-a', 'model-1'), false, 'Should be in cooldown');

  // Wait for cooldown to test HALF_OPEN transition
  await new Promise((r) => setTimeout(r, 250));
  assert.strictEqual(healthReg.isAvailable('provider-a', 'model-1'), true, 'HALF_OPEN probe allowed after cooldown');
  const healthHalfOpen = healthReg.getHealth('provider-a', 'model-1');
  assert.strictEqual(healthHalfOpen.circuitBreakerState, CIRCUIT_BREAKER_STATES.HALF_OPEN);

  // Successful probe resets circuit breaker to CLOSED
  healthReg.recordSuccess('provider-a', 'model-1', 50);
  const healthRecovered = healthReg.getHealth('provider-a', 'model-1');
  assert.strictEqual(healthRecovered.circuitBreakerState, CIRCUIT_BREAKER_STATES.CLOSED);
  assert.strictEqual(healthRecovered.consecutiveFailures, 0);
  console.log('✓ Circuit breaker: CLOSED -> OPEN (on 2 failures) -> HALF_OPEN (after cooldown) -> CLOSED (on recovery).');
  passedCount++;

  // 10. Multi-step cross-provider fallback (Provider A fails -> Provider B succeeds)
  console.log('10. Testing Cross-Provider Fallback Orchestration...');
  const testProviderRegistry = new ProviderRegistry();
  const testHealthRegistry = new HealthRegistry({ cooldownMs: 1000 });
  const testTelemetry = new AITelemetry();

  // Primary provider fails with 429
  const failingGemini = new MockAdapter(
    'gemini',
    [
      {
        id: 'gemini-3.8-flash',
        name: 'Gemini 3.8 Flash',
        isFree: true,
        capabilities: [CAPABILITY_TYPES.REASONING, CAPABILITY_TYPES.GENERAL_CHAT, CAPABILITY_TYPES.LOW_COST_FREE],
        priority: 10,
      },
    ],
    {
      'gemini-3.8-flash': {
        error: { message: 'Gemini 429 Quota Exceeded', type: ERROR_TYPES.RATE_LIMIT, retryable: false },
      },
    }
  );

  // Fallback provider succeeds
  const succeedingOpenRouter = new MockAdapter(
    'openrouter',
    [
      {
        id: 'meta-llama/llama-3.3-70b-instruct:free',
        name: 'Llama 3.3 70B (Free)',
        isFree: true,
        capabilities: [CAPABILITY_TYPES.REASONING, CAPABILITY_TYPES.GENERAL_CHAT, CAPABILITY_TYPES.LOW_COST_FREE],
        priority: 9,
      },
    ],
    {
      'meta-llama/llama-3.3-70b-instruct:free': {
        text: 'A distributed system is one in which the failure of a computer you didn\'t even know existed can render your own computer unusable.',
      },
    }
  );

  testProviderRegistry.registerProvider(failingGemini);
  testProviderRegistry.registerProvider(succeedingOpenRouter);

  const fallbackOrchestrator = new PriteeAIOrchestrator({
    providerRegistry: testProviderRegistry,
    healthRegistry: testHealthRegistry,
    telemetry: testTelemetry,
    maxRetries: 0,
    maxFallbacks: 3,
  });

  const fallbackResult = await fallbackOrchestrator.askPritee({
    question: 'Why do distributed systems fail?',
    mode: 'engineer',
  });

  assert.strictEqual(fallbackResult.success, true);
  assert.strictEqual(fallbackResult.provider, 'openrouter');
  assert.strictEqual(fallbackResult.model, 'meta-llama/llama-3.3-70b-instruct:free');
  assert.strictEqual(fallbackResult.fallbackAttempt, 1, 'Should have fallen back once');
  assert.ok(fallbackResult.text.includes('distributed system'));
  console.log('✓ Multi-step cross-provider fallback: Gemini failed with 429 -> OpenRouter automatically rescued request.');
  passedCount++;

  // 11. All providers unavailable -> Graceful Final Failure (Zero fake AI responses)
  console.log('11. Testing All Providers Unavailable Graceful Failure...');
  const emptyRegistry = new ProviderRegistry();
  const deadOrchestrator = new PriteeAIOrchestrator({
    providerRegistry: emptyRegistry,
    healthRegistry: new HealthRegistry(),
    telemetry: new AITelemetry(),
  });

  const deadResult = await deadOrchestrator.askPritee({
    question: 'How to build a bridge?',
  });

  assert.strictEqual(deadResult.success, false);
  assert.strictEqual(deadResult.isFinalFallback, true);
  assert.strictEqual(deadResult.text, PRITEE_GRACEFUL_FALLBACK_TEXT);
  assert.ok(!deadResult.text.includes('Gemini failed'));
  assert.ok(!deadResult.text.includes('OpenRouter failed'));
  console.log('✓ All providers unavailable: returned courteous canonical Hindi/English retry message without mock text.');
  passedCount++;

  // 12. Free-Only Policy Enforcement
  console.log('12. Testing Free-Only Policy enforcement...');
  const mixedRegistry = new ProviderRegistry();
  const mixedAdapter = new MockAdapter('mixed-provider', [
    {
      id: 'paid-advanced-model',
      name: 'Paid Advanced 1',
      isFree: false,
      capabilities: [CAPABILITY_TYPES.REASONING, CAPABILITY_TYPES.GENERAL_CHAT],
      priority: 20,
    },
    {
      id: 'free-model',
      name: 'Free Model 1',
      isFree: true,
      capabilities: [CAPABILITY_TYPES.REASONING, CAPABILITY_TYPES.GENERAL_CHAT],
      priority: 5,
    },
  ]);
  mixedRegistry.registerProvider(mixedAdapter);

  const freeOnlyRouter = new ModelRouter({
    providerRegistry: mixedRegistry,
    healthRegistry: new HealthRegistry(),
    costPolicy: COST_POLICY.FREE_ONLY,
  });

  const routePlan = freeOnlyRouter.route({
    capabilities: [CAPABILITY_TYPES.REASONING],
    format: 'text',
    structured: false,
  });

  assert.strictEqual(routePlan.primary.modelId, 'free-model');
  assert.ok(!routePlan.fallbacks.some((f) => f.modelId === 'paid-advanced-model'), 'Paid model must be excluded in free_only mode');
  console.log('✓ AI_COST_POLICY=free_only strictly eliminated paid model candidates.');
  passedCount++;

  // 13. Secret Leakage Prevention
  console.log('13. Testing Secret Leakage Prevention...');
  const mockSecretKey = 'sk-live-super-secret-openrouter-key-xyz123';
  const secretAdapter = new MockAdapter(
    'openrouter',
    [
      {
        id: 'openrouter/free',
        name: 'OpenRouter Free',
        isFree: true,
        capabilities: [CAPABILITY_TYPES.GENERAL_CHAT],
      },
    ],
    {
      'openrouter/free': {
        text: 'Normal response without key.',
      },
    }
  );
  secretAdapter.apiKey = mockSecretKey;

  const secretRegistry = new ProviderRegistry();
  secretRegistry.registerProvider(secretAdapter);
  const secretOrchestrator = new PriteeAIOrchestrator({
    providerRegistry: secretRegistry,
    healthRegistry: new HealthRegistry(),
    telemetry: new AITelemetry(),
  });

  const secRes = await secretOrchestrator.askPritee({ question: 'Hello' });
  const stringifiedRes = JSON.stringify(secRes);
  assert.strictEqual(stringifiedRes.includes(mockSecretKey), false, 'API key leaked into response JSON!');

  const diag = secretOrchestrator.getDiagnostics();
  const stringifiedDiag = JSON.stringify(diag);
  assert.strictEqual(stringifiedDiag.includes(mockSecretKey), false, 'API key leaked into diagnostics JSON!');
  console.log('✓ Secret Leakage Prevention verified: zero credentials exposed in responses or diagnostics.');
  passedCount++;

  // 14. Request Classifier Capabilities Mapping
  console.log('14. Testing Request Classifier...');
  const classifiedStudent = classifyRequest({ mode: 'student', question: 'Explain Newton laws' });
  assert.strictEqual(classifiedStudent.task, TASK_TYPES.STUDENT_MENTORING);
  assert.ok(classifiedStudent.capabilities.includes(CAPABILITY_TYPES.EDUCATIONAL_EXPLANATION));

  const classifiedCurious = classifyRequest({ mode: 'curious', question: 'Explain wifi' });
  assert.strictEqual(classifiedCurious.task, TASK_TYPES.CURIOUS_ANALOGIES);

  const classifiedJson = classifyRequest({ format: 'json', question: 'Give me specs' });
  assert.strictEqual(classifiedJson.structured, true);
  console.log('✓ RequestClassifier correctly mapped modes to tasks and capability requirements.');
  passedCount++;

  // 15. Telemetry & Metrics Aggregator
  console.log('15. Testing AI Telemetry Service...');
  const telemetry = new AITelemetry();
  telemetry.logAttempt({
    requestId: 'req_1',
    task: TASK_TYPES.SYSTEMS_ARCHITECTURE,
    provider: 'gemini',
    model: 'gemini-3.8-flash',
    attempt: 0,
    success: true,
    latencyMs: 120,
  });
  telemetry.logAttempt({
    requestId: 'req_2',
    task: TASK_TYPES.STUDENT_MENTORING,
    provider: 'openrouter',
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    attempt: 1,
    success: true,
    latencyMs: 340,
  });

  const metrics = telemetry.getMetrics();
  assert.strictEqual(metrics.totalRequests, 2);
  assert.strictEqual(metrics.totalSuccesses, 2);
  assert.strictEqual(metrics.totalFallbacks, 1);
  assert.strictEqual(metrics.successRate, '100%');
  assert.strictEqual(metrics.byProvider.gemini.requests, 1);
  assert.strictEqual(metrics.byProvider.openrouter.requests, 1);
  console.log('✓ Telemetry accurately aggregated request volume, latency, and provider breakdowns.');
  passedCount++;

  // 16. Retry limits respected
  console.log('16. Testing Retry Limits Respected...');
  let retryCount = 0;
  const retryAdapter = new MockAdapter(
    'retry-provider',
    [
      {
        id: 'retry-model',
        name: 'Retry Model',
        isFree: true,
        capabilities: [CAPABILITY_TYPES.GENERAL_CHAT],
      },
    ],
    {
      'retry-model': {
        error: { message: 'Transient 503 error', type: ERROR_TYPES.SERVER_ERROR, retryable: true },
      },
    }
  );
  // Intercept generate to count calls
  const originalGenerate = retryAdapter.generate.bind(retryAdapter);
  retryAdapter.generate = async (params) => {
    retryCount++;
    return originalGenerate(params);
  };

  const retryRegistry = new ProviderRegistry();
  retryRegistry.registerProvider(retryAdapter);

  const retryOrchestrator = new PriteeAIOrchestrator({
    providerRegistry: retryRegistry,
    healthRegistry: new HealthRegistry(),
    telemetry: new AITelemetry(),
    maxRetries: 2,
    maxFallbacks: 1,
    backoffBaseMs: 0,
  });

  await retryOrchestrator.askPritee({ question: 'Test' });
  // Initial attempt + 2 retries = 3 calls
  assert.strictEqual(retryCount, 3, `Expected exactly 3 attempts (1 initial + 2 retries), got ${retryCount}`);
  console.log('✓ Retry limits strictly respected (maxRetries=2 executed exactly 3 attempts).');
  passedCount++;

  // 17. Environment & Credential Consumption Architecture
  console.log('17. Testing Environment & Credential Architecture...');
  const { aiConfig: loadedConfig } = await import('../server/ai/config.js');
  // Verify configuration keys: only real providers
  assert.ok('geminiApiKey' in loadedConfig);
  assert.ok('openrouterApiKey' in loadedConfig);
  // Assert no invented PRITEE_AI keys are consumed
  assert.strictEqual(loadedConfig.priteeAiApiKey, undefined);
  assert.strictEqual(loadedConfig.priteeAiEndpoint, undefined);
  console.log('✓ Pritee AI architecture consumes only legitimate provider keys (gemini, openrouter), zero invented PRITEE_AI_* variables.');
  passedCount++;

  console.log('\n==================================================================');
  console.log(`✓ ALL ${passedCount} PRITEE AI ORCHESTRATION TESTS PASSED CLEANLY!`);
  console.log('==================================================================\n');
}

runAllTests().catch((err) => {
  console.error('\n❌ Pritee AI Test Suite failed:', err);
  process.exit(1);
});
