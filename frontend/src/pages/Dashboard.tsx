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
    title: 'Conversation',
    subtitle: 'Analyze SMS, chats, emails & social messages for social engineering',
    icon: MessageSquareWarning,
    color: 'text-primary',
    gradient: 'from-blue-500/20 to-indigo-500/20',
  },
  {
    id: 'payment',
    title: 'QR & Payment',
    subtitle: 'Verify UPI QR codes, collect requests & mismatched payee details',
    icon: QrCode,
    color: 'text-[#FBBF24]',
    gradient: 'from-amber-500/20 to-orange-500/20',
  },
  {
    id: 'document',
    title: 'Document',
    subtitle: 'Inspect job offer letters, notices & PDFs for active malware & hidden links',
    icon: FileSearch,
    color: 'text-cyan',
    gradient: 'from-cyan-500/20 to-blue-500/20',
  },
  {
    id: 'voice',
    title: 'Voice',
    subtitle: 'Detect synthetic AI voice cloning & coercive urgency patterns',
    icon: Mic,
    color: 'text-[#FB923C]',
    gradient: 'from-orange-500/20 to-rose-500/20',
  },
  {
    id: 'whatif',
    title: 'What-If',
    subtitle: 'Simulate how an attack unfolds and pinpoint safe stopping points',
    icon: GitBranch,
    color: 'text-[#A855F7]',
    gradient: 'from-purple-500/20 to-pink-500/20',
  },
];

