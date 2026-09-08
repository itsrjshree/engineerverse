/**
 * ENGINEERVERSE — Interactive Engineering DNA Assessment Simulator
 * Implements EV-004, EV-005, EV-006, EV-007, EV-008, EV-010
 * Pure deterministic mathematics: "Algorithm decides -> AI explains"
 */

import { useState } from 'react';
import {
  SCENARIOS,
  DIMENSIONS,
  ARCHETYPES,
  computeDeterministicScores,
  classifyArchetypes,
  computeLegendResonance,
} from '../config/dnaModel.js';
import { BRAND_CONFIG } from '../config/branding.js';
import {
  generateShortPublicId,
  buildCanonicalShareUrl,
  generateBrandedSvgArtifact,
  downloadArtifactAsSvg,
  ARTIFACT_TYPES,
} from '../services/artifacts.js';
import { guestStorage } from '../services/firebaseClient.js';
import { analytics } from '../services/analytics.js';
import { ANALYTICS_EVENTS } from '../config/analyticsEvents.js';
import { Card } from './ui/Card.jsx';
import { Badge } from './ui/Badge.jsx';
import { Button } from './ui/Button.jsx';
import { TabPill } from './ui/TabPill.jsx';
import {
  Sparkles,
  ArrowRight,
  RotateCcw,
  Share2,
  CheckCircle,
  Award,
  Download,
  Shield,
  Lock,
} from 'lucide-react';

