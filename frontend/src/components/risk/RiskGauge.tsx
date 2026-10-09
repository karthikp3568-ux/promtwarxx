import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface RiskGaugeProps {
  score: number | null;
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null;
}

const levelColors: Record<string, string> = {
  LOW: '#14B8A6',
  MEDIUM: '#F59E0B',
  HIGH: '#FB7185',
  CRITICAL: '#EF4444',
};

const levelLabels: Record<string, string> = {
  LOW: 'Low Risk',
  MEDIUM: 'Medium Risk',
  HIGH: 'High Risk',
  CRITICAL: 'Critical Risk',
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
      <div className="flex flex-col items-center justify-center p-6">
        <div className="w-32 h-32 rounded-full border-4 border-navy-600 flex items-center justify-center">
          <span className="text-gray-400 text-sm text-center px-2">Not enough information to assess</span>
        </div>
      </div>
    );
  }

  const color = levelColors[level] || '#6B7280';
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const progress = score / 100;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center justify-center p-6">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r={radius} fill="none" stroke="#1A2744" strokeWidth="8" />
          <motion.circle
            cx="64" cy="64" r={radius} fill="none"
            stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 1, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">{displayScore}</span>
          <span className="text-sm text-gray-400 font-medium">/ 100</span>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-sm font-semibold" style={{ color }}>{levelLabels[level]}</span>
      </div>
    </div>
  );
}
