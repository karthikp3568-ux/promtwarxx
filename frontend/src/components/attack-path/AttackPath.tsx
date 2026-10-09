import { useState } from 'react';
import { AlertTriangle, Shield, ChevronRight } from 'lucide-react';
import type { Simulation, SimulationStage } from '../../api/types';

interface AttackPathProps {
  simulation: Simulation;
}

const stageColors: Record<string, string> = {
  TRUST_BUILDING: 'border-blue-400 bg-blue-400',
  BAIT: 'border-amber-400 bg-amber-400',
  PRESSURE: 'border-orange-400 bg-orange-400',
  INFORMATION_REQUEST: 'border-risk-high bg-risk-high',
  FINANCIAL_REQUEST: 'border-risk-critical bg-risk-critical',
  EXPLOITATION: 'border-red-600 bg-red-600',
};

export default function AttackPath({ simulation }: AttackPathProps) {
  const [selectedIndex, setSelectedIndex] = useState(simulation.current_stage_index);
  const selected = simulation.stages[selectedIndex];

  return (
    <div className="bg-navy-800 rounded-xl border border-navy-600 p-4 w-full">
      {/* Banner */}
      <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-3 mb-4 flex items-start gap-2">
        <AlertTriangle className="w-5 h-5 text-risk-medium shrink-0 mt-0.5" />
        <p className="text-sm text-amber-200 leading-relaxed">{simulation.banner}</p>
      </div>

      {/* Path - horizontal on desktop, vertical on mobile */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Stage indicators */}
        <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 lg:w-60 shrink-0">
          {simulation.stages.map((stage, i) => {
            const isCurrent = i === simulation.current_stage_index;
            const isSelected = i === selectedIndex;
            const color = stageColors[stage.stage] || 'border-gray-500 bg-gray-500';
            const borderColor = color.split(' ')[0];
            const bgColor = color.split(' ')[1];
            return (
              <button
                key={i}
                onClick={() => setSelectedIndex(i)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left shrink-0 transition-colors min-h-[44px]
                  ${isSelected ? `${borderColor} bg-navy-700` : 'border-navy-600 hover:border-navy-500'}
                `}
              >
                <div className={`w-3 h-3 rounded-full shrink-0 ${bgColor} ${isCurrent ? 'animate-pulse' : ''}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{stage.title}</p>
                  {isCurrent && (
                    <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">YOU ARE HERE</p>
                  )}
                </div>
                {isSelected && <ChevronRight className="w-4 h-4 text-gray-300 ml-auto hidden lg:block" />}
              </button>
            );
          })}
        </div>

        {/* Detail panel */}
        {selected && <StageDetail stage={selected} />}
      </div>
    </div>
  );
}

function StageDetail({ stage }: { stage: SimulationStage }) {
  return (
    <div className="flex-1 bg-navy-900 rounded-lg p-4 sm:p-5 space-y-4 border border-navy-700">
      <h3 className="text-base sm:text-lg font-bold text-white">{stage.title}</h3>
      <DetailRow label="Attacker objective" value={stage.attacker_objective} />
      <DetailRow label="Likely request" value={stage.likely_request} />
      <DetailRow label="Why it matters" value={stage.why_it_matters} />
      <DetailRow label="Potential consequence" value={stage.potential_consequence} />
      <div className="bg-risk-low/10 border border-risk-low/30 rounded-lg p-3.5">
        <div className="flex items-center gap-2 mb-1.5">
          <Shield className="w-4 h-4 text-risk-low shrink-0" />
          <span className="text-sm font-bold text-risk-low">Safe exit</span>
        </div>
        <p className="text-sm text-gray-200 leading-relaxed">{stage.safe_exit}</p>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs sm:text-sm font-semibold text-gray-400 mb-0.5 uppercase tracking-wide">{label}</p>
      <p className="text-sm sm:text-base text-gray-200 leading-relaxed">{value}</p>
    </div>
  );
}
