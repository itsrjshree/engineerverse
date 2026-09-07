/**
 * ENGINEERVERSE — AI Observability & Telemetry Service
 * Aggregates runtime statistics without storing user PII, prompt texts, or credentials.
 * Provides internal telemetry for admin diagnostics.
 */

export class AITelemetry {
  constructor() {
    this.metrics = {
      totalRequests: 0,
      totalSuccesses: 0,
      totalFailures: 0,
      totalFallbacks: 0,
      totalLatencyMs: 0,
      averageLatencyMs: 0,
      byProvider: {},
      byTask: {},
      byErrorType: {},
      recentLogs: [], // Circular buffer of sanitized request metadata
    };
  }

  logAttempt({
    requestId,
    task,
    provider,
    model,
    attempt,
    success,
    errorType = null,
    latencyMs = 0,
    tokens = { inputTokens: 0, outputTokens: 0 },
  }) {
    this.metrics.totalRequests += 1;
    if (success) {
      this.metrics.totalSuccesses += 1;
    } else {
      this.metrics.totalFailures += 1;
    }

    if (attempt > 0) {
      this.metrics.totalFallbacks += 1;
    }

    this.metrics.totalLatencyMs += latencyMs;
    this.metrics.averageLatencyMs = Math.round(
      this.metrics.totalLatencyMs / Math.max(1, this.metrics.totalRequests)
    );

    // Track by provider
    if (!this.metrics.byProvider[provider]) {
      this.metrics.byProvider[provider] = { requests: 0, successes: 0, failures: 0, latencyMs: 0 };
    }
    this.metrics.byProvider[provider].requests += 1;
    if (success) this.metrics.byProvider[provider].successes += 1;
    else this.metrics.byProvider[provider].failures += 1;
    this.metrics.byProvider[provider].latencyMs = latencyMs;

    // Track by task
    if (task) {
      this.metrics.byTask[task] = (this.metrics.byTask[task] || 0) + 1;
    }

    // Track by error type
    if (errorType) {
      this.metrics.byErrorType[errorType] = (this.metrics.byErrorType[errorType] || 0) + 1;
    }

    // Circular log buffer (last 30 events)
    const logEntry = {
      timestamp: new Date().toISOString(),
      requestId,
      task,
      provider,
      model,
      attempt,
      success,
      errorType,
      latencyMs,
      tokens,
    };
    this.metrics.recentLogs.unshift(logEntry);
    if (this.metrics.recentLogs.length > 30) {
      this.metrics.recentLogs.pop();
    }

    // Structured console logging (safe, no PII/secrets)
    if (success) {
      console.log(
        `[PriteeAI] SUCCESS requestId=${requestId} provider=${provider} model=${model} latency=${latencyMs}ms fallbackAttempt=${attempt}`
      );
    } else {
      console.warn(
        `[PriteeAI] FAILURE requestId=${requestId} provider=${provider} model=${model} errorType=${errorType} fallbackAttempt=${attempt}`
      );
    }
  }

  getMetrics() {
    const successRate =
      this.metrics.totalRequests > 0
        ? Math.round((this.metrics.totalSuccesses / this.metrics.totalRequests) * 100)
        : 100;

    return {
      ...this.metrics,
      successRate: `${successRate}%`,
    };
  }

  reset() {
    this.metrics = {
      totalRequests: 0,
      totalSuccesses: 0,
      totalFailures: 0,
      totalFallbacks: 0,
      totalLatencyMs: 0,
      averageLatencyMs: 0,
      byProvider: {},
      byTask: {},
      byErrorType: {},
      recentLogs: [],
    };
  }
}

export const globalTelemetry = new AITelemetry();
export default globalTelemetry;
