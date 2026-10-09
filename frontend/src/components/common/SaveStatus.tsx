import { CheckCircle2, CloudOff, AlertCircle, RefreshCw } from 'lucide-react';

interface SaveStatusProps {
  status: 'saved' | 'skipped' | 'failed';
  onRetry?: () => void;
  retrying?: boolean;
}

export default function SaveStatus({ status, onRetry, retrying = false }: SaveStatusProps) {
  if (status === 'saved') {
    return (
      <div className="glass-pill bg-[#34D399]/15 border-[#34D399]/40 px-3.5 py-1.5 flex items-center gap-2 text-xs font-semibold text-[#34D399] w-fit">
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        <span>Report saved to account history</span>
      </div>
    );
  }

  if (status === 'skipped') {
    return (
      <div className="glass-pill bg-white/10 border-white/20 px-3.5 py-1.5 flex items-center gap-2 text-xs font-medium text-gray-300 w-fit">
        <CloudOff className="w-4 h-4 shrink-0 text-gray-400" />
        <span>Not saved — history is disabled in Settings</span>
      </div>
    );
  }

  return (
    <div className="glass-pill bg-[#F43F5E]/15 border-[#F43F5E]/40 px-3.5 py-1.5 flex items-center gap-2 text-xs font-semibold text-[#F43F5E] w-fit">
      <AlertCircle className="w-4 h-4 shrink-0" />
      <span>Report not saved to history</span>
      {onRetry && (
        <button
          onClick={onRetry}
          disabled={retrying}
          className="ml-2 inline-flex items-center gap-1 font-bold text-white bg-[#F43F5E]/80 hover:bg-[#F43F5E] px-2.5 py-0.5 rounded-full transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${retrying ? 'animate-spin' : ''}`} />
          Retry
        </button>
      )}
    </div>
  );
}
