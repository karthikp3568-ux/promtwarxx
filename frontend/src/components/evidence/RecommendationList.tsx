import { ShieldCheck } from 'lucide-react';

interface RecommendationListProps {
  recommendations: string[];
}

export default function RecommendationList({ recommendations }: RecommendationListProps) {
  if (recommendations.length === 0) return null;

  return (
    <div className="bg-navy-800 rounded-xl border border-navy-600 p-4">
      <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-primary" />
        Recommended actions
      </h3>
      <ol className="space-y-2">
        {recommendations.map((rec, i) => (
          <li key={i} className="flex gap-3 text-sm">
            <span className="text-primary font-mono text-sm font-semibold mt-0.5 shrink-0">{i + 1}.</span>
            <span className="text-gray-300">{rec}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
