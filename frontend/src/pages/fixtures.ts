import type {
  Factor,
  CategoryStatus,
  DismissedHint,
  AnalysisResult,
  Simulation,
  PaymentDetails,
  VoiceDetails,
  ExtractedData,
} from '../api/types';

export const sampleFactors: Factor[] = [
  {
    code: 'UPFRONT_FEE',
    category: 'Financial',
    severity: 'HIGH',
    weight: 25,
    source: 'ai',
    title: 'Upfront fee requested',
    why_it_matters:
      'Legitimate organizations rarely ask for upfront payment via personal accounts before providing a service or benefit.',
    evidence: 'Registration fee of Rs. 1,499 to be paid immediately',
  },
  {
    code: 'PERSONAL_RECIPIENT',
    category: 'Financial',
    severity: 'HIGH',
    weight: 15,
    source: 'deterministic',
    title: 'Personal payment recipient',
    why_it_matters:
      'The payment recipient appears to be a personal account, not a registered business or organization.',
    evidence: 'UPI: example@ybl (no merchant code)',
  },
  {
    code: 'COMBINED_PATTERN',
    category: 'Pattern',
    severity: 'HIGH',
    weight: 12,
    source: 'combined',
    title: 'Unverified requester wants money or secrets',
    why_it_matters:
      'An unverified identity combined with a financial request is a strong indicator of a potential scam.',
    evidence: null,
  },
  {
    code: 'COMBINED_PATTERN',
    category: 'Pattern',
    severity: 'HIGH',
    weight: 10,
    source: 'combined',
    title: 'Payment under pressure',
    why_it_matters:
      'Being pressured to pay quickly reduces your time to verify the request and is a common manipulation tactic.',
    evidence: null,
  },
  {
    code: 'URGENCY',
    category: 'Urgency',
    severity: 'MEDIUM',
    weight: 7,
    source: 'ai',
    title: 'Artificial urgency detected',
    why_it_matters:
      'Creating time pressure is a common tactic to prevent you from verifying the request with someone you trust.',
    evidence: 'Pay within 1 hour to confirm your registration',
  },
  {
    code: 'IDENTITY_UNVERIFIED',
    category: 'Identity',
    severity: 'LOW',
    weight: 2,
    source: 'ai',
    title: 'Identity unverified',
    why_it_matters:
      'The claimed identity could not be independently verified from the content provided.',
    evidence: null,
  },
];

export const sampleCategories: CategoryStatus[] = [
  { category: 'Identity', severity: null, label: 'Unverified' },
  { category: 'Urgency', severity: 'MEDIUM', label: 'Medium' },
  { category: 'Manipulation', severity: null, label: 'Not detected' },
  { category: 'Financial', severity: 'HIGH', label: 'High' },
  { category: 'Credentials', severity: null, label: 'Not detected' },
  { category: 'Destination', severity: null, label: 'Not detected' },
];

export const sampleDismissedHints: DismissedHint[] = [
  {
    hint_id: 'otp_pin_request',
    reason: 'This message delivers an OTP; it does not ask you to share one.',
  },
  {
    hint_id: 'credential_request',
    reason: 'The message mentions login but does not ask for credentials.',
  },
];

export const sampleExtracted: ExtractedData = {
  urls: [
    {
      original: 'https://bharat-bank-kyc.example.com/verify',
      hops: [],
      final_url: 'https://bharat-bank-kyc.example.com/verify',
      domain_changed: false,
      shortened: false,
      page_title: null,
      blocked_reason: null,
      error: null,
    },
  ],
  upi: ['example@ybl'],
  emails: ['support@example.com'],
  phones: ['+91-9876543210'],
  amounts: ['Rs. 1,499'],
  deadlines: ['within 1 hour'],
  orgs: ['Bharat National Bank'],
  refs: ['REF-2024-0042'],
};

export const samplePaymentDetails: PaymentDetails = {
  payment_type: 'UPI',
  payee_vpa: 'example@ybl',
  payee_name: 'RAMESH K',
  amount: '1499.00',
  currency: 'INR',
  note: 'Registration fee',
  merchant_code: null,
  qr_payloads: ['upi://pay?pa=example@ybl&pn=RAMESH%20K&am=1499.00&tn=Registration%20fee'],
};

