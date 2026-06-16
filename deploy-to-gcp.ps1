# RCR App - GCP Deployment Script (PowerShell)
# This script automates the deployment process to Google Cloud Run
# Prerequisites: gcloud CLI installed and authenticated

param(
    [string]$ProjectId,
    [string]$Region = "asia-southeast1",
    [string]$ServiceName = "rcr-app",
    [string]$Action = "deploy"
)

# Color codes for output
$ErrorColor = "Red"
$SuccessColor = "Green"
$InfoColor = "Cyan"
$WarningColor = "Yellow"

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️ $Message" -ForegroundColor $InfoColor
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor $SuccessColor
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor $ErrorColor
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor $WarningColor
}

# Check if gcloud CLI is installed
function Test-GcloudInstalled {
    try {
        $gcloud = gcloud --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            return $true
        }
    }
    catch {
        return $false
    }
}

# Get current Google Cloud project
function Get-CurrentProject {
    try {
        $project = gcloud config get-value project 2>$null
        return $project
    }
    catch {
        return $null
    }
}

# Set Google Cloud project
function Set-GcpProject {
    param([string]$ProjectId)
    
    Write-Info "Setting GCP project to: $ProjectId"
    gcloud config set project $ProjectId
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Project set successfully"
        return $true
    }
    else {
        Write-Error-Custom "Failed to set project"
        return $false
    }
}

# Check if Artifact Registry repository exists
function Test-ArtifactRegistry {
    param([string]$ProjectId, [string]$Region, [string]$RepoName)
    
    Write-Info "Checking Artifact Registry repository..."
    $repos = gcloud artifacts repositories list --project=$ProjectId --format="value(name)" 2>$null
    
    if ($repos -contains $RepoName) {
        Write-Success "Repository '$RepoName' found"
        return $true
    }
    else {
        return $false
    }
}

# Create Artifact Registry repository
function New-ArtifactRegistry {
    param([string]$ProjectId, [string]$Region, [string]$RepoName)
    
    Write-Info "Creating Artifact Registry repository: $RepoName"
    gcloud artifacts repositories create $RepoName `
        --repository-format=docker `
        --location=$Region `
        --project=$ProjectId
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Artifact Registry repository created"
        return $true
    }
    else {
        Write-Error-Custom "Failed to create repository"
        return $false
    }
}

# Check if service account exists
function Test-ServiceAccount {
    param([string]$ProjectId, [string]$ServiceAccountName)
    
    Write-Info "Checking service account..."
    $accounts = gcloud iam service-accounts list --project=$ProjectId --format="value(email)" 2>$null
    
    $email = "$ServiceAccountName@$ProjectId.iam.gserviceaccount.com"
    if ($accounts -contains $email) {
        Write-Success "Service account found: $email"
        return $true
    }
    else {
        return $false
    }
}

# Create service account
function New-ServiceAccount {
    param([string]$ProjectId, [string]$ServiceAccountName, [string]$DisplayName)
    
    Write-Info "Creating service account: $ServiceAccountName"
    gcloud iam service-accounts create $ServiceAccountName `
        --display-name="$DisplayName" `
        --project=$ProjectId
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Service account created"
        # Grant necessary roles
        Grant-ServiceAccountRoles -ProjectId $ProjectId -ServiceAccountName $ServiceAccountName
        return $true
    }
    else {
        Write-Error-Custom "Failed to create service account"
        return $false
    }
}

# Grant roles to service account
function Grant-ServiceAccountRoles {
    param([string]$ProjectId, [string]$ServiceAccountName)
    
    $email = "$ServiceAccountName@$ProjectId.iam.gserviceaccount.com"
    $roles = @(
        "roles/run.deployer",
        "roles/artifactregistry.writer",
        "roles/logging.logWriter"
    )
    
    Write-Info "Granting roles to service account..."
    foreach ($role in $roles) {
        gcloud projects add-iam-policy-binding $ProjectId `
            --member="serviceAccount:$email" `
            --role="$role" `
            --quiet 2>$null
    }
    Write-Success "Roles granted successfully"
}

# Build and push Docker image
function Invoke-DockerBuild {
    param([string]$ProjectId, [string]$Region, [string]$RepoName, [string]$AppName)
    
    Write-Info "Building Docker image..."
    
    # Get current short SHA
    $shortSha = & git rev-parse --short HEAD 2>$null
    if ($null -eq $shortSha) {
        $shortSha = "latest"
    }
    
    $imageUri = "$Region-docker.pkg.dev/$ProjectId/$RepoName/${AppName}:$shortSha"
    
    # Build the image
    docker build -t $imageUri -t "$Region-docker.pkg.dev/$ProjectId/$RepoName/${AppName}:latest" .
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Docker image built successfully: $imageUri"
        return $imageUri
    }
    else {
        Write-Error-Custom "Failed to build Docker image"
        return $null
    }
}

# Push Docker image to Artifact Registry
function Push-DockerImage {
    param([string]$ImageUri)
    
    Write-Info "Pushing Docker image to Artifact Registry..."
    
    docker push $ImageUri
    docker push ($ImageUri -replace ":[^:]+$", ":latest")
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Docker image pushed successfully"
        return $true
    }
    else {
        Write-Error-Custom "Failed to push Docker image"
        return $false
    }
}

