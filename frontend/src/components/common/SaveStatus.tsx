import { CheckCircle2, CloudOff, AlertCircle, RefreshCw } from 'lucide-react';

interface SaveStatusProps {
  status: 'saved' | 'skipped' | 'failed';
  onRetry?: () => void;
  retrying?: boolean;
}

export default function SaveStatus({ status, onRetry, retrying = false }: SaveStatusProps) {
  if (status === 'saved') {
    return (
      <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 rounded-lg px-3 py-1.5 w-fit">
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        <span>Report saved to your account history</span>
      </div>
    );
  }

  if (status === 'skipped') {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400 bg-navy-800 border border-navy-700 rounded-lg px-3 py-1.5 w-fit">
        <CloudOff className="w-4 h-4 shrink-0" />
        <span>Not saved — history is off in Settings</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-xs text-red-300 bg-red-950/40 border border-red-800/60 rounded-lg px-3 py-1.5 w-fit">
      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
      <span>Report not saved to history</span>
      {onRetry && (
        <button
          onClick={onRetry}
          disabled={retrying}
          className="ml-2 inline-flex items-center gap-1 font-semibold text-white bg-red-800 hover:bg-red-700 px-2 py-0.5 rounded transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${retrying ? 'animate-spin' : ''}`} />
          Retry
        </button>
      )}
    </div>
  );
}
