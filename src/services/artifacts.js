/**
 * ENGINEERVERSE — Centralized Branded Artifact & Export Service
 * Sections 4, 5, 6, 7, 8, 9:
 * - Canonical short-URL generation (/engineerverse/identity/:id, etc.)
 * - Mandatory brand watermarking (ENGINEERVERSE, SHREE LABS × PRITEE AI, rjshree.com/engineerverse)
 * - Controlled export representation (PNG/SVG high-resolution export)
 * - Content copy deterrent UX protections
 * - Explicit user privacy & consent management
 */

import { BRAND_CONFIG, validateMandatoryBranding } from '../config/branding.js';

export const ARTIFACT_TYPES = {
  IDENTITY: 'identity',
  MISSION: 'mission',
  PROBLEM: 'problem',
  PLEDGE: 'pledge',
  STORY: 'story',
};

/**
 * Generates an opaque, clean short identifier.
 * Avoids exposing database IDs, sequential counters, or PII.
 * Example: "id_9x2k4p"
 */
export function generateShortPublicId(prefix = 'ev') {
  const chars = '23456789abcdefghjkmnpqrstuvwxyz'; // Base31 avoiding ambiguous chars (0, O, 1, I, l)
  let randomPart = '';
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}_${randomPart}`;
}

/**
 * Builds the canonical public share URL for an official artifact.
 * Section 4: Canonical clean link, no messy query params.
 */
export function buildCanonicalShareUrl(artifactType, publicId) {
  const prefix = BRAND_CONFIG.shareUrlPrefixes[artifactType] || '/engineerverse/item';
  return `https://${BRAND_CONFIG.domain}${prefix}/${publicId}`;
}

/**
 * Generates an official branded SVG artifact representation with mandatory watermark.
 * Preserves high-contrast typography, brand accents, and required watermarks.
 * @param {Object} options
 * @param {string} options.type
 * @param {string} options.title
 * @param {string} options.subtitle
 * @param {string} options.superpower
 * @param {number} options.score
 * @param {string} options.publicId
 * @returns {string} Branded SVG markup
 */
