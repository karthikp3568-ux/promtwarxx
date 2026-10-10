# TrustGuard AI — Vercel & Firebase Deployment Guide

This guide details the complete production deployment for **TrustGuard AI** on **Vercel** (React + Vite frontend) and **Firebase** (Authentication + Cloud Firestore security rules).

---

## 1. Architecture Overview

```
                        ┌──────────────────────────────────────┐
                        │              End User                │
                        └──────────────────┬───────────────────┘
                                           │
                         HTTPS (*.vercel.app / Custom Domain)
                                           │
                                           ▼
              ┌─────────────────────────────────────────────────────┐
              │                   Vercel Hosting                    │
              │         React + Vite + Tailwind v4 + Motion         │
              └──────────────────┬──────────────────┬───────────────┘
                                 │                  │
            Client-Side Auth / DB│                  │ REST & Streaming API
                                 ▼                  ▼
┌──────────────────────────────────────┐ ┌─────────────────────────────────────────┐
│     Firebase Authentication          │ │             FastAPI Backend             │
│     & Cloud Firestore (Rules Active) │ │   FastAPI + GenAI SDK + Forensics       │
└──────────────────────────────────────┘ └────────────────────┬────────────────────┘
                                                              │
                                                              ▼
                                                 ┌─────────────────────────┐
                                                 │   Google Gemini 3.5     │
                                                 │   Flash Safety Engine   │
                                                 └─────────────────────────┘
```

---

## 2. Deploying the Frontend to Vercel

### Option A: Import via Vercel Web Dashboard (Recommended)

1. Push your repository to GitHub:
   ```bash
   git push origin main
   ```
2. Go to [vercel.com](https://vercel.com) and click **"Add New..." → "Project"**.
3. Import your GitHub repository (`promtwarxx`).
4. In the Project Configuration:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend` (or leave as root `/` — both are pre-configured with `vercel.json`!)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. **Environment Variables**: Add your production Firebase credentials and backend API URL:

| Environment Variable | Description | Example Value |
| :--- | :--- | :--- |
| `VITE_FIREBASE_API_KEY` | Firebase Web API key | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain | `promtwars-745af.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID | `promtwars-745af` |
| `VITE_FIREBASE_STORAGE_BUCKET`| Firebase Storage bucket | `promtwars-745af.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID | `1234567890` |
| `VITE_FIREBASE_APP_ID` | Firebase App ID | `1:1234567890:web:...` |
| `VITE_USE_FIREBASE_EMULATORS` | Disable emulators in production | `false` |
| `VITE_API_URL` | Your live backend API base URL | `https://your-backend-api.com` |

6. Click **Deploy**. Vercel will build and assign your production URL (e.g., `https://trustguard.vercel.app`).

---

### Option B: Deploy via Vercel CLI

1. Install the Vercel CLI:
   ```bash
   npm i -g vercel
   ```
2. Navigate to `frontend` and run deploy:
   ```bash
   cd frontend
   vercel --prod
   ```
3. Follow the CLI prompts to link to your Vercel team and project.

---

## 3. Firebase Console Configuration (Live Project)

To ensure Firebase Authentication and Firestore work on your live Vercel domain:

1. **Add Vercel Domain to Firebase Authorized Domains**:
   - Go to [Firebase Console](https://console.firebase.google.com/) → Your Project (`promtwars-745af`).
   - Navigate to **Authentication → Settings → Authorized domains**.
   - Click **Add domain** and enter your Vercel domain (e.g. `your-app.vercel.app` or custom domain).

2. **Deploy Firestore Security Rules & Indexes**:
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes --project promtwars-745af
   ```

---

## 4. SPA Routing Configuration

Both `vercel.json` (at repo root) and `frontend/vercel.json` are already set up with rewrite rules:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
This guarantees that sub-routes (`/check/conversation`, `/history`, `/settings`, `/login`) reload cleanly without 404 errors.
