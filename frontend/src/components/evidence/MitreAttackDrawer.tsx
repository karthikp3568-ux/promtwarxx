import { Shield, ExternalLink, X, BookOpen, AlertCircle } from 'lucide-react';
import type { MitreTechnique } from '../../content/mitre';

interface MitreAttackDrawerProps {
  technique: MitreTechnique | null;
  onClose: () => void;
}

export default function MitreAttackDrawer({ technique, onClose }: MitreAttackDrawerProps) {
  if (!technique) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mitre-drawer-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass-strong border border-white/20 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-cyan" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-cyan bg-cyan/15 px-2.5 py-0.5 rounded-full border border-cyan/30">
                  {technique.id}
                </span>
                <span className="text-[11px] text-gray-300 font-medium">
                  {technique.matrix}
                </span>
              </div>
              <h3 id="mitre-drawer-title" className="text-lg font-extrabold text-white tracking-tight mt-1">
                {technique.name}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-full glass-pill min-h-[40px] min-w-[40px] flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tactic classification */}
        <div className="p-3 glass-reading rounded-xl border border-white/10 mb-4 text-xs flex items-center justify-between">
          <span className="text-gray-300">Tactic Category:</span>
          <span className="font-semibold text-white font-mono">{technique.tactic}</span>
        </div>

        {/* Description */}
        <div className="space-y-3 mb-5 text-sm">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-1 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-primary" /> Adversary Behavior Description
            </h4>
            <p className="text-xs text-gray-200 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/10">
              {technique.description}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-emerald-400" /> Defense & Enterprise Remediation
            </h4>
            <p className="text-xs text-emerald-200 leading-relaxed bg-emerald-950/30 p-3 rounded-xl border border-emerald-500/30">
              {technique.remediation}
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <a
            href={technique.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-cyan hover:underline font-semibold"
          >
            <span>View on {technique.matrix}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={onClose}
            className="btn-glass text-xs px-4 py-2 min-h-[40px] text-gray-200 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
