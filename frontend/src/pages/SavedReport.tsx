import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowLeft, GitBranch, AlertCircle, Loader2, ShieldCheck, Lock, FileText } from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthProvider';
import type { AnalysisResult, Factor, Severity } from '../api/types';
import AnalysisResultView from '../features/conversation/AnalysisResultView';

const FEATURE_LABELS: Record<string, string> = {
  conversation: 'Conversation analysis',
  payment: 'QR & payment analysis',
  document: 'Document analysis',
  voice: 'Voice analysis',
  whatif: 'What-If simulation',
};

export default function SavedReport() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [record, setRecord] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAnalysis() {
      if (!user || !id) return;
      setLoading(true);
      setError(null);
      try {
        const docRef = doc(db, 'users', user.uid, 'analyses', id);
        const snap = await getDoc(docRef);
        if (!snap.exists()) {
          setError('Analysis report not found.');
          return;
        }
        const data = snap.data();
        // Reconstruct AnalysisResult object from saved Firestore schema
        const reconstructed: AnalysisResult = {
          id: snap.id,
          feature: data.featureType || 'conversation',
          created_at: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
          status: 'assessed',
          score: data.riskScore ?? null,
          level: data.riskLevel ?? null,
          confidence: data.confidence || 'MEDIUM',
          factors: (data.evidence || data.factors || []).map((f: Partial<Factor> & { whyItMatters?: string; description?: string }) => ({
            code: f.code || 'UNKNOWN',
            category: f.category || 'Pattern',
            severity: f.severity || 'MEDIUM',
            weight: f.weight ?? 0,
            source: f.source || 'ai',
            title: f.title || f.code || 'Indicator',
            why_it_matters: f.description || f.whyItMatters || f.why_it_matters || '',
            evidence: f.evidence || null,
          })),
          categories: data.categories || (data.riskCategories ? Object.entries(data.riskCategories).map(([cat, label]) => ({
            category: cat.charAt(0).toUpperCase() + cat.slice(1),
            severity: label === 'NOT_DETECTED' ? null : (label as Severity),
            label: label === 'NOT_DETECTED' ? 'Not detected' : String(label).charAt(0) + String(label).slice(1).toLowerCase(),
          })) : []),
          dismissed_hints: data.dismissed_hints || [],
          content_type: data.contentType || 'saved',
          claimed_identity: data.claimedIdentity || null,
          sender_intent: data.senderIntent || null,
          contradictions: data.contradictions || [],
          attack_stage: data.attackStage || null,
          reasoning: data.reasoning || '',
          recommendations: (data.recommendations || []).map((r: string | { action?: string }) => typeof r === 'string' ? r : r.action || ''),
          summary: data.summary || '',
          extracted: data.extracted || {
            urls: [],
            upi: [],
            emails: [],
            phones: [],
            amounts: [],
            deadlines: [],
            orgs: [],
            refs: [],
          },
          details: data.details || null,
          meta: {
            model: data.meta?.model || data.model || 'stored',
            prompt_version: data.meta?.promptVersion || data.promptVersion || '',
            duration_ms: data.meta?.duration_ms || data.durationMs || 0,
            cached: data.meta?.cached ?? false,
          },
        };
        setRecord(reconstructed);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load saved report.');
      } finally {
        setLoading(false);
      }
    }

    loadAnalysis();
  }, [user, id]);

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto py-20 text-center flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="text-sm text-gray-400">Loading saved report...</span>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="w-full max-w-4xl mx-auto py-12 animate-fadeIn">
        <div className="glass-card rounded-3xl border border-[#F43F5E]/30 p-8 text-center max-w-md mx-auto shadow-2xl">
          <div className="icon-tile w-14 h-14 rounded-2xl bg-[#F43F5E]/20 mx-auto mb-4 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-[#F43F5E]" />
          </div>
          <h1 className="text-lg font-extrabold text-white mb-2 tracking-tight">Report Not Available</h1>
          <p className="text-sm text-gray-300 mb-6 leading-relaxed">{error || 'Could not find this saved report.'}</p>
          <Link
            to="/history"
            className="btn-primary inline-flex items-center gap-2 text-sm px-5 py-2.5 min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to History</span>
          </Link>
        </div>
      </div>
    );
  }

  const featureLabel = FEATURE_LABELS[record.feature] || `${record.feature.replace('_', ' ')} analysis`;
  const createdLabel = new Date(record.created_at).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const newAnalysisPath = `/check/${record.feature in FEATURE_LABELS ? record.feature : 'conversation'}`;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Page Header Card */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border-white/20 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="icon-tile icon-tile-gradient w-12 h-12 rounded-2xl flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">Saved Report</h1>
            <p className="text-xs sm:text-sm text-gray-300">
              {featureLabel} · {createdLabel}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => navigate('/history')}
            className="btn-glass w-full sm:w-auto whitespace-nowrap flex items-center justify-center gap-2 text-sm font-semibold text-gray-200 hover:text-white min-h-[44px] px-4 py-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to History</span>
          </button>

          <Link
            to={`/check/whatif?analysis_id=${record.id}`}
            state={{ analysisResult: record }}
            className="btn-primary w-full sm:w-auto whitespace-nowrap flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] text-sm font-bold shadow-lg"
          >
            <GitBranch className="w-4 h-4" />
            <span>Simulate Attack Path</span>
          </Link>
        </div>
      </div>

      {/* Required privacy disclosure */}
      <div className="glass-card rounded-2xl border-white/15 p-4 sm:p-5 flex items-start gap-3.5 text-sm text-gray-200 shadow-md">
        <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
          <Lock className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-white">Saved report — original content not stored</span>
            <span className="glass-pill text-[11px] px-2 py-0.5 text-emerald-300 border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Zero Retention
            </span>
          </div>
          <p className="text-xs text-gray-300 mt-1 leading-relaxed">
            For your security and privacy, raw conversation text, uploaded files, and voice recordings are never stored on servers or database records. Only the cryptographic risk score, signal taxonomy breakdown, and defensive recommendations are preserved.
          </p>
        </div>
      </div>

      <AnalysisResultView
        result={record}
        onReset={() => navigate(newAnalysisPath)}
      />
    </div>
  );
}
