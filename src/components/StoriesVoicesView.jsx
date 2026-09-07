/**
 * ENGINEERVERSE — Stories & Voices (Humanity & Community Pillar)
 * Real builder stories, the Engineer's Oath, and community pledges.
 * Fully public-facing, inspiring, zero internal EV numbers.
 */

import { useState } from 'react';
import { Card } from './ui/Card.jsx';
import { Badge } from './ui/Badge.jsx';
import { Button } from './ui/Button.jsx';
import { TabPill } from './ui/TabPill.jsx';
import {
  Heart,
  Quote,
  Award,
  Scroll,
  CheckCircle2,
  Share2,
  Download,
  Shield,
  Sparkles,
} from 'lucide-react';
import { BRAND_CONFIG } from '../config/branding.js';
import {
  generateShortPublicId,
  buildCanonicalShareUrl,
  generateBrandedSvgArtifact,
  downloadArtifactAsSvg,
  ARTIFACT_TYPES,
} from '../services/artifacts.js';

const INSPIRING_STORIES = [
  {
    id: 'story_visvesvaraya',
    title: 'The Train Whistle That Saved Thousands',
    subtitle: 'Sir M. Visvesvaraya',
    role: 'Pioneer of Precision Engineering',
    category: 'Legacy & Integrity',
    quote:
      'Remember, your work may be only to sweep a railway crossing, but it must be done with as much care as if you were running the railway itself.',
    story:
      'On a dark night aboard an express train in British India, Visvesvaraya pulled the emergency chain. Passengers and guards were furious—until an inspection ahead revealed that the track had been sabotaged and severed. Asked how he knew, he calmly replied: "The sound vibration of the steel rail under the wheels had changed pitch."',
  },
  {
    id: 'story_vermin_trap',
    title: 'The Village Irrigation Siphon',
    subtitle: 'Malleshappa & Sridhar',
    role: 'Grassroots Mechanical Innovators',
    category: 'Grassroots Ingenuity',
    quote:
      'When your crops are dying and diesel pumps are unaffordable, atmospheric pressure is free fuel.',
    story:
      'Using scrap PVC pipes and a self-priming non-return valve made from discarded bicycle inner-tubes, these rural Karnataka mechanics engineered a continuous zero-electricity siphon lifting water 18 feet over an embankment to irrigate 40 acres of parched groundnut crops.',
  },
  {
    id: 'story_braille_pad',
    title: 'Code Across the Darkness',
    subtitle: 'Ananya Deshmukh',
    role: 'Embedded Systems Engineer',
    category: 'Inclusive Engineering',
    quote:
      'If technology is not accessible to a blind child in a village school, we have merely built toys for the privileged.',
    story:
      'Frustrated by $3,000 commercial tactile displays, Ananya spent three years developing a 3D-printable magnetic latch mechanism that converts open-source screen readers into tangible mechanical braille pins for less than the cost of a textbook.',
  },
];

const OATH_TEXT = `I solemnly pledge to dedicate my engineering skills to the service and protection of humanity. 
I will place the safety, health, and dignity of all living beings above personal gain and institutional pressure. 
I will build systems that are honest, resilient, inclusive, and durable. 
I will never weaponize complexity, nor obscure truth behind technical jargon. 
In the spirit of builders who walked before me, I pledge to turn chaos into order for generations yet unborn.`;

