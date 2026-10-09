/**
 * Dev-only component gallery built from typed fixtures.
 * Excluded from production builds via the route guard in App.tsx.
 */
import { useState } from 'react';
import RiskGauge from '../components/risk/RiskGauge';
import CategoryGrid from '../components/risk/CategoryGrid';
import EvidenceCard from '../components/evidence/EvidenceCard';
import ReasoningPanel from '../components/evidence/ReasoningPanel';
import RuledOutList from '../components/evidence/RuledOutList';
import RecommendationList from '../components/evidence/RecommendationList';
import AttackPath from '../components/attack-path/AttackPath';
import ErrorState from '../components/common/ErrorState';
import SampleButton from '../components/common/SampleButton';
import CachedBadge from '../components/common/CachedBadge';
import SaveStatus from '../components/common/SaveStatus';
import VoiceIntegrityPanel from '../components/common/VoiceIntegrityPanel';
import PaymentSummaryCard from '../components/common/PaymentSummaryCard';
import EntityList from '../components/common/EntityList';
import InvestigationTimeline from '../components/timeline/InvestigationTimeline';
import UploadZone from '../components/upload/UploadZone';
import AskPanel from '../components/evidence/AskPanel';
import AuthForm from '../components/auth/AuthForm';
import GuestUpgradeBanner from '../components/auth/GuestUpgradeBanner';
import VerifyEmailBanner from '../components/auth/VerifyEmailBanner';
import StatTiles from '../components/history/StatTiles';
import HistoryFilters from '../components/history/HistoryFilters';
import HistoryList from '../components/history/HistoryList';
import ConfirmDialog from '../components/history/ConfirmDialog';
import type { TimelineStage } from '../components/timeline/InvestigationTimeline';
import {
  sampleFactors,
  sampleCategories,
  sampleDismissedHints,
  sampleResult,
  sampleSimulation,
  samplePaymentDetails,
  sampleVoiceDetails,
  sampleExtracted,
} from './fixtures';
import { ERROR_INFO } from '../api/types';

const timelineStages: TimelineStage[] = [
  { id: 'received', label: 'Request received', status: 'done' },
  { id: 'extracting', label: 'Extracting content', status: 'done' },
  { id: 'checking', label: 'Running checks', detail: 'Inspecting 2 links', status: 'active' },
  { id: 'reasoning', label: 'AI reasoning', status: 'pending' },
  { id: 'scoring', label: 'Computing risk score', status: 'pending' },
];

const sampleHistoryItems = [
  {
    id: 'ana-101',
    featureType: 'conversation',
    createdAt: new Date().toISOString(),
    riskScore: 82,
    riskLevel: 'CRITICAL' as const,
    summary: 'KYC suspension phishing attempt requesting immediate OTP verification.',
    topIndicators: ['OTP_PIN_REQUEST', 'URGENCY', 'IDENTITY_MISMATCH'],
  },
  {
    id: 'ana-102',
    featureType: 'payment',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    riskScore: 25,
    riskLevel: 'LOW' as const,
    summary: 'Verified merchant payment with registered merchant code.',
    topIndicators: ['MERCHANT_VERIFIED'],
  },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 border-b border-white/15 pb-2.5 flex items-center justify-between">
        <span>{title}</span>
        <span className="text-xs font-mono text-cyan/70 font-normal uppercase tracking-wider">Design Token Test</span>
      </h2>
      {children}
    </section>
  );
}

