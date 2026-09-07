/**
 * ENGINEERVERSE — AI Request Classifier
 * Analyzes request intent, maps required capabilities, format, and priority.
 */

import { TASK_TYPES, CAPABILITY_TYPES } from '../types.js';

export function classifyRequest({
  task = TASK_TYPES.GENERAL_ENGINEERING_QA,
  mode = 'engineer',
  question = '',
  structured = false,
  format = 'text',
  priority = 'normal',
  requiredCapabilities = [],
}) {
  const capabilities = new Set(requiredCapabilities);

  // Default capabilities
  capabilities.add(CAPABILITY_TYPES.GENERAL_CHAT);

  let determinedTask = task;
  let determinedFormat = format;
  let isStructured = structured;

  // Infer from mode if mode is provided
  if (mode === 'student') {
    determinedTask = TASK_TYPES.STUDENT_MENTORING;
    capabilities.add(CAPABILITY_TYPES.EDUCATIONAL_EXPLANATION);
    capabilities.add(CAPABILITY_TYPES.REASONING);
  } else if (mode === 'curious') {
    determinedTask = TASK_TYPES.CURIOUS_ANALOGIES;
    capabilities.add(CAPABILITY_TYPES.EDUCATIONAL_EXPLANATION);
    capabilities.add(CAPABILITY_TYPES.FAST_RESPONSE);
  } else if (mode === 'engineer') {
    determinedTask = TASK_TYPES.SYSTEMS_ARCHITECTURE;
    capabilities.add(CAPABILITY_TYPES.REASONING);
  } else if (mode === 'career') {
    determinedTask = TASK_TYPES.CAREER_MENTORING;
    capabilities.add(CAPABILITY_TYPES.REASONING);
  }

  // Format & Structured Output detection
  if (isStructured || determinedFormat === 'json') {
    capabilities.add(CAPABILITY_TYPES.STRUCTURED_JSON);
    determinedFormat = 'json';
    isStructured = true;
  }

  // Task-specific capabilities
  if (determinedTask === TASK_TYPES.FUTURE_ENGINEER_MISSION || determinedTask === TASK_TYPES.PROBLEM_FRAMING) {
    capabilities.add(CAPABILITY_TYPES.REASONING);
  }

  if (determinedTask === TASK_TYPES.DNA_INTERPRETATION) {
    capabilities.add(CAPABILITY_TYPES.CREATIVE_WRITING);
    capabilities.add(CAPABILITY_TYPES.REASONING);
  }

  // Ensure free tier preference
  capabilities.add(CAPABILITY_TYPES.LOW_COST_FREE);

  return {
    task: determinedTask,
    mode,
    question,
    capabilities: Array.from(capabilities),
    format: determinedFormat,
    structured: isStructured,
    priority,
    estimatedTokens: question.length > 500 ? 1200 : 800,
  };
}

export default classifyRequest;
