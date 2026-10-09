import { useParams, Navigate, useLocation } from 'react-router-dom';
import { MessageSquareWarning, QrCode, FileSearch, Mic, GitBranch, RotateCcw } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import UploadZone from '../components/upload/UploadZone';
import InvestigationTimeline from '../components/timeline/InvestigationTimeline';
import ErrorState from '../components/common/ErrorState';
import SampleButton from '../components/common/SampleButton';
import AnalysisResultView from '../features/conversation/AnalysisResultView';
import AttackPath from '../components/attack-path/AttackPath';
import { useConversationAnalysis } from '../features/conversation/useConversationAnalysis';
import { useState, useEffect } from 'react';

interface FeatureConfig {
  title: string;
  subtitle: string;
  question: string;
  icon: LucideIcon;
  acceptsText: boolean;
  acceptsImage: boolean;
  acceptsFile: boolean;
  acceptsAudio: boolean;
  fileHint: string;
  sampleName?: string;
}

const featureConfigs: Record<string, FeatureConfig> = {
  conversation: {
    title: 'Conversation Trust Analyzer',
    subtitle: 'Analyze suspicious messages and interactions',
    question: 'Can I safely trust this interaction?',
    icon: MessageSquareWarning,
    acceptsText: true,
    acceptsImage: true,
    acceptsFile: false,
    acceptsAudio: false,
    fileHint: 'Paste text or upload a screenshot (PNG, JPG, WEBP)',
    sampleName: 'kyc_block_sms',
  },
  payment: {
    title: 'QR & Payment Scam Detector',
    subtitle: 'Check QR codes and payment requests',
    question: 'Can I safely make this payment?',
    icon: QrCode,
    acceptsText: true,
    acceptsImage: true,
    acceptsFile: false,
    acceptsAudio: false,
    fileHint: 'Upload a QR code or payment screenshot',
    sampleName: 'job_fee_qr',
  },
  document: {
    title: 'Document Trust Analyzer',
    subtitle: 'Verify documents and official notices',
    question: 'Can I trust this document?',
    icon: FileSearch,
    acceptsText: false,
    acceptsImage: true,
    acceptsFile: true,
    acceptsAudio: false,
    fileHint: 'Upload a PDF or image of the document',
    sampleName: 'scholarship_notice',
  },
  voice: {
    title: 'Voice Scam & Synthetic-Voice Analyzer',
    subtitle: 'Analyze voice recordings for synthetic speech and scam patterns',
    question: 'Is this voice potentially fake, and is the caller trying to scam me?',
    icon: Mic,
    acceptsText: false,
    acceptsImage: false,
    acceptsFile: false,
    acceptsAudio: true,
    fileHint: 'Upload a voice recording (WAV, MP3, OGG, FLAC — max 5 min)',
    sampleName: 'bank_call',
  },
  whatif: {
    title: 'What-If Attack Simulation',
    subtitle: 'Simulate what could happen if you continue engaging',
    question: 'What could happen if I continue?',
    icon: GitBranch,
    acceptsText: true,
    acceptsImage: false,
    acceptsFile: false,
    acceptsAudio: false,
    fileHint: 'Describe the suspicious interaction or scenario to simulate',
    sampleName: 'what_if_scenario',
  },
};

