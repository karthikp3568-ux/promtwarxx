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
    <div className="bg-navy-800 rounded-xl border border-navy-600 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-white">
            AI Reasoning
            <span className="text-gray-400 font-normal ml-2">
              — I identified {factors.length} signal{factors.length !== 1 ? 's' : ''} contributing to this assessment
            </span>
          </h3>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4">
          <p className="text-sm text-gray-300 leading-relaxed">{reasoning}</p>
        </div>
      )}
    </div>
  );
}