export const sampleVoiceDetails: VoiceDetails = {
  duration_seconds: 45,
  analyzed_seconds: 45,
  transcript:
    'Hello, this is the fraud department of your bank. We have detected suspicious activity on your account. I need you to verify your identity by providing the OTP that was just sent to your registered mobile number.',
  spoof_probability: 0.87,
  spoof_window_ratio: 0.82,
  voice_verdict: 'Strong synthetic-voice indicators',
  voice_caveat:
    'This model has no published accuracy figures, was trained on 2019-era synthetic speech, and is less reliable on phone-call compression, background noise, and modern voice clones.',
  model_available: true,
};

export const sampleResult: AnalysisResult = {
  id: 'demo-001',
  feature: 'payment',
  created_at: new Date().toISOString(),
  status: 'assessed',
  score: 71,
  level: 'HIGH',
  confidence: 'HIGH',
  factors: sampleFactors,
  categories: sampleCategories,
  dismissed_hints: sampleDismissedHints,
  content_type: 'QR Code (UPI)',
  claimed_identity: 'Bharat National Bank',
  sender_intent: 'Collect a registration fee for a job application',
  contradictions: [
    'Claims to be a bank but asks for payment to a personal UPI ID',
    'Registration fees are unusual for legitimate job applications',
  ],
  attack_stage: 'FINANCIAL_REQUEST',
  reasoning:
    'This QR code requests payment of Rs. 1,499 to a personal UPI account with no merchant code. The payment is framed as a "registration fee" with a 1-hour deadline. Legitimate organizations use registered business accounts and do not impose artificial urgency. The combination of an upfront fee to a personal recipient, time pressure, and an unverified identity follows a pattern commonly seen in job-fee scams.',
  recommendations: [
    'Do not scan this QR code or make this payment.',
    'Verify the job posting through the company\'s official website that you navigate to directly.',
    'Contact the organization using the number on their official website, not any number provided in this message.',
    'Report this QR code to your bank if you have already scanned it.',
    'Never pay upfront fees for job applications or interviews.',
  ],
  summary: 'Suspicious payment request to personal account with urgency pressure',
  extracted: sampleExtracted,
  details: samplePaymentDetails,
  meta: {
    model: 'gemini-3.8-flash',
    prompt_version: 'payment_v1',
    duration_ms: 3420,
    cached: false,
  },
};

export const sampleSimulation: Simulation = {
  stages: [
    {
      stage: 'TRUST_BUILDING',
      title: 'Initial Job Offer',
      attacker_objective: 'Establish credibility and create interest',
      likely_request: 'You receive a message about an exciting job opportunity with a well-known company',
      why_it_matters: 'The initial contact seems legitimate and professional to lower your guard',
      potential_consequence: 'You engage with the scammer believing it is a real opportunity',
      safe_exit: 'Verify the job posting on the official company website before responding',
    },
    {
      stage: 'BAIT',
      title: 'Interview Scheduling',
      attacker_objective: 'Increase your emotional investment',
      likely_request: 'A brief phone or chat "interview" followed by congratulations on being selected',
      why_it_matters: 'After investing time in an interview, you are more likely to follow through',
      potential_consequence: 'You feel committed to the process and less likely to question next steps',
      safe_exit: 'Research the company and interviewer independently before proceeding',
    },
    {
      stage: 'FINANCIAL_REQUEST',
      title: 'Registration Fee Payment',
      attacker_objective: 'Extract money from you',
      likely_request: 'Pay Rs. 1,499 as a registration or processing fee via UPI to a personal account',
      why_it_matters: 'This is the primary extraction point - legitimate employers never charge applicants',
      potential_consequence: 'You lose Rs. 1,499 with no recourse for recovery',
      safe_exit: 'Stop immediately - no legitimate employer charges a registration fee',
    },
    {
      stage: 'EXPLOITATION',
      title: 'Additional Extraction',
      attacker_objective: 'Extract more money or personal information',
      likely_request: 'Additional fees for "training materials", "background verification", or "security deposit"',
      why_it_matters: 'Once you have paid once, the scammer knows you are willing to pay and will escalate',
      potential_consequence: 'Increasing financial losses and potential identity theft',
      safe_exit: 'Block all contact and report to cybercrime authorities',
    },
  ],
  current_stage_index: 2,
  safest_stopping_point: 0,
  banner:
    'Hypothetical attack simulation \u2014 not a prediction of what will happen.',
};
