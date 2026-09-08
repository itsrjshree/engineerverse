/**
 * ENGINEERVERSE — Dynamic Edition & Campaign Lifecycle Banner
 * Renders the active temporal message:
 * - Pre-launch countdown
 * - Sept 15 Launch Day celebration
 * - Post-Sept 15 evergreen state: "Engineers' Day {YEAR} is over. The problems aren't. ENGINEERVERSE — KEEP BUILDING."
 * Includes temporal simulator switcher for instant auditing.
 */

import { useState } from 'react';
import { Calendar, Clock, Sparkles, ChevronRight } from 'lucide-react';
import { CAMPAIGN_STATES } from '../config/campaign.js';

export function EditionBanner({ campaignState }) {
  return (
    <div className="w-full bg-gradient-to-r from-purple-950/70 via-[#100c28] to-indigo-950/70 border-b border-purple-900/30 text-purple-200 py-2 px-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        {/* Active message */}
        <div className="flex items-center gap-2 text-center sm:text-left flex-wrap justify-center sm:justify-start">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-200 border border-purple-500/30 font-semibold text-[11px] shrink-0">
            <Calendar className="w-3 h-3 text-purple-400" />
            {campaignState.badgeText}
          </span>
          <span className="text-slate-300 font-normal">
            {campaignState.isEngineersDay ? (
              <strong className="text-white font-semibold">
                National Engineers' Day Celebration • September 15
              </strong>
            ) : (
              <span>
                Canonical Platform:{' '}
                <span className="text-purple-300 font-mono bg-purple-950/50 px-1 py-0.5 rounded">
                  /engineerverse
                </span>
              </span>
            )}
          </span>
        </div>

        {/* Edition / Platform Identity Label */}
        <div className="flex items-center gap-2 text-[11px] text-purple-300/80">
          <span className="hidden sm:inline">
            {campaignState.isEngineersDay ? "Engineers' Day Active Window (IST)" : "Shree Labs × Pritee AI"}
          </span>
          <span className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/40 text-purple-300 font-mono font-bold">
            {campaignState.edition}
          </span>
        </div>
      </div>
    </div>
  );
}

export default EditionBanner;
