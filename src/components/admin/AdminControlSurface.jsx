/**
 * ENGINEERVERSE — Internal Architecture & Engineering Control Layer
 * Sections 1 & 4:
 * - Restricted to Admins, Developers, and QA Auditors.
 * - Displays EV-001 through EV-060 with full 21 architecture contract fields.
 * - Shows Sequential Implementation Progress, Dependency Graphs, Gates, and Temporal Simulator.
 * - Completely isolated from the public production experience.
 */

import { useState, useEffect } from 'react';
import {
  Shield,
  Search,
  Filter,
  Layers,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  Calendar,
  Cpu,
  Lock,
  Terminal,
  LogIn,
  LogOut,
  RefreshCw,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';
import { features, VERIFICATION_STATES, STATUS_TYPES } from '../../config/features.js';
import { getExperiencePillarForFeature } from '../../config/experiences.js';
import { CAMPAIGN_STATES } from '../../config/campaign.js';
import { Badge } from '../ui/Badge.jsx';
import { Card } from '../ui/Card.jsx';
import { Button } from '../ui/Button.jsx';
import { AiOrchestratorDiagnostics } from './AiOrchestratorDiagnostics.jsx';
import { CommunityModerationView } from './CommunityModerationView.jsx';
import { authService } from '../../services/firebaseClient.js';

export function AdminControlSurface({ onExitToPublic, campaignState, onSimulateDate }) {
  // Authentication & Authorization state
  const [authStatus, setAuthStatus] = useState('checking'); // 'checking' | 'authorized' | 'unauthorized' | 'signed_out'
  const [currentUser, setCurrentUser] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Tab & feature inspector state
  const [activeTab, setActiveTab] = useState('registry'); // 'registry' | 'ai-diagnostics' | 'community-moderation'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [showContractsModal, setShowContractsModal] = useState(false);

  // Verify authentication & server-side authorization on mount
  const checkAuthAndAuthorize = async () => {
    try {
      setAuthStatus('checking');
      setAuthError(null);

      const user = await authService.getCurrentUser();
      if (!user || user.isAnonymous) {
        setCurrentUser(null);
        setAuthStatus('signed_out');
        return;
      }

      setCurrentUser(user);

      // Fast check: Is this user flagged as admin by authService?
      if (!user.isAdmin) {
        setAuthStatus('unauthorized');
        setAuthError('Unauthorized access (HTTP 403). Administrative privileges required.');
        return;
      }

      // Server-Side Authorization Check: Verify real ID token against /api/admin/verify-session
      const token = await authService.getIdToken();
      if (!token) {
        setCurrentUser(null);
        setAuthStatus('signed_out');
        return;
      }

      const verification = await authService.verifyAdminSession(token);
      if (verification.authorized) {
        setAuthStatus('authorized');
        setAuthError(null);
      } else {
        if (verification.status === 401) {
          await authService.signOut();
          setCurrentUser(null);
          setAuthStatus('signed_out');
        } else {
          setAuthStatus('unauthorized');
          setAuthError(verification.error || 'Unauthorized access. Administrative privileges are required.');
        }
      }
    } catch (err) {
      setAuthStatus('unauthorized');
      setAuthError(err.message || 'Authorization check failed.');
    }
  };

  useEffect(() => {
    checkAuthAndAuthorize();
  }, []);

  const handleSignInGoogle = async () => {
    try {
      setIsAuthenticating(true);
      setAuthError(null);
      const res = await authService.signInWithGoogle();
      if (!res.success) {
        setAuthError(res.error || 'Sign-in failed.');
        setAuthStatus('unauthorized');
        return;
      }

      const userEmail = (res.user?.email || '').toLowerCase();
      if (userEmail !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
        await authService.signOut();
        setCurrentUser(null);
        setAuthStatus('unauthorized');
        setAuthError('Unauthorized access (HTTP 403). This Google Account is not the authorized administrator.');
        return;
      }

      // Verify token with server
      const verification = await authService.verifyAdminSession(res.idToken);
      if (verification.authorized) {
        setCurrentUser(res.user);
        setAuthStatus('authorized');
        setAuthError(null);
      } else {
        await authService.signOut();
        setCurrentUser(null);
        setAuthStatus('unauthorized');
        setAuthError(verification.error || 'Unauthorized access. Administrative privileges are required.');
      }
    } catch (err) {
      setAuthError(err.message);
      setAuthStatus('unauthorized');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    await authService.signOut();
    setCurrentUser(null);
    setAuthStatus('signed_out');
    setAuthError(null);
  };

  // -------------------------------------------------------------
  // RENDER: Locked Admin Authentication Wall if not authorized
  // Enforces 5 explicit states:
  // State A: Initial/Auth Loading
  // State B: Unauthenticated
  // State C: Authenticated Non-Admin
  // State D: Authenticated Admin (rendered below)
  // State E: Auth Error / Expired Session
  // -------------------------------------------------------------
  if (authStatus !== 'authorized') {
    return (
      <div className="min-h-screen bg-[#03030a] text-slate-100 font-mono text-sm py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="w-full max-w-xl bg-[#090918] border-2 border-red-900/60 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(220,38,38,0.15)] space-y-6">
          {/* Lock Icon & Title */}
          <div className="flex items-center gap-4 border-b border-red-900/40 pb-5">
            <div className="w-14 h-14 rounded-2xl bg-red-950/80 border border-red-700/60 flex items-center justify-center text-red-400 shrink-0">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 text-[10px] font-bold border border-red-700">
                  SERVER-SIDE RBAC GATE
                </span>
                <span className="text-xs text-slate-400 font-sans">Strict Isolation</span>
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight mt-1">
                Restricted Administration Surface
              </h1>
            </div>
          </div>

          {/* Description & Constraints */}
          <div className="p-4 bg-red-950/30 rounded-2xl border border-red-900/40 space-y-2 text-xs font-sans">
            <div className="flex items-center gap-2 text-red-300 font-bold font-mono">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>ACCESS POLICY: AUTHORIZED ADMINISTRATOR ONLY</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              This internal engineering console (EV-001..EV-060 registry, AI orchestrator telemetry, provider circuit breakers, and moderation surfaces) is strictly isolated from public visitors.
            </p>
          </div>

          {/* State A — Initial/Auth Loading */}
          {authStatus === 'checking' && (
            <div className="p-5 bg-purple-950/30 rounded-2xl border border-purple-800/40 flex flex-col items-center justify-center gap-3 text-purple-300 py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-purple-400" />
              <div className="text-center space-y-1">
                <div className="font-bold text-sm text-white">Verifying Authorization...</div>
                <div className="text-xs text-purple-300/80 font-sans">
                  Querying server-side cryptographic RBAC validator
                </div>
              </div>
            </div>
          )}

          {/* State B — Unauthenticated */}
          {authStatus === 'signed_out' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>State: Unauthenticated</span>
                </div>
                <p className="text-xs text-slate-400 font-sans">
                  You are currently unauthenticated. Sign in with your authorized administrator account to unlock this control console.
                </p>
              </div>

              {authError && (
                <div className="p-3.5 bg-amber-950/40 rounded-xl border border-amber-600/50 text-xs text-amber-200 font-sans">
                  {authError}
                </div>
              )}

              <Button
                variant="primary"
                size="lg"
                icon={LogIn}
                onClick={handleSignInGoogle}
                disabled={isAuthenticating}
                className="w-full justify-center font-sans cursor-pointer shadow-[0_0_20px_rgba(168,85,247,0.25)]"
              >
                {isAuthenticating ? 'Connecting...' : 'Sign In with Authorized Administrator Account'}
              </Button>
            </div>
          )}

          {/* State C — Authenticated Non-Admin (HTTP 403 Forbidden) */}
          {authStatus === 'unauthorized' && currentUser && !currentUser.isAnonymous && (
            <div className="space-y-4">
              <div className="p-4 bg-red-950/60 rounded-2xl border border-red-700/80 space-y-3">
                <div className="flex items-center gap-2 text-red-300 font-bold">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                  <span>HTTP 403 Forbidden — Administrative Privileges Required</span>
                </div>
                <p className="text-xs text-red-200 font-sans leading-relaxed">
                  Authenticated identity: <strong className="text-white font-mono">{currentUser.email || currentUser.displayName}</strong>.
                  <br />
                  This account does not have administrative privileges. Please sign in with an authorized administrator account to access the engineering console.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="md"
                  icon={LogOut}
                  onClick={handleSignOut}
                  className="flex-1 justify-center font-sans text-xs border-slate-700 cursor-pointer"
                >
                  Sign Out / Switch Account
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  icon={LogIn}
                  onClick={handleSignInGoogle}
                  disabled={isAuthenticating}
                  className="flex-1 justify-center font-sans text-xs cursor-pointer"
                >
                  Sign In as Admin
                </Button>
              </div>
            </div>
          )}

          {/* State E — Auth Error / Expired Session */}
          {(authStatus === 'error' || (authStatus === 'unauthorized' && (!currentUser || currentUser.isAnonymous))) && (
            <div className="space-y-4">
              <div className="p-4 bg-red-950/40 rounded-2xl border border-red-800/60 space-y-2">
                <div className="flex items-center gap-2 text-red-300 font-bold">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span>Session Verification Failed</span>
                </div>
                <p className="text-xs text-red-200 font-sans">
                  {authError || 'Administrative session verification failed or token expired. Please reauthenticate.'}
                </p>
              </div>

              <Button
                variant="primary"
                size="lg"
                icon={LogIn}
                onClick={handleSignInGoogle}
                disabled={isAuthenticating}
                className="w-full justify-center font-sans cursor-pointer"
              >
                {isAuthenticating ? 'Authenticating...' : 'Reauthenticate with Google'}
              </Button>
            </div>
          )}

          {/* Return to Public Experience Button */}
          <div className="pt-2">
            <Button
              variant="outline"
              size="md"
              icon={ArrowLeft}
              onClick={onExitToPublic}
              className="w-full justify-center font-sans text-slate-300 border-slate-700 cursor-pointer hover:text-white hover:bg-slate-800"
            >
              Return to Public Experience
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Filter features for authorized admin
  // -------------------------------------------------------------
  const filteredFeatures = features.filter((feat) => {
    const matchesSearch =
      feat.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feat.purpose.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesArea = selectedArea === 'ALL' || feat.area === selectedArea;
    const matchesStatus = selectedStatus === 'ALL' || feat.status === selectedStatus;

    return matchesSearch && matchesArea && matchesStatus;
  });

  const verifiedCount = features.filter(
    (f) => f.verificationState === VERIFICATION_STATES.VERIFIED
  ).length;
  const foundationCount = features.filter((f) => f.status === STATUS_TYPES.FOUNDATION).length;
  const plannedCount = features.filter((f) => f.status === STATUS_TYPES.PLANNED).length;

  return (
    <div className="min-h-screen bg-[#03030a] text-slate-100 font-mono text-sm py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Banner: Explicit demarcation as INTERNAL CONTROL LAYER */}
      <div className="bg-amber-950/40 border-2 border-amber-600/50 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-[0_0_30px_rgba(217,119,6,0.15)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-900/60 border border-amber-500/60 flex items-center justify-center text-amber-300 shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-amber-200 uppercase tracking-widest text-xs sm:text-sm">
                Internal Architecture & Engineering Control Layer
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-600 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                AUTHENTICATED ADMINISTRATOR
              </span>
            </div>
            <p className="text-xs text-amber-300/80 font-sans mt-0.5">
              Strict Rule: This internal registry is for engineering governance and sequential execution (EV-001..EV-060). It is strictly quarantined from public visitors.
            </p>
          </div>
        </div>

        {/* Exit & Sign Out buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            icon={LogOut}
            onClick={handleSignOut}
            className="text-amber-300/80 hover:text-amber-200 font-sans text-xs"
          >
            Lock & Sign Out
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={ArrowLeft}
            onClick={onExitToPublic}
            className="font-sans"
          >
            Return to Public Experience
          </Button>
        </div>
      </div>

      {/* Control Surface Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-purple-950/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Terminal className="w-6 h-6 text-purple-400" />
            <span>Feature Registry & Architecture Contracts (EV-001 — EV-060)</span>
          </h1>
          <p className="text-xs text-slate-400 font-sans mt-1">
            Authoritative 21-field architecture contract governing sequential implementation.
          </p>
        </div>

        {/* Temporal Lifecycle Simulator Controls */}
        <div className="p-3 bg-purple-950/30 rounded-xl border border-purple-800/40 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-purple-300 text-[11px] font-bold flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Lifecycle State: {campaignState?.state?.toUpperCase()}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onSimulateDate?.(`${campaignState.edition}-09-10T12:00:00Z`)}
              className={`px-2 py-0.5 rounded text-[11px] border ${
                campaignState?.state === CAMPAIGN_STATES.PRE_LAUNCH
                  ? 'bg-purple-600 text-white border-purple-400'
                  : 'bg-black/40 text-slate-300 border-purple-900/60 hover:text-white'
              }`}
            >
              Pre-Launch
            </button>
            <button
              type="button"
              onClick={() => onSimulateDate?.(`${campaignState.edition}-09-15T12:00:00Z`)}
              className={`px-2 py-0.5 rounded text-[11px] border ${
                campaignState?.state === CAMPAIGN_STATES.LAUNCH_DAY
                  ? 'bg-purple-600 text-white border-purple-400'
                  : 'bg-black/40 text-slate-300 border-purple-900/60 hover:text-white'
              }`}
            >
              Launch Day
            </button>
            <button
              type="button"
              onClick={() => onSimulateDate?.(`${campaignState.edition}-09-16T12:00:00Z`)}
              className={`px-2 py-0.5 rounded text-[11px] border ${
                campaignState?.state === CAMPAIGN_STATES.EVERGREEN
                  ? 'bg-purple-600 text-white border-purple-400'
                  : 'bg-black/40 text-slate-300 border-purple-900/60 hover:text-white'
              }`}
            >
              Evergreen
            </button>
            <button
              type="button"
              onClick={() => onSimulateDate?.(null)}
              className="px-2 py-0.5 rounded text-[11px] bg-white/5 text-slate-400 hover:text-white border border-white/10"
            >
              Reset Live
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs between Feature Registry and AI Orchestrator Diagnostics */}
      <div className="flex items-center gap-2 border-b border-purple-900/60 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('registry')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeTab === 'registry'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
              : 'bg-purple-950/30 text-purple-300 hover:bg-purple-900/40 border border-purple-900/40'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Feature Registry & Contracts (EV-001..EV-060)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ai-diagnostics')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeTab === 'ai-diagnostics'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
              : 'bg-purple-950/30 text-purple-300 hover:bg-purple-900/40 border border-purple-900/40'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Pritee AI Multi-Provider Orchestrator</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('community-moderation')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeTab === 'community-moderation'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
              : 'bg-purple-950/30 text-purple-300 hover:bg-purple-900/40 border border-purple-900/40'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>Community & Problem Wall Moderation</span>
        </button>
      </div>

      {activeTab === 'ai-diagnostics' ? (
        <AiOrchestratorDiagnostics />
      ) : activeTab === 'community-moderation' ? (
        <CommunityModerationView />
      ) : (
        <>
          {/* High-level Implementation & Verification Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#09091d] border border-purple-900/40">
          <div className="text-[11px] text-slate-400 font-sans">Total Features Contracted</div>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono mt-1">60 / 60</div>
          <div className="text-[10px] text-purple-400 mt-1 font-sans">EV-001 to EV-060 Locked</div>
        </div>
        <div className="p-3.5 rounded-xl bg-[#09091d] border border-purple-900/40">
          <div className="text-[11px] text-slate-400 font-sans">Foundation Hardened</div>
          <div className="text-xl sm:text-2xl font-bold text-indigo-400 font-mono mt-1">
            {foundationCount}
          </div>
          <div className="text-[10px] text-indigo-300 mt-1 font-sans">Architecturally Prepared</div>
        </div>
        <div className="p-3.5 rounded-xl bg-[#09091d] border border-purple-900/40">
          <div className="text-[11px] text-slate-400 font-sans">Verified Features</div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono mt-1">
            {verifiedCount}
          </div>
          <div className="text-[10px] text-emerald-400 mt-1 font-sans">
            Must pass audit before next EV
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-[#09091d] border border-purple-900/40">
          <div className="text-[11px] text-slate-400 font-sans">Next Sequential Target</div>
          <div className="text-xl sm:text-2xl font-bold text-amber-400 font-mono mt-1">
            EV-001
          </div>
          <div className="text-[10px] text-amber-300 mt-1 font-sans">
            Landing Hub Experience
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#08081a] p-3 rounded-xl border border-purple-950/50">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search EV-001..EV-060 by ID, name, area, or requirement..."
            className="w-full bg-[#0d0d26] border border-purple-800/40 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-[#0d0d26] border border-purple-800/40 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            <option value="ALL">Status: All</option>
            <option value={STATUS_TYPES.FOUNDATION}>Foundation</option>
            <option value={STATUS_TYPES.PLANNED}>Planned</option>
            <option value={STATUS_TYPES.IN_PROGRESS}>In Progress</option>
            <option value={STATUS_TYPES.COMPLETED}>Completed</option>
          </select>
        </div>
      </div>

      {/* Grid of 60 Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredFeatures.map((feat) => {
          const mappedPillar = getExperiencePillarForFeature(feat.id);
          return (
            <div
              key={feat.id}
              onClick={() => {
                setSelectedFeature(feat);
                setShowContractsModal(true);
              }}
              className="bg-[#08081a] hover:bg-[#0e0e2e] border border-purple-950/80 hover:border-purple-600/60 rounded-xl p-4 transition-all cursor-pointer flex flex-col justify-between space-y-3 shadow-[0_2px_10px_rgba(0,0,0,0.3)]"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-700/60">
                    {feat.id}
                  </span>
                  <span className="text-[10px] font-sans uppercase font-bold text-indigo-400">
                    Pillar: {mappedPillar}
                  </span>
                </div>
                <h3 className="font-sans font-bold text-white text-sm line-clamp-1">
                  {feat.name}
                </h3>
                <p className="font-sans text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {feat.purpose}
                </p>
              </div>

              <div className="pt-2 border-t border-purple-950/50 flex items-center justify-between text-[10px]">
                <span className="text-slate-500 font-sans">
                  Phase: {feat.plannedPhase || '1'}
                </span>
                <span className="text-purple-400 font-sans hover:underline flex items-center gap-0.5">
                  Inspect Contract <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
      </>
      )}

      {/* 21-Field Architecture Contract Modal */}
      {showContractsModal && selectedFeature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="max-w-3xl w-full bg-[#08081a] border-2 border-purple-600/60 rounded-2xl p-6 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-purple-900/50 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm px-2.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-600">
                    {selectedFeature.id}
                  </span>
                  <span className="text-xs text-purple-400 font-bold uppercase">
                    Public Pillar: {getExperiencePillarForFeature(selectedFeature.id)}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white font-sans mt-1.5">
                  {selectedFeature.name}
                </h2>
                <p className="text-xs text-slate-400 font-sans mt-0.5">
                  {selectedFeature.purpose}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowContractsModal(false)}
                className="px-3 py-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-xs"
              >
                Close [ESC]
              </button>
            </div>

            {/* Contract Specifications Grid */}
            <div className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-[#0d0d26] rounded-xl border border-purple-900/30">
                  <span className="font-bold text-purple-400 block mb-1">Frontend Requirement:</span>
                  <p className="text-slate-300">{selectedFeature.frontendReq || 'None'}</p>
                </div>
                <div className="p-3 bg-[#0d0d26] rounded-xl border border-purple-900/30">
                  <span className="font-bold text-purple-400 block mb-1">Backend Requirement:</span>
                  <p className="text-slate-300">{selectedFeature.backendReq || 'None'}</p>
                </div>
                <div className="p-3 bg-[#0d0d26] rounded-xl border border-purple-900/30">
                  <span className="font-bold text-purple-400 block mb-1">Database Requirement:</span>
                  <p className="text-slate-300">{selectedFeature.databaseReq || 'None'}</p>
                </div>
                <div className="p-3 bg-[#0d0d26] rounded-xl border border-purple-900/30">
                  <span className="font-bold text-purple-400 block mb-1">AI Requirement:</span>
                  <p className="text-slate-300">{selectedFeature.aiReq || 'None'}</p>
                </div>
                <div className="p-3 bg-[#0d0d26] rounded-xl border border-purple-900/30">
                  <span className="font-bold text-purple-400 block mb-1">Security & Privacy:</span>
                  <p className="text-slate-300">{selectedFeature.securityReq || 'None'}</p>
                </div>
                <div className="p-3 bg-[#0d0d26] rounded-xl border border-purple-900/30">
                  <span className="font-bold text-purple-400 block mb-1">Accessibility (A11y):</span>
                  <p className="text-slate-300">{selectedFeature.accessibilityReq || 'None'}</p>
                </div>
              </div>

              <div className="p-3.5 bg-purple-950/30 rounded-xl border border-purple-700/40 space-y-2">
                <span className="font-bold text-purple-300 block">Acceptance Criteria:</span>
                <p className="text-slate-200 leading-relaxed font-mono text-xs">
                  {selectedFeature.acceptanceCriteria}
                </p>
              </div>

              <div className="p-3.5 bg-[#0d0d26] rounded-xl border border-purple-900/30 space-y-1">
                <span className="font-bold text-purple-400 block">Verification Gate Requirement:</span>
                <p className="text-slate-300">
                  {selectedFeature.validationRequirements}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminControlSurface;
