/**
 * ENGINEERVERSE — User Dashboard Component
 * Manages user's submitted problems, updates/edits, deletes, resolved status toggles,
 * solution proposals exchange, connection credits, and author-solver connections.
 * Designed to cleanly scale across EV-001 through EV-060.
 */

import { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/Card.jsx';
import { Badge } from '../ui/Badge.jsx';
import { Button } from '../ui/Button.jsx';
import { TabPill } from '../ui/TabPill.jsx';
import {
  User,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ThumbsUp,
  PlusCircle,
  Edit3,
  Trash2,
  Check,
  X,
  ExternalLink,
  MessageSquare,
  Sparkles,
  RefreshCw,
  Coins,
  ShieldCheck,
  ArrowRight,
  Send,
  Mail,
  Loader2,
} from 'lucide-react';
import { authService, AUTHORIZED_ADMIN_EMAIL } from '../../services/firebaseClient.js';
import { apiFetch } from '../../config/api.js';

export function UserDashboard({ isOpen, onClose, onOpenSubmitModal, onOpenAdmin, onOpenProfile }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('my-problems'); // 'my-problems' | 'my-solutions' | 'my-supported' | 'profile'
  const [loading, setLoading] = useState(true);
  const [myProblems, setMyProblems] = useState([]);
  const [mySolutions, setMySolutions] = useState([]);
  const [mySupported, setMySupported] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  // Edit Problem State
  const [editingProblem, setEditingProblem] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editAffectedUsers, setEditAffectedUsers] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTags, setEditTags] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete Confirmation State
  const [deletingProblemId, setDeletingProblemId] = useState(null);

  const categories = ['Environment', 'Agriculture', 'Accessibility', 'Infrastructure', 'Healthcare', 'Education', 'Hardware', 'Energy'];

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);

      if (!user || user.isAnonymous) {
        setLoading(false);
        return;
      }

      // Fetch User Profile & Credits
      const profileRes = await apiFetch('/api/auth/me');
      if (profileRes.ok) {
        const pData = await profileRes.json();
        if (pData.user) setUserProfile(pData.user);
      }

      // Fetch My Problems
      const myProbRes = await apiFetch('/api/problems/user/my-problems');
      if (myProbRes.ok) {
        const probData = await myProbRes.json();
        if (probData.problems) setMyProblems(probData.problems);
      }

      // Fetch My Solutions
      const mySolRes = await apiFetch('/api/problems/user/my-solutions');
      if (mySolRes.ok) {
        const solData = await mySolRes.json();
        if (solData.solutions) setMySolutions(solData.solutions);
      }

      // Fetch Supported
      const mySupRes = await apiFetch('/api/problems/user/my-supported');
      if (mySupRes.ok) {
        const supData = await mySupRes.json();
        if (supData.problems) setMySupported(supData.problems);
      }
    } catch (err) {
      console.warn('[UserDashboard] Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadDashboardData();
    }
  }, [isOpen, loadDashboardData]);

  // Toggle Problem Resolved Status
  const handleToggleResolve = async (problemId, currentResolved) => {
    try {
      const res = await apiFetch(`/api/problems/${problemId}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isResolved: !currentResolved }),
      });

      if (res.ok) {
        setMyProblems((prev) =>
          prev.map((p) =>
            p.id === problemId
              ? { ...p, isResolved: !currentResolved, resolvedAt: !currentResolved ? new Date().toISOString() : null }
              : p
          )
        );
        setActionMessage({
          type: 'success',
          text: !currentResolved ? 'Problem marked as Resolved!' : 'Problem reopened as Active.',
        });
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Failed to update problem resolution status.' });
    }
  };

  // Open Edit Modal
  const startEditing = (problem) => {
    setEditingProblem(problem);
    setEditTitle(problem.title || '');
    setEditCategory(problem.category || 'Agriculture');
    setEditAffectedUsers(problem.affectedUsers || '');
    setEditDescription(problem.description || '');
    setEditTags(Array.isArray(problem.tags) ? problem.tags.join(', ') : '');
  };

  // Save Problem Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingProblem || !editTitle.trim() || !editDescription.trim()) return;

    setIsSavingEdit(true);
    try {
      const tagsArray = editTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await apiFetch(`/api/problems/${editingProblem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          category: editCategory,
          affectedUsers: editAffectedUsers.trim(),
          description: editDescription.trim(),
          tags: tagsArray.length > 0 ? tagsArray : [editCategory],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMyProblems((prev) =>
          prev.map((p) => (p.id === editingProblem.id ? { ...p, ...data.problem } : p))
        );
        setEditingProblem(null);
        setActionMessage({ type: 'success', text: 'Problem updated successfully.' });
        setTimeout(() => setActionMessage(null), 4000);
      } else {
        const err = await res.json();
        setActionMessage({ type: 'error', text: err.error || 'Could not update problem.' });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Network error updating problem.' });
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete Problem
  const handleDeleteProblem = async (problemId) => {
    try {
      const res = await apiFetch(`/api/problems/${problemId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setMyProblems((prev) => prev.filter((p) => p.id !== problemId));
        setDeletingProblemId(null);
        setActionMessage({ type: 'success', text: 'Problem deleted successfully.' });
        setTimeout(() => setActionMessage(null), 4000);
      } else {
        const err = await res.json();
        setActionMessage({ type: 'error', text: err.error || 'Failed to delete problem.' });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Network error deleting problem.' });
    }
  };

  // Author accepts or declines solution proposal
  const handleRespondToSolution = async (problemId, solutionId, action) => {
    try {
      const res = await apiFetch(`/api/problems/${problemId}/solutions/${solutionId}/connect`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        const data = await res.json();
        // Update local problems state
        setMyProblems((prev) =>
          prev.map((p) => {
            if (p.id !== problemId) return p;
            const updatedSolutions = (p.solutions || []).map((s) =>
              s.id === solutionId ? { ...s, status: data.solution?.status || action } : s
            );
            return { ...p, solutions: updatedSolutions };
          })
        );
        setActionMessage({
          type: 'success',
          text: action === 'connect' ? 'Connection established! Solver can now reach out.' : 'Proposal declined.',
        });
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Failed to respond to proposal.' });
    }
  };

  if (!isOpen) return null;

  const isAdmin = currentUser?.email && currentUser.email.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-5xl my-auto bg-[#070718] border border-purple-900/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-purple-950/60 bg-gradient-to-r from-purple-950/40 via-[#0a0a20] to-[#070718] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0 overflow-hidden">
              {currentUser?.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'Profile'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate">
                  Engineer Dashboard
                </h2>
                <Badge variant="purple" size="xs">
                  {isAdmin ? 'Administrator' : 'Community Engineer'}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 truncate">
                {currentUser?.displayName || currentUser?.email || 'Logged In Engineer'}
                {currentUser?.email && ` (${currentUser.email})`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadDashboardData}
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition"
              title="Refresh Dashboard"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Close Dashboard"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Warning Banner if Account is Warned */}
        {userProfile?.status === 'warned' && (
          <div className="px-6 py-3 bg-amber-950/60 border-b border-amber-600/40 flex items-center gap-3 text-amber-200 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="flex-1">
              <span className="font-bold">Administrative Advisory:</span> {userProfile.warningReason}
            </div>
          </div>
        )}

        {/* Action Alert Message */}
        {actionMessage && (
          <div
            className={`px-6 py-2.5 text-xs flex items-center gap-2 border-b animate-in fade-in ${
              actionMessage.type === 'success'
                ? 'bg-emerald-950/60 text-emerald-200 border-emerald-500/40'
                : 'bg-red-950/60 text-red-200 border-red-500/40'
            }`}
          >
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* Top Metric Strip & Quick Actions */}
        <div className="p-4 sm:p-6 bg-purple-950/15 border-b border-purple-950/40 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-purple-900/30">
            <span className="text-[11px] text-slate-400 block font-medium">Problems Submitted</span>
            <span className="text-xl sm:text-2xl font-black text-white font-mono">{myProblems.length}</span>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] border border-purple-900/30">
            <span className="text-[11px] text-slate-400 block font-medium">Problems Supported</span>
            <span className="text-xl sm:text-2xl font-black text-purple-300 font-mono">{mySupported.length}</span>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] border border-purple-900/30">
            <span className="text-[11px] text-slate-400 block font-medium">Solutions Offered</span>
            <span className="text-xl sm:text-2xl font-black text-blue-300 font-mono">{mySolutions.length}</span>
          </div>

          <div className="p-3 rounded-2xl bg-purple-900/20 border border-purple-500/40 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-purple-200 block font-medium">Connection Credits</span>
              <span className="text-xl sm:text-2xl font-black text-white font-mono">
                {userProfile?.connectionCredits ?? 5}
              </span>
            </div>
            <Coins className="w-6 h-6 text-amber-400/80" />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 sm:px-6 pt-3 border-b border-purple-950/40 flex items-center justify-between gap-4 overflow-x-auto scrollbar-none shrink-0 bg-[#060614]">
          <div className="flex items-center gap-2">
            <TabPill
              active={activeTab === 'my-problems'}
              onClick={() => setActiveTab('my-problems')}
            >
              My Problems ({myProblems.length})
            </TabPill>
            <TabPill
              active={activeTab === 'my-solutions'}
              onClick={() => setActiveTab('my-solutions')}
            >
              Proposed Solutions ({mySolutions.length})
            </TabPill>
            <TabPill
              active={activeTab === 'my-supported'}
              onClick={() => setActiveTab('my-supported')}
            >
              Supported ({mySupported.length})
            </TabPill>
            <TabPill
              active={activeTab === 'profile'}
              onClick={() => setActiveTab('profile')}
            >
              Roadmap & DNA
            </TabPill>
          </div>

          <div className="flex items-center gap-2 shrink-0 pb-2">
            {onOpenProfile && (
              <Button
                variant="ghost"
                size="sm"
                icon={User}
                onClick={() => {
                  onClose();
                  onOpenProfile();
                }}
                className="text-xs text-purple-300 hover:text-white hover:bg-purple-950/60"
              >
                Profile Settings
              </Button>
            )}
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                icon={ShieldCheck}
                onClick={() => {
                  onClose();
                  if (onOpenAdmin) onOpenAdmin();
                }}
                className="text-xs border-purple-600/50 text-purple-300 hover:bg-purple-900/40"
              >
                Admin Panel
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              icon={PlusCircle}
              onClick={() => {
                onClose();
                if (onOpenSubmitModal) onOpenSubmitModal();
              }}
              className="text-xs cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.3)]"
            >
              New Problem
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              <span className="text-xs">Loading your engineering records...</span>
            </div>
          ) : (
            <>
              {/* TAB 1: MY PROBLEMS */}
              {activeTab === 'my-problems' && (
                <div className="space-y-4">
                  {myProblems.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-purple-900/40 rounded-2xl p-6 space-y-3">
                      <p className="text-sm text-slate-400">
                        You haven't submitted any problems to The Problem Wall yet.
                      </p>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={PlusCircle}
                        onClick={() => {
                          onClose();
                          if (onOpenSubmitModal) onOpenSubmitModal();
                        }}
                      >
                        Submit Your First Problem
                      </Button>
                    </div>
                  ) : (
                    myProblems.map((problem) => (
                      <Card key={problem.id} className="p-5 space-y-4 bg-white/[0.02] border-purple-900/30">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-800/40">
                                {problem.category}
                              </span>
                              {problem.isResolved ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-600/40">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  Resolved
                                </span>
                              ) : (
                                <span className="text-[11px] font-medium text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800/40">
                                  Active Challenge
                                </span>
                              )}
                              <span className="text-xs text-slate-400">
                                • {problem.supporterCount || 0} supporters
                              </span>
                            </div>

                            <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                              {problem.title}
                            </h3>

                            <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                              {problem.description}
                            </p>
                          </div>

                          {/* Problem Management Actions */}
                          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                            <button
                              type="button"
                              onClick={() => handleToggleResolve(problem.id, problem.isResolved)}
                              className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition cursor-pointer ${
                                problem.isResolved
                                  ? 'bg-amber-950/50 border-amber-600/40 text-amber-300 hover:bg-amber-900/50'
                                  : 'bg-emerald-950/50 border-emerald-600/40 text-emerald-300 hover:bg-emerald-900/50'
                              }`}
                              title={problem.isResolved ? 'Reopen problem' : 'Mark problem as resolved'}
                            >
                              {problem.isResolved ? 'Reopen' : 'Mark Resolved'}
                            </button>

                            <button
                              type="button"
                              onClick={() => startEditing(problem)}
                              className="p-1.5 rounded-lg text-slate-300 bg-slate-900/80 border border-slate-700 hover:border-purple-500 hover:text-white transition cursor-pointer"
                              title="Edit Problem"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeletingProblemId(problem.id)}
                              className="p-1.5 rounded-lg text-red-400 bg-red-950/30 border border-red-900/40 hover:bg-red-900/50 hover:text-red-200 transition cursor-pointer"
                              title="Delete Problem"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Solutions Proposed by Other Engineers */}
                        <div className="pt-3 border-t border-purple-950/40 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-purple-300 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                              Technical Proposals Received ({problem.solutions ? problem.solutions.length : 0})
                            </span>
                            {problem.solutions && problem.solutions.length > 0 && (
                              <span className="text-[11px] text-slate-400">
                                Connect with solvers to review their technical approach
                              </span>
                            )}
                          </div>

                          {(!problem.solutions || problem.solutions.length === 0) ? (
                            <p className="text-[11px] text-slate-500 italic">
                              No technical solutions proposed yet. Other engineers can propose approaches directly through The Problem Wall.
                            </p>
                          ) : (
                            <div className="space-y-2 mt-2">
                              {problem.solutions.map((sol) => (
                                <div
                                  key={sol.id}
                                  className="p-3 rounded-xl bg-purple-950/30 border border-purple-900/40 space-y-2 text-xs"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-white">{sol.solverName}</span>
                                      {sol.status === 'connected' ? (
                                        <Badge variant="emerald" size="xs">
                                          Connected
                                        </Badge>
                                      ) : sol.status === 'declined' ? (
                                        <Badge variant="slate" size="xs">
                                          Declined
                                        </Badge>
                                      ) : (
                                        <Badge variant="purple" size="xs">
                                          Pending Review
                                        </Badge>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-slate-400">
                                      Est. Timeline: {sol.estimatedTimeline || 'Flexible'}
                                    </span>
                                  </div>

                                  <p className="text-slate-200 text-xs">{sol.proposedSolution}</p>

                                  {sol.contactPitch && (
                                    <p className="text-[11px] text-purple-300 bg-purple-950/40 p-2 rounded-lg border border-purple-800/30">
                                      <span className="font-semibold text-purple-200">Pitch:</span> {sol.contactPitch}
                                    </p>
                                  )}

                                  {/* Contact Information & Response Actions */}
                                  <div className="pt-2 flex items-center justify-between gap-2 text-[11px]">
                                    {sol.status === 'connected' ? (
                                      <div className="flex items-center gap-1.5 text-emerald-300 font-mono">
                                        <Mail className="w-3.5 h-3.5 text-emerald-400" />
                                        <span>Direct Contact: {sol.solverEmail || 'Email verified via platform'}</span>
                                      </div>
                                    ) : (
                                      <span className="text-slate-400">
                                        Email hidden until connection is accepted.
                                      </span>
                                    )}

                                    {sol.status === 'pending' && (
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => handleRespondToSolution(problem.id, sol.id, 'connect')}
                                          className="px-2.5 py-1 rounded-md bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition cursor-pointer"
                                        >
                                          Connect & Reveal Contact
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleRespondToSolution(problem.id, sol.id, 'decline')}
                                          className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 transition cursor-pointer"
                                        >
                                          Decline
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              )}

              {/* TAB 2: MY PROPOSED SOLUTIONS */}
              {activeTab === 'my-solutions' && (
                <div className="space-y-4">
                  {mySolutions.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-purple-900/40 rounded-2xl p-6 space-y-3">
                      <p className="text-sm text-slate-400">
                        You haven't proposed solutions to any community challenges yet.
                      </p>
                      <p className="text-xs text-slate-500">
                        Browse The Problem Wall and click "Propose Solution / Connect" to offer technical architectures.
                      </p>
                    </div>
                  ) : (
                    mySolutions.map((sol) => (
                      <Card key={sol.id} className="p-5 space-y-3 bg-white/[0.02] border-purple-900/30">
                        <div className="flex items-center justify-between gap-2">
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">
                              Challenge Proposal
                            </span>
                            <h4 className="text-sm font-bold text-white">{sol.problemTitle}</h4>
                          </div>
                          {sol.status === 'connected' ? (
                            <Badge variant="emerald" size="xs">
                              Connected
                            </Badge>
                          ) : sol.status === 'declined' ? (
                            <Badge variant="slate" size="xs">
                              Declined
                            </Badge>
                          ) : (
                            <Badge variant="purple" size="xs">
                              Under Review by Author
                            </Badge>
                          )}
                        </div>

                        <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-900/40 text-xs text-slate-200">
                          <span className="font-semibold text-purple-300 block mb-1">Your Proposed Architecture:</span>
                          {sol.proposedSolution}
                        </div>

                        {sol.status === 'connected' && (
                          <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-600/40 text-xs text-emerald-200 flex items-center justify-between">
                            <span>Author accepted your connection request! Check your email to collaborate.</span>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          </div>
                        )}
                      </Card>
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: SUPPORTED PROBLEMS */}
              {activeTab === 'my-supported' && (
                <div className="space-y-4">
                  {mySupported.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-purple-900/40 rounded-2xl p-6 space-y-3">
                      <p className="text-sm text-slate-400">
                        You haven't supported any problems yet.
                      </p>
                      <p className="text-xs text-slate-500">
                        Visit The Problem Wall to lend your verified engineering support to meaningful community challenges.
                      </p>
                    </div>
                  ) : (
                    mySupported.map((p) => (
                      <Card key={p.id} className="p-4 flex items-center justify-between gap-4 bg-white/[0.02] border-purple-900/30">
                        <div className="space-y-1 min-w-0">
                          <span className="text-[10px] font-bold uppercase text-purple-400">
                            {p.category}
                          </span>
                          <h4 className="text-sm font-bold text-white truncate">{p.title}</h4>
                          <span className="text-xs text-slate-400 block">
                            Submitted by {p.submittedBy} • {p.supporterCount} real supporters
                          </span>
                        </div>
                        <Badge variant="purple" size="xs" className="shrink-0">
                          Supported
                        </Badge>
                      </Card>
                    ))
                  )}
                </div>
              )}

              {/* TAB 4: ROADMAP & PROFILE */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div className="p-5 rounded-2xl bg-purple-950/30 border border-purple-900/40 space-y-3">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      Engineerverse Unified Progression (EV-001 through EV-060)
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Your engineer dashboard evolves with the Engineerverse platform. As features from EV-001 to EV-060 unlock,
                      this surface integrates your verified Engineering DNA, mentorship hours, hackathon submissions, and community reputation.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                      <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">Account Credentials</span>
                      <div className="text-xs text-slate-300 space-y-1">
                        <div>Name: <span className="text-white font-medium">{currentUser?.displayName || 'Engineer'}</span></div>
                        <div>Email: <span className="text-white font-mono">{currentUser?.email || 'N/A'}</span></div>
                        <div>Status: <span className="text-emerald-400 capitalize font-medium">{userProfile?.status || 'active'}</span></div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                      <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">Connection Credits</span>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        You have <span className="text-white font-bold">{userProfile?.connectionCredits ?? 5} credits</span> remaining.
                        Each solution proposal or connection handshake uses 1 credit to maintain signal-to-noise ratio.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-purple-950/60 bg-[#060614] flex items-center justify-between gap-4 shrink-0">
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Zero fake numbers. Authenticated engineering integrity guaranteed.
          </span>
          <Button variant="outline" size="sm" onClick={onClose} className="cursor-pointer">
            Close Dashboard
          </Button>
        </div>
      </div>

      {/* Edit Problem Modal */}
      {editingProblem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-xl bg-[#08081a] border border-purple-800/60 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Edit Engineering Challenge</h3>
              <button
                type="button"
                onClick={() => setEditingProblem(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-purple-950/30 border border-purple-800/40 text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-purple-950/30 border border-purple-800/40 text-white focus:outline-none focus:border-purple-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c} className="bg-[#0b0b20]">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Affected Community</label>
                  <input
                    type="text"
                    value={editAffectedUsers}
                    onChange={(e) => setEditAffectedUsers(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-purple-950/30 border border-purple-800/40 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-purple-950/30 border border-purple-800/40 text-white focus:outline-none focus:border-purple-500 resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-purple-950/30 border border-purple-800/40 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingProblem(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSavingEdit}
                >
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProblemId && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-[#08081a] border border-red-800/60 rounded-3xl p-6 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-red-950/80 border border-red-600/60 flex items-center justify-center text-red-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Delete this Problem?</h3>
            <p className="text-xs text-slate-300">
              This action cannot be undone. The problem will be permanently removed from The Problem Wall.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingProblemId(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleDeleteProblem(deletingProblemId)}
                className="bg-red-600 hover:bg-red-500 border-red-500"
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserDashboard;