export default function DevComponents() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [filterFeature, setFilterFeature] = useState('all');
  const [filterSort, setFilterSort] = useState<'newest' | 'oldest'>('newest');

  return (
    <div className="w-full space-y-10 py-4">
      <div className="glass-card rounded-2xl border-amber-500/40 p-4 sm:p-5 mb-8">
        <p className="text-sm text-amber-200 font-medium">
          🎨 Dev-only component gallery: testing bright colorful glass tokens, animated gradient blobs, fluid responsiveness, and accessibility contrast.
        </p>
      </div>

      <Section title="RiskGauge (All Risk Levels & Null)">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <RiskGauge score={15} level="LOW" />
          <RiskGauge score={45} level="MEDIUM" />
          <RiskGauge score={71} level="HIGH" />
          <RiskGauge score={92} level="CRITICAL" />
        </div>
        <div className="mt-4 max-w-xs">
          <RiskGauge score={null} level={null} />
        </div>
      </Section>

      <Section title="CategoryGrid">
        <CategoryGrid categories={sampleCategories} />
      </Section>

      <Section title="EvidenceCards (Ranked & Categorized)">
        <div className="space-y-3">
          {sampleFactors.map((f, i) => (
            <EvidenceCard key={`${f.code}-${i}`} factor={f} index={i} />
          ))}
        </div>
      </Section>

      <Section title="ReasoningPanel (Reading Glass High-Contrast Surface)">
        <ReasoningPanel reasoning={sampleResult.reasoning} factors={sampleFactors} />
      </Section>

      <Section title="RuledOutList">
        <RuledOutList hints={sampleDismissedHints} />
      </Section>

      <Section title="RecommendationList">
        <RecommendationList recommendations={sampleResult.recommendations} />
      </Section>

      <Section title="AttackPath (Interactive Simulation Stages)">
        <AttackPath simulation={sampleSimulation} />
      </Section>

      <Section title="InvestigationTimeline (Active Streaming Status)">
        <InvestigationTimeline stages={timelineStages} />
      </Section>

      <Section title="UploadZone (Dropzone + Textarea + Fluid Action)">
        <div className="space-y-4">
          <UploadZone
            acceptsText
            acceptsImage
            fileHint="Paste text or upload a screenshot (PNG, JPG, WEBP)"
            onTextSubmit={(t) => console.log('Text:', t)}
            onFileSubmit={(f) => console.log('File:', f)}
          />
        </div>
      </Section>

      <Section title="AskPanel (Stateless Q&A)">
        <AskPanel
          onAsk={async (q) => `This is a sample answer explaining why "${q}" matters based on verified indicators.`}
        />
      </Section>

      <Section title="PaymentSummaryCard">
        <PaymentSummaryCard details={samplePaymentDetails} />
      </Section>

      <Section title="VoiceIntegrityPanel">
        <div className="space-y-4">
          <VoiceIntegrityPanel details={sampleVoiceDetails} />
          <VoiceIntegrityPanel details={{ ...sampleVoiceDetails, model_available: false }} />
        </div>
      </Section>

      <Section title="EntityList">
        <EntityList extracted={sampleExtracted} />
      </Section>

      <Section title="SaveStatus & Glass Badges">
        <div className="space-y-3">
          <SaveStatus status="saved" />
          <SaveStatus status="skipped" />
          <SaveStatus status="failed" onRetry={() => {}} />
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <SampleButton onClick={() => console.log('sample')} />
            <SampleButton onClick={() => {}} loading />
            <CachedBadge />
          </div>
        </div>
      </Section>

      <Section title="Auth Banners & Form">
        <div className="space-y-6">
          <GuestUpgradeBanner />
          <VerifyEmailBanner />
          <AuthForm
            mode="login"
            onSubmit={async () => {}}
            onGuestClick={async () => {}}
            loading={false}
            error={null}
          />
        </div>
      </Section>

      <Section title="History Components">
        <div className="space-y-6">
          <StatTiles
            total={12}
            critical={3}
            high={4}
            medium={3}
            low={2}
            mostUsedFeature="conversation"
          />
          <HistoryFilters
            selectedFeature={filterFeature}
            sortOrder={filterSort}
            onSelectFeature={setFilterFeature}
            onToggleSort={() => setFilterSort((prev) => (prev === 'newest' ? 'oldest' : 'newest'))}
          />
          <HistoryList items={sampleHistoryItems} onDeleteOne={(id) => console.log('Delete:', id)} />
          <div>
            <button
              onClick={() => setConfirmOpen(true)}
              className="btn-glass border-[#F43F5E]/40 text-[#F43F5E] hover:bg-[#F43F5E]/20 text-sm px-5 py-2.5 min-h-[44px]"
            >
              Open Sample Confirm Dialog
            </button>
            <ConfirmDialog
              isOpen={confirmOpen}
              title="Delete Sample Analysis"
              message="Are you sure you want to delete this sample record? This action cannot be undone."
              confirmText="Delete"
              onConfirm={async () => setConfirmOpen(false)}
              onCancel={() => setConfirmOpen(false)}
            />
          </div>
        </div>
      </Section>

      <Section title="ErrorState (All Error Codes)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.keys(ERROR_INFO).map((code) => (
            <ErrorState key={code} code={code} onRetry={() => {}} />
          ))}
        </div>
      </Section>
    </div>
  );
}
