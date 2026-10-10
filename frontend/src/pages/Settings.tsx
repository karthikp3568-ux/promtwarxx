import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  ToggleLeft,
  ToggleRight,
  Trash2,
  LogOut,
  UserCheck,
  UserPlus,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  Lock,
  Mail,
  Fingerprint,
} from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import ConfirmDialog from '../components/history/ConfirmDialog';
import GuestUpgradeBanner from '../components/auth/GuestUpgradeBanner';
import { API_BASE } from '../api/client';


export default function Settings() {
  const { user, isGuest, profile, updatePreferences, signOut } = useAuth();
  const navigate = useNavigate();
  const [savingPref, setSavingPref] = useState(false);
  const [prefFeedback, setPrefFeedback] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleToggleHistory = async () => {
    setSavingPref(true);
    setPrefFeedback(null);
    try {
      const nextVal = !profile.saveAnalysisHistory;
      await updatePreferences(nextVal);
      setPrefFeedback(nextVal ? 'History saving enabled.' : 'History saving disabled.');
      setTimeout(() => setPrefFeedback(null), 3000);
    } catch {
      setPrefFeedback('Failed to update preference.');
    } finally {
      setSavingPref(false);
    }
  };

  const handleDeleteAllHistory = async () => {
    setDeleteError(null);
    try {
      if (!user) return;
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE}/history`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to delete history');
      }
      setDeleteDialogOpen(false);
      navigate('/history');
    } catch {
      setDeleteError('Could not delete history. Please try again.');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Page Header Card */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border-white/20 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="icon-tile icon-tile-gradient w-12 h-12 rounded-2xl flex items-center justify-center shrink-0">
            <SettingsIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">Account & Settings</h1>
            <p className="text-xs sm:text-sm text-gray-300">Manage your session, privacy preferences, and stored security analysis logs.</p>
          </div>
        </div>
      </div>

      {isGuest && (
        <GuestUpgradeBanner />
      )}

      {/* Account Info Card */}
      <section className="glass-card rounded-2xl p-6 sm:p-7 border-white/15 space-y-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-cyan/20 flex items-center justify-center shrink-0">
            <UserCheck className="w-4 h-4 text-cyan" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">Account Information</h2>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-white/10 gap-1">
            <span className="text-gray-300 flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-gray-400" /> Account Type
            </span>
            <span className="font-semibold text-white">
              {isGuest ? (
                <span className="glass-pill px-3 py-0.5 text-xs text-amber-300 border-amber-500/30">
                  Guest Session
                </span>
              ) : (
                <span className="glass-pill px-3 py-0.5 text-xs text-emerald-300 border-emerald-500/30">
                  Registered User
                </span>
              )}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-white/10 gap-1">
            <span className="text-gray-300 flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" /> Email Address
            </span>
            <span className="font-mono text-white text-xs sm:text-sm">
              {user?.email || 'Anonymous Guest'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-white/10 gap-1">
            <span className="text-gray-300 flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-400" /> User Identifier (UID)
            </span>
            <span className="font-mono text-xs text-gray-400 truncate max-w-xs">{user?.uid}</span>
          </div>
        </div>

        {isGuest && (
          <div className="pt-2">
            <Link
              to="/register"
              className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] text-sm font-bold shadow-lg"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create an Account</span>
            </Link>
          </div>
        )}
      </section>

      {/* Privacy & History Preferences Card */}
      <section className="glass-card rounded-2xl p-6 sm:p-7 border-white/15 space-y-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4 text-purple-400" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">Privacy & Storage</h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 glass-reading rounded-xl border border-white/15">
          <div className="space-y-1">
            <p className="font-bold text-white text-sm">Save analysis history to Firestore</p>
            <p className="text-xs text-gray-300 leading-relaxed max-w-md">
              When disabled, assessments are reasoned and presented in memory without saving report records to your cloud profile.
            </p>
          </div>
          <button
            onClick={handleToggleHistory}
            disabled={savingPref}
            className="btn-glass flex items-center justify-center gap-2 text-sm px-4 py-2 min-h-[44px] text-white disabled:opacity-50 shrink-0"
            aria-label="Toggle history saving"
          >
            {savingPref ? (
              <Loader2 className="w-5 h-5 text-cyan animate-spin" />
            ) : profile.saveAnalysisHistory ? (
              <ToggleRight className="w-7 h-7 text-emerald-400" />
            ) : (
              <ToggleLeft className="w-7 h-7 text-gray-400" />
            )}
            <span className="font-semibold">
              {profile.saveAnalysisHistory ? 'Enabled' : 'Disabled'}
            </span>
          </button>
        </div>

        {prefFeedback && (
          <div className="flex items-center gap-2 text-sm text-emerald-400 mt-2 glass-pill px-3 py-1.5 w-fit border-emerald-500/30">
            <CheckCircle2 className="w-4 h-4" />
            <span>{prefFeedback}</span>
          </div>
        )}
      </section>

      {/* Danger Zone Card */}
      <section className="glass-card rounded-2xl p-6 sm:p-7 border-[#F43F5E]/30 space-y-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#F43F5E]/20 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4 h-4 text-[#F43F5E]" />
          </div>
          <h2 className="text-lg font-bold text-rose-300 tracking-tight">Danger Zone</h2>
        </div>

        <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
          Permanently purge all saved analysis indicators, threat timeline events, and What-If branches from your account.
        </p>

        {deleteError && (
          <div className="p-3 rounded-xl bg-[#F43F5E]/20 border border-[#F43F5E]/40 text-xs text-rose-200">
            {deleteError}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button
            onClick={() => setDeleteDialogOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 min-h-[44px] text-sm font-semibold rounded-full bg-[#F43F5E]/20 hover:bg-[#F43F5E]/30 border border-[#F43F5E]/50 text-rose-200 transition-colors shadow-md"
          >
            <Trash2 className="w-4 h-4 text-[#F43F5E]" />
            <span>Delete All History</span>
          </button>

          <button
            onClick={handleSignOut}
            className="btn-glass flex items-center gap-2 px-5 py-2.5 min-h-[44px] text-sm font-semibold text-gray-200 hover:text-white"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </section>

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title="Delete all analysis history?"
        message="This action will permanently delete all saved analyses and simulated attack paths for your account. This cannot be undone."
        confirmText="Delete All"
        requireTypedConfirmation="DELETE"
        onConfirm={handleDeleteAllHistory}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </div>
  );
}
