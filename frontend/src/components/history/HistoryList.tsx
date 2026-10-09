import { Link } from 'react-router-dom';
import { ArrowRight, Trash2 } from 'lucide-react';
import type { RiskLevel } from '../../api/types';

export interface HistoryItemData {
  id: string;
  featureType: string;
  createdAt: string;
  riskScore: number | null;
  riskLevel: RiskLevel | null;
  summary: string;
  topIndicators?: string[];
}

interface HistoryListProps {
  items: HistoryItemData[];
  onDeleteOne?: (id: string) => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
}

const LEVEL_COLORS: Record<string, string> = {
  CRITICAL: 'text-risk-critical border-risk-critical/40 bg-risk-critical/10',
  HIGH: 'text-risk-high border-risk-high/40 bg-risk-high/10',
  MEDIUM: 'text-risk-medium border-risk-medium/40 bg-risk-medium/10',
  LOW: 'text-risk-low border-risk-low/40 bg-risk-low/10',
};

export default function HistoryList({
  items,
  onDeleteOne,
  hasMore = false,
  onLoadMore,
  loadingMore = false,
}: HistoryListProps) {
  if (items.length === 0) {
    return (
      <div className="bg-navy-800 border border-navy-700 rounded-xl p-12 text-center">
        <p className="text-gray-400 text-sm">No analysis reports found for this filter.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const levelBadge = item.riskLevel ? LEVEL_COLORS[item.riskLevel] : 'text-gray-400 border-gray-700';

        return (
          <div
            key={item.id}
            className="group bg-navy-800 hover:bg-navy-750 border border-navy-700 hover:border-navy-600 rounded-xl p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  {item.featureType.replace('_', ' ')}
                </span>
                <span className="text-xs text-gray-500">•</span>
                <span className="text-xs text-gray-400">
                  {new Date(item.createdAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {item.riskLevel && (
                  <span className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded-full border ${levelBadge}`}>
                    {item.riskLevel} {item.riskScore !== null ? `(${item.riskScore})` : ''}
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-200 font-medium mb-2 line-clamp-1">{item.summary}</p>

              {item.topIndicators && item.topIndicators.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {item.topIndicators.slice(0, 3).map((ind, i) => (
                    <span
                      key={i}
                      className="text-xs text-gray-400 bg-navy-900 border border-navy-700 rounded px-2 py-0.5"
                    >
                      {ind}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {onDeleteOne && (
                <button
                  type="button"
                  onClick={() => onDeleteOne(item.id)}
                  title="Delete report"
                  className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors rounded-lg hover:bg-navy-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <Link
                to={`/history/${item.id}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-white bg-navy-700 hover:bg-primary px-3.5 py-2 min-h-[44px] rounded-lg transition-colors"
              >
                <span>View Report</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        );
      })}

      {hasMore && (
        <div className="text-center pt-4">
          <button
            type="button"
            disabled={loadingMore}
            onClick={onLoadMore}
            className="text-sm font-semibold text-gray-200 hover:text-white bg-navy-800 hover:bg-navy-700 border border-navy-700 px-5 py-2.5 min-h-[44px] rounded-lg transition-colors"
          >
            {loadingMore ? 'Loading...' : 'Load More Reports'}
          </button>
        </div>
      )}
    </div>
  );
}
