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
      className="btn-glass text-sm px-5 py-2 min-h-[44px] text-gray-100 hover:text-white"
    >
      <FlaskConical className="w-4 h-4 text-cyan" />
      <span>{loading ? 'Loading sample...' : label}</span>
    </button>
  );
}
