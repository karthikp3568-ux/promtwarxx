import { useState } from 'react';
import { ChevronDown, ChevronUp, Bot, Code, Layers } from 'lucide-react';
import type { Factor, Severity } from '../../api/types';
import MitreBadge from './MitreBadge';
import type { MitreTechnique } from '../../content/mitre';

interface EvidenceCardProps {
  factor: Factor;
  index: number;
  onSelectMitre?: (technique: MitreTechnique) => void;
}

const severityBorder: Record<Severity, string> = {
  LOW: 'border-[#34D399]/40 hover:border-[#34D399]/60',
  MEDIUM: 'border-[#FBBF24]/40 hover:border-[#FBBF24]/60',
  HIGH: 'border-[#FB923C]/40 hover:border-[#FB923C]/60',
};

const severityBadge: Record<Severity, string> = {
  LOW: 'bg-[#34D399]/20 text-[#34D399] border-[#34D399]/30',
  MEDIUM: 'bg-[#FBBF24]/20 text-[#FBBF24] border-[#FBBF24]/30',
  HIGH: 'bg-[#FB923C]/20 text-[#FB923C] border-[#FB923C]/30',
};

const sourceConfig = {
  deterministic: { label: 'Detected by code', icon: Code, color: 'text-cyan-400 bg-cyan-400/15 border-cyan-400/30' },
  ai: { label: 'AI assessment', icon: Bot, color: 'text-purple-400 bg-purple-400/15 border-purple-400/30' },
  combined: { label: 'Combined pattern', icon: Layers, color: 'text-amber-400 bg-amber-400/15 border-amber-400/30' },
};

export default function EvidenceCard({ factor, index, onSelectMitre }: EvidenceCardProps) {
  const [expanded, setExpanded] = useState(false);
  const source = sourceConfig[factor.source];
  const SourceIcon = source.icon;

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className={`glass-card p-4 rounded-2xl cursor-pointer transition-all duration-200 border ${severityBorder[factor.severity]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="text-xs font-mono text-cyan/80 bg-white/10 px-2 py-0.5 rounded-md mt-0.5 shrink-0">
            #{String(index + 1).padStart(2, '0')}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h3 className="text-sm font-bold text-white tracking-tight">{factor.title}</h3>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold border ${severityBadge[factor.severity]}`}>
                {factor.severity} ({factor.weight} pts)
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full border ${source.color}`}>
                <SourceIcon className="w-3 h-3" />
                <span>{source.label}</span>
              </div>
              {onSelectMitre && (
                <MitreBadge factorCode={factor.code} onSelect={onSelectMitre} />
              )}
            </div>
          </div>
        </div>
        <button
          type="button"
          aria-label={expanded ? 'Collapse details' : 'Expand details'}
          className="shrink-0 text-gray-400 hover:text-white p-1 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3.5 pt-3 border-t border-white/15 space-y-2.5">
          <p className="text-sm text-gray-200 leading-relaxed">{factor.why_it_matters}</p>
          {factor.evidence && (
            <div className="glass-reading p-3 rounded-xl border border-white/10 text-xs text-gray-300 font-mono break-all">
              <span className="text-cyan block mb-1 font-sans text-xs font-semibold">Evidence Quote:</span>
              &ldquo;{factor.evidence}&rdquo;
            </div>
          )}
        </div>
      )}
    </div>
  );
}
