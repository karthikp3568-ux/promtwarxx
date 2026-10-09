import { Database } from 'lucide-react';

export default function CachedBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-900/30 border border-blue-700/50 rounded text-xs text-blue-300">
      <Database className="w-3 h-3" />
      Cached demo result
    </div>
  );
}
