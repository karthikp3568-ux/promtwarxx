#!/usr/bin/env bash
# ==============================================================================
# TrustGuard AI — Deploy Backend to Google Cloud Run (Bash)
# Project: promtwars-745af
# ==============================================================================

set -euo pipefail

PROJECT_ID="${1:-promtwars-745af}"
REGION="${2:-us-central1}"
SERVICE_NAME="${3:-trustguard-ai-service}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
AI_SERVICE_DIR="$ROOT_DIR/ai-service"

echo "🛡️  TrustGuard AI — Cloud Run Deployment Launcher"
echo "========================================================"

# 1. Verify gcloud CLI
if ! command -v gcloud &> /dev/null; then
    echo "Error: gcloud CLI not found in PATH." >&2
    exit 1
fi

gcloud config set project "$PROJECT_ID" > /dev/null

# 2. Get GEMINI_API_KEY
if [ -z "${GEMINI_API_KEY:-}" ]; then
    if [ -f "$AI_SERVICE_DIR/.env" ]; then
        GEMINI_API_KEY="$(grep -E '^GEMINI_API_KEY=' "$AI_SERVICE_DIR/.env" | cut -d '=' -f2- | tr -d ' "\r')"
    fi
fi

if [ -z "${GEMINI_API_KEY:-}" ]; then
    read -rp "Enter GEMINI_API_KEY: " GEMINI_API_KEY
fi

# 3. Enable APIs
echo "[1/4] Enabling required Google Cloud APIs..."
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com --project "$PROJECT_ID"

# 4. Deploy Cloud Run
echo "[2/4] Deploying to Google Cloud Run via Cloud Build..."
ENV_VARS="FIREBASE_PROJECT_ID=$PROJECT_ID,USE_FIREBASE_EMULATORS=false,GEMINI_MODEL=gemini-3.8-flash,VOICE_MODEL_ENABLED=true,ALLOWED_ORIGINS=https://$PROJECT_ID.web.app,https://$PROJECT_ID.firebaseapp.com,http://localhost:5173,GEMINI_API_KEY=$GEMINI_API_KEY"

gcloud run deploy "$SERVICE_NAME" \
    --source "$AI_SERVICE_DIR" \
    --project "$PROJECT_ID" \
    --region "$REGION" \
    --platform managed \
    --allow-unauthenticated \
    --memory 2Gi \
    --cpu 2 \
    --timeout 300 \
    --min-instances 0 \
    --max-instances 5 \
    --set-env-vars "$ENV_VARS"

# 5. Check Health
SERVICE_URL="$(gcloud run services describe "$SERVICE_NAME" --platform managed --region "$REGION" --project "$PROJECT_ID" --format 'value(status.url)')"
echo "[3/4] Retrieved Cloud Run URL: $SERVICE_URL"

echo "[4/4] Verifying health check..."
curl -s -f "$SERVICE_URL/health" || echo "Warning: Healthcheck failed or warming up."

echo "========================================================"
echo "🎉 Backend deployed successfully!"
echo "Backend URL: $SERVICE_URL"
echo "Set VITE_API_URL=$SERVICE_URL in frontend/.env"
echo "========================================================"
