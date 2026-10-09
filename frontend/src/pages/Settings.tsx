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
} from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import ConfirmDialog from '../components/history/ConfirmDialog';
import GuestUpgradeBanner from '../components/auth/GuestUpgradeBanner';

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
      const res = await fetch('/api/history', {
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
    <div className="w-full max-w-4xl space-y-8">
      <div className="flex items-center gap-3">
        <SettingsIcon className="w-7 h-7 text-primary" />
        <h1 className="text-2xl font-bold text-white">Settings</h1>
      </div>

      {isGuest && (
        <GuestUpgradeBanner />
      )}

      {/* Account Info */}
      <section className="bg-navy-800 border border-navy-700 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-primary" />
          Account
        </h2>
        <div className="space-y-2 text-sm text-gray-300">
          <div className="flex justify-between py-1 border-b border-navy-700">
            <span className="text-gray-400">Account Type</span>
            <span className="font-medium text-white">
              {isGuest ? 'Guest Session' : 'Registered User'}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-navy-700">
            <span className="text-gray-400">Email</span>
            <span className="font-mono text-white">
              {user?.email || 'None (Anonymous)'}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-navy-700">
            <span className="text-gray-400">User ID</span>
            <span className="font-mono text-xs text-gray-400">{user?.uid}</span>
          </div>
        </div>

        {isGuest && (
          <div className="pt-2">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Create an account
            </Link>
          </div>
        )}
      </section>

      {/* Privacy & History Preferences */}
      <section className="bg-navy-800 border border-navy-700 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Privacy & Storage</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-white">Save analysis history</p>
            <p className="text-sm text-gray-400">
              When disabled, analyses are assessed in real-time but not stored in Firestore.
            </p>
          </div>
          <button
            onClick={handleToggleHistory}
            disabled={savingPref}
            className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg bg-navy-750 hover:bg-navy-700 text-white transition-colors disabled:opacity-50"
            aria-label="Toggle history saving"
          >
            {savingPref ? (
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            ) : profile.saveAnalysisHistory ? (
              <ToggleRight className="w-8 h-8 text-primary" />
            ) : (
              <ToggleLeft className="w-8 h-8 text-gray-500" />
            )}
            <span className="w-16 text-left">
              {profile.saveAnalysisHistory ? 'Enabled' : 'Disabled'}
            </span>
          </button>
        </div>

        {prefFeedback && (
          <div className="flex items-center gap-2 text-sm text-emerald-400 mt-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{prefFeedback}</span>
          </div>
        )}
      </section>

      {/* Danger Zone */}
      <section className="bg-navy-800 border border-red-900/40 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-red-400 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-400" />
          Danger Zone
        </h2>
        <p className="text-sm text-gray-400">
          Permanently remove your analysis data or sign out of your session.
        </p>

        {deleteError && (
          <p className="text-sm text-red-400">{deleteError}</p>
        )}

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button
            onClick={() => setDeleteDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-red-950/60 hover:bg-red-900/80 border border-red-800 text-red-200 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete all history
          </button>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-navy-700 hover:bg-navy-600 text-gray-300 hover:text-white rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
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
