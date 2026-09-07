/**
 * ENGINEERVERSE — Engineer Stories Wall Router
 * Prompt: "What did engineering teach you?"
 */

import { Router } from 'express';
import { submissionRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

const initialStories = [
  {
    id: 'story_01',
    author: 'Ananya S.',
    discipline: 'Embedded Systems',
    quote: 'Engineering taught me that the multimeter never lies. When code and physics disagree, physics always wins.',
    status: 'approved',
    featured: true,
    year: '2026',
  },
  {
    id: 'story_02',
    author: 'Vikram R.',
    discipline: 'Civil Engineering',
    quote: 'It taught me that a bridge doesn\'t just carry trucks; it carries the trust of a million people who will never know your name.',
    status: 'approved',
    featured: true,
    year: '2026',
  },
  {
    id: 'story_03',
    author: 'Karthik N.',
    discipline: 'Distributed Systems',
    quote: 'Failure is not an insult; it is telemetry. Once you stop taking bugs personally, you can fix anything.',
    status: 'approved',
    featured: false,
    year: '2026',
  },
];

let storiesStore = [...initialStories];

router.get('/', (req, res) => {
  const approved = storiesStore.filter((s) => s.status === 'approved');
  res.json({
    success: true,
    stories: approved,
  });
});

router.post('/', submissionRateLimiter, (req, res) => {
  const { author, discipline, quote } = req.body;

  if (!author || !discipline || !quote) {
    return res.status(400).json({
      success: false,
      error: 'Author, discipline, and quote are required.',
    });
  }

  const newStory = {
    id: 'story_' + Math.random().toString(36).substring(2, 9),
    author: author.trim(),
    discipline: discipline.trim(),
    quote: quote.trim(),
    status: 'pending',
    featured: false,
    year: String(new Date().getFullYear()),
    createdAt: new Date().toISOString(),
  };

  storiesStore.unshift(newStory);

  res.status(201).json({
    success: true,
    message: 'Your story has been submitted for moderation review.',
    story: newStory,
  });
});

export default router;
