/**
 * ENGINEERVERSE — Cloudinary Signed Upload Service (Server-Only)
 * Generates cryptographic upload signatures for the frontend.
 * The API secret is NEVER sent to the client.
 */

import crypto from 'crypto';
import { config } from '../config.js';

export function generateUploadSignature({ folder = 'engineerverse', mediaType = 'attachment' } = {}) {
  const { apiKey, apiSecret, cloudName, isConfigured } = config.cloudinary;

  if (!isConfigured) {
    return {
      isConfigured: false,
      message: 'Cloudinary environment variables pending. In preview fallback mode.',
      apiKey: 'mock_api_key',
      cloudName: 'mock_cloud',
      signature: 'mock_signature',
      timestamp: Math.floor(Date.now() / 1000),
      folder,
    };
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;

  const signature = crypto
    .createHash('sha1')
    .update(paramsToSign + apiSecret)
    .digest('hex');

  return {
    isConfigured: true,
    signature,
    timestamp,
    apiKey,
    cloudName,
    folder,
  };
}

export default {
  generateUploadSignature,
};
