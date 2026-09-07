/**
 * ENGINEERVERSE — The Problem Wall Component
 * Initiative: "India Still Has Problems. Engineers Still Have Work."
 * 
 * Features:
 * - Community members (Google, GitHub, Facebook, Yahoo, Email, Guest) can submit engineering challenges
 * - Transparent contributor attribution ("Submitted by [Name/Moniker]")
 * - Real-time upvoting / supporting
 * - Full client + server API synchronization with local storage persistence fallback
 */

import { useState, useEffect } from 'react';
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
  UserCheck,
  Sparkles,
  Tag,
  Loader2,
} from 'lucide-react';
import { analytics } from '../services/analytics.js';
import { ANALYTICS_EVENTS } from '../config/analyticsEvents.js';
import { getApiUrl } from '../config/api.js';
import { authService } from '../services/firebaseClient.js';
import { AuthModal } from './auth/AuthModal.jsx';

const initialSeedProblems = [
  {
    id: 'prob_clean_water_01',
    title: 'Low-Cost Arsenic & Fluoride Water Testing for Rural Borewells',
    category: 'Environment',
    affectedUsers: 'Over 40 million citizens across Gangetic plains & arid belts',
    description: 'Groundwater in several districts exceeds safe arsenic and fluoride limits. Commercial chemical test strips are costly and perishable. We need an open-hardware spectrophotometric sensor under ₹500 with zero toxic reagent waste.',
    supporterCount: 428,
    tags: ['Water', 'Sensors', 'Rural Health'],
    submittedBy: 'Shree Labs Collective',
  },
  {
    id: 'prob_cold_storage_02',
    title: 'Solar PCM Micro-Cold Rooms for Perishable Harvests',
    category: 'Agriculture',
    affectedUsers: 'Smallholder tomato & onion farmers losing 30% crop to heat',
    description: 'Grid outages in rural mandis trigger distress selling at 10% value. Design an off-grid phase-change thermal cool-room maintaining 4°C for 36 hours of continuous cloud cover without diesel generators.',
    supporterCount: 512,
    tags: ['Agriculture', 'Thermal Storage', 'Solar'],
    submittedBy: 'Agritech Working Group',
  },
  {
    id: 'prob_assistive_screen_03',
    title: 'Sub-$50 Dynamic Refreshable Braille Display',
    category: 'Accessibility',
    affectedUsers: 'Over 10 million visually impaired students and coders',
    description: 'Commercial 40-cell piezo Braille displays cost over $2,000. Can electromagnetic micro-solenoids or microfluidics drop the BOM cost below $50 to make digital education universally accessible?',
    supporterCount: 689,
    tags: ['Accessibility', 'Micro-actuators', 'Embedded'],
    submittedBy: 'Assistive Tech Lab',
  },
  {
    id: 'prob_mesh_disaster_04',
    title: 'Autonomous Drone-Droppable Emergency Mesh Relays',
    category: 'Infrastructure',
    affectedUsers: 'Himalayan and coastal communities cut off during cloudbursts',
    description: 'When towers drown, rescuers work blind. Solar-powered LoRa packet repeaters that form self-healing mesh networks to forward emergency SMS and GPS without cellular networks.',
    supporterCount: 394,
    tags: ['Disaster Relief', 'LoRa', 'Mesh Network'],
    submittedBy: 'Disaster Resilience Group',
  },
];

const LOCAL_STORAGE_PROBLEMS_KEY = 'engineerverse_community_problems_v1';
const LOCAL_STORAGE_SUPPORT_KEY = 'engineerverse_supported_problem_ids_v1';

