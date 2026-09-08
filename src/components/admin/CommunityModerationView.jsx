/**
 * ENGINEERVERSE — Community & Problem Wall Moderation Console
 * Administrator Control Panel:
 * - Full problem CRUD (edit, update, delete, mark resolved).
 * - User account governance (warn, suspend, restore, top up connection credits).
 * - Full audit logs of administrative actions.
 */

import { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/Card.jsx';
import { Badge } from '../ui/Badge.jsx';
import { Button } from '../ui/Button.jsx';
import { TabPill } from '../ui/TabPill.jsx';
import {
  ShieldAlert,
  Users,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Edit3,
  Search,
  RefreshCw,
  Coins,
  ShieldCheck,
  UserX,
  UserCheck,
  Eye,
  X,
  MessageSquare,
  Lock,
  Loader2,
} from 'lucide-react';
import { apiFetch } from '../../config/api.js';

export function CommunityModerationView() {
  const [activeSubTab, setActiveSubTab] = useState('problems'); // 'problems' | 'users'
  const [problems, setProblems] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Problem Edit State
  const [editingProblem, setEditingProblem] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAffectedUsers, setEditAffectedUsers] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // User Warn State
  const [warningUser, setWarningUser] = useState(null);
  const [warningReason, setWarningReason] = useState('');

  // User Credits Adjustment State
  const [creditUser, setCreditUser] = useState(null);
  const [newCreditsAmount, setNewCreditsAmount] = useState(5);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch problems
      const pRes = await apiFetch('/api/problems');
      if (pRes.ok) {
        const pData = await pRes.json();
        if (pData.problems) setProblems(pData.problems);
      }

      // Fetch users
      const uRes = await apiFetch('/api/admin/users');
      if (uRes.ok) {
        const uData = await uRes.json();
        if (uData.users) setUsers(uData.users);
      }
    } catch (err) {
      console.warn('[CommunityModeration] Error loading moderation data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Admin toggle problem resolved
  const handleToggleResolve = async (problemId, currentResolved) => {
    try {
      const res = await apiFetch(`/api/problems/${problemId}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isResolved: !currentResolved }),
      });

      if (res.ok) {
        setProblems((prev) =>
          prev.map((p) => (p.id === problemId ? { ...p, isResolved: !currentResolved } : p))
        );
        setFeedback({
          type: 'success',
          text: !currentResolved ? 'Problem marked as Resolved.' : 'Problem reopened as Active.',
        });
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch {
      setFeedback({ type: 'error', text: 'Failed to update problem resolution status.' });
    }
  };

  // Admin delete problem
  const handleDeleteProblem = async (problemId) => {
    if (!window.confirm('Are you sure you want to delete this problem from the community database?')) return;

    try {
      const res = await apiFetch(`/api/problems/${problemId}`, { method: 'DELETE' });
      if (res.ok) {
        setProblems((prev) => prev.filter((p) => p.id !== problemId));
        setFeedback({ type: 'success', text: 'Problem removed from community wall.' });
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch {
      setFeedback({ type: 'error', text: 'Failed to delete problem.' });
    }
  };

  // Save admin problem edit
  const handleSaveProblemEdit = async (e) => {
    e.preventDefault();
    if (!editingProblem || !editTitle.trim() || !editDescription.trim()) return;

    setIsSavingEdit(true);
    try {
      const res = await apiFetch(`/api/problems/${editingProblem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          category: editCategory,
          affectedUsers: editAffectedUsers.trim(),
          description: editDescription.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setProblems((prev) =>
          prev.map((p) => (p.id === editingProblem.id ? { ...p, ...data.problem } : p))
        );
        setEditingProblem(null);
        setFeedback({ type: 'success', text: 'Problem updated by administrator.' });
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch {
      setFeedback({ type: 'error', text: 'Failed to update problem.' });
    } finally {
      setIsSavingEdit(false);
    }
  };

  // User moderation: Warn
  const handleWarnUser = async (e) => {
    e.preventDefault();
    if (!warningUser || !warningReason.trim()) return;

    try {
      const res = await apiFetch(`/api/admin/users/${warningUser.uid}/warn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: warningReason.trim() }),
      });

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.uid === warningUser.uid
              ? { ...u, status: 'warned', warningReason: warningReason.trim() }
              : u
          )
        );
        setWarningUser(null);
        setWarningReason('');
        setFeedback({ type: 'success', text: 'Formal warning issued to user.' });
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch {
      setFeedback({ type: 'error', text: 'Failed to issue user warning.' });
    }
  };

  // User moderation: Suspend
  const handleSuspendUser = async (user) => {
    const reason = window.prompt(`Suspend user ${user.email || user.displayName}? Enter reason:`, 'Violating Community Safety Guidelines');
    if (!reason) return;

    try {
      const res = await apiFetch(`/api/admin/users/${user.uid}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.uid === user.uid ? { ...u, status: 'suspended', suspensionReason: reason } : u))
        );
        setFeedback({ type: 'success', text: `User ${user.email} suspended.` });
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch {
      setFeedback({ type: 'error', text: 'Failed to suspend user.' });
    }
  };

  // User moderation: Restore / Activate
  const handleActivateUser = async (user) => {
    try {
      const res = await apiFetch(`/api/admin/users/${user.uid}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Account restored by administrator.' }),
      });

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.uid === user.uid ? { ...u, status: 'active', warningReason: null, suspensionReason: null } : u))
        );
        setFeedback({ type: 'success', text: `User ${user.email} account restored to active.` });
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch {
      setFeedback({ type: 'error', text: 'Failed to restore user.' });
    }
  };

  // User credits adjustment
  const handleSetCredits = async (e) => {
    e.preventDefault();
    if (!creditUser) return;

    try {
      const res = await apiFetch(`/api/admin/users/${creditUser.uid}/credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credits: Number(newCreditsAmount) }),
      });

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.uid === creditUser.uid ? { ...u, connectionCredits: Number(newCreditsAmount) } : u))
        );
        setCreditUser(null);
        setFeedback({ type: 'success', text: 'User connection credits updated.' });
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch {
      setFeedback({ type: 'error', text: 'Failed to update credits.' });
    }
  };

  const filteredProblems = problems.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.submittedBy?.toLowerCase().includes(q)
    );
  });

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      u.displayName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.uid?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Moderation Controls Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-purple-950/20 border border-purple-900/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Community Moderation & Problem Wall Governance
            </h2>
          </div>
          <p className="text-xs text-slate-300 font-sans">
            Full administrative authority over problems, solutions, user warnings, suspensions, and credits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadData}>
            Refresh
          </Button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 border ${
            feedback.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
              : 'bg-red-950/60 border-red-500/50 text-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Sub-Tabs: Problems vs. Users */}
      <div className="flex items-center justify-between gap-4 border-b border-purple-950/60 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('problems')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'problems'
                ? 'bg-purple-600 text-white'
                : 'bg-purple-950/30 text-purple-300 hover:bg-purple-900/40 border border-purple-900/40'
            }`}
          >
            Problems Management ({problems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('users')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'users'
                ? 'bg-purple-600 text-white'
                : 'bg-purple-950/30 text-purple-300 hover:bg-purple-900/40 border border-purple-900/40'
            }`}
          >
            Community Members ({users.length})
          </button>
        </div>

        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={activeSubTab === 'problems' ? 'Search problems...' : 'Search members...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-purple-950/40 border border-purple-900/40 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          <span className="text-xs">Loading moderation registry...</span>
        </div>
      ) : activeSubTab === 'problems' ? (
        /* PROBLEMS LIST FOR ADMIN */
        <div className="space-y-4">
          {filteredProblems.map((prob) => (
            <Card key={prob.id} className="p-5 space-y-3 bg-[#08081a]/90 border-purple-900/40">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                      {prob.category}
                    </span>
                    {prob.isResolved ? (
                      <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-600/40">
                        Resolved
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                        Active Challenge
                      </span>
                    )}
                    <span className="text-xs text-slate-400 font-mono">
                      Author UID: {prob.authorId || 'legacy_seed'} • {prob.supporterCount || 0} supporters
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-white">{prob.title}</h3>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed line-clamp-2">
                    {prob.description}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleResolve(prob.id, prob.isResolved)}
                    className={`px-2 py-1 text-[11px] font-medium rounded border transition cursor-pointer ${
                      prob.isResolved
                        ? 'bg-amber-950/50 border-amber-600/40 text-amber-300'
                        : 'bg-emerald-950/50 border-emerald-600/40 text-emerald-300'
                    }`}
                  >
                    {prob.isResolved ? 'Reopen' : 'Mark Resolved'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingProblem(prob);
                      setEditTitle(prob.title);
                      setEditCategory(prob.category);
                      setEditAffectedUsers(prob.affectedUsers || '');
                      setEditDescription(prob.description);
                    }}
                    className="p-1.5 rounded-lg text-slate-300 bg-slate-900 border border-slate-700 hover:border-purple-500 hover:text-white transition cursor-pointer"
                    title="Edit problem"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteProblem(prob.id)}
                    className="p-1.5 rounded-lg text-red-400 bg-red-950/30 border border-red-900/40 hover:bg-red-900/50 transition cursor-pointer"
                    title="Delete problem"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* USERS LIST FOR ADMIN */
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <Card key={user.uid} className="p-5 space-y-3 bg-[#08081a]/90 border-purple-900/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{user.displayName || 'Unnamed Engineer'}</span>
                    <span className="text-xs text-slate-400 font-mono">({user.email})</span>
                    {user.status === 'suspended' ? (
                      <Badge variant="red" size="xs">
                        Suspended
                      </Badge>
                    ) : user.status === 'warned' ? (
                      <Badge variant="amber" size="xs">
                        Warned
                      </Badge>
                    ) : (
                      <Badge variant="emerald" size="xs">
                        Active
                      </Badge>
                    )}
                    {user.role === 'admin' && (
                      <Badge variant="purple" size="xs">
                        Admin
                      </Badge>
                    )}
                  </div>

                  <div className="text-xs text-slate-400 flex items-center gap-4">
                    <span>Credits: <strong className="text-white font-mono">{user.connectionCredits ?? 5}</strong></span>
                    <span>UID: <strong className="text-slate-300 font-mono">{user.uid}</strong></span>
                    {user.warningReason && (
                      <span className="text-amber-300">Warning: {user.warningReason}</span>
                    )}
                    {user.suspensionReason && (
                      <span className="text-red-300">Suspension: {user.suspensionReason}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setCreditUser(user);
                      setNewCreditsAmount(user.connectionCredits ?? 5);
                    }}
                    className="px-2.5 py-1 text-xs rounded border border-purple-700/50 bg-purple-950/40 text-purple-200 hover:bg-purple-900/40 transition cursor-pointer flex items-center gap-1"
                    title="Adjust Credits"
                  >
                    <Coins className="w-3 h-3 text-amber-400" />
                    <span>Credits</span>
                  </button>

                  {user.status !== 'warned' && user.status !== 'suspended' && (
                    <button
                      type="button"
                      onClick={() => setWarningUser(user)}
                      className="px-2.5 py-1 text-xs rounded border border-amber-700/50 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40 transition cursor-pointer"
                    >
                      Warn
                    </button>
                  )}

                  {user.status !== 'suspended' ? (
                    <button
                      type="button"
                      onClick={() => handleSuspendUser(user)}
                      className="px-2.5 py-1 text-xs rounded border border-red-700/50 bg-red-950/30 text-red-300 hover:bg-red-900/40 transition cursor-pointer"
                    >
                      Suspend
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleActivateUser(user)}
                      className="px-2.5 py-1 text-xs rounded border border-emerald-700/50 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40 transition cursor-pointer"
                    >
                      Restore
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Admin Problem Edit Modal */}
      {editingProblem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-xl bg-[#08081a] border border-purple-800/60 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Admin Edit: {editingProblem.title}</h3>
              <button
                type="button"
                onClick={() => setEditingProblem(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProblemEdit} className="space-y-3 font-sans">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-purple-950/30 border border-purple-800/40 text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                <input
                  type="text"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-purple-950/30 border border-purple-800/40 text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-purple-950/30 border border-purple-800/40 text-white focus:outline-none resize-none"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditingProblem(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={isSavingEdit}>
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Warn User Modal */}
      {warningUser && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-[#08081a] border border-amber-800/60 rounded-3xl p-6 space-y-4 shadow-2xl font-sans">
            <h3 className="text-base font-bold text-white">Issue Warning to {warningUser.displayName}</h3>
            <form onSubmit={handleWarnUser} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Reason for Advisory</label>
                <textarea
                  rows={3}
                  value={warningReason}
                  onChange={(e) => setWarningReason(e.target.value)}
                  placeholder="Explain why this account is receiving a warning..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-purple-950/30 border border-purple-800/40 text-white focus:outline-none resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setWarningUser(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" className="bg-amber-600 hover:bg-amber-500">
                  Issue Warning
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Credits Modal */}
      {creditUser && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-[#08081a] border border-purple-800/60 rounded-3xl p-6 space-y-4 shadow-2xl font-sans">
            <h3 className="text-base font-bold text-white">Adjust Credits for {creditUser.displayName}</h3>
            <form onSubmit={handleSetCredits} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Total Connection Credits</label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={newCreditsAmount}
                  onChange={(e) => setNewCreditsAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-purple-950/30 border border-purple-800/40 text-white focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setCreditUser(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Save Credits
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CommunityModerationView;