# Deploy to Cloud Run
function Invoke-CloudRunDeploy {
    param(
        [string]$ProjectId,
        [string]$Region,
        [string]$ServiceName,
        [string]$ImageUri,
        [string]$ServiceAccountEmail
    )
    
    Write-Info "Deploying to Cloud Run..."
    
    gcloud run deploy $ServiceName `
        --image=$ImageUri `
        --region=$Region `
        --platform=managed `
        --cpu=1 `
        --memory=512Mi `
        --concurrency=80 `
        --timeout=300 `
        --min-instances=0 `
        --max-instances=10 `
        --service-account=$ServiceAccountEmail `
        --session-affinity `
        --allow-unauthenticated `
        --execution-environment=gen2 `
        --set-env-vars=NODE_ENV=production `
        --project=$ProjectId `
        --quiet
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Cloud Run deployment successful"
        return $true
    }
    else {
        Write-Error-Custom "Failed to deploy to Cloud Run"
        return $false
    }
}

# Get Cloud Run service URL
function Get-ServiceUrl {
    param([string]$ProjectId, [string]$Region, [string]$ServiceName)
    
    Write-Info "Retrieving service URL..."
    $url = gcloud run services describe $ServiceName `
        --region=$Region `
        --project=$ProjectId `
        --format="value(status.url)" 2>$null
    
    if ($url) {
        Write-Success "Service URL: $url"
        return $url
    }
    else {
        Write-Warning-Custom "Could not retrieve service URL"
        return $null
    }
}

# Main deployment flow
function Invoke-Deployment {
    param(
        [string]$ProjectId,
        [string]$Region,
        [string]$ServiceName
    )
    
    Write-Host "`n=====================================" -ForegroundColor Magenta
    Write-Host "  RCR App - GCP Deployment Script" -ForegroundColor Magenta
    Write-Host "=====================================" -ForegroundColor Magenta
    
    # Check prerequisites
    if (-not (Test-GcloudInstalled)) {
        Write-Error-Custom "gcloud CLI is not installed. Please install it first."
        exit 1
    }
    
    # Get or set project ID
    if (-not $ProjectId) {
        $ProjectId = Get-CurrentProject
        if (-not $ProjectId) {
            Write-Error-Custom "No project ID specified and no default project set"
            Write-Info "Please run: gcloud config set project YOUR_PROJECT_ID"
            exit 1
        }
    }
    
    if (-not (Set-GcpProject -ProjectId $ProjectId)) {
        exit 1
    }
    
    $repoName = "rcr-app-repo"
    $serviceAccountName = "rcr-app-service"
    
    # Check/Create Artifact Registry
    if (-not (Test-ArtifactRegistry -ProjectId $ProjectId -Region $Region -RepoName $repoName)) {
        if (-not (New-ArtifactRegistry -ProjectId $ProjectId -Region $Region -RepoName $repoName)) {
            exit 1
        }
    }
    
    # Check/Create Service Account
    if (-not (Test-ServiceAccount -ProjectId $ProjectId -ServiceAccountName $serviceAccountName)) {
        if (-not (New-ServiceAccount -ProjectId $ProjectId -ServiceAccountName $serviceAccountName -DisplayName "RCR App Service Account")) {
            exit 1
        }
    }
    
    # Build and push Docker image
    $imageUri = Invoke-DockerBuild -ProjectId $ProjectId -Region $Region -RepoName $repoName -AppName "rcr-app"
    if (-not $imageUri) {
        exit 1
    }
    
    if (-not (Push-DockerImage -ImageUri $imageUri)) {
        exit 1
    }
    
    # Deploy to Cloud Run
    $serviceAccountEmail = "$serviceAccountName@$ProjectId.iam.gserviceaccount.com"
    if (-not (Invoke-CloudRunDeploy -ProjectId $ProjectId -Region $Region -ServiceName $ServiceName -ImageUri $imageUri -ServiceAccountEmail $serviceAccountEmail)) {
        exit 1
    }
    
    # Get and display service URL
    $url = Get-ServiceUrl -ProjectId $ProjectId -Region $Region -ServiceName $ServiceName
    
    Write-Host "`n=====================================" -ForegroundColor Magenta
    Write-Success "Deployment completed successfully!"
    Write-Host "=====================================" -ForegroundColor Magenta
    Write-Host ""
}

# Show help
function Show-Help {
    Write-Host @"
RCR App - GCP Deployment Script

Usage:
    .\deploy-to-gcp.ps1 -ProjectId <YOUR_PROJECT_ID> [-Region <REGION>] [-ServiceName <SERVICE_NAME>]

Parameters:
    -ProjectId      : Your Google Cloud Project ID (required)
    -Region         : GCP region (default: asia-southeast1)
    -ServiceName    : Cloud Run service name (default: rcr-app)
    -Action         : Action to perform (default: deploy)
    -Help           : Show this help message

Example:
    .\deploy-to-gcp.ps1 -ProjectId my-project-id

Prerequisites:
    1. Google Cloud SDK installed (gcloud CLI)
    2. Docker installed and running
    3. Authenticated with: gcloud auth login
    4. Project set: gcloud config set project YOUR_PROJECT_ID

"@
}

# Entry point
if ($Help -or $Action -eq "help") {
    Show-Help
}
elseif ($Action -eq "deploy") {
    Invoke-Deployment -ProjectId $ProjectId -Region $Region -ServiceName $ServiceName
}
else {
    Write-Error-Custom "Unknown action: $Action"
    Show-Help
}
