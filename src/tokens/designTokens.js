/**
 * ENGINEERVERSE — Centralized Design System Tokens
 * Derived from Shree Labs visual language & screenshot references:
 * Cosmic deep dark navy (#050510), neon purple/violet glow accents (#a855f7),
 * circuit node accents, responsive cards, and clean typography.
 */

export const tokens = {
  colors: {
    bg: {
      cosmic: '#050510',
      surface1: '#09091b',
      surface2: '#0f0f26',
      surface3: '#161638',
      surfaceElevated: '#1a1a40',
      overlay: 'rgba(5, 5, 16, 0.85)',
    },
    accent: {
      neonPurple: '#a855f7',
      deepPurple: '#9333ea',
      lightPurple: '#c084fc',
      ultraLightPurple: '#e9d5ff',
      indigo: '#6366f1',
      cyan: '#06b6d4',
      emerald: '#10b981',
      amber: '#f59e0b',
      rose: '#f43f5e',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#94a3b8',
      tertiary: '#64748b',
      accent: '#c084fc',
      inverse: '#050510',
    },
    border: {
      subtle: 'rgba(255, 255, 255, 0.08)',
      accent: 'rgba(168, 85, 247, 0.25)',
      accentStrong: 'rgba(168, 85, 247, 0.5)',
      active: '#a855f7',
    },
    glow: {
      purpleSubtle: 'rgba(168, 85, 247, 0.12)',
      purpleMedium: 'rgba(168, 85, 247, 0.25)',
      purpleStrong: 'rgba(168, 85, 247, 0.45)',
      indigoGlow: 'rgba(99, 102, 241, 0.2)',
    }
  },

  typography: {
    fontFamily: {
      display: '"Space Grotesk", "Plus Jakarta Sans", system-ui, sans-serif',
      body: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
      mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    },
    scale: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',   // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
      '5xl': '3rem',     // 48px
      '6xl': '3.75rem',  // 60px
    },
    lineHeight: {
      tight: 1.15,
      normal: 1.5,
      relaxed: 1.65,
    }
  },

  radii: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    full: '9999px',
  },

  spacing: {
    containerPad: 'clamp(1rem, 4vw, 2.5rem)',
    sectionGap: 'clamp(2.5rem, 6vw, 6rem)',
  },

  breakpoints: {
    xs: '360px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  shadows: {
    card: '0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 0 15px -3px rgba(168, 85, 247, 0.08)',
    cardHover: '0 8px 30px -4px rgba(0, 0, 0, 0.6), 0 0 25px -1px rgba(168, 85, 247, 0.22)',
    buttonGlow: '0 0 20px -2px rgba(168, 85, 247, 0.4)',
  },

  transitions: {
    fast: '150ms ease',
    normal: '250ms ease',
    smooth: '400ms cubic-bezier(0.16, 1, 0.3, 1)',
  }
};

export default tokens;