export function generateBrandedSvgArtifact({
  type = ARTIFACT_TYPES.IDENTITY,
  title = 'Certified Engineer',
  subtitle = 'The Architect',
  superpower = 'System Synthesis',
  score = 92,
  publicId = generateShortPublicId('id'),
}) {
  const width = 800;
  const height = 1000;
  const canonicalUrl = buildCanonicalShareUrl(type, publicId);

  const safeTitle = escapeXml(title);
  const safeSubtitle = escapeXml(subtitle);
  const safeSuperpower = escapeXml(superpower);

  // Dynamic font sizing to prevent text overflow in generated SVG certificates
  const titleFontSize = title && title.length > 20 ? Math.max(22, Math.floor(44 * (20 / title.length))) : 44;
  const subtitleFontSize = subtitle && subtitle.length > 22 ? Math.max(20, Math.floor(34 * (22 / subtitle.length))) : 34;
  const superpowerFontSize = superpower && superpower.length > 40 ? Math.max(12, Math.floor(16 * (40 / superpower.length))) : 16;

  const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#050510" />
      <stop offset="40%" stop-color="#0f0c2a" />
      <stop offset="100%" stop-color="#060613" />
    </linearGradient>
    <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#c084fc" />
      <stop offset="50%" stop-color="#a855f7" />
      <stop offset="100%" stop-color="#818cf8" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="15" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background Canvas -->
  <rect width="${width}" height="${height}" fill="url(#bgGrad)" />

  <!-- Outer Frame -->
  <rect x="24" y="24" width="${width - 48}" height="${height - 48}" rx="28" fill="none" stroke="#a855f7" stroke-opacity="0.35" stroke-width="2" />
  <rect x="32" y="32" width="${width - 64}" height="${height - 64}" rx="20" fill="none" stroke="#6366f1" stroke-opacity="0.15" stroke-width="1" />

  <!-- Corner Circuit Accents -->
  <circle cx="48" cy="48" r="4" fill="#c084fc" />
  <circle cx="${width - 48}" cy="48" r="4" fill="#c084fc" />
  <circle cx="48" cy="${height - 48}" r="4" fill="#c084fc" />
  <circle cx="${width - 48}" cy="${height - 48}" r="4" fill="#c084fc" />

  <!-- Brand Header Strip -->
  <text x="56" y="86" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="800" letter-spacing="4" fill="#c084fc">ENGINEERVERSE</text>
  <text x="56" y="108" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" letter-spacing="1.5" fill="#94a3b8">SHREE LABS × PRITEE AI</text>
  <text x="${width - 56}" y="95" text-anchor="end" font-family="monospace" font-size="12" font-weight="700" fill="#a855f7">ID: ${publicId}</text>

  <line x1="56" y1="128" x2="${width - 56}" y2="128" stroke="#3b0764" stroke-width="1.5" stroke-opacity="0.8" />

  <!-- Card Body -->
  <text x="56" y="210" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" letter-spacing="3" fill="#a855f7">CERTIFIED ENGINEERING IDENTITY</text>
  <text x="56" y="270" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="${titleFontSize}" font-weight="900" fill="#ffffff">${safeTitle}</text>

  <!-- Archetype Box -->
  <rect x="56" y="320" width="${width - 112}" height="240" rx="20" fill="#130e38" fill-opacity="0.6" stroke="#a855f7" stroke-opacity="0.3" stroke-width="1.5" />
  <text x="88" y="365" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" letter-spacing="1.5" fill="#c084fc">PRIMARY ENGINEERING ARCHETYPE</text>
  <text x="88" y="420" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="${subtitleFontSize}" font-weight="800" fill="url(#purpleGrad)">${safeSubtitle}</text>
  <text x="88" y="465" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="${superpowerFontSize}" fill="#cbd5e1">Core Superpower: <tspan font-weight="700" fill="#ffffff">${safeSuperpower}</tspan></text>
  <text x="88" y="510" font-family="monospace" font-size="15" fill="#a855f7">Overall DNA Score: <tspan font-weight="700" fill="#ffffff">${score} / 100</tspan></text>

  <!-- Manifesto Quote -->
  <text x="56" y="640" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-style="italic" fill="#94a3b8">"Engineering isn't a degree. It's the instinct to solve what others learn to live with."</text>
  <text x="56" y="680" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="600" fill="#64748b">— ENGINEERVERSE PHILOSOPHY</text>

  <!-- MANDATORY OFFICIAL WATERMARK (Section 6) -->
  <line x1="56" y1="880" x2="${width - 56}" y2="880" stroke="#3b0764" stroke-width="1.5" stroke-opacity="0.8" />
  <text x="${width / 2}" y="915" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="800" letter-spacing="2" fill="#c084fc">ENGINEERVERSE • SHREE LABS × PRITEE AI</text>
  <text x="${width / 2}" y="938" text-anchor="middle" font-family="monospace" font-size="12" fill="#818cf8">${canonicalUrl.replace('https://', '')}</text>
  <text x="${width / 2}" y="958" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" letter-spacing="1" fill="#64748b">OFFICIAL CANONICAL VERIFIED ARTIFACT</text>
</svg>
`.trim();

  // Validate that the mandatory branding is present
  if (!validateMandatoryBranding(svgContent)) {
    throw new Error('Mandatory watermark elements missing from generated artifact.');
  }

  return svgContent;
}

/**
 * Triggers a download of the branded artifact as an SVG image.
 */
export function downloadArtifactAsSvg(filename, svgString) {
  if (!validateMandatoryBranding(svgString)) {
    console.error('Download rejected: Missing mandatory ENGINEERVERSE branding.');
    return false;
  }
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}

/**
 * Triggers a download of the branded artifact as a high-resolution PNG image rendered on Canvas.
 */
export function downloadArtifactAsPng(filename, svgString, scale = 2) {
  return new Promise((resolve, reject) => {
    if (!validateMandatoryBranding(svgString)) {
      reject(new Error('Download rejected: Missing mandatory ENGINEERVERSE branding.'));
      return;
    }

    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (!blob) {
          reject(new Error('Canvas blob generation failed'));
          return;
        }
        const pngUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = `${filename}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(pngUrl);
        resolve(true);
      }, 'image/png');
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };

    img.src = url;
  });
}

/**
 * Helper to escape XML strings.
 */
function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
