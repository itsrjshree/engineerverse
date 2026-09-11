/**
 * ENGINEERVERSE — Dedicated Profile & Identity Management Screen
 * Pure JavaScript (Rule 1).
 * Full-screen tab/view for engineer profile customization:
 * - Real-time Display Name & Avatar updates
 * - Engineering Bio & Core Philosophy
 * - Primary Engineering Discipline selection
 * - Real-time Connection Credits balance & mechanism explanation
 * - Linked Identity & Security status
 */

import { useState, useEffect, useRef } from 'react';
import {
  User,
  ArrowLeft,
  Check,
  Coins,
  ShieldCheck,
  Sparkles,
  Camera,
  Globe,
  Github,
  Award,
  Compass,
  FileText,
  Save,
  Loader2,
  LogOut,
  Info,
  ChevronRight,
  ExternalLink,
  Cpu,
  Layers,
  UploadCloud,
  Link2,
  Trash2,
  Image as ImageIcon,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '../ui/Badge.jsx';
import { Button } from '../ui/Button.jsx';
import { authService, AUTHORIZED_ADMIN_EMAIL } from '../../services/firebaseClient.js';
import { resolveAvatarUrl } from '../../config/api.js';

const ENGINEERING_DISCIPLINES = [
  'Full Stack Systems',
  'AI & Intelligent Systems',
  'Robotics & Automation',
  'Aerospace & Space Tech',
  'Mechanical Systems',
  'Electrical & VLSI',
  'Civil & Infrastructure',
  'Biotechnology & Bio-Eng',
  'Clean Energy & Grid',
  'Cybersecurity & Cryptography',
  'Quantum Computing',
  'Materials Science',
];

const AVATAR_GRADIENTS = [
  { id: 'purple', from: 'from-purple-600', to: 'to-indigo-600', border: 'border-purple-400' },
  { id: 'emerald', from: 'from-emerald-600', to: 'to-teal-600', border: 'border-emerald-400' },
  { id: 'amber', from: 'from-amber-600', to: 'to-orange-600', border: 'border-amber-400' },
  { id: 'cyan', from: 'from-cyan-600', to: 'to-blue-600', border: 'border-cyan-400' },
  { id: 'rose', from: 'from-rose-600', to: 'to-pink-600', border: 'border-rose-400' },
];

export function ProfileSettingsView({ onNavigate, currentUser: propUser }) {
  const [user, setUser] = useState(propUser || null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [discipline, setDiscipline] = useState('Full Stack Systems');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [photoError, setPhotoError] = useState(false);
  const [avatarTheme, setAvatarTheme] = useState('purple');
  const [activeSubTab, setActiveSubTab] = useState('identity');
  const [isSaving, setIsSaving] = useState(false);
  const [successToast, setSuccessToast] = useState('');
  const [errorToast, setErrorToast] = useState('');

  // Profile Photo Upload State & References
  const fileInputRef = useRef(null);
  const [photoUploadMode, setPhotoUploadMode] = useState('file'); // 'file' | 'url'
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Client-side image optimization: converts local files into fast-loading WebP/JPEG data URLs
  const processImageFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorToast('Please select a valid image file (PNG, JPG, WEBP, GIF).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorToast('Image size exceeds 10MB limit. Please select a smaller photo.');
      return;
    }

    setIsProcessingImage(true);
    setErrorToast('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        try {
          const canvas = document.createElement('canvas');
          const MAX_DIM = 400;
          let width = img.width;
          let height = img.height;

          // Preserve aspect ratio with max dimension
          if (width > height) {
            if (width > MAX_DIM) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            }
          } else {
            if (height > MAX_DIM) {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Export as compressed WebP (fallback to JPEG)
          let dataUrl = canvas.toDataURL('image/webp', 0.88);
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          }

          setPhotoURL(dataUrl);
          setIsProcessingImage(false);

          // Immediate auto-upload to Cloudinary -> Firestore pipeline
          setIsUploadingPhoto(true);
          setSuccessToast('Uploading avatar to Cloudinary & saving to database...');

          const uploadResult = await authService.uploadAvatar(dataUrl);
          if (uploadResult && uploadResult.success) {
            if (uploadResult.photoURL) {
              setPhotoURL(uploadResult.photoURL);
            }
            if (uploadResult.user) {
              setUser(uploadResult.user);
            }
            setSuccessToast('Avatar uploaded to Cloudinary & synced to database successfully!');
            setTimeout(() => setSuccessToast(''), 4500);
          } else {
            // Still kept preview locally so user can save with overall profile
            setSuccessToast('Photo preview ready. Click "Save Changes" below to apply.');
            setTimeout(() => setSuccessToast(''), 4000);
          }
        } catch (err) {
          console.warn('[Profile] Canvas processing error:', err);
          setPhotoURL(event.target.result);
        } finally {
          setIsProcessingImage(false);
          setIsUploadingPhoto(false);
        }
      };
      img.onerror = () => {
        setIsProcessingImage(false);
        setErrorToast('Could not parse image. Please try another image file.');
      };
      img.src = event.target.result;
    };
    reader.onerror = () => {
      setIsProcessingImage(false);
      setErrorToast('Error reading image from your device.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleClearPhoto = async () => {
    setPhotoURL('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (user?.photoURL) {
      setIsSaving(true);
      try {
        const result = await authService.updateUserProfile({
          displayName,
          bio,
          discipline,
          portfolioUrl,
          photoURL: '',
        });
        if (result.success) {
          setUser(result.user);
          setSuccessToast('Profile photo purged from Cloudinary & Firestore in real time.');
          setTimeout(() => setSuccessToast(''), 4000);
        } else {
          setErrorToast(result.error || 'Failed to remove photo.');
        }
      } catch (err) {
        setErrorToast(err.message || 'Error removing photo.');
      } finally {
        setIsSaving(false);
      }
    } else {
      setSuccessToast('Profile photo cleared.');
      setTimeout(() => setSuccessToast(''), 3000);
    }
  };

  // Reset photo error when photo changes
  useEffect(() => {
    setPhotoError(false);
  }, [photoURL]);

  // Sync state from active user (stabilized by UID/email to eliminate loop and database churning)
  useEffect(() => {
    if (propUser) {
      setUser(propUser);
      setDisplayName(propUser.displayName || propUser.email?.split('@')[0] || 'Engineer');
      setBio(propUser.bio || '');
      setDiscipline(propUser.discipline || 'Full Stack Systems');
      setPortfolioUrl(propUser.portfolioUrl || '');
      setPhotoURL(propUser.photoURL || '');
      const savedTheme = localStorage.getItem(`ev_user_avatar_theme_${propUser.uid || propUser.email}`);
      if (savedTheme) setAvatarTheme(savedTheme);
    } else {
      authService.getCurrentUser().then((active) => {
        if (active) {
          setUser(active);
          setDisplayName(active.displayName || active.email?.split('@')[0] || 'Engineer');
          setBio(active.bio || '');
          setDiscipline(active.discipline || 'Full Stack Systems');
          setPortfolioUrl(active.portfolioUrl || '');
          setPhotoURL(active.photoURL || '');
          const savedTheme = localStorage.getItem(`ev_user_avatar_theme_${active.uid || active.email}`);
          if (savedTheme) setAvatarTheme(savedTheme);
        }
      });
    }
  }, [propUser?.uid, propUser?.email]);

  const isAdmin = Boolean(
    user?.email && user.email.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase()
  );

  // User's available connection credits (default 5 for verified members)
  const displayCredits = user?.connectionCredits ?? 5;

  const selectedGradient =
    AVATAR_GRADIENTS.find((g) => g.id === avatarTheme) || AVATAR_GRADIENTS[0];

  const resolvedPhotoSrc = resolveAvatarUrl(photoURL) || photoURL;

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    if (!user) {
      setErrorToast('Please sign in to save your engineer profile.');
      return;
    }

    setIsSaving(true);
    setSuccessToast('');
    setErrorToast('');

    try {
      const result = await authService.updateUserProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        discipline,
        portfolioUrl: portfolioUrl.trim(),
        photoURL: photoURL.trim(),
      });

      if (result.success) {
        setUser(result.user);
        if (result.user?.photoURL !== undefined) {
          setPhotoURL(result.user.photoURL || '');
        }
        if (typeof window !== 'undefined') {
          localStorage.setItem(`ev_user_avatar_theme_${user.uid || user.email}`, avatarTheme);
        }
        setSuccessToast('Profile details & photo updated in real-time. Old avatar purged from database.');
        setTimeout(() => setSuccessToast(''), 4500);
      } else {
        setErrorToast(result.error || 'Failed to update profile.');
      }
    } catch (err) {
      setErrorToast(err.message || 'An error occurred while saving profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleDeleteAccount = async () => {
    if (deleteConfirmationInput !== 'DELETE') {
      setErrorToast('Please type DELETE in capital letters to confirm account removal.');
      return;
    }

    setIsDeletingAccount(true);
    setErrorToast('');

    try {
      const res = await authService.deleteAccount();
      if (res.success) {
        if (onNavigate) onNavigate('hub');
      } else {
        setErrorToast(res.error || 'Failed to delete account.');
        setIsDeletingAccount(false);
      }
    } catch (err) {
      setErrorToast(err.message || 'Error deleting account.');
      setIsDeletingAccount(false);
    }
  };

  const handleSignOut = async () => {
    await authService.signOut();
    if (onNavigate) onNavigate('hub');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-950/60">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <button
            type="button"
            onClick={() => onNavigate('hub')}
            className="hover:text-purple-300 transition flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home Hub</span>
          </button>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="hover:text-purple-300 transition cursor-pointer"
          >
            Engineer Dashboard
          </button>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span className="text-purple-300 font-medium">Profile & Identity Settings</span>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('dashboard')}
            className="text-xs text-slate-300 hover:text-white"
          >
            My Dashboard
          </Button>
          <Button
            variant="purple"
            size="sm"
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </Button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-sm flex items-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.15)] animate-in fade-in slide-in-from-top-2">
          <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="flex-1 font-medium">{successToast}</div>
        </div>
      )}

      {/* Error Notification Banner */}
      {errorToast && (
        <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-200 text-sm flex items-center gap-3 shadow-[0_0_20px_rgba(239,68,68,0.15)] animate-in fade-in slide-in-from-top-2">
          <Info className="w-5 h-5 text-red-400 shrink-0" />
          <div className="flex-1 font-medium">{errorToast}</div>
        </div>
      )}

      {/* Hero Profile Overview Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#090920] via-[#070718] to-[#04040e] border border-purple-900/40 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Avatar Showcase */}
            <div className="relative shrink-0">
              {photoURL && !photoError ? (
                <img
                  src={resolvedPhotoSrc}
                  alt={displayName}
                  referrerPolicy="no-referrer"
                  onError={() => setPhotoError(true)}
                  className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 ${selectedGradient.border} shadow-[0_0_20px_rgba(168,85,247,0.3)]`}
                />
              ) : (
                <div
                  className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr ${selectedGradient.from} ${selectedGradient.to} border-2 ${selectedGradient.border} flex items-center justify-center text-3xl font-black text-white uppercase shadow-[0_0_25px_rgba(168,85,247,0.35)]`}
                >
                  {(displayName || user?.email || 'U').charAt(0)}
                </div>
              )}
              <div
                className="absolute -bottom-1.5 -right-1.5 p-1 rounded-lg bg-[#070718] border border-purple-700/60 text-purple-300"
                title="Active Verified Status"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              </div>
            </div>

            {/* Core Identity Info */}
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
                  {displayName || 'Community Engineer'}
                </h1>
                <Badge variant={isAdmin ? 'purple' : 'glow'} size="sm">
                  {isAdmin ? 'System Administrator' : 'Verified Engineer'}
                </Badge>
              </div>

              <div className="text-xs sm:text-sm text-purple-300/80 font-mono truncate">
                {user?.email || 'guest@engineerverse.local'}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-purple-400" />
                  <span>{discipline}</span>
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                <span className="text-emerald-400 font-medium text-[11px] flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Verified Member
                </span>
              </div>
            </div>
          </div>

          {/* Connection Credits Balance Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0d0d26]/80 border border-purple-800/40 backdrop-blur-md flex items-center justify-between md:flex-col md:items-end gap-3 shrink-0">
            <div className="space-y-0.5">
              <div className="text-[11px] font-semibold text-purple-300 uppercase tracking-wider">
                Connection Credits
              </div>
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400 animate-pulse" />
                <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                  {displayCredits}
                </span>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 max-w-[200px] text-right">
              Available for verified collaboration handshakes.
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-purple-950/60 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('identity')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'identity'
              ? 'bg-purple-950/90 text-white border border-purple-600/60 shadow-[0_0_15px_rgba(168,85,247,0.25)]'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <User className="w-4 h-4 text-purple-400" />
          <span>Profile & Bio</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('credits')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'credits'
              ? 'bg-purple-950/90 text-white border border-purple-600/60 shadow-[0_0_15px_rgba(168,85,247,0.25)]'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Coins className="w-4 h-4 text-amber-400" />
          <span>Credits & Mechanism</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('account')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'account'
              ? 'bg-purple-950/90 text-white border border-purple-600/60 shadow-[0_0_15px_rgba(168,85,247,0.25)]'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Account & Security</span>
        </button>
      </div>

      {/* Tab 1: Profile & Identity Configuration */}
      {activeSubTab === 'identity' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Form Inputs */}
            <div className="lg:col-span-2 space-y-6">
              <div className="p-6 rounded-3xl bg-[#070718] border border-purple-950/60 space-y-5">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-400" />
                  <span>Public Identity & Details</span>
                </h3>

                {/* Display Name */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">
                    Display Name / Engineering Handle
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Dr. Aryan Verma, Ada Lovelace"
                    maxLength={60}
                    className="w-full px-4 py-3 rounded-2xl bg-[#090920] border border-purple-900/50 text-white text-sm focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition"
                  />
                  <p className="text-[11px] text-slate-500">
                    This is your public name displayed on solutions, problems, and mentor interactions.
                  </p>
                </div>

                {/* Primary Engineering Discipline */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">
                    Primary Engineering Discipline
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ENGINEERING_DISCIPLINES.map((disc) => {
                      const isSelected = discipline === disc;
                      return (
                        <button
                          key={disc}
                          type="button"
                          onClick={() => setDiscipline(disc)}
                          className={`p-2.5 rounded-xl text-xs font-medium text-left transition cursor-pointer border ${
                            isSelected
                              ? 'bg-purple-950/80 border-purple-500 text-white shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                              : 'bg-[#090920] border-purple-950/60 text-slate-400 hover:text-slate-200 hover:border-purple-800'
                          }`}
                        >
                          {disc}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Engineering Bio & Philosophy */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">
                      Engineering Philosophy & Bio
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {bio.length} / 500 characters
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, 500))}
                    placeholder="What problems are you passionate about solving? Share your core engineering mindset, architectural philosophy, or tech stack..."
                    className="w-full px-4 py-3 rounded-2xl bg-[#090920] border border-purple-900/50 text-white text-sm focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition resize-none"
                  />
                </div>

                {/* Portfolio / GitHub Link */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-purple-400" />
                    <span>Portfolio, GitHub, or Research Link (Optional)</span>
                  </label>
                  <input
                    type="url"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    placeholder="https://github.com/yourhandle or https://portfolio.dev"
                    className="w-full px-4 py-3 rounded-2xl bg-[#090920] border border-purple-900/50 text-white text-sm focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition"
                  />
                </div>

                {/* Profile Photo Management */}
                <div className="space-y-3 pt-2 border-t border-purple-950/60">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                      <Camera className="w-3.5 h-3.5 text-purple-400" />
                      <span>Profile Photo</span>
                    </label>

                    {/* Mode Toggle: Device Upload vs Web URL */}
                    <div className="flex items-center p-0.5 rounded-xl bg-[#090920] border border-purple-900/50 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setPhotoUploadMode('file')}
                        className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer ${
                          photoUploadMode === 'file'
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <UploadCloud className="w-3 h-3" />
                        <span>Upload File</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhotoUploadMode('url')}
                        className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer ${
                          photoUploadMode === 'url'
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Link2 className="w-3 h-3" />
                        <span>Image Link</span>
                      </button>
                    </div>
                  </div>

                  {/* Upload from Local Machine */}
                  {photoUploadMode === 'file' && (
                    <div className="space-y-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="hidden"
                        onChange={handleFileInputChange}
                      />

                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-2 group ${
                          dragOver
                            ? 'border-purple-400 bg-purple-950/40 scale-[1.01]'
                            : isProcessingImage
                            ? 'border-purple-600 bg-purple-950/20 opacity-75 pointer-events-none'
                            : 'border-purple-900/60 hover:border-purple-600/80 bg-[#090920]/70 hover:bg-[#0c0c2a]'
                        }`}
                      >
                        {isProcessingImage ? (
                          <div className="flex flex-col items-center gap-2 py-3">
                            <Loader2 className="w-7 h-7 text-purple-400 animate-spin" />
                            <span className="text-xs font-semibold text-purple-200">
                              Optimizing & formatting image...
                            </span>
                          </div>
                        ) : isUploadingPhoto ? (
                          <div className="flex flex-col items-center gap-2 py-3">
                            <Loader2 className="w-7 h-7 text-emerald-400 animate-spin" />
                            <span className="text-xs font-semibold text-emerald-200">
                              Uploading to Cloudinary & syncing to Firestore...
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Executing SHA-256 deduplication & ACID commit
                            </span>
                          </div>
                        ) : (
                          <>
                            <div className="w-10 h-10 rounded-xl bg-purple-900/30 border border-purple-800/40 flex items-center justify-center text-purple-400 group-hover:text-purple-300 group-hover:scale-110 transition">
                              <UploadCloud className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-white">
                                Click to choose photo or drag & drop here
                              </p>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                PNG, JPG, WEBP up to 10MB • Auto-upload to Cloudinary & Firestore
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Provide Web URL */}
                  {photoUploadMode === 'url' && (
                    <div className="space-y-2">
                      <div className="relative">
                        <input
                          type="url"
                          value={photoURL}
                          onChange={(e) => setPhotoURL(e.target.value)}
                          placeholder="https://images.unsplash.com/... or direct image link"
                          className="w-full px-4 py-3 pl-10 rounded-2xl bg-[#090920] border border-purple-900/50 text-white text-sm focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition font-mono text-xs"
                        />
                        <Link2 className="w-4 h-4 text-purple-400 absolute left-3.5 top-3.5 pointer-events-none" />
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Provide a direct link from Unsplash, Gravatar, Cloudinary, GitHub, or any public image host.
                      </p>
                    </div>
                  )}

                  {/* Active Photo Status & Controls */}
                  {photoURL ? (
                    <div className="p-3 rounded-2xl bg-purple-950/30 border border-purple-900/40 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={resolvedPhotoSrc}
                          alt="Avatar Preview"
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-xl object-cover border border-purple-400/50 shrink-0 shadow-sm"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1 truncate">
                            <Check className="w-3 h-3" />
                            <span>Photo Active</span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            Displayed on your profile, navbar, and cards
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1.5 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 text-xs font-medium border border-purple-700/50 transition cursor-pointer flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Change</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleClearPhoto}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-medium border border-rose-800/50 transition cursor-pointer flex items-center gap-1"
                          title="Clear photo and revert to initial letter avatar"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-[#090920]/60 border border-purple-950/50 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${selectedGradient.from} ${selectedGradient.to} flex items-center justify-center font-bold text-white text-xs shrink-0`}>
                        {(displayName || user?.email || 'U').charAt(0).toUpperCase()}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        No photo uploaded yet. Your initials will appear across the platform with your theme accent.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Theme & Live Preview Card */}
            <div className="space-y-6">
              {/* Avatar Theme Color */}
              <div className="p-6 rounded-3xl bg-[#070718] border border-purple-950/60 space-y-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Avatar Theme Accent
                </h4>
                <div className="flex items-center gap-3">
                  {AVATAR_GRADIENTS.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setAvatarTheme(g.id)}
                      className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${g.from} ${g.to} transition cursor-pointer border-2 ${
                        avatarTheme === g.id
                          ? 'border-white scale-110 shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      aria-label={`Select ${g.id} theme`}
                    />
                  ))}
                </div>

                {/* Live Card Preview */}
                <div className="pt-4 border-t border-purple-950/60 space-y-3">
                  <div className="text-xs font-semibold text-purple-300">
                    Live Public Identity Preview
                  </div>
                  <div className="p-4 rounded-2xl bg-[#050514] border border-purple-900/40 space-y-3">
                    <div className="flex items-center gap-3">
                      {photoURL ? (
                        <img
                          src={resolvedPhotoSrc}
                          alt={displayName}
                          referrerPolicy="no-referrer"
                          className={`w-12 h-12 rounded-xl object-cover border ${selectedGradient.border}`}
                        />
                      ) : (
                        <div
                          className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${selectedGradient.from} ${selectedGradient.to} border ${selectedGradient.border} flex items-center justify-center font-bold text-white text-lg`}
                        >
                          {(displayName || 'U').charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-white truncate">
                          {displayName || 'Your Name'}
                        </div>
                        <div className="text-[11px] text-purple-300 font-mono truncate">
                          {discipline}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 italic line-clamp-3">
                      {bio || '“No bio added yet. Share your philosophy and passion!”'}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-purple-950/60">
                      <span className="flex items-center gap-1 text-amber-300 font-mono">
                        <Coins className="w-3.5 h-3.5 text-amber-400" />
                        {displayCredits} Credits
                      </span>
                      <span className="text-slate-500">Verified Member</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 rounded-3xl bg-[#070718] border border-purple-950/60 space-y-3">
                <Button
                  type="submit"
                  variant="purple"
                  disabled={isSaving}
                  className="w-full py-3 text-sm font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{isSaving ? 'Updating Profile...' : 'Save & Publish Changes'}</span>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onNavigate('dashboard')}
                  className="w-full text-xs text-slate-400 hover:text-white"
                >
                  Return to Dashboard
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Tab 2: Credits & Mechanism Explanation */}
      {activeSubTab === 'credits' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Active Balance Card */}
            <div className="p-6 rounded-3xl bg-[#070718] border border-amber-900/40 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Coins className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Current Credit Balance
              </div>
              <div className="text-3xl sm:text-4xl font-black text-white font-mono">
                {displayCredits}
              </div>
              <p className="text-xs text-slate-400">
                Available connection credits for collaboration handshakes.
              </p>
            </div>

            {/* Proposing & Handshakes Card */}
            <div className="p-6 rounded-3xl bg-[#070718] border border-purple-950/60 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                Proposals & Handshakes
              </div>
              <div className="text-sm font-bold text-white">Free Solution Proposals</div>
              <p className="text-xs text-slate-400">
                Submitting a technical proposal is completely free. Connection credits are only utilized when a mutual handshake is confirmed.
              </p>
            </div>

            {/* Replenishment Card */}
            <div className="p-6 rounded-3xl bg-[#070718] border border-purple-950/60 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Award className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                Earn Additional Credits
              </div>
              <div className="text-sm font-bold text-white">Community Contributions</div>
              <p className="text-xs text-slate-400">
                Contributing high-quality problem blueprints and getting solutions accepted awards additional connection credits to your account.
              </p>
            </div>
          </div>

          {/* Clean Concise Overview */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#070718] border border-purple-950/60 space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-400" />
              <span>Connection Credits Overview</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-300">
              <div className="p-4 rounded-2xl bg-[#090920] border border-purple-900/40 space-y-1.5">
                <div className="font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-900/80 text-purple-300 flex items-center justify-center text-xs font-mono">
                    1
                  </span>
                  <span>Explore & Propose Freely</span>
                </div>
                <p className="text-slate-400 text-xs pl-7">
                  Every member receives complimentary credits upon joining. Browsing challenges and submitting technical proposals on The Problem Wall is free.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#090920] border border-purple-900/40 space-y-1.5">
                <div className="font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-900/80 text-purple-300 flex items-center justify-center text-xs font-mono">
                    2
                  </span>
                  <span>Verified Collaboration</span>
                </div>
                <p className="text-slate-400 text-xs pl-7">
                  When the author reviews a proposal and establishes a mutual connection handshake, direct communication is enabled between solver and author.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Account Security & Details */}
      {activeSubTab === 'account' && (
        <div className="space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-[#070718] border border-purple-950/60 space-y-6">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
              <span>Account Details & Security</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#090920] border border-purple-900/40 space-y-1">
                <div className="text-xs text-slate-400">Authenticated Email</div>
                <div className="text-sm font-bold text-white font-mono">{user?.email || 'N/A'}</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#090920] border border-purple-900/40 space-y-1">
                <div className="text-xs text-slate-400">Primary Discipline</div>
                <div className="text-sm font-bold text-purple-300">{discipline}</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#090920] border border-purple-900/40 space-y-1">
                <div className="text-xs text-slate-400">Account Status</div>
                <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Verified Member
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#090920] border border-purple-900/40 space-y-1">
                <div className="text-xs text-slate-400">Connection Credits</div>
                <div className="text-sm font-bold text-amber-300 font-mono">
                  {displayCredits} Available
                </div>
              </div>
            </div>

            {/* Database Hygiene & Optimization Status */}
            <div className="p-4 sm:p-5 rounded-2xl bg-purple-950/30 border border-purple-900/50 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Real-Time Database Optimization & Deduplication Engine</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#090920] border border-purple-900/40">
                  <span className="font-semibold text-white block mb-0.5">Zero Duplication</span>
                  <span className="text-slate-400 text-[11px]">Strict canonical UID & email indexing prevents duplicate records.</span>
                </div>
                <div className="p-3 rounded-xl bg-[#090920] border border-purple-900/40">
                  <span className="font-semibold text-white block mb-0.5">Auto-Garbage Collection</span>
                  <span className="text-slate-400 text-[11px]">Previous avatar images are automatically deleted when updated.</span>
                </div>
                <div className="p-3 rounded-xl bg-[#090920] border border-purple-900/40">
                  <span className="font-semibold text-white block mb-0.5">Cascading Deletion</span>
                  <span className="text-slate-400 text-[11px]">Account termination wipes user details & avatar files in real time.</span>
                </div>
              </div>
            </div>

            {/* Action Zone: Sign Out & Permanent Account Deletion */}
            <div className="pt-6 border-t border-purple-950/60 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-white">Sign Out of Session</h4>
                <p className="text-xs text-slate-400">
                  End your current session safely on this device.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="text-slate-300 border-slate-800 hover:bg-white/5 flex items-center gap-2 cursor-pointer self-start sm:self-auto"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </Button>
            </div>

            {/* Danger Zone: Account Deletion */}
            <div className="p-5 rounded-2xl bg-red-950/20 border border-red-900/40 space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h4 className="text-sm font-bold text-red-400 flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    <span>Danger Zone: Permanent Account & Data Deletion</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xl">
                    Permanently wipe your account profile, avatar images, and community activity records in real time. This action cannot be undone.
                  </p>
                </div>

                {!showDeleteConfirm && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-red-400 border-red-800/60 hover:bg-red-950/50 hover:text-red-300 flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Account</span>
                  </Button>
                )}
              </div>

              {showDeleteConfirm && (
                <div className="p-4 rounded-xl bg-[#08081c] border border-red-800/60 space-y-3 animate-in fade-in slide-in-from-top-1">
                  <div className="text-xs text-red-300 font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span>Confirm Irreversible Account Deletion</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    To prevent accidental deletion, please type <span className="font-mono font-bold text-red-400">DELETE</span> below:
                  </p>
                  <div className="flex flex-col sm:flex-row items-center gap-2.5">
                    <input
                      type="text"
                      value={deleteConfirmationInput}
                      onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                      placeholder="Type DELETE to confirm"
                      className="w-full sm:w-64 px-3 py-2 rounded-xl bg-[#050512] border border-red-800/60 text-white text-xs font-mono focus:outline-none focus:border-red-400"
                    />
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Button
                        type="button"
                        size="sm"
                        disabled={deleteConfirmationInput !== 'DELETE' || isDeletingAccount}
                        onClick={handleDeleteAccount}
                        className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isDeletingAccount ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        <span>{isDeletingAccount ? 'Purging Records...' : 'Permanently Delete'}</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteConfirmationInput('');
                        }}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileSettingsView;
