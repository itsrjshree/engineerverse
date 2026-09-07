/**
 * ENGINEERVERSE — The Problems Wall Component
 * Note: Named "The Problems Wall" per user prompt ("Also, not 100 Problems wall.. keep it The Problems Wall").
 * Core Initiative: "India Still Has Problems. Engineers Still Have Work."
 */

import { useState } from 'react';
import { Card } from './ui/Card.jsx';
import { Badge } from './ui/Badge.jsx';
import { Button } from './ui/Button.jsx';
import { TabPill } from './ui/TabPill.jsx';
import { ThumbsUp, PlusCircle, Search, Lightbulb, Users, CheckCircle2 } from 'lucide-react';
import { analytics } from '../services/analytics.js';
import { ANALYTICS_EVENTS } from '../config/analyticsEvents.js';

const initialProblems = [
  {
    id: 'prob_clean_water_01',
    title: 'Low-Cost Arsenic & Fluoride Water Testing for Rural Borewells',
    category: 'Environment',
    affectedUsers: 'Over 40 million citizens across Gangetic plains & arid belts',
    description: 'Groundwater in several districts exceeds safe limits. Commercial chemical test kits cost ₹2,500+ and degrade quickly. We need an open-hardware spectrophotometric sensor under ₹500 with zero toxic reagent waste.',
    supporterCount: 428,
    tags: ['Water', 'Sensors', 'Rural Health'],
    submittedBy: 'Shree Labs Collective',
  },
  {
    id: 'prob_cold_storage_02',
    title: 'Solar PCM Micro-Cold Rooms for Perishable Harvests',
    category: 'Agriculture',
    affectedUsers: 'Smallholder tomato & onion farmers losing 30% crop to heat',
    description: 'Grid outages in rural mandis trigger distress selling at 10% value. Design an off-grid phase-change thermal cool-room maintaining 4°C for 36 hours of continuous cloud cover.',
    supporterCount: 512,
    tags: ['Agriculture', 'Thermal Storage', 'Solar'],
    submittedBy: 'Agritech Working Group',
  },
  {
    id: 'prob_assistive_screen_03',
    title: 'Sub-$50 Dynamic Refreshable Braille Display',
    category: 'Accessibility',
    affectedUsers: 'Over 10 million visually impaired students and coders',
    description: '40-cell piezo Braille displays cost over $2,000. Can electromagnetic micro-solenoids or pneumatic microfluidic actuators drop the cost below $50 to make digital text universally accessible?',
    supporterCount: 689,
    tags: ['Accessibility', 'Micro-actuators', 'Embedded'],
    submittedBy: 'Assistive Tech Lab',
  },
  {
    id: 'prob_mesh_disaster_04',
    title: 'Autonomous Drone-Droppable Emergency Mesh Relays',
    category: 'Infrastructure',
    affectedUsers: 'Himalayan and coastal communities cut off during cloudbursts',
    description: 'When towers drown, rescuers work blind. Solar-powered LoRa packet repeaters that form self-healing mesh networks to forward emergency SMS and GPS without internet or cell networks.',
    supporterCount: 394,
    tags: ['Disaster Relief', 'LoRa', 'Mesh Network'],
    submittedBy: 'Disaster Resilience Group',
  },
];

export function ProblemsWallPreview() {
  const [problems, setProblems] = useState(initialProblems);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [supportedIds, setSupportedIds] = useState(new Set());
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submitSuccessMessage, setSubmitSuccessMessage] = useState(null);

  // New problem form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Agriculture');
  const [newAffectedUsers, setNewAffectedUsers] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const categories = ['All', 'Environment', 'Agriculture', 'Accessibility', 'Infrastructure'];

  const filteredProblems = problems.filter((prob) => {
    const matchesCategory = selectedCategory === 'All' || prob.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      prob.title.toLowerCase().includes(q) ||
      prob.description.toLowerCase().includes(q) ||
      prob.tags.some((t) => t.toLowerCase().includes(q));

    return matchesCategory && matchesSearch;
  });

  const handleSupport = (id) => {
    if (supportedIds.has(id)) return;

    setSupportedIds(new Set([...supportedIds, id]));
    setProblems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, supporterCount: p.supporterCount + 1 } : p))
    );

    analytics.track(ANALYTICS_EVENTS.PROBLEM_SUPPORT, { problemId: id });
  };

  const handleSubmitProblem = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    const created = {
      id: 'prob_' + Math.random().toString(36).substring(2, 9),
      title: newTitle.trim(),
      category: newCategory,
      affectedUsers: newAffectedUsers.trim() || 'Community',
      description: newDescription.trim(),
      supporterCount: 1,
      tags: [newCategory, 'Community'],
      submittedBy: 'You (Submitted)',
    };

    setProblems([created, ...problems]);
    setSupportedIds(new Set([...supportedIds, created.id]));
    setIsSubmitModalOpen(false);
    setSubmitSuccessMessage('Problem submitted successfully! Placed into review queue for community verification.');

    analytics.track(ANALYTICS_EVENTS.PROBLEM_SUBMITTED, {
      title: newTitle,
      category: newCategory,
    });

    setNewTitle('');
    setNewAffectedUsers('');
    setNewDescription('');

    setTimeout(() => setSubmitSuccessMessage(null), 5000);
  };

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
            Curated, verified engineering challenges awaiting builders, architects, and inventors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            icon={PlusCircle}
            onClick={() => setIsSubmitModalOpen(true)}
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <TabPill
              key={cat}
              label={cat}
              active={selectedCategory === cat}
              onClick={() => setSelectedCategory(cat)}
            />
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search problems..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-[#09091b] border border-purple-950/60 rounded-full text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
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

                <p className="text-xs text-slate-300 leading-relaxed">
                  {problem.description}
                </p>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {problem.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-purple-300 border border-white/10"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-purple-950/40 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  By {problem.submittedBy}
                </span>

                <button
                  type="button"
                  onClick={() => handleSupport(problem.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    isSupported
                      ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                      : 'bg-purple-950/50 hover:bg-purple-900/60 text-purple-200 border border-purple-800/40'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{isSupported ? 'Supported' : 'Support'}</span>
                  <span className="ml-1 opacity-80 font-mono">({problem.supporterCount})</span>
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Submission Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleSubmitProblem}
            className="bg-[#09091f] border border-purple-800/60 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-purple-950/60 pb-3">
              <h3 className="text-lg font-bold text-white">
                Submit to The Problems Wall
              </h3>
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-purple-300 font-semibold">Problem Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Decentralized Graywater Recycling for Urban Apartments"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-black/40 border border-purple-950/60 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-purple-300 font-semibold">Category</label>
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

            <div className="space-y-1 text-xs">
              <label className="text-purple-300 font-semibold">Detailed Description & Constraints</label>
              <textarea
                required
                rows={4}
                placeholder="Explain the technical bottleneck, existing failures, and constraints that make this unsolved..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-black/40 border border-purple-950/60 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="pt-3 border-t border-purple-950/60 flex items-center justify-between text-xs">
              <span className="text-slate-400">Moderated by Shree Labs</span>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setIsSubmitModalOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" variant="primary" type="submit">
                  Submit Problem
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default ProblemsWallPreview;
