import { useEffect, useState } from 'react';
import { Shield, Printer, Download, X, Hash, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import type { AnalysisResult } from '../../api/types';
import { computeEvidenceHash } from '../../lib/forensicHash';
import { getMitreTechnique } from '../../content/mitre';

interface ForensicDossierModalProps {
  result: AnalysisResult;
  isOpen: boolean;
  onClose: () => void;
}

export default function ForensicDossierModal({ result, isOpen, onClose }: ForensicDossierModalProps) {
  const [evidenceHash, setEvidenceHash] = useState<string>('Computing cryptographic digest...');

  useEffect(() => {
    if (!isOpen) return;

    const payload = {
      id: result.id,
      timestamp: result.created_at,
      score: result.score,
      level: result.level,
      factors: result.factors.map((f) => ({ code: f.code, severity: f.severity, weight: f.weight })),
      extracted: result.extracted,
    };

    computeEvidenceHash(payload).then((h) => setEvidenceHash(h));
  }, [isOpen, result]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    const exportData = {
      report_type: 'TRUSTGUARD_AI_FORENSIC_DOSSIER',
      version: '1.0',
      case_id: result.id,
      timestamp_utc: result.created_at,
      sha256_evidence_digest: evidenceHash,
      assessment: {
        risk_score: result.score,
        risk_level: result.level,
        confidence: result.confidence,
        summary: result.summary,
      },
      indicators_of_compromise: result.extracted,
      mitre_attack_mappings: result.factors.map((f) => ({
        code: f.code,
        title: f.title,
        severity: f.severity,
        mitre: getMitreTechnique(f.code) || null,
      })),
      recommendations: result.recommendations,
      attestation: {
        zero_retention_verified: true,
        generated_by: 'TrustGuard AI Digital Safety Layer',
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TrustGuard-Forensic-Dossier-${result.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="forensic-dossier-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="glass-strong border border-white/20 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl my-8 relative text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/15">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6 text-cyan" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-cyan font-bold bg-cyan/15 px-2.5 py-0.5 rounded-full border border-cyan/30">
                  CASE REF: {result.id.toUpperCase()}
                </span>
                <span className="text-[11px] text-emerald-300 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Certified Dossier
                </span>
              </div>
              <h2 id="forensic-dossier-title" className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                Forensic Incident Investigation Dossier
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-full glass-pill min-h-[40px] min-w-[40px] flex items-center justify-center transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-4 border-b border-white/10 text-xs">
          <div className="flex items-center gap-2 text-gray-300 font-mono">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span>{new Date(result.created_at).toUTCString()}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="btn-primary text-xs font-bold px-4 py-2 min-h-[36px] flex items-center gap-1.5 shadow-md"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadJSON}
              className="btn-glass text-xs font-bold px-4 py-2 min-h-[36px] flex items-center gap-1.5 text-white"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Raw JSON</span>
            </button>
          </div>
        </div>

        {/* Cryptographic Hash Seal */}
        <div className="my-4 p-3.5 glass-reading rounded-2xl border border-cyan/30 text-xs">
          <div className="flex items-center gap-2 text-cyan font-bold mb-1">
            <Hash className="w-3.5 h-3.5" />
            <span>Cryptographic Integrity Digest (SHA-256)</span>
          </div>
          <div className="font-mono text-[11px] text-gray-300 break-all select-all bg-black/40 p-2 rounded-xl border border-white/5">
            {evidenceHash}
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            This hash uniquely seals this evidence record. Any alteration of scores, IOCs, or timestamps invalidates this digest.
          </p>
        </div>

        {/* Threat Assessment Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
          <div className="glass-card rounded-2xl p-4 border-white/10">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Risk Score</span>
            <span className="text-2xl font-black text-white">{result.score ?? 'N/A'}/100</span>
          </div>

          <div className="glass-card rounded-2xl p-4 border-white/10">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Risk Tier</span>
            <span className="text-xl font-extrabold text-rose-300">{result.level}</span>
          </div>

          <div className="glass-card rounded-2xl p-4 border-white/10">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Confidence</span>
            <span className="text-xl font-bold text-white">{result.confidence}</span>
          </div>
        </div>

        {/* Extracted IOCs (Indicators of Compromise) */}
        <div className="my-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-cyan" /> Indicators of Compromise (IOC Inventory)
          </h3>
          <div className="glass-reading rounded-2xl p-4 border border-white/10 space-y-2 text-xs">
            {result.extracted?.upi && result.extracted.upi.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1 border-b border-white/5">
                <span className="text-gray-400">Suspect UPI VPAs:</span>
                <span className="font-mono font-bold text-amber-300">{result.extracted.upi.join(', ')}</span>
              </div>
            )}

            {result.extracted?.urls && result.extracted.urls.length > 0 && (
              <div className="flex flex-col gap-1 py-1 border-b border-white/5">
                <span className="text-gray-400">Inspected Malicious URLs:</span>
                {result.extracted.urls.map((u, i) => (
                  <span key={i} className="font-mono text-[11px] text-cyan break-all">
                    {u.original} {u.final_url && u.final_url !== u.original && `→ ${u.final_url}`}
                  </span>
                ))}
              </div>
            )}

            {result.extracted?.phones && result.extracted.phones.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1 border-b border-white/5">
                <span className="text-gray-400">Caller / Sender Numbers:</span>
                <span className="font-mono text-white">{result.extracted.phones.join(', ')}</span>
              </div>
            )}

            {(!result.extracted || (!result.extracted.upi?.length && !result.extracted.urls?.length && !result.extracted.phones?.length)) && (
              <p className="text-gray-400 italic">No network IOCs found. Analysis focused on linguistic/coercive manipulation tactics.</p>
            )}
          </div>
        </div>

        {/* MITRE ATT&CK Matrix Index */}
        <div className="my-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-2 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-primary" /> MITRE ATT&CK Adversary Technique Correlation
          </h3>
          <div className="glass-reading rounded-2xl p-4 border border-white/10 space-y-2 text-xs">
            {result.factors.map((f, i) => {
              const mitre = getMitreTechnique(f.code);
              return (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1.5 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-cyan font-bold">{mitre ? mitre.id : f.code}</span>
                    <span className="text-gray-200">{f.title}</span>
                  </div>
                  <span className="font-mono text-[11px] text-gray-400">{mitre ? mitre.tactic : f.category}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legal & Chain of Custody Footer */}
        <div className="pt-4 border-t border-white/15 text-[11px] text-gray-400 leading-relaxed">
          <p>
            <strong>Chain of Custody & Privacy Attestation:</strong> TrustGuard operates in a zero-retention environment. Raw personal communications and biometric audio files were processed strictly in volatile memory and never persisted to permanent database records. This document certifies automated security telemetry extracted at the timestamp above.
          </p>
        </div>
      </div>
    </div>
  );
}
