import { CheckCircle } from 'lucide-react';
import type { DismissedHint } from '../../api/types';

interface RuledOutListProps {
  hints: DismissedHint[];
}

export default function RuledOutList({ hints }: RuledOutListProps) {
  if (hints.length === 0) return null;

  return (
    <div className="bg-navy-800 rounded-xl border border-navy-600 p-4">
      <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <CheckCircle className="w-4 h-4 text-risk-low" />
        Checked and ruled out
      </h3>
      <ul className="space-y-2">
        {hints.map(h => (
          <li key={h.hint_id} className="text-sm">
            <span className="text-gray-300">{h.hint_id.replace(/_/g, ' ')}</span>
            <span className="text-gray-500"> — {h.reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
