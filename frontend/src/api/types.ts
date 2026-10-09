// TrustGuard AI — Shared Types
// Mirrors the backend schemas

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH';
export type FeatureType = 'conversation' | 'payment' | 'document' | 'voice';
export type AnalysisStatus = 'assessed' | 'insufficient_content';
export type Confidence = 'LOW' | 'MEDIUM' | 'HIGH';
export type FactorSource = 'deterministic' | 'ai' | 'combined';
export type AttackStage = 'TRUST_BUILDING' | 'BAIT' | 'PRESSURE' | 'INFORMATION_REQUEST' | 'FINANCIAL_REQUEST' | 'EXPLOITATION';

export interface Factor {
  code: string;
  category: string;
  severity: Severity;
  weight: number;
  source: FactorSource;
  title: string;
  why_it_matters: string;
  evidence: string | null;
}

export interface DismissedHint {
  hint_id: string;
  reason: string;
}

export interface UrlHop {
  url: string;
  status: number | null;
  registrable_domain: string;
}

export interface UrlFinding {
  original: string;
  hops: UrlHop[];
  final_url: string | null;
  domain_changed: boolean;
  shortened: boolean;
  page_title: string | null;
  blocked_reason: string | null;
  error: string | null;
}

export interface ExtractedData {
  urls: UrlFinding[];
  upi: string[];
  emails: string[];
  phones: string[];
  amounts: string[];
  deadlines: string[];
  orgs: string[];
  refs: string[];
}

export interface AnalysisMeta {
  model: string;
  prompt_version: string;
  duration_ms: number;
  cached: boolean;
}

export interface CategoryStatus {
  category: string;
  severity: Severity | null;
  label: string;
}

export interface PaymentDetails {
  payment_type: string;
  payee_vpa: string | null;
  payee_name: string | null;
  amount: string | null;
  currency: string | null;
  note: string | null;
  merchant_code: string | null;
  qr_payloads: string[];
}

export interface DocumentDetails {
  entities: Record<string, string[]>;
  hidden_links: string[];
  active_content: boolean;
}

export interface VoiceDetails {
  duration_seconds: number;
  analyzed_seconds: number;
  transcript: string | null;
  spoof_probability: number | null;
  spoof_window_ratio: number | null;
  voice_verdict: string;
  voice_caveat: string;
  model_available: boolean;
}

export interface AnalysisResult {
  id: string;
  feature: FeatureType;
  created_at: string;
  status: AnalysisStatus;
  score: number | null;
  level: RiskLevel | null;
  confidence: Confidence;
  factors: Factor[];
  categories: CategoryStatus[];
  dismissed_hints: DismissedHint[];
  content_type: string;
  claimed_identity: string | null;
  sender_intent: string | null;
  contradictions: string[];
  attack_stage: AttackStage | null;
  reasoning: string;
  recommendations: string[];
  summary: string;
  extracted: ExtractedData;
  details: PaymentDetails | DocumentDetails | VoiceDetails | null;
  meta: AnalysisMeta;
}

// Streaming types
export type StreamEventType = 'stage' | 'result' | 'error';

export interface StageEvent {
  type: 'stage';
  stage: string;
  detail?: string;
}

export interface ResultEvent {
  type: 'result';
  data: AnalysisResult;
}

export interface ErrorEvent {
  type: 'error';
  code: string;
  message: string;
}

export type StreamEvent = StageEvent | ResultEvent | ErrorEvent;

// What-If types
export interface SimulationStage {
  stage: AttackStage;
  title: string;
  attacker_objective: string;
  likely_request: string;
  why_it_matters: string;
  potential_consequence: string;
  safe_exit: string;
}

export interface Simulation {
  stages: SimulationStage[];
  current_stage_index: number;
  safest_stopping_point: number;
  banner: string;
}

// Health
export interface HealthStatus {
  status: string;
  gemini_configured: boolean;
  gemini_model: string;
  voice_model: string;
  url_fetch_enabled: boolean;
  firebase?: {
    admin_ready: boolean;
    emulators: boolean;
  };
}

// History
export interface HistoryEntry {
  id: string;
  feature: FeatureType;
  timestamp: string;
  score: number | null;
  level: RiskLevel | null;
  summary: string;
}

// Error codes
export const ERROR_INFO: Record<string, { title: string; suggestion: string }> = {
  UNSUPPORTED_FILE: { title: 'Unsupported file type', suggestion: 'Upload a PNG, JPEG, WEBP, PDF, WAV, MP3, OGG, or FLAC file.' },
  FILE_TOO_LARGE: { title: 'File too large', suggestion: 'Images and PDFs must be under 10 MB, audio under 15 MB.' },
  TOO_MANY_PAGES: { title: 'Too many pages', suggestion: 'Upload a document with 10 pages or fewer.' },
  AUDIO_TOO_SHORT: { title: 'Audio too short', suggestion: 'Provide at least 2 seconds of audio.' },
  NO_QR_FOUND: { title: 'No QR code found', suggestion: 'Try a clearer photo or closer crop of the QR code.' },
  UNREADABLE_DOCUMENT: { title: 'Unreadable document', suggestion: 'The file may be corrupted or empty.' },
  CORRUPTED_AUDIO: { title: 'Corrupted audio', suggestion: 'The file may be corrupted or in an unsupported format.' },
  MISSING_API_KEY: { title: 'AI service not configured', suggestion: 'The server needs a valid GEMINI_API_KEY.' },
  AI_UNAVAILABLE: { title: 'AI service unavailable', suggestion: 'Try again in a moment.' },
  AI_RATE_LIMITED: { title: 'AI rate limited', suggestion: 'Wait a moment and try again.' },
  INVALID_AI_RESPONSE: { title: 'Unexpected AI response', suggestion: 'Try again.' },
  MODEL_UNAVAILABLE: { title: 'Voice model unavailable', suggestion: 'Behavioral analysis will still run.' },
  TIMEOUT: { title: 'Analysis timed out', suggestion: 'Try again with a simpler input.' },
  URL_BLOCKED: { title: 'URL blocked', suggestion: 'A URL was blocked for security reasons.' },
  RATE_LIMITED: { title: 'Too many requests', suggestion: 'Wait a moment before trying again.' },
  AUTH_REQUIRED: { title: 'Sign-in required', suggestion: 'Please sign in or continue as guest to run an analysis.' },
  AUTH_INVALID: { title: 'Session expired', suggestion: 'Your session has expired. Please sign in again.' },
  PERMISSION_DENIED: { title: 'Permission denied', suggestion: 'You do not have access to this resource.' },
  HISTORY_SAVE_FAILED: { title: 'Save failed', suggestion: 'The analysis completed, but saving to history failed. You can retry.' },
  HISTORY_UNAVAILABLE: { title: 'History unavailable', suggestion: 'Unable to connect to history storage. Please check connection.' },
  FIREBASE_UNAVAILABLE: { title: 'Authentication service unavailable', suggestion: 'Firebase service is currently unavailable. Try again in a moment.' },
};
