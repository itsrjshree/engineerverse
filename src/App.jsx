/**
 * ENGINEERVERSE — Root Application Shell
 * Pure JavaScript (Rule 1).
 * Architecture:
 * - Dynamic Campaign Lifecycle State Machine (EV-058 & EV-059)
 * - Central 60-Feature Registry (EV-001 through EV-060)
 * - The Problems Wall (EV-020) per explicit user instruction
 * - Deterministic DNA Assessment Engine (EV-004 through EV-010)
 * - Canonical Route Awareness (/engineerverse)
 */

import { useState, useEffect } from 'react';
import { getCampaignState } from './config/campaign.js';
import { analytics } from './services/analytics.js';
import { ANALYTICS_EVENTS } from './config/analyticsEvents.js';

// Layout & UI Components
import Header from './components/Header.jsx';
import EditionBanner from './components/EditionBanner.jsx';
import HeroSection from './components/HeroSection.jsx';
import Footer from './components/Footer.jsx';

// Public Experience Views (Experience Pillars)
import DnaSimulator from './components/DnaSimulator.jsx';
import ProblemsWallPreview from './components/ProblemsWallPreview.jsx';
import PriteeMentorPreview from './components/PriteeMentorPreview.jsx';
import FutureMissionsView from './components/FutureMissionsView.jsx';
import StoriesVoicesView from './components/StoriesVoicesView.jsx';
import LegacyView from './components/LegacyView.jsx';

// Internal Product / Engineering Control Layer
import AdminControlSurface from './components/admin/AdminControlSurface.jsx';

export function App() {
  const [activeSection, setActiveSection] = useState('hub');
  const [simulatedDate, setSimulatedDate] = useState(null);
  const [campaignState, setCampaignState] = useState(() => getCampaignState());

  // Update campaign state whenever simulated date or live clock changes
  useEffect(() => {
    const updated = getCampaignState(simulatedDate);
    setCampaignState(updated);
  }, [simulatedDate]);

  // Initial landing page view telemetry (zero PII)
  useEffect(() => {
    analytics.track(ANALYTICS_EVENTS.LANDING_VIEW, {
      edition: campaignState.edition,
      initialSection: activeSection,
    });
  }, [campaignState.edition]);

  const handleNavigate = (sectionId) => {
    setActiveSection(sectionId);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    analytics.track(ANALYTICS_EVENTS.RESULT_VIEW, {
      section: sectionId,
    });
  };

  return (
    <div className="min-h-screen bg-[#050510] text-slate-100 flex flex-col selection:bg-purple-600 selection:text-white overflow-x-hidden font-sans">
      {/* Dynamic Campaign Edition Banner */}
      <EditionBanner
        campaignState={campaignState}
        onSimulateDate={setSimulatedDate}
      />

      {/* Main Brand Header Navigation */}
      <Header
        activeSection={activeSection}
        onNavigate={handleNavigate}
        campaignState={campaignState}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {/* Hub / Home View */}
        {activeSection === 'hub' && (
          <div className="space-y-16 pb-16">
            <HeroSection
              campaignState={campaignState}
              onNavigate={handleNavigate}
            />

            {/* Public Experience Spotlights */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
              {/* DNA Section Spotlight */}
              <section id="dna-spotlight">
                <DnaSimulator />
              </section>

              {/* The Problem Wall Spotlight */}
              <section id="problems-spotlight">
                <ProblemsWallPreview />
              </section>

              {/* Mentor Spotlight */}
              <section id="pritee-spotlight">
                <PriteeMentorPreview />
              </section>
            </div>
          </div>
        )}

        {/* Dedicated Experience Views */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {activeSection === 'dna' && <DnaSimulator />}
          {activeSection === 'problems' && <ProblemsWallPreview />}
          {activeSection === 'missions' && <FutureMissionsView onSelectMission={handleNavigate} />}
          {activeSection === 'stories' && <StoriesVoicesView />}
          {activeSection === 'legacy' && <LegacyView />}
          {activeSection === 'pritee' && <PriteeMentorPreview />}

          {/* Internal Engineering Layer (Restricted Admin Control Surface) */}
          {(activeSection === 'admin-control' ||
            activeSection === 'features' ||
            activeSection === 'routes' ||
            activeSection === 'architecture' ||
            activeSection === 'admin') && (
            <AdminControlSurface
              onExitToPublic={() => handleNavigate('hub')}
              campaignState={campaignState}
              onSimulateDate={setSimulatedDate}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default App;
