import { ShieldCheck } from 'lucide-react';

interface RecommendationListProps {
  recommendations: string[];
}

export default function RecommendationList({ recommendations }: RecommendationListProps) {
  if (recommendations.length === 0) return null;

  return (
    <div className="glass-card rounded-2xl border border-white/20 p-5">
      <h3 className="text-sm font-bold text-white mb-3.5 flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
          <ShieldCheck className="w-4 h-4 text-primary" />
        </div>
        Recommended Safe Actions
      </h3>
      <ol className="space-y-2.5">
        {recommendations.map((rec, i) => (
          <li key={i} className="flex gap-3 text-sm bg-white/5 p-3 rounded-xl border border-white/10 items-start">
            <span className="text-primary font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary/15 mt-0.5 shrink-0">
              {i + 1}
            </span>
            <span className="text-gray-200 leading-relaxed">{rec}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
