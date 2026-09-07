/**
 * ENGINEERVERSE — Pritee AI Engineering Edition (Client Service)
 * Client interface communicating with server-side AI multi-provider orchestration gateway.
 * Zero secrets or provider keys in frontend bundle.
 */

import { authService } from './firebaseClient.js';

export const MENTOR_MODES = {
  STUDENT: {
    id: 'student',
    title: 'Student Mode',
    description: 'Foundational concepts, structured learning roadmaps, step-by-step clarity.',
    badge: '🎓 Foundational',
  },
  CURIOUS: {
    id: 'curious',
    title: 'Curious Mode',
    description: 'ELI5 analogies, everyday comparisons (chai, traffic, plumbing), zero gatekeeping.',
    badge: '💡 Intuitive / ELI5',
  },
  ENGINEER: {
    id: 'engineer',
    title: 'Engineer Mode',
    description: 'System-level depth, distributed trade-offs, latency budgets, hardware constraints.',
    badge: '⚙️ Systems Depth',
  },
  CAREER: {
    id: 'career',
    title: 'Career & Craft',
    description: 'Practical engineering mindset, real production scars, ethical responsibilities.',
    badge: '🚀 Craft & Reality',
  },
};

export const PRITEE_SUGGESTED_QUESTIONS = [
  "Explain GPS like I'm 10.",
  'What happens if the internet disappears for 24 hours?',
  'Explain recursion using a cup of chai.',
  'How does an LLM work under the hood without magic?',
  'Can I become a real engineer without a formal engineering degree?',
  'Why do distributed systems fail at scale?',
  'What engineering problem should humanity prioritize next?',
];

export async function askPritee({ question, mode = 'engineer', context = {} }) {
  try {
    const res = await fetch('/api/pritee/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, mode, context }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Pritee service responded with status ${res.status}`);
    }

    const data = await res.json();
    return {
      success: data.success,
      mode,
      text: data.text || '',
      isFinalFallback: Boolean(data.isFinalFallback),
      provider: data.provider,
      model: data.model,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    console.warn('[Pritee Client] Service communication issue:', err.message);
    return {
      success: false,
      mode,
      text: 'मैं अभी इस जवाब को तैयार नहीं कर पा रही हूँ। थोड़ी देर बाद फिर कोशिश करें। (All upstream engineering intelligence channels are currently resting or rate-limited. Please retry shortly.)',
      isFinalFallback: true,
      error: err.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Internal Admin Diagnostics fetcher (internal admin use only)
 */
export async function fetchAiDiagnostics(overrideToken) {
  const token = overrideToken || (await authService.getIdToken()) || authService.getCachedToken();
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch('/api/pritee/diagnostics', { headers });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Failed to fetch AI diagnostics (${res.status})`);
  }
  const data = await res.json();
  return data.diagnostics;
}

export default {
  MENTOR_MODES,
  PRITEE_SUGGESTED_QUESTIONS,
  askPritee,
  fetchAiDiagnostics,
};
