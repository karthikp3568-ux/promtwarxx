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
    <div className="bg-navy-800 rounded-xl border border-navy-600 p-4">
      <h3 className="text-sm font-semibold text-white mb-3">Extracted Data</h3>
      <div className="space-y-3">
        {sections.map(s => (
          <div key={s.key}>
            <div className="flex items-center gap-1.5 mb-1">
              <s.icon className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-sm text-gray-400 font-semibold">{s.label}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {s.items.map((item, i) => (
                <span key={i} className="text-sm bg-navy-700 text-gray-200 px-2.5 py-1 rounded font-mono">
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
