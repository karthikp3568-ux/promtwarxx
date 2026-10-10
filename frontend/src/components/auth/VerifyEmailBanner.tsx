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
    <div className="glass-card rounded-2xl border-cyan/40 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm mb-6 shadow-lg">
      <div className="flex items-start sm:items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-cyan/20 flex items-center justify-center shrink-0">
          <MailCheck className="w-4 h-4 text-cyan" />
        </div>
        <div>
          <span className="font-bold text-cyan">Email Verification Required:</span>{' '}
          <span className="text-gray-200">
            We sent a verification link to <span className="text-white font-mono break-all">{user.email}</span>.
          </span>
        </div>
      </div>
      <button
        onClick={handleResend}
        disabled={sending || sent}
        className="btn-glass text-xs font-bold px-4 py-2 min-h-[40px] shrink-0 text-white"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${sending ? 'animate-spin' : ''}`} />
        <span>{sent ? 'Verification Sent!' : 'Resend Email'}</span>
      </button>
    </div>
  );
}
