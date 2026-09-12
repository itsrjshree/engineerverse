/**
 * ENGINEERVERSE — Reusable Feature Gating & Coming Soon Component
 * Pure JavaScript (ZERO TypeScript).
 *
 * Used to cleanly communicate roadmap boundaries (e.g. Missions EV-010, Stories EV-020)
 * without leaking unvetted or mocked functional artifacts into V0 production.
 */

import { Sparkles, Compass, Rocket, ShieldCheck, ArrowRight } from 'lucide-react';
import { Badge } from './Badge.jsx';
import { Button } from './Button.jsx';

export function ComingSoonGate({
  featureId = 'EV-ROADMAP',
  title = 'Feature Under Active Engineering',
  description = 'This capability is part of the upcoming engineering cycle. Built to rigorous architectural standards.',
  icon: Icon = Sparkles,
  targetMilestone = 'V1 Pipeline',
  ctaText = 'Explore Problem Bank',
  onAction,
}) {
  return (
    <div className="w-full py-12 px-4 sm:px-6 flex flex-col items-center justify-center text-center">
      <div className="relative max-w-lg w-full p-8 rounded-3xl bg-gradient-to-b from-[#0e0e26] via-[#09091c] to-[#060614] border border-purple-900/50 shadow-2xl space-y-6">
        {/* Glow backdrop */}
        <div className="absolute inset-x-12 top-0 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent blur-[2px]" />

        <div className="mx-auto w-14 h-14 rounded-2xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-inner">
          <Icon className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Badge variant="purple" size="xs">
              {featureId}
            </Badge>
            <Badge variant="outline" size="xs" className="text-slate-400 border-slate-700">
              {targetMilestone}
            </Badge>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{title}</h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
            {description}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-900/30 text-left space-y-1 text-xs">
          <div className="flex items-center gap-2 text-purple-300 font-semibold text-[11px] uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Foundational Integrity Standard</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Engineered with ACID Firestore rules, zero mock telemetry, and strict identity authentication.
          </p>
        </div>

        {onAction && (
          <div className="pt-2">
            <Button
              variant="primary"
              size="md"
              icon={ArrowRight}
              onClick={onAction}
              className="mx-auto"
            >
              {ctaText}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
