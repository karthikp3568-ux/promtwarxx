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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-navy-800 border border-navy-600 rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4 text-red-400">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <h3 className="text-lg font-bold text-white">{title}</h3>
        </div>

        <p className="text-sm text-gray-300 mb-6 leading-relaxed">{message}</p>

        {requireTypedConfirmation && (
          <div className="mb-6">
            <label className="block text-sm text-gray-300 font-medium mb-2">
              Type <span className="font-mono text-white font-bold">{requireTypedConfirmation}</span> to confirm:
            </label>
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={requireTypedConfirmation}
              className="w-full bg-navy-900 border border-navy-600 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-mono min-h-[44px]"
            />
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-2.5 min-h-[44px] text-sm font-semibold text-gray-300 hover:text-white bg-navy-700 hover:bg-navy-600 rounded-xl transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isConfirmed || loading}
            className="px-5 py-2.5 min-h-[44px] text-sm text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 font-semibold rounded-xl transition-colors flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
