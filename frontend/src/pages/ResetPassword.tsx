import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';
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
      <div className="bg-navy-800 border border-navy-600 rounded-xl p-8 shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-2 text-center">Reset Password</h2>
        <p className="text-sm text-gray-400 mb-6 text-center">
          Enter your email to receive a password reset link
        </p>

        {submitted ? (
          <div className="space-y-6 text-center">
            <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-300 text-sm flex items-start gap-3 text-left">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
              <span>
                If an account exists for that email, we've sent a reset link. Check your inbox and spam folder.
              </span>
            </div>

            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full bg-navy-900 border border-navy-600 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-blue-600 text-white font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Send Reset Link
            </button>

            <div className="text-center pt-2">
              <Link to="/login" className="text-xs text-gray-400 hover:text-white inline-flex items-center gap-1">
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
