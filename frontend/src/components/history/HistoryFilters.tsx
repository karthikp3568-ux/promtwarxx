interface HistoryFiltersProps {
  selectedFeature: string;
  onSelectFeature: (feature: string) => void;
  sortOrder: 'newest' | 'oldest';
  onToggleSort: () => void;
}

const FEATURE_TABS = [
  { id: 'all', label: 'All' },
  { id: 'conversation', label: 'Conversation' },
  { id: 'qr_payment', label: 'QR & Payment' },
  { id: 'document', label: 'Document' },
  { id: 'voice', label: 'Voice' },
  { id: 'what_if', label: 'What-If' },
];

export default function HistoryFilters({
  selectedFeature,
  onSelectFeature,
  sortOrder,
  onToggleSort,
}: HistoryFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div className="flex flex-wrap gap-2">
        {FEATURE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectFeature(tab.id)}
            className={`text-sm font-semibold px-4 py-2 min-h-[44px] rounded-full transition-all flex items-center ${
              selectedFeature === tab.id
                ? 'btn-primary shadow-md'
                : 'btn-glass text-gray-300 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onToggleSort}
        className="btn-glass text-sm px-4 py-2 min-h-[44px] rounded-full flex items-center gap-1.5 self-end sm:self-auto text-gray-200"
      >
        <span className="text-gray-400">Sort:</span>
        <span className="font-bold text-white capitalize">{sortOrder}</span>
      </button>
    </div>
  );
}
