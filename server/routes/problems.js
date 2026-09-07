/**
 * ENGINEERVERSE — The Problem Wall Router
 * Long-term community initiative: "India Still Has Problems. Engineers Still Have Work."
 * Note: Named "The Problem Wall" per section 12 of product architecture.
 * Unlimited dynamic capacity (from 10 to 100,000+ problems). Zero artificial 100-limit.
 */

import { Router } from 'express';
import { submissionRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// In-memory store initialized with verified seed engineering challenges
// supporterCounts start at 0 to uphold honest community data (Rule 13: Zero fake metrics)
const initialCuratedProblems = [
  {
    id: 'prob_clean_water_01',
    title: 'Low-Cost Arsenic & Fluoride Water Testing for Rural Borewells',
    category: 'Environment & Water',
    affectedUsers: 'Over 40 million citizens across Gangetic plains & arid belts',
    description: 'Groundwater in several districts exceeds safe arsenic and fluoride limits. Current chemical testing strips are either costly, fragile, or require laboratory titration. We need an open-hardware, reusable spectrophotometric or electrochemical sensor kit costing under ₹500.',
    status: 'approved',
    supporterCount: 0,
    submittedBy: 'Shree Labs Engineering Collective',
    tags: ['Water', 'IoT', 'Hardware', 'Rural'],
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'prob_cold_storage_02',
    title: 'Decentralized Solar-Powered Cold Storage for Smallholder Farmers',
    category: 'Agriculture',
    affectedUsers: 'Perishable tomato & onion cultivators losing 30% crop post-harvest',
    description: 'Grid outages in rural mandis force distress sales. Design an energy-dense phase-change material (PCM) cool-room powered by solar PV that maintains 4°C for 36 hours of continuous cloud cover without relying on diesel gensets.',
    status: 'approved',
    supporterCount: 0,
    submittedBy: 'Agritech Working Group',
    tags: ['Agriculture', 'Solar', 'Thermal', 'Frugal'],
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'prob_assistive_screen_03',
    title: 'Affordable Dynamic Refreshable Braille Display',
    category: 'Accessibility',
    affectedUsers: 'Over 10 million visually impaired students and professionals',
    description: 'Commercial 40-cell refreshable Braille displays cost over $2,000 due to piezoelectric actuator patents. Can electromagnetic micro-solenoids, shape-memory alloys, or microfluidics drop the BOM cost under $50?',
    status: 'approved',
    supporterCount: 0,
    submittedBy: 'Assistive Tech Lab',
    tags: ['Accessibility', 'Micro-mechanics', 'Embedded'],
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'prob_telecom_mesh_04',
    title: 'Disaster-Resilient Mesh Network for Mountain Flood Valleys',
    category: 'Infrastructure',
    affectedUsers: 'Himalayan and coastal communities cut off during cloudbursts',
    description: 'When cellular towers drown, rescue teams operate blind. Build an autonomous solar LoRa/packet radio mesh repeater droppable by low-cost drones that routes emergency SMS and GPS coordinates without cellular infrastructure.',
    status: 'approved',
    supporterCount: 0,
    submittedBy: 'Disaster Resilience Group',
    tags: ['Networking', 'LoRa', 'Disaster Relief', 'Embedded'],
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

let problemsStore = [...initialCuratedProblems];

// GET: List approved problems with category & search filter (unlimited scaling)
router.get('/', (req, res) => {
  const { category, search } = req.query;

  let results = problemsStore.filter((p) => p.status === 'approved');

  if (category && category !== 'All') {
    results = results.filter((p) => p.category.toLowerCase().includes(category.toLowerCase()));
  }

  if (search) {
    const q = search.toLowerCase();
    results = results.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  res.json({
    success: true,
    wallName: 'The Problem Wall',
    initiative: 'The Problem Wall',
    tagline: 'India Still Has Problems. Engineers Still Have Work.',
    total: results.length,
    problems: results,
  });
});

// POST: Submit a new problem (enters moderation queue)
router.post('/', submissionRateLimiter, (req, res) => {
  const { title, category, description, affectedUsers, submittedBy, tags } = req.body;

  if (!title || !category || !description) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: title, category, and description are mandatory.',
    });
  }

  const newProblem = {
    id: 'prob_' + Math.random().toString(36).substring(2, 10),
    title: title.trim(),
    category: category.trim(),
    affectedUsers: affectedUsers?.trim() || 'General Public',
    description: description.trim(),
    status: 'pending', // Strictly enters moderation queue
    supporterCount: 1,
    submittedBy: submittedBy?.trim() || 'Anonymous Engineer',
    tags: Array.isArray(tags) ? tags : ['Community'],
    createdAt: new Date().toISOString(),
  };

  problemsStore.unshift(newProblem);

  res.status(201).json({
    success: true,
    message: 'Problem submitted successfully! It has been placed in the moderation queue for review.',
    problem: newProblem,
  });
});

// POST: Support / Upvote a problem
router.post('/:id/support', (req, res) => {
  const problem = problemsStore.find((p) => p.id === req.params.id);
  if (!problem) {
    return res.status(404).json({ success: false, error: 'Problem not found.' });
  }

  problem.supporterCount += 1;

  res.json({
    success: true,
    problemId: problem.id,
    supporterCount: problem.supporterCount,
  });
});

export default router;
