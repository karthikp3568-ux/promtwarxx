import { ShieldAlert, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function GuestUpgradeBanner() {
  return (
    <div className="bg-amber-950/30 border border-amber-700/60 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm">
      <div className="flex items-start sm:items-center gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
        <div>
          <span className="font-semibold text-amber-300">Guest Session Active:</span>{' '}
          <span className="text-gray-300">
            Create an account to permanently keep your analysis history. Signing out loses guest history.
          </span>
        </div>
      </div>
      <Link
        to="/settings"
        className="shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-500 px-4 py-2 min-h-[44px] rounded-lg transition-colors"
      >
        Create Account
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
