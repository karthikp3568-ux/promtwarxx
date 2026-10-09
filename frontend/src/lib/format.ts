import type { RiskLevel, Severity, FeatureType } from '../api/types';

export function riskColor(level: RiskLevel | Severity | null): string {
  switch (level) {
    case 'LOW': return 'text-risk-low';
    case 'MEDIUM': return 'text-risk-medium';
    case 'HIGH': return 'text-risk-high';
    case 'CRITICAL': return 'text-risk-critical';
    default: return 'text-gray-400';
  }
}

export function riskBg(level: RiskLevel | null): string {
  switch (level) {
    case 'LOW': return 'bg-risk-low/10 border-risk-low/30';
    case 'MEDIUM': return 'bg-risk-medium/10 border-risk-medium/30';
    case 'HIGH': return 'bg-risk-high/10 border-risk-high/30';
    case 'CRITICAL': return 'bg-risk-critical/10 border-risk-critical/30';
    default: return 'bg-navy-800 border-navy-600';
  }
}

export function featureLabel(feature: FeatureType): string {
  switch (feature) {
    case 'conversation': return 'Conversation';
    case 'payment': return 'QR & Payment';
    case 'document': return 'Document';
    case 'voice': return 'Voice';
  }
}

export function timeAgo(timestamp: string): string {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
