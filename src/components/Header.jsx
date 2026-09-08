/**
 * ENGINEERVERSE — Header Navigation
 * Pure JavaScript (Rule 1).
 * Features:
 * - Clean, uncongested top bar for both general users and admins
 * - Fixed Profile Menu in top-right corner on desktop with future-proofed profile management
 * - Clean mobile header (Brand Logo + Hamburger only, zero congestion)
 * - Professional mobile slide-over drawer with full backdrop, outside-click & escape key listeners
 * - Full cross-device responsiveness (mobile, tablets, laptops, desktops, 4K TVs)
 */

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Menu,
  X,
  Sparkles,
  ShieldCheck,
  LogIn,
  LogOut,
  User,
  LayoutDashboard,
  Coins,
  Edit3,
  ExternalLink,
  ChevronDown,
  Compass,
  Dna,
  Flame,
  Rocket,
  MessageSquare,
  Bot,
} from 'lucide-react';
import { Badge } from './ui/Badge.jsx';
import { authService, AUTHORIZED_ADMIN_EMAIL } from '../services/firebaseClient.js';
import { AuthModal } from './auth/AuthModal.jsx';

export function Header({ activeSection, onNavigate, campaignState, currentUser: propUser }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(propUser || null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const profileMenuRef = useRef(null);
  const mobileDrawerRef = useRef(null);
  const hamburgerButtonRef = useRef(null);

  // Sync propUser whenever it changes
  useEffect(() => {
    if (propUser !== undefined) {
      setCurrentUser(propUser);
    }
  }, [propUser]);

  // Reset avatar error when photoURL changes
  useEffect(() => {
    setAvatarError(false);
  }, [currentUser?.photoURL]);

  // Subscribe to auth state
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Close desktop profile dropdown on click outside or Escape
  useEffect(() => {
    if (!profileDropdownOpen) return;
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setProfileDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileDropdownOpen]);

  // Close mobile drawer on outside click or Escape
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleClickOutside = (e) => {
      // If click happened outside the drawer card and not on the toggle button
      if (
        mobileDrawerRef.current &&
        !mobileDrawerRef.current.contains(e.target) &&
        !hamburgerButtonRef.current?.contains(e.target)
      ) {
        setMobileMenuOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const handleSignOut = async () => {
    await authService.signOut();
    setCurrentUser(null);
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  const navItems = [
    { id: 'hub', label: 'Hub', icon: Compass },
    { id: 'dna', label: 'Engineering DNA', icon: Dna },
    { id: 'problems', label: 'The Problem Wall', icon: Flame },
    { id: 'missions', label: 'Future Missions', icon: Rocket },
    { id: 'stories', label: 'Stories & Voices', icon: MessageSquare },
    { id: 'pritee', label: 'Ask Pritee AI', icon: Bot },
  ];

  const handleNavClick = (id) => {
    onNavigate(id);
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  };

  const isAdmin = currentUser?.email && currentUser.email.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase();
  const userInitial = (currentUser?.displayName || currentUser?.email || 'U').charAt(0).toUpperCase();

  // Mobile Drawer JSX rendered via Portal to escape header's backdrop-filter containing block
  const mobileDrawerPortal = mobileMenuOpen && typeof document !== 'undefined' ? createPortal(
    <div
      className="fixed inset-0 z-[9999] flex justify-end animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation Menu"
    >
      {/* Full-screen Backdrop (Tapping anywhere on dark overlay dismisses menu) */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-200 cursor-pointer"
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Card */}
      <div
        ref={mobileDrawerRef}
        className="relative w-full max-w-sm sm:max-w-md h-full bg-[#070718] border-l border-purple-900/60 shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col z-10 overflow-y-auto animate-in slide-in-from-right duration-300"
      >
        {/* Drawer Top Header */}
        <div className="p-5 border-b border-purple-950/70 flex items-center justify-between gap-3 bg-[#090922] sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <img
              src="https://3d-port-folio-git-main-rajshrees-projects.vercel.app/assets/logo-b1463779.svg"
              alt="Shree Labs Logo"
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full object-cover shadow-[0_0_10px_rgba(168,85,247,0.3)]"
            />
            <div className="flex flex-col text-left">
              <span className="font-black text-white text-base tracking-tight">
                ENGINEERVERSE
              </span>
              <span className="text-[10px] text-purple-300/80 font-mono">
                {campaignState?.edition || new Date().getFullYear()} Edition
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile / Sign In Section Inside Drawer */}
        <div className="p-4 border-b border-purple-950/60 bg-[#08081c]">
          {currentUser && !currentUser.isAnonymous ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-purple-950/40 border border-purple-800/40 shadow-inner">
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-purple-700 via-purple-600 to-indigo-600 flex items-center justify-center text-sm font-black text-white uppercase shadow-md shrink-0 border border-purple-400/40 overflow-hidden">
                  {currentUser.photoURL && !avatarError ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'Profile'}
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarError(true)}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    userInitial
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate">
                    {currentUser.displayName || 'Authenticated Engineer'}
                  </div>
                  <div className="text-[11px] text-purple-300/80 font-mono truncate">
                    {currentUser.email}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={isAdmin ? 'purple' : 'glow'} size="xs">
                      {isAdmin ? 'Administrator' : 'Verified Engineer'}
                    </Badge>
                    <span className="text-[10px] text-amber-300 font-mono flex items-center gap-0.5">
                      <Coins className="w-3 h-3 text-amber-400" />
                      {currentUser.connectionCredits ?? 5} Credits
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleNavClick('dashboard')}
                  className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-800/50 text-xs font-medium text-purple-200 hover:text-white flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-purple-400" />
                  <span>Dashboard</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleNavClick('profile');
                  }}
                  className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-800/50 text-xs font-medium text-purple-200 hover:text-white flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Profile Settings</span>
                </button>
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleNavClick('admin')}
                  className="w-full p-2.5 rounded-xl bg-purple-900/40 border border-purple-700/50 text-xs font-medium text-purple-200 hover:text-white flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-purple-300" />
                  <span>Administrator Console</span>
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setAuthModalOpen(true);
              }}
              className="w-full p-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.3)] transition cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In to Your Account</span>
            </button>
          )}
        </div>

        {/* Navigation Tabs List */}
        <div className="p-4 space-y-1.5 flex-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-purple-400/80 px-3 py-1 font-mono">
            Explore Universe
          </div>

          {navItems.map((item) => {
            const IconComp = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full min-h-[46px] text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-between cursor-pointer ${
                  isActive
                    ? 'bg-purple-950/90 text-white border border-purple-600/60 shadow-[0_0_15px_rgba(168,85,247,0.25)]'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <IconComp className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_#c084fc]"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-purple-950/60 bg-[#050512] space-y-3 mt-auto">
          <a
            href="https://rjshree.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-purple-950/40 border border-purple-800/40 hover:bg-purple-900/50 text-xs font-medium text-purple-200 hover:text-white flex items-center justify-between transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Visit Shree Labs</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>

          {currentUser && !currentUser.isAnonymous && (
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full min-h-[44px] px-4 py-2 rounded-xl text-center text-red-400 hover:bg-red-950/40 text-xs font-medium transition cursor-pointer flex items-center justify-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          )}

          <div className="text-[10px] text-center text-slate-500 pt-1">
            Built with precision for the builders of tomorrow.
          </div>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-purple-950/40 bg-[#050510]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3 sm:gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleNavClick('hub')}
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-full cursor-pointer group flex items-center gap-3"
            title="ENGINEERVERSE Hub"
          >
            <img
              src="https://3d-port-folio-git-main-rajshrees-projects.vercel.app/assets/logo-b1463779.svg"
              alt="Shree Labs Logo"
              referrerPolicy="no-referrer"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover shrink-0 transition-transform duration-200 group-hover:scale-105 shadow-[0_0_12px_rgba(168,85,247,0.3)]"
            />
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-extrabold text-white tracking-tight group-hover:text-purple-200 transition-colors">
                  ENGINEERVERSE
                </span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-purple-950/90 text-purple-300 border border-purple-800/40">
                  {campaignState?.edition || new Date().getFullYear()}
                </span>
              </div>
              <span className="text-[11px] text-purple-300/80 hidden md:block">
                Shree Labs × Pritee AI
              </span>
            </div>
          </button>
        </div>

        {/* Desktop Nav Links (Centrally placed) */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`px-3 py-1.5 text-xs xl:text-sm font-medium rounded-full transition-all duration-150 cursor-pointer ${
                activeSection === item.id
                  ? 'text-white bg-purple-950/80 border border-purple-600/50 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right Corner: Shree Labs pill (on large screens) + Profile Icon ONLY (Navbar clean) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Shree Labs External Link (Desktop only) */}
          <a
            href="https://rjshree.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-full border border-purple-500/40 bg-purple-950/40 text-purple-200 hover:bg-purple-900/50 hover:text-white transition-all shadow-[0_0_12px_rgba(168,85,247,0.15)] cursor-pointer"
            title="Visit Shree Labs (rjshree.com)"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Shree Labs</span>
          </a>

          {/* Profile Icon ONLY in Navbar (User Name & details shown ONLY on click) */}
          {currentUser && !currentUser.isAnonymous ? (
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-purple-700 via-purple-600 to-indigo-600 p-[2px] shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_22px_rgba(168,85,247,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                aria-expanded={profileDropdownOpen}
                aria-haspopup="true"
                title={`Profile: ${currentUser.displayName || currentUser.email} (Click for details & features)`}
              >
                <div className="w-full h-full rounded-full bg-[#08081c] flex items-center justify-center text-xs sm:text-sm font-black text-white uppercase tracking-wider overflow-hidden">
                  {currentUser.photoURL && !avatarError ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'Profile'}
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarError(true)}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    userInitial
                  )}
                </div>
                {/* Active status pip */}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500 border-2 border-[#050510]" />
              </button>

              {/* Profile Dropdown Menu with Name, Email & All Features */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-3 w-72 sm:w-80 rounded-2xl bg-[#08081c] border border-purple-900/60 shadow-[0_15px_35px_rgba(0,0,0,0.75)] p-3.5 space-y-3.5 animate-in fade-in zoom-in-95 duration-150 z-50">
                  {/* User Monogram & Info Header */}
                  <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-900/40 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-purple-700 to-indigo-600 border border-purple-400/50 flex items-center justify-center text-sm font-black text-white uppercase shadow-md shrink-0 overflow-hidden">
                        {currentUser.photoURL && !avatarError ? (
                          <img
                            src={currentUser.photoURL}
                            alt={currentUser.displayName || 'Profile'}
                            referrerPolicy="no-referrer"
                            onError={() => setAvatarError(true)}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          userInitial
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-white truncate">
                          {currentUser.displayName || 'Authenticated Engineer'}
                        </div>
                        <div className="text-[11px] text-purple-300/90 font-mono truncate">
                          {currentUser.email}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-purple-900/40 text-[10px]">
                      <Badge variant={isAdmin ? 'purple' : 'glow'} size="xs">
                        {isAdmin ? 'Administrator' : 'Verified Engineer'}
                      </Badge>
                      <span className="flex items-center gap-1 text-amber-300 font-mono">
                        <Coins className="w-3 h-3 text-amber-400" />
                        <span>{currentUser.connectionCredits ?? 5} Credits</span>
                      </span>
                    </div>
                  </div>

                  {/* Navigation Shortcuts */}
                  <div className="space-y-1 text-xs">
                    <button
                      type="button"
                      onClick={() => handleNavClick('dashboard')}
                      className="w-full px-3 py-2.5 rounded-xl text-left text-slate-200 hover:text-white hover:bg-purple-950/60 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <LayoutDashboard className="w-4 h-4 text-purple-400" />
                      <span className="font-medium">My Engineer Dashboard</span>
                    </button>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleNavClick('admin')}
                        className="w-full px-3 py-2.5 rounded-xl text-left text-purple-200 hover:text-white hover:bg-purple-950/60 flex items-center gap-2.5 transition cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4 text-purple-400" />
                        <span className="font-medium">Administrator Console</span>
                      </button>
                    )}

                    {/* Profile & Bio Settings Option */}
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleNavClick('profile');
                      }}
                      className="w-full px-3 py-2.5 rounded-xl text-left text-slate-200 hover:text-white hover:bg-purple-950/60 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4 text-purple-400" />
                      <span className="font-medium">Profile & Bio Settings</span>
                    </button>
                  </div>

                  {/* Divider & Sign Out */}
                  <div className="pt-2 border-t border-purple-950/60">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full px-3 py-2 rounded-xl text-left text-red-400 hover:bg-red-950/40 hover:text-red-300 flex items-center gap-2.5 text-xs font-medium transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-purple-950/60 border border-purple-500/50 text-purple-200 hover:text-white hover:bg-purple-900/60 hover:border-purple-400 transition-all cursor-pointer shadow-[0_0_12px_rgba(168,85,247,0.2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
              title="Sign In to ENGINEERVERSE"
            >
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}

          {/* Hamburger Menu Toggle Button (Visible on screens below lg) */}
          <div className="flex lg:hidden items-center">
            <button
              ref={hamburgerButtonRef}
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`min-w-[44px] min-h-[44px] flex items-center justify-center p-2.5 rounded-2xl transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                mobileMenuOpen
                  ? 'bg-purple-800 text-white border border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                  : 'bg-purple-950/70 text-purple-200 hover:text-white hover:bg-purple-900/80 border border-purple-700/60 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
              }`}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Portal-rendered Mobile Slide-Over Drawer */}
      {mobileDrawerPortal}

      {/* Interactive Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        currentUser={currentUser}
        onNavigateToAdmin={() => handleNavClick('admin')}
      />
    </header>
  );
}

export default Header;

