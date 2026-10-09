import { AlertCircle, RefreshCw } from 'lucide-react';
import { ERROR_INFO } from '../../api/types';

interface ErrorStateProps {
  code: string;
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({ code, message, onRetry }: ErrorStateProps) {
  const info = ERROR_INFO[code];
  const title = info?.title || 'Something went wrong';
  const suggestion = info?.suggestion || message || 'Please try again.';

  return (
    <div className="glass-card rounded-3xl border border-[#F43F5E]/30 p-8 text-center max-w-md mx-auto shadow-2xl">
      <div className="icon-tile w-14 h-14 rounded-2xl bg-[#F43F5E]/20 mx-auto mb-4 flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-[#F43F5E]" />
      </div>
      <h3 className="text-lg font-extrabold text-white mb-2 tracking-tight">{title}</h3>
      <p className="text-sm text-gray-300 mb-4 leading-relaxed">{suggestion}</p>
      <span className="glass-pill px-3 py-1 text-xs font-mono text-gray-400 mb-6 inline-block">
        {code}
      </span>
      {onRetry && (
        <div>
          <button
            onClick={onRetry}
            className="btn-primary text-sm px-5 py-2.5 min-h-[44px]"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try again</span>
          </button>
        </div>
      )}
    </div>
  );
}
