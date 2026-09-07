/**
 * ENGINEERVERSE — Interactive Authentication & Identity Modal
 * Provides transparent, accessible feedback for Google Authentication.
 * Handles iframe sandbox constraints, missing credentials, and RBAC states gracefully.
 */

import { useState, useEffect } from 'react';
import {
  LogIn,
  LogOut,
  ShieldCheck,
  AlertTriangle,
  X,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  User,
  Info,
} from 'lucide-react';
import { authService, AUTHORIZED_ADMIN_EMAIL, isFirebaseConfigured } from '../../services/firebaseClient.js';
import { Button } from '../ui/Button.jsx';
import { Badge } from '../ui/Badge.jsx';

export function AuthModal({ isOpen, onClose, currentUser, onAuthSuccess, onNavigateToAdmin }) {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [errorCode, setErrorCode] = useState(null);

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

  const isAdmin = currentUser?.email && currentUser.email.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase();

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      setAuthError(null);
      setErrorCode(null);

      const res = await authService.signInWithGoogle();

      if (!res.success) {
        setAuthError(res.error || 'Authentication could not be completed.');
        setErrorCode(res.code || 'unknown');
        return;
      }

      if (onAuthSuccess) {
        onAuthSuccess(res.user);
      }
    } catch (err) {
      setAuthError(err.message || 'An unexpected error occurred during sign-in.');
      setErrorCode('exception');
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
        className="relative w-full max-w-md my-auto bg-[#090918] border border-purple-900/60 rounded-3xl p-6 sm:p-7 shadow-[0_0_60px_rgba(168,85,247,0.25)] text-slate-100 space-y-5 transform transition-all"
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
              Authentication Gateway
            </h2>
            <p className="text-xs text-purple-300/80 font-mono">ENGINEERVERSE Security Boundary</p>
          </div>
        </div>

        {/* Current Identity State */}
        {currentUser && !currentUser.isAnonymous ? (
          <div className="space-y-4">
            <div className="p-4 bg-purple-950/30 rounded-2xl border border-purple-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">Authenticated Identity</span>
                {isAdmin ? (
                  <Badge variant="primary" size="sm" className="font-mono text-[10px]">
                    SOLE ADMIN
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
                    {currentUser.email}
                  </div>
                </div>
              </div>

              {isAdmin ? (
                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-600/50 text-[11px] text-emerald-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Authorized administrator account active.</span>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2">
                  <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>Administrative console requires <strong className="text-purple-300 font-mono">{AUTHORIZED_ADMIN_EMAIL}</strong>.</span>
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
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Sign in with your Google Account to contribute to <strong className="text-white">The Problem Wall</strong>, track your engineering milestones, and access authorized tools.
            </p>

            {/* Error / Notice Display */}
            {authError && (
              <div className="p-3.5 bg-amber-950/40 rounded-2xl border border-amber-600/50 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 text-amber-300 font-bold font-mono text-[11px]">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Identity Service Notice</span>
                </div>
                <p className="text-amber-200/90 leading-relaxed font-sans">
                  {authError}
                </p>
                {errorCode === 'auth/not-configured' && (
                  <p className="text-[11px] text-slate-300 mt-1 border-t border-amber-900/40 pt-1.5">
                    Identity client is awaiting environment configuration (<code className="text-purple-300">VITE_FIREBASE_API_KEY</code> & <code className="text-purple-300">VITE_FIREBASE_PROJECT_ID</code>).
                  </p>
                )}
                {(errorCode === 'auth/network-request-failed' || errorCode === 'auth/configuration-not-found') && (
                  <div className="text-[11px] text-slate-300 mt-1.5 border-t border-amber-900/40 pt-2 space-y-1">
                    <div className="font-semibold text-amber-200">How to fix in Firebase Console:</div>
                    <ol className="list-decimal pl-4 space-y-0.5 text-slate-300/90 font-sans">
                      <li>Go to Firebase Console &rarr; your project</li>
                      <li>Click <strong>Build &rarr; Authentication</strong> &rarr; Click <strong>"Get started"</strong></li>
                      <li>In <strong>Sign-in method</strong>, enable <strong>Google</strong> and save</li>
                      <li>In <strong>Settings &rarr; Authorized domains</strong>, verify this domain is added</li>
                    </ol>
                  </div>
                )}
              </div>
            )}

            {/* Google Sign-In Action */}
            <div className="space-y-2 pt-1">
              <Button
                variant="primary"
                size="lg"
                icon={LogIn}
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="w-full justify-center font-medium text-sm shadow-[0_0_20px_rgba(168,85,247,0.3)] cursor-pointer"
              >
                {isSigningIn ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Connecting to Google...</span>
                  </span>
                ) : (
                  <span>Sign In with Google</span>
                )}
              </Button>

              <p className="text-[11px] text-slate-400 text-center font-mono">
                Sole administrator account: {AUTHORIZED_ADMIN_EMAIL}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthModal;
