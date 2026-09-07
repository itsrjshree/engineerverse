/**
 * ENGINEERVERSE — Pritee AI Orchestration Types & Contracts
 * Pure JavaScript (Rule 1).
 * Defines normalized tasks, capabilities, error categories, and cost policies.
 */

export const TASK_TYPES = {
  ENGINEERING_EXPLANATION: 'engineering_explanation',
  STUDENT_MENTORING: 'student_mentoring',
  CURIOUS_ANALOGIES: 'curious_analogies',
  SYSTEMS_ARCHITECTURE: 'systems_architecture',
  CAREER_MENTORING: 'career_mentoring',
  FUTURE_ENGINEER_MISSION: 'future_engineer_mission',
  PROBLEM_FRAMING: 'problem_framing',
  CHALLENGE_EVALUATION: 'challenge_evaluation',
  DNA_INTERPRETATION: 'dna_interpretation',
  STRUCTURED_JSON: 'structured_json',
  GENERAL_ENGINEERING_QA: 'general_engineering_qa',
};

export const CAPABILITY_TYPES = {
  REASONING: 'reasoning',
  GENERAL_CHAT: 'general_chat',
  EDUCATIONAL_EXPLANATION: 'educational_explanation',
  STRUCTURED_JSON: 'structured_json',
  CREATIVE_WRITING: 'creative_writing',
  LONG_CONTEXT: 'long_context',
  MULTIMODAL: 'multimodal',
  FAST_RESPONSE: 'fast_response',
  LOW_COST_FREE: 'low_cost_free',
  HIGH_QUALITY: 'high_quality',
};

export const COST_POLICY = {
  FREE_ONLY: 'free_only',
  FREE_PREFERRED: 'free_preferred',
  BALANCED: 'balanced',
  PAID_ENABLED: 'paid_enabled',
};

export const ERROR_TYPES = {
  RATE_LIMIT: 'RATE_LIMIT',
  TIMEOUT: 'TIMEOUT',
  AUTH: 'AUTH',
  QUOTA: 'QUOTA',
  NOT_FOUND: 'NOT_FOUND',
  SERVER_ERROR: 'SERVER_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  MALFORMED_OUTPUT: 'MALFORMED_OUTPUT',
  CIRCUIT_BREAKER_OPEN: 'CIRCUIT_BREAKER_OPEN',
  UNKNOWN: 'UNKNOWN',
};

export const CIRCUIT_BREAKER_STATES = {
  CLOSED: 'CLOSED', // Healthy, processing requests
  OPEN: 'OPEN', // Failing, requests blocked during cooldown
  HALF_OPEN: 'HALF_OPEN', // Testing recovery with a single probe request
};
