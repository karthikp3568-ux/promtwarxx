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
    <div className="bg-navy-800 rounded-xl border border-navy-600 p-8 text-center max-w-md mx-auto">
      <AlertCircle className="w-12 h-12 text-risk-high mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400 mb-4">{suggestion}</p>
      <p className="text-xs font-mono text-gray-600 mb-4">{code}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
      )}
    </div>
  );
}
