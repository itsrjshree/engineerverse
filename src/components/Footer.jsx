/**
 * ENGINEERVERSE — Footer Component
 * Anchors the canonical address, Shree Labs × Pritee AI credit,
 * and the evergreen campaign motto:
 * "Engineers' Day is over. The problems aren't. ENGINEERVERSE — KEEP BUILDING."
 */

import { Sparkles, Heart } from 'lucide-react';

export function Footer({ onNavigate }) {
  return (
    <footer className="w-full border-t border-purple-950/40 bg-[#04040d] text-slate-400 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Column 1: Brand & Ever-green message */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-white tracking-tight">
                ENGINEERVERSE
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/40">
                {new Date().getFullYear()}
              </span>
            </div>

            <p className="text-sm text-purple-200/80 font-medium">
              "Engineers' Day {new Date().getFullYear()} is over. The problems aren't. ENGINEERVERSE — KEEP BUILDING."
            </p>

            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              An evergreen interactive engineering universe by Shree Labs × Pritee AI.
              Dedicated to the spirit of Sir M. Visvesvaraya and every builder turning chaos into order.
            </p>
          </div>

          {/* Column 2: Navigation (Human Experience Pillars) */}
          <div className="space-y-2 text-xs">
            <div className="font-bold text-white uppercase tracking-wider text-[11px]">
              Explore
            </div>
            <ul className="space-y-1.5">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('dna')}
                  className="hover:text-purple-300 transition-colors"
                >
                  Engineering DNA Assessment
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('problems')}
                  className="hover:text-purple-300 transition-colors"
                >
                  The Problem Wall
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('missions')}
                  className="hover:text-purple-300 transition-colors"
                >
                  Future Engineer Missions
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('stories')}
                  className="hover:text-purple-300 transition-colors"
                >
                  Stories & Voices
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Ecosystem & Learn */}
          <div className="space-y-2 text-xs">
            <div className="font-bold text-white uppercase tracking-wider text-[11px]">
              Ecosystem & Learn
            </div>
            <ul className="space-y-1.5">
              <li>
                <a
                  href="https://rjshree.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-purple-300 transition-colors inline-flex items-center gap-1"
                >
                  <span>Shree Labs</span>
                  <Sparkles className="w-3 h-3 text-purple-400" />
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('pritee')}
                  className="hover:text-purple-300 transition-colors"
                >
                  Ask Pritee AI Mentor
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('legacy')}
                  className="hover:text-purple-300 transition-colors"
                >
                  Sir M. Visvesvaraya Legacy
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar with Canonical URL and Shree Labs attribution */}
        <div className="pt-6 border-t border-purple-950/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            Canonical Platform:{' '}
            <a
              href="https://rjshree.com/engineerverse"
              className="text-purple-400 hover:underline font-mono"
            >
              https://rjshree.com/engineerverse
            </a>
          </div>

          <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-end">
            <span>Built with precision for the builders of tomorrow.</span>
            <span>Shree Labs × Pritee AI</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
