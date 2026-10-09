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

const LEVEL_BADGES: Record<string, { color: string; border: string; bg: string }> = {
  CRITICAL: { color: 'text-[#F43F5E]', border: 'border-[#F43F5E]/40', bg: 'bg-[#F43F5E]/15' },
  HIGH: { color: 'text-[#FB923C]', border: 'border-[#FB923C]/40', bg: 'bg-[#FB923C]/15' },
  MEDIUM: { color: 'text-[#FBBF24]', border: 'border-[#FBBF24]/40', bg: 'bg-[#FBBF24]/15' },
  LOW: { color: 'text-[#34D399]', border: 'border-[#34D399]/40', bg: 'bg-[#34D399]/15' },
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
      <div className="glass-card rounded-3xl border border-white/15 p-12 text-center">
        <p className="text-gray-300 text-sm">No analysis reports found for this filter.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {items.map((item) => {
        const badge = item.riskLevel ? LEVEL_BADGES[item.riskLevel] : null;

        return (
          <div
            key={item.id}
            className="group glass-card hover:border-white/40 p-4 sm:p-5 rounded-2xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan">
                  {item.featureType.replace('_', ' ')}
                </span>
                <span className="text-xs text-gray-500">•</span>
                <span className="text-xs text-gray-400 font-mono">
                  {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {item.riskScore !== null && badge && (
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${badge.bg} ${badge.border} ${badge.color}`}>
                    {item.riskLevel} • {item.riskScore}/100
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-200 line-clamp-2 leading-relaxed font-medium">
                {item.summary}
              </p>
              {item.topIndicators && item.topIndicators.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {item.topIndicators.map((ind, i) => (
                    <span key={i} className="glass-pill px-2 py-0.5 text-[11px] font-mono text-gray-300 border-white/15">
                      {ind}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <Link
                to={`/history/${item.id}`}
                className="btn-glass text-xs font-semibold px-3.5 py-1.5 min-h-[38px] text-gray-200 hover:text-white"
              >
                <span>View</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              {onDeleteOne && (
                <button
                  type="button"
                  onClick={() => onDeleteOne(item.id)}
                  aria-label="Delete analysis"
                  className="p-2 text-gray-400 hover:text-[#F43F5E] hover:bg-white/10 rounded-xl transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        );
      })}

      {hasMore && onLoadMore && (
        <div className="text-center pt-4">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="btn-secondary text-sm px-6 py-2.5 min-h-[44px]"
          >
            {loadingMore ? 'Loading reports...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
