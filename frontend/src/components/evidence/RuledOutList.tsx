import { CheckCircle } from 'lucide-react';
import type { DismissedHint } from '../../api/types';

interface RuledOutListProps {
  hints: DismissedHint[];
}

export default function RuledOutList({ hints }: RuledOutListProps) {
  if (hints.length === 0) return null;

  return (
    <div className="glass-card rounded-2xl border border-white/20 p-5">
      <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-[#34D399]/20 flex items-center justify-center">
          <CheckCircle className="w-4 h-4 text-[#34D399]" />
        </div>
        Checked & Ruled Out
      </h3>
      <ul className="space-y-2.5">
        {hints.map((h) => (
          <li key={h.hint_id} className="text-sm flex items-start gap-2 bg-white/5 p-2.5 rounded-xl border border-white/10">
            <span className="font-semibold text-gray-200 capitalize">
              {h.hint_id.replace(/_/g, ' ')}:
            </span>
            <span className="text-gray-300">{h.reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