const floatingChips = [
  { id: 'fake-kyc-sms', label: 'Fake KYC SMS', pos: '-top-4 left-6' },
  { id: 'scan-to-receive-refund', label: 'UPI Refund QR', pos: '-top-4 right-6' },
  { id: 'cloned-voice-relative', label: 'Cloned-Voice Call', pos: '-bottom-4 left-8' },
  { id: 'fake-job-offer-fee', label: 'Job Fee Offer Letter', pos: '-bottom-4 right-8' },
  { id: 'digital-arrest-impersonator', label: 'Digital Arrest Threat', pos: 'top-1/2 left-2 -translate-y-1/2' },
  { id: 'electricity-bill-cutoff', label: 'Electricity Bill Cutoff', pos: 'top-1/2 right-2 -translate-y-1/2' },
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

        let total = snap.size;
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
          3.2 HERO + CHECK HUB (THE CENTRE OF THE PAGE)
      ===================================================================== */}
      <section className="relative text-center pt-2 sm:pt-6">
        {/* Floating Marquee on Screens (< 1280px) */}
        <div className="xl:hidden mb-8 overflow-x-auto pb-2 scrollbar-none w-full max-w-full">
          <div className="flex gap-2.5 justify-start sm:justify-center px-2 w-max max-w-none">
            {floatingChips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => scrollToScam(chip.id)}
                className="glass-pill px-3.5 py-1.5 text-xs text-gray-200 hover:text-white border-white/20 hover:border-cyan transition-all flex items-center gap-1.5 shrink-0"
              >
                <Radio className="w-3 h-3 text-cyan animate-pulse" />
                <span>{chip.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Hero Headline & Subline */}
        <div className="max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 glass-pill px-4 py-1.5 mb-5 border-cyan/30 text-cyan text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Powered Digital Safety Layer</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-4">
            <span className="text-gradient-primary">TrustGuard AI</span>
          </h1>

          <p className="text-lg sm:text-2xl font-bold text-gray-100 mb-3 tracking-tight">
            Your real-time defense against digital deception.
          </p>

          <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Analyze suspicious messages, QR codes, documents and voice recordings with private,
            evidence-backed AI security reasoning.
          </p>
        </div>

        {/* Central Check Hub with Desktop Floating Chips */}
        <div className="relative max-w-4xl mx-auto">
          {/* Floating Chips Around the Hub (Desktop >= 1280px) */}
          <div className="hidden xl:block pointer-events-auto" aria-hidden="false">
            {floatingChips.map((chip, i) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => scrollToScam(chip.id)}
                className={`absolute z-20 ${chip.pos} glass-pill px-4 py-2 text-xs font-semibold text-gray-200 hover:text-white border-white/25 hover:border-cyan shadow-lg transition-all duration-300 hover:scale-105 flex items-center gap-2`}
                style={{
                  animation: `chip-float-${(i % 2) + 1} 4s ease-in-out infinite`,
                }}
              >
                <div className="w-2 h-2 rounded-full bg-cyan animate-ping" />
                <span>{chip.label}</span>
              </button>
            ))}
          </div>

          {/* Central Frosted Glass Check Hub Container */}
          <div className="glass-strong border border-white/25 rounded-3xl p-6 sm:p-10 shadow-2xl relative z-10">
            <div className="text-center mb-8">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mb-2">
                What do you want to check?
              </h2>
              <p className="text-xs sm:text-sm text-gray-300">
                Select an inspection engine below to submit content or simulate attack branches:
              </p>
            </div>

            {/* 5 Feature Buttons Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
              {checkFeatures.map((feat) => {
                const Icon = feat.icon;
                return (
                  <Link
                    key={feat.id}
                    to={`/check/${feat.id}`}
                    className="group glass-card p-5 rounded-2xl hover:border-cyan/60 transition-all duration-200 flex flex-col justify-between min-h-[140px] hover:shadow-[0_0_24px_rgba(34,211,238,0.25)]"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="icon-tile icon-tile-gradient w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xs font-bold text-cyan opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          Check Now <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white group-hover:text-cyan transition-colors">
                        {feat.title}
                      </h3>
                      <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                        {feat.subtitle}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between text-xs text-gray-400 group-hover:text-white">
                      <span>Launch scanner</span>
                      <ArrowRight className="w-3.5 h-3.5 text-cyan group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                );
              })}

              {/* Security Activity Quick Link Card */}
              <div className="glass-card p-5 rounded-2xl border-white/15 flex flex-col justify-between min-h-[140px]">
                <div>
                  <div className="icon-tile w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-3">
                    <Shield className="w-5 h-5 text-cyan" />
                  </div>
                  <h3 className="text-base font-bold text-white">Private & Local</h3>
                  <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                    Zero retention by default. Inspect unverified items without exposing passwords or data.
                  </p>
                </div>
                <Link
                  to="/privacy"
                  className="pt-3 mt-3 border-t border-white/10 text-xs font-semibold text-cyan hover:text-white flex items-center justify-between"
                >
                  <span>Read Privacy Layer</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          3.4 SECURITY ACTIVITY (SIGNED IN ONLY OR SUBTLE PROMPT)
      ===================================================================== */}
      <section className="max-w-5xl mx-auto">
        {user && !isGuest && stats && stats.total > 0 ? (
          <div className="space-y-4">
            <StatTiles
              total={stats.total}
              critical={stats.critical}
              high={stats.high}
              medium={stats.medium}
              low={stats.low}
              mostUsedFeature={stats.mostUsed}
            />
          </div>
        ) : (
          <div className="glass-card p-5 sm:p-6 rounded-3xl border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3.5">
              <div className="icon-tile icon-tile-gradient w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {user && isGuest ? 'Guest Session Active' : 'Private Security History'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-300">
                  {user && isGuest
                    ? 'Create an account to preserve your verified risk reports across sessions.'
                    : 'Sign in to keep a private record of the threats and indicators you have analyzed.'}
                </p>
              </div>
            </div>
            <Link
              to={user && isGuest ? '/settings' : '/login'}
              className="btn-primary text-xs sm:text-sm font-semibold px-5 py-2.5 min-h-[44px] shrink-0"
            >
              {user && isGuest ? 'Upgrade Guest Account' : 'Sign In to TrustGuard'}
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
