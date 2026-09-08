/**
 * ENGINEERVERSE — Propose Solution & Connect Modal
 * Pure JavaScript.
 * Enables engineers to propose architectures for community problems
 * and establish direct verified contact with problem authors using connection credits.
 */

import { useState } from 'react';
import { Button } from '../ui/Button.jsx';
import { Sparkles, X, Mail, Clock, Globe, ShieldCheck, AlertCircle } from 'lucide-react';
import { apiFetch } from '../../config/api.js';

export function ProposeSolutionModal({ problem, isOpen, onClose, onSuccess, userCredits = 5 }) {
  const [proposedSolution, setProposedSolution] = useState('');
  const [contactPitch, setContactPitch] = useState('');
  const [estimatedTimeline, setEstimatedTimeline] = useState('2-4 weeks');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  if (!isOpen || !problem) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!proposedSolution.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await apiFetch(`/api/problems/${problem.id}/solutions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposedSolution: proposedSolution.trim(),
          contactPitch: contactPitch.trim(),
          estimatedTimeline,
          portfolioUrl: portfolioUrl.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (onSuccess) onSuccess(data.message || 'Solution proposed successfully!');
        onClose();
      } else {
        setErrorMessage(data.error || 'Failed to submit proposal.');
      }
    } catch (err) {
      setErrorMessage('Network error submitting solution proposal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl bg-[#08081a] border border-purple-800/60 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-800/40">
              Solution & Connect Handshake
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-white mt-1 leading-snug">
              Propose Solution for Challenge
            </h3>
            <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">
              "{problem.title}"
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              Your Technical Architecture / Approach <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={4}
              value={proposedSolution}
              onChange={(e) => setProposedSolution(e.target.value)}
              placeholder="Explain how this problem can be solved (technologies, materials, architecture, sensor selections, open-source designs)..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-purple-950/30 border border-purple-800/40 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 resize-none font-sans"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Estimated Delivery / Prototype Timeline
              </label>
              <input
                type="text"
                value={estimatedTimeline}
                onChange={(e) => setEstimatedTimeline(e.target.value)}
                placeholder="e.g. 2-4 weeks, 1 month"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-purple-950/30 border border-purple-800/40 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Portfolio / GitHub / Demo Link
              </label>
              <input
                type="url"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://github.com/..."
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-purple-950/30 border border-purple-800/40 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              Personal Note / Pitch to Submitter
            </label>
            <textarea
              rows={2}
              value={contactPitch}
              onChange={(e) => setContactPitch(e.target.value)}
              placeholder="Introduce yourself and share why you are passionate about solving this community challenge..."
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-purple-950/30 border border-purple-800/40 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/30 text-[11px] text-slate-300 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Free to propose. Connection handshake occurs upon mutual review.</span>
            </div>
            <span className="font-mono text-purple-200 font-bold">{userCredits} Credits</span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting || !proposedSolution.trim()}
              className="shadow-[0_0_15px_rgba(168,85,247,0.3)]"
            >
              {isSubmitting ? 'Submitting...' : 'Send Proposal & Connect'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProposeSolutionModal;
