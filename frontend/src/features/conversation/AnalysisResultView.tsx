import { Link } from 'react-router-dom';
import { GitBranch, RotateCcw } from 'lucide-react';
import type { AnalysisResult } from '../../api/types';
import RiskGauge from '../../components/risk/RiskGauge';
import CategoryGrid from '../../components/risk/CategoryGrid';
import EvidenceCard from '../../components/evidence/EvidenceCard';
import ReasoningPanel from '../../components/evidence/ReasoningPanel';
import RuledOutList from '../../components/evidence/RuledOutList';
import RecommendationList from '../../components/evidence/RecommendationList';
import EntityList from '../../components/common/EntityList';
import CachedBadge from '../../components/common/CachedBadge';
import SaveStatus from '../../components/common/SaveStatus';

interface AnalysisResultViewProps {
  result: AnalysisResult;
  onReset: () => void;
  saveStatus?: 'saved' | 'skipped' | 'failed' | null;
  children?: React.ReactNode; // For feature-specific panels (payment, voice, etc.)
}

export default function AnalysisResultView({ result, onReset, saveStatus, children }: AnalysisResultViewProps) {
  const isInsufficient = result.status === 'insufficient_content';

  return (
    <div className="space-y-6">
      {/* Header with reset button */}
      <div className="flex items-center justify-between">
        <div>
          {result.claimed_identity && (
            <p className="text-sm text-gray-400">
              Claimed identity: <span className="text-white">{result.claimed_identity}</span>
            </p>
          )}
          {result.sender_intent && (
            <p className="text-sm text-gray-400 mt-1">
              Intent: <span className="text-white">{result.sender_intent}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {saveStatus && <SaveStatus status={saveStatus} />}
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white bg-navy-800 hover:bg-navy-700 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            New analysis
          </button>
        </div>
      </div>

      {result.meta.cached && <CachedBadge />}

      {/* Risk Score */}
      {isInsufficient ? (
        <div className="bg-navy-800 rounded-xl p-8 text-center">
          <p className="text-gray-400 text-lg">Not enough information to assess</p>
          <p className="text-gray-500 text-sm mt-2">{result.reasoning}</p>
        </div>
      ) : (
        <>
          <div className="bg-navy-800 rounded-xl p-6">
            <RiskGauge score={result.score} level={result.level} />
          </div>

          {/* Categories */}
          <CategoryGrid
            categories={result.categories}
            showVoice={result.feature === 'voice'}
          />

          {/* Evidence Cards */}
          {result.factors.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Evidence ({result.factors.length} signals)</h3>
              <div className="space-y-3">
                {result.factors.map((f, i) => (
                  <EvidenceCard key={`${f.code}-${i}`} factor={f} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* AI Reasoning */}
          {result.reasoning && (
            <ReasoningPanel reasoning={result.reasoning} factors={result.factors} />
          )}

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <RecommendationList recommendations={result.recommendations} />
          )}

          {/* Ruled Out */}
          {result.dismissed_hints.length > 0 && (
            <RuledOutList hints={result.dismissed_hints} />
          )}

          {/* Contradictions */}
          {result.contradictions.length > 0 && (
            <div className="bg-navy-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-risk-high mb-3">Contradictions detected</h3>
              <ul className="space-y-2">
                {result.contradictions.map((c, i) => (
                  <li key={i} className="text-sm text-gray-300 flex gap-2">
                    <span className="text-risk-high mt-0.5">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Feature-specific panels */}
          {children}

          {/* Extracted Entities */}
          <EntityList extracted={result.extracted} />

          {/* What-If button for MEDIUM+ results */}
          {result.score !== null && result.score >= 30 && (
            <div className="bg-navy-800 rounded-xl p-5 text-center">
              <p className="text-gray-300 text-sm mb-3">Want to know what could happen if you continue engaging?</p>
              <Link
                to={`/check/whatif`}
                state={{ analysisResult: result }}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors font-medium min-h-[44px]"
              >
                <GitBranch className="w-5 h-5" />
                What could happen next?
              </Link>
            </div>
          )}

          {/* Meta */}
          <div className="text-sm text-gray-400 flex flex-wrap gap-4 pt-2 border-t border-navy-700">
            <span>Model: {result.meta.model}</span>
            <span>Prompt: {result.meta.prompt_version}</span>
            <span>Duration: {(result.meta.duration_ms / 1000).toFixed(1)}s</span>
            <span>ID: {result.id}</span>
          </div>
        </>
      )}
    </div>
  );
}
