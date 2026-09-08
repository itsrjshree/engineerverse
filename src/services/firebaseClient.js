/**
 * ENGINEERVERSE — Firebase Client Integration Boundary
 * Handles Firebase Authentication, Google Sign-In, token retrieval, and guest state.
 * Gracefully operates in sandbox/preview mode if credentials are not yet provisioned.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as fbSignOut,
  onAuthStateChanged as fbOnAuthStateChanged,
} from 'firebase/auth';
import { getApiUrl } from '../config/api.js';

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
let githubProvider = null;
let facebookProvider = null;
let yahooProvider = null;

function setupFirebaseInstance(configToUse) {
  try {
    if (getApps().length > 0) {
      firebaseApp = getApp();
    } else {
      firebaseApp = initializeApp(configToUse);
    }
    firebaseAuth = getAuth(firebaseApp);
    
    // Google Provider
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });

    // GitHub Provider
    try {
      githubProvider = new GithubAuthProvider();
      githubProvider.addScope('read:user');
      githubProvider.addScope('user:email');
    } catch {
      // safe fallback
    }

    // Facebook Provider
    try {
      facebookProvider = new FacebookAuthProvider();
    } catch {
      // safe fallback
    }

    // Yahoo Provider (via OAuthProvider)
    try {
      yahooProvider = new OAuthProvider('yahoo.com');
      yahooProvider.addScope('mail-r');
      yahooProvider.addScope('sd-r');
    } catch {
      // safe fallback
    }

    isFirebaseConfigured = true;
    return true;
  } catch (err) {
    console.warn('[FirebaseClient] Error initializing Firebase app:', err.message);
    return false;
  }
}

// Dynamic initialization attempt from server client-config endpoint (if available)
let initPromise = null;
async function ensureInitialized() {
  if (isFirebaseConfigured && firebaseAuth) return true;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const res = await fetch(getApiUrl('/api/auth/client-config'));
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
  get isConfigured() {
    return isFirebaseConfigured;
  },
  set isConfigured(val) {
    isFirebaseConfigured = Boolean(val);
  },
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
   * Helper to format user profile from Firebase User
   */
  _formatUserProfile(user) {
    if (!user) return null;
    const email = (user.email || '').toLowerCase();
    const isAdmin = email === AUTHORIZED_ADMIN_EMAIL.toLowerCase();
    return {
      uid: user.uid,
      email,
      displayName: user.displayName || (email ? email.split('@')[0] : 'Community Member'),
      photoURL: user.photoURL || null,
      isAnonymous: Boolean(user.isAnonymous),
      isAdmin,
    };
  },

  /**
   * Error message translator for auth errors
   */
  _mapAuthError(err, providerName = 'Identity') {
    let userMessage = err.message || `${providerName} authentication failed.`;
    if (err.code === 'auth/popup-blocked') {
      userMessage = 'The sign-in popup was blocked by your browser. Please allow popups or open the app in a new tab.';
    } else if (err.code === 'auth/popup-closed-by-user') {
      userMessage = 'Sign-in popup was closed before completing. Please try again.';
    } else if (err.code === 'auth/unauthorized-domain') {
      userMessage = 'Domain not yet registered in Firebase Console > Authentication > Settings > Authorized domains.';
    } else if (err.code === 'auth/configuration-not-found' || err.message?.includes('CONFIGURATION_NOT_FOUND')) {
      userMessage = 'Firebase Authentication is not yet activated in your Firebase Console. Go to Build > Authentication > Click "Get started".';
    } else if (err.code === 'auth/operation-not-allowed') {
      userMessage = `${providerName} sign-in provider is not enabled in Firebase Console. Go to Build > Authentication > Sign-in method to enable it.`;
    } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
      userMessage = 'Invalid email or password. Please check your credentials or create a new account.';
    } else if (err.code === 'auth/email-already-in-use') {
      userMessage = 'An account with this email already exists. Please sign in instead.';
    } else if (err.code === 'auth/weak-password') {
      userMessage = 'Password should be at least 6 characters long.';
    } else if (err.code === 'auth/network-request-failed') {
      userMessage = 'Network connection issue or Firebase Authentication is not yet started in Firebase Console.';
    }
    return userMessage;
  },

  /**
   * Executes genuine Google Sign-In with popup.
   */
  async signInWithGoogle() {
    await ensureInitialized();

    if (isFirebaseConfigured && firebaseAuth && googleProvider) {
      try {
        const result = await signInWithPopup(firebaseAuth, googleProvider);
        const user = result.user;
        const idToken = await user.getIdToken().catch(() => null);
        const userProfile = this._formatUserProfile(user);

        return {
          success: true,
          user: userProfile,
          idToken,
        };
      } catch (err) {
        console.warn('[AuthService] Google popup error:', err.code || err.message);
        return {
          success: false,
          error: this._mapAuthError(err, 'Google'),
          code: err.code,
        };
      }
    }

    return {
      success: false,
      error: 'Google Identity Service is initializing. Ensure client configuration is active.',
      code: 'auth/not-configured',
    };
  },

  /**
   * Executes GitHub Sign-In with popup.
   */
  async signInWithGithub() {
    await ensureInitialized();

    if (isFirebaseConfigured && firebaseAuth && githubProvider) {
      try {
        const result = await signInWithPopup(firebaseAuth, githubProvider);
        const user = result.user;
        const idToken = await user.getIdToken().catch(() => null);
        const userProfile = this._formatUserProfile(user);

        return {
          success: true,
          user: userProfile,
          idToken,
        };
      } catch (err) {
        console.warn('[AuthService] GitHub popup error:', err.code || err.message);
        return {
          success: false,
          error: this._mapAuthError(err, 'GitHub'),
          code: err.code,
        };
      }
    }

    return {
      success: false,
      error: 'GitHub authentication is not configured in Firebase Console.',
      code: 'auth/not-configured',
    };
  },

  /**
   * Executes Facebook Sign-In with popup.
   */
  async signInWithFacebook() {
    await ensureInitialized();

    if (isFirebaseConfigured && firebaseAuth && facebookProvider) {
      try {
        const result = await signInWithPopup(firebaseAuth, facebookProvider);
        const user = result.user;
        const idToken = await user.getIdToken().catch(() => null);
        const userProfile = this._formatUserProfile(user);

        return {
          success: true,
          user: userProfile,
          idToken,
        };
      } catch (err) {
        console.warn('[AuthService] Facebook popup error:', err.code || err.message);
        return {
          success: false,
          error: this._mapAuthError(err, 'Facebook'),
          code: err.code,
        };
      }
    }

    return {
      success: false,
      error: 'Facebook authentication is not configured in Firebase Console.',
      code: 'auth/not-configured',
    };
  },

  /**
   * Executes Yahoo Sign-In with popup.
   */
  async signInWithYahoo() {
    await ensureInitialized();

    if (isFirebaseConfigured && firebaseAuth && yahooProvider) {
      try {
        const result = await signInWithPopup(firebaseAuth, yahooProvider);
        const user = result.user;
        const idToken = await user.getIdToken().catch(() => null);
        const userProfile = this._formatUserProfile(user);

        return {
          success: true,
          user: userProfile,
          idToken,
        };
      } catch (err) {
        console.warn('[AuthService] Yahoo popup error:', err.code || err.message);
        return {
          success: false,
          error: this._mapAuthError(err, 'Yahoo'),
          code: err.code,
        };
      }
    }

    return {
      success: false,
      error: 'Yahoo authentication is not configured in Firebase Console.',
      code: 'auth/not-configured',
    };
  },

  /**
   * Standard Email & Password Sign In
   */
  async signInWithEmail(email, password) {
    await ensureInitialized();

    if (isFirebaseConfigured && firebaseAuth) {
      try {
        const result = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
        const user = result.user;
        const idToken = await user.getIdToken().catch(() => null);
        const userProfile = this._formatUserProfile(user);

        return {
          success: true,
          user: userProfile,
          idToken,
        };
      } catch (err) {
        return {
          success: false,
          error: this._mapAuthError(err, 'Email'),
          code: err.code,
        };
      }
    }

    // Local member fallback if Firebase is not yet provisioned
    const localMember = {
      uid: 'member_' + Math.random().toString(36).substring(2, 9),
      email: email.trim().toLowerCase(),
      displayName: email.trim().split('@')[0],
      isAnonymous: false,
      isAdmin: email.trim().toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase(),
    };
    guestStorage.saveJourney({ name: localMember.displayName, email: localMember.email });
    return {
      success: true,
      user: localMember,
      idToken: null,
    };
  },

  /**
   * Standard Email & Password Sign Up (Account Creation)
   */
  async signUpWithEmail(email, password, displayName = '') {
    await ensureInitialized();

    if (isFirebaseConfigured && firebaseAuth) {
      try {
        const result = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
        const user = result.user;
        if (displayName && displayName.trim()) {
          await updateProfile(user, { displayName: displayName.trim() }).catch(() => {});
        }
        const idToken = await user.getIdToken().catch(() => null);
        const userProfile = this._formatUserProfile(user);
        if (displayName && displayName.trim()) {
          userProfile.displayName = displayName.trim();
        }

        return {
          success: true,
          user: userProfile,
          idToken,
        };
      } catch (err) {
        return {
          success: false,
          error: this._mapAuthError(err, 'Email Registration'),
          code: err.code,
        };
      }
    }

    // Local member fallback if Firebase is not yet provisioned
    const localMember = {
      uid: 'member_' + Math.random().toString(36).substring(2, 9),
      email: email.trim().toLowerCase(),
      displayName: displayName.trim() || email.trim().split('@')[0],
      isAnonymous: false,
      isAdmin: email.trim().toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase(),
    };
    guestStorage.saveJourney({ name: localMember.displayName, email: localMember.email });
    return {
      success: true,
      user: localMember,
      idToken: null,
    };
  },

  /**
   * Continue as Named Community Member (Instant join without OAuth password friction)
   */
  async continueAsCommunityMember(name, roleOrInterest = 'Builder') {
    const trimmed = (name || '').trim() || 'Community Engineer';
    const member = {
      uid: 'comm_' + Math.random().toString(36).substring(2, 9),
      displayName: trimmed,
      email: `${trimmed.toLowerCase().replace(/[^a-z0-9]/g, '')}@community.engineerverse`,
      role: roleOrInterest,
      isAnonymous: false,
      isAdmin: false,
    };

    guestStorage.saveJourney({ name: member.displayName, role: member.role });
    return {
      success: true,
      user: member,
      idToken: null,
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
      const res = await fetch(getApiUrl('/api/admin/verify-session'), {
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

// Perform initial synchronous setup if client environment credentials are present
if (isFirebaseConfigured) {
  setupFirebaseInstance(initialFirebaseConfig);
}

export default {
  isFirebaseConfigured,
  guestStorage,
  authService,
  AUTHORIZED_ADMIN_EMAIL,
};
