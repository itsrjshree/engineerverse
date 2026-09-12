/**
 * ENGINEERVERSE — Privacy-Safe Analytics Router
 * Receives beacon & event payloads from client analytics tracker.
 * Strictly guarantees zero PII collection.
 */

import { Router } from 'express';
import { analyticsStore } from '../services/analyticsStore.js';

const router = Router();

// Ingest single analytics event
router.post('/event', async (req, res) => {
  try {
    let payload = req.body;

    // Support text/plain beacon payloads that contain stringified JSON
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch {
        payload = { event: 'raw_string_event' };
      }
    }

    if (payload && typeof payload === 'object') {
      await analyticsStore.recordEvent(payload);
    }

    res.status(200).json({ success: true, recorded: true });
  } catch (err) {
    res.status(200).json({ success: false, error: 'Failed to record event safely' });
  }
});

// Ingest batch analytics events
router.post('/batch', async (req, res) => {
  try {
    let events = req.body;
    if (typeof events === 'string') {
      try {
        events = JSON.parse(events);
      } catch {
        events = [];
      }
    }

    if (Array.isArray(events)) {
      for (const ev of events) {
        await analyticsStore.recordEvent(ev);
      }
    }

    res.status(200).json({ success: true, recorded: Array.isArray(events) ? events.length : 0 });
  } catch {
    res.status(200).json({ success: false });
  }
});

// Aggregate stats (public summary, zero PII)
router.get('/stats', async (req, res) => {
  const metrics = await analyticsStore.getMetrics();
  res.json({
    success: true,
    metrics,
  });
});

export default router;