export function StoriesVoicesView() {
  const [activeTab, setActiveTab] = useState('stories'); // 'stories' | 'oath'
  const [signName, setSignName] = useState('');
  const [hasSignedOath, setHasSignedOath] = useState(false);
  const [oathPublicId, setOathPublicId] = useState(null);
  const [copiedNotice, setCopiedNotice] = useState('');

  const handleSignOath = (e) => {
    e.preventDefault();
    if (!signName.trim()) return;
    const id = generateShortPublicId('pledge');
    setOathPublicId(id);
    setHasSignedOath(true);
  };

  const handleDownloadOath = () => {
    if (!oathPublicId) return;
    const svg = generateBrandedSvgArtifact({
      type: ARTIFACT_TYPES.PLEDGE,
      title: signName || 'Verified Builder',
      subtitle: "The Engineer's Oath of Integrity & Humanity",
      superpower: 'Committed to ethical, resilient, and inclusive engineering',
      publicId: oathPublicId,
    });
    downloadArtifactAsSvg(`engineerverse_pledge_${oathPublicId}`, svg);
  };

  const shareUrl = oathPublicId
    ? buildCanonicalShareUrl('pledge', oathPublicId)
    : BRAND_CONFIG.canonicalBaseUrl;

  const handleShareOath = () => {
    if (navigator.share) {
      navigator.share({
        title: "The Engineer's Oath — ENGINEERVERSE",
        text: `${signName || 'An engineer'} has taken the official Engineer's Oath on ENGINEERVERSE!`,
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      setCopiedNotice('Pledge canonical link copied to clipboard!');
      setTimeout(() => setCopiedNotice(''), 4000);
    }
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="purple" size="xs">Humanity & Community</Badge>
            <span className="text-xs text-purple-400 font-semibold">Living Engineering Heritage</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Stories & Voices.
          </h2>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl font-normal leading-relaxed">
            Engineering is not spreadsheets or syntax; it is human compassion expressed in physical and digital form.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <TabPill
            label="Inspiring Stories"
            active={activeTab === 'stories'}
            onClick={() => setActiveTab('stories')}
          />
          <TabPill
            label="The Engineer's Oath"
            active={activeTab === 'oath'}
            onClick={() => setActiveTab('oath')}
          />
        </div>
      </div>

      {/* Tab 1: Stories */}
      {activeTab === 'stories' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {INSPIRING_STORIES.map((story) => (
            <Card key={story.id} className="p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-800/40">
                    {story.category}
                  </span>
                  <Quote className="w-4 h-4 text-purple-500/50" />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white leading-snug">
                    {story.title}
                  </h3>
                  <div className="text-xs text-purple-300 font-medium">
                    {story.subtitle} • <span className="text-slate-400">{story.role}</span>
                  </div>
                </div>

                <blockquote className="text-xs italic text-purple-200/90 border-l-2 border-purple-500/60 pl-3 py-1">
                  "{story.quote}"
                </blockquote>

                <p className="text-xs text-slate-300 leading-relaxed pt-1">
                  {story.story}
                </p>
              </div>

              <div className="pt-3 border-t border-purple-950/40 text-[11px] text-purple-400/80 font-mono">
                {BRAND_CONFIG.platformName} Archive
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Tab 2: The Engineer's Oath */}
      {activeTab === 'oath' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="p-8 sm:p-10 space-y-6 relative overflow-hidden bg-gradient-to-b from-[#110e2e] via-[#09091c] to-[#060612] border-2 border-purple-500/40 select-none">
            <div className="flex items-center justify-between border-b border-purple-800/40 pb-4">
              <div className="flex items-center gap-2">
                <Scroll className="w-5 h-5 text-purple-400" />
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-purple-300">
                  {BRAND_CONFIG.platformName} Code of Ethics
                </span>
              </div>
              <span className="text-[10px] text-purple-400 font-semibold uppercase">
                Solemn Pledge
              </span>
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-white tracking-tight">
                The Engineer's Oath of Humanity.
              </h3>
              <p className="text-xs text-purple-300/80">
                Inspired by the lifetime dedication of Sir M. Visvesvaraya
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#060613]/70 border border-purple-900/40">
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-serif italic text-center">
                "{OATH_TEXT}"
              </p>
            </div>

            {hasSignedOath ? (
              <div className="space-y-4 pt-4 border-t border-purple-900/40 text-center animate-in fade-in">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Oath Signed & Sealed by: <strong>{signName}</strong></span>
                </div>
                {oathPublicId && (
                  <div className="text-[11px] font-mono text-purple-300/70">
                    Credential ID: {oathPublicId}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Share2}
                    onClick={handleShareOath}
                  >
                    Share Pledge
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Download}
                    onClick={handleDownloadOath}
                  >
                    Download Branded Credential (SVG)
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSignOath} className="space-y-4 pt-4 border-t border-purple-900/40">
                <div className="space-y-1.5">
                  <label htmlFor="engineer-name-input" className="text-xs text-purple-300 font-medium">
                    Enter your name to sign the oath:
                  </label>
                  <input
                    id="engineer-name-input"
                    type="text"
                    required
                    placeholder="e.g. Radhika Sharma"
                    value={signName}
                    onChange={(e) => setSignName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#070718] border border-purple-800/50 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                  />
                </div>
                <Button type="submit" variant="primary" size="md" className="w-full">
                  Sign & Commit to the Oath
                </Button>
              </form>
            )}

            {/* Official Watermark */}
            <div className="pt-4 border-t border-purple-950/40 flex items-center justify-between text-[9px] text-purple-300/60 uppercase tracking-wider">
              <span>{BRAND_CONFIG.watermark.text}</span>
              <span className="font-mono">{BRAND_CONFIG.website}</span>
            </div>
          </Card>

          {copiedNotice && (
            <div className="p-3 rounded-xl bg-purple-950/80 border border-purple-500/50 text-xs text-purple-200 text-center animate-in fade-in">
              {copiedNotice}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default StoriesVoicesView;
