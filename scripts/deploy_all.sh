#!/usr/bin/env bash
# ==============================================================================
# TrustGuard AI — Complete End-to-End Cloud Deployment (Bash)
# ==============================================================================

set -euo pipefail

PROJECT_ID="${1:-promtwars-745af}"
REGION="${2:-us-central1}"
SERVICE_NAME="${3:-trustguard-ai-service}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$ROOT_DIR/frontend"

echo "🚀 TrustGuard AI — Full Cloud Deployment Sequence"
echo "Project: $PROJECT_ID | Region: $REGION"
echo "========================================================"

# Step 1: Deploy Backend to Cloud Run
echo "=== STEP 1/3: Deploying Backend to Cloud Run ==="
bash "$SCRIPT_DIR/deploy_cloud_run.sh" "$PROJECT_ID" "$REGION" "$SERVICE_NAME"

SERVICE_URL="$(gcloud run services describe "$SERVICE_NAME" --platform managed --region "$REGION" --project "$PROJECT_ID" --format 'value(status.url)')"

# Step 2: Build Frontend with production API URL
echo "=== STEP 2/3: Building Frontend with VITE_API_URL=$SERVICE_URL ==="
cd "$FRONTEND_DIR"
export VITE_API_URL="$SERVICE_URL"
export VITE_USE_FIREBASE_EMULATORS="false"
npm run build

# Step 3: Deploy Firestore & Hosting
echo "=== STEP 3/3: Deploying to Firebase ==="
cd "$ROOT_DIR"
bash "$SCRIPT_DIR/deploy_firebase.sh" "$PROJECT_ID" "true"

echo "========================================================"
echo "🌟 ALL SYSTEMS DEPLOYED SUCCESSFULLY TO THE CLOUD!"
echo "  Frontend:  https://$PROJECT_ID.web.app"
echo "  Backend:   $SERVICE_URL"
echo "========================================================"
