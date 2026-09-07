/**
 * ENGINEERVERSE — Central Feature Registry Explorer (EV-001 to EV-060)
 * Engineering Control Surface & Execution Contract System
 * Renders all 60 mandatory features with authoritative architecture contracts.
 */

import { useState } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Shield,
  Layers,
  Sparkles,
  Terminal,
  Activity,
  Lock,
  Cpu,
  Database,
  Globe,
  Gauge,
  Accessibility,
  FileCheck
} from 'lucide-react';
import { features, FEATURE_AREAS, FEATURE_STATUS } from '../config/features.js';
import { Card } from './ui/Card.jsx';
import { Badge } from './ui/Badge.jsx';
import { Button } from './ui/Button.jsx';
import { TabPill } from './ui/TabPill.jsx';

export function FeatureRegistryView() {
  const [selectedArea, setSelectedArea] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalFeature, setActiveModalFeature] = useState(null);

  // Filter features
  const filteredFeatures = features.filter((feature) => {
    const matchesArea = selectedArea === 'ALL' || feature.area === selectedArea;
    const matchesStatus = selectedStatus === 'ALL' || feature.status === selectedStatus;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      feature.id.toLowerCase().includes(q) ||
      feature.name.toLowerCase().includes(q) ||
      (feature.purpose && feature.purpose.toLowerCase().includes(q)) ||
      (feature.description && feature.description.toLowerCase().includes(q));

    return matchesArea && matchesStatus && matchesQuery;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case FEATURE_STATUS.VERIFIED:
        return <Badge variant="success" size="xs">Verified</Badge>;
      case FEATURE_STATUS.FOUNDATION:
        return <Badge variant="glow" size="xs">Foundation Ready</Badge>;
      case FEATURE_STATUS.IN_PROGRESS:
        return <Badge variant="warning" size="xs">In Progress</Badge>;
      case FEATURE_STATUS.IMPLEMENTED:
        return <Badge variant="purple" size="xs">Implemented</Badge>;
      case FEATURE_STATUS.BLOCKED:
        return <Badge variant="outline" size="xs">Blocked</Badge>;
      default:
        return <Badge variant="default" size="xs">Planned</Badge>;
    }
  };

  const foundationCount = features.filter((f) => f.status === FEATURE_STATUS.FOUNDATION).length;
  const plannedCount = features.filter((f) => f.status === FEATURE_STATUS.PLANNED).length;

  return (
    <div className="w-full space-y-6">
      {/* Control Surface Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-purple-950/40 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs uppercase tracking-wider text-purple-400 font-bold flex items-center gap-1">
              <Terminal className="w-3.5 h-3.5" />
              Architecture Execution Contract System
            </span>
            <Badge variant="purple" size="xs">{features.length} Features Contracted</Badge>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Feature Registry (EV-001 — EV-060)
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Authoritative execution contract. Features progress sequentially one at a time through strict verification gates.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by ID (e.g. EV-020), name, purpose..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#09091b] border border-purple-950/60 rounded-full text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Filter Surface: Status & Areas */}
      <div className="space-y-2.5">
        {/* Status Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-mono text-[11px] shrink-0">STATUS:</span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedStatus('ALL')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                selectedStatus === 'ALL'
                  ? 'bg-purple-600 text-white border-purple-400'
                  : 'bg-black/30 text-slate-400 border-purple-950/40 hover:text-white'
              }`}
            >
              All ({features.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus(FEATURE_STATUS.FOUNDATION)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                selectedStatus === FEATURE_STATUS.FOUNDATION
                  ? 'bg-purple-600 text-white border-purple-400'
                  : 'bg-black/30 text-purple-300 border-purple-950/40 hover:text-white'
              }`}
            >
              Foundation Ready ({foundationCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus(FEATURE_STATUS.PLANNED)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                selectedStatus === FEATURE_STATUS.PLANNED
                  ? 'bg-purple-600 text-white border-purple-400'
                  : 'bg-black/30 text-slate-400 border-purple-950/40 hover:text-white'
              }`}
            >
              Planned ({plannedCount})
            </button>
          </div>
        </div>

        {/* Area Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          <TabPill
            label="All Areas"
            count={features.length}
            active={selectedArea === 'ALL'}
            onClick={() => setSelectedArea('ALL')}
          />
          {Object.values(FEATURE_AREAS).map((area) => {
            const count = features.filter((f) => f.area === area).length;
            return (
              <TabPill
                key={area}
                label={area}
                count={count}
                active={selectedArea === area}
                onClick={() => setSelectedArea(area)}
              />
            );
          })}
        </div>
      </div>

      {/* Feature Cards Grid (Control Surface Layout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFeatures.map((feature) => (
          <Card
            key={feature.id}
            className="p-5 flex flex-col justify-between cursor-pointer group hover:border-purple-600/50 transition-all bg-[#08081a]/90"
            onClick={() => setActiveModalFeature(feature)}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-bold text-purple-300 bg-purple-950/80 px-2.5 py-0.5 rounded border border-purple-800/40">
                    {feature.id}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {feature.plannedPhase?.split('/')[0]?.trim()}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {getStatusBadge(feature.status)}
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 flex items-center gap-1"
                    title={`Verification State: ${feature.verificationState}`}
                  >
                    <Shield className="w-2.5 h-2.5 text-slate-500" />
                    {feature.verificationState}
                  </span>
                </div>
              </div>

              <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors mb-1.5">
                {feature.name}
              </h3>

              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-3">
                {feature.purpose || feature.description}
              </p>

              {/* Scope badges */}
              <div className="flex flex-wrap gap-1 mb-3">
                {feature.frontendReq && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950/40 text-purple-300 border border-purple-900/30">
                    Frontend
                  </span>
                )}
                {feature.backendReq && !feature.backendReq.startsWith('None') && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950/40 text-indigo-300 border border-indigo-900/30">
                    Backend
                  </span>
                )}
                {feature.databaseReq && !feature.databaseReq.startsWith('None') && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950/40 text-blue-300 border border-blue-900/30">
                    DB
                  </span>
                )}
                {feature.aiReq && !feature.aiReq.startsWith('None') && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-950/40 text-violet-300 border border-violet-900/30">
                    AI
                  </span>
                )}
                {feature.securityReq && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950/30 text-rose-300 border border-rose-900/30">
                    Sec
                  </span>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-purple-950/40 flex items-center justify-between text-[11px] text-purple-300/70">
              <span className="truncate max-w-[170px]">{feature.area}</span>
              <span className="inline-flex items-center gap-1 text-purple-400 group-hover:underline shrink-0">
                <Eye className="w-3 h-3" /> Audit Contract
              </span>
            </div>
          </Card>
        ))}
      </div>

      {filteredFeatures.length === 0 && (
        <div className="py-12 text-center text-slate-400 bg-[#070714] rounded-2xl border border-purple-950/30">
          No features match your current filter query.
        </div>
      )}

      {/* Comprehensive Architecture Contract Modal (Auditable Control Surface) */}
      {activeModalFeature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div
            className="bg-[#08081d] border border-purple-700/60 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-purple-900/40 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="font-mono text-sm font-bold text-purple-300 bg-purple-950/80 px-2.5 py-0.5 rounded border border-purple-700/50">
                    {activeModalFeature.id}
                  </span>
                  <span className="text-xs text-slate-400">• {activeModalFeature.area}</span>
                  {getStatusBadge(activeModalFeature.status)}
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700 flex items-center gap-1">
                    <Shield className="w-3 h-3 text-slate-400" />
                    State: {activeModalFeature.verificationState}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {activeModalFeature.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalFeature(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Purpose */}
            <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-800/30">
              <strong className="text-purple-300 block text-xs font-mono uppercase tracking-wider mb-1">
                Concise Purpose:
              </strong>
              <p className="text-sm text-slate-200 leading-relaxed">
                {activeModalFeature.purpose || activeModalFeature.description}
              </p>
            </div>

            {/* Phase & Dependencies */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-black/40 border border-purple-950/40">
                <strong className="text-purple-300 font-mono block mb-1">Planned Phase / Order:</strong>
                <span className="text-slate-300">{activeModalFeature.plannedPhase}</span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-purple-950/40">
                <strong className="text-purple-300 font-mono block mb-1">Dependencies:</strong>
                <span className="text-slate-300">
                  {activeModalFeature.dependencies && activeModalFeature.dependencies.length > 0
                    ? activeModalFeature.dependencies.join(', ')
                    : 'None (Foundation Root)'}
                </span>
              </div>
            </div>

            {/* Architectural Specifications Grid */}
            <div className="space-y-2">
              <div className="text-xs font-mono uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                Technical Specifications & Boundaries
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-black/40 border border-purple-950/40">
                  <span className="text-purple-400 font-semibold block mb-0.5">Frontend Requirements:</span>
                  <span className="text-slate-300">{activeModalFeature.frontendReq}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-black/40 border border-purple-950/40">
                  <span className="text-purple-400 font-semibold block mb-0.5">Backend Requirements:</span>
                  <span className="text-slate-300">{activeModalFeature.backendReq}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-black/40 border border-purple-950/40">
                  <span className="text-purple-400 font-semibold block mb-0.5">Database Requirements:</span>
                  <span className="text-slate-300">{activeModalFeature.databaseReq}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-black/40 border border-purple-950/40">
                  <span className="text-purple-400 font-semibold block mb-0.5">AI Layer:</span>
                  <span className="text-slate-300">{activeModalFeature.aiReq}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-black/40 border border-purple-950/40">
                  <span className="text-purple-400 font-semibold block mb-0.5">Security Requirements:</span>
                  <span className="text-slate-300">{activeModalFeature.securityReq}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-black/40 border border-purple-950/40">
                  <span className="text-purple-400 font-semibold block mb-0.5">SEO & Social:</span>
                  <span className="text-slate-300">{activeModalFeature.seoReq}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-black/40 border border-purple-950/40">
                  <span className="text-purple-400 font-semibold block mb-0.5">Accessibility (a11y):</span>
                  <span className="text-slate-300">{activeModalFeature.accessibilityReq}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-black/40 border border-purple-950/40">
                  <span className="text-purple-400 font-semibold block mb-0.5">Performance & Latency:</span>
                  <span className="text-slate-300">{activeModalFeature.performanceReq}</span>
                </div>
              </div>
            </div>

            {/* Acceptance Criteria & Verification Gate */}
            <div className="space-y-2">
              <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-700/50">
                <span className="text-purple-200 font-bold block mb-1 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-purple-400" />
                  Acceptance Criteria:
                </span>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-mono">
                  {activeModalFeature.acceptanceCriteria}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-black/50 border border-purple-900/30 text-xs">
                <span className="text-slate-400 font-semibold block mb-0.5">Validation Requirements:</span>
                <span className="text-slate-300">{activeModalFeature.validationRequirements}</span>
              </div>

              <div className="p-3 rounded-xl bg-black/50 border border-purple-900/30 text-xs">
                <span className="text-slate-400 font-semibold block mb-0.5">Implementation Notes & Boundaries:</span>
                <span className="text-slate-300">{activeModalFeature.implementationNotes}</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-purple-900/40 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                Status: {activeModalFeature.status.toUpperCase()} • Gate: {activeModalFeature.verificationState.toUpperCase()}
              </span>
              <Button size="sm" variant="secondary" onClick={() => setActiveModalFeature(null)}>
                Close Contract Audit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FeatureRegistryView;
