import { ShieldAlert, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function GuestUpgradeBanner() {
  return (
    <div className="glass-card rounded-2xl border-amber-500/40 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm shadow-lg">
      <div className="flex items-start sm:items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <span className="font-bold text-amber-300">Guest Session Active:</span>{' '}
          <span className="text-gray-200">
            Create an account to permanently keep your analysis history. Signing out loses guest history.
          </span>
        </div>
      </div>
      <Link
        to="/settings"
        className="btn-primary text-xs font-bold px-4 py-2 min-h-[40px] shrink-0"
      >
        <span>Create Account</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
