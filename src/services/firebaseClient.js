/**
 * ENGINEERVERSE — Firebase Client Integration Boundary
 * Handles Firebase Authentication, Google Sign-In, token retrieval, and guest state.
 * Gracefully operates in sandbox/preview mode if credentials are not yet provisioned.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged as fbOnAuthStateChanged,
} from 'firebase/auth';

export const AUTHORIZED_ADMIN_EMAIL = 'rajshreeakm@gmail.com';

const clientEnv =
  typeof import.meta !== 'undefined' && import.meta?.env
    ? import.meta.env
    : typeof process !== 'undefined' && process?.env
      ? process.env
      : {};

export function normalizeFirebaseApiKey(key) {
  if (!key || typeof key !== 'string') return '';
  let trimmed = key.trim().replace(/^["']|["']$/g, '');
  // If user copied API key missing the leading 'A' (e.g. 'IzaSy...')
  if (trimmed.startsWith('IzaSy') && trimmed.length === 38) {
    trimmed = 'A' + trimmed;
  }
  return trimmed;
}

const rawApiKey = normalizeFirebaseApiKey(clientEnv.VITE_FIREBASE_API_KEY || '');
const rawProjectId = (clientEnv.VITE_FIREBASE_PROJECT_ID || '').trim();

/**
 * Validates Google Cloud / Firebase Web API Key structure.
 */
export function isValidFirebaseApiKey(key) {
  const norm = normalizeFirebaseApiKey(key);
  if (!norm) return false;
  return norm.length >= 20 && !norm.includes('placeholder') && !norm.includes('your_');
}

// Configuration loaded from client environment variables (non-sensitive)
const initialFirebaseConfig = {
  apiKey: rawApiKey,
  authDomain: clientEnv.VITE_FIREBASE_AUTH_DOMAIN || (rawProjectId ? `${rawProjectId}.firebaseapp.com` : ''),
  projectId: rawProjectId,
  storageBucket: clientEnv.VITE_FIREBASE_STORAGE_BUCKET || (rawProjectId ? `${rawProjectId}.firebasestorage.app` : ''),
  messagingSenderId: clientEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: clientEnv.VITE_FIREBASE_APP_ID || '',
};

export let isFirebaseConfigured = Boolean(
  isValidFirebaseApiKey(rawApiKey) &&
  rawProjectId &&
  rawProjectId !== 'undefined' &&
  !rawProjectId.includes('placeholder')
);

let firebaseApp = null;
let firebaseAuth = null;
let googleProvider = null;

function setupFirebaseInstance(configToUse) {
  try {
    if (getApps().length > 0) {
      firebaseApp = getApp();
    } else {
      firebaseApp = initializeApp(configToUse);
    }
    firebaseAuth = getAuth(firebaseApp);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    isFirebaseConfigured = true;
    authService.isConfigured = true;
    return true;
  } catch (err) {
    console.warn('[FirebaseClient] Error initializing Firebase app:', err.message);
    return false;
  }
}

if (isFirebaseConfigured) {
  setupFirebaseInstance(initialFirebaseConfig);
}

// Dynamic initialization attempt from server client-config endpoint (if available)
let initPromise = null;
async function ensureInitialized() {
  if (isFirebaseConfigured && firebaseAuth) return true;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const res = await fetch('/api/auth/client-config');
      if (!res.ok) return false;
      const data = await res.json();
      if (data.success && data.configured && data.config?.apiKey) {
        const normalizedKey = normalizeFirebaseApiKey(data.config.apiKey);
        if (isValidFirebaseApiKey(normalizedKey)) {
          const cfg = {
            apiKey: normalizedKey,
            authDomain: data.config.authDomain || `${data.config.projectId}.firebaseapp.com`,
            projectId: data.config.projectId,
            storageBucket: data.config.storageBucket || `${data.config.projectId}.firebasestorage.app`,
            messagingSenderId: data.config.messagingSenderId || '',
            appId: data.config.appId || '',
          };
          return setupFirebaseInstance(cfg);
        }
      }
    } catch {
      // Offline or preview fallback
    }
    return Boolean(isFirebaseConfigured && firebaseAuth);
  })();

  return initPromise;
}

/**
 * Local storage keys for guest journey preservation (zero PII)
 */
const GUEST_STORAGE_KEY = 'ev_guest_journey_v1';

