import { Shield, Clock, Brain, Wallet, Key, Globe, Mic } from 'lucide-react';
import type { CategoryStatus, Severity } from '../../api/types';
import type { LucideIcon } from 'lucide-react';

interface CategoryGridProps {
  categories: CategoryStatus[];
  showVoice?: boolean;
}

const categoryIcons: Record<string, LucideIcon> = {
  Identity: Shield,
  Urgency: Clock,
  Manipulation: Brain,
  Financial: Wallet,
  Credentials: Key,
  Destination: Globe,
  Voice: Mic,
};

const severityColors: Record<Severity, string> = {
  LOW: 'text-risk-low',
  MEDIUM: 'text-risk-medium',
  HIGH: 'text-risk-high',
};

const severityBg: Record<Severity, string> = {
  LOW: 'bg-risk-low/10 border-risk-low/30',
  MEDIUM: 'bg-risk-medium/10 border-risk-medium/30',
  HIGH: 'bg-risk-high/10 border-risk-high/30',
};

export default function CategoryGrid({ categories, showVoice = false }: CategoryGridProps) {
  const filtered = categories.filter(c => showVoice || c.category !== 'Voice');

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {filtered.map(cat => {
        const Icon = categoryIcons[cat.category] || Shield;
        const hasDetection = cat.severity !== null;
        return (
          <div
            key={cat.category}
            className={`rounded-lg border p-3 ${
              hasDetection && cat.severity
                ? severityBg[cat.severity]
                : 'bg-navy-800 border-navy-600'
            }`}
          >
            <Icon className={`w-4 h-4 mb-1.5 ${
              hasDetection && cat.severity ? severityColors[cat.severity] : 'text-gray-500'
            }`} />
            <p className="text-sm font-semibold text-gray-200">{cat.category}</p>
            <p className={`text-sm mt-0.5 ${
              hasDetection && cat.severity ? severityColors[cat.severity] : 'text-gray-400'
            }`}>
              {cat.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}