export function DnaSimulator() {
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]); // [{ scenarioId, optionId }]
  const [isCompleted, setIsCompleted] = useState(false);
  const [userName, setUserName] = useState('');
  const [calculatedResults, setCalculatedResults] = useState(null);
  const [activeTab, setActiveTab] = useState('card'); // 'card' | 'dimensions' | 'resonance'
  const [publicId, setPublicId] = useState(null);
  const [allowPublicConsent, setAllowPublicConsent] = useState(false);
  const [copyNotice, setCopyNotice] = useState('');

  const currentScenario = SCENARIOS[currentScenarioIndex];

  const handleSelectOption = (optionId) => {
    const updated = [
      ...selectedAnswers.filter((a) => a.scenarioId !== currentScenario.id),
      { scenarioId: currentScenario.id, optionId },
    ];
    setSelectedAnswers(updated);

    // Track analytics event
    analytics.track(ANALYTICS_EVENTS.DNA_START, {
      scenarioIndex: currentScenarioIndex,
      optionId,
    });

    if (currentScenarioIndex < SCENARIOS.length - 1) {
      setCurrentScenarioIndex(currentScenarioIndex + 1);
    } else {
      // Complete assessment!
      finishAssessment(updated);
    }
  };

  const finishAssessment = (answers) => {
    const scores = computeDeterministicScores(answers);
    const classification = classifyArchetypes(scores);
    const legendResonances = computeLegendResonance(scores);

    const result = {
      scores,
      classification,
      legendResonances,
      completedAt: new Date().toISOString(),
    };

    const newPublicId = generateShortPublicId('id');
    setPublicId(newPublicId);
    setCalculatedResults(result);
    setIsCompleted(true);

    // Persist to guest local storage
    guestStorage.saveJourney({
      publicId: newPublicId,
      dnaResult: result,
      name: userName || 'Builder',
    });

    analytics.track(ANALYTICS_EVENTS.DNA_COMPLETE, {
      publicId: newPublicId,
      primaryArchetype: classification.primary.id,
      overallDnaScore: classification.overallDnaScore,
    });
  };

  const handleReset = () => {
    setSelectedAnswers([]);
    setCurrentScenarioIndex(0);
    setIsCompleted(false);
    setCalculatedResults(null);
    setPublicId(null);
    setCopyNotice('');
  };

  const handleDownloadArtifact = () => {
    if (!calculatedResults || !publicId) return;
    try {
      const svgString = generateBrandedSvgArtifact({
        type: ARTIFACT_TYPES.IDENTITY,
        title: userName || 'Certified Engineer',
        subtitle: calculatedResults.classification.primary.title,
        superpower: calculatedResults.classification.primary.superpower,
        score: calculatedResults.classification.overallDnaScore,
        publicId,
      });
      downloadArtifactAsSvg(`engineerverse_identity_${publicId}`, svgString);
    } catch (err) {
      console.error('Artifact generation failed:', err);
    }
  };

  const canonicalShareUrl = publicId ? buildCanonicalShareUrl('identity', publicId) : BRAND_CONFIG.canonicalBaseUrl;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My Engineering DNA — ENGINEERVERSE',
        text: `I discovered my Engineering Archetype is ${calculatedResults?.classification?.primary?.title} on ENGINEERVERSE!`,
        url: canonicalShareUrl,
      });
    } else {
      navigator.clipboard.writeText(canonicalShareUrl);
      setCopyNotice('Official canonical link copied to clipboard!');
      setTimeout(() => setCopyNotice(''), 4000);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Section Title */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="purple" size="xs">Deterministic Mindset Engine</Badge>
          <span className="text-xs text-purple-400 font-semibold">Algorithm Decides → AI Explains</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          Engineering DNA Assessment.
        </h2>
        <p className="text-sm text-slate-300 mt-1 max-w-2xl">
          Real crisis dilemmas. Zero generic multiple-choice questions. Uncover your archetype across 12 dimensions.
        </p>
      </div>

      {!isCompleted ? (
        /* Scenario Questionnaire Flow */
        <Card className="p-6 sm:p-8 space-y-6">
          {/* Progress Indicator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-purple-300">
              <span className="font-semibold uppercase tracking-wider">
                Scenario {currentScenarioIndex + 1} of {SCENARIOS.length}
              </span>
              <span>{Math.round(((currentScenarioIndex + 1) / SCENARIOS.length) * 100)}% Complete</span>
            </div>
            <div className="w-full h-2 rounded-full bg-purple-950/60 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${((currentScenarioIndex + 1) / SCENARIOS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Scenario Details */}
          <div className="space-y-3">
            <div className="inline-block px-2.5 py-1 rounded-full bg-purple-950/70 border border-purple-800/40 text-purple-300 text-xs font-semibold">
              Category: {currentScenario.category}
            </div>
            <h3 className="text-lg sm:text-2xl font-bold text-white leading-snug">
              {currentScenario.scenarioText}
            </h3>
          </div>

          {/* Dilemma Option Buttons */}
          <div className="space-y-3 pt-2">
            {currentScenario.options.map((option) => {
              const isSelected = selectedAnswers.some(
                (a) => a.scenarioId === currentScenario.id && a.optionId === option.id
              );
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelectOption(option.id)}
                  className={`w-full text-left p-4 sm:p-5 rounded-xl border transition-all duration-200 cursor-pointer flex items-start gap-4 ${
                    isSelected
                      ? 'bg-purple-950/80 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                      : 'bg-[#070718] border-purple-950/50 text-slate-200 hover:border-purple-600/40 hover:bg-[#0c0c24] hover:text-white'
                  }`}
                >
                  <span className="w-7 h-7 rounded-full bg-purple-900/60 border border-purple-700/50 text-purple-200 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {option.id}
                  </span>
                  <span className="text-xs sm:text-sm font-medium leading-relaxed">
                    {option.text}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-purple-950/40 text-xs">
            <button
              type="button"
              disabled={currentScenarioIndex === 0}
              onClick={() => setCurrentScenarioIndex(currentScenarioIndex - 1)}
              className="text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Previous Scenario
            </button>
            <span className="text-purple-300/60 font-sans text-xs">Crisis Evaluation Active</span>
          </div>
        </Card>
      ) : (
        /* Completed DNA Results & Engineer Identity Card */
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Result Header & Switcher */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#09091f] border border-purple-950/40">
            <div>
              <div className="text-xs text-purple-400 font-semibold uppercase tracking-wider">
                Assessment Complete
              </div>
              <div className="text-lg font-bold text-white">
                Primary Archetype: {calculatedResults.classification.primary.title}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <TabPill
                label="Identity Card"
                active={activeTab === 'card'}
                onClick={() => setActiveTab('card')}
              />
              <TabPill
                label="12 Dimensions"
                active={activeTab === 'dimensions'}
                onClick={() => setActiveTab('dimensions')}
              />
              <TabPill
                label="Legend Resonance"
                active={activeTab === 'resonance'}
                onClick={() => setActiveTab('resonance')}
              />
              <Button size="sm" variant="ghost" onClick={handleReset} icon={RotateCcw}>
                Retake
              </Button>
            </div>
          </div>

          {/* Tab 1: Engineer Identity Card */}
          {activeTab === 'card' && (
            <div className="flex flex-col items-center justify-center py-4 space-y-4">
              {/* Copy Protected Card Container */}
              <div
                className="w-full max-w-md bg-gradient-to-b from-[#120f30] via-[#09091d] to-[#060613] rounded-3xl border-2 border-purple-500/40 p-4 sm:p-6 md:p-8 shadow-[0_0_40px_rgba(168,85,247,0.25)] space-y-5 sm:space-y-6 relative overflow-hidden select-none"
                onCopy={(e) => {
                  e.preventDefault();
                  setCopyNotice('To protect identity card integrity, use the Official Share Link or Download Branded Card.');
                  setTimeout(() => setCopyNotice(''), 4000);
                }}
              >
                {/* Ambient glow accent */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/15 rounded-full blur-2xl pointer-events-none" />

                {/* Card Top Brand Strip */}
                <div className="flex items-center justify-between border-b border-purple-800/40 pb-4">
                  <div>
                    <span className="text-xs font-mono font-bold tracking-widest text-purple-400">
                      {BRAND_CONFIG.platformName} {new Date().getFullYear()}
                    </span>
                    <div className="text-[10px] text-slate-400 font-medium">
                      {BRAND_CONFIG.creators.title}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-purple-900/60 border border-purple-500/50 flex items-center justify-center text-white font-bold text-xs">
                    EV
                  </div>
                </div>

                {/* Identity Holder */}
                <div className="space-y-1">
                  <span className="text-[11px] uppercase tracking-wider text-purple-300/70 font-semibold">
                    Certified Engineer
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-white tracking-tight break-words">
                    {userName || 'Anonymous Engineer'}
                  </div>
                  {publicId && (
                    <div className="text-[10px] font-mono text-purple-400/60 break-all">
                      ID: {publicId}
                    </div>
                  )}
                </div>

                {/* Archetype Showcase */}
                <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-600/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-purple-300">
                      Primary Archetype
                    </span>
                    <Badge variant="glow" size="xs">
                      {calculatedResults.classification.primary.matchScore}% Match
                    </Badge>
                  </div>
                  <div className="text-lg sm:text-xl font-extrabold text-white break-words">
                    {calculatedResults.classification.primary.title}
                  </div>
                  <p className="text-xs text-purple-200/80 italic break-words leading-relaxed">
                    "{calculatedResults.classification.primary.motto}"
                  </p>
                </div>

                {/* Superpower & Dimensions preview */}
                <div className="space-y-2 text-xs">
                  <div className="text-slate-300 break-words leading-relaxed">
                    <strong className="text-purple-400">Superpower:</strong>{' '}
                    {calculatedResults.classification.primary.superpower}
                  </div>
                  <div className="text-slate-300">
                    <strong className="text-purple-400">Overall DNA Score:</strong>{' '}
                    <span className="font-mono font-bold text-white">
                      {calculatedResults.classification.overallDnaScore} / 100
                    </span>
                  </div>
                </div>

                {/* Mandatory Official Watermark Strip */}
                <div className="pt-4 border-t border-purple-900/40 flex flex-col sm:flex-row items-center justify-between gap-1 text-[9px] text-purple-300/70 uppercase tracking-wider text-center sm:text-left">
                  <span>{BRAND_CONFIG.watermark.text}</span>
                  <span className="font-mono text-purple-400/80">{BRAND_CONFIG.website}</span>
                </div>
              </div>

              {/* Notification Banner */}
              {copyNotice && (
                <div className="p-2.5 rounded-lg bg-purple-950/90 border border-purple-500/50 text-xs text-purple-200 text-center animate-in fade-in">
                  {copyNotice}
                </div>
              )}

              {/* Privacy Consent & Sharing Controls */}
              <div className="w-full max-w-md bg-[#08081a] border border-purple-900/30 rounded-2xl p-4 space-y-3">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={allowPublicConsent}
                    onChange={(e) => setAllowPublicConsent(e.target.checked)}
                    className="mt-0.5 rounded border-purple-800 bg-[#050510] text-purple-600 focus:ring-purple-500"
                  />
                  <span>
                    <strong>Enable Public Canonical URL</strong>
                    <br />
                    <span className="text-[11px] text-slate-400">
                      Allows colleagues to view your verified Archetype breakdown via its canonical link.
                    </span>
                  </span>
                </label>

                {/* Card Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-purple-950/40">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Share2}
                    onClick={handleShare}
                  >
                    Share Canonical Link
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Download}
                    onClick={handleDownloadArtifact}
                  >
                    Download Branded Card (SVG)
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: 12 Dimensions Breakdown (EV-006) */}
          {activeTab === 'dimensions' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(DIMENSIONS).map(([dimKey, dim]) => {
                const score = calculatedResults.scores[dimKey] || 50;
                return (
                  <Card key={dimKey} className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{dim.name}</span>
                      <span className="font-mono text-xs font-bold text-purple-400">
                        {score}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-purple-950/60 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full"
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {dim.description}
                    </p>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Tab 3: Engineering Legend Resonance (EV-008) */}
          {activeTab === 'resonance' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {calculatedResults.legendResonances.map((legend) => (
                <Card key={legend.id} className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-bold text-white">{legend.name}</h4>
                      <span className="text-xs text-purple-400/80">{legend.era}</span>
                    </div>
                    <Badge variant="glow" size="sm">
                      {legend.alignmentScore}% Resonance
                    </Badge>
                  </div>

                  <blockquote className="text-xs text-slate-300 italic border-l-2 border-purple-500/50 pl-3">
                    "{legend.quote}"
                  </blockquote>

                  <p className="text-xs text-purple-200/70">
                    {legend.alignmentNote}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DnaSimulator;