export const guestStorage = {
  getJourney() {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(GUEST_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  saveJourney(data) {
    if (typeof window === 'undefined') return;
    try {
      const current = this.getJourney() || {};
      const updated = {
        ...current,
        ...data,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.warn('[GuestStorage] Could not persist journey locally:', e);
      return null;
    }
  },

  clearJourney() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(GUEST_STORAGE_KEY);
    } catch {
      // Storage clearance failure
    }
  },
};

/**
 * Authentication client boundary
 * Strictly enforces real Firebase Authentication. No local mock admin bypasses.
 */
export const authService = {
  isConfigured: isFirebaseConfigured,
  authorizedAdminEmail: AUTHORIZED_ADMIN_EMAIL,

  /**
   * Returns current Firebase ID token.
   */
  async getIdToken(forceRefresh = false) {
    if (firebaseAuth?.currentUser) {
      try {
        const tok = await firebaseAuth.currentUser.getIdToken(forceRefresh);
        if (tok) return tok;
      } catch (err) {
        console.warn('[AuthService] Error retrieving Firebase ID token:', err.message);
      }
    }
    return null;
  },

  /**
   * Returns cached token if available.
   */
  getCachedToken() {
    return null;
  },

  /**
   * Retrieves the current user profile from Firebase Auth.
   * Returns unauthenticated guest if not signed in.
   */
  async getCurrentUser() {
    await ensureInitialized();
    if (firebaseAuth?.currentUser) {
      const u = firebaseAuth.currentUser;
      const email = (u.email || '').toLowerCase();
      const isAdmin = email === AUTHORIZED_ADMIN_EMAIL.toLowerCase();
      return {
        uid: u.uid,
        email,
        displayName: u.displayName || email.split('@')[0],
        photoURL: u.photoURL,
        isAnonymous: false,
        isAdmin,
      };
    }

    const guestData = guestStorage.getJourney();
    return {
      uid: guestData?.guestId || 'guest_' + Math.random().toString(36).substring(2, 9),
      isAnonymous: true,
      displayName: guestData?.name || 'Guest Builder',
      isAdmin: false,
    };
  },

  /**
   * Executes genuine Google Sign-In with popup.
   * Never fabricates admin credentials or bypasses.
   */
  async signInWithGoogle() {
    await ensureInitialized();

    if (isFirebaseConfigured && firebaseAuth && googleProvider) {
      try {
        const result = await signInWithPopup(firebaseAuth, googleProvider);
        const user = result.user;
        const idToken = await user.getIdToken();
        const email = (user.email || '').toLowerCase();
        const isAdmin = email === AUTHORIZED_ADMIN_EMAIL.toLowerCase();

        const userProfile = {
          uid: user.uid,
          email,
          displayName: user.displayName || email.split('@')[0],
          photoURL: user.photoURL,
          isAnonymous: false,
          isAdmin,
        };

        return {
          success: true,
          user: userProfile,
          idToken,
        };
      } catch (err) {
        console.warn('[AuthService] Firebase popup error:', err.code || err.message);
        let userMessage = err.message || 'Google authentication failed.';
        if (err.code === 'auth/popup-blocked') {
          userMessage = 'The sign-in popup was blocked by your browser. Please allow popups for this site or open the app in a new tab.';
        } else if (err.code === 'auth/popup-closed-by-user') {
          userMessage = 'Sign-in window was closed before completion. Please try again.';
        } else if (err.code === 'auth/unauthorized-domain') {
          userMessage = 'This domain is not yet added to OAuth Authorized Domains in Firebase console.';
        } else if (err.code === 'auth/cancelled-popup-request') {
          userMessage = 'Another sign-in request was in progress.';
        } else if (err.code === 'auth/configuration-not-found' || err.message?.includes('CONFIGURATION_NOT_FOUND')) {
          userMessage = 'Firebase Authentication is not yet activated in your Firebase Console. Go to Firebase Console > Build > Authentication and click "Get started", then enable Google Sign-In Provider.';
        } else if (err.code === 'auth/network-request-failed') {
          userMessage = 'Authentication configuration not found (CONFIGURATION_NOT_FOUND). Please ensure Firebase Authentication is enabled in your Firebase Console (Build > Authentication > "Get started") with Google Sign-In activated.';
        }

        return {
          success: false,
          error: userMessage,
          code: err.code,
        };
      }
    }

    return {
      success: false,
      error: 'Google Identity Service is initializing. Ensure client configuration (VITE_FIREBASE_API_KEY & VITE_FIREBASE_PROJECT_ID) is active in the environment.',
      code: 'auth/not-configured',
    };
  },

  /**
   * Signs out the current user.
   */
  async signOut() {
    if (firebaseAuth) {
      try {
        await fbSignOut(firebaseAuth);
      } catch (err) {
        console.warn('[AuthService] Firebase signOut error:', err);
      }
    }

    return { success: true };
  },

  /**
   * Subscribes to authentication state changes.
   */
  onAuthStateChanged(callback) {
    if (isFirebaseConfigured && firebaseAuth) {
      return fbOnAuthStateChanged(firebaseAuth, async (user) => {
        if (user) {
          const idToken = await user.getIdToken().catch(() => null);
          const email = (user.email || '').toLowerCase();
          const isAdmin = email === AUTHORIZED_ADMIN_EMAIL.toLowerCase();
          const profile = {
            uid: user.uid,
            email,
            displayName: user.displayName || email.split('@')[0],
            photoURL: user.photoURL,
            isAnonymous: false,
            isAdmin,
            idToken,
          };
          callback(profile);
        } else {
          callback(null);
        }
      });
    }

    // Unconfigured environment: immediately notify null (unauthenticated)
    callback(null);
    return () => {};
  },

  /**
   * Verifies the admin session against the server-side /api/admin/verify-session endpoint.
   * Requires a real cryptographically signed Firebase ID token.
   */
  async verifyAdminSession(token) {
    const activeToken = token || (await this.getIdToken());

    if (!activeToken) {
      return {
        authorized: false,
        status: 401,
        error: 'Authentication required. Please sign in to continue.',
      };
    }

    try {
      const res = await fetch('/api/admin/verify-session', {
        headers: {
          Authorization: `Bearer ${activeToken}`,
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.authorized) {
        return {
          authorized: false,
          status: res.status,
          error:
            data.error ||
            (res.status === 403
              ? 'Unauthorized access. Administrative privileges are required.'
              : 'Invalid or expired authentication session.'),
        };
      }

      return {
        authorized: true,
        status: 200,
        uid: data.uid,
        role: data.role,
        adminEmail: data.adminEmail,
      };
    } catch (err) {
      return {
        authorized: false,
        status: 500,
        error: err.message || 'Failed to reach admin verification endpoint.',
      };
    }
  },
};

export default {
  isFirebaseConfigured,
  guestStorage,
  authService,
  AUTHORIZED_ADMIN_EMAIL,
};
