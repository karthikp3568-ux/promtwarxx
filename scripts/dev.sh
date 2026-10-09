#!/usr/bin/env bash
# TrustGuard AI — Development Server Launcher (Linux/macOS)
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/ai-service"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

EMULATORS=false
if [[ "$1" == "--emulators" ]]; then
  EMULATORS=true
fi

echo "Starting TrustGuard AI development servers..."

if [ "$EMULATORS" = true ]; then
  echo "Starting Firebase Emulators..."
  npx firebase emulators:start --only auth,firestore --project demo-trustguard &
  EMU_PID=$!
  sleep 3
fi

python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload --app-dir "$BACKEND_DIR" &
BACKEND_PID=$!

cd "$FRONTEND_DIR" && npm run dev &
FRONTEND_PID=$!

cleanup() {
  echo "Stopping servers..."
  kill $BACKEND_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
  if [ "$EMULATORS" = true ]; then
    kill $EMU_PID 2>/dev/null || true
  fi
  wait $BACKEND_PID 2>/dev/null || true
  wait $FRONTEND_PID 2>/dev/null || true
}

trap cleanup EXIT INT TERM
wait
