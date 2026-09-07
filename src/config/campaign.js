/**
 * ENGINEERVERSE — Year-Independent Campaign Lifecycle Engine
 * Section 3: Invariant architecture supporting unlimited future years.
 * September 15 is a recurring annual calendar rule.
 * ZERO fixed-year business logic. All states resolve dynamically.
 *
 * Temporal States:
 * - PRE_LAUNCH: Before Sept 15 of the target annual edition
 * - LAUNCH_DAY: September 15 of the active annual edition (IST timezone)
 * - EVERGREEN: September 16 onwards — Perpetual engineering movement:
 *   "Engineers' Day {YEAR} is over. The problems aren't. ENGINEERVERSE — KEEP BUILDING."
 */

export const CAMPAIGN_STATES = {
  PRE_LAUNCH: 'pre_launch',
  LAUNCH_DAY: 'launch_day',
  EVERGREEN: 'evergreen',
};

// IST Offset in milliseconds (UTC+5:30)
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/**
 * Convert a Date or ISO string to an IST-normalized Date representation
 */
export function toISTDate(dateInput) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput || Date.now());
  const utcTime = d.getTime() + (d.getTimezoneOffset() * 60000);
  return new Date(utcTime + IST_OFFSET_MS);
}

/**
 * Get the exact launch timestamp for September 15 of any given year (in IST)
 */
export function getLaunchDateForYear(year) {
  const y = parseInt(year, 10);
  // September is month index 8 (0-indexed). 00:00:00 IST is 18:30:00 UTC previous day.
  return new Date(Date.UTC(y, 8, 14, 18, 30, 0, 0));
}

/**
 * Get the exact transition timestamp for September 16 of any given year (in IST)
 */
export function getPostLaunchDateForYear(year) {
  const y = parseInt(year, 10);
  return new Date(Date.UTC(y, 8, 15, 18, 30, 0, 0));
}

/**
 * Calculate the campaign state for any given timestamp
 * @param {string|Date|null} simulatedDate Optional simulation date for testing
 */
export function getCampaignState(simulatedDate = null) {
  const now = simulatedDate ? new Date(simulatedDate) : new Date();

  // Extract current year, month, and day in IST
  const istDate = toISTDate(now);
  const currentYear = istDate.getFullYear();
  const currentMonth = istDate.getMonth(); // 8 = September (0-indexed)
  const currentDay = istDate.getDate();

  const launchStart = getLaunchDateForYear(currentYear);
  const postLaunchStart = getPostLaunchDateForYear(currentYear);

  // Determine active edition and state purely based on date relative to Sept 15 of currentYear
  if (currentMonth === 8 && currentDay === 15) {
    // September 15 in IST: LIVE LAUNCH DAY
    const edition = String(currentYear);
    return {
      state: CAMPAIGN_STATES.LAUNCH_DAY,
      edition,
      currentYear,
      isEngineersDay: true,
      badgeText: `Happy Engineers' Day ${edition} • Live Celebration`,
      headline: "Don't Just Celebrate Engineers' Day. Engineer Something.",
      subheadline: 'Today we celebrate the instinct to build, fix, and elevate humanity.',
      heroTagline: 'When engineering works perfectly, it becomes invisible. Today, let\'s make the invisible visible.',
      ctaPrimary: 'Discover Your Engineering DNA',
      ctaSecondary: `Sign the ${edition} Pledge`,
      evergreenNotice: null,
      isCountdownActive: false,
      targetDate: null,
      nextEngineersDay: getLaunchDateForYear(currentYear + 1),
    };
  }

  if (now >= postLaunchStart) {
    // September 16 onwards (Post Engineers' Day -> EVERGREEN)
    const edition = String(currentYear);
    const nextLaunchDate = getLaunchDateForYear(currentYear + 1);

    return {
      state: CAMPAIGN_STATES.EVERGREEN,
      edition,
      currentYear,
      isEngineersDay: false,
      badgeText: `Engineers' Day ${edition} is over. The problems aren't.`,
      headline: 'ENGINEERVERSE — KEEP BUILDING.',
      subheadline: 'India still has problems. Engineers still have work.',
      heroTagline: 'Engineering isn\'t a one-day celebration. It\'s a perpetual commitment to debug the world.',
      ctaPrimary: 'Discover Your Engineering DNA',
      ctaSecondary: 'Enter The Problem Wall',
      evergreenNotice: {
        lead: `Engineers' Day ${edition} is over. The problems aren't.`,
        callout: 'ENGINEERVERSE — KEEP BUILDING.',
        detail: 'The annual celebration has concluded, but the challenges remain. The Problem Wall is open, new missions are awaiting architects, and the community is actively building.',
      },
      isCountdownActive: false,
      targetDate: null,
      nextEngineersDay: nextLaunchDate,
    };
  }

  // Prior to September 15: PRE_LAUNCH mode
  const edition = String(currentYear);
  return {
    state: CAMPAIGN_STATES.PRE_LAUNCH,
    edition,
    currentYear,
    isEngineersDay: false,
    badgeText: `Engineers' Day ${edition} • Countdown to Launch`,
    headline: 'Discover the Engineer Within You.',
    subheadline: "Engineer What's Next.",
    heroTagline: "Engineering isn't a degree. It's the instinct to solve what others learn to live with.",
    ctaPrimary: 'Discover Your Engineering DNA',
    ctaSecondary: 'Explore Unsolved Problems',
    evergreenNotice: null,
    isCountdownActive: true,
    targetDate: launchStart,
    nextEngineersDay: launchStart,
  };
}

export default getCampaignState;
