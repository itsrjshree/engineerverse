/**
 * ENGINEERVERSE — Cloudinary Media Pipeline Boundary
 * Client-side media URL builder and signed upload coordinator.
 * Privileged Cloudinary API secret is strictly isolated on the server.
 */

export const MEDIA_TYPES = {
  IDENTITY_CARD: 'identity_card',
  PLEDGE_CERTIFICATE: 'pledge_certificate',
  MANIFESTO_POSTER: 'manifesto_poster',
  PROBLEM_ATTACHMENT: 'problem_attachment',
};

/**
 * Construct an optimized Cloudinary delivery URL with responsive transforms
 */
export function buildOptimizedImageUrl(publicId, { width = 800, format = 'auto', quality = 'auto' } = {}) {
  const clientEnv =
    typeof import.meta !== 'undefined' && import.meta?.env
      ? import.meta.env
      : typeof process !== 'undefined' && process?.env
        ? process.env
        : {};
  const cloudName = clientEnv.VITE_CLOUDINARY_CLOUD_NAME;
  if (!cloudName || !publicId) {
    // Return local fallback placeholder
    return `/assets/placeholder-${width}.png`;
  }

  const transforms = `w_${width},f_${format},q_${quality},c_limit`;
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transforms}/${publicId}`;
}

/**
 * Coordinate a secure signed client upload via the backend signature endpoint
 */
export async function uploadMediaWithSignature(file, mediaType = MEDIA_TYPES.PROBLEM_ATTACHMENT) {
  try {
    // 1. Request signature from backend
    const signRes = await fetch('/api/media/signature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mediaType, filename: file.name }),
    });

    if (!signRes.ok) {
      throw new Error('Failed to acquire secure upload signature from server.');
    }

    const { signature, timestamp, apiKey, cloudName, folder } = await signRes.json();

    // 2. Upload directly from browser to Cloudinary
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);
    formData.append('folder', folder);

    const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!uploadRes.ok) {
      throw new Error('Cloudinary direct upload rejected.');
    }

    return await uploadRes.json();
  } catch (err) {
    console.warn('[Cloudinary Client] Upload fallback:', err.message);
    return {
      success: false,
      error: err.message,
      fallbackUrl: URL.createObjectURL(file),
    };
  }
}

export default {
  MEDIA_TYPES,
  buildOptimizedImageUrl,
  uploadMediaWithSignature,
};
