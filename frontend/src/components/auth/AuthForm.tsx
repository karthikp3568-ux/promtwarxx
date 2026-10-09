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
    <div className="w-full max-w-md mx-auto bg-navy-800 border border-navy-600 rounded-2xl p-6 sm:p-8 shadow-xl">
      <h2 className="text-2xl font-bold text-white mb-2 text-center">
        {mode === 'login' ? 'Sign In to TrustGuard' : 'Create an Account'}
      </h2>
      <p className="text-sm text-gray-300 mb-6 text-center leading-relaxed">
        {mode === 'login'
          ? 'Access your saved security analysis reports'
          : 'Protect your digital interactions with AI security'}
      </p>

      {error && (
        <div className="mb-6 p-3 bg-red-950/40 border border-red-800 rounded-xl text-sm text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'register' && (
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1">Display Name</label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full bg-navy-900 border border-navy-600 rounded-xl pl-10 pr-4 py-2.5 min-h-[44px] text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-1">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
              className="w-full bg-navy-900 border border-navy-600 rounded-xl pl-10 pr-4 py-2.5 min-h-[44px] text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-1">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-navy-900 border border-navy-600 rounded-xl pl-10 pr-4 py-2.5 min-h-[44px] text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 bg-primary hover:bg-blue-600 text-white font-semibold py-3 min-h-[44px] rounded-xl text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      {onGuestClick && (
        <div className="mt-6 pt-6 border-t border-navy-700 text-center">
          <p className="text-sm text-gray-300 mb-3 font-medium">Testing or evaluating TrustGuard?</p>
          <button
            type="button"
            onClick={onGuestClick}
            disabled={loading}
            className="w-full bg-navy-700 hover:bg-navy-600 border border-navy-600 text-gray-200 font-semibold py-3 min-h-[44px] rounded-xl text-sm transition-colors"
          >
            Continue as Guest
          </button>
        </div>
      )}
    </div>
  );
}
