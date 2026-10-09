import { Brain, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { Factor } from '../../api/types';

interface ReasoningPanelProps {
  reasoning: string;
  factors: Factor[];
}

export default function ReasoningPanel({ reasoning, factors }: ReasoningPanelProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="glass-reading rounded-3xl border border-white/20 overflow-hidden shadow-xl">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-white/5"
      >
        <div className="flex items-center gap-3">
          <div className="icon-tile icon-tile-gradient w-9 h-9 rounded-xl flex items-center justify-center shrink-0">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">AI Security Reasoning</h3>
            <p className="text-xs text-gray-300">
              Identified {factors.length} verifiable signal{factors.length !== 1 ? 's' : ''} in the submitted context
            </p>
          </div>
        </div>
        <div className="p-1 rounded-lg text-gray-400">
          {expanded ? <ChevronUp className="w-5 h-5 text-gray-300" /> : <ChevronDown className="w-5 h-5 text-gray-300" />}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 pt-1">
          <div className="p-4 rounded-2xl bg-black/20 border border-white/10 text-gray-100 leading-relaxed text-sm whitespace-pre-wrap font-sans">
            {reasoning}
          </div>
        </div>
      )}
    </div>
  );
}
