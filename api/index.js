/**
 * Vercel Serverless Function entry point for ENGINEERVERSE API
 */
import { createServer } from '../server/index.js';

let appInstance = null;

export default function handler(req, res) {
  if (!appInstance) {
    appInstance = createServer();
  }
  return appInstance(req, res);
}
