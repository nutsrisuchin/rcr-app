#!/bin/bash

# RCR App - GCP Deployment Script (Bash)
# This script automates the deployment process to Google Cloud Run
# Prerequisites: gcloud CLI installed and authenticated

set -e  # Exit on error

# Default values
PROJECT_ID=""
REGION="asia-southeast1"
SERVICE_NAME="rcr-app"
ACTION="deploy"
REPO_NAME="rcr-app-repo"
SERVICE_ACCOUNT_NAME="rcr-app-service"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Functions
info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if gcloud is installed
check_gcloud() {
    if ! command -v gcloud &> /dev/null; then
        error "gcloud CLI is not installed. Please install it first."
        exit 1
    fi
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install it first."
        exit 1
    fi
}

# Get current project
get_current_project() {
    gcloud config get-value project 2>/dev/null
}

# Set project
set_gcp_project() {
    info "Setting GCP project to: $1"
    gcloud config set project "$1"
    success "Project set successfully"
}

# Check if artifact registry exists
test_artifact_registry() {
    local repo_exists=$(gcloud artifacts repositories list \
        --project="$PROJECT_ID" \
        --format="value(name)" 2>/dev/null | grep -c "^${REPO_NAME}$" || echo 0)
    
    if [ "$repo_exists" -eq 1 ]; then
        success "Repository '$REPO_NAME' found"
        return 0
    else
        return 1
    fi
}

# Create artifact registry
create_artifact_registry() {
    info "Creating Artifact Registry repository: $REPO_NAME"
    gcloud artifacts repositories create "$REPO_NAME" \
        --repository-format=docker \
        --location="$REGION" \
        --project="$PROJECT_ID"
    success "Artifact Registry repository created"
}

# Check if service account exists
test_service_account() {
    local account_exists=$(gcloud iam service-accounts list \
        --project="$PROJECT_ID" \
        --format="value(email)" 2>/dev/null | grep -c "^${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}" || echo 0)
    
    if [ "$account_exists" -eq 1 ]; then
        success "Service account found: ${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
        return 0
    else
        return 1
    fi
}

# Create service account
create_service_account() {
    info "Creating service account: $SERVICE_ACCOUNT_NAME"
    gcloud iam service-accounts create "$SERVICE_ACCOUNT_NAME" \
        --display-name="RCR App Service Account" \
        --project="$PROJECT_ID"
    success "Service account created"
    
    # Grant roles
    grant_service_account_roles
}

# Grant roles to service account
grant_service_account_roles() {
    local email="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
    info "Granting roles to service account..."
    
    local roles=(
        "roles/run.deployer"
        "roles/artifactregistry.writer"
        "roles/logging.logWriter"
    )
    
    for role in "${roles[@]}"; do
        gcloud projects add-iam-policy-binding "$PROJECT_ID" \
            --member="serviceAccount:$email" \
            --role="$role" \
            --quiet 2>/dev/null || true
    done
    success "Roles granted successfully"
}

# Build Docker image
build_docker_image() {
    info "Building Docker image..."
    
    # Get git short SHA or use 'latest'
    local short_sha=$(git rev-parse --short HEAD 2>/dev/null || echo "latest")
    local image_uri="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/rcr-app:${short_sha}"
    
    docker build \
        -t "$image_uri" \
        -t "${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/rcr-app:latest" \
        .
    
    success "Docker image built successfully: $image_uri"
    echo "$image_uri"
}

# Push Docker image
push_docker_image() {
    local image_uri=$1
    info "Pushing Docker image to Artifact Registry..."
    
    docker push "$image_uri"
    docker push "${image_uri%:*}:latest"
    
    success "Docker image pushed successfully"
}

# Deploy to Cloud Run
deploy_cloud_run() {
    local image_uri=$1
    local service_account_email="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
    
    info "Deploying to Cloud Run..."
    
    gcloud run deploy "$SERVICE_NAME" \
        --image="$image_uri" \
        --region="$REGION" \
        --platform=managed \
        --cpu=1 \
        --memory=512Mi \
        --concurrency=80 \
        --timeout=300 \
        --min-instances=0 \
        --max-instances=10 \
        --service-account="$service_account_email" \
        --session-affinity \
        --allow-unauthenticated \
        --execution-environment=gen2 \
        --set-env-vars=NODE_ENV=production \
        --project="$PROJECT_ID" \
        --quiet
    
    success "Cloud Run deployment successful"
}

# Get service URL
get_service_url() {
    info "Retrieving service URL..."
    local url=$(gcloud run services describe "$SERVICE_NAME" \
        --region="$REGION" \
        --project="$PROJECT_ID" \
        --format="value(status.url)" 2>/dev/null)
    
    if [ -n "$url" ]; then
        success "Service URL: $url"
    else
        warning "Could not retrieve service URL"
    fi
}

# Show help
show_help() {
    cat << EOF
RCR App - GCP Deployment Script

Usage:
    ./deploy-to-gcp.sh [OPTIONS]

Options:
    -p, --project-id     Your Google Cloud Project ID (required)
    -r, --region         GCP region (default: asia-southeast1)
    -s, --service-name   Cloud Run service name (default: rcr-app)
    -a, --action         Action to perform (default: deploy)
    -h, --help           Show this help message

Example:
    ./deploy-to-gcp.sh -p my-project-id

Prerequisites:
    1. Google Cloud SDK installed (gcloud CLI)
    2. Docker installed and running
    3. Authenticated with: gcloud auth login
    4. Project set: gcloud config set project YOUR_PROJECT_ID

EOF
}

# Parse arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -p|--project-id)
                PROJECT_ID="$2"
                shift 2
                ;;
            -r|--region)
                REGION="$2"
                shift 2
                ;;
            -s|--service-name)
                SERVICE_NAME="$2"
                shift 2
                ;;
            -a|--action)
                ACTION="$2"
                shift 2
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# Main deployment
main() {
    echo ""
    echo "====================================="
    echo "  RCR App - GCP Deployment Script"
    echo "====================================="
    echo ""
    
    # Check prerequisites
    check_gcloud
    check_docker
    
    # Get or set project ID
    if [ -z "$PROJECT_ID" ]; then
        PROJECT_ID=$(get_current_project)
        if [ -z "$PROJECT_ID" ]; then
            error "No project ID specified and no default project set"
            info "Please run: gcloud config set project YOUR_PROJECT_ID"
            exit 1
        fi
    fi
    
    set_gcp_project "$PROJECT_ID"
    
    # Check/Create Artifact Registry
    if ! test_artifact_registry; then
        create_artifact_registry
    fi
    
    # Check/Create Service Account
    if ! test_service_account; then
        create_service_account
    fi
    
    # Build and push Docker image
    local image_uri=$(build_docker_image)
    push_docker_image "$image_uri"
    
    # Deploy to Cloud Run
    deploy_cloud_run "$image_uri"
    
    # Get service URL
    get_service_url
    
    echo ""
    echo "====================================="
    success "Deployment completed successfully!"
    echo "====================================="
    echo ""
}

# Entry point
if [ "$ACTION" = "help" ]; then
    show_help
elif [ "$ACTION" = "deploy" ]; then
    parse_args "$@"
    main
else
    error "Unknown action: $ACTION"
    show_help
    exit 1
fi
