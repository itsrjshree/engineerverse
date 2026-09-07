/**
 * ENGINEERVERSE — Route & Information Architecture Explorer
 * Implements Section 4 & 5:
 * Canonical route `/engineerverse`
 * Sub-routes, SEO meta preview, and sitemap hierarchy
 */

import { useState } from 'react';
import { ROUTES } from '../config/routes.js';
import { Card } from './ui/Card.jsx';
import { Badge } from './ui/Badge.jsx';
import { Globe, Shield, Sparkles, Check, Share2, ExternalLink } from 'lucide-react';

export function RouteNavigator() {
  const [selectedRoute, setSelectedRoute] = useState(ROUTES.HUB);

  return (
    <div className="w-full space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="purple" size="xs">Canonical IA Contract (Rule 4)</Badge>
          <span className="text-xs text-purple-400 font-semibold">rjshree.com/engineerverse</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          Information Architecture & Canonical Routes.
        </h2>
        <p className="text-sm text-slate-300 mt-1 max-w-2xl">
          Complete sitemap of all 18 canonical routes, dynamic OpenGraph previews, and indexing specifications.
        </p>
      </div>

      {/* Routes Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Route Selector List */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-purple-900">
          {Object.entries(ROUTES).map(([key, route]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedRoute(route)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                selectedRoute.path === route.path
                  ? 'bg-purple-950/70 border-purple-500 text-white shadow-md'
                  : 'bg-[#09091b] border-purple-950/40 text-slate-300 hover:bg-[#0e0e28] hover:text-white'
              }`}
            >
              <div>
                <div className="text-xs font-bold text-white">{route.title}</div>
                <code className="text-[11px] text-purple-300 font-mono">{route.path}</code>
              </div>
              <Badge variant={route.requiresAuth ? 'warning' : 'default'} size="xs">
                {route.requiresAuth ? 'Admin Protected' : 'Public Canonical'}
              </Badge>
            </button>
          ))}
        </div>

        {/* Selected Route Meta & SEO Inspector */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-purple-950/50 pb-4">
              <div>
                <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">
                  Canonical URL Specification
                </span>
                <div className="text-xl font-extrabold text-white">
                  {selectedRoute.title}
                </div>
              </div>
              <Badge variant="glow" size="sm">
                Canonical: /engineerverse
              </Badge>
            </div>

            {/* Path & Canonical tags */}
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-black/40 border border-purple-950/60 font-mono">
                <span className="text-slate-400">Canonical HREF:</span>{' '}
                <span className="text-purple-300">
                  https://rjshree.com{selectedRoute.path}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-purple-950/60">
                <span className="text-slate-400 block mb-1">Meta Description:</span>
                <span className="text-slate-200">{selectedRoute.description}</span>
              </div>
            </div>

            {/* Social Share / OpenGraph Preview Card */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-purple-300">
                Social Share & OpenGraph Preview Card
              </span>
              <div className="rounded-2xl border border-purple-800/40 bg-gradient-to-br from-[#131132] to-[#070717] p-5 space-y-3">
                <div className="flex items-center justify-between text-[11px] text-purple-400 font-mono">
                  <span>RJSHREE.COM</span>
                  <span>ENGINEERVERSE {new Date().getFullYear()}</span>
                </div>
                <h4 className="text-base sm:text-lg font-bold text-white">
                  {selectedRoute.title} — ENGINEERVERSE
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedRoute.description}
                </p>
                <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Shree Labs × Pritee AI</span>
                  <span>Engineers' Day Evergreen Edition</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default RouteNavigator;
