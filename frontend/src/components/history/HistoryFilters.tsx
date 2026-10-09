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
            className={`text-sm font-medium px-3.5 py-2 min-h-[44px] rounded-lg transition-colors flex items-center ${
              selectedFeature === tab.id
                ? 'bg-primary text-white shadow-sm'
                : 'bg-navy-800 text-gray-300 hover:text-white hover:bg-navy-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onToggleSort}
        className="text-sm bg-navy-800 hover:bg-navy-700 border border-navy-700 text-gray-200 px-4 py-2 min-h-[44px] rounded-lg transition-colors flex items-center gap-1.5 self-end sm:self-auto"
      >
        <span className="text-gray-400">Sort:</span>
        <span className="font-semibold text-white capitalize">{sortOrder}</span>
      </button>
    </div>
  );
}
