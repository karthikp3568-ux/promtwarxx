import { ShieldAlert, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';

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
        <h3 className="text-sm font-semibold text-gray-200">Security Activity Overview</h3>
        {mostUsedFeature && (
          <span className="text-sm text-gray-400">
            Most checked: <span className="text-primary font-semibold">{mostUsedFeature}</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-navy-800 border border-navy-700 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-sm font-medium text-gray-400">Total Scans</span>
          <span className="text-2xl font-bold text-white mt-2">{total}</span>
        </div>

        <div className="bg-navy-800 border border-risk-critical/30 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-risk-critical">
            <ShieldAlert className="w-4 h-4" />
            <span>Critical</span>
          </div>
          <span className="text-2xl font-bold text-risk-critical mt-2">{critical}</span>
        </div>

        <div className="bg-navy-800 border border-risk-high/30 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-risk-high">
            <AlertTriangle className="w-4 h-4" />
            <span>High</span>
          </div>
          <span className="text-2xl font-bold text-risk-high mt-2">{high}</span>
        </div>

        <div className="bg-navy-800 border border-risk-medium/30 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-risk-medium">
            <AlertCircle className="w-4 h-4" />
            <span>Medium</span>
          </div>
          <span className="text-2xl font-bold text-risk-medium mt-2">{medium}</span>
        </div>

        <div className="bg-navy-800 border border-risk-low/30 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-risk-low">
            <CheckCircle className="w-4 h-4" />
            <span>Low</span>
          </div>
          <span className="text-2xl font-bold text-risk-low mt-2">{low}</span>
        </div>
      </div>
    </div>
  );
}
