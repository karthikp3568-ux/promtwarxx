import { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  requireTypedConfirmation?: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  requireTypedConfirmation,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const isConfirmed = requireTypedConfirmation
    ? typed.trim().toLowerCase() === requireTypedConfirmation.toLowerCase()
    : true;

  const handleConfirm = async () => {
    if (!isConfirmed || loading) return;
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="glass-strong border border-white/20 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl">
        <div className="flex items-center gap-3 mb-4 text-[#F43F5E]">
          <div className="icon-tile w-10 h-10 rounded-xl bg-[#F43F5E]/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-[#F43F5E]" />
          </div>
          <h3 className="text-lg font-extrabold text-white tracking-tight">{title}</h3>
        </div>

        <p className="text-sm text-gray-200 mb-6 leading-relaxed">{message}</p>

        {requireTypedConfirmation && (
          <div className="mb-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
              Type <span className="font-mono text-cyan font-bold">{requireTypedConfirmation}</span> to confirm:
            </label>
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={requireTypedConfirmation}
              className="w-full glass-reading border border-white/20 rounded-xl px-4 py-2.5 min-h-[44px] text-sm text-white focus:outline-none focus:border-cyan"
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="btn-glass text-sm px-5 py-2.5 min-h-[44px] text-gray-300 hover:text-white"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isConfirmed || loading}
            className="px-5 py-2.5 min-h-[44px] rounded-full text-sm font-bold text-white bg-[#F43F5E] hover:bg-rose-500 transition-colors shadow-lg disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
