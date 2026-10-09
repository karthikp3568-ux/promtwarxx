# ==============================================================================
# TrustGuard AI — Deploy Frontend & Firestore to Firebase Hosting (PowerShell)
# Project: promtwars-745af
# ==============================================================================

[CmdletBinding()]
param (
    [string]$ProjectId = "promtwars-745af",
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

Write-Host "`n🔥 TrustGuard AI — Firebase Deployment Launcher" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor DarkGray

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$frontendDir = Join-Path $root "frontend"

# 1. Build Frontend
if (-not $SkipBuild) {
    Write-Host "[1/3] Building frontend for production..." -ForegroundColor Yellow
    Push-Location $frontendDir
    try {
        & npm run build
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Frontend build failed. Please fix errors before deploying."
        }
    } finally {
        Pop-Location
    }
} else {
    Write-Host "[1/3] Skipping frontend build as requested." -ForegroundColor Gray
}

# 2. Check Dist Output
$distDir = Join-Path $frontendDir "dist"
if (-not (Test-Path (Join-Path $distDir "index.html"))) {
    Write-Error "Build output not found at $distDir. Please run 'npm run build' first."
}

# 3. Deploy Firestore Rules, Indexes, and Hosting
Write-Host "`n[2/3] Deploying Firestore rules, indexes, and Hosting to Firebase ($ProjectId)..." -ForegroundColor Yellow
Push-Location $root
try {
    & npx --yes firebase-tools deploy --project $ProjectId --only "firestore:rules,firestore:indexes,hosting"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`nIf authentication failed, run: npx firebase login" -ForegroundColor Magenta
        exit $LASTEXITCODE
    }
} finally {
    Pop-Location
}

# 4. Summary
Write-Host "`n[3/3] Deployment complete!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor DarkGray
Write-Host "🎉 TrustGuard is live on Firebase Hosting!" -ForegroundColor Green
Write-Host "Production URL:  https://$ProjectId.web.app" -ForegroundColor Cyan
Write-Host "Alternate URL:   https://$ProjectId.firebaseapp.com" -ForegroundColor Cyan
Write-Host "Firebase Console: https://console.firebase.google.com/project/$ProjectId" -ForegroundColor Gray
Write-Host "========================================================`n" -ForegroundColor DarkGray
