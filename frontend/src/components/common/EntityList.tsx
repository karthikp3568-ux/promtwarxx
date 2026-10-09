import { Link as LinkIcon, Mail, Phone, Wallet, Clock, Building, Hash } from 'lucide-react';
import type { ExtractedData } from '../../api/types';

interface EntityListProps {
  extracted: ExtractedData;
}

export default function EntityList({ extracted }: EntityListProps) {
  const sections = [
    { key: 'urls', label: 'URLs', icon: LinkIcon, items: extracted.urls.map(u => u.original) },
    { key: 'emails', label: 'Emails', icon: Mail, items: extracted.emails },
    { key: 'phones', label: 'Phone Numbers', icon: Phone, items: extracted.phones },
    { key: 'upi', label: 'UPI IDs', icon: Wallet, items: extracted.upi },
    { key: 'amounts', label: 'Amounts', icon: Wallet, items: extracted.amounts },
    { key: 'deadlines', label: 'Deadlines', icon: Clock, items: extracted.deadlines },
    { key: 'orgs', label: 'Organizations', icon: Building, items: extracted.orgs },
    { key: 'refs', label: 'References', icon: Hash, items: extracted.refs },
  ].filter(s => s.items.length > 0);

  if (sections.length === 0) return null;

  return (
    <div className="glass-card rounded-2xl border border-white/20 p-5">
      <h3 className="text-sm font-bold text-white mb-3.5 tracking-tight">Extracted Artifacts & Indicators</h3>
      <div className="space-y-3.5">
        {sections.map(s => (
          <div key={s.key}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <s.icon className="w-3.5 h-3.5 text-cyan" />
              <span className="text-xs text-gray-300 font-bold uppercase tracking-wider">{s.label}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {s.items.map((item, i) => (
                <span key={i} className="glass-pill px-3 py-1 text-xs text-gray-100 font-mono border-white/20">
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
