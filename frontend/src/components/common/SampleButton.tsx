import { FlaskConical } from 'lucide-react';

interface SampleButtonProps {
  onClick: () => void;
  loading?: boolean;
  label?: string;
}

export default function SampleButton({ onClick, loading = false, label = 'Try a sample' }: SampleButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] bg-navy-700 hover:bg-navy-600 border border-navy-600 text-gray-200 hover:text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
    >
      <FlaskConical className="w-4 h-4 text-primary" />
      {loading ? 'Loading sample...' : label}
    </button>
  );
}
