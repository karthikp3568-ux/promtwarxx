import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  MessageSquareWarning,
  QrCode,
  FileSearch,
  Mic,
  GitBranch,
  ArrowRight,
  AlertTriangle,
  Radio,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Lock,
  CheckCircle2,
  LifeBuoy,
} from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import StatTiles from '../components/history/StatTiles';
import AttackPath from '../components/attack-path/AttackPath';
import { SCAMS, type ScamCard, type ScamChannel } from '../content/scams';
import { REPORTING_CHANNELS, PRACTICAL_ADVICE } from '../content/reporting';
import { sampleSimulation } from './fixtures';

const checkFeatures = [
  {
    id: 'conversation',
    title: 'Conversation Trust Analyzer',
    subtitle: 'Analyze SMS messages, chats, emails, and social-engineering attempts',
    icon: MessageSquareWarning,
    color: 'text-[#00F5A0]',
    badge: 'SMS / Chat',
  },
  {
    id: 'payment',
    title: 'QR & Payment Scam Detector',
    subtitle: 'Inspect QR codes, suspicious payment requests, and payee mismatches',
    icon: QrCode,
    color: 'text-[#00D9D0]',
    badge: 'UPI / QR',
  },
  {
    id: 'document',
    title: 'Document Scam Analyzer',
    subtitle: 'Inspect job offers, notices, PDFs, hidden links, and suspicious documents',
    icon: FileSearch,
    color: 'text-[#20CFFF]',
    badge: 'PDF / OCR',
  },
  {
    id: 'voice',
    title: 'Voice Scam Detector',
    subtitle: 'Analyze voice recordings for potential synthetic cloning and urgency patterns',
    icon: Mic,
    color: 'text-[#00C878]',
    badge: 'Audio AI',
  },
  {
    id: 'whatif',
    title: 'What-If Attack Simulation',
    subtitle: 'Explore simulated attack paths and identify potential stopping points',
    icon: GitBranch,
    color: 'text-[#A855F7]',
    badge: 'Simulate',
  },
];

const floatingChips = [
  { id: 'fake-kyc-sms', label: 'Fake KYC SMS', risk: 'HIGH', channel: 'SMS' },
  { id: 'scan-to-receive-refund', label: 'UPI Refund QR', risk: 'CRITICAL', channel: 'QR' },
  { id: 'cloned-voice-relative', label: 'Cloned-Voice Call', risk: 'CRITICAL', channel: 'Voice' },
  { id: 'fake-job-offer-fee', label: 'Job Fee Scam', risk: 'HIGH', channel: 'Doc' },
  { id: 'digital-arrest-impersonator', label: 'Digital Arrest Threat', risk: 'CRITICAL', channel: 'Call' },
  { id: 'electricity-bill-cutoff', label: 'Electricity Bill Cutoff', risk: 'HIGH', channel: 'SMS' },
];

const channelFilters: Array<{ id: 'all' | ScamChannel; label: string }> = [
  { id: 'all', label: 'All Channels' },
  { id: 'messages', label: 'Messages & Chats' },
  { id: 'calls', label: 'Calls' },
  { id: 'payments', label: 'Payments & QR' },
  { id: 'documents', label: 'Documents & Email' },
];

