/**
 * ENGINEERVERSE — Interactive Authentication & Identity Gateway Modal
 * Supports:
 * - Google Sign-In (OAuth Popup)
 * - GitHub Developer Sign-In (OAuth Popup)
 * - Facebook Community Sign-In (OAuth Popup)
 * - Yahoo Sign-In (OAuth Popup)
 * - Email & Password Sign In / Registration
 * - Instant Community Member Join (Fast name-based access)
 * 
 * Never exposes administrator email publicly.
 * Respects iframe constraints and handles COOP safely.
 */

import { useState, useEffect } from 'react';
import {
  LogIn,
  LogOut,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  X,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  User,
  Info,
  Mail,
  Lock,
  Sparkles,
  ArrowRight,
  Github,
} from 'lucide-react';
import { authService, isFirebaseConfigured } from '../../services/firebaseClient.js';
import { Button } from '../ui/Button.jsx';
import { Badge } from '../ui/Badge.jsx';

export function AuthModal({
  isOpen,
  onClose,
  currentUser,
  onAuthSuccess,
  onSuccess,
  onNavigateToAdmin,
  promptReason,
}) {
  const [activeTab, setActiveTab] = useState('social'); // 'social' | 'email' | 'guest'
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [errorCode, setErrorCode] = useState(null);

  const notifySuccess = (user) => {
    if (typeof onSuccess === 'function') onSuccess(user);
    if (typeof onAuthSuccess === 'function') onAuthSuccess(user);
  };

  // Email/Password form state
  const [emailMode, setEmailMode] = useState('signin'); // 'signin' | 'signup'
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [displayNameInput, setDisplayNameInput] = useState('');

  // Quick community join state
  const [guestNameInput, setGuestNameInput] = useState('');
  const [guestRoleInput, setGuestRoleInput] = useState('Full-Stack Engineer');

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isAdmin = Boolean(currentUser?.isAdmin);

  const handleProviderAuth = async (providerName) => {
    try {
      setIsSigningIn(true);
      setAuthError(null);
      setErrorCode(null);

      let res;
      if (providerName === 'google') {
        res = await authService.signInWithGoogle();
      } else if (providerName === 'github') {
        res = await authService.signInWithGithub();
      } else if (providerName === 'facebook') {
        res = await authService.signInWithFacebook();
      } else if (providerName === 'yahoo') {
        res = await authService.signInWithYahoo();
      }

      if (!res.success) {
        setAuthError(res.error || `${providerName} sign-in failed.`);
        setErrorCode(res.code || 'provider_failed');
        return;
      }

      notifySuccess(res.user);
      onClose();
    } catch (err) {
      setAuthError(err.message || 'Authentication error.');
      setErrorCode('exception');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) {
      setAuthError('Please enter both email and password.');
      return;
    }

    try {
      setIsSigningIn(true);
      setAuthError(null);
      setErrorCode(null);

      let res;
      if (emailMode === 'signup') {
        res = await authService.signUpWithEmail(emailInput, passwordInput, displayNameInput);
      } else {
        res = await authService.signInWithEmail(emailInput, passwordInput);
      }

      if (!res.success) {
        setAuthError(res.error || 'Email authentication failed.');
        setErrorCode(res.code || 'email_error');
        return;
      }

      notifySuccess(res.user);
      onClose();
    } catch (err) {
      setAuthError(err.message || 'Authentication failed.');
      setErrorCode('exception');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleQuickCommunityJoin = async (e) => {
    e.preventDefault();
    if (!guestNameInput.trim()) {
      setAuthError('Please enter your name or moniker.');
      return;
    }

    try {
      setIsSigningIn(true);
      setAuthError(null);

      const res = await authService.continueAsCommunityMember(guestNameInput, guestRoleInput);
      if (!res || !res.success) {
        setAuthError(res?.error || 'Quick join failed.');
        return;
      }
      notifySuccess(res.user);
      onClose();
    } catch (err) {
      setAuthError(err.message || 'Quick join failed.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsSigningIn(true);
      await authService.signOut();
      setAuthError(null);
      setErrorCode(null);
    } catch (err) {
      console.warn('Sign-out error:', err);
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md p-4 sm:p-6 flex min-h-screen items-center justify-center animate-in fade-in duration-150"
    >
      <div
        className="relative w-full max-w-lg my-auto bg-[#090918] border border-purple-900/60 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(168,85,247,0.25)] text-slate-100 space-y-5 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-purple-900/40 pb-4">
          <div className="w-11 h-11 rounded-2xl bg-purple-950/80 border border-purple-700/60 flex items-center justify-center text-purple-300 shrink-0">
            <LogIn className="w-5 h-5" />
          </div>
          <div>
            <h2 id="auth-modal-title" className="text-lg font-bold text-white tracking-tight">
              Community Identity Gateway
            </h2>
            <p className="text-xs text-purple-300/80 font-sans">
              Sign in with your preferred account or join as an engineer
            </p>
          </div>
        </div>

        {/* Prompt Reason Banner */}
        {promptReason && (
          <div className="p-3 rounded-xl bg-purple-950/70 border border-purple-600/50 text-purple-200 text-xs flex items-center gap-2.5 animate-in fade-in">
            <Info className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="font-medium">{promptReason}</span>
          </div>
        )}

        {/* Current Authenticated Identity State */}
        {currentUser && !currentUser.isAnonymous ? (
          <div className="space-y-4">
            <div className="p-4 bg-purple-950/30 rounded-2xl border border-purple-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-sans">Active Identity</span>
                {isAdmin ? (
                  <Badge variant="primary" size="sm" className="font-mono text-[10px]">
                    ADMINISTRATOR
                  </Badge>
                ) : (
                  <Badge variant="outline" size="sm" className="font-mono text-[10px]">
                    COMMUNITY MEMBER
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-600/70 border border-purple-400/40 flex items-center justify-center text-base font-bold text-white uppercase">
                  {(currentUser.displayName || currentUser.email || 'U').charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white truncate">
                    {currentUser.displayName || 'Engineer'}
                  </div>
                  <div className="text-xs text-purple-300/80 font-mono truncate">
                    {currentUser.email || 'Community Member'}
                  </div>
                </div>
              </div>

              {isAdmin ? (
                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-600/50 text-[11px] text-emerald-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Authorized administrator account active.</span>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/40 text-[11px] text-purple-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Verified community contributor. You can submit problems with attribution.</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-1">
              {isAdmin && onNavigateToAdmin && (
                <Button
                  variant="primary"
                  size="md"
                  icon={ShieldCheck}
                  onClick={() => {
                    onClose();
                    onNavigateToAdmin();
                  }}
                  className="w-full justify-center font-mono text-xs cursor-pointer"
                >
                  Enter Admin Console
                </Button>
              )}

              <Button
                variant="outline"
                size="md"
                icon={LogOut}
                onClick={handleSignOut}
                disabled={isSigningIn}
                className="w-full justify-center border-slate-700 text-slate-300 hover:text-white cursor-pointer"
              >
                Sign Out
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Tab Navigation */}
            <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-xl border border-purple-900/40 text-xs font-medium">
              <button
                type="button"
                onClick={() => { setActiveTab('social'); setAuthError(null); }}
                className={`py-1.5 px-2 rounded-lg transition-all text-center cursor-pointer ${
                  activeTab === 'social'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Google / OAuth
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('email'); setAuthError(null); }}
                className={`py-1.5 px-2 rounded-lg transition-all text-center cursor-pointer ${
                  activeTab === 'email'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Member Sign-In
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('guest'); setAuthError(null); }}
                className={`py-1.5 px-2 rounded-lg transition-all text-center cursor-pointer ${
                  activeTab === 'guest'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Instant Join
              </button>
            </div>

            {/* Error Display */}
            {authError && (
              <div className="p-2.5 bg-red-950/40 rounded-xl border border-red-500/30 flex items-center gap-2 text-xs text-red-200">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="leading-snug">{authError}</span>
              </div>
            )}

            {/* TAB 1: Social Providers */}
            {activeTab === 'social' && (
              <div className="space-y-3 pt-1">
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  Sign in with any provider below to submit challenges on <strong className="text-white">The Problem Wall</strong> with full community attribution.
                </p>

                <div className="space-y-2">
                  {/* Google */}
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => handleProviderAuth('google')}
                    disabled={isSigningIn}
                    className="w-full justify-center font-medium text-xs bg-purple-600 hover:bg-purple-500 cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.25)]"
                  >
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    Continue with Google
                  </Button>

                  {/* GitHub */}
                  <button
                    type="button"
                    onClick={() => handleProviderAuth('github')}
                    disabled={isSigningIn}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-slate-500 text-white text-xs font-medium transition cursor-pointer"
                  >
                    <Github className="w-4 h-4 text-slate-200" />
                    <span>Continue with GitHub</span>
                  </button>

                  {/* Facebook & Yahoo row */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleProviderAuth('facebook')}
                      disabled={isSigningIn}
                      className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-blue-950/40 border border-blue-800/50 hover:border-blue-500/80 text-blue-200 text-xs font-medium transition cursor-pointer"
                    >
                      <span className="font-bold">f</span>
                      <span>Facebook</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleProviderAuth('yahoo')}
                      disabled={isSigningIn}
                      className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-purple-950/40 border border-purple-800/50 hover:border-purple-500/80 text-purple-200 text-xs font-medium transition cursor-pointer"
                    >
                      <span className="font-bold">Y!</span>
                      <span>Yahoo</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Member Sign-In */}
            {activeTab === 'email' && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between text-xs pb-1">
                  <span className="text-slate-300 font-medium">
                    {emailMode === 'signup' ? 'New Registration' : 'Member Sign In'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEmailMode(emailMode === 'signup' ? 'signin' : 'signup')}
                    className="text-purple-400 hover:text-purple-300 underline cursor-pointer text-[11px]"
                  >
                    {emailMode === 'signup' ? 'Existing Member? Sign In' : 'Need account? Sign Up'}
                  </button>
                </div>

                {emailMode === 'signup' ? (
                  <div className="p-3.5 bg-purple-950/40 rounded-xl border border-purple-500/30 space-y-3 text-xs text-purple-200">
                    <p className="leading-relaxed">
                      To preserve authentic engineering attribution and eliminate unverified accounts in V0, all new builder registrations must be verified via Google Authentication.
                    </p>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => handleProviderAuth('google')}
                      disabled={isSigningIn}
                      className="w-full justify-center font-medium text-xs bg-purple-600 hover:bg-purple-500 cursor-pointer"
                    >
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      Register with Google
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleEmailAuth} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400 font-sans">Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="you@domain.com"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400 font-sans">Password</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      disabled={isSigningIn}
                      className="w-full justify-center font-medium text-xs mt-2 cursor-pointer"
                    >
                      {isSigningIn ? (
                        <span className="flex items-center gap-2">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Authenticating...</span>
                        </span>
                      ) : (
                        <span>Sign In with Email</span>
                      )}
                    </Button>
                  </form>
                )}
              </div>
            )}

            {/* TAB 3: Instant Guest / Community Join */}
            {activeTab === 'guest' && (
              <form onSubmit={handleQuickCommunityJoin} className="space-y-3 pt-1">
                <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/40 text-xs text-purple-200 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 text-purple-300">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Instant Community Access</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                    No password or third-party popup required. Enter your name or handle to contribute challenges and upvote immediately.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-sans">Your Name or Moniker</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikram Malhotra"
                    value={guestNameInput}
                    onChange={(e) => setGuestNameInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-sans">Primary Domain / Interest</label>
                  <select
                    value={guestRoleInput}
                    onChange={(e) => setGuestRoleInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="Full-Stack Engineer">Full-Stack Engineer</option>
                    <option value="Hardware / Embedded Builder">Hardware / Embedded Builder</option>
                    <option value="Agritech Innovator">Agritech Innovator</option>
                    <option value="Water & Energy Researcher">Water & Energy Researcher</option>
                    <option value="Assistive Tech Developer">Assistive Tech Developer</option>
                    <option value="Engineering Student">Engineering Student</option>
                  </select>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSigningIn}
                  className="w-full justify-center font-medium text-xs mt-2 cursor-pointer"
                >
                  {isSigningIn ? 'Setting up profile...' : 'Join Community & Continue'}
                </Button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthModal;
