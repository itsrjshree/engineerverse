/**
 * ENGINEERVERSE — Footer Component
 * Professionally Mature & Premium Architecture:
 * - Circular brand logo from verified source
 * - "Built with precision for the builders of tomorrow." craftsmanship signature
 * - Social handles: Instagram (@itsrjshree), LinkedIn (@rjshree), X (@itsrjshree)
 * - Dynamic copyright: "© {new Date().getFullYear()} Shree Labs. All rights reserved."
 * - Clickable attribution: "Shree Labs | Rajshree" -> rjshree.com
 * - Canonical platform reference: https://rjshree.com/engineerverse
 */

import { useState } from 'react';
import {
  Sparkles,
  Instagram,
  Linkedin,
  Twitter,
  Globe,
  ExternalLink,
  ArrowUpRight,
  ShieldCheck,
  Compass,
} from 'lucide-react';

export function Footer({ onNavigate }) {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    {
      name: 'X (Twitter)',
      handle: '@itsrjshree',
      url: 'https://x.com/itsrjshree',
      icon: Twitter,
    },
    {
      name: 'LinkedIn',
      handle: '@rjshree',
      url: 'https://linkedin.com/in/rjshree',
      icon: Linkedin,
    },
    {
      name: 'Instagram',
      handle: '@itsrjshree',
      url: 'https://instagram.com/itsrjshree',
      icon: Instagram,
    },
    {
      name: 'Portfolio',
      handle: 'rjshree.com',
      url: 'https://rjshree.com',
      icon: Globe,
    },
  ];

  return (
    <footer className="w-full border-t border-purple-950/40 bg-[#03030c] text-slate-400 pt-16 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle ambient light gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-4xl h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-12">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12">
          {/* Column 1: Brand & Craftsmanship Signature (Span 5 cols) */}
          <div className="md:col-span-5 space-y-5 flex flex-col items-center md:items-start text-center md:text-left">
            {/* Logo + Title */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <img
                src="https://3d-port-folio-git-main-rajshrees-projects.vercel.app/assets/logo-b1463779.svg"
                alt="Shree Labs Logo"
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-cover shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
              />
              <div className="flex flex-col items-center sm:items-start">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-extrabold text-white tracking-tight">
                    ENGINEERVERSE
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/40">
                    {currentYear}
                  </span>
                </div>
                <div className="text-xs text-purple-300/80 font-medium">
                  <a
                    href="https://rjshree.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-purple-100 hover:underline transition-colors"
                  >
                    Shree Labs × Pritee AI
                  </a>
                </div>
              </div>
            </div>

            {/* Precision tagline requested by user */}
            <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-900/40 max-w-md w-full sm:w-auto">
              <p className="text-xs sm:text-sm font-semibold text-purple-200 tracking-tight flex items-center justify-center md:justify-start gap-2">
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Built with precision for the builders of tomorrow.</span>
              </p>
            </div>

            {/* Campaign core motto */}
            <p className="text-xs text-slate-300 leading-relaxed font-sans max-w-md">
              <strong className="text-white">"Engineers' Day {currentYear} is over. The problems aren't. ENGINEERVERSE — KEEP BUILDING."</strong>{' '}
              An evergreen initiative celebrating the instinct to build, solve, and transform constraints into breakthroughs.
            </p>

            {/* Direct Studio & Founder Attribution */}
            <div className="text-xs text-slate-300 flex items-center justify-center md:justify-start gap-2 flex-wrap">
              <span className="text-slate-500">Crafted by</span>
              <a
                href="https://rjshree.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-white hover:text-purple-300 transition-colors inline-flex items-center gap-1 group bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg border border-white/10"
              >
                <span>Shree Labs | Rajshree</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-purple-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>

            {/* Social handles list (Interactive pills) */}
            <div className="space-y-2 pt-1 w-full flex flex-col items-center md:items-start">
              <div className="text-[11px] font-bold text-purple-300 uppercase tracking-wider font-mono">
                Connect & Follow
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.name}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-purple-600/60 hover:bg-purple-950/40 text-slate-300 hover:text-white transition-all text-xs font-medium group cursor-pointer"
                      title={`${social.name}: ${social.handle}`}
                    >
                      <Icon className="w-3.5 h-3.5 text-purple-400 group-hover:text-purple-300 transition-colors" />
                      <span>{social.handle}</span>
                      <ExternalLink className="w-2.5 h-2.5 text-slate-500 group-hover:text-slate-300 transition-colors opacity-70" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Column 2: Explore Universe (Span 3 cols) */}
          <div className="md:col-span-3 space-y-3 text-xs flex flex-col items-center md:items-start text-center md:text-left">
            <div className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center justify-center md:justify-start gap-1.5">
              <Compass className="w-3.5 h-3.5 text-purple-400" />
              <span>Explore Pillars</span>
            </div>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('hub')}
                  className="hover:text-purple-300 hover:translate-x-0.5 transition-all cursor-pointer text-center md:text-left"
                >
                  Central Command Hub
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('dna')}
                  className="hover:text-purple-300 hover:translate-x-0.5 transition-all cursor-pointer text-center md:text-left"
                >
                  Engineering DNA Assessment
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('problems')}
                  className="hover:text-purple-300 hover:translate-x-0.5 transition-all cursor-pointer text-center md:text-left"
                >
                  The Problem Wall
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('missions')}
                  className="hover:text-purple-300 hover:translate-x-0.5 transition-all cursor-pointer text-center md:text-left"
                >
                  Future Missions Simulator
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('stories')}
                  className="hover:text-purple-300 hover:translate-x-0.5 transition-all cursor-pointer text-center md:text-left"
                >
                  Stories & Voices of Resilience
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('legacy')}
                  className="hover:text-purple-300 hover:translate-x-0.5 transition-all cursor-pointer text-center md:text-left"
                >
                  Sir M. Visvesvaraya Legacy
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Ecosystem, Pritee AI & Identity (Span 4 cols) */}
          <div className="md:col-span-4 space-y-4 text-xs flex flex-col items-center md:items-start text-center md:text-left">
            <div className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center justify-center md:justify-start gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Ecosystem & AI</span>
            </div>

            <ul className="space-y-2 flex flex-col items-center md:items-start">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('pritee')}
                  className="hover:text-purple-300 hover:translate-x-0.5 transition-all cursor-pointer text-center md:text-left flex items-center gap-1.5"
                >
                  <span>Ask Pritee AI Mentor</span>
                  <span className="text-[10px] bg-purple-900/60 text-purple-300 px-1.5 py-0.2 rounded font-mono">Live</span>
                </button>
              </li>
              <li>
                <a
                  href="https://rjshree.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-purple-300 hover:translate-x-0.5 transition-all inline-flex items-center gap-1"
                >
                  <span>Shree Labs Collective</span>
                  <ExternalLink className="w-3 h-3 text-purple-400" />
                </a>
              </li>
            </ul>

            {/* Canonical Platform Card */}
            <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-900/40 space-y-2 max-w-sm w-full text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-1.5 text-[11px] font-bold text-slate-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Canonical Web Platform</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                Maintained under the canonical engineering namespace:
              </p>
              <a
                href="https://rjshree.com/engineerverse"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 hover:underline font-mono text-[11px] break-all block"
              >
                https://rjshree.com/engineerverse
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Dynamic Copyright & Verification */}
        <div className="pt-8 border-t border-purple-950/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2 flex-wrap text-center sm:text-left">
            <span>© {currentYear} Shree Labs. All rights reserved.</span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span>
              Crafted by{' '}
              <a
                href="https://rjshree.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 hover:underline font-medium"
              >
                Shree Labs | Rajshree
              </a>
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-400 text-xs flex-wrap justify-center sm:justify-end">
            <span className="italic text-purple-300/80">Built with precision for the builders of tomorrow.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

