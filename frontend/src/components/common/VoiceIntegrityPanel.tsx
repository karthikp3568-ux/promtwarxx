import { Mic, AlertTriangle } from 'lucide-react';
import type { VoiceDetails } from '../../api/types';

interface VoiceIntegrityPanelProps {
  details: VoiceDetails;
}

function getVerdictStyle(verdict: string): { text: string; bg: string; border: string } {
  if (verdict.includes('Strong')) return { text: 'text-[#FB923C]', bg: 'bg-[#FB923C]/20', border: 'border-[#FB923C]/40' };
  if (verdict.includes('Some') || verdict.includes('Inconclusive')) return { text: 'text-[#FBBF24]', bg: 'bg-[#FBBF24]/20', border: 'border-[#FBBF24]/40' };
  return { text: 'text-[#34D399]', bg: 'bg-[#34D399]/20', border: 'border-[#34D399]/40' };
}

export default function VoiceIntegrityPanel({ details }: VoiceIntegrityPanelProps) {
  if (!details.model_available) {
    return (
      <div className="glass-card rounded-2xl border border-white/20 p-5">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
            <Mic className="w-4 h-4 text-gray-400" />
          </div>
          <h3 className="text-sm font-bold text-white tracking-tight">Voice Integrity Analysis</h3>
        </div>
        <p className="text-xs text-gray-400">Voice integrity verification model is unavailable for this session.</p>
      </div>
    );
  }

  const verdictStyle = getVerdictStyle(details.voice_verdict);

  return (
    <div className="glass-card rounded-2xl border border-white/20 p-5">
      <div className="flex items-center gap-2.5 mb-3.5">
        <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
          <Mic className="w-4 h-4 text-primary" />
        </div>
        <h3 className="text-sm font-bold text-white tracking-tight">Voice Integrity Analysis</h3>
      </div>

      <div className="space-y-3.5">
        <div className={`p-3 rounded-xl border ${verdictStyle.bg} ${verdictStyle.border}`}>
          <p className={`text-sm font-bold ${verdictStyle.text}`}>
            {details.voice_verdict}
          </p>
          {details.spoof_probability !== null && (
            <p className="text-xs text-gray-200 mt-1">
              Mean synthetic probability: {(details.spoof_probability * 100).toFixed(1)}%
              {details.spoof_window_ratio !== null && (
                <> — {(details.spoof_window_ratio * 100).toFixed(0)}% of windows flagged</>
              )}
            </p>
          )}
        </div>

        <p className="text-xs text-gray-400">
          Analyzed {details.analyzed_seconds}s of {details.duration_seconds}s audio duration
        </p>

        {/* Caveat */}
        {details.voice_caveat && (
          <div className="glass-pill bg-amber-500/10 border-amber-500/30 p-3 rounded-xl flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200/90 leading-relaxed">{details.voice_caveat}</p>
          </div>
        )}
      </div>
    </div>
  );
}
