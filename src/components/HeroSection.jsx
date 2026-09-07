/**
 * ENGINEERVERSE — Hero Section
 * Faithfully mirrors Screenshot 1 visual language:
 * - Luminous vertical circuit node line with top dot (`•──`)
 * - Glowing purple display typography
 * - Glowing purple horizontal underline accent bar
 * - Deep cosmic navy background with vector wave wireframes
 */

import { ArrowRight, Compass, ShieldCheck, Cpu, Code2, Sparkles } from 'lucide-react';
import { Button } from './ui/Button.jsx';
import { Badge } from './ui/Badge.jsx';

export function HeroSection({ campaignState, onNavigate }) {
  return (
    <section className="relative w-full overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-24 px-4 sm:px-6 lg:px-8 border-b border-purple-950/30">
      {/* Background vector wave contours (derived from Screenshot 1 & 3) */}
      <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden" aria-hidden="true">
        <svg
          className="absolute -right-40 -top-20 w-[600px] sm:w-[900px] h-[600px] sm:h-[900px] text-purple-600"
          viewBox="0 0 800 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 100,700 C 300,500 200,300 700,100 M 120,720 C 320,520 220,320 720,120 M 140,740 C 340,540 240,340 740,140 M 160,760 C 360,560 260,360 760,160 M 180,780 C 380,580 280,380 780,180"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeDasharray="2 6"
          />
          <path
            d="M 50,750 C 400,600 300,200 750,50 M 70,770 C 420,620 320,220 770,70 M 90,790 C 440,640 340,240 790,90"
            stroke="#6366f1"
            strokeWidth="0.8"
          />
        </svg>

        {/* Left side contour */}
        <svg
          className="absolute -left-40 top-10 w-[500px] sm:w-[700px] h-[500px] sm:h-[700px] text-indigo-600"
          viewBox="0 0 600 600"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 550,50 C 350,200 450,400 50,550 M 530,70 C 330,220 430,420 70,570 M 510,90 C 310,240 410,440 90,590"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="3 5"
          />
        </svg>

        {/* Subtle radial center glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-700/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="relative max-w-7xl mx-auto">
        <div className="max-w-3xl">
          {/* Ecosystem badge */}
          <div className="inline-flex items-center gap-2 mb-6">
            <Badge variant="purple" size="sm">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Shree Labs × Pritee AI</span>
            </Badge>
            <Badge variant="glow" size="sm">
              <span>Phase 0: Foundation</span>
            </Badge>
          </div>

          {/* Hero headline with Screenshot 1's signature circuit node & glowing line */}
          <div className="relative pl-6 sm:pl-8 border-l-2 border-purple-500/60 mb-6">
            {/* Top circuit dot node */}
            <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_10px_#c084fc]" />

            <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              ENGINEERVERSE {campaignState.edition}
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-purple-300 to-indigo-300 tracking-tight mt-1 leading-[1.15]">
              {campaignState.headline}
            </h1>

            <div className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white mt-2">
              {campaignState.subheadline}
            </div>

            {/* Glowing horizontal underline bar (Screenshot 1 signature) */}
            <div className="mt-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-400" />
              <div className="w-24 sm:w-36 h-[2.5px] rounded-full bg-gradient-to-r from-purple-500 to-transparent shadow-[0_0_8px_#a855f7]" />
            </div>
          </div>

          {/* Philosophy narrative */}
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-8 max-w-2xl font-normal">
            {campaignState.heroTagline}
          </p>

          {/* Call to Actions */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-10">
            <Button
              variant="primary"
              size="lg"
              icon={ArrowRight}
              onClick={() => onNavigate('dna')}
            >
              {campaignState.ctaPrimary}
            </Button>

            <Button
              variant="secondary"
              size="lg"
              onClick={() => onNavigate('problems')}
            >
              The Problem Wall
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => onNavigate('pritee')}
            >
              Ask Pritee AI
            </Button>
          </div>

          {/* Architectural highlights strip */}
          <div className="pt-6 border-t border-purple-950/40 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <div className="text-purple-400 font-bold text-base sm:text-lg">12 Dimensions</div>
              <div className="text-slate-400">Deterministic Mindset</div>
            </div>
            <div>
              <div className="text-purple-400 font-bold text-base sm:text-lg">The Problem Wall</div>
              <div className="text-slate-400">Real-World Dilemmas</div>
            </div>
            <div>
              <div className="text-purple-400 font-bold text-base sm:text-lg">17 Disciplines</div>
              <div className="text-slate-400">Zero-Degree Inclusivity</div>
            </div>
            <div>
              <div className="text-purple-400 font-bold text-base sm:text-lg">Evergreen</div>
              <div className="text-slate-400">Engineers' Day & Beyond</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
