import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ShieldCheck, AlertTriangle, ShieldAlert, HelpCircle } from 'lucide-react';

interface RiskGaugeProps {
  score: number | null;
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null;
}

const levelConfig: Record<string, { color: string; label: string; icon: typeof ShieldCheck; glow: string }> = {
  LOW: {
    color: '#34D399',
    label: 'Low Risk',
    icon: ShieldCheck,
    glow: '0 0 28px rgba(52, 211, 153, 0.45)',
  },
  MEDIUM: {
    color: '#FBBF24',
    label: 'Medium Risk',
    icon: AlertTriangle,
    glow: '0 0 28px rgba(251, 191, 36, 0.45)',
  },
  HIGH: {
    color: '#FB923C',
    label: 'High Risk',
    icon: AlertTriangle,
    glow: '0 0 28px rgba(251, 146, 60, 0.45)',
  },
  CRITICAL: {
    color: '#F43F5E',
    label: 'Critical Risk',
    icon: ShieldAlert,
    glow: '0 0 28px rgba(244, 63, 94, 0.45)',
  },
};

export default function RiskGauge({ score, level }: RiskGaugeProps) {
  const prefersReducedMotion = useReducedMotion();
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    if (score === null || prefersReducedMotion) {
      setDisplayScore(score ?? 0);
      return;
    }
    let frame: number;
    const duration = 1000;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      setDisplayScore(Math.round(score * progress));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score, prefersReducedMotion]);

  if (score === null || level === null) {
    return (
      <div className="glass-card flex flex-col items-center justify-center p-6 rounded-3xl">
        <div className="w-32 h-32 rounded-full border-2 border-dashed border-white/20 flex flex-col items-center justify-center p-3 text-center">
          <HelpCircle className="w-6 h-6 text-gray-400 mb-1" />
          <span className="text-gray-300 text-xs font-medium">Insufficient info to score</span>
        </div>
        <div className="mt-4 flex items-center gap-2 glass-pill px-3 py-1">
          <span className="text-xs text-gray-300 font-medium">Unassessed</span>
        </div>
      </div>
    );
  }

  const config = levelConfig[level] || {
    color: '#9CA3AF',
    label: 'Unknown',
    icon: AlertTriangle,
    glow: 'none',
  };
  const Icon = config.icon;
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, score)) / 100;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div
      className="glass-card flex flex-col items-center justify-center p-6 rounded-3xl transition-all"
      style={{ boxShadow: config.glow }}
    >
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90 drop-shadow-md" viewBox="0 0 128 128">
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth="9"
          />
          <motion.circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            stroke={config.color}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 1, ease: 'easeOut' }}
            style={{
              filter: `drop-shadow(0 0 8px ${config.color}90)`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold text-white tracking-tight">{displayScore}</span>
          <span className="text-xs text-gray-300 font-medium tracking-wide">/ 100</span>
        </div>
      </div>

      <div
        className="mt-4 inline-flex items-center gap-2 glass-pill px-3.5 py-1.5"
        style={{ borderColor: `${config.color}40`, background: `${config.color}15` }}
      >
        <Icon className="w-4 h-4 shrink-0" style={{ color: config.color }} />
        <span className="text-sm font-bold tracking-wide" style={{ color: config.color }}>
          {config.label}
        </span>
      </div>
    </div>
  );
}
