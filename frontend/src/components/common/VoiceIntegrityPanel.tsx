import { Mic, AlertTriangle } from 'lucide-react';
import type { VoiceDetails } from '../../api/types';

interface VoiceIntegrityPanelProps {
  details: VoiceDetails;
}

function getVerdictColor(verdict: string): string {
  if (verdict.includes('Strong')) return 'text-risk-high';
  if (verdict.includes('Some')) return 'text-risk-medium';
  if (verdict.includes('Inconclusive')) return 'text-risk-medium';
  return 'text-risk-low';
}

export default function VoiceIntegrityPanel({ details }: VoiceIntegrityPanelProps) {
  if (!details.model_available) {
    return (
      <div className="bg-navy-800 rounded-xl border border-navy-600 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Mic className="w-5 h-5 text-gray-500" />
          <h3 className="text-sm font-semibold text-white">Voice Integrity</h3>
        </div>
        <p className="text-sm text-gray-400">Voice integrity check unavailable</p>
      </div>
    );
  }

  return (
    <div className="bg-navy-800 rounded-xl border border-navy-600 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Mic className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-semibold text-white">Voice Integrity</h3>
      </div>

      <div className="space-y-3">
        <div>
          <p className={`text-sm font-medium ${getVerdictColor(details.voice_verdict)}`}>
            {details.voice_verdict}
          </p>
          {details.spoof_probability !== null && (
            <p className="text-xs text-gray-400 mt-1">
              Mean spoof probability: {(details.spoof_probability * 100).toFixed(1)}%
              {details.spoof_window_ratio !== null && (
                <> — {(details.spoof_window_ratio * 100).toFixed(0)}% of windows flagged</>
              )}
            </p>
          )}
        </div>

        <p className="text-xs text-gray-500">
          Analyzed {details.analyzed_seconds}s of {details.duration_seconds}s
        </p>

        {/* Caveat */}
        <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-200/80">{details.voice_caveat}</p>
        </div>
      </div>
    </div>
  );
}
