import { Database } from 'lucide-react';

export default function CachedBadge() {
  return (
    <div className="glass-pill px-3 py-1 bg-cyan/15 border-cyan/40 text-xs font-semibold text-cyan inline-flex items-center gap-1.5 shadow-sm">
      <Database className="w-3.5 h-3.5 text-cyan" />
      <span>Cached Demo Result</span>
    </div>
  );
}
