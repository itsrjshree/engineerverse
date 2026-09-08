/**
 * ENGINEERVERSE — The Problem Wall Component
 * Initiative: "India Still Has Problems. Engineers Still Have Work."
 * 
 * Strict Integrity Guarantees:
 * - Zero fake support counts. All counts reflect genuine authenticated user upvotes.
 * - Submissions and support actions strictly require authenticated accounts.
 * - Integrated Engineer Dashboard for authors to edit, update, delete, and mark problems as resolved.
 * - Direct Solution Proposal & Handshake Connect flow between solvers and problem authors.
 * - Full administrative moderation capabilities.
 */

import { useState, useEffect, useCallback } from 'react';
import { Card } from './ui/Card.jsx';
import { Badge } from './ui/Badge.jsx';
import { Button } from './ui/Button.jsx';
import { TabPill } from './ui/TabPill.jsx';
import {
  ThumbsUp,
  PlusCircle,
  Search,
  Users,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  LayoutDashboard,
  MessageSquare,
  Edit3,
  Trash2,
  Check,
  RotateCcw,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { analytics } from '../services/analytics.js';
import { ANALYTICS_EVENTS } from '../config/analyticsEvents.js';
import { apiFetch } from '../config/api.js';
import { authService, AUTHORIZED_ADMIN_EMAIL } from '../services/firebaseClient.js';
import { AuthModal } from './auth/AuthModal.jsx';
import { UserDashboard } from './dashboard/UserDashboard.jsx';
import { ProposeSolutionModal } from './dashboard/ProposeSolutionModal.jsx';

const LOCAL_STORAGE_PROBLEMS_KEY = 'engineerverse_community_problems_v2';

export function ProblemsWallPreview({ onOpenAdmin }) {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterResolved, setFilterResolved] = useState('all'); // 'all' | 'active' | 'resolved'

  // Modals state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authPromptReason, setAuthPromptReason] = useState(null);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [proposeSolutionProblem, setProposeSolutionProblem] = useState(null);

  // Status & Feedback Messages
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [supportingProblemId, setSupportingProblemId] = useState(null);

  // Authentication status
  const [currentUser, setCurrentUser] = useState(null);

  // New problem form fields
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Agriculture');
  const [newAffectedUsers, setNewAffectedUsers] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTags, setNewTags] = useState('');

  // Categories list
  const categories = ['All', 'Environment', 'Agriculture', 'Accessibility', 'Infrastructure', 'Healthcare', 'Education', 'Hardware'];

  // Subscribe to authentication changes
  useEffect(() => {
    const unsub = authService.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  // Fetch problems from server API
  const loadProblems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/problems');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.problems)) {
          setProblems(data.problems);
          try {
            localStorage.setItem(LOCAL_STORAGE_PROBLEMS_KEY, JSON.stringify(data.problems));
          } catch {}
        }
      }
    } catch (err) {
      console.warn('[ProblemWall] Failed to fetch server problems, falling back to cache:', err);
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_PROBLEMS_KEY);
        if (cached) setProblems(JSON.parse(cached));
      } catch {}
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProblems();
  }, [loadProblems]);

  // Re-fetch when user signs in or out to update hasSupported states
  useEffect(() => {
    if (currentUser) {
      loadProblems();
    }
  }, [currentUser?.uid, loadProblems]);

  // Handle authenticated support action
  const handleSupport = async (id) => {
    if (!currentUser || currentUser.isAnonymous) {
      setAuthPromptReason('Please sign in to support community challenges on The Problem Wall.');
      setIsAuthModalOpen(true);
      return;
    }

    setSupportingProblemId(id);
    try {
      const res = await apiFetch(`/api/problems/${id}/support`, {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        setProblems((prev) =>
          prev.map((p) =>
            p.id === id
              ? {
                  ...p,
                  hasSupported: data.supported,
                  supporterCount: data.supporterCount,
                }
              : p
          )
        );

        setFeedbackMessage({
          type: 'success',
          text: data.supported ? 'Verified support registered!' : 'Support removed.',
        });
        setTimeout(() => setFeedbackMessage(null), 3000);

        analytics.track(ANALYTICS_EVENTS.PROBLEM_SUPPORT, {
          problemId: id,
          supported: data.supported,
        });
      } else {
        const err = await res.json();
        setFeedbackMessage({ type: 'error', text: err.error || 'Failed to register support.' });
      }
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: 'Network error updating support.' });
    } finally {
      setSupportingProblemId(null);
    }
  };

  // Open problem submission modal (auth-gated)
  const handleOpenSubmit = () => {
    if (!currentUser || currentUser.isAnonymous) {
      setAuthPromptReason('Please sign in with an authenticated account to submit a challenge to The Problem Wall.');
      setIsAuthModalOpen(true);
      return;
    }
    setIsSubmitModalOpen(true);
  };

  // Open propose solution modal (auth-gated)
  const handleOpenProposeSolution = (problem) => {
    if (!currentUser || currentUser.isAnonymous) {
      setAuthPromptReason('Please sign in to propose an engineering solution and connect with the author.');
      setIsAuthModalOpen(true);
      return;
    }
    setProposeSolutionProblem(problem);
  };

  // Open dashboard (auth-gated)
  const handleOpenDashboard = () => {
    if (!currentUser || currentUser.isAnonymous) {
      setAuthPromptReason('Please sign in to view your Engineer Dashboard.');
      setIsAuthModalOpen(true);
      return;
    }
    setIsDashboardOpen(true);
  };

  // Handle authenticated problem submission
  const handleSubmitProblem = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    if (!currentUser || currentUser.isAnonymous) {
      setIsSubmitModalOpen(false);
      setAuthPromptReason('Please sign in to submit your problem.');
      setIsAuthModalOpen(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const tagsArray = newTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await apiFetch('/api/problems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          category: newCategory,
          affectedUsers: newAffectedUsers.trim() || 'Community & Public',
          description: newDescription.trim(),
          tags: tagsArray.length > 0 ? tagsArray : [newCategory, 'Community'],
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.problem) {
        setProblems((prev) => [data.problem, ...prev]);
        setIsSubmitModalOpen(false);
        setFeedbackMessage({
          type: 'success',
          text: 'Challenge submitted successfully! It is now live on The Problem Wall and in your Dashboard.',
        });
        setTimeout(() => setFeedbackMessage(null), 5000);

        // Reset form
        setNewTitle('');
        setNewAffectedUsers('');
        setNewDescription('');
        setNewTags('');

        analytics.track(ANALYTICS_EVENTS.PROBLEM_SUBMITTED, {
          title: newTitle,
          category: newCategory,
          submittedBy: currentUser.displayName || currentUser.email,
        });
      } else {
        setFeedbackMessage({ type: 'error', text: data.error || 'Failed to submit problem.' });
      }
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: 'Network error submitting problem.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick toggle resolved status (Author or Admin)
  const handleToggleResolve = async (problemId, currentResolved) => {
    try {
      const res = await apiFetch(`/api/problems/${problemId}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isResolved: !currentResolved }),
      });

      if (res.ok) {
        setProblems((prev) =>
          prev.map((p) =>
            p.id === problemId
              ? {
                  ...p,
                  isResolved: !currentResolved,
                  resolvedAt: !currentResolved ? new Date().toISOString() : null,
                }
              : p
          )
        );
        setFeedbackMessage({
          type: 'success',
          text: !currentResolved ? 'Problem marked as Resolved!' : 'Problem marked as Active.',
        });
        setTimeout(() => setFeedbackMessage(null), 4000);
      }
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: 'Failed to update resolution status.' });
    }
  };

  // Quick delete problem (Author or Admin)
  const handleDeleteProblem = async (problemId) => {
    if (!window.confirm('Are you sure you want to delete this problem from The Problem Wall?')) return;

    try {
      const res = await apiFetch(`/api/problems/${problemId}`, { method: 'DELETE' });
      if (res.ok) {
        setProblems((prev) => prev.filter((p) => p.id !== problemId));
        setFeedbackMessage({ type: 'success', text: 'Problem removed successfully.' });
        setTimeout(() => setFeedbackMessage(null), 4000);
      }
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: 'Failed to delete problem.' });
    }
  };

  // Filter problems by Category, Search Query, and Resolved status
  const filteredProblems = problems.filter((prob) => {
    const matchesCategory = selectedCategory === 'All' || prob.category === selectedCategory;

    const matchesStatus =
      filterResolved === 'all'
        ? true
        : filterResolved === 'resolved'
          ? Boolean(prob.isResolved)
          : !prob.isResolved;

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      prob.title.toLowerCase().includes(q) ||
      prob.description.toLowerCase().includes(q) ||
      prob.submittedBy?.toLowerCase().includes(q) ||
      prob.tags?.some((t) => t.toLowerCase().includes(q));

    return matchesCategory && matchesStatus && matchesSearch;
  });

  const isAdmin = currentUser?.email && currentUser.email.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase();

  return (
    <div className="w-full space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="purple" size="xs">Humanity Pillar</Badge>
            <span className="text-xs text-purple-400 font-bold uppercase tracking-wider">
              Verified Community Engineering
            </span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            The Problem Wall.
          </h2>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl font-medium">
            <span className="text-purple-300 font-bold">India Still Has Problems. Engineers Still Have Work.</span>{' '}
            Authentic community-submitted engineering challenges. Zero fake metrics—all votes and submissions are verified.
          </p>
        </div>

        {/* Header Action Buttons: My Dashboard & Submit Problem */}
        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            size="md"
            icon={LayoutDashboard}
            onClick={handleOpenDashboard}
            className="cursor-pointer border-purple-600/40 text-purple-200 hover:bg-purple-900/30"
          >
            My Dashboard
          </Button>

          <Button
            variant="primary"
            size="md"
            icon={PlusCircle}
            onClick={handleOpenSubmit}
            className="cursor-pointer shadow-[0_0_20px_rgba(168,85,247,0.3)]"
          >
            Submit a Problem
          </Button>
        </div>
      </div>

      {/* Real Integrity Callout Badge */}
      <div className="px-4 py-2.5 rounded-xl bg-purple-950/40 border border-purple-800/40 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
          <span>
            <strong className="text-white">Honest Metrics:</strong> Supporter counts reflect genuine authenticated engineers. Submissions and upvotes require verified community identity.
          </span>
        </div>
        {currentUser && !currentUser.isAnonymous ? (
          <span className="text-emerald-400 font-medium hidden sm:inline">
            Signed in as {currentUser.displayName || currentUser.email}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            className="text-purple-300 hover:text-white underline cursor-pointer font-medium"
          >
            Sign in to participate
          </button>
        )}
      </div>

      {/* Feedback Alert Message */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 animate-in fade-in border ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
              : 'bg-red-950/60 border-red-500/50 text-red-200'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Filter, Search & Status Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-purple-950/20 p-4 rounded-2xl border border-purple-900/30">
        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <TabPill
              key={cat}
              active={selectedCategory === cat}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </TabPill>
          ))}
        </div>

        {/* Search & Resolution Status Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
          {/* Status filter toggle */}
          <div className="flex items-center justify-center sm:justify-start bg-black/40 rounded-xl p-1 border border-purple-900/40 shrink-0">
            <button
              type="button"
              onClick={() => setFilterResolved('all')}
              className={`flex-1 sm:flex-none text-center px-2.5 py-1 text-xs rounded-lg transition cursor-pointer ${
                filterResolved === 'all'
                  ? 'bg-purple-900/60 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterResolved('active')}
              className={`flex-1 sm:flex-none text-center px-2.5 py-1 text-xs rounded-lg transition cursor-pointer ${
                filterResolved === 'active'
                  ? 'bg-purple-900/60 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setFilterResolved('resolved')}
              className={`flex-1 sm:flex-none text-center px-2.5 py-1 text-xs rounded-lg transition cursor-pointer ${
                filterResolved === 'resolved'
                  ? 'bg-purple-900/60 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Resolved
            </button>
          </div>

          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search challenges, keywords, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-purple-950/40 border border-purple-900/40 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Problems Grid */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          <span className="text-xs">Loading verified engineering challenges...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProblems.map((problem) => {
            const isAuthor = currentUser && currentUser.uid === problem.authorId;
            const canManage = isAuthor || isAdmin;

            return (
              <Card key={problem.id} className="p-6 flex flex-col justify-between space-y-4 bg-[#08081a]/90 border-purple-900/40">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-800/40">
                      {problem.category}
                    </span>

                    <div className="flex items-center gap-2">
                      {problem.isResolved ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-600/40">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Resolved
                        </span>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Users className="w-3.5 h-3.5 text-purple-400" />
                          <span className="text-[11px] truncate max-w-[160px]">{problem.affectedUsers}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                    {problem.title}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {problem.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {problem.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-purple-300 border border-white/10"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Solutions & Solvers indicator */}
                  {problem.solutionsCount > 0 && (
                    <div className="p-2 rounded-lg bg-purple-950/30 border border-purple-900/30 flex items-center justify-between text-[11px] text-purple-300">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        {problem.solutionsCount} Technical {problem.solutionsCount === 1 ? 'Proposal' : 'Proposals'} Submitted
                      </span>
                      {problem.connectedSolversCount > 0 && (
                        <Badge variant="emerald" size="xs">
                          {problem.connectedSolversCount} Connected
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Actions & Footer */}
                <div className="pt-4 border-t border-purple-950/50 space-y-3">
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-400 min-w-0">
                      <span>Submitted by:</span>
                      <span className="font-semibold text-purple-300 truncate max-w-[180px]">
                        {problem.submittedBy || 'Community Engineer'}
                      </span>
                    </div>

                    {/* Author/Admin Management Shortcuts */}
                    {canManage && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleResolve(problem.id, problem.isResolved)}
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded border transition cursor-pointer ${
                            problem.isResolved
                              ? 'bg-amber-950/50 border-amber-600/40 text-amber-300'
                              : 'bg-emerald-950/50 border-emerald-600/40 text-emerald-300'
                          }`}
                          title={problem.isResolved ? 'Reopen as Active' : 'Mark as Resolved'}
                        >
                          {problem.isResolved ? 'Reopen' : 'Resolve'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProblem(problem.id)}
                          className="p-1 rounded text-red-400 hover:bg-red-950/40 transition cursor-pointer"
                          title="Delete problem"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons: Support + Propose Solution / Connect */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleSupport(problem.id)}
                      disabled={supportingProblemId === problem.id}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        problem.hasSupported
                          ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                          : 'bg-purple-950/60 hover:bg-purple-900/60 text-purple-200 border border-purple-800/40'
                      }`}
                      title={currentUser ? 'Support this challenge' : 'Sign in to support'}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{problem.hasSupported ? 'Supported' : 'Support'}</span>
                      <span className="ml-0.5 font-mono text-purple-200 font-bold">
                        ({problem.supporterCount || 0})
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenProposeSolution(problem)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/5 hover:bg-white/10 text-purple-200 border border-purple-700/40 transition cursor-pointer"
                      title="Propose an engineering approach or connect with the author"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>Propose Solution & Connect</span>
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {filteredProblems.length === 0 && !loading && (
        <div className="text-center py-16 border border-dashed border-purple-900/50 rounded-2xl p-8 space-y-3">
          <p className="text-slate-400 text-sm">No engineering challenges found matching your criteria.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedCategory('All');
              setSearchQuery('');
              setFilterResolved('all');
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Problem Submission Modal (Auth Gated) */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-xl bg-[#08081a] border border-purple-800/60 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-800/40">
                  Verified Contribution
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Submit an Engineering Challenge
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Submitted under verified profile:{' '}
                <span className="text-purple-300 font-semibold">
                  {currentUser?.displayName || currentUser?.email}
                </span>
              </p>
            </div>

            <form onSubmit={handleSubmitProblem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Challenge Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Solar-Powered Thermal Cold Storage for Perishable Crops"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-purple-950/30 border border-purple-800/40 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Discipline / Category <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-purple-950/30 border border-purple-800/40 text-white focus:outline-none focus:border-purple-500"
                  >
                    {categories.filter((c) => c !== 'All').map((cat) => (
                      <option key={cat} value={cat} className="bg-[#0b0b20]">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Affected Community / Population
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 5,000 smallholder farmers in Maharashtra"
                    value={newAffectedUsers}
                    onChange={(e) => setNewAffectedUsers(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-purple-950/30 border border-purple-800/40 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Problem Description & Requirements <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Explain the real-world challenge, technical constraints, why current commercial solutions fail, and target BOM/cost goals..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-purple-950/30 border border-purple-800/40 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 resize-none font-sans"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Engineering Tags (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Solar, IoT, Embedded, Microcontrollers, Frugal"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-purple-950/30 border border-purple-800/40 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSubmitModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting || !newTitle.trim() || !newDescription.trim()}
                  className="shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit to Problem Wall'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Dashboard Modal */}
      <UserDashboard
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
        onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
        onOpenAdmin={onOpenAdmin}
      />

      {/* Propose Solution Modal */}
      <ProposeSolutionModal
        problem={proposeSolutionProblem}
        isOpen={Boolean(proposeSolutionProblem)}
        onClose={() => setProposeSolutionProblem(null)}
        onSuccess={(msg) => {
          setFeedbackMessage({ type: 'success', text: msg });
          setTimeout(() => setFeedbackMessage(null), 5000);
          loadProblems();
        }}
      />

      {/* Global Auth Modal for Gated Actions */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setAuthPromptReason(null);
        }}
        promptReason={authPromptReason}
        onSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthModalOpen(false);
          setAuthPromptReason(null);
          loadProblems();
        }}
      />
    </div>
  );
}

export default ProblemsWallPreview;
