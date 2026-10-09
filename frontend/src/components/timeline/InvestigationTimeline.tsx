import { motion, useReducedMotion } from 'motion/react';
import { CheckCircle, Loader, Circle } from 'lucide-react';

export interface TimelineStage {
  id: string;
  label: string;
  detail?: string;
  status: 'pending' | 'active' | 'done';
}

interface InvestigationTimelineProps {
  stages: TimelineStage[];
}

const stageLabels: Record<string, string> = {
  received: 'Request received',
  extracting: 'Extracting content',
  checking: 'Running checks',
  reasoning: 'AI reasoning',
  scoring: 'Computing risk score',
};

export default function InvestigationTimeline({ stages }: InvestigationTimelineProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="bg-navy-800 rounded-xl border border-navy-600 p-4">
      <h3 className="text-sm font-semibold text-white mb-3">Investigation Progress</h3>
      <div className="space-y-2">
        {stages.map((stage) => (
          <motion.div
            key={stage.id}
            initial={prefersReducedMotion ? {} : { opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3"
          >
            {stage.status === 'done' && (
              <CheckCircle className="w-4 h-4 text-risk-low shrink-0" />
            )}
            {stage.status === 'active' && (
              <Loader className="w-4 h-4 text-primary shrink-0 animate-spin" />
            )}
            {stage.status === 'pending' && (
              <Circle className="w-4 h-4 text-gray-600 shrink-0" />
            )}
            <span className={`text-sm ${
              stage.status === 'done' ? 'text-gray-400' :
              stage.status === 'active' ? 'text-white' : 'text-gray-600'
            }`}>
              {stageLabels[stage.id] || stage.label}
            </span>
            {stage.detail && stage.status === 'active' && (
              <span className="text-xs text-gray-500">— {stage.detail}</span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