export default function Check() {
  const { feature } = useParams<{ feature: string }>();
  const location = useLocation();
  const config = feature ? featureConfigs[feature] : undefined;
  const analysis = useConversationAnalysis();
  const [sampleLoading, setSampleLoading] = useState(false);

  // Auto-trigger simulation if redirected from an analysis result with state
  useEffect(() => {
    if (feature === 'whatif' && analysis.state === 'idle') {
      const incomingResult = location.state?.analysisResult;
      if (incomingResult) {
        analysis.simulate({
          analysis_id: incomingResult.id,
          analysis: incomingResult,
        });
      }
    }
  }, [feature, location.state, analysis.state]);

  if (!config || !feature) {
    return <Navigate to="/" replace />;
  }

  const Icon = config.icon;

  const handleTextSubmit = (text: string) => {
    if (feature === 'whatif') {
      analysis.simulate({ description: text });
    } else {
      analysis.analyze(text, undefined, feature);
    }
  };

  const handleFileSubmit = (file: File) => {
    if (feature === 'whatif') {
      return;
    }
    analysis.analyze(undefined, file, feature);
  };

  const handleSample = async () => {
    setSampleLoading(true);
    try {
      if (feature === 'conversation') {
        const res = await fetch('/api/samples/kyc_block_sms.txt');
        if (res.ok) {
          const text = await res.text();
          analysis.analyze(text, undefined, 'conversation');
        } else {
          const sampleText = `URGENT: Your Bharat National Bank account has been temporarily blocked due to incomplete KYC verification. Update your KYC immediately to avoid permanent account closure.\n\nClick here to verify: https://bharat-national-bank-kyc.example.com/verify?ref=KYC2024-8834\n\nYou will receive an OTP on your registered mobile number. Please share the OTP with our verification team to complete the process.\n\nThis is an automated message from Bharat National Bank Security Division.\nContact: support@bharatbank.example.com\nRef: BNB/KYC/2024/8834\n\nAct within 24 hours or your account will be permanently closed.`;
          analysis.analyze(sampleText, undefined, 'conversation');
        }
      } else if (feature === 'whatif') {
        const sampleScenario = `A caller claimed to be from my bank's fraud detection squad. They said an unauthorized transaction of Rs 48,000 was flagged on my account and I needed to verify my identity immediately by clicking a link and confirming my OTP to stop the payment.`;
        analysis.simulate({ description: sampleScenario });
      } else if (feature === 'payment') {
        const res = await fetch('/api/samples/job_fee_qr.png');
        if (res.ok) {
          const blob = await res.blob();
          const file = new File([blob], 'job_fee_qr.png', { type: 'image/png' });
          analysis.analyze(undefined, file, 'payment');
        }
      } else if (feature === 'document') {
        const res = await fetch('/api/samples/scholarship_notice.pdf');
        if (res.ok) {
          const blob = await res.blob();
          const file = new File([blob], 'scholarship_notice.pdf', { type: 'application/pdf' });
          analysis.analyze(undefined, file, 'document');
        }
      } else if (feature === 'voice') {
        const res = await fetch('/api/samples/bank_call.wav');
        if (res.ok) {
          const blob = await res.blob();
          const file = new File([blob], 'bank_call.wav', { type: 'audio/wav' });
          analysis.analyze(undefined, file, 'voice');
        }
      }
    } catch {
      // Fallback
    } finally {
      setSampleLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Icon className="w-8 h-8 text-primary shrink-0" />
          <h1 className="text-xl sm:text-2xl font-bold text-white">{config.title}</h1>
        </div>
        <p className="text-sm sm:text-base text-gray-400">{config.subtitle}</p>
        <p className="text-base sm:text-lg text-primary mt-2 font-medium">{config.question}</p>
      </div>

      {/* Input phase */}
      {analysis.state === 'idle' && (
        <div className="w-full">
          <UploadZone
            acceptsText={config.acceptsText}
            acceptsImage={config.acceptsImage}
            acceptsFile={config.acceptsFile}
            acceptsAudio={config.acceptsAudio}
            fileHint={config.fileHint}
            onTextSubmit={handleTextSubmit}
            onFileSubmit={handleFileSubmit}
          />
          {config.sampleName && (
            <div className="mt-4 text-center">
              <SampleButton onClick={handleSample} loading={sampleLoading} />
            </div>
          )}
        </div>
      )}

      {/* Analysis in progress */}
      {analysis.state === 'analyzing' && (
        <div className="bg-navy-800 rounded-xl p-4 sm:p-6 border border-navy-700">
          <InvestigationTimeline stages={analysis.stages} />
        </div>
      )}

      {/* Error state */}
      {analysis.state === 'error' && analysis.error && (
        <ErrorState code={analysis.error.code} onRetry={analysis.reset} />
      )}

      {/* Results for What-If Simulation */}
      {analysis.state === 'done' && analysis.simulation && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-primary" />
              Hypothetical Attack Progression
            </h2>
            <button
              onClick={analysis.reset}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white bg-navy-800 hover:bg-navy-700 border border-navy-700 rounded-lg transition-colors min-h-[40px]"
            >
              <RotateCcw className="w-4 h-4" />
              New simulation
            </button>
          </div>
          <AttackPath simulation={analysis.simulation} />
        </div>
      )}

      {/* Results for Standard Analyses */}
      {analysis.state === 'done' && analysis.result && (
        <AnalysisResultView
          result={analysis.result}
          onReset={analysis.reset}
          saveStatus={analysis.saveStatus}
        />
      )}
    </div>
  );
}
