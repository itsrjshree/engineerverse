/**
 * ENGINEERVERSE — Pritee AI Multi-Provider Gateway Router
 * Rate-limited server-side orchestration proxy.
 * Routes requests to provider-agnostic PriteeAIOrchestrator.
 */

import { Router } from 'express';
import { aiOrchestratorRateLimiter } from '../ai/rateLimiter/AIRateLimiter.js';
import { globalPriteeOrchestrator } from '../ai/orchestrator/PriteeAIOrchestrator.js';
import { globalProviderRegistry } from '../ai/registry/ProviderRegistry.js';
import { requireAdmin, verifyToken } from '../middleware/auth.js';

const router = Router();

/**
 * Main Mentor Chat Endpoint
 */
router.post('/chat', aiOrchestratorRateLimiter, async (req, res) => {
  try {
    const { question, mode = 'engineer', context = {}, format = 'text', schema = null } = req.body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Question is required and must be a non-empty string.',
      });
    }

    const result = await globalPriteeOrchestrator.askPritee({
      question: question.trim(),
      mode,
      context,
      format,
      schema,
    });

    res.json(result);
  } catch (err) {
    console.error('[Pritee Gateway Error]:', err);
    res.status(500).json({
      success: false,
      error: 'An error occurred while communicating with the AI intelligence pool.',
      text: 'मैं अभी इस जवाब को तैयार नहीं कर पा रही हूँ। थोड़ी देर बाद फिर कोशिश करें।',
    });
  }
});

/**
 * Models Inventory (Public / Safe Sanitized)
 */
router.get('/models', (req, res) => {
  try {
    const models = globalProviderRegistry.getAllAvailableModels().map((m) => ({
      provider: m.provider,
      id: m.id,
      name: m.name,
      isFree: m.isFree,
      capabilities: m.capabilities,
      providerConfigured: m.providerConfigured,
    }));

    res.json({
      success: true,
      models,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Trigger Dynamic Discovery / Catalog Refresh (Admin / Internal)
 */
router.post('/models/discover', verifyToken, requireAdmin, async (req, res) => {
  try {
    const results = await globalProviderRegistry.discoverAllModels();
    res.json({
      success: true,
      discoveryResults: results,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Internal Admin Diagnostics Endpoint (Admin / Internal Only)
 */
router.get('/diagnostics', verifyToken, requireAdmin, (req, res) => {
  try {
    const diagnostics = globalPriteeOrchestrator.getDiagnostics();
    res.json({
      success: true,
      diagnostics,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
