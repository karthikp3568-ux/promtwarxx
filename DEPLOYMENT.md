# TrustGuard AI — Cloud Deployment Guide

This guide details the complete production cloud deployment for **TrustGuard AI** across **Google Cloud Run** (FastAPI backend + WavLM deepfake forensics + Gemini 3.8 Flash) and **Firebase Hosting & Cloud Firestore** (React frontend + owner-only security rules).

---

## 1. Cloud Architecture Overview

```
                        ┌──────────────────────────────────────┐
                        │              End User                │
                        └──────────────────┬───────────────────┘
                                           │
                    HTTPS (Custom Domain / *.web.app)
                                           │
                                           ▼
             ┌─────────────────────────────────────────────────────┐
             │         Firebase Hosting (promtwars-745af)          │
             │           React + Vite + Tailwind v4 + Motion       │
             └──────────────────┬──────────────────┬───────────────┘
                                │                  │
           Client-Side Auth / DB│                  │ REST & Streaming API
                                ▼                  ▼
┌──────────────────────────────────────┐ ┌─────────────────────────────────────────┐
│     Firebase Authentication          │ │   Google Cloud Run (trustguard-backend)  │
│     & Cloud Firestore (Rules Active) │ │   FastAPI + GenAI SDK + WavLM Forensics │
└──────────────────────────────────────┘ └────────────────────┬────────────────────┘
                                                              │
                                                              ▼
                                                 ┌─────────────────────────┐
                                                 │   Google Gemini 3.8     │
                                                 │   Flash Safety Engine   │
                                                 └─────────────────────────┘
```

---

## 2. Prerequisites

1. **Google Cloud SDK (`gcloud`)**:
   Verify installation and active authenticated account:
   ```powershell
   gcloud version
   gcloud auth list
   ```
2. **Node.js**: v18+ with `npm`
3. **Firebase CLI**:
   Run login once to grant CLI deployment tokens:
   ```powershell
   npx firebase-tools login
   ```
4. **Google Cloud Project**: `promtwars-745af` (already linked in `.firebaserc`)

---

## 3. Fast One-Command Deployment

Run the unified end-to-end cloud deployment script:

### Windows (PowerShell)
```powershell
cd d:\codes\promtwars\TrustGuard
.\scripts\deploy_all.ps1
```

### macOS / Linux (Bash)
```bash
cd d:\codes\promtwars\TrustGuard
chmod +x scripts/*.sh
./scripts/deploy_all.sh
```

**What this script does automatically**:
1. Enables required Google Cloud APIs (`run.googleapis.com`, `cloudbuild.googleapis.com`, `artifactregistry.googleapis.com`).
2. Packages and builds the backend container in Google Cloud Build with CPU-only PyTorch and baked WavLM weights.
3. Deploys the container to **Google Cloud Run** in `us-central1` with 2 vCPU and 2GB RAM.
4. Retrieves the live Cloud Run HTTPS URL and verifies the `/health` endpoint.
5. Injects the Cloud Run URL into the frontend build environment (`VITE_API_URL`).
6. Runs `npm run build` to generate production frontend bundles into `frontend/dist`.
7. Deploys Firestore security rules, composite indexes, and the frontend web app to **Firebase Hosting**.

---

## 4. Step-by-Step Manual Deployment

If you prefer to deploy each component individually:

### Step A: Deploy Backend to Google Cloud Run

1. Make sure your active GCP project is set:
   ```powershell
   gcloud config set project promtwars-745af
   ```

2. Enable required services:
   ```powershell
   gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
   ```

3. Deploy using Google Cloud Build (no local Docker daemon required):
   ```powershell
   cd d:\codes\promtwars\TrustGuard
   .\scripts\deploy_cloud_run.ps1
   ```
   *Or via direct gcloud command*:
   ```powershell
   gcloud run deploy trustguard-ai-service `
     --source ./ai-service `
     --project promtwars-745af `
     --region us-central1 `
     --platform managed `
     --allow-unauthenticated `
     --memory 2Gi `
     --cpu 2 `
     --timeout 300 `
     --set-env-vars "FIREBASE_PROJECT_ID=promtwars-745af,USE_FIREBASE_EMULATORS=false,GEMINI_MODEL=gemini-3.8-flash,VOICE_MODEL_ENABLED=true,ALLOWED_ORIGINS=https://promtwars-745af.web.app,https://promtwars-745af.firebaseapp.com,GEMINI_API_KEY=YOUR_GEMINI_KEY"
   ```

4. Note down the public URL output by Cloud Run (e.g., `https://trustguard-ai-service-xxxx.a.run.app`).

