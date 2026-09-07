/**
 * ENGINEERVERSE — Admin AI Orchestrator Diagnostics Inspector
 * Internal control surface to monitor provider status, models, circuit breakers,
 * health cooldowns, request latency, and cross-provider fallbacks.
 * Completely restricted to internal admin view.
 */

import { useState, useEffect } from 'react';
import {
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Shield,
  Activity,
  Server,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Card } from '../ui/Card.jsx';
import { Badge } from '../ui/Badge.jsx';
import { Button } from '../ui/Button.jsx';
import { fetchAiDiagnostics } from '../../services/priteeClient.js';
import { getApiUrl } from '../../config/api.js';

export function AiOrchestratorDiagnostics() {
  const [diagnostics, setDiagnostics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [testPrompt, setTestPrompt] = useState('Explain how GPS uses relativity to remain accurate.');
  const [testMode, setTestMode] = useState('engineer');
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  const loadDiagnostics = async () => {
    try {
      setRefreshing(true);
      const data = await fetchAiDiagnostics();
      setDiagnostics(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to connect to backend AI diagnostics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDiagnostics();
  }, []);

  const handleTriggerDiscovery = async () => {
    try {
      setRefreshing(true);
      await fetch(getApiUrl('/api/pritee/models/discover'), { method: 'POST' });
      await loadDiagnostics();
    } catch (err) {
      setError('Discovery trigger failed: ' + err.message);
      setRefreshing(false);
    }
  };

  const handleRunTestQuery = async () => {
    if (!testPrompt.trim() || testing) return;
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch(getApiUrl('/api/pritee/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: testPrompt, mode: testMode }),
      });
      const data = await res.json();
      setTestResult(data);
      await loadDiagnostics(); // Refresh health & metrics after query
    } catch (err) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setTesting(false);
    }
  };

  if (loading && !diagnostics) {
    return (
      <div className="p-8 text-center text-slate-400 font-mono text-sm">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-400" />
        Connecting to Pritee AI Orchestration Subsystem...
      </div>
    );
  }

  const telemetry = diagnostics?.telemetry || {};
  const providers = diagnostics?.providers || [];
  const healthList = diagnostics?.health || [];

  return (
    <div className="space-y-6 font-mono">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-purple-950/20 border border-purple-800/40">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white">Pritee AI Multi-Provider Orchestrator</h2>
            <Badge variant="purple" size="xs">
              POLICY: {diagnostics?.policy?.toUpperCase() || 'FREE_ONLY'}
            </Badge>
          </div>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Internal runtime telemetry, provider health circuits, failure detection, and dynamic free model pool.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={loadDiagnostics}
            disabled={refreshing}
            className={`text-xs ${refreshing ? 'animate-spin' : ''}`}
          >
            Refresh Status
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={Sparkles}
            onClick={handleTriggerDiscovery}
            disabled={refreshing}
            className="text-xs"
          >
            Trigger Discovery
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-xs text-red-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Top Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-400 block uppercase">Total Requests</span>
          <span className="text-2xl font-bold text-white mt-1 block">
            {telemetry.totalRequests ?? 0}
          </span>
          <span className="text-[10px] text-emerald-400 mt-1 block">
            Success Rate: {telemetry.successRate ?? '100%'}
          </span>
        </div>

        <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-400 block uppercase">Fallbacks Triggered</span>
          <span className="text-2xl font-bold text-amber-300 mt-1 block">
            {telemetry.totalFallbacks ?? 0}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">Auto-recovered across pool</span>
        </div>

        <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-400 block uppercase">Average Latency</span>
          <span className="text-2xl font-bold text-cyan-300 mt-1 block">
            {telemetry.averageLatencyMs ?? 0}ms
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">Weighted rolling average</span>
        </div>

        <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-400 block uppercase">Circuit Breakers</span>
          <span className="text-2xl font-bold text-purple-300 mt-1 block">
            {diagnostics?.circuitBreakerEnabled ? 'Active' : 'Bypassed'}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">Auto-cooldown + jitter</span>
        </div>
      </div>

      {/* Providers & Models Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Configured Providers */}
        <div className="bg-slate-900/40 rounded-xl border border-slate-800 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-purple-400" />
              <span>Registered Providers</span>
            </h3>
            <span className="text-[10px] text-slate-400">{providers.length} registered</span>
          </div>

          <div className="space-y-2">
            {providers.map((p) => (
              <div
                key={p.name}
                className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white uppercase">{p.name}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        p.configured
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {p.configured ? 'API KEY CONFIGURED' : 'KEY UNCONFIGURED'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-sans mt-0.5 block">
                    {p.modelsCount} model candidates in registry
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-300">
                    {telemetry.byProvider?.[p.name]?.requests || 0} reqs
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Circuit Breaker & Health Table */}
        <div className="bg-slate-900/40 rounded-xl border border-slate-800 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Model Health & Circuit Breakers</span>
            </h3>
            <span className="text-[10px] text-slate-400">{healthList.length} monitored</span>
          </div>

          {healthList.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
              No runtime model failures recorded yet. Circuit breakers all in CLOSED (healthy) state.
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {healthList.map((h) => (
                <div
                  key={`${h.provider}:${h.modelId}`}
                  className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80 text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-white block">{h.modelId}</span>
                    <span className="text-[10px] text-slate-400 font-sans">
                      Provider: {h.provider} | Failures: {h.consecutiveFailures}
                    </span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        h.circuitBreakerState === 'CLOSED'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : h.circuitBreakerState === 'OPEN'
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {h.circuitBreakerState}
                    </span>
                    {h.averageLatencyMs > 0 && (
                      <span className="text-[10px] text-cyan-400 block mt-0.5">
                        {h.averageLatencyMs}ms
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Live Admin Test Query Engine */}
      <div className="p-4 bg-purple-950/10 rounded-xl border border-purple-900/40 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Internal Orchestrator Test Harness (Verification Tool)</span>
        </h3>
        <p className="text-xs text-slate-400 font-sans">
          Send a verification inquiry to inspect real routing, provider selection, and latency diagnostics.
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={testPrompt}
            onChange={(e) => setTestPrompt(e.target.value)}
            placeholder="Type verification prompt..."
            className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
          />

          <select
            value={testMode}
            onChange={(e) => setTestMode(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none"
          >
            <option value="engineer">Engineer (Systems)</option>
            <option value="student">Student (Pedagogy)</option>
            <option value="curious">Curious (ELI5)</option>
            <option value="career">Career (Craft)</option>
          </select>

          <Button
            variant="primary"
            size="sm"
            onClick={handleRunTestQuery}
            disabled={testing}
            className="shrink-0 text-xs"
          >
            {testing ? 'Routing...' : 'Execute Test'}
          </Button>
        </div>

        {testResult && (
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-2 mt-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800/80 pb-1.5">
              <span>
                Status:{' '}
                <strong className={testResult.success ? 'text-emerald-400' : 'text-amber-400'}>
                  {testResult.success ? 'SUCCESS' : 'FALLBACK TRIGGERED'}
                </strong>
              </span>
              {testResult.provider && (
                <span>
                  Routed To: <strong className="text-purple-300">{testResult.provider}</strong> ({testResult.model})
                </span>
              )}
              {testResult.latencyMs && (
                <span>
                  Latency: <strong className="text-cyan-300">{testResult.latencyMs}ms</strong>
                </span>
              )}
            </div>
            <div className="text-slate-300 font-sans whitespace-pre-wrap text-xs max-h-48 overflow-y-auto">
              {testResult.text}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AiOrchestratorDiagnostics;
