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
    <div className="glass-card rounded-2xl border border-white/20 p-5">
      <h3 className="text-sm font-bold text-white mb-3.5 tracking-tight">Investigation Progress</h3>
      <div className="space-y-2.5">
        {stages.map((stage) => (
          <motion.div
            key={stage.id}
            initial={prefersReducedMotion ? {} : { opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${
              stage.status === 'active' ? 'bg-white/10 border border-white/15' : ''
            }`}
          >
            {stage.status === 'done' && (
              <CheckCircle className="w-4 h-4 text-[#34D399] shrink-0" />
            )}
            {stage.status === 'active' && (
              <Loader className="w-4 h-4 text-cyan shrink-0 animate-spin" />
            )}
            {stage.status === 'pending' && (
              <Circle className="w-4 h-4 text-gray-500 shrink-0" />
            )}
            <span
              className={`text-sm font-medium ${
                stage.status === 'done'
                  ? 'text-gray-300'
                  : stage.status === 'active'
                  ? 'text-white font-bold'
                  : 'text-gray-500'
              }`}
            >
              {stageLabels[stage.id] || stage.label}
            </span>
            {stage.detail && stage.status === 'active' && (
              <span className="text-xs text-cyan/90 font-medium">— {stage.detail}</span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
