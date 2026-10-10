import { Shield } from 'lucide-react';
import { getMitreTechnique, type MitreTechnique } from '../../content/mitre';

interface MitreBadgeProps {
  factorCode: string;
  onSelect: (technique: MitreTechnique) => void;
}

export default function MitreBadge({ factorCode, onSelect }: MitreBadgeProps) {
  const technique = getMitreTechnique(factorCode);
  if (!technique) return null;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onSelect(technique);
      }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-cyan/10 hover:bg-cyan/20 text-cyan border border-cyan/30 hover:border-cyan/50 transition-all cursor-pointer shadow-sm min-h-[28px]"
      title={`Click to view ${technique.matrix} mapping for ${technique.name}`}
    >
      <Shield className="w-3 h-3 text-cyan shrink-0" />
      <span>{technique.id}</span>
      <span className="hidden sm:inline font-sans text-[10px] text-gray-300 border-l border-cyan/30 pl-1.5">
        {technique.name}
      </span>
    </button>
  );
}
