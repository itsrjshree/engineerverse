/**
 * ENGINEERVERSE — Pritee AI Service Gateway
 * Bridges legacy route calls to the multi-provider PriteeAIOrchestrator.
 * Eliminates fake responses and hardcoded deprecated models.
 */

import { globalPriteeOrchestrator } from '../ai/index.js';
import { PRITEE_TASK_PROMPTS } from '../ai/personality/PriteePrompts.js';
import { TASK_TYPES } from '../ai/types.js';

/**
 * Ask Pritee Engineering Edition Server Handler
 */
export async function generatePriteeResponse({ question, mode = 'engineer', context = {} }) {
  return globalPriteeOrchestrator.askPritee({
    question,
    mode,
    context,
  });
}

/**
 * DNA AI Personality Interpretation
 */
export async function generateDnaInterpretation({ archetype, topDimensions, scores }) {
  const promptDef = PRITEE_TASK_PROMPTS.dnaInterpretation(archetype, topDimensions, scores);

  const result = await globalPriteeOrchestrator.execute({
    classified: {
      task: TASK_TYPES.DNA_INTERPRETATION,
      mode: 'engineer',
      capabilities: ['reasoning', 'creative_writing', 'low_cost_free'],
      format: 'text',
      structured: false,
    },
    systemInstruction: promptDef.systemInstruction,
    prompt: promptDef.prompt,
  });

  if (result.success) {
    return {
      success: true,
      narrative: result.text,
      provider: result.provider,
      model: result.model,
    };
  }

  // Graceful deterministic profile when AI pool is unavailable
  return {
    success: false,
    isFinalFallback: true,
    narrative: `As ${archetype.title}, your instinct is governed by "${archetype.motto}". Your core strengths lie in ${archetype.superpower}, driven by high alignment in ${topDimensions.join(', ')}.`,
  };
}

export default {
  generatePriteeResponse,
  generateDnaInterpretation,
};
