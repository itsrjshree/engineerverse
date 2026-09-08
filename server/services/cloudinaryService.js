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

/**
 * Directly uploads a base64 or URL image buffer to Cloudinary from the backend.
 * Returns { success: true, url, publicId } or null.
 */
export async function uploadImageToCloudinary(fileData, { folder = 'engineerverse/avatars', publicId = null } = {}) {
  const { apiKey, apiSecret, cloudName, isConfigured } = config.cloudinary;
  if (!isConfigured || !cloudName || !apiKey || !apiSecret) {
    return null;
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const params = {
      folder,
      timestamp,
      overwrite: 'true',
      invalidate: 'true',
    };
    if (publicId) {
      params.public_id = publicId;
    }

    // Cloudinary signature must be sorted alphabetically by key
    const sortedKeys = Object.keys(params).sort();
    const toSign = sortedKeys.map((k) => `${k}=${params[k]}`).join('&') + apiSecret;
    const signature = crypto.createHash('sha1').update(toSign).digest('hex');

    const formData = new URLSearchParams();
    formData.append('file', fileData);
    formData.append('api_key', apiKey);
    formData.append('timestamp', String(timestamp));
    formData.append('signature', signature);
    formData.append('folder', folder);
    formData.append('overwrite', 'true');
    formData.append('invalidate', 'true');
    if (publicId) {
      formData.append('public_id', publicId);
    }

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const result = await response.json();
      return {
        success: true,
        url: result.secure_url || result.url,
        publicId: result.public_id,
      };
    } else {
      const errText = await response.text();
      console.warn('[CloudinaryService] Upload response non-OK:', errText);
    }
  } catch (err) {
    console.warn('[CloudinaryService] Upload exception:', err.message);
  }

  return null;
}

/**
 * Permanently deletes an image asset from Cloudinary.
 */
export async function deleteImageFromCloudinary(publicId) {
  const { apiKey, apiSecret, cloudName, isConfigured } = config.cloudinary;
  if (!isConfigured || !publicId || !cloudName || !apiKey || !apiSecret) {
    return false;
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const toSign = `invalidate=true&public_id=${publicId}&timestamp=${timestamp}` + apiSecret;
    const signature = crypto.createHash('sha1').update(toSign).digest('hex');

    const formData = new URLSearchParams();
    formData.append('public_id', publicId);
    formData.append('api_key', apiKey);
    formData.append('timestamp', String(timestamp));
    formData.append('signature', signature);
    formData.append('invalidate', 'true');

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: 'POST',
      body: formData,
    });

    return response.ok;
  } catch (err) {
    console.warn('[CloudinaryService] Destroy exception:', err.message);
    return false;
  }
}

export default {
  generateUploadSignature,
  uploadImageToCloudinary,
  deleteImageFromCloudinary,
};
