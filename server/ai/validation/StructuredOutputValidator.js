/**
 * ENGINEERVERSE — Structured Output Validator
 * Resilient JSON parsing, markdown fence stripping, and schema validation.
 * Recovers valid JSON even when models wrap output in conversational filler.
 */

export class StructuredOutputValidator {
  /**
   * Attempts to parse and recover JSON from model output.
   * @param {string} rawText
   * @param {object} [schema] - Optional schema with required keys
   * @returns {{ valid: boolean, data: any, error: string|null }}
   */
  static validate(rawText, schema = null) {
    if (!rawText || typeof rawText !== 'string') {
      return { valid: false, data: null, error: 'Empty or non-string response text' };
    }

    const trimmed = rawText.trim();

    // 1. Direct JSON parse
    try {
      const parsed = JSON.parse(trimmed);
      return this._validateSchema(parsed, schema);
    } catch (_) {
      // Proceed to recovery
    }

    // 2. Extract from markdown code fences: ```json ... ``` or ``` ... ```
    const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenceMatch && fenceMatch[1]) {
      try {
        const parsed = JSON.parse(fenceMatch[1].trim());
        return this._validateSchema(parsed, schema);
      } catch (_) {}
    }

    // 3. Locate first { and last }, or first [ and last ]
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        const candidate = trimmed.substring(firstBrace, lastBrace + 1);
        const parsed = JSON.parse(candidate);
        return this._validateSchema(parsed, schema);
      } catch (_) {}
    }

    const firstBracket = trimmed.indexOf('[');
    const lastBracket = trimmed.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      try {
        const candidate = trimmed.substring(firstBracket, lastBracket + 1);
        const parsed = JSON.parse(candidate);
        return this._validateSchema(parsed, schema);
      } catch (_) {}
    }

    return {
      valid: false,
      data: null,
      error: 'Failed to extract valid JSON from model response',
    };
  }

  static _validateSchema(data, schema) {
    if (!schema) {
      return { valid: true, data, error: null };
    }

    if (schema.required && Array.isArray(schema.required)) {
      for (const field of schema.required) {
        if (data[field] === undefined) {
          return {
            valid: false,
            data,
            error: `Missing required schema field: "${field}"`,
          };
        }
      }
    }

    return { valid: true, data, error: null };
  }
}

export default StructuredOutputValidator;