---

### Step B: Configure Frontend Production Environment

1. In `frontend/`, configure `.env` (or set environment variables for the build):
   ```env
   VITE_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
   VITE_FIREBASE_AUTH_DOMAIN=promtwars-745af.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=promtwars-745af
   VITE_FIREBASE_STORAGE_BUCKET=promtwars-745af.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=498193059936
   VITE_FIREBASE_APP_ID=YOUR_APP_ID
   VITE_USE_FIREBASE_EMULATORS=false
   VITE_API_URL=https://trustguard-ai-service-xxxx.a.run.app
   ```

2. Build the frontend:
   ```powershell
   cd frontend
   npm run build
   ```

---

### Step C: Deploy Firestore Rules, Indexes & Frontend to Firebase Hosting

From the root directory (`TrustGuard/`):

1. Login to Firebase (if not already logged in):
   ```powershell
   npx firebase-tools login
   ```

2. Deploy all Firebase assets:
   ```powershell
   npx firebase-tools deploy --project promtwars-745af --only firestore:rules,firestore:indexes,hosting
   ```

---

## 5. Production Environment Variables Reference

### Backend (`ai-service` on Cloud Run)

| Variable | Description | Recommended Production Value |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API Key | `AQ.Ab8RN6...` or from Secret Manager |
| `GEMINI_MODEL` | Analysis LLM model version | `gemini-3.8-flash` |
| `VOICE_MODEL_ID` | WavLM deepfake model checkpoint | `DavidCombei/wavLM-base-Deepfake_V2` |
| `VOICE_MODEL_ENABLED` | Enables neural voice deepfake classification | `true` |
| `URL_FETCH_ENABLED` | Enables live metadata & SSL inspection | `true` |
| `DEMO_CACHE` | Use cached responses for demo presentations | `false` |
| `ALLOWED_ORIGINS` | Permitted CORS origins (comma-separated) | `https://promtwars-745af.web.app,https://promtwars-745af.firebaseapp.com` |
| `FIREBASE_PROJECT_ID`| Target Firebase project ID | `promtwars-745af` |
| `USE_FIREBASE_EMULATORS`| Flag to route to local emulators | `false` |

> [!NOTE]
> On Google Cloud Run, credentials for Firebase Admin SDK are inherited automatically through the Compute default service account via Application Default Credentials (ADC). There is no need to manually upload a JSON service account key.

---

### Frontend (`frontend` on Firebase Hosting)

| Variable | Description |
|---|---|
| `VITE_FIREBASE_API_KEY` | Public Firebase Web API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `promtwars-745af.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `promtwars-745af` |
| `VITE_USE_FIREBASE_EMULATORS` | Must be set to `false` for live Firestore & Auth |
| `VITE_API_URL` | The Cloud Run backend URL (e.g. `https://trustguard-ai-service-xxxx.a.run.app`) |

---

## 6. Live Verification Checklist

Once deployed, verify all capabilities:

1. **Health Check**:
   ```bash
   curl https://<YOUR-CLOUD-RUN-URL>/health
   ```
   *Expected Response*: `{"status":"ok","version":"0.1.0","gemini":true,"voice_model":true}`

2. **Web App Access**:
   Visit `https://promtwars-745af.web.app` in your browser.
   - Verify guest login and anonymous sign-in succeed.
   - Run a test conversation analysis using the demo sample button.
   - Verify that results stream in via NDJSON with live reasoning and attack simulation.

3. **Firestore Security Verification**:
   Inspect Firestore in the Firebase Console:
   - User entries are stored under `users/{uid}/analyses/{analysisId}`.
   - Ensure other users cannot read or overwrite foreign documents.

---

## 7. Troubleshooting & Common Pitfalls

- **Firebase CLI: "Failed to authenticate"**:
  Run `npx firebase-tools login` or `npx firebase-tools login --reauth` in your terminal to refresh tokens.
- **Cloud Run Out-Of-Memory (OOM)**:
  The WavLM PyTorch model requires ~800MB RAM during inference. Always ensure `--memory 2Gi` or higher is allocated.
- **CORS Errors**:
  Confirm that your Firebase Hosting domain (`https://promtwars-745af.web.app`) is in the backend's `ALLOWED_ORIGINS` environment variable.
- **Firebase Auth Unauthorized Domain**:
  In **Firebase Console → Authentication → Settings → Authorized domains**, ensure `promtwars-745af.web.app` and any custom domains are listed.
