export interface ReportingChannel {
  id: string;
  title: string;
  authority: string;
  contact: string;
  url?: string;
  badge: string;
  priorityNote: string;
  steps: string[];
}

export const REPORTING_CHANNELS: ReportingChannel[] = [
  {
    id: 'cybercrime-portal',
    title: 'National Cybercrime Helpline',
    authority: 'Ministry of Home Affairs / I4C',
    contact: 'Call 1930 or visit cybercrime.gov.in',
    url: 'https://cybercrime.gov.in',
    badge: 'Immediate Financial Fraud',
    priorityNote: 'ACT WITHIN THE GOLDEN HOUR (First 1–2 hours after fraudulent debit to maximize freezing chances)',
    steps: [
      'Call 1930 toll-free immediately to register an incident with the citizen financial fraud reporting system.',
      'Provide your account number, transaction UTR number, mobile number, and the recipient bank/UPI details.',
      'A formal complaint acknowledgment number will be generated via SMS for tracking with your bank.'
    ]
  },
  {
    id: 'bank-hotline',
    title: 'Direct Bank Card & Net Banking Freeze',
    authority: 'Your Bank Fraud Monitoring Cell',
    contact: 'Number printed on back of physical card',
    badge: 'Stop Ongoing Debits',
    priorityNote: 'Freeze cards and net banking access before filing external complaints',
    steps: [
      'Locate the 24/7 customer care number printed on the back of your physical plastic debit/credit card.',
      'Request the representative to immediately block your card, UPI service, and net banking access.',
      'Note down the bank grievance reference number and exact timestamp of the blocking request.'
    ]
  },
  {
    id: 'upi-dispute',
    title: 'UPI App In-App Dispute',
    authority: 'NPCI / UPI Payment Providers',
    contact: 'Raise Ticket Inside Payment App (GPay / PhonePe / Paytm / BHIM)',
    badge: 'Transaction Dispute',
    priorityNote: 'Flag the specific payment reference inside the payment application',
    steps: [
      'Open the specific UPI application where the transaction occurred.',
      'Tap on the transaction in your payment history and select "Report a problem" or "Raise Dispute".',
      'Select "Fraudulent transaction / Scam" and upload relevant chat or QR screenshots.'
    ]
  },
  {
    id: 'telecom-spam',
    title: 'Chakshu Telecom Fraud Reporting',
    authority: 'Department of Telecommunications',
    contact: 'Dial 1909 or visit sancharsaathi.gov.in/sfc',
    url: 'https://sancharsaathi.gov.in/sfc',
    badge: 'Fake Calls & SMS',
    priorityNote: 'Disconnect fraudulent mobile numbers and spam headers from the telecom network',
    steps: [
      'Visit the DoT Chakshu portal on Sanchar Saathi or forward spam SMS to 1909.',
      'Report suspected fraud communication received over call, SMS, or WhatsApp.',
      'Provide the scammer sender mobile number, date, time, and sample text.'
    ]
  }
];

export const PRACTICAL_ADVICE = [
  {
    title: 'Act Within the Golden Hour',
    description: 'The first 1 to 2 hours after a fraudulent transfer are critical. Calling 1930 promptly allows the system to send automated freeze alerts to the recipient bank before mule accounts withdraw cash.'
  },
  {
    title: 'Freeze First, Complain Second',
    description: 'Always lock your cards and disable net-banking/UPI on your official banking app first to prevent subsequent unauthorized transactions, then file the formal cybercrime report.'
  },
  {
    title: 'Preserve Complete Digital Evidence',
    description: 'Take full screenshots of SMS messages, phone call logs, WhatsApp chats, and UPI transaction reference numbers. Do not delete the conversation before taking screenshots.'
  }
];
