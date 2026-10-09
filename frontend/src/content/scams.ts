export type ScamChannel = 'messages' | 'calls' | 'payments' | 'documents';

export interface ScamAttackStep {
  stage: string;
  description: string;
}

export interface ScamCard {
  id: string;
  title: string;
  channel: ScamChannel;
  channelLabel: string;
  shortDescription: string;
  feature: 'conversation' | 'payment' | 'document' | 'voice' | 'whatif';
  checkRoute: string;
  sampleContent: string;
  attackPath: ScamAttackStep[];
  redFlags: string[];
  whatToDo: string[];
}

export const SCAMS: ScamCard[] = [
  // 1. Messages & chats
  {
    id: 'fake-kyc-sms',
    title: 'Fake KYC Suspension SMS',
    channel: 'messages',
    channelLabel: 'Messages & Chats',
    shortDescription: 'SMS warning your bank account or wallet will be blocked within hours unless you verify identity via an unverified link.',
    feature: 'conversation',
    checkRoute: '/check/conversation',
    sampleContent: 'Dear Customer, your bank account KYC has expired. Your account will be deactivated within 12 hours. Update KYC immediately at: https://secure-bank-kyc-update.net/auth',
    attackPath: [
      { stage: 'Urgent Threat', description: 'SMS claims account deactivation or card block within hours.' },
      { stage: 'Phishing Form', description: 'Victim clicks link and lands on a spoofed portal requesting card numbers and MPIN.' },
      { stage: 'Credential Interception', description: 'Attacker requests OTP to initiate an unapproved transfer.' },
      { stage: 'Fund Drainage', description: 'Money is immediately diverted to secondary recipient accounts.' }
    ],
    redFlags: [
      'Artificial deadline (e.g., "within 12 hours", "action required immediately")',
      'Unofficial domain name that does not match your real bank',
      'Requests for debit card CVV, PIN, or net-banking passwords'
    ],
    whatToDo: [
      'Do not click the link or reply to the SMS.',
      'Check account status exclusively inside your official banking mobile app.',
      'Report the message to telecom authority / Chakshu.'
    ]
  },
  {
    id: 'part-time-job-task',
    title: 'Part-Time Job Task Scam',
    channel: 'messages',
    channelLabel: 'Messages & Chats',
    shortDescription: 'Job offers on WhatsApp/Telegram offering easy income for rating videos or hotels, later requiring "deposit fees".',
    feature: 'conversation',
    checkRoute: '/check/conversation',
    sampleContent: 'Hello! Our media marketing firm offers remote part-time work reviewing hotel listings. Earn 3,000 to 5,000 daily from your phone. Send "START" to our Telegram manager to begin task 1.',
    attackPath: [
      { stage: 'Easy Bait', description: 'Offer high payouts for simple tasks like liking videos or rating products.' },
      { stage: 'Small Payout', description: 'Scammer deposits a small initial amount (Rs. 200) to establish false trust.' },
      { stage: 'Deposit Gate', description: 'Higher earning tiers require sending "prepaid deposits" or "recharge fees".' },
      { stage: 'Withdrawal Lockout', description: 'Victim is told their funds are frozen until they pay an even higher release fee.' }
    ],
    redFlags: [
      'Unsolicited message from an unknown number promising high daily income for minimal effort',
      'Move to encrypted messaging channels (Telegram) with anonymous handlers',
      'Any requirement to pay upfront money to release your earned money'
    ],
    whatToDo: [
      'Never transfer money to unlock an earned salary or task payout.',
      'Block the sender immediately and delete the chat.',
      'Report the sender number to the messaging platform.'
    ]
  },
  {
    id: 'electricity-bill-cutoff',
    title: 'Electricity Bill Cutoff Warning',
    channel: 'messages',
    channelLabel: 'Messages & Chats',
    shortDescription: 'Urgent notice claiming power will be disconnected tonight due to unpaid balance, directing to an executive mobile number.',
    feature: 'conversation',
    checkRoute: '/check/conversation',
    sampleContent: 'Dear consumer, your electricity power will be disconnected tonight at 9:30 PM because your previous month bill was not updated. Immediately call electricity officer at 9876543210.',
    attackPath: [
      { stage: 'Disruption Fear', description: 'Message threatens immediate loss of essential household electricity service.' },
      { stage: 'Impersonation Call', description: 'Victim calls the provided mobile number and reaches a fake utility officer.' },
      { stage: 'Remote Tool Install', description: 'Scammer asks victim to install a screen-share app (AnyDesk, TeamViewer) to "clear payment".' },
      { stage: 'Account Hijack', description: 'Scammer monitors OTP generation and drains the linked bank balance.' }
    ],
    redFlags: [
      'Directs you to call a personal mobile number rather than official utility helpline',
      'Threatens immediate cutoff without prior official billing notice',
      'Asks to install third-party helper apps to facilitate verification'
    ],
    whatToDo: [
      'Verify bill payment status directly on your electricity board official website or app.',
      'Never install remote screen-sharing tools at the instruction of an unknown caller.',
      'Ignore messages from 10-digit mobile numbers posing as government or utility companies.'
    ]
  },
  {
    id: 'delivery-address-update',
    title: 'Delivery Address Update Link',
    channel: 'messages',
    channelLabel: 'Messages & Chats',
    shortDescription: 'Notification claiming a parcel cannot be delivered due to missing house number, asking for a nominal Rs. 5 re-delivery fee.',
    feature: 'conversation',
    checkRoute: '/check/conversation',
    sampleContent: 'Your package shipment could not be dispatched due to an incomplete delivery address. Please update your details and pay Rs. 5 redelivery fee at: https://parcel-track-update.online',
    attackPath: [
      { stage: 'Curiosity & Urgency', description: 'Victim assumes it is a recent online order held at a regional warehouse.' },
      { stage: 'Address Form', description: 'Link asks for address and card details for a tiny payment of Rs. 5.' },
      { stage: 'Auto-Debit Authorization', description: 'The gateway actually attempts a high-value or recurring foreign transaction.' },
      { stage: 'Recurring Loss', description: 'Victim enters OTP believing it is for Rs. 5, authorizing a large fraudulent transfer.' }
    ],
    redFlags: [
      'Generic parcel notification that does not specify what merchant the package is from',
      'Request for a nominal payment via an unfamiliar checkout link',
      'Shortened URL or domain ending with unusual top-level extensions (.online, .top, .live)'
    ],
    whatToDo: [
      'Check your actual shopping order apps directly for delivery updates.',
      'Never input card details for unsolicited parcel address update SMS.',
      'Double-check OTP transaction amount on your phone before typing it.'
    ]
  },

  // 2. Calls
  {
    id: 'digital-arrest-impersonator',
    title: 'Law Enforcement "Digital Arrest" Call',
    channel: 'calls',
    channelLabel: 'Calls',
    shortDescription: 'Video or phone call from fake police/CBI asserting an illegal parcel has been seized in your name and you are under digital arrest.',
    feature: 'voice',
    checkRoute: '/check/voice',
    sampleContent: 'This is DCP Crime Branch. A DHL parcel with 5 passports and contraband linked to your Aadhaar card has been seized. You are placed under digital arrest. Stay on camera and transfer funds to a supreme court verification escrow.',
    attackPath: [
      { stage: 'Authority Intimidation', description: 'Caller poses as police, customs, or court official with forged badges and mock police backgrounds.' },
      { stage: 'Isolation & Secrecy', description: 'Victim is told they cannot hang up, contact relatives, or leave camera view.' },
      { stage: 'Asset Verification Demand', description: 'Victim is instructed to transfer all liquid savings into a "government safety account".' },
      { stage: 'Total Extraction', description: 'Transfers are swept into mule accounts; victim is left stranded.' }
    ],
    redFlags: [
      'There is no legal concept of "digital arrest" via Skype, WhatsApp, or phone calls',
      'Demanding you keep the call strictly secret from friends, family, and local police',
      'Demanding you liquidate fixed deposits and send funds to "verify" their legitimacy'
    ],
    whatToDo: [
      'Disconnect the call immediately. Legitimate law enforcement never conducts interrogations via video calls.',
      'Visit your nearest local police station in person if you have any doubts.',
      'Call national cybercrime helpline 1930 immediately if any money was transferred.'
    ]
  },
  {
    id: 'cloned-voice-relative',
    title: 'Cloned-Voice Relative Emergency',
    channel: 'calls',
    channelLabel: 'Calls',
    shortDescription: 'Call using AI voice cloning replicating a family member or child claiming an accident or arrest and urgently needing bail money.',
    feature: 'voice',
    checkRoute: '/check/voice',
    sampleContent: 'Mom, please help me! I got into a terrible car accident and the police officer here is saying I will be locked up unless we pay the injured person medical fee right now. Please talk to the officer.',
    attackPath: [
      { stage: 'AI Voice Cloning', description: 'Scammer synthesizes a 3-second audio sample harvested from social media videos.' },
      { stage: 'Panic Injection', description: 'Short audio of distressed relative plays with simulated background sirens or crying.' },
      { stage: 'Handler Takeover', description: 'An accomplice grabs the phone demanding immediate UPI transfer to settle the situation.' },
      { stage: 'Blocked Verification', description: 'Victim is pressured not to hang up or call other family members.' }
    ],
    redFlags: [
      'Extremely high emotional pressure with crying or rushed speech preventing clear conversation',
      'Call comes from an unknown number rather than the relative regular phone',
      'Demand for untraceable instant payments via unfamiliar UPI IDs'
    ],
    whatToDo: [
      'Hang up and directly call the relative on their known personal phone number.',
      'Establish a family secret safety word for true emergency verification.',
      'Ask a personal question only the real family member would know (e.g. childhood pet name).'
    ]
  },
  {
    id: 'bank-fraud-department',
    title: 'Bank Fraud Department Impersonation Call',
    channel: 'calls',
    channelLabel: 'Calls',
    shortDescription: 'Caller claims fraudulent purchases were just detected on your credit card and offers to "cancel" the charge if you read back an SMS code.',
    feature: 'voice',
    checkRoute: '/check/voice',
    sampleContent: 'Good afternoon, this is Fraud Prevention from your card issuer. We noticed an unauthorized charge of Rs. 48,990 on Amazon. We can cancel this immediately. A cancellation code has been sent to your phone; please read it to me.',
    attackPath: [
      { stage: 'Helpful Savior Pose', description: 'Caller claims to protect you from an unauthorized luxury purchase.' },
      { stage: 'Reverse Reverse Psychology', description: 'Victim feels gratitude that the bank detected fraud early.' },
      { stage: 'Code Readback', description: 'Attacker triggers a real withdrawal and asks for the SMS verification code.' },
      { stage: 'Real Charge Completion', description: 'Victim reads the OTP, allowing the attacker to finalize the fraudulent payment.' }
    ],
    redFlags: [
      'Caller asks you to read out an OTP or verification code sent via SMS',
      'Caller insists you must act on this call without hanging up to call the bank yourself',
      'The caller ID may look spoofed to appear identical to bank helpline numbers'
    ],
    whatToDo: [
      'Remember: Bank staff will NEVER ask for your OTP, PIN, or password over the phone.',
      'Hang up and dial the customer care number printed on the back of your physical plastic card.',
      'Lock your card temporarily using your official banking mobile app.'
    ]
  },
  {
    id: 'customs-parcel-seizure',
    title: 'Customs Parcel Seizure Warning',
    channel: 'calls',
    channelLabel: 'Calls',
    shortDescription: 'Automated IVR call stating international courier contains prohibited medicines and your national identity document is flagged.',
    feature: 'voice',
    checkRoute: '/check/voice',
    sampleContent: 'FedEx Customs Department: An international package in your name containing suspicious contraband has been confiscated at Mumbai airport. Press 9 to speak with an investigation executive.',
    attackPath: [
      { stage: 'Robocall Hook', description: 'Automated robocall prompts victim to press a key to connect with an officer.' },
      { stage: 'Fake FIR Intimidation', description: 'Scammer provides forged complaint and FIR numbers to appear legitimate.' },
      { stage: 'Escalation to Bribery', description: 'Victim is told to wire penalty fees to settle the matter without public arrest.' },
      { stage: 'Continuous Extortion', description: 'Additional demands follow under threat of notifying the victim employer.' }
    ],
    redFlags: [
      'Automated interactive voice prompt regarding unexpected international shipments',
      'Claims that customs issues can be cleared by transferring money to individual UPI accounts',
      'Refusal to provide official stamped physical documents through registered post'
    ],
    whatToDo: [
      'Hang up immediately. Government agencies do not use automated robocalls to announce seizures.',
      'Do not press numbers or keys on unsolicited interactive voice calls.',
      'Report the calling number to national telecom spam registries.'
    ]
  },

  // 3. Payments & QR
  {
    id: 'scan-to-receive-refund',
    title: '"Scan This QR to Receive Refund" Scam',
    channel: 'payments',
    channelLabel: 'Payments & QR',
    shortDescription: 'Scammer claims they want to send you money or a refund, but sends a QR code that actually debits your account upon scanning.',
    feature: 'payment',
    checkRoute: '/check/payment',
    sampleContent: 'upi://pay?pa=merchantref9281@okaxis&pn=RefundDesk&am=4500&cu=INR&tn=RefundCredit',
    attackPath: [
      { stage: 'Promised Credit', description: 'Scammer promises to send a refund for a failed delivery, return, or prize.' },
      { stage: 'Inverted QR', description: 'Scammer generates a standard "Pay Merchant" QR code for the exact amount.' },
      { stage: 'Deceptive Instruction', description: 'Scammer tells victim: "Scan this and enter your UPI PIN to approve receiving the deposit."' },
      { stage: 'Instant Debit', description: 'Entering UPI PIN sends money FROM victim TO scammer; you never enter a PIN to receive.' }
    ],
    redFlags: [
      'Golden rule: You NEVER enter your UPI PIN to receive money in India.',
      'The QR payload contains a pay directive (upi://pay?...) rather than any receiving mechanism.',
      'Payee name is an obscure individual or unregistered merchant ID'
    ],
    whatToDo: [
      'Never scan a QR code sent by someone else if your intention is to receive funds.',
      'If you ever see a UPI PIN entry screen, stop immediately — funds are leaving your account.',
      'Block the sender on your UPI payment application.'
    ]
  },
  {
    id: 'double-debit-refund',
    title: 'Double-Debit Refund Request',
    channel: 'payments',
    channelLabel: 'Payments & QR',
    shortDescription: 'Scammer claims a payment was accidentally charged twice and requests you create a reverse transaction request to balance records.',
    feature: 'payment',
    checkRoute: '/check/payment',
    sampleContent: 'upi://pay?pa=reconoffice.billing@icici&pn=PaymentRecon&am=8500&cu=INR&tn=ReconciliationReversal',
    attackPath: [
      { stage: 'Accounting Confusion', description: 'Scammer sends a convincing fake screenshot of an apparent double debit.' },
      { stage: 'Reconciliation Request', description: 'Asks victim to approve a "collect request" to reverse the discrepancy.' },
      { stage: 'Second Debit', description: 'Approving the request actually pulls a second sum of money from the victim.' }
    ],
    redFlags: [
      'Unsolicited collect request received inside your payment app',
      'The sender creates urgency around balancing daily bookkeeping',
      'Screenshots of purported bank statements that you cannot verify inside your own passbook'
    ],
    whatToDo: [
      'Decline all unexpected collect requests inside Google Pay, PhonePe, or Paytm.',
      'Verify transaction history only by looking at your own bank statement directly.',
      'Report the suspicious UPI handle directly inside the payment app.'
    ]
  },
  {
    id: 'marketplace-reverse-qr',
    title: 'Marketplace Buyer Sending Reverse QR',
    channel: 'payments',
    channelLabel: 'Payments & QR',
    shortDescription: 'Online classified buyer immediately agrees to buy your listing, sends an advance QR code, and asks you to scan to claim advance payment.',
    feature: 'payment',
    checkRoute: '/check/payment',
    sampleContent: 'upi://pay?pa=armycaptain.buyer77@sbi&pn=RajeshKumar&am=12000&cu=INR&tn=AdvancePaymentItemPurchase',
    attackPath: [
      { stage: 'Eager Buyer', description: 'Buyer contacts you within minutes of posting an ad (e.g. OLX) without bargaining.' },
      { stage: 'Army / Official Persona', description: 'Buyer claims to be an army officer or posted far away, sending an advance.' },
      { stage: 'Reverse QR Sent', description: 'Buyer sends a QR code labeled "Scan to accept advance payment".' },
      { stage: 'Fund Loss', description: 'Seller scans, enters PIN, and loses the money instead of receiving an advance.' }
    ],
    redFlags: [
      'Buyer insists on paying exclusively via QR code before even seeing the physical item',
      'Buyer uses army or defense personnel identity to build unquestioned trust',
      'Buyer insists on immediate same-day transaction via payment links'
    ],
    whatToDo: [
      'Require cash on delivery or direct bank account transfer via account number & IFSC.',
      'Never scan any QR code sent by a prospective buyer.',
      'Report the profile to the classified marketplace safety team.'
    ]
  },

  // 4. Documents & email
  {
    id: 'fake-job-offer-fee',
    title: 'Fake Job Offer Letter with Registration Fee',
    channel: 'documents',
    channelLabel: 'Documents & Email',
    shortDescription: 'Official-looking employment letter offering high salary, requesting upfront processing, laptop deposit, or visa clearance fee.',
    feature: 'document',
    checkRoute: '/check/document',
    sampleContent: 'APPOINTMENT LETTER: We are pleased to offer you the position of Senior Operations Executive with a starting salary of Rs. 14,50,000 per annum. A mandatory refundable equipment and security deposit of Rs. 14,990 must be paid prior to onboarding.',
    attackPath: [
      { stage: 'Flattering Offer', description: 'Victim receives an unsolicited high-paying job offer without rigorous interviews.' },
      { stage: 'Official Document', description: 'PDF with corporate logos, watermarks, and forged signatures is sent via email.' },
      { stage: 'Upfront Gate', description: 'Document specifies a mandatory refundable "training" or "laptop" deposit.' },
      { stage: 'Disappearance', description: 'Once payment is sent to a personal UPI ID, all communication ceases.' }
    ],
    redFlags: [
      'Legitimate employers NEVER ask candidates to pay for equipment, tests, or onboarding fees.',
      'Email sent from public email services (@gmail.com, @consultant.net) instead of real domain',
      'Payment instructed to personal accounts rather than corporate entities'
    ],
    whatToDo: [
      'Verify the job posting on the company verified LinkedIn careers page.',
      'Contact the company HR department using the official phone number from their corporate site.',
      'Never pay money to secure a job or employment opportunity.'
    ]
  },
  {
    id: 'tax-refund-phishing-apk',
    title: 'Tax Refund Phishing Form with APK Download',
    channel: 'documents',
    channelLabel: 'Documents & Email',
    shortDescription: 'Email with simulated tax department letterhead announcing an approved refund, instructing to install an APK file to claim it.',
    feature: 'document',
    checkRoute: '/check/document',
    sampleContent: 'INCOME TAX DEPARTMENT: An excess tax refund of Rs. 18,740 has been approved for AY 2024-25. Due to an IFSC mismatch, download the authorized IncomeTaxEfiling.apk file attached to verify your primary refund account.',
    attackPath: [
      { stage: 'Unexpected Refund', description: 'Message announces an attractive government tax refund ready for distribution.' },
      { stage: 'APK Payload', description: 'Instructs victim to install an Android APK file to resolve a minor banking issue.' },
      { stage: 'Malware Permissions', description: 'App requests SMS read/send permissions and accessibility service access.' },
      { stage: 'Silent Hijacking', description: 'Malware reads incoming OTPs in the background and drains accounts silently.' }
    ],
    redFlags: [
      'Direct instruction to download and install an .apk file outside the official Google Play store',
      'Government agencies do not send app installation files via email or message',
      'Asks for full debit card numbers, expiry dates, and CVVs to "credit" a refund'
    ],
    whatToDo: [
      'Never install APK files sent via WhatsApp, Telegram, or email.',
      'Log into the official government tax portal directly via browser to check refund status.',
      'If already installed, immediately disconnect the phone from the internet and factory reset.'
    ]
  }
];
