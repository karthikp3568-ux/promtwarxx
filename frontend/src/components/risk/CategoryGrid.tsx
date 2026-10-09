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

const severityStyles: Record<Severity, { text: string; bg: string; border: string; glow: string }> = {
  LOW: {
    text: 'text-[#34D399]',
    bg: 'bg-[#34D399]/15',
    border: 'border-[#34D399]/40',
    glow: '0 0 16px rgba(52, 211, 153, 0.25)',
  },
  MEDIUM: {
    text: 'text-[#FBBF24]',
    bg: 'bg-[#FBBF24]/15',
    border: 'border-[#FBBF24]/40',
    glow: '0 0 16px rgba(251, 191, 36, 0.25)',
  },
  HIGH: {
    text: 'text-[#FB923C]',
    bg: 'bg-[#FB923C]/15',
    border: 'border-[#FB923C]/40',
    glow: '0 0 16px rgba(251, 146, 60, 0.25)',
  },
};

export default function CategoryGrid({ categories, showVoice = false }: CategoryGridProps) {
  const filtered = categories.filter((c) => showVoice || c.category !== 'Voice');

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
      {filtered.map((cat) => {
        const Icon = categoryIcons[cat.category] || Shield;
        const hasDetection = cat.severity !== null;
        const style = cat.severity ? severityStyles[cat.severity] : null;

        return (
          <div
            key={cat.category}
            className={`glass-card p-4 rounded-2xl transition-all duration-200 ${
              style ? `${style.border} ${style.bg}` : 'border-white/15'
            }`}
            style={style ? { boxShadow: style.glow } : undefined}
          >
            <div className="flex items-center justify-between mb-2">
              <div
                className={`icon-tile w-8 h-8 rounded-xl ${
                  style ? style.bg : 'bg-white/10'
                } flex items-center justify-center`}
              >
                <Icon
                  className={`w-4 h-4 ${style ? style.text : 'text-gray-400'}`}
                />
              </div>
              {hasDetection && (
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    style?.bg
                  } ${style?.text}`}
                >
                  {cat.severity}
                </span>
              )}
            </div>

            <p className="text-sm font-bold text-white tracking-tight">{cat.category}</p>
            <p
              className={`text-xs mt-1 font-medium ${
                style ? style.text : 'text-gray-400'
              }`}
            >
              {cat.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}
