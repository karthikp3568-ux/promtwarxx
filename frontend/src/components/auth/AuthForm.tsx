import { useState } from 'react';
import { Mail, Lock, User as UserIcon, Loader2 } from 'lucide-react';

interface AuthFormProps {
  mode: 'login' | 'register';
  onSubmit: (email: string, password: string, displayName?: string) => Promise<void>;
  onGuestClick?: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

export default function AuthForm({
  mode,
  onSubmit,
  onGuestClick,
  loading,
  error,
}: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email, password, displayName);
  };

  return (
    <div className="w-full max-w-md mx-auto glass-strong border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl">
      <h2 className="text-2xl font-extrabold text-white mb-2 text-center tracking-tight">
        {mode === 'login' ? 'Sign In to ' : 'Create Your '}
        <span className="text-gradient-primary">TrustGuard</span>
      </h2>
      <p className="text-xs sm:text-sm text-gray-300 mb-6 text-center leading-relaxed">
        {mode === 'login'
          ? 'Access your saved security analysis reports across devices'
          : 'Protect your digital interactions with private AI reasoning'}
      </p>

      {error && (
        <div className="mb-6 p-3.5 glass-pill bg-[#F43F5E]/20 border-[#F43F5E]/50 text-xs sm:text-sm text-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'register' && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
              Display Name
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-cyan absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full glass-reading border border-white/20 rounded-xl pl-10 pr-4 py-2.5 min-h-[44px] text-sm text-white placeholder-gray-400 focus:outline-none focus:border-cyan"
              />
            </div>
          </div>
        )}

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

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-cyan absolute left-3.5 top-3.5" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
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
          <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
        </button>

        {onGuestClick && (
          <div className="pt-2">
            <div className="relative my-4 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/15" />
              </div>
              <span className="relative glass-pill px-3 py-0.5 text-xs text-gray-400">or</span>
            </div>
            <button
              type="button"
              onClick={onGuestClick}
              disabled={loading}
              className="btn-glass w-full py-2.5 min-h-[44px] text-sm font-semibold text-gray-200 hover:text-white"
            >
              Continue as Guest
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
