import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  MessageSquareWarning,
  QrCode,
  FileSearch,
  Mic,
  GitBranch,
  History,
  ArrowRight,
} from 'lucide-react';
import type { HealthStatus } from '../api/types';
import { fetchHealth } from '../api/client';
import { useAuth } from '../auth/AuthProvider';
import { db } from '../firebase';
import { collection, getCountFromServer } from 'firebase/firestore';

const features = [
  {
    id: 'conversation',
    title: 'Conversation Trust',
    description: 'Analyze messages and interactions for social-engineering, impersonation and urgency.',
    icon: MessageSquareWarning,
    color: 'text-primary',
  },
  {
    id: 'payment',
    title: 'QR & Payment Scam',
    description: 'Check UPI QR codes, collect requests, payment links and mismatched payee details.',
    icon: QrCode,
    color: 'text-risk-medium',
  },
  {
    id: 'document',
    title: 'Document Trust',
    description: 'Inspect official notices, letters, job offers and PDFs for hidden links and active content.',
    icon: FileSearch,
    color: 'text-primary',
  },
  {
    id: 'voice',
    title: 'Voice Scam & Synthetic',
    description: 'Detect synthetic voice indicators and behavioral coercion in caller recordings.',
    icon: Mic,
    color: 'text-risk-high',
  },
  {
    id: 'whatif',
    title: 'What-If Simulation',
    description: 'Simulate what could happen if you engage further and explore safe stopping points.',
    icon: GitBranch,
    color: 'text-primary',
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [totalScans, setTotalScans] = useState<number | null>(null);

  useEffect(() => {
    fetchHealth()
      .then(setHealth)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    async function loadScansCount() {
      if (!user) return;
      try {
        const colRef = collection(db, 'users', user.uid, 'analyses');
        const snap = await getCountFromServer(colRef);
        setTotalScans(snap.data().count);
      } catch {
        // ignore if offline or emulator uninitialized
      }
    }
    loadScansCount();
  }, [user]);

  return (
    <div className="w-full">
      {/* Hero */}
      <div className="pt-6 sm:pt-12 pb-8 sm:pb-12 text-center">
        <div className="flex items-center justify-center gap-3 mb-4 sm:mb-6">
          <Shield className="w-10 h-10 text-primary shrink-0" />
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">TrustGuard AI</h1>
        </div>
        <p className="text-lg sm:text-xl text-primary font-semibold mb-3">
          Your AI-powered digital safety layer.
        </p>
        <p className="text-base text-gray-300 max-w-2xl mx-auto leading-relaxed">
          Analyze suspicious messages, QR codes, documents and voice recordings
          with AI-powered security reasoning.
        </p>
      </div>

      {/* Health Status */}
      <div className="mb-8">
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-sm text-red-300 mb-4">
            Backend unavailable: {error}
          </div>
        )}
        {health && (
          <div className="bg-navy-800 rounded-xl p-4 border border-navy-700 flex flex-wrap gap-4 text-sm">
            <StatusBadge label="Gemini" ok={health.gemini_configured} detail={health.gemini_model} />
            <StatusBadge label="Voice Model" ok={health.voice_model === 'ready'} detail={health.voice_model} />
            <StatusBadge label="URL Fetch" ok={health.url_fetch_enabled} />
            {health.firebase && (
              <StatusBadge
                label="Firebase Admin"
                ok={health.firebase.admin_ready}
                detail={health.firebase.emulators ? 'emulators' : 'connected'}
              />
            )}
          </div>
        )}

        {totalScans !== null && totalScans > 0 && (
          <div className="mt-4 bg-navy-800/80 border border-navy-700 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                <History className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  You have performed <span className="text-primary font-bold">{totalScans}</span> security {totalScans === 1 ? 'scan' : 'scans'}
                </p>
                <p className="text-sm text-gray-400">All findings and risk assessments are saved in your account</p>
              </div>
            </div>
            <Link
              to="/history"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-white transition-colors min-h-[44px]"
            >
              <span>View History</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>

      {/* Feature Cards */}
      <div className="pb-12">
        <h2 className="text-xl font-bold text-white mb-6">
          What do you want to check?
        </h2>
        <div className="card-grid">
          {features.map((f) => (
            <Link
              key={f.id}
              to={`/check/${f.id}`}
              className="group bg-navy-800 hover:bg-navy-700 border border-navy-700 hover:border-primary/50 rounded-2xl p-6 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary flex flex-col justify-between min-h-[200px]"
            >
              <div>
                <f.icon className={`w-8 h-8 ${f.color} mb-4`} />
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary transition-colors">
                  {f.title}
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed">{f.description}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-navy-700/60 flex items-center text-sm font-semibold text-primary group-hover:translate-x-1 transition-transform">
                <span>Start Check</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({
  label,
  ok,
  detail,
}: {
  label: string;
  ok: boolean;
  detail?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${ok ? 'bg-risk-low' : 'bg-risk-critical'}`} />
      <span className="text-gray-300 font-medium">{label}:</span>
      <span className={ok ? 'text-white' : 'text-risk-critical'}>
        {ok ? (detail ? `${detail}` : 'OK') : 'unavailable'}
      </span>
    </div>
  );
}
