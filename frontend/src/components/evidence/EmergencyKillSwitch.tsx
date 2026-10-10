import { useState } from 'react';
import { ShieldAlert, PhoneCall, Copy, Check, ExternalLink, ShieldCheck, Zap } from 'lucide-react';
import type { AnalysisResult } from '../../api/types';

interface EmergencyKillSwitchProps {
  result: AnalysisResult;
}

export default function EmergencyKillSwitch({ result }: EmergencyKillSwitchProps) {
  const [copiedDraft, setCopiedDraft] = useState(false);

  // Check if financial, credential, or high risk factors exist
  const isHighRisk = result.level === 'CRITICAL' || result.level === 'HIGH';
  const hasCredentialOrFinancialFactor = result.factors.some(
    (f) =>
      f.category === 'Financial' ||
      f.category === 'Credentials' ||
      ['OTP_PIN_REQUEST', 'RECEIVE_VIA_PAY', 'REMOTE_ACCESS_REQUEST', 'CREDENTIAL_REQUEST'].includes(f.code)
  );

  if (!isHighRisk && !hasCredentialOrFinancialFactor) {
    return null;
  }

  // Generate official pre-formatted complaint text
  const iocList = [
    ...(result.extracted?.upi ? result.extracted.upi.map((u) => `UPI VPA: ${u}`) : []),
    ...(result.extracted?.phones ? result.extracted.phones.map((p) => `Phone: ${p}`) : []),
    ...(result.extracted?.urls ? result.extracted.urls.map((u) => `Malicious URL: ${u.original}`) : []),
  ].join('\n');

  const complaintDraft = `INCIDENT REPORT: FINANCIAL/CYBER SECURITY THREAT
Date/Time (UTC): ${result.created_at}
Threat Level: ${result.level} (Score: ${result.score}/100)
Assessment Summary: ${result.summary || 'Social engineering attempt detected by TrustGuard AI'}

Key Indicators of Compromise (IOCs):
${iocList || 'Direct message / oral coercive solicitation'}

Primary Recommendations Followed:
${result.recommendations?.slice(0, 3).map((r, i) => `${i + 1}. ${r}`).join('\n')}

Reported via TrustGuard AI Digital Safety Layer (Ref: ${result.id})`;

  const handleCopyDraft = async () => {
    try {
      await navigator.clipboard.writeText(complaintDraft);
      setCopiedDraft(true);
      setTimeout(() => setCopiedDraft(false), 3000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="glass-card rounded-3xl border-[#F43F5E]/40 p-5 sm:p-6 shadow-2xl relative overflow-hidden bg-gradient-to-br from-[#F43F5E]/15 via-black/40 to-transparent">
      {/* Top Banner */}
      <div className="flex items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#F43F5E]/25 border border-[#F43F5E]/40 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-[#F43F5E] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-rose-300 uppercase tracking-wider">
                Emergency Fraud Defense
              </span>
              <span className="glass-pill text-[10px] px-2 py-0.5 text-rose-200 border-rose-500/40">
                Priority 1 Action
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Immediate Financial & Device Protection Protocol
            </h3>
          </div>
        </div>
      </div>

      <p className="text-xs sm:text-sm text-gray-200 mb-5 leading-relaxed">
        High-confidence indicators of financial fraud or credential capture were detected. If you shared any OTP, approved a request, or installed an app, take these immediate actions:
      </p>

      {/* 3 Step Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-5 text-xs">
        {/* Step 1 */}
        <div className="glass-reading rounded-2xl p-4 border border-rose-500/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-rose-300 font-bold mb-2">
              <Zap className="w-4 h-4 text-rose-400" />
              <span>Step 1: Emergency Freeze</span>
            </div>
            <p className="text-gray-300 leading-relaxed">
              If an unauthorized debit happened or PIN was shared, dial <strong>1930</strong> (National Cybercrime Hotline) immediately within the golden hour to freeze fund routing.
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-white/10">
            <a
              href="tel:1930"
              className="inline-flex items-center gap-1.5 text-rose-300 hover:text-white font-bold"
            >
              <PhoneCall className="w-3.5 h-3.5" /> Call 1930 Hotline
            </a>
          </div>
        </div>

        {/* Step 2 */}
        <div className="glass-reading rounded-2xl p-4 border border-amber-500/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-300 font-bold mb-2">
              <PhoneCall className="w-4 h-4 text-amber-400" />
              <span>Step 2: Sever Remote Access</span>
            </div>
            <p className="text-gray-300 leading-relaxed">
              If you were told to download AnyDesk or TeamViewer, immediately enable <strong>Airplane Mode</strong>, disconnect WiFi, and uninstall the remote control software.
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-white/10 text-gray-400 font-medium">
            Turn on Airplane Mode immediately
          </div>
        </div>

        {/* Step 3 */}
        <div className="glass-reading rounded-2xl p-4 border border-cyan/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-cyan font-bold mb-2">
              <ShieldCheck className="w-4 h-4 text-cyan" />
              <span>Step 3: Freeze UPI via USSD</span>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Dial <strong>*99#</strong> from your registered SIM card to access offline NPCI USSD banking to disable or change your UPI profile without internet access.
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-white/10">
            <span className="font-mono text-cyan font-semibold">Offline code: *99#</span>
          </div>
        </div>
      </div>

      {/* Official Complaint Draft Bar */}
      <div className="glass-reading rounded-2xl p-4 border border-white/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Copy className="w-3.5 h-3.5 text-cyan" /> Pre-Formatted Incident Complaint
          </span>
          <p className="text-[11px] text-gray-300 leading-relaxed">
            Ready-to-submit text formatted for your bank's fraud dispute form or the National Cybercrime portal.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleCopyDraft}
            className="btn-glass text-xs font-bold px-4 py-2 min-h-[40px] flex items-center justify-center gap-1.5 flex-1 sm:flex-initial text-white"
          >
            {copiedDraft ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Complaint Draft</span>
              </>
            )}
          </button>

          <a
            href="https://cybercrime.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-xs font-bold px-4 py-2 min-h-[40px] flex items-center justify-center gap-1.5 shrink-0"
          >
            <span>Cybercrime Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
