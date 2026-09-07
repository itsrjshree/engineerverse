/**
 * Vercel Serverless Function entry point for ENGINEERVERSE API
 */
import { createServer } from '../server/index.js';

let appInstance = null;

export default function handler(req, res) {
  if (!appInstance) {
    appInstance = createServer();
  }

  // Ensure Express router matching /api/* receives full /api path
  if (req.url && !req.url.startsWith('/api')) {
    req.url = `/api${req.url === '/' ? '' : req.url}`;
  }

  return appInstance(req, res);
}
