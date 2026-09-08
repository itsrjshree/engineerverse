/**
 * ENGINEERVERSE — Header Navigation
 * Matches Screenshot 1:
 * - Circular avatar/monogram + brand text
 * - High-contrast text links
 * - Top-right "✨ Shree Labs" pill button
 * - Fully responsive with accessible mobile drawer
 */

import { useState, useEffect } from 'react';
import { Menu, X, Sparkles, Compass, ShieldCheck, LogIn, LogOut, User, LayoutDashboard } from 'lucide-react';
import { Badge } from './ui/Badge.jsx';
import { authService, AUTHORIZED_ADMIN_EMAIL } from '../services/firebaseClient.js';
import { AuthModal } from './auth/AuthModal.jsx';

export function Header({ activeSection, onNavigate, campaignState }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await authService.signOut();
    setCurrentUser(null);
  };

  const navItems = [
    { id: 'hub', label: 'Hub' },
    { id: 'dna', label: 'Engineering DNA' },
    { id: 'problems', label: 'The Problem Wall' },
    { id: 'missions', label: 'Future Missions' },
    { id: 'stories', label: 'Stories & Voices' },
    { id: 'pritee', label: 'Ask Pritee AI' },
  ];

  const handleNavClick = (id) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  const isAdmin = currentUser?.email && currentUser.email.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-purple-950/40 bg-[#050510]/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
        {/* Brand logo & avatar */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleNavClick('hub')}
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-full cursor-pointer group"
            title="ENGINEERVERSE Hub"
          >
            {/* Direct circular logo image without artificial box wrappers */}
            <img
              src="https://3d-port-folio-git-main-rajshrees-projects.vercel.app/assets/logo-b1463779.svg"
              alt="Shree Labs Logo"
              referrerPolicy="no-referrer"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover shrink-0 transition-transform duration-200 group-hover:scale-105"
            />
          </button>
          
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleNavClick('hub')}
                className="text-base sm:text-lg font-bold text-white tracking-tight hover:text-purple-200 transition-colors cursor-pointer text-left"
              >
                ENGINEERVERSE
              </button>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/40">
                {campaignState?.edition || new Date().getFullYear()}
              </span>
            </div>
            <div className="text-[11px] text-purple-300/80 hidden sm:block">
              <a
                href="https://rjshree.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-purple-100 hover:underline transition-colors inline-flex items-center gap-1"
                title="Visit Shree Labs (rjshree.com)"
              >
                <span>Shree Labs × Pritee AI</span>
              </a>
            </div>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`px-3 py-1.5 text-xs xl:text-sm font-medium rounded-full transition-all duration-150 cursor-pointer ${
                activeSection === item.id
                  ? 'text-white bg-purple-950/60 border border-purple-600/40 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Action buttons: User Auth, Shree Labs pill, and Mobile toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {currentUser && !currentUser.isAnonymous ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleNavClick('dashboard')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border border-purple-600/40 bg-purple-950/60 text-purple-200 hover:bg-purple-900/60 hover:text-white transition cursor-pointer"
                title="My Engineer Dashboard"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-purple-300" />
                <span>Dashboard</span>
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleNavClick('admin')}
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-medium rounded-full border border-purple-500/60 bg-purple-900/50 text-purple-200 hover:bg-purple-800/60 hover:text-white transition shadow-[0_0_10px_rgba(168,85,247,0.2)] cursor-pointer"
                  title="Sole Administrator Console"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
                  <span>Admin Console</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-slate-300 hover:border-purple-600/50 transition cursor-pointer"
                title="Account Settings & Identity"
              >
                <div className="w-5 h-5 rounded-full bg-purple-600/60 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                  {(currentUser.displayName || currentUser.email || 'U').charAt(0)}
                </div>
                <span className="hidden sm:inline max-w-[100px] truncate text-slate-200 text-xs">
                  {currentUser.displayName || currentUser.email?.split('@')[0]}
                </span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border border-purple-500/40 bg-purple-950/50 text-purple-200 hover:bg-purple-900/60 hover:text-white transition cursor-pointer shadow-[0_0_10px_rgba(168,85,247,0.15)]"
              aria-label="Sign in to your account"
            >
              <LogIn className="w-3.5 h-3.5 text-purple-400" />
              <span>Sign In</span>
            </button>
          )}

          <a
            href="https://rjshree.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-full border border-purple-500/40 bg-purple-950/40 text-purple-200 hover:bg-purple-900/50 hover:text-white transition-all shadow-[0_0_15px_rgba(168,85,247,0.15)] hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Shree Labs</span>
          </a>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 cursor-pointer"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-purple-950/60 bg-[#070718] px-4 pt-3 pb-6 space-y-3 animate-in fade-in duration-200">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-purple-400/80 px-3 py-1">
            Navigation
          </div>
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`w-full text-left px-3.5 py-2.5 text-sm font-medium rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                activeSection === item.id
                  ? 'bg-purple-950/70 text-white border border-purple-700/50'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span>{item.label}</span>
              {activeSection === item.id && (
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
              )}
            </button>
          ))}

          {/* Mobile Auth row */}
          <div className="border-t border-purple-950/60 pt-3 px-1">
            {currentUser && !currentUser.isAnonymous ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setAuthModalOpen(true);
                  }}
                  className="w-full text-left px-3.5 py-2.5 text-sm font-medium rounded-xl bg-purple-950/40 border border-purple-800/40 text-slate-200 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-purple-400" />
                    <span>{currentUser.displayName || currentUser.email}</span>
                  </div>
                  {isAdmin && (
                    <span className="text-[10px] font-mono text-purple-300 bg-purple-900/60 px-1.5 py-0.5 rounded">
                      ADMIN
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('dashboard')}
                  className="w-full text-left px-3.5 py-2.5 text-sm font-medium rounded-xl transition-all flex items-center justify-between border border-purple-800/40 bg-purple-950/40 text-purple-200 hover:text-white cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4 text-purple-300" />
                    <span>My Engineer Dashboard</span>
                  </div>
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleNavClick('admin')}
                    className="w-full text-left px-3.5 py-2.5 text-sm font-mono font-medium rounded-xl transition-all flex items-center justify-between border border-purple-800/60 bg-purple-950/50 text-purple-200 hover:text-white cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-purple-400" />
                      <span>Admin Console</span>
                    </div>
                    <span className="text-[10px] text-purple-400/80">Authorized</span>
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
                className="w-full px-3.5 py-2.5 text-sm font-medium rounded-xl bg-purple-900/40 border border-purple-700/50 text-purple-200 hover:bg-purple-900/60 flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <LogIn className="w-4 h-4 text-purple-300" />
                <span>Sign In to Your Account</span>
              </button>
            )}
          </div>
        </div>
      )}

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
