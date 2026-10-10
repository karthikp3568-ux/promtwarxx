/**
 * TrustGuard AI — Enterprise Threat Framework Mapping
 * Maps TrustGuard signal codes to MITRE ATT&CK Enterprise and MITRE ATLAS (AI Adversarial) tactics.
 */

export interface MitreTechnique {
  id: string; // e.g. "T1566.002" or "AML.T0051"
  name: string; // e.g. "Spearphishing Link"
  tactic: string; // e.g. "Initial Access"
  matrix: 'Enterprise ATT&CK' | 'ATLAS (AI Systems)';
  url: string;
  description: string;
  remediation: string;
}

export const MITRE_MAP: Record<string, MitreTechnique> = {
  // Identity & Social Engineering
  IMPERSONATION_PATTERN: {
    id: 'T1656',
    name: 'Impersonation',
    tactic: 'Defense Evasion',
    matrix: 'Enterprise ATT&CK',
    url: 'https://attack.mitre.org/techniques/T1656/',
    description: 'Adversary mimics an authoritative or trusted entity (bank, police, tax official) to deceive the target.',
    remediation: 'Verify out-of-band using official published hotlines or physically printed numbers on payment cards.',
  },
  IDENTITY_MISMATCH: {
    id: 'T1036',
    name: 'Masquerading',
    tactic: 'Defense Evasion',
    matrix: 'Enterprise ATT&CK',
    url: 'https://attack.mitre.org/techniques/T1036/',
    description: 'Adversary uses identifiers or presentation that conflicts with the legitimate brand or personal identity.',
    remediation: 'Inspect email headers, sender domain spelling, and payment payee names for discrepancies.',
  },
  IDENTITY_UNVERIFIED: {
    id: 'T1589',
    name: 'Gather Victim Identity Information',
    tactic: 'Reconnaissance',
    matrix: 'Enterprise ATT&CK',
    url: 'https://attack.mitre.org/techniques/T1589/',
    description: 'Sender operates from unauthenticated or newly provisioned contact points with no verifiable public footprint.',
    remediation: 'Do not share personal details with contacts that cannot authenticate via official channels.',
  },

  // Manipulation & Coercion
  THREAT_OR_FEAR: {
    id: 'T1204',
    name: 'User Execution: Coercive Social Engineering',
    tactic: 'Execution',
    matrix: 'Enterprise ATT&CK',
    url: 'https://attack.mitre.org/techniques/T1204/',
    description: 'Uses fabricated threats of arrest, legal prosecution, or service disconnection to impair judgment.',
    remediation: 'Law enforcement and genuine utilities never demand immediate payment or arrest people over phone calls.',
  },
  URGENCY: {
    id: 'T1204.001',
    name: 'Malicious Link / Action Pressure',
    tactic: 'Execution',
    matrix: 'Enterprise ATT&CK',
    url: 'https://attack.mitre.org/techniques/T1204/001/',
    description: 'Imposes an artificial urgency window to force the target into bypassing security verification.',
    remediation: 'Enforce a mandatory 15-minute verification cooling-off pause before taking any requested action.',
  },
  ARTIFICIAL_DEADLINE: {
    id: 'T1204.001',
    name: 'Time-Boxed Compliance Pressure',
    tactic: 'Execution',
    matrix: 'Enterprise ATT&CK',
    url: 'https://attack.mitre.org/techniques/T1204/001/',
    description: 'Creates a fake deadline ("electricity disconnects in 30 mins") to trigger panic-driven compliance.',
    remediation: 'Check bill status directly in your official banking or utility application, never via SMS links.',
  },

  // Financial Exploitation
  RECEIVE_VIA_PAY: {
    id: 'T1659',
    name: 'Content Spoofing: Payment Request Inversion',
    tactic: 'Initial Access',
    matrix: 'Enterprise ATT&CK',
    url: 'https://attack.mitre.org/techniques/T1659/',
    description: 'Deceptively sends a "Collect Money / Pay" QR or payment request while claiming the user is receiving funds.',
    remediation: 'Golden rule of payments: You NEVER enter your PIN or authorize a transaction to receive money.',
  },
  UPFRONT_FEE: {
    id: 'T1566.003',
    name: 'Phishing: Advance-Fee Fraud Bait',
    tactic: 'Initial Access',
    matrix: 'Enterprise ATT&CK',
    url: 'https://attack.mitre.org/techniques/T1566/003/',
    description: 'Demands an initial "registration", "security deposit", or "processing fee" before releasing funds or job offers.',
    remediation: 'Legitimate employers and lottery systems never require upfront processing deposits from candidates.',
  },
  PERSONAL_RECIPIENT: {
    id: 'T1659',
    name: 'Payee Account Divergence',
    tactic: 'Collection',
    matrix: 'Enterprise ATT&CK',
    url: 'https://attack.mitre.org/techniques/T1659/',
    description: 'Claimed corporate entity routes payments into an individual personal savings UPI VPA or account.',
    remediation: 'Verify merchant verified checkmark; never transfer enterprise or vendor payments to personal accounts.',
  },

  // Credentials & Device Hijacking
  OTP_PIN_REQUEST: {
    id: 'T1539',
    name: 'Steal Web Session / MFA Credentials',
    tactic: 'Credential Access',
    matrix: 'Enterprise ATT&CK',
    url: 'https://attack.mitre.org/techniques/T1539/',
    description: 'Solicitation of one-time passwords, MPINs, or CVV codes to execute unauthorized account takeovers.',
    remediation: 'Never share OTPs with anyone. Financial institutions never ask for passwords or OTPs over phone/chat.',
  },
  REMOTE_ACCESS_REQUEST: {
    id: 'T1219',
    name: 'Remote Access Software Hijacking',
    tactic: 'Command and Control',
    matrix: 'Enterprise ATT&CK',
    url: 'https://attack.mitre.org/techniques/T1219/',
    description: 'Instructs the target to install remote desktop tools (AnyDesk, TeamViewer) to capture 2FA and screens.',
    remediation: 'Immediately disconnect internet, terminate the remote access session, and uninstall the software.',
  },
  APP_INSTALL_REQUEST: {
    id: 'T1204.002',
    name: 'Malicious File / Unverified APK Execution',
    tactic: 'Execution',
    matrix: 'Enterprise ATT&CK',
    url: 'https://attack.mitre.org/techniques/T1204/002/',
    description: 'Demands sideloading of an unverified Android APK or configuration profile outside official app stores.',
    remediation: 'Never install `.apk` files received via chat or WhatsApp. Download exclusively from Google Play Store.',
  },
  CREDENTIAL_REQUEST: {
    id: 'T1056.003',
    name: 'Input Capture: Web Portal Credential Harvesting',
    tactic: 'Credential Access',
    matrix: 'Enterprise ATT&CK',
    url: 'https://attack.mitre.org/techniques/T1056/003/',
    description: 'Directly asks for login usernames, passwords, or security answers under pretext of verification.',
    remediation: 'Change account passwords immediately and activate Hardware FIDO2 / Authenticator app MFA.',
  },

  // Destination & Infrastructure
  URL_SHORTENED: {
    id: 'T1566.002',
    name: 'Spearphishing Link: URL Obfuscation',
    tactic: 'Initial Access',
    matrix: 'Enterprise ATT&CK',
    url: 'https://attack.mitre.org/techniques/T1566/002/',
    description: 'Employs link shorteners (bit.ly, tinyurl, surl.li) to mask the ultimate malicious destination domain.',
    remediation: 'Expand and inspect destination domains in a sandbox prior to navigating.',
  },
  URL_REDIRECT_DOMAIN_CHANGE: {
    id: 'T1566.002',
    name: 'Spearphishing Link: Open Redirect Hijack',
    tactic: 'Initial Access',
    matrix: 'Enterprise ATT&CK',
    url: 'https://attack.mitre.org/techniques/T1566/002/',
    description: 'Redirects the user across different registrable domains to evade perimeter email/SMS gateways.',
    remediation: 'Inspect the final destination hostname rather than the initial link appearance.',
  },
  DESTINATION_BRAND_MISMATCH: {
    id: 'T1583.001',
    name: 'Acquire Infrastructure: Domains (Typosquatting)',
    tactic: 'Resource Development',
    matrix: 'Enterprise ATT&CK',
    url: 'https://attack.mitre.org/techniques/T1583/001/',
    description: 'Domain name closely resembles a legitimate brand but is registered under an unrelated entity.',
    remediation: 'Type official URLs manually into the browser address bar rather than clicking forwarded links.',
  },
  PDF_ACTIVE_CONTENT: {
    id: 'T1059.007',
    name: 'Command and Scripting Interpreter: JavaScript in PDF',
    tactic: 'Execution',
    matrix: 'Enterprise ATT&CK',
    url: 'https://attack.mitre.org/techniques/T1059/007/',
    description: 'Embedded JavaScript or automated launch actions within PDF document object stream.',
    remediation: 'Disable JavaScript execution in PDF readers or open in sandboxed browser reader.',
  },

  // Voice Forensics
  SYNTHETIC_VOICE_INDICATORS: {
    id: 'T1656',
    name: 'Impersonation: Synthetic Audio / Deepfake',
    tactic: 'Defense Evasion',
    matrix: 'Enterprise ATT&CK',
    url: 'https://attack.mitre.org/techniques/T1656/',
    description: 'Acoustic spectral artifacts indicate text-to-speech synthesis or neural voice cloning algorithms.',
    remediation: 'Hang up and initiate an out-of-band call to the person on their verified personal phone number.',
  },

  // AI Security (MITRE ATLAS)
  PROMPT_INJECTION_ATTEMPT: {
    id: 'AML.T0051',
    name: 'LLM Prompt Injection: Jailbreak & Override',
    tactic: 'Initial Access / Execution',
    matrix: 'ATLAS (AI Systems)',
    url: 'https://atlas.mitre.org/techniques/AML.T0051',
    description: 'Adversary embeds explicit override instructions to hijack the AI safety layer and force a benign rating.',
    remediation: 'Deterministic input isolation, XML/tag escaping, and dual-layer heuristic quarantine.',
  },
};

/**
 * Look up MITRE technique for a given factor code
 */
export function getMitreTechnique(factorCode: string): MitreTechnique | undefined {
  return MITRE_MAP[factorCode];
}
