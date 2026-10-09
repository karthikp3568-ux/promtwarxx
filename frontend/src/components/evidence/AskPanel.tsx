import { useState } from 'react';
import { HelpCircle, Send, Loader2, MessageSquare } from 'lucide-react';

const PRESET_CHIPS = [
  'Why is this suspicious?',
  'Biggest red flag?',
  'What should I verify?',
  "What shouldn't I share?",
  'What happens if I follow this link?',
];

interface AskPanelProps {
  onAsk: (question: string) => Promise<string>;
  disabled?: boolean;
}

export default function AskPanel({ onAsk, disabled = false }: AskPanelProps) {
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState<Array<{ q: string; a: string }>>([]);
  const [loading, setLoading] = useState(false);

  const handleAsk = async (qText: string) => {
    if (!qText.trim() || loading || disabled) return;
    setLoading(true);
    try {
      const answer = await onAsk(qText.trim());
      setHistory((prev) => [...prev, { q: qText.trim(), a: answer }]);
      setQuestion('');
    } catch (err: any) {
      setHistory((prev) => [
        ...prev,
        { q: qText.trim(), a: 'Unable to get an answer right now. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-navy-800 border border-navy-600 rounded-xl p-6 mt-8">
      <div className="flex items-center gap-2 mb-2">
        <HelpCircle className="w-5 h-5 text-primary" />
        <h3 className="text-base font-semibold text-white">Ask TrustGuard About This Content</h3>
      </div>
      <p className="text-xs text-gray-400 mb-4">
        Stateless inquiry based exclusively on the provided evidence. Questions and answers are never saved.
      </p>

      {/* Preset Chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {PRESET_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            disabled={loading || disabled}
            onClick={() => handleAsk(chip)}
            className="text-xs bg-navy-700 hover:bg-navy-600 border border-navy-600 text-gray-200 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Conversation Thread */}
      {history.length > 0 && (
        <div className="space-y-4 mb-6 max-h-80 overflow-y-auto pr-1">
          {history.map((item, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex items-start gap-2 justify-end">
                <div className="bg-primary/20 border border-primary/40 rounded-xl rounded-tr-none px-4 py-2 text-xs text-white max-w-[85%]">
                  {item.q}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400 mt-1 shrink-0" />
                <div className="bg-navy-900 border border-navy-700 rounded-xl rounded-tl-none px-4 py-2 text-xs text-gray-300 max-w-[85%] whitespace-pre-wrap">
                  {item.a}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk(question);
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          value={question}
          maxLength={500}
          disabled={loading || disabled}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a specific security question (≤ 500 characters)..."
          className="flex-1 bg-navy-900 border border-navy-600 rounded-lg px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!question.trim() || loading || disabled}
          className="bg-primary hover:bg-blue-600 disabled:opacity-50 text-white p-2.5 rounded-lg transition-colors flex items-center justify-center shrink-0"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}
