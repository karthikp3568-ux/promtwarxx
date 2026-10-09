#!/usr/bin/env bash
# ==============================================================================
# TrustGuard AI — Deploy Frontend & Firestore to Firebase Hosting (Bash)
# Project: promtwars-745af
# ==============================================================================

set -euo pipefail

PROJECT_ID="${1:-promtwars-745af}"
SKIP_BUILD="${2:-false}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$ROOT_DIR/frontend"

echo "🔥 TrustGuard AI — Firebase Deployment Launcher"
echo "========================================================"

if [ "$SKIP_BUILD" != "true" ]; then
    echo "[1/3] Building frontend for production..."
    cd "$FRONTEND_DIR"
    npm run build
fi

cd "$ROOT_DIR"
echo "[2/3] Deploying Firestore rules, indexes, and Hosting to $PROJECT_ID..."
npx --yes firebase-tools deploy --project "$PROJECT_ID" --only firestore:rules,firestore:indexes,hosting

echo "[3/3] Deployment complete!"
echo "========================================================"
echo "🎉 Live at: https://$PROJECT_ID.web.app"
echo "Alternate: https://$PROJECT_ID.firebaseapp.com"
echo "========================================================"
