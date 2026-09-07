/**
 * ENGINEERVERSE — DNA Evaluation Route
 * Enforces deterministic scoring and optionally attaches AI personality interpretation.
 */

import { Router } from 'express';
import {
  computeDeterministicScores,
  classifyArchetypes,
  computeLegendResonance,
} from '../../src/config/dnaModel.js';
import { standardRateLimiter } from '../middleware/rateLimiter.js';
import { generateDnaInterpretation } from '../services/geminiService.js';

const router = Router();

router.post('/evaluate', standardRateLimiter, async (req, res) => {
  try {
    const { answers, includeAiInterpretation = false } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input: "answers" must be an array of scenario selections.',
      });
    }

    // 1. Pure deterministic calculation
    const scores = computeDeterministicScores(answers);
    const classification = classifyArchetypes(scores);
    const legendResonances = computeLegendResonance(scores);

    // Identify top 3 dimensions
    const topDimensions = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k]) => k);

    let aiNarrative = null;
    if (includeAiInterpretation) {
      const aiResult = await generateDnaInterpretation({
        archetype: classification.primary,
        topDimensions,
        scores,
      });
      aiNarrative = aiResult.narrative;
    }

    res.json({
      success: true,
      scores,
      archetype: classification.primary,
      secondaryArchetype: classification.secondary,
      overallDnaScore: classification.overallDnaScore,
      legendResonance: legendResonances.slice(0, 3),
      aiNarrative,
      evaluatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[DNA Route Error]:', err);
    res.status(500).json({
      success: false,
      error: 'An error occurred while evaluating Engineering DNA.',
    });
  }
});

export default router;
