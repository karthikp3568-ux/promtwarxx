# ==============================================================================
# TrustGuard AI — Complete End-to-End Cloud Deployment (PowerShell)
# 1. Cloud Run (FastAPI Backend + WavLM + Gemini)
# 2. Firebase Hosting (React + Vite)
# 3. Cloud Firestore (Rules + Indexes)
# ==============================================================================

[CmdletBinding()]
param (
    [string]$ProjectId = "promtwars-745af",
    [string]$Region = "us-central1",
    [string]$ServiceName = "trustguard-ai-service"
)

$ErrorActionPreference = "Stop"

Write-Host "`n🚀 ========================================================" -ForegroundColor Cyan
Write-Host "   TrustGuard AI — Full Cloud Deployment Sequence" -ForegroundColor Cyan
Write-Host "   Project: $ProjectId | Region: $Region" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor DarkGray

# STEP 1: Deploy Cloud Run Backend
Write-Host "=== STEP 1/3: Deploying Backend to Google Cloud Run ===" -ForegroundColor Magenta
$deployRunScript = Join-Path $PSScriptRoot "deploy_cloud_run.ps1"
& $deployRunScript -ProjectId $ProjectId -Region $Region -ServiceName $ServiceName

# Retrieve Service URL
$serviceUrl = (& gcloud run services describe $ServiceName --platform managed --region $Region --project $ProjectId --format "value(status.url)").Trim()
if (-not $serviceUrl) {
    Write-Error "Failed to retrieve Cloud Run Service URL. Aborting."
}
Write-Host "Backend is active at: $serviceUrl" -ForegroundColor Green

# STEP 2: Configure & Build Frontend with Backend URL
Write-Host "`n=== STEP 2/3: Configuring & Building Frontend ===" -ForegroundColor Magenta
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$frontendDir = Join-Path $root "frontend"

Push-Location $frontendDir
try {
    # Set VITE_API_URL in current process environment for the Vite build
    $env:VITE_API_URL = $serviceUrl
    $env:VITE_USE_FIREBASE_EMULATORS = "false"
    Write-Host "Building frontend targeting API: $serviceUrl" -ForegroundColor Gray
    & npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Frontend build failed."
    }
} finally {
    Pop-Location
}

# STEP 3: Deploy Frontend & Firestore to Firebase
Write-Host "`n=== STEP 3/3: Deploying Firestore Rules & Firebase Hosting ===" -ForegroundColor Magenta
$deployFbScript = Join-Path $PSScriptRoot "deploy_firebase.ps1"
& $deployFbScript -ProjectId $ProjectId -SkipBuild

# FINAL SUMMARY
Write-Host "`n========================================================" -ForegroundColor DarkGray
Write-Host "🌟 ALL SYSTEMS DEPLOYED SUCCESSFULLY TO THE CLOUD!" -ForegroundColor Green
Write-Host "--------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "  Frontend (Web App):  https://$ProjectId.web.app" -ForegroundColor Cyan
Write-Host "  Alternate Domain:    https://$ProjectId.firebaseapp.com" -ForegroundColor Cyan
Write-Host "  Backend API:         $serviceUrl" -ForegroundColor Cyan
Write-Host "  Backend Docs:        $serviceUrl/docs" -ForegroundColor Cyan
Write-Host "  Health Endpoint:     $serviceUrl/health" -ForegroundColor Cyan
Write-Host "  GCP Console:         https://console.cloud.google.com/run?project=$ProjectId" -ForegroundColor Gray
Write-Host "  Firebase Console:    https://console.firebase.google.com/project/$ProjectId" -ForegroundColor Gray
Write-Host "========================================================`n" -ForegroundColor DarkGray
