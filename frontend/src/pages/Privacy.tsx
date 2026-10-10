import { Shield, Lock, EyeOff, Server, Database, AlertTriangle, ExternalLink, CheckCircle2 } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Page Header Card */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border-white/20 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="icon-tile icon-tile-gradient w-12 h-12 rounded-2xl flex items-center justify-center shrink-0">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">Privacy & Data Protection</h1>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">TrustGuard AI is engineered from the ground up on zero-retention and privacy-preserving principles. We never retain your private conversations, credentials, or personal documents.</p>
          </div>
        </div>
      </div>

      {/* Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5 border-white/15 shadow-lg">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-3">
            <EyeOff className="w-5 h-5 text-emerald-400" />
          </div>
          <h2 className="text-sm font-bold text-white mb-1">Zero-Retention</h2>
          <p className="text-xs text-gray-300 leading-relaxed">
            Content is analyzed strictly in volatile memory. No text, images, or audio files are written to server disks.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-5 border-white/15 shadow-lg">
          <div className="w-9 h-9 rounded-xl bg-cyan/20 flex items-center justify-center mb-3">
            <Server className="w-5 h-5 text-cyan" />
          </div>
          <h2 className="text-sm font-bold text-white mb-1">Local & Isolated</h2>
          <p className="text-xs text-gray-300 leading-relaxed">
            URL sandboxing and voice spoof models run in isolated environments without sending voice biometric datasets to third parties.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-5 border-white/15 shadow-lg">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center mb-3">
            <Database className="w-5 h-5 text-purple-400" />
          </div>
          <h2 className="text-sm font-bold text-white mb-1">You Own Your History</h2>
          <p className="text-xs text-gray-300 leading-relaxed">
            History only preserves risk labels and recommendations. You can turn off history saving or purge all records at any time.
          </p>
        </div>
      </div>

      {/* Main Sections */}
      <div className="space-y-6">
        <Section
          icon={<Server className="w-5 h-5 text-primary" />}
          title="How Your Data Is Processed"
        >
          <ul className="space-y-3.5">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-1 shrink-0" />
              <span>
                <strong>Gemini Cloud Processing:</strong> Text and visual artifacts are submitted to Google's Gemini API for multimodal reasoning and threat detection. Under standard developer tier terms, Google may process data for product improvement according to their terms.
                <a
                  href="https://ai.google.dev/gemini-api/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan hover:underline inline-flex items-center gap-1 ml-1.5 font-medium"
                >
                  Google API Terms <ExternalLink className="w-3 h-3" />
                </a>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-1 shrink-0" />
              <span>
                <strong>Voice Authenticity Pipeline:</strong> Voice recordings are processed by our dedicated backend engine to inspect spectral spoofing signatures and transcribe speech for manipulation checks.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-1 shrink-0" />
              <span>
                <strong>Safe URL Sandboxing:</strong> Links detected in submitted text or QR codes are probed with SSRF-safe redirect inspection to expose deceptive destinations before you visit them.
              </span>
            </li>
          </ul>
        </Section>

        <Section
          icon={<Database className="w-5 h-5 text-cyan" />}
          title="What We Store (And What We Don't)"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-reading rounded-xl p-4 border border-emerald-500/30">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> What Is Kept (With Consent)
              </h3>
              <ul className="text-xs space-y-1.5 text-gray-200">
                <li>• Anonymized Analysis ID and timestamp</li>
                <li>• Feature type (e.g. Conversation, QR, Voice)</li>
                <li>• Numerical risk score and category indicators</li>
                <li>• Generic defensive recommendations</li>
                <li>• Brief 120-character summary without PII</li>
              </ul>
            </div>

            <div className="glass-reading rounded-xl p-4 border border-[#F43F5E]/30">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> What Is NEVER Stored
              </h3>
              <ul className="text-xs space-y-1.5 text-gray-200">
                <li>• Raw message conversation transcripts</li>
                <li>• Uploaded PDF documents or images</li>
                <li>• Voice audio recordings or voiceprints</li>
                <li>• Passwords, OTP codes, or banking credentials</li>
                <li>• Phone numbers or personal contact lists</li>
              </ul>
            </div>
          </div>
        </Section>

        <Section
          icon={<AlertTriangle className="w-5 h-5 text-amber-400" />}
          title="What TrustGuard AI Does Not Do"
        >
          <ul className="space-y-3">
            {[
              'We do NOT verify identities or connect directly to private accounts (WhatsApp, Telegram, banks, or payment apps).',
              'We do NOT execute or render uploaded files in an insecure environment.',
              'We do NOT provide "official" phone numbers or bank URLs. We always advise checking the physical card or official app.',
              'We do NOT claim 100% certainty or end-to-end secret encryption. AI assessments are probabilistic advisory tools.',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-amber-400 mt-2 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card rounded-2xl p-6 sm:p-7 border-white/15 shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>
      </div>
      <div className="text-gray-200 text-sm leading-relaxed">{children}</div>
    </div>
  );
}
