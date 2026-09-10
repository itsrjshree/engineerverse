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
  deleteUser as fbDeleteUser,
  onAuthStateChanged as fbOnAuthStateChanged,
} from 'firebase/auth';
import { getApiUrl, resolveAvatarUrl } from '../config/api.js';

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
const authStateSubscribers = new Set();

function dispatchAuthState(user) {
  for (const fn of authStateSubscribers) {
    try {
      fn(user);
    } catch (e) {
      console.warn('[AuthService] Error in auth state subscriber:', e);
    }
  }
}

export const authService = {
  get isConfigured() {
    return isFirebaseConfigured;
  },
  set isConfigured(val) {
    isFirebaseConfigured = Boolean(val);
  },
  authorizedAdminEmail: AUTHORIZED_ADMIN_EMAIL,

  /**
   * Returns current authentication token (Firebase ID token or HMAC session token).
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
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('engineerverse_session_token_v1');
      if (storedToken) return storedToken;
    }
    return null;
  },

  /**
   * Returns cached token if available.
   */
  getCachedToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('engineerverse_session_token_v1') || null;
    }
    return null;
  },

  /**
   * Sets and persists authenticated local session token & user profile from verified Firebase ID token
   */
  async _setLocalAuthenticatedSession(idToken) {
    if (!idToken || typeof idToken !== 'string') return null;
    let finalUser = null;
    try {
      const res = await fetch(getApiUrl('/api/auth/session'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.token && typeof window !== 'undefined') {
          localStorage.setItem('engineerverse_session_token_v1', data.token);
        }
        if (data.user) {
          finalUser = data.user;
          if (typeof window !== 'undefined') {
            localStorage.setItem('engineerverse_authenticated_user_v1', JSON.stringify(finalUser));
          }
          dispatchAuthState(finalUser);
        }
      }
    } catch (err) {
      console.warn('[AuthService] Could not mint backend session token:', err);
    }

    return finalUser;
  },

  /**
   * Retrieves the current user profile from Firebase Auth or active session.
   */
  async getCurrentUser() {
    await ensureInitialized();

    let cached = {};
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('engineerverse_authenticated_user_v1');
        if (saved) {
          cached = JSON.parse(saved) || {};
        }
      } catch {}
    }

    if (firebaseAuth?.currentUser) {
      const u = firebaseAuth.currentUser;
      const email = (u.email || '').toLowerCase();
      const isAdmin = email === AUTHORIZED_ADMIN_EMAIL.toLowerCase();
      return {
        uid: u.uid,
        email,
        displayName: u.displayName || cached.displayName || (email ? email.split('@')[0] : 'Community Member'),
        photoURL: u.photoURL || cached.photoURL || (typeof window !== 'undefined' ? (localStorage.getItem(`ev_user_photo_${u.uid || email}`) || null) : null),
        isAnonymous: false,
        isAdmin,
        role: isAdmin ? 'admin' : 'member',
        connectionCredits: cached.connectionCredits ?? 5,
        bio: cached.bio || (typeof window !== 'undefined' ? localStorage.getItem(`ev_user_bio_${u.uid || email}`) || '' : ''),
        discipline: cached.discipline || (typeof window !== 'undefined' ? localStorage.getItem(`ev_user_discipline_${u.uid || email}`) || 'Full Stack Systems' : 'Full Stack Systems'),
        portfolioUrl: cached.portfolioUrl || '',
      };
    }

    if (cached && cached.uid && !cached.isAnonymous) {
      const email = (cached.email || '').toLowerCase();
      const isAdmin = email === AUTHORIZED_ADMIN_EMAIL.toLowerCase();
      return {
        ...cached,
        isAdmin,
        role: isAdmin ? 'admin' : (cached.role || 'member'),
        connectionCredits: cached.connectionCredits ?? 5,
      };
    }

    return null;
  },

  /**
   * Updates user profile (displayName, bio, discipline, photoURL, portfolioUrl)
   */
  async updateUserProfile(updates = {}) {
    await ensureInitialized();
    const currentUser = await this.getCurrentUser();
    if (!currentUser) return { success: false, error: 'User is not authenticated.' };

    const { displayName, bio, discipline, photoURL, portfolioUrl } = updates;

    // 1. Persist update on backend API FIRST (converts base64 dataUrls to permanent short URLs on server)
    const token = await this.getIdToken();
    let serverUser = null;
    if (token) {
      try {
        const res = await fetch(getApiUrl('/api/auth/profile'), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ displayName, bio, discipline, photoURL, portfolioUrl }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.user) serverUser = data.user;
        }
      } catch (err) {
        console.warn('[AuthService] Backend profile update notice:', err.message);
      }
    }

    const rawPhoto = serverUser?.photoURL !== undefined
      ? serverUser.photoURL
      : (photoURL !== undefined ? photoURL : (currentUser.photoURL || null));

    // Resolve into absolute, reachable URL across all hosts (e.g. rjshree.com, vercel, cloud run)
    const resolvedPhotoURL = resolveAvatarUrl(rawPhoto) || rawPhoto || null;

    // 2. Update Firebase Auth profile with clean, absolute URL (never exceeds 2048 chars)
    if (firebaseAuth?.currentUser) {
      const fbUpdates = {};
      if (displayName && displayName.trim()) fbUpdates.displayName = displayName.trim();
      if (resolvedPhotoURL !== undefined) {
        if (!resolvedPhotoURL || resolvedPhotoURL.startsWith('http://') || resolvedPhotoURL.startsWith('https://')) {
          fbUpdates.photoURL = resolvedPhotoURL;
        }
      }
      if (Object.keys(fbUpdates).length > 0) {
        await updateProfile(firebaseAuth.currentUser, fbUpdates).catch((err) => {
          console.warn('[AuthService] Firebase updateProfile notice:', err.message);
        });
      }
    }

    // 3. Assemble merged profile
    const mergedUser = {
      ...currentUser,
      ...(serverUser || {}),
      displayName: displayName !== undefined ? displayName.trim() : currentUser.displayName,
      bio: bio !== undefined ? bio : (currentUser.bio || ''),
      discipline: discipline !== undefined ? discipline : (currentUser.discipline || 'Full Stack Systems'),
      photoURL: resolvedPhotoURL,
      portfolioUrl: portfolioUrl !== undefined ? portfolioUrl : (currentUser.portfolioUrl || ''),
      connectionCredits: serverUser?.connectionCredits ?? currentUser.connectionCredits ?? 5,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('engineerverse_authenticated_user_v1', JSON.stringify(mergedUser));
      const uidKey = mergedUser.uid || mergedUser.email;
      if (bio !== undefined) localStorage.setItem(`ev_user_bio_${uidKey}`, bio);
      if (discipline !== undefined) localStorage.setItem(`ev_user_discipline_${uidKey}`, discipline);
      if (resolvedPhotoURL !== undefined) {
        if (resolvedPhotoURL) {
          localStorage.setItem(`ev_user_photo_${uidKey}`, resolvedPhotoURL);
        } else {
          localStorage.removeItem(`ev_user_photo_${uidKey}`);
        }
      }
    }

    // 4. Real-time broadcast to all subscribers
    dispatchAuthState(mergedUser);

    return {
      success: true,
      user: mergedUser,
    };
  },

  /**
   * Permanently deletes user account, avatar, and all associated DB records.
   */
  async deleteAccount() {
    await ensureInitialized();
    const currentUser = await this.getCurrentUser();
    if (!currentUser) return { success: false, error: 'User is not authenticated.' };

    const token = await this.getIdToken();
    let backendSuccess = false;

    if (token) {
      try {
        const res = await fetch(getApiUrl('/api/auth/account'), {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          backendSuccess = true;
        }
      } catch (err) {
        console.warn('[AuthService] Backend account deletion notice:', err.message);
      }
    }

    // If Firebase Auth currentUser is active, delete Firebase user
    if (firebaseAuth?.currentUser) {
      try {
        await fbDeleteUser(firebaseAuth.currentUser);
      } catch (err) {
        console.warn('[AuthService] Firebase deleteUser error (signing out instead):', err.message);
        await fbSignOut(firebaseAuth).catch(() => {});
      }
    }

    // Clean up all local storage keys for this user
    if (typeof window !== 'undefined') {
      const uid = currentUser.uid || currentUser.email;
      localStorage.removeItem('engineerverse_session_token_v1');
      localStorage.removeItem('engineerverse_authenticated_user_v1');
      localStorage.removeItem(`ev_user_bio_${uid}`);
      localStorage.removeItem(`ev_user_discipline_${uid}`);
      localStorage.removeItem(`ev_user_photo_${uid}`);
      localStorage.removeItem(`ev_user_avatar_theme_${uid}`);
    }

    dispatchAuthState(null);
    return { success: true, message: 'Account permanently deleted from ENGINEERVERSE.' };
  },

  /**
   * Fetches latest profile details (credits, warnings, role) from /api/auth/me
   */
  async refreshCurrentUser() {
    const token = await this.getIdToken();
    if (!token) return null;

    try {
      const res = await fetch(getApiUrl('/api/auth/me'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          const email = (data.user.email || '').toLowerCase();
          const isAdmin = email === AUTHORIZED_ADMIN_EMAIL.toLowerCase();
          const rawPhoto = data.user.photoURL;
          const photoURL = resolveAvatarUrl(rawPhoto) || rawPhoto || null;
          const finalUser = {
            ...data.user,
            photoURL,
            isAdmin,
            connectionCredits: data.user.connectionCredits ?? 5,
          };
          if (typeof window !== 'undefined') {
            localStorage.setItem('engineerverse_authenticated_user_v1', JSON.stringify(finalUser));
          }
          dispatchAuthState(finalUser);
          return finalUser;
        }
      }
    } catch (err) {
      console.warn('[AuthService] Failed to refresh user profile:', err);
    }
    return null;
  },

  /**
   * Helper to format user profile from Firebase User
   */
  _formatUserProfile(user) {
    if (!user) return null;
    const email = (user.email || '').toLowerCase();
    const isAdmin = email === AUTHORIZED_ADMIN_EMAIL.toLowerCase();
    const rawPhoto = user.photoURL || null;
    return {
      uid: user.uid,
      email,
      displayName: user.displayName || (email ? email.split('@')[0] : 'Community Member'),
      photoURL: resolveAvatarUrl(rawPhoto) || rawPhoto || null,
      isAnonymous: Boolean(user.isAnonymous),
      isAdmin,
      role: isAdmin ? 'admin' : 'member',
      connectionCredits: 5,
    };
  },

  /**
   * Error message translator for auth errors
   */
  _mapAuthError(err, providerName = 'Identity') {
    let userMessage = err.message || `${providerName} authentication failed.`;
    if (err.code === 'auth/popup-blocked') {
      userMessage = 'The sign-in popup was blocked by your browser. Please allow popups or open in a new tab.';
    } else if (err.code === 'auth/popup-closed-by-user') {
      userMessage = 'Sign-in window was closed before completing. Please try again.';
    } else if (err.code === 'auth/unauthorized-domain') {
      userMessage = 'This domain is not in the authorized domains list for sign-in.';
    } else if (err.code === 'auth/configuration-not-found' || err.message?.includes('CONFIGURATION_NOT_FOUND')) {
      userMessage = 'Authentication service is not ready. Please try again later.';
    } else if (err.code === 'auth/operation-not-allowed') {
      userMessage = `${providerName} sign-in is currently unavailable.`;
    } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
      userMessage = 'Invalid email or password. Please check your credentials or create a new account.';
    } else if (err.code === 'auth/invalid-credential') {
      if (providerName === 'Google') {
        userMessage = 'Google Sign-In credential rejected (auth/invalid-credential). This usually indicates that the OAuth Web Client Secret in Firebase Console (Authentication > Sign-in method > Google > Web SDK config) does not match Google Cloud Console, or Authorized JavaScript origins are missing. You can also sign in or register immediately via the Email & Password tab.';
      } else if (providerName === 'Email' || providerName === 'Password') {
        userMessage = 'Invalid email or password. Please check your credentials or create a new account.';
      } else {
        userMessage = `${providerName} sign-in rejected credentials. You can also use Email & Password.`;
      }
    } else if (err.code === 'auth/email-already-in-use') {
      userMessage = 'An account with this email already exists. Please sign in instead.';
    } else if (err.code === 'auth/weak-password') {
      userMessage = 'Password should be at least 6 characters long.';
    } else if (err.code === 'auth/network-request-failed') {
      userMessage = 'Network connection issue. Please check your connection and try again.';
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
        if (idToken) {
          await this._setLocalAuthenticatedSession(idToken).catch(() => {});
        }

        return {
          success: true,
          user: userProfile,
          idToken,
        };
      } catch (err) {
        console.error('[AuthService] Google popup sign-in error:', {
          code: err?.code,
          message: err?.message,
          customData: err?.customData,
        });
        return {
          success: false,
          error: this._mapAuthError(err, 'Google'),
          code: err?.code,
          detail: err?.message,
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
        if (idToken) {
          await this._setLocalAuthenticatedSession(idToken).catch(() => {});
        }

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
        if (idToken) {
          await this._setLocalAuthenticatedSession(idToken).catch(() => {});
        }

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

    return {
      success: false,
      error: 'Firebase Authentication is not configured on this deployment. Real authentication requires Firebase client configuration.',
      code: 'auth/not-configured',
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
        if (idToken) {
          await this._setLocalAuthenticatedSession(idToken).catch(() => {});
        }

        dispatchAuthState(userProfile);
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

    return {
      success: false,
      error: 'Firebase Authentication is not configured on this deployment. Account registration requires Firebase client configuration.',
      code: 'auth/not-configured',
    };
  },

  /**
   * Continue as Named Community Member
   * Saves guest preference locally. Requires verified identity for platform session creation.
   */
  async continueAsCommunityMember(name, roleOrInterest = 'Builder') {
    const trimmed = (name || '').trim() || 'Community Engineer';
    guestStorage.saveJourney({ name: trimmed, role: roleOrInterest });

    return {
      success: false,
      error: 'Community membership requires authenticated sign-in with a verified account (Google, GitHub, or Email). Guest preferences have been saved locally.',
      code: 'auth/verification-required',
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

    if (typeof window !== 'undefined') {
      localStorage.removeItem('engineerverse_session_token_v1');
      localStorage.removeItem('engineerverse_authenticated_user_v1');
    }

    dispatchAuthState(null);
    return { success: true };
  },

  /**
   * Subscribes to authentication state changes.
   */
  onAuthStateChanged(callback) {
    if (typeof callback !== 'function') return () => {};

    authStateSubscribers.add(callback);

    // Immediately trigger with current state
    this.getCurrentUser().then((user) => {
      callback(user);
    });

    let fbUnsubscribe = null;
    if (isFirebaseConfigured && firebaseAuth) {
      fbUnsubscribe = fbOnAuthStateChanged(firebaseAuth, async (user) => {
        if (user) {
          const idToken = await user.getIdToken().catch(() => null);
          const email = (user.email || '').toLowerCase();
          const isAdmin = email === AUTHORIZED_ADMIN_EMAIL.toLowerCase();

          let cached = {};
          if (typeof window !== 'undefined') {
            try {
              const s = localStorage.getItem('engineerverse_authenticated_user_v1');
              if (s) cached = JSON.parse(s) || {};
            } catch {}
          }

          const storedPhoto = typeof window !== 'undefined'
            ? (localStorage.getItem(`ev_user_photo_${user.uid || email}`) || cached.photoURL || null)
            : null;

          const rawPhoto = user.photoURL || storedPhoto || null;
          const resolvedPhoto = resolveAvatarUrl(rawPhoto) || rawPhoto || null;

          const profile = {
            uid: user.uid,
            email,
            displayName: user.displayName || cached.displayName || (email ? email.split('@')[0] : 'Community Member'),
            photoURL: resolvedPhoto,
            isAnonymous: false,
            isAdmin,
            role: isAdmin ? 'admin' : 'member',
            connectionCredits: cached.connectionCredits ?? 5,
            bio: cached.bio || (typeof window !== 'undefined' ? localStorage.getItem(`ev_user_bio_${user.uid || email}`) || '' : ''),
            discipline: cached.discipline || (typeof window !== 'undefined' ? localStorage.getItem(`ev_user_discipline_${user.uid || email}`) || 'Full Stack Systems' : 'Full Stack Systems'),
            portfolioUrl: cached.portfolioUrl || '',
            idToken,
          };
          dispatchAuthState(profile);

          // Sync full canonical database profile seamlessly in background without flickering
          this.refreshCurrentUser().catch(() => {});
        } else {
          // If Firebase signed out, check if a local session is still active
          const localUser = await this.getCurrentUser();
          if (!localUser) {
            dispatchAuthState(null);
          }
        }
      });
    }

    return () => {
      authStateSubscribers.delete(callback);
      if (fbUnsubscribe) fbUnsubscribe();
    };
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
