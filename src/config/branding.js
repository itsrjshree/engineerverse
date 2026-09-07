/**
 * ENGINEERVERSE — Centralized Brand System & Identity Constants
 * Section 9: Brand Consistency & Mandatory Artifact Watermarking
 * Single source of truth for all brand lockups, URLs, typography, and watermark standards.
 * Eliminates duplicated hardcoded brand strings throughout the codebase.
 */

export const BRAND_CONFIG = {
  platformName: 'ENGINEERVERSE',
  tagline: "Engineering isn't a degree. It's the instinct to solve what others learn to live with.",
  coreMotto: 'India Still Has Problems. Engineers Still Have Work.',
  creators: 'SHREE LABS × PRITEE AI',
  company: 'Shree Labs',
  aiPartner: 'Pritee AI',
  domain: 'rjshree.com',
  canonicalBaseUrl: 'https://rjshree.com/engineerverse',
  parentSiteUrl: 'https://rjshree.com',

  // Mandatory Watermark Specification (Section 6)
  watermark: {
    text: 'ENGINEERVERSE • SHREE LABS × PRITEE AI • rjshree.com/engineerverse',
    compactText: 'ENGINEERVERSE | SHREE LABS',
    canonicalUrl: 'https://rjshree.com/engineerverse',
    subtext: 'VERIFIED ENGINEERING ARTIFACT • OFFICIAL CANONICAL LINK',
    requiredElements: ['ENGINEERVERSE', 'SHREE LABS × PRITEE AI', 'rjshree.com/engineerverse'],
  },

  // Color & Visual Identity Tokens
  visualIdentity: {
    bgDark: '#050510',
    cardDarkBg: '#09091d',
    cardBorder: 'rgba(168, 85, 247, 0.4)',
    glowColor: 'rgba(168, 85, 247, 0.25)',
    accentPurple: '#a855f7',
    accentIndigo: '#6366f1',
    textWhite: '#ffffff',
    textMuted: '#94a3b8',
  },

  // Canonical Short-URL Prefixes for Shareable Artifacts (Section 4)
  shareUrlPrefixes: {
    identity: '/engineerverse/identity',
    mission: '/engineerverse/mission',
    problem: '/engineerverse/problem',
    pledge: '/engineerverse/pledge',
    story: '/engineerverse/story',
  },

  // Export Dimensions for Artifacts (Section 5 & 9)
  artifactDimensions: {
    card: {
      width: 1200,
      height: 630,
      aspectRatio: '1.91:1', // Standard OpenGraph landscape card
    },
    portraitBadge: {
      width: 800,
      height: 1000,
      aspectRatio: '4:5',
    },
    pdf: {
      format: 'a4',
      orientation: 'portrait',
    },
  },
};

/**
 * Validates that an artifact string or structure contains the mandatory branding elements.
 * @param {string} content
 * @returns {boolean}
 */
export function validateMandatoryBranding(content) {
  if (!content || typeof content !== 'string') return false;
  return BRAND_CONFIG.watermark.requiredElements.every((elem) => content.includes(elem));
}

export default BRAND_CONFIG;
