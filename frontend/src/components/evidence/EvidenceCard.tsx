import { useState } from 'react';
import { ChevronDown, ChevronUp, Bot, Code, Layers } from 'lucide-react';
import type { Factor, Severity } from '../../api/types';

interface EvidenceCardProps {
  factor: Factor;
  index: number;
}

const severityColors: Record<Severity, string> = {
  LOW: 'border-risk-low/40 bg-risk-low/5',
  MEDIUM: 'border-risk-medium/40 bg-risk-medium/5',
  HIGH: 'border-risk-high/40 bg-risk-high/5',
};

const severityBadge: Record<Severity, string> = {
  LOW: 'bg-risk-low/20 text-risk-low',
  MEDIUM: 'bg-risk-medium/20 text-risk-medium',
  HIGH: 'bg-risk-high/20 text-risk-high',
};

const sourceConfig = {
  deterministic: { label: 'Detected by code', icon: Code, color: 'text-blue-400 bg-blue-400/10' },
  ai: { label: 'AI assessment', icon: Bot, color: 'text-purple-400 bg-purple-400/10' },
  combined: { label: 'Combined pattern', icon: Layers, color: 'text-amber-400 bg-amber-400/10' },
};

export default function EvidenceCard({ factor, index }: EvidenceCardProps) {
  const [expanded, setExpanded] = useState(false);
  const source = sourceConfig[factor.source];
  const SourceIcon = source.icon;

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className={`w-full text-left rounded-lg border p-4 transition-colors ${severityColors[factor.severity]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="text-sm font-mono text-gray-500 mt-0.5 shrink-0">
            {String(index + 1).padStart(2, '0')}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-white">{factor.title}</h3>
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${severityBadge[factor.severity]}`}>
                {factor.severity} ({factor.weight})
              </span>
            </div>
            <div className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${source.color}`}>
              <SourceIcon className="w-3 h-3" />
              {source.label}
            </div>
          </div>
        </div>
        <div className="shrink-0 text-gray-500">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {expanded && (
        <div className="mt-3 ml-8 space-y-2">
          <p className="text-sm text-gray-300">{factor.why_it_matters}</p>
          {factor.evidence && (
            <blockquote className="text-sm text-gray-300 border-l-2 border-navy-600 pl-3 font-mono">
              {factor.evidence}
            </blockquote>
          )}
        </div>
      )}
    </button>
  );
}
