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
    } catch {
      setHistory((prev) => [
        ...prev,
        { q: qText.trim(), a: 'Unable to get an answer right now. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-3xl border border-white/20 p-6 mt-8 shadow-2xl">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="icon-tile icon-tile-gradient w-8 h-8 rounded-xl flex items-center justify-center">
          <HelpCircle className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-base font-bold text-white tracking-tight">Ask TrustGuard About This Content</h3>
      </div>
      <p className="text-xs text-gray-300 mb-5 leading-relaxed">
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
            className="btn-glass text-xs px-3.5 py-1.5 min-h-[36px] rounded-full text-gray-200 hover:text-white"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Q&A Thread */}
      {history.length > 0 && (
        <div className="space-y-4 mb-6">
          {history.map((item, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-start gap-2.5 justify-end">
                <div className="glass-pill bg-white/15 px-4 py-2 text-sm text-white font-medium max-w-[85%]">
                  {item.q}
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                  <MessageSquare className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="glass-reading p-3.5 rounded-2xl border border-white/10 text-sm text-gray-200 leading-relaxed max-w-[88%]">
                  {item.a}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk(question);
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a clarifying safety question..."
          maxLength={500}
          disabled={loading || disabled}
          className="flex-1 glass-reading border border-white/20 rounded-full px-5 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-cyan min-h-[44px]"
        />
        <button
          type="submit"
          disabled={!question.trim() || loading || disabled}
          className="btn-primary px-5 py-2.5 min-h-[44px] rounded-full shrink-0"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          <span className="hidden sm:inline">Ask</span>
        </button>
      </form>
    </div>
  );
}