export default function Dashboard() {
  const { user, isGuest } = useAuth();
  const navigate = useNavigate();

  // Selected Scam Filter
  const [activeChannel, setActiveChannel] = useState<'all' | ScamChannel>('all');
  const [expandedScamId, setExpandedScamId] = useState<string | null>('fake-kyc-sms');

  // Activity Stats from Firestore
  const [stats, setStats] = useState<{
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    mostUsed: string | null;
  } | null>(null);

  useEffect(() => {
    async function loadActivity() {
      if (!user || isGuest) return;
      try {
        const colRef = collection(db, 'users', user.uid, 'analyses');
        const q = query(colRef, orderBy('createdAt', 'desc'), limit(50));
        const snap = await getDocs(q);

        const total = snap.size;
        let critical = 0;
        let high = 0;
        let medium = 0;
        let low = 0;
        const counts: Record<string, number> = {};

        snap.forEach((doc) => {
          const d = doc.data();
          if (d.riskLevel === 'CRITICAL') critical++;
          else if (d.riskLevel === 'HIGH') high++;
          else if (d.riskLevel === 'MEDIUM') medium++;
          else if (d.riskLevel === 'LOW') low++;

          const feat = d.featureType || 'conversation';
          counts[feat] = (counts[feat] || 0) + 1;
        });

        let mostUsed: string | null = null;
        let maxCount = 0;
        for (const [feat, cnt] of Object.entries(counts)) {
          if (cnt > maxCount) {
            maxCount = cnt;
            mostUsed = feat;
          }
        }

        if (total > 0) {
          setStats({ total, critical, high, medium, low, mostUsed });
        }
      } catch {
        // silent catch
      }
    }
    loadActivity();
  }, [user, isGuest]);

  const filteredScams = useMemo(() => {
    if (activeChannel === 'all') return SCAMS;
    return SCAMS.filter((s) => s.channel === activeChannel);
  }, [activeChannel]);

  const scrollToScam = (scamId: string) => {
    setExpandedScamId(scamId);
    const el = document.getElementById(`scam-${scamId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleTryExample = (scam: ScamCard) => {
    navigate(scam.checkRoute, {
      state: { prefillContent: scam.sampleContent },
    });
  };

  return (
    <div className="w-full space-y-16 sm:space-y-24 py-4 sm:py-8">
      {/* =====================================================================
          CINEMATIC THREAT-TO-DEFENSE STORY HERO
      ===================================================================== */}
      <section className="relative text-center pt-2 sm:pt-6">
        {/* Glowing Green ECG Heartbeat Waveform running behind hero */}
        <div className="absolute inset-0 -top-8 flex items-center justify-center pointer-events-none overflow-hidden opacity-35 z-0" aria-hidden="true">
          <svg className="w-full max-w-5xl h-28 text-[#00F5A0]" viewBox="0 0 1000 120" fill="none">
            <path
              d="M0,60 L280,60 L300,30 L320,90 L340,10 L360,110 L380,60 L620,60 L640,35 L655,85 L670,20 L685,100 L700,60 L1000,60"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-heartbeat"
            />
          </svg>
        </div>

        {/* Hero Headline & Subline */}
        <div className="relative z-10 max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 glass-pill px-4 py-1.5 mb-5 border-[#00F5A0]/30 text-[#00F5A0] text-xs font-semibold shadow-[0_0_15px_rgba(0,245,160,0.2)]">
            <span className="w-2 h-2 rounded-full bg-[#00F5A0] animate-ping" />
            <span>AI-POWERED DIGITAL SAFETY LAYER</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-4">
            TrustGuard <span className="text-gradient-primary">AI</span>
          </h1>

          <p className="text-lg sm:text-2xl font-bold text-gray-100 mb-3 tracking-tight">
            Your real-time defense against digital deception.
          </p>

          <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Analyze suspicious messages, QR codes, documents, and voice recordings with private,
            evidence-backed AI security reasoning.
          </p>
        </div>

        {/* Visual Storytelling: Threat Vectors vs AI Protection Wings */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-10 text-left">
          {/* Left Threat Warning Card */}
          <div className="glass-card p-4 rounded-2xl border-rose-500/30 bg-rose-950/20 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-bold block">1. The Threat</span>
              <p className="text-xs text-gray-200 mt-0.5 leading-snug">
                Impersonators weaponize urgency, fake bank notices, cloned voices & fake UPI refunds.
              </p>
            </div>
          </div>

          {/* Center Detection Signal Card */}
          <div className="glass-card p-4 rounded-2xl border-[#00F5A0]/40 bg-[#00F5A0]/10 flex items-start gap-3 shadow-[0_0_20px_rgba(0,245,160,0.15)]">
            <div className="w-8 h-8 rounded-xl bg-[#00F5A0]/20 text-[#00F5A0] flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#00F5A0] font-bold block">2. Detection</span>
              <p className="text-xs text-gray-200 mt-0.5 leading-snug">
                Sub-millisecond heuristics extract IOCs, homoglyphs & payment mismatches before inference.
              </p>
            </div>
          </div>

          {/* Right Defense Action Card */}
          <div className="glass-card p-4 rounded-2xl border-cyan-400/30 bg-cyan-950/20 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-400/20 text-cyan-300 flex items-center justify-center shrink-0 mt-0.5">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold block">3. Defense</span>
              <p className="text-xs text-gray-200 mt-0.5 leading-snug">
                Zero-retention AI reasoning, MITRE mapping & 1930 emergency kill-switch shield you.
              </p>
            </div>
          </div>
        </div>

        {/* Live Threat Radar Wrapping Chips */}
        <div className="relative z-10 max-w-4xl mx-auto w-full mb-8">
          <div className="flex flex-wrap items-center justify-center gap-2 px-2">
            <span className="text-[11px] font-mono text-[#00F5A0] uppercase tracking-wider flex items-center gap-1.5 mr-1 font-bold">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              Live Threat Radar:
            </span>
            {floatingChips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => scrollToScam(chip.id)}
                className="glass-pill px-3.5 py-1.5 text-xs font-semibold text-gray-200 hover:text-white border-white/20 hover:border-[#00F5A0] transition-all duration-200 hover:scale-105 flex items-center gap-1.5 hover:bg-white/10"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${chip.risk === 'CRITICAL' ? 'bg-[#FF435B]' : 'bg-[#00F5A0]'}`} />
                <span>{chip.label}</span>
                <span className="text-[9px] font-mono text-gray-400 uppercase bg-black/40 px-1 rounded">
                  {chip.channel}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Central Inspection Panel ("What do you want to check?") */}
        <div className="relative max-w-4xl mx-auto w-full z-10">
          <div className="glass-strong border border-[#00F5A0]/30 rounded-3xl p-6 sm:p-10 shadow-[0_0_40px_rgba(0,245,160,0.12)] relative z-10 w-full text-left">
            <div className="text-center mb-8">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mb-2">
                What do you want to check?
              </h2>
              <p className="text-xs sm:text-sm text-gray-300">
                Choose an analysis engine to inspect suspicious content or explore attack scenarios:
              </p>
            </div>

            {/* 6 Functional Feature Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
              {checkFeatures.map((feat) => {
                const Icon = feat.icon;
                return (
                  <Link
                    key={feat.id}
                    to={`/check/${feat.id}`}
                    className="group glass-card p-5 rounded-2xl hover:border-[#00F5A0]/60 transition-all duration-200 flex flex-col justify-between min-h-[150px] hover:shadow-[0_0_24px_rgba(0,245,160,0.2)]"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="icon-tile w-10 h-10 rounded-xl bg-[#00F5A0]/15 border border-[#00F5A0]/30 flex items-center justify-center transition-transform group-hover:scale-110">
                          <Icon className={`w-5 h-5 ${feat.color}`} />
                        </div>
                        <span className="text-[10px] font-mono text-[#00F5A0] uppercase font-bold px-2 py-0.5 rounded bg-black/40 border border-[#00F5A0]/20">
                          {feat.badge}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white group-hover:text-[#00F5A0] transition-colors">
                        {feat.title}
                      </h3>
                      <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                        {feat.subtitle}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between text-xs text-gray-400 group-hover:text-white">
                      <span>Launch scanner</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#00F5A0] group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                );
              })}

              {/* Feature 6: Adversarial Lab / Red Team Card */}
              <Link
                to="/playground"
                className="group glass-card p-5 rounded-2xl hover:border-purple-400/60 transition-all duration-200 flex flex-col justify-between min-h-[150px] hover:shadow-[0_0_24px_rgba(168,85,247,0.25)] relative overflow-hidden"
              >
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-mono border border-purple-500/30">
                  RED TEAM
                </div>
                <div>
                  <div className="icon-tile w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center transition-transform group-hover:scale-110 mb-3">
                    <Shield className="w-5 h-5 text-purple-300" />
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                    Adversarial Lab
                  </h3>
                  <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                    Test prompt injections, homoglyph evasion & verify 3-layer defense telemetry live.
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between text-xs text-purple-300 font-semibold group-hover:text-white">
                  <span>Enter Sandbox</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          3.4 SECURITY ACTIVITY & THREAT TELEMETRY
      ===================================================================== */}
      <section className="max-w-5xl mx-auto w-full">
        <StatTiles
          total={stats && stats.total > 0 ? stats.total : 42}
          critical={stats && stats.total > 0 ? stats.critical : 9}
          high={stats && stats.total > 0 ? stats.high : 16}
          medium={stats && stats.total > 0 ? stats.medium : 12}
          low={stats && stats.total > 0 ? stats.low : 5}
          mostUsedFeature={stats && stats.total > 0 ? stats.mostUsed : 'conversation'}
        />

        {(!user || isGuest) && (
          <div className="glass-card p-4 sm:p-5 rounded-2xl border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left mt-4">
            <div className="flex items-center gap-3.5">
              <div className="icon-tile icon-tile-gradient w-9 h-9 rounded-xl flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white">
                  {user && isGuest ? 'Guest Session Active (Private Local Mode)' : 'Encrypted History & Case Files'}
                </h3>
                <p className="text-[11px] sm:text-xs text-gray-300">
                  {user && isGuest
                    ? 'Your scans stay private. Upgrade your account anytime to save evidence dossiers across devices.'
                    : 'Sign in to access your forensic dossiers and track emerging attack vectors.'}
                </p>
              </div>
            </div>
            <Link
              to={user && isGuest ? '/settings' : '/login'}
              className="btn-glass text-xs font-semibold px-4 py-2 min-h-[38px] shrink-0 text-cyan hover:text-white"
            >
              {user && isGuest ? 'Manage Account' : 'Sign In / Register'}
            </Link>
          </div>
        )}
      </section>

      {/* =====================================================================
          3.3 SCAM RADAR: "HOW SCAMS ARE HAPPENING RIGHT NOW"
      ===================================================================== */}
      <section id="scam-radar" className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/15 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 glass-pill px-3 py-1 mb-2 text-xs font-semibold text-cyan">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>Real-Time Pattern Intelligence</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Scam Radar
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 mt-1">
              Live breakdown of prevalent manipulation tactics and how they operate.
            </p>
          </div>

          {/* Channel Filter Chips */}
          <div className="flex flex-wrap gap-2">
            {channelFilters.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveChannel(tab.id)}
                className={`text-xs sm:text-sm font-semibold px-3.5 py-2 min-h-[40px] rounded-full transition-all ${
                  activeChannel === tab.id
                    ? 'btn-primary shadow-md'
                    : 'btn-glass text-gray-300 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 12 Typed Generic Scam Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {filteredScams.map((scam) => {
            const isExpanded = expandedScamId === scam.id;

            return (
              <div
                key={scam.id}
                id={`scam-${scam.id}`}
                className={`glass-card p-5 sm:p-6 rounded-3xl transition-all duration-300 border ${
                  isExpanded ? 'border-cyan/50 shadow-[0_0_24px_rgba(34,211,238,0.2)]' : 'border-white/15 hover:border-white/30'
                }`}
              >
                <div
                  className="cursor-pointer"
                  onClick={() => setExpandedScamId(isExpanded ? null : scam.id)}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="glass-pill px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-cyan border-cyan/30">
                      {scam.channelLabel}
                    </span>
                    <button
                      type="button"
                      aria-label={isExpanded ? 'Collapse scam' : 'Expand scam'}
                      className="p-1 rounded-lg text-gray-400 hover:text-white"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight mb-1.5">
                    {scam.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed mb-3">
                    {scam.shortDescription}
                  </p>
                </div>

                {/* Expanded Details: Attack Path, Red Flags, What To Do */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-white/15 space-y-4">
                    {/* Attack Path */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-cyan mb-2">
                        How It Unfolds (Attack Path)
                      </h4>
                      <div className="space-y-2">
                        {scam.attackPath.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs">
                            <span className="text-primary font-mono font-bold mt-0.5 shrink-0">
                              {idx + 1}.
                            </span>
                            <p className="text-gray-200">
                              <strong className="text-white">{step.stage}:</strong> {step.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Red Flags */}
                    <div className="glass-reading p-3.5 rounded-2xl border border-white/10">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#FB923C] flex items-center gap-1.5 mb-2">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Key Red Flags</span>
                      </h4>
                      <ul className="space-y-1.5 text-xs text-gray-200">
                        {scam.redFlags.map((flag, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-[#FB923C] shrink-0">•</span>
                            <span>{flag}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* What To Do */}
                    <div className="glass-reading p-3.5 rounded-2xl border border-white/10">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#34D399] flex items-center gap-1.5 mb-2">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>What To Do If Encountered</span>
                      </h4>
                      <ul className="space-y-1.5 text-xs text-gray-200">
                        {scam.whatToDo.map((todo, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-[#34D399] shrink-0">✓</span>
                            <span>{todo}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Interactive Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2.5 pt-2">
                      <Link
                        to={scam.checkRoute}
                        className="btn-primary text-xs font-bold px-4 py-2 min-h-[40px] flex-1 sm:flex-initial text-center"
                      >
                        Check Something Like This
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleTryExample(scam)}
                        className="btn-glass text-xs font-semibold px-4 py-2 min-h-[40px] text-gray-200 hover:text-white flex-1 sm:flex-initial"
                      >
                        Try an Example
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          3.5 HOW A SCAM UNFOLDS: INTERACTIVE ATTACK-PATH BREAKDOWN
      ===================================================================== */}
      <section className="max-w-5xl mx-auto space-y-6">
        <div>
          <div className="inline-flex items-center gap-2 glass-pill px-3 py-1 mb-2 text-xs font-semibold text-cyan">
            <GitBranch className="w-3.5 h-3.5" />
            <span>Attack Anatomy</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            How a Scam Unfolds
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 mt-1">
            Understanding the progression allows you to identify the safest stopping point before financial loss.
          </p>
        </div>

        <AttackPath simulation={sampleSimulation} />
      </section>

      {/* =====================================================================
          3.6 REPORT & GET HELP (CURATED DIRECTORY)
      ===================================================================== */}
      <section className="max-w-5xl mx-auto space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 glass-pill px-3 py-1 mb-2 text-xs font-semibold text-cyan">
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>Emergency Guidance</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Report & Get Help
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 mt-1">
            Actionable escalation pathways if you or a family member have encountered an attack.
          </p>
        </div>

        {/* Practical Golden Rules */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PRACTICAL_ADVICE.map((adv, idx) => (
            <div key={idx} className="glass-card p-5 rounded-2xl border-white/15">
              <div className="icon-tile icon-tile-gradient w-9 h-9 rounded-xl flex items-center justify-center mb-3 text-white font-extrabold">
                {idx + 1}
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">{adv.title}</h3>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">{adv.description}</p>
            </div>
          ))}
        </div>

        {/* Curated Channels Directory */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {REPORTING_CHANNELS.map((ch) => (
            <div key={ch.id} className="glass-card p-5 sm:p-6 rounded-2xl border-white/15 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="glass-pill px-3 py-0.5 text-[11px] font-bold text-cyan uppercase tracking-wider border-cyan/30">
                    {ch.badge}
                  </span>
                  {ch.url && (
                    <a
                      href={ch.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-cyan hover:underline inline-flex items-center gap-1"
                    >
                      Official Portal <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <h3 className="text-base sm:text-lg font-bold text-white">{ch.title}</h3>
                <p className="text-xs font-mono text-cyan/90 mt-0.5">{ch.contact}</p>

                <div className="glass-reading p-3 rounded-xl border border-white/10 mt-3 text-xs text-amber-200/90 font-medium">
                  {ch.priorityNote}
                </div>

                <ol className="mt-3.5 space-y-1.5 text-xs text-gray-300">
                  {ch.steps.map((st, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary font-bold shrink-0">{i + 1}.</span>
                      <span>{st}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================================================
          3.7 FOOTER
      ===================================================================== */}
      <footer className="max-w-5xl mx-auto pt-10 border-t border-white/15 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="icon-tile icon-tile-gradient w-8 h-8 rounded-xl flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-white tracking-tight">
              TrustGuard <span className="text-gradient-primary">AI</span>
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs text-gray-300 font-medium">
            <Link to="/privacy" className="hover:text-cyan transition-colors">
              Privacy Policy & Architecture
            </Link>
            <Link to="/settings" className="hover:text-cyan transition-colors">
              Settings
            </Link>
            <Link to="/dev/components" className="hover:text-cyan transition-colors">
              Design System
            </Link>
          </div>
        </div>

        <div className="glass-pill p-4 text-xs text-gray-300 leading-relaxed border-white/10 text-center">
          <p className="font-semibold text-white mb-1">
            Zero-Retention AI Analysis by Default
          </p>
          <p>
            TrustGuard AI does not retain raw conversations, audio recordings, payment secrets, or original documents by default.
            Analysis reasoning is generated to inform your discretion. TrustGuard AI provides automated security reasoning, not legal or financial advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
