import { Link } from 'react-router-dom';
import { GitBranch, RotateCcw, AlertTriangle } from 'lucide-react';
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
  children?: React.ReactNode;
}

export default function AnalysisResultView({ result, onReset, saveStatus, children }: AnalysisResultViewProps) {
  const isInsufficient = result.status === 'insufficient_content';

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Top Header & Actions */}
      <div className="glass-card p-4 sm:p-5 rounded-2xl border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {result.claimed_identity ? (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Claimed Identity:</span>
              <span className="text-sm font-bold text-white glass-pill px-2.5 py-0.5 border-white/20">{result.claimed_identity}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Target Domain:</span>
              <span className="text-sm font-bold text-cyan capitalize">{result.feature.replace('_', ' ')} Assessment</span>
            </div>
          )}
          {result.sender_intent && (
            <p className="text-xs sm:text-sm text-gray-300 mt-1">
              <strong className="text-gray-200">Observed Intent:</strong> {result.sender_intent}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {saveStatus && <SaveStatus status={saveStatus} />}
          <button
            onClick={onReset}
            className="btn-glass text-xs sm:text-sm font-semibold px-4 py-2 min-h-[40px] text-gray-200 hover:text-white"
          >
            <RotateCcw className="w-4 h-4 text-cyan" />
            <span>New Analysis</span>
          </button>
        </div>
      </div>

      {result.meta.cached && <CachedBadge />}

      {/* Main Risk Assessment */}
      {isInsufficient ? (
        <div className="glass-card rounded-3xl p-8 sm:p-12 text-center border-white/20">
          <div className="icon-tile w-12 h-12 rounded-2xl bg-white/10 mx-auto mb-3 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-white text-lg font-bold">Insufficient Information to Assess</p>
          <p className="text-gray-300 text-sm mt-2 max-w-md mx-auto leading-relaxed">{result.reasoning}</p>
        </div>
      ) : (
        <>
          {/* Risk Gauge Hero */}
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              <RiskGauge score={result.score} level={result.level} />
            </div>
          </div>

          {/* Categories Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider">Evaluated Signal Categories</h3>
              <span className="text-xs text-gray-400">Automated & AI verification</span>
            </div>
            <CategoryGrid
              categories={result.categories}
              showVoice={result.feature === 'voice'}
            />
          </div>

          {/* Evidence Cards */}
          {result.factors.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider">
                  Verified Evidence Signals ({result.factors.length})
                </h3>
                <span className="text-xs text-gray-400">Ranked by risk weight</span>
              </div>
              <div className="space-y-3">
                {result.factors.map((f, i) => (
                  <EvidenceCard key={`${f.code}-${i}`} factor={f} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* AI Reasoning (Reading Glass Container) */}
          {result.reasoning && (
            <ReasoningPanel reasoning={result.reasoning} factors={result.factors} />
          )}

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <RecommendationList recommendations={result.recommendations} />
          )}

          {/* Ruled Out Hints */}
          {result.dismissed_hints.length > 0 && (
            <RuledOutList hints={result.dismissed_hints} />
          )}

          {/* Contradictions */}
          {result.contradictions.length > 0 && (
            <div className="glass-card rounded-2xl border-[#FB923C]/40 p-5">
              <h3 className="text-sm font-bold text-[#FB923C] mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#FB923C]" />
                <span>Context Contradictions Detected</span>
              </h3>
              <ul className="space-y-2">
                {result.contradictions.map((c, i) => (
                  <li key={i} className="text-xs sm:text-sm text-gray-200 flex gap-2">
                    <span className="text-[#FB923C] mt-0.5 font-bold">•</span>
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

          {/* What-If Simulation CTA for Medium/High/Critical */}
          {result.score !== null && result.score >= 30 && (
            <div className="glass-strong border border-cyan/40 rounded-3xl p-6 sm:p-8 text-center shadow-[0_0_28px_rgba(34,211,238,0.25)] space-y-4">
              <div className="icon-tile icon-tile-gradient w-12 h-12 rounded-2xl mx-auto flex items-center justify-center">
                <GitBranch className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                  Simulate Next Attack Stages
                </h3>
                <p className="text-xs sm:text-sm text-gray-300 max-w-md mx-auto mt-1 leading-relaxed">
                  Explore what the sender is likely to demand next and discover the safest walking-away exit points.
                </p>
              </div>
              <div>
                <Link
                  to={`/check/whatif`}
                  state={{ analysisResult: result }}
                  className="btn-primary text-sm font-bold px-8 py-3 min-h-[44px] shadow-lg"
                >
                  <GitBranch className="w-4 h-4" />
                  <span>Simulate Next Steps</span>
                </Link>
              </div>
            </div>
          )}

          {/* Analysis Metadata Footer */}
          <div className="glass-pill px-4 py-2.5 text-xs text-gray-400 font-mono flex flex-wrap items-center justify-between gap-3 border-white/10">
            <span>Engine: {result.meta.model || 'Gemini 2.5'}</span>
            <span>Version: {result.meta.prompt_version || 'v1'}</span>
            <span>Execution: {(result.meta.duration_ms / 1000).toFixed(2)}s</span>
            <span>Report ID: #{result.id}</span>
          </div>
        </>
      )}
    </div>
  );
}
