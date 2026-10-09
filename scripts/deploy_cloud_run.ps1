# ==============================================================================
# TrustGuard AI â€” Deploy Backend to Google Cloud Run (PowerShell)
# Project: promtwars-745af
# ==============================================================================

[CmdletBinding()]
param (
    
    [string]$ProjectId = "promtwars-745af",
    [string]$Region = "us-central1",
    [string]$ServiceName = "trustguard-ai-service"
)



$ErrorActionPreference = "Stop"

Write-Host "TrustGuard AI - Cloud Run Deployment Launcher" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor DarkGray

# 1. Verify gcloud CLI
Write-Host "[1/5] Verifying Google Cloud CLI..." -ForegroundColor Yellow
$gcloudCmd = Get-Command "gcloud" -ErrorAction SilentlyContinue
if (-not $gcloudCmd) {
    Write-Error "Google Cloud SDK (gcloud) is not found in PATH. Please install Google Cloud SDK."
}

# Ensure correct GCP project
Write-Host "Configuring active GCP project: $ProjectId" -ForegroundColor Gray
& gcloud config set project $ProjectId | Out-Null



# 3. Enable Required Google Cloud APIs
Write-Host "`n[2/5] Ensuring required Google Cloud APIs are enabled..." -ForegroundColor Yellow
$apis = @("run.googleapis.com", "cloudbuild.googleapis.com", "artifactregistry.googleapis.com")
foreach ($api in $apis) {
    Write-Host "Checking/enabling $api..." -ForegroundColor Gray
    & gcloud services enable $api --project $ProjectId
}

# 4. Deploy to Cloud Run using Cloud Build (no local Docker required)
Write-Host "`n[3/5] Submitting source and deploying to Cloud Run (Region: $Region)..." -ForegroundColor Yellow
Write-Host "Note: Google Cloud Build will package and build the container in the cloud.`n" -ForegroundColor Gray

$aiServiceDir = (Resolve-Path (Join-Path $PSScriptRoot "..\ai-service")).Path

$envVars = "FIREBASE_PROJECT_ID=$ProjectId," +
           "USE_FIREBASE_EMULATORS=false," +
           "GEMINI_MODEL=gemini-3.5-flash," +
           "VOICE_MODEL_ENABLED=true"

$origins = "ALLOWED_ORIGINS=https://$ProjectId.web.app,https://$ProjectId.firebaseapp.com,http://localhost:5173"

$envYaml = @"
FIREBASE_PROJECT_ID: "$ProjectId"
USE_FIREBASE_EMULATORS: "false"
GEMINI_MODEL: "gemini-3.5-flash"
VOICE_MODEL_ENABLED: "true"
ALLOWED_ORIGINS: "https://$ProjectId.web.app,https://$ProjectId.firebaseapp.com,http://localhost:5173"
"@
Set-Content -Path "$env:TEMP\trustguard-env.yaml" -Value $envYaml -Encoding utf8
& gcloud run deploy $ServiceName `
    --source $aiServiceDir `
    --project $ProjectId `
    --region $Region `
    --platform managed `
    --allow-unauthenticated `
    --memory 2Gi `
    --cpu 2 `
    --timeout 300 `
    --min-instances 0 `
    --max-instances 5 `
    --set-secrets "GEMINI_API_KEY=GEMINI_API_KEY:latest" `
    --env-vars-file "$env:TEMP\trustguard-env.yaml"
if ($LASTEXITCODE -ne 0) {
    throw "Cloud Run deployment failed."
}

# 5. Retrieve Public Cloud Run URL
Write-Host "`n[4/5] Retrieving live service URL..." -ForegroundColor Yellow
$serviceUrl = (& gcloud run services describe $ServiceName --platform managed --region $Region --project $ProjectId --format "value(status.url)").Trim()

# 6. Verify Health Endpoint
Write-Host "`n[5/5] Running live health check on $serviceUrl/health..." -ForegroundColor Yellow
try {
    $healthRes = Invoke-RestMethod -Uri "$serviceUrl/health" -Method Get -TimeoutSec 15
    Write-Host "Health Check Passed! Status: $($healthRes.status)" -ForegroundColor Green
} catch {
    Write-Host "Warning: Initial health check did not return 200 OK ($($_.Exception.Message))." -ForegroundColor Red
}

Write-Host "`n========================================================" -ForegroundColor DarkGray
Write-Host "ðŸŽ‰ Backend successfully deployed to Cloud Run!" -ForegroundColor Green
Write-Host "Backend URL: $serviceUrl" -ForegroundColor Cyan
Write-Host "Use this URL in frontend/.env as VITE_API_URL=$serviceUrl" -ForegroundColor Gray
Write-Host "Deployment finished." -ForegroundColor DarkGray




