# TrustGuard AI — Your AI-Powered Digital Safety Layer

> **Tagline**: *"Your AI-powered digital safety layer."*  
> **Philosophy**: **Detect → Understand → Explain → Protect**. TrustGuard acts as an AI security analyst for everyday digital interactions — evaluating suspicious messages, fraudulent QR/UPI payment traps, forged official notices, and synthetic voice impersonation calls.

---

## 1. Architecture & Repo Layout

```
TrustGuard/
├── SPEC.md                       # Project specification (source of truth)
├── README.md                     # Comprehensive setup and deployment guide
├── firebase.json, .firebaserc    # Firebase emulator & project config (promtwars-745af)
├── firebase/
│   ├── firestore.rules           # Security rules (owner-only access, backend-only analysis writes)
│   └── firestore.indexes.json    # Composite indexes for querying and sorting
├── scripts/
│   ├── dev.ps1                   # One-command Windows launcher
│   └── dev.sh                    # One-command Linux/macOS launcher
├── frontend/                     # React + Vite + TypeScript + Tailwind v4 + Motion + Firebase Client SDK
│   ├── src/
│   │   ├── auth/                 # AuthProvider, ProtectedRoute, useAuth, guest upgrade
│   │   ├── api/                  # NDJSON streaming client, ID token attachment, types
│   │   ├── components/           # RiskGauge, CategoryGrid, EvidenceCard, AttackPath, InvestigationTimeline
│   │   ├── features/             # Conversation, Payment, Document, Voice, What-If
│   │   └── pages/                # Dashboard, Check, History, SavedReport, Settings, Login, Register
└── ai-service/                   # Python 3.11/3.13 FastAPI backend + Google GenAI + WavLM Forensics
    ├── main.py                   # FastAPI app with CORS, rate-limiting, and error middleware
    ├── services/                 # Risk engine, text extractors, URL inspector, QR/UPI parser, audio processor, voice detector
    ├── routers/                  # health, conversation, payment, document, voice, whatif, history
    ├── prompts/                  # Versioned analyst markdown prompts with anti-injection defenses
    └── samples/                  # Verified demo samples (QR codes, PDF with text layer, synthetic audio)
```

---

## 2. Prerequisites & Environment Setup (Windows 11 / Linux)

### Dependencies
- **Node.js**: v18+ (tested on Node v20/v22)
- **Python**: 3.11+ (tested on Python 3.11 & 3.13)
- **Java JDK**: 17+ or 21 (required by Firebase Emulator Suite)

### Backend Virtual Environment & Packages
```powershell
cd d:\codes\promtwars\TrustGuard\ai-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install PyTorch CPU (Windows compatible)
pip install torch --index-url https://download.pytorch.org/whl/cpu

# Install service dependencies
pip install -r requirements.txt
```

### Frontend Dependencies
```powershell
cd d:\codes\promtwars\TrustGuard\frontend
npm install
```

---

## 3. Environment Configuration

### Backend: `ai-service/.env`
Create `ai-service/.env` (do NOT commit to Git):
```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_MODEL=gemini-3.8-flash
VOICE_MODEL_ID=DavidCombei/wavLM-base-Deepfake_V2
VOICE_MODEL_ENABLED=true
URL_FETCH_ENABLED=true
DEMO_CACHE=false
ALLOWED_ORIGINS=http://localhost:5173
FIREBASE_PROJECT_ID=promtwars-745af
USE_FIREBASE_EMULATORS=true
```

### Frontend: `frontend/.env`
Create `frontend/.env` with your web app configuration:
```env
VITE_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=promtwars-745af.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=promtwars-745af
VITE_FIREBASE_STORAGE_BUCKET=promtwars-745af.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID
VITE_USE_FIREBASE_EMULATORS=true
```

---

## 4. Models, Demo Samples & Cache Warming

Run the one-time preparation scripts from `ai-service/`:

```powershell
# 1. Download HuggingFace WavLM Deepfake Audio Forensics model weights (~360MB)
python scripts/download_models.py

# 2. Generate test assets (QR PNGs, sample PDF, 16-bit 34.3s WAV clip)
python scripts/make_samples.py

# 3. Pre-warm demo cache for resilient judge presentations
python scripts/warm_demo_cache.py
```

---

## 5. Running the Application

### One-Command Launcher (with Local Firebase Emulators)
Start both servers plus the Firebase Auth & Firestore emulators:

**Windows (PowerShell)**:
```powershell
.\scripts\dev.ps1 -emulators
```

**macOS / Linux**:
```bash
./scripts/dev.sh --emulators
```

- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:8000` (`http://localhost:8000/docs`)
- **Firebase Emulator Suite UI**: `http://localhost:4000` (Auth: `9099`, Firestore: `8080`)

---

## 6. Running Tests & Verifying Acceptance

```powershell
# Run the complete backend test suite (71 passing tests)
cd ai-service
pytest tests/ -v

# Run live acceptance tests across all 5 core features against the running backend
pytest tests/test_all_features_live.py -v

# Verify frontend production build and zero secret leakage
cd ../frontend
npm run build
```

---

## 7. Manual Firebase Console Checklist (For Live Production)

When preparing to transition from local Firebase Emulators (`demo-trustguard`) to the live project (`promtwars-745af`), perform the following in the Firebase & Google Cloud Consoles:

1. **Authentication Providers**:
   - Go to **Firebase Console → Authentication → Sign-in method**.
   - Enable **Email/Password**.
   - Enable **Anonymous** sign-in (for frictionless guest analysis).
2. **Email Enumeration Protection**:
   - In **Authentication → Settings → User actions**, verify that *Email enumeration protection* is enabled.
3. **Authorized Domains**:
   - In **Authentication → Settings → Authorized domains**, add your production hosting domain (e.g., `trustguard.app` or your Vercel domain `*.vercel.app`).
4. **Firestore Database**:
   - In **Firestore Database**, create the database in *Production mode* in a region nearest your users (e.g., `asia-south1` or `us-central1`).
5. **Web App Configuration**:
   - Register the web client in **Project settings → General → Your apps** and paste the public configuration into `frontend/.env`.
6. **Service Account Credentials**:
   - Under **Project settings → Service accounts**, generate a private key JSON.
   - Store it **outside the repository directory** and set `GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/key.json` in `ai-service/.env`.
7. **API Key Restriction**:
   - In **Google Cloud Console → APIs & Services → Credentials**, restrict your Firebase Browser API key by HTTP referrer to your domain.
8. **Deploy Security Rules & Indexes**:
   - Once verified, deploy using the Firebase CLI (requires your approval):
     ```bash
     firebase deploy --only firestore:rules,firestore:indexes --project promtwars-745af
     ```
9. **Seed Security Insights**:
   - Populate curated safety tips into Firestore:
     ```bash
     python ai-service/scripts/seed_insights.py
     ```
