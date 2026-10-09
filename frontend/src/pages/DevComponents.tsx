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
      <h2 className="text-xl font-bold text-white mb-4 border-b border-navy-600 pb-2">{title}</h2>
      {children}
    </section>
  );
}

export default function DevComponents() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [filterFeature, setFilterFeature] = useState('all');
  const [filterSort, setFilterSort] = useState<'newest' | 'oldest'>('newest');

  return (
    <div className="w-full space-y-8">
      <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-4 mb-8">
        <p className="text-sm text-amber-200">
          Dev-only component gallery. This page is excluded from production builds.
        </p>
      </div>

      <Section title="RiskGauge">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <RiskGauge score={15} level="LOW" />
          <RiskGauge score={45} level="MEDIUM" />
          <RiskGauge score={71} level="HIGH" />
          <RiskGauge score={92} level="CRITICAL" />
        </div>
        <div className="mt-4">
          <RiskGauge score={null} level={null} />
        </div>
      </Section>

      <Section title="CategoryGrid">
        <CategoryGrid categories={sampleCategories} />
      </Section>

      <Section title="EvidenceCards">
        <div className="space-y-3">
          {sampleFactors.map((f, i) => (
            <EvidenceCard key={`${f.code}-${i}`} factor={f} index={i} />
          ))}
        </div>
      </Section>

      <Section title="ReasoningPanel">
        <ReasoningPanel reasoning={sampleResult.reasoning} factors={sampleFactors} />
      </Section>

      <Section title="RuledOutList">
        <RuledOutList hints={sampleDismissedHints} />
      </Section>

      <Section title="RecommendationList">
        <RecommendationList recommendations={sampleResult.recommendations} />
      </Section>

      <Section title="AttackPath">
        <AttackPath simulation={sampleSimulation} />
      </Section>

      <Section title="InvestigationTimeline">
        <InvestigationTimeline stages={timelineStages} />
      </Section>

      <Section title="UploadZone">
        <div className="space-y-4">
          <h3 className="text-sm text-gray-400">Text + Image</h3>
          <UploadZone
            acceptsText
            acceptsImage
            fileHint="Paste text or upload a screenshot (PNG, JPG, WEBP)"
            onTextSubmit={(t) => console.log('Text:', t)}
            onFileSubmit={(f) => console.log('File:', f)}
          />
        </div>
      </Section>

      <Section title="AskPanel">
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

      <Section title="SaveStatus & Badges">
        <div className="space-y-3">
          <SaveStatus status="saved" />
          <SaveStatus status="skipped" />
          <SaveStatus status="failed" onRetry={() => {}} />
          <div className="flex items-center gap-4 pt-2">
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
          <div className="max-w-md bg-navy-800 p-6 rounded-xl border border-navy-700">
            <h3 className="text-sm font-semibold text-white mb-4">Sample Auth Form</h3>
            <AuthForm
              mode="login"
              onSubmit={async () => {}}
              onGuestClick={async () => {}}
              loading={false}
              error={null}
            />
          </div>
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
              className="px-4 py-2 bg-red-800 hover:bg-red-700 text-white text-sm rounded-lg"
            >
              Open Sample Confirm Dialog
            </button>
            <ConfirmDialog
              isOpen={confirmOpen}
              title="Delete Sample Analysis"
              message="Are you sure you want to delete this sample record?"
              confirmText="Delete"
              onConfirm={async () => setConfirmOpen(false)}
              onCancel={() => setConfirmOpen(false)}
            />
          </div>
        </div>
      </Section>

      <Section title="ErrorState (all codes)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.keys(ERROR_INFO).map((code) => (
            <ErrorState key={code} code={code} onRetry={() => {}} />
          ))}
        </div>
      </Section>
    </div>
  );
}
