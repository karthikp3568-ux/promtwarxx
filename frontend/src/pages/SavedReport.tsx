import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowLeft, GitBranch, AlertCircle, Loader2, Info } from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthProvider';
import type { AnalysisResult } from '../api/types';
import AnalysisResultView from '../features/conversation/AnalysisResultView';

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
          factors: (data.evidence || data.factors || []).map((f: any) => ({
            code: f.code,
            category: f.category || 'Pattern',
            severity: f.severity || 'MEDIUM',
            weight: f.weight ?? 0,
            source: f.source || 'ai',
            title: f.title || f.code,
            why_it_matters: f.description || f.whyItMatters || f.why_it_matters || '',
            evidence: f.evidence || null,
          })),
          categories: data.categories || (data.riskCategories ? Object.entries(data.riskCategories).map(([cat, label]) => ({
            category: cat.charAt(0).toUpperCase() + cat.slice(1),
            severity: label === 'NOT_DETECTED' ? null : (label as any),
            label: label === 'NOT_DETECTED' ? 'Not detected' : String(label).charAt(0) + String(label).slice(1).toLowerCase(),
          })) : []),
          dismissed_hints: data.dismissed_hints || [],
          content_type: data.contentType || 'saved',
          claimed_identity: data.claimedIdentity || null,
          sender_intent: data.senderIntent || null,
          contradictions: data.contradictions || [],
          attack_stage: data.attackStage || null,
          reasoning: data.reasoning || '',
          recommendations: (data.recommendations || []).map((r: any) => typeof r === 'string' ? r : r.action || ''),
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
      } catch (err: any) {
        setError(err.message || 'Failed to load saved report.');
      } finally {
        setLoading(false);
      }
    }

    loadAnalysis();
  }, [user, id]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-gray-400">Loading saved report...</p>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="w-full max-w-xl mx-auto py-12 text-center">
        <AlertCircle className="w-12 h-12 text-risk-high mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Report Not Available</h2>
        <p className="text-gray-400 mb-6">{error || 'Could not find this saved report.'}</p>
        <Link
          to="/history"
          className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] bg-navy-800 hover:bg-navy-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to History
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/history')}
          className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors min-h-[44px] px-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to History
        </button>

        <Link
          to={`/check/whatif?analysis_id=${record.id}`}
          className="flex items-center gap-2 px-3 py-1.5 bg-purple-900/60 hover:bg-purple-800/80 border border-purple-700 text-purple-200 text-sm font-medium rounded-lg transition-colors"
        >
          <GitBranch className="w-4 h-4" />
          Simulate Attack Path
        </Link>
      </div>

      {/* Required privacy disclosure */}
      <div className="flex items-start gap-3 bg-navy-800/80 border border-navy-700 rounded-xl p-4 text-sm text-gray-300">
        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white">Saved report — original content not stored.</span>
          <p className="text-xs text-gray-400 mt-0.5">
            For privacy, raw text, uploaded files, and phone recordings are never saved. Only the security indicators and risk assessment are preserved.
          </p>
        </div>
      </div>

      <AnalysisResultView
        result={record}
        onReset={() => navigate('/history')}
      />
    </div>
  );
}
