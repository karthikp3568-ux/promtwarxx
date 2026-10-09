import { ShieldAlert, AlertTriangle, AlertCircle, CheckCircle, BarChart3 } from 'lucide-react';

interface StatTilesProps {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  mostUsedFeature?: string | null;
}

export default function StatTiles({
  total,
  critical,
  high,
  medium,
  low,
  mostUsedFeature,
}: StatTilesProps) {
  if (total === 0) return null;

  return (
    <div className="space-y-4 mb-8">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-200 tracking-tight flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-cyan" />
          <span>Security Activity Overview</span>
        </h3>
        {mostUsedFeature && (
          <span className="text-xs text-gray-300 glass-pill px-3 py-1">
            Most checked: <span className="text-cyan font-bold capitalize">{mostUsedFeature.replace('_', ' ')}</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="glass-card p-4 rounded-2xl flex flex-col justify-between border-white/20 hover:border-white/35 transition-all">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Scans</span>
          <span className="text-3xl font-extrabold text-white mt-2 tracking-tight">{total}</span>
        </div>

        <div className="glass-card p-4 rounded-2xl flex flex-col justify-between border-[#F43F5E]/40 glow-risk-critical transition-all">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#F43F5E]">
            <ShieldAlert className="w-4 h-4" />
            <span>Critical</span>
          </div>
          <span className="text-3xl font-extrabold text-[#F43F5E] mt-2 tracking-tight">{critical}</span>
        </div>

        <div className="glass-card p-4 rounded-2xl flex flex-col justify-between border-[#FB923C]/40 glow-risk-high transition-all">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#FB923C]">
            <AlertTriangle className="w-4 h-4" />
            <span>High</span>
          </div>
          <span className="text-3xl font-extrabold text-[#FB923C] mt-2 tracking-tight">{high}</span>
        </div>

        <div className="glass-card p-4 rounded-2xl flex flex-col justify-between border-[#FBBF24]/40 glow-risk-medium transition-all">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#FBBF24]">
            <AlertCircle className="w-4 h-4" />
            <span>Medium</span>
          </div>
          <span className="text-3xl font-extrabold text-[#FBBF24] mt-2 tracking-tight">{medium}</span>
        </div>

        <div className="glass-card p-4 rounded-2xl flex flex-col justify-between border-[#34D399]/40 glow-risk-low transition-all">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#34D399]">
            <CheckCircle className="w-4 h-4" />
            <span>Low</span>
          </div>
          <span className="text-3xl font-extrabold text-[#34D399] mt-2 tracking-tight">{low}</span>
        </div>
      </div>
    </div>
  );
}
