# RCR App - GCP Deployment Setup Guide

This guide walks you through deploying the RCR application to Google Cloud Platform (GCP) using Cloud Run.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [GCP Project Setup](#gcp-project-setup)
3. [Local Setup](#local-setup)
4. [Deployment Methods](#deployment-methods)
5. [Post-Deployment](#post-deployment)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

1. **Google Cloud Account** - [Create one here](https://cloud.google.com/)
2. **Google Cloud SDK (gcloud CLI)** - [Install](https://cloud.google.com/sdk/docs/install)
3. **Docker** - [Install Docker Desktop](https://www.docker.com/products/docker-desktop)
4. **Git** (recommended for version control)
5. **Active GCP Project** with billing enabled

### Verify Installations

```bash
# Check gcloud
gcloud --version

# Check Docker
docker --version

# Check Git (optional)
git --version
```

---

## GCP Project Setup

### Step 1: Create a Google Cloud Project

```bash
# List existing projects
gcloud projects list

# Create a new project (replace YOUR_PROJECT_ID with your choice)
gcloud projects create YOUR_PROJECT_ID --name="RCR App"

# Set the project as default
gcloud config set project YOUR_PROJECT_ID
```

### Step 2: Enable Required APIs

Enable the necessary Google Cloud APIs:

```bash
gcloud services enable \
  compute.googleapis.com \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  containerregistry.googleapis.com
```

### Step 3: Create Artifact Registry Repository

```bash
# Create a Docker repository in Artifact Registry
gcloud artifacts repositories create rcr-app-repo \
  --repository-format=docker \
  --location=asia-southeast1 \
  --project=YOUR_PROJECT_ID
```

### Step 4: Create a Service Account

```bash
# Create service account
gcloud iam service-accounts create rcr-app-service \
  --display-name="RCR App Service Account" \
  --project=YOUR_PROJECT_ID

# Grant necessary roles
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:rcr-app-service@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.deployer"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:rcr-app-service@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:rcr-app-service@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/logging.logWriter"
```

### Step 5: Authenticate Docker with Artifact Registry

```bash
# Configure Docker authentication
gcloud auth configure-docker asia-southeast1-docker.pkg.dev

# Verify authentication
docker ps  # This should work without errors
```

---

## Local Setup

### Step 1: Clone/Navigate to Project

```bash
cd /path/to/rcr-app
```

### Step 2: Update Configuration Files

The following files are already in your project:
- `cloudbuild.yaml` - GCP Cloud Build configuration
- `Dockerfile` - Docker image definition
- `.dockerignore` - Files to exclude from Docker image
- `.env.example` - Environment variables template

### Step 3: Review Dockerfile

Check [Dockerfile](rcr-app/Dockerfile) to ensure it matches your application structure:

```dockerfile
# Multi-stage build: Frontend (React) + Backend (Node.js Express)
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install
COPY server/ .
COPY --from=frontend-build /app/dist /app/dist
ENV PORT=8080
EXPOSE 8080
CMD ["node", "index.js"]
```

### Step 4: Test Build Locally (Optional)

```bash
# Build the image locally
docker build -t rcr-app:test .

# Run the container locally
docker run -p 8080:8080 rcr-app:test

# Test the application
# Visit: http://localhost:8080
```

---

## Deployment Methods

### Method 1: Using PowerShell Script (Windows)

#### Prerequisites
- PowerShell 5.1 or higher
- All GCP setup completed

#### Steps

1. **Navigate to project root:**
   ```powershell
   cd C:\path\to\RCR
   ```

2. **Make script executable:**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

3. **Run deployment script:**
   ```powershell
   .\deploy-to-gcp.ps1 -ProjectId YOUR_PROJECT_ID
   ```

4. **Optional parameters:**
   ```powershell
   .\deploy-to-gcp.ps1 `
     -ProjectId YOUR_PROJECT_ID `
     -Region asia-southeast1 `
     -ServiceName rcr-app
   ```

### Method 2: Using Bash Script (macOS/Linux)

#### Prerequisites
- Bash shell
- All GCP setup completed

#### Steps

1. **Navigate to project root:**
   ```bash
   cd /path/to/RCR
   ```

2. **Make script executable:**
   ```bash
   chmod +x deploy-to-gcp.sh
   ```

3. **Run deployment script:**
   ```bash
   ./deploy-to-gcp.sh -p YOUR_PROJECT_ID
   ```

4. **Optional parameters:**
   ```bash
   ./deploy-to-gcp.sh \
     -p YOUR_PROJECT_ID \
     -r asia-southeast1 \
     -s rcr-app
   ```

### Method 3: Using Cloud Build (Manual)

This deploys directly from your repository:

1. **Push code to Cloud Source Repository:**
   ```bash
   git push google main
   ```

2. **Trigger Cloud Build manually:**
   ```bash
   gcloud builds submit --config=cloudbuild.yaml
   ```

3. **Monitor the build:**
   ```bash
   gcloud builds log $(gcloud builds list --limit=1 --format='value(id)')
   ```

---

## Post-Deployment

### Verify Deployment

```bash
# Get the service URL
gcloud run services describe rcr-app \
  --region=asia-southeast1 \
  --format="value(status.url)"

# Get service details
gcloud run services describe rcr-app \
  --region=asia-southeast1
```

### View Logs

```bash
# Real-time logs
gcloud run services logs read rcr-app \
  --region=asia-southeast1 \
  --limit=50 \
  --follow

# Specific log stream
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=rcr-app" \
  --limit=50 \
  --format=json
```

### Monitor Performance

Access Cloud Run Console:
- Navigate to [Cloud Run Console](https://console.cloud.google.com/run)
- Select your `rcr-app` service
- View metrics and logs

### Test the Deployed Application

```bash
# Get service URL
SERVICE_URL=$(gcloud run services describe rcr-app \
  --region=asia-southeast1 \
  --format="value(status.url)")

# Test the application
curl -I $SERVICE_URL
```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. **"Project not set" Error**
```bash
# Solution: Set your project ID
gcloud config set project YOUR_PROJECT_ID
```

#### 2. **"Permission denied" on Docker Push**
```bash
# Solution: Re-authenticate Docker
gcloud auth configure-docker asia-southeast1-docker.pkg.dev
```

#### 3. **"Artifact Registry not found"**
```bash
# Solution: Create the repository
gcloud artifacts repositories create rcr-app-repo \
  --repository-format=docker \
  --location=asia-southeast1
```

#### 4. **"Service Account not found"**
```bash
# Solution: Create the service account
gcloud iam service-accounts create rcr-app-service \
  --display-name="RCR App Service Account"
```

#### 5. **"Build fails with memory issues"**
The deployment script allocates 512Mi by default. To increase:
- Edit the deployment script or cloudbuild.yaml
- Change `_MEMORY: '512Mi'` to `_MEMORY: '1Gi'` or higher

#### 6. **"Application times out"**
Check that your backend server is listening on port 8080:
```bash
# In server/index.js, ensure:
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

#### 7. **"Build artifacts not accessible"**
Verify .dockerignore includes large files:
```
node_modules
dist
.git
.env
.DS_Store
```

### View All Logs and Monitoring

```bash
# List all Cloud Run deployments
gcloud run services list

# View detailed service information
gcloud run services describe rcr-app --region=asia-southeast1

# Monitor recent builds
gcloud builds list --limit=10

# Stream logs in real time
gcloud run services logs read rcr-app --region=asia-southeast1 --follow
```

---

## Cost Optimization

### Recommendations

1. **Auto-scaling:**
   - Min instances: 0 (scale down to zero when not in use)
   - Max instances: 10 (prevent unexpected costs)

2. **Resource Allocation:**
   - CPU: 1 (sufficient for most workloads)
   - Memory: 512Mi (increase if needed)

3. **Concurrency:**
   - Set to 80 to handle multiple requests efficiently

4. **Clean Up Unused Resources:**
   ```bash
   # Delete a service
   gcloud run services delete rcr-app --region=asia-southeast1
   
   # Delete Artifact Registry images
   gcloud artifacts docker images delete asia-southeast1-docker.pkg.dev/YOUR_PROJECT_ID/rcr-app-repo/rcr-app
   ```

---

## Next Steps

1. **Set up CI/CD Pipeline:**
   - Connect GitHub to Cloud Build
   - Deploy automatically on push

2. **Configure Custom Domain:**
   ```bash
   gcloud run domain-mappings create \
     --service=rcr-app \
     --domain=yourdomain.com \
     --region=asia-southeast1
   ```

3. **Set Up Cloud SQL (if needed):**
   - Create Cloud SQL instance
   - Connect from Cloud Run

4. **Implement Environment-Specific Configs:**
   - Different settings for development/production
   - Use Cloud Run secrets for sensitive data

---

## Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Artifact Registry Guide](https://cloud.google.com/artifact-registry/docs)
- [Cloud Build Documentation](https://cloud.google.com/build/docs)
- [Docker Documentation](https://docs.docker.com/)

---

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review GCP documentation
3. Check Cloud Run logs via the console or CLI
4. Contact your GCP support team

---

**Last Updated:** June 2026
**Version:** 1.0
