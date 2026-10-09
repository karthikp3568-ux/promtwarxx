import { useState } from 'react';
import { MailCheck, RefreshCw } from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';

export default function VerifyEmailBanner() {
  const { user, resendVerification } = useAuth();
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  if (!user || user.isAnonymous || user.emailVerified) {
    return null;
  }

  const handleResend = async () => {
    setSending(true);
    try {
      await resendVerification();
      setSent(true);
      setTimeout(() => setSent(false), 5000);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-blue-950/40 border border-blue-700/60 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm mb-6">
      <div className="flex items-start sm:items-center gap-3">
        <MailCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5 sm:mt-0" />
        <div>
          <span className="font-semibold text-blue-300">Email Verification Required:</span>{' '}
          <span className="text-gray-300">
            We sent a verification link to <span className="text-white font-mono">{user.email}</span>.
          </span>
        </div>
      </div>
      <button
        onClick={handleResend}
        disabled={sending || sent}
        className="shrink-0 inline-flex items-center gap-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-2 min-h-[44px] rounded-lg transition-colors"
      >
        <RefreshCw className={`w-4 h-4 ${sending ? 'animate-spin' : ''}`} />
        {sent ? 'Verification Sent!' : 'Resend Email'}
      </button>
    </div>
  );
}
