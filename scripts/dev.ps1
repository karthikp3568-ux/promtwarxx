# TrustGuard AI — Development Server Launcher (Windows)
# Starts backend (FastAPI), frontend (Vite), and optionally Firebase emulators
param(
    [switch]$emulators
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TrustGuard AI — Starting Dev Servers" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$backendDir = Join-Path $projectRoot "ai-service"
$frontendDir = Join-Path $projectRoot "frontend"

$emulatorProc = $null
if ($emulators) {
    Write-Host "`nStarting Firebase Emulators (Auth: 9099, Firestore: 8080)..." -ForegroundColor Yellow
    $emulatorProc = Start-Process -NoNewWindow -PassThru -FilePath "npx" -ArgumentList "firebase", "emulators:start", "--only", "auth,firestore", "--project", "demo-trustguard" -WorkingDirectory $projectRoot
    Start-Sleep -Seconds 3
}

# Start backend
Write-Host "`nStarting backend (FastAPI) on http://localhost:8000..." -ForegroundColor Yellow
$backend = Start-Process -NoNewWindow -PassThru -FilePath "python" -ArgumentList "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload" -WorkingDirectory $backendDir

# Start frontend
Write-Host "Starting frontend (Vite) on http://localhost:5173..." -ForegroundColor Yellow
$frontend = Start-Process -NoNewWindow -PassThru -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory $frontendDir

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  Backend:   http://localhost:8000" -ForegroundColor Green
Write-Host "  Frontend:  http://localhost:5173" -ForegroundColor Green
Write-Host "  Health:    http://localhost:8000/api/health" -ForegroundColor Green
if ($emulators) {
    Write-Host "  Emulators: Auth 9099 | Firestore 8080 | UI 4000" -ForegroundColor Green
}
Write-Host "========================================" -ForegroundColor Green
Write-Host "`nPress Ctrl+C to stop servers.`n" -ForegroundColor Gray

try {
    Wait-Process -Id $backend.Id
} finally {
    if (!$backend.HasExited) { Stop-Process -Id $backend.Id -Force }
    if (!$frontend.HasExited) { Stop-Process -Id $frontend.Id -Force }
    if ($emulatorProc -and !$emulatorProc.HasExited) { Stop-Process -Id $emulatorProc.Id -Force }
    Write-Host "`nServers stopped." -ForegroundColor Yellow
}
