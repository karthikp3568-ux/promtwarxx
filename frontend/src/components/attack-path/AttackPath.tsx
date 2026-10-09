import { useState } from 'react';
import { AlertTriangle, Shield, ChevronRight } from 'lucide-react';
import type { Simulation, SimulationStage } from '../../api/types';

interface AttackPathProps {
  simulation: Simulation;
}

const stageColors: Record<string, { border: string; bg: string; dot: string }> = {
  TRUST_BUILDING: { border: 'border-blue-400/50', bg: 'bg-blue-400/15', dot: 'bg-blue-400' },
  BAIT: { border: 'border-amber-400/50', bg: 'bg-amber-400/15', dot: 'bg-amber-400' },
  PRESSURE: { border: 'border-orange-400/50', bg: 'bg-orange-400/15', dot: 'bg-orange-400' },
  INFORMATION_REQUEST: { border: 'border-[#FB923C]/50', bg: 'bg-[#FB923C]/15', dot: 'bg-[#FB923C]' },
  FINANCIAL_REQUEST: { border: 'border-[#F43F5E]/50', bg: 'bg-[#F43F5E]/15', dot: 'bg-[#F43F5E]' },
  EXPLOITATION: { border: 'border-rose-600/50', bg: 'bg-rose-600/15', dot: 'bg-rose-600' },
};

export default function AttackPath({ simulation }: AttackPathProps) {
  const [selectedIndex, setSelectedIndex] = useState(simulation.current_stage_index);
  const selected = simulation.stages[selectedIndex];

  return (
    <div className="glass-card rounded-3xl border border-white/20 p-5 sm:p-6 w-full shadow-2xl">
      {/* Simulation Banner */}
      <div className="glass-pill bg-amber-500/15 border-amber-500/40 p-3.5 mb-6 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs sm:text-sm text-amber-200 leading-relaxed font-medium">
          {simulation.banner}
        </p>
      </div>

      {/* Path Layout */}
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Stage selection list */}
        <div className="flex lg:flex-col gap-2.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 lg:w-64 shrink-0">
          {simulation.stages.map((stage, i) => {
            const isCurrent = i === simulation.current_stage_index;
            const isSelected = i === selectedIndex;
            const style = stageColors[stage.stage] || { border: 'border-white/20', bg: 'bg-white/10', dot: 'bg-gray-400' };

            return (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedIndex(i)}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl border text-left shrink-0 transition-all min-h-[48px] ${
                  isSelected
                    ? `${style.border} ${style.bg} shadow-md`
                    : 'glass-card border-white/10 hover:border-white/30'
                }`}
              >
                <div className={`w-3 h-3 rounded-full shrink-0 ${style.dot} ${isCurrent ? 'animate-ping' : ''}`} />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{stage.title}</p>
                  {isCurrent && (
                    <span className="text-[10px] text-amber-300 font-extrabold uppercase tracking-wider block">
                      YOU ARE HERE
                    </span>
                  )}
                </div>
                {isSelected && <ChevronRight className="w-4 h-4 text-white ml-auto hidden lg:block" />}
              </button>
            );
          })}
        </div>

        {/* Detailed stage panel */}
        {selected && <StageDetail stage={selected} />}
      </div>
    </div>
  );
}

function StageDetail({ stage }: { stage: SimulationStage }) {
  return (
    <div className="flex-1 glass-reading rounded-2xl p-5 sm:p-6 space-y-4 border border-white/20">
      <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">{stage.title}</h3>
      <DetailRow label="Attacker Objective" value={stage.attacker_objective} />
      <DetailRow label="Likely Next Request" value={stage.likely_request} />
      <DetailRow label="Why It Matters" value={stage.why_it_matters} />
      <DetailRow label="Potential Consequence" value={stage.potential_consequence} />

      <div className="glass-pill bg-[#34D399]/15 border-[#34D399]/40 p-4 rounded-2xl mt-4">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-4 h-4 text-[#34D399] shrink-0" />
          <span className="text-sm font-bold text-[#34D399]">Safe Exit Recommendation</span>
        </div>
        <p className="text-sm text-gray-200 leading-relaxed">{stage.safe_exit}</p>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-cyan uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm text-gray-200 leading-relaxed">{value}</p>
    </div>
  );
}