export function ProblemsWallPreview() {
  const [problems, setProblems] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_PROBLEMS_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {
        // storage fallback
      }
    }
    return initialSeedProblems;
  });

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [supportedIds, setSupportedIds] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_SUPPORT_KEY);
        if (saved) return new Set(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
    return new Set();
  });

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submitSuccessMessage, setSubmitSuccessMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Authentication status & modal
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // New problem form fields
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Agriculture');
  const [newAffectedUsers, setNewAffectedUsers] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCustomAttribution, setNewCustomAttribution] = useState('');

  // Categories list
  const categories = ['All', 'Environment', 'Agriculture', 'Accessibility', 'Infrastructure', 'Healthcare', 'Education'];

  // Subscribe to auth state
  useEffect(() => {
    const unsub = authService.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  // Fetch from server API on mount if available
  useEffect(() => {
    let isMounted = true;
    async function loadServerProblems() {
      try {
        const res = await fetch(getApiUrl('/api/problems'));
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && Array.isArray(data.problems) && data.problems.length > 0) {
          if (isMounted) {
            // Merge unique server problems with local state
            setProblems((prev) => {
              const map = new Map();
              data.problems.forEach((p) => map.set(p.id, p));
              prev.forEach((p) => {
                if (!map.has(p.id)) map.set(p.id, p);
              });
              const merged = Array.from(map.values());
              try {
                localStorage.setItem(LOCAL_STORAGE_PROBLEMS_KEY, JSON.stringify(merged));
              } catch {}
              return merged;
            });
          }
        }
      } catch {
        // offline or mock fallback
      }
    }
    loadServerProblems();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save supported IDs to localStorage
  const handleSupport = async (id) => {
    if (supportedIds.has(id)) return;

    const nextSupported = new Set([...supportedIds, id]);
    setSupportedIds(nextSupported);
    try {
      localStorage.setItem(LOCAL_STORAGE_SUPPORT_KEY, JSON.stringify([...nextSupported]));
    } catch {}

    setProblems((prev) => {
      const updated = prev.map((p) =>
        p.id === id ? { ...p, supporterCount: (p.supporterCount || 0) + 1 } : p
      );
      try {
        localStorage.setItem(LOCAL_STORAGE_PROBLEMS_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Notify backend
    try {
      await fetch(getApiUrl(`/api/problems/${id}/support`), { method: 'POST' });
    } catch {
      // offline fallback
    }

    analytics.track(ANALYTICS_EVENTS.PROBLEM_SUPPORT, { problemId: id });
  };

  const getAttributionName = () => {
    if (newCustomAttribution.trim()) return newCustomAttribution.trim();
    if (currentUser?.displayName) return currentUser.displayName;
    if (currentUser?.email) return currentUser.email.split('@')[0];
    return 'Community Builder';
  };

  const handleSubmitProblem = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    setIsSubmitting(true);

    const contributorName = getAttributionName();

    const newProb = {
      id: 'prob_' + Math.random().toString(36).substring(2, 10),
      title: newTitle.trim(),
      category: newCategory,
      affectedUsers: newAffectedUsers.trim() || 'Community & Public',
      description: newDescription.trim(),
      supporterCount: 1,
      tags: [newCategory, 'Community'],
      submittedBy: contributorName,
      createdAt: new Date().toISOString(),
    };

    // Optimistically add to state & localStorage
    const nextProblems = [newProb, ...problems];
    setProblems(nextProblems);
    try {
      localStorage.setItem(LOCAL_STORAGE_PROBLEMS_KEY, JSON.stringify(nextProblems));
    } catch {}

    const nextSupported = new Set([...supportedIds, newProb.id]);
    setSupportedIds(nextSupported);
    try {
      localStorage.setItem(LOCAL_STORAGE_SUPPORT_KEY, JSON.stringify([...nextSupported]));
    } catch {}

    // Post to API server
    try {
      await fetch(getApiUrl('/api/problems'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newProb.title,
          category: newProb.category,
          affectedUsers: newProb.affectedUsers,
          description: newProb.description,
          submittedBy: contributorName,
          tags: newProb.tags,
        }),
      });
    } catch (err) {
      console.warn('Could not post to server endpoint, stored locally:', err);
    }

    setIsSubmitting(false);
    setIsSubmitModalOpen(false);
    setSubmitSuccessMessage(`Problem added to The Problem Wall! Credited to "${contributorName}".`);

    analytics.track(ANALYTICS_EVENTS.PROBLEM_SUBMITTED, {
      title: newTitle,
      category: newCategory,
      submittedBy: contributorName,
    });

    setNewTitle('');
    setNewAffectedUsers('');
    setNewDescription('');
    setNewCustomAttribution('');

    setTimeout(() => setSubmitSuccessMessage(null), 6000);
  };

  const filteredProblems = problems.filter((prob) => {
    const matchesCategory = selectedCategory === 'All' || prob.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      prob.title.toLowerCase().includes(q) ||
      prob.description.toLowerCase().includes(q) ||
      prob.submittedBy?.toLowerCase().includes(q) ||
      prob.tags?.some((t) => t.toLowerCase().includes(q));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="purple" size="xs">Humanity Pillar</Badge>
            <span className="text-xs text-purple-400 font-bold uppercase tracking-wider">
              Community Engineering
            </span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            The Problem Wall.
          </h2>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl font-medium">
            <span className="text-purple-300 font-bold">India Still Has Problems. Engineers Still Have Work.</span>{' '}
            Curated, community-submitted engineering challenges awaiting builders, architects, and inventors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            icon={PlusCircle}
            onClick={() => setIsSubmitModalOpen(true)}
            className="cursor-pointer shadow-[0_0_20px_rgba(168,85,247,0.3)]"
          >
            Submit a Problem
          </Button>
        </div>
      </div>

      {submitSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{submitSuccessMessage}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-purple-950/20 p-4 rounded-2xl border border-purple-900/30">
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

        <div className="relative min-w-[240px] sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search problems, topics, contributors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-900/90 border border-purple-900/40 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
          />
        </div>
      </div>

      {/* Problems Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredProblems.map((problem) => {
          const isSupported = supportedIds.has(problem.id);
          return (
            <Card key={problem.id} className="p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-800/40">
                    {problem.category}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Users className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-[11px] truncate max-w-[180px]">{problem.affectedUsers}</span>
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
              </div>

              {/* Card Footer: Contributor Attribution & Upvote */}
              <div className="pt-4 border-t border-purple-950/40 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-300 min-w-0">
                  <span className="text-slate-500">Submitted by:</span>
                  <span className="font-semibold text-purple-300 truncate max-w-[180px]">
                    {problem.submittedBy || 'Community Engineer'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleSupport(problem.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                    isSupported
                      ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                      : 'bg-purple-950/50 hover:bg-purple-900/60 text-purple-200 border border-purple-800/40'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{isSupported ? 'Supported' : 'Support'}</span>
                  <span className="ml-1 opacity-80 font-mono">({problem.supporterCount || 0})</span>
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredProblems.length === 0 && (
        <div className="text-center py-12 border border-dashed border-purple-900/50 rounded-2xl p-8 space-y-3">
          <p className="text-slate-400 text-sm">No engineering challenges found matching your criteria.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedCategory('All');
              setSearchQuery('');
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Submission Modal with Attribution */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleSubmitProblem}
            className="bg-[#09091f] border border-purple-800/60 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-purple-950/60 pb-3">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-bold text-white">
                  Add Problem to The Problem Wall
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {/* Contributor identity banner */}
            <div className="p-3 bg-purple-950/40 rounded-xl border border-purple-800/50 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-purple-700/60 flex items-center justify-center font-bold text-white uppercase text-xs shrink-0">
                  {(currentUser?.displayName || currentUser?.email || 'U').charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="text-white font-medium truncate">
                    Credited to: <strong className="text-purple-300">{getAttributionName()}</strong>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {currentUser?.email ? currentUser.email : 'Guest / Community Contributor'}
                  </div>
                </div>
              </div>

              {!currentUser && (
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="text-[11px] text-purple-300 hover:text-purple-100 underline cursor-pointer shrink-0"
                >
                  Sign In
                </button>
              )}
            </div>

            {/* Problem Title */}
            <div className="space-y-1 text-xs">
              <label className="text-purple-300 font-semibold">Problem Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Decentralized Graywater Recycling for Urban Apartments"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-black/40 border border-purple-950/60 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Category & Affected Population */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-purple-300 font-semibold">Category *</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-purple-950/60 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Environment">Environment</option>
                  <option value="Agriculture">Agriculture</option>
                  <option value="Accessibility">Accessibility</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Education">Education</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-purple-300 font-semibold">Affected Population</label>
                <input
                  type="text"
                  placeholder="e.g. 5,000 households"
                  value={newAffectedUsers}
                  onChange={(e) => setNewAffectedUsers(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-purple-950/60 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Custom Contributor Credit Name (optional override) */}
            <div className="space-y-1 text-xs">
              <label className="text-purple-300 font-semibold">
                Display Attribution Credit (Optional)
              </label>
              <input
                type="text"
                placeholder={currentUser?.displayName || 'e.g. Vikramaditya & Team Aero'}
                value={newCustomAttribution}
                onChange={(e) => setNewCustomAttribution(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-black/40 border border-purple-950/60 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <span className="text-[10px] text-slate-400">
                This name will be displayed at the bottom of the card on The Problem Wall.
              </span>
            </div>

            {/* Detailed Description */}
            <div className="space-y-1 text-xs">
              <label className="text-purple-300 font-semibold">Detailed Description & Technical Constraints *</label>
              <textarea
                required
                rows={3}
                placeholder="Explain the technical bottleneck, existing failures, and constraints that make this unsolved..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-black/40 border border-purple-950/60 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="pt-3 border-t border-purple-950/60 flex items-center justify-between text-xs">
              <span className="text-slate-400">Community Attribution Active</span>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setIsSubmitModalOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" variant="primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span className="flex items-center gap-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </span>
                  ) : (
                    <span>Submit to Wall</span>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Auth Modal Trigger */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthModalOpen(false);
        }}
      />
    </div>
  );
}

export default ProblemsWallPreview;
