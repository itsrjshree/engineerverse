/**
 * ENGINEERVERSE — Presentation State & Annual Activation Engine
 * Section 2 & 3: Evergreen Product Boundary & Date Contract
 *
 * Locked Constitution:
 * 1. ENGINEERVERSE is an evergreen platform permanently available at /engineerverse.
 * 2. There is NO shutdown after Engineers' Day.
 * 3. There is NO "campaign ended", "expired", "September 16 mode", or "post-campaign" dead state.
 * 4. Exactly TWO date-driven presentation states exist:
 *    A) ENGINEERS_DAY: September 15 00:00:00 IST through September 15 23:59:59 IST (Asia/Kolkata).
 *    B) EVERGREEN: Active on every other date of the year (364/365 days).
 * 5. Dynamic year handling: zero hardcoded 2026 business logic. Valid for 2026, 2027, 2028, 2035+.
 * 6. Extensible annual configuration capability without altering the canonical /engineerverse hub.
 */

export const PRESENTATION_STATES = {
  ENGINEERS_DAY: 'engineers_day',
  EVERGREEN: 'evergreen',
};

// Aliased for backwards compatibility with existing references
export const CAMPAIGN_STATES = {
  ENGINEERS_DAY: 'engineers_day',
  LAUNCH_DAY: 'engineers_day',
  EVERGREEN: 'evergreen',
};

// IST Offset in milliseconds (UTC+5:30)
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/**
 * Normalizes any Date or timestamp to India Standard Time (IST / Asia/Kolkata)
 * @param {string|number|Date|null} dateInput
 * @returns {Date}
 */
export function toISTDate(dateInput) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput || Date.now());
  const utcTime = d.getTime() + (d.getTimezoneOffset() * 60000);
  return new Date(utcTime + IST_OFFSET_MS);
}

/**
 * Returns exact start of Engineers' Day (Sept 15 00:00:00 IST) in UTC for any given year
 * September is month index 8 (0-indexed). 00:00:00 IST is 18:30:00 UTC on September 14.
 * @param {number|string} year
 * @returns {Date}
 */
export function getEngineersDayStart(year) {
  const y = parseInt(year, 10);
  return new Date(Date.UTC(y, 8, 14, 18, 30, 0, 0));
}

/**
 * Returns exact end of Engineers' Day (Sept 15 23:59:59.999 IST) in UTC for any given year
 * 23:59:59.999 IST is 18:29:59.999 UTC on September 15.
 * @param {number|string} year
 * @returns {Date}
 */
export function getEngineersDayEnd(year) {
  const y = parseInt(year, 10);
  return new Date(Date.UTC(y, 8, 15, 18, 29, 59, 999));
}

/**
 * Determines whether Engineers' Day (September 15 in IST) is currently active
 * @param {string|number|Date|null} simulatedDate
 * @returns {boolean}
 */
export function isEngineersDayActive(simulatedDate = null) {
  const now = simulatedDate ? new Date(simulatedDate) : new Date();
  const istDate = toISTDate(now);
  return istDate.getMonth() === 8 && istDate.getDate() === 15;
}

/**
 * Optional registry for future annual edition creative overrides.
 * Default evergreen and recurring Sept 15 experiences run automatically if no override is registered.
 */
export const ANNUAL_EDITION_REGISTRY = {};

/**
 * Registers an optional annual edition creative override without altering the core architecture.
 * @param {number|string} year
 * @param {Object} overrideConfig
 */
export function registerAnnualEditionOverride(year, overrideConfig) {
  ANNUAL_EDITION_REGISTRY[String(year)] = overrideConfig;
}

/**
 * Resolves the active presentation state for ENGINEERVERSE
 * @param {string|number|Date|null} simulatedDate
 * @returns {Object} Canonical state payload
 */
export function getCampaignState(simulatedDate = null) {
  const now = simulatedDate ? new Date(simulatedDate) : new Date();
  const istDate = toISTDate(now);
  const currentYear = istDate.getFullYear();
  const isEngineersDay = isEngineersDayActive(now);

  const annualOverride = ANNUAL_EDITION_REGISTRY[String(currentYear)] || {};

  if (isEngineersDay) {
    // STATE A: Engineers' Day Experience (September 15 IST)
    return {
      state: PRESENTATION_STATES.ENGINEERS_DAY,
      presentationMode: PRESENTATION_STATES.ENGINEERS_DAY,
      edition: String(currentYear),
      currentYear,
      isEngineersDay: true,
      badgeText: annualOverride.engineersDayBadge || `Happy Engineers' Day ${currentYear} • Annual Celebration`,
      headline: annualOverride.engineersDayHeadline || "Don't Just Celebrate Engineers' Day. Engineer Something.",
      subheadline: annualOverride.engineersDaySubheadline || 'Today we celebrate the instinct to build, solve, and elevate humanity.',
      heroTagline: annualOverride.engineersDayTagline || 'When engineering works perfectly, it becomes invisible. Today, let us make the invisible visible.',
      ctaPrimary: 'Discover Your Engineering DNA',
      ctaSecondary: `Sign the ${currentYear} Pledge`,
      targetDate: null,
      isCountdownActive: false,
    };
  }

  // STATE B: Normal Evergreen ENGINEERVERSE Experience (All other 364/365 dates)
  return {
    state: PRESENTATION_STATES.EVERGREEN,
    presentationMode: PRESENTATION_STATES.EVERGREEN,
    edition: String(currentYear),
    currentYear,
    isEngineersDay: false,
    badgeText: annualOverride.evergreenBadge || 'ENGINEERVERSE • Evergreen Engineering Movement',
    headline: annualOverride.evergreenHeadline || 'Discover the Engineer Within You.',
    subheadline: annualOverride.evergreenSubheadline || "Engineer What's Next.",
    heroTagline: annualOverride.evergreenTagline || "Engineering isn't a degree. It's the instinct to solve what others learn to live with.",
    ctaPrimary: 'Discover Your Engineering DNA',
    ctaSecondary: 'Explore The Problem Wall',
    targetDate: null,
    isCountdownActive: false,
  };
}

export default getCampaignState;
