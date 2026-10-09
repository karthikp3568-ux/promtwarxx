import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle2, ArrowLeft, Loader2, KeyRound } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;
    setLoading(true);
    try {
      await resetPassword(email.trim());
    } finally {
      setSubmitted(true);
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto py-8 sm:py-16">
      <div className="glass-strong border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="w-10 h-10 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-3">
          <KeyRound className="w-5 h-5 text-primary" />
        </div>

        <h2 className="text-2xl font-extrabold text-white mb-2 text-center tracking-tight">
          Reset Your <span className="text-gradient-primary">Password</span>
        </h2>
        <p className="text-xs sm:text-sm text-gray-300 mb-6 text-center leading-relaxed">
          Enter your registered email address to receive a secure recovery link.
        </p>

        {submitted ? (
          <div className="space-y-6 text-center">
            <div className="p-4 glass-reading border border-emerald-500/40 rounded-2xl text-emerald-200 text-xs sm:text-sm flex items-start gap-3 text-left">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
              <span>
                If an account exists for that email, we have dispatched a password reset link. Please check your inbox and spam folder.
              </span>
            </div>

            <Link
              to="/login"
              className="btn-glass inline-flex items-center justify-center gap-2 text-sm text-white font-semibold min-h-[44px] px-6 py-2.5 w-full"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-cyan absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full glass-reading border border-white/20 rounded-xl pl-10 pr-4 py-2.5 min-h-[44px] text-sm text-white placeholder-gray-400 focus:outline-none focus:border-cyan"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 min-h-[48px] text-sm font-bold tracking-wide mt-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Send Reset Link</span>
            </button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="text-xs text-gray-300 hover:text-white inline-flex items-center gap-1.5 min-h-[44px] py-2 px-3"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
