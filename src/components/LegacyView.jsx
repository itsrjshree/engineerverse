/**
 * ENGINEERVERSE — Sir M. Visvesvaraya Legacy (Legacy Pillar)
 * The life, architectural marvels, and timeless engineering principles of India's patron engineer.
 * Fully public-facing, inspiring, zero internal EV numbers.
 */

import { Card } from './ui/Card.jsx';
import { Badge } from './ui/Badge.jsx';
import { Button } from './ui/Button.jsx';
import { Award, Compass, Landmark, ShieldCheck, Sparkles, Droplet } from 'lucide-react';
import { BRAND_CONFIG } from '../config/branding.js';

const LEGACY_MARVELS = [
  {
    title: 'Automated Weir Floodgates (Patent 1903)',
    location: 'Khadakwasla Reservoir, Pune & Tigra Dam, Gwalior',
    impact: 'Increased storage capacity by 25% with zero human risk during catastrophic floods',
    description:
      'Designed self-acting counterbalanced sluice gates that opened automatically when water exceeded the crest level and closed precisely when the flood subsided, without needing human intervention or electrical power.',
    icon: Droplet,
  },
  {
    title: 'Krishna Raja Sagara Dam & Brindavan Gardens',
    location: 'Mandya / Mysuru, Karnataka (1924–1938)',
    impact: 'Transformed arid Mandya into the sugar capital of Karnataka and powered the Kolar Gold Fields',
    description:
      'Constructed using Surkhi mortar (a traditional lime and burnt clay formulation stronger than Portland cement) when international advisors considered the bedrock unfeasible. At the time of completion, it was Asia’s largest reservoir.',
    icon: Landmark,
  },
  {
    title: 'Hyderabad Flood Protection & Drainage (1908)',
    location: 'Musi & Esi River Basin, Telangana',
    impact: 'Protected the historical city of Hyderabad from cyclical catastrophic inundation',
    description:
      'Following the devastating 1908 Musi flood that claimed 15,000 lives, Visvesvaraya engineered twin balancing reservoirs (Osman Sagar and Himayat Sagar) and a modern underground sewage network that continues to protect the city more than a century later.',
    icon: ShieldCheck,
  },
  {
    title: 'The Steel City of Bhadravathi (VISL)',
    location: 'Bhadravathi, Karnataka (1923)',
    impact: 'Pioneered indigenous metallurgy and charcoal pig-iron manufacturing in South India',
    description:
      'Established Mysore Iron and Steel Works to prove that India could build sovereign, high-grade structural alloys without complete reliance on British imperial imports.',
    icon: Compass,
  },
];

export function LegacyView() {
  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="purple" size="xs">Legacy Pillar</Badge>
          <span className="text-xs text-purple-400 font-semibold">1860 – 1962 • Bharat Ratna</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          Sir M. Visvesvaraya.
        </h2>
        <p className="text-sm text-slate-300 mt-1 max-w-2xl font-normal leading-relaxed">
          The patron of Indian Engineering. A statesman whose engineering transformed dry rivers into fertile valleys, built universities, and proved that ethical precision outlives empires.
        </p>
      </div>

      {/* Quote Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-950/60 via-[#120e33] to-indigo-950/60 border border-purple-700/40 relative overflow-hidden">
        <div className="max-w-3xl space-y-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-purple-400">
            The Philosophy of Action
          </span>
          <blockquote className="text-base sm:text-xl font-serif italic text-white leading-relaxed">
            "It is better to work out than rust out. To work is to live. Without continuous industrious pursuit, the mind decays and nations stumble."
          </blockquote>
          <div className="text-xs text-purple-300 font-medium">
            — Sir Mokshagundam Visvesvaraya, addressing the Mysore Legislative Assembly
          </div>
        </div>
      </div>

      {/* Engineering Marvels Grid */}
      <div className="space-y-4">
        <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
          Monumental Works of Enduring Engineering
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {LEGACY_MARVELS.map((marvel) => {
            const IconComp = marvel.icon;
            return (
              <Card key={marvel.title} className="p-6 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-900/50 border border-purple-700/40 flex items-center justify-center text-purple-300 shrink-0">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white leading-snug">
                        {marvel.title}
                      </h4>
                      <div className="text-xs text-purple-400 font-medium">
                        {marvel.location}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {marvel.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-purple-950/40 text-xs text-purple-200/90 font-medium">
                  <span className="text-purple-400 font-bold">Societal Impact:</span> {marvel.impact}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default LegacyView;
