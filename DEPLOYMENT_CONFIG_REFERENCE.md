# RCR App - Deployment Configuration Reference

This document explains all configuration options for GCP deployment.

## 🔧 Configuration Files

### 1. cloudbuild.yaml
Located in `rcr-app/cloudbuild.yaml` - GCP Cloud Build configuration

#### Substitutions (Customizable Variables)

| Variable | Default | Options | Description |
|----------|---------|---------|-------------|
| `_REGION` | asia-southeast1 | us-central1, europe-west1, etc. | GCP region for Cloud Run deployment |
| `_ARTIFACT_REGISTRY_REPO` | rcr-app-repo | any valid name | Artifact Registry repository name |
| `_SERVICE_NAME` | rcr-app | any valid name | Cloud Run service name |
| `_SERVICE_ACCOUNT_EMAIL` | rcr-app-service@{PROJECT_ID} | service@project.id | Service account for deployment |
| `_CPU` | 1 | 1, 2 | CPU cores allocated |
| `_MEMORY` | 512Mi | 256Mi, 512Mi, 1Gi, 2Gi, 4Gi | Memory allocated |
| `_PORT` | 8080 | any port | Application port (Container must listen on this) |
| `_CONCURRENCY` | 80 | 1-1000 | Max concurrent requests per instance |
| `_TIMEOUT` | 300 | 60-3600 | Request timeout in seconds |
| `_MIN_INSTANCES` | 0 | 0-5 | Minimum running instances (0 = scale to zero) |
| `_MAX_INSTANCES` | 10 | 1-1000 | Maximum running instances |

#### Build Steps Explained

1. **Step 1: Build Docker Image**
   - Builds the Docker image using the Dockerfile
   - Tags with both commit SHA and 'latest'

2. **Step 2: Push to Artifact Registry**
   - Pushes the image to your Artifact Registry repository
   - Waits for build step to complete

3. **Step 3: Deploy to Cloud Run**
   - Deploys the image to Cloud Run
   - Configures all resource settings
   - Sets environment variables
   - Waits for push step to complete

#### Build Options

```yaml
options:
  logging: CLOUD_LOGGING_ONLY  # Logs go to Cloud Logging (not Cloud Build)
  machineType: 'N1_HIGHCPU_8'  # Build machine type (more CPU for faster builds)
```

### 2. Dockerfile
Located in `rcr-app/Dockerfile` - Container image definition

#### Multi-Stage Build Explanation

**Stage 1: Frontend Build**
```dockerfile
FROM node:20-alpine AS frontend-build
# Installs dependencies
# Builds React app with Vite
# Creates optimized dist/ folder
```

**Stage 2: Backend Setup**
```dockerfile
FROM node:20-alpine
# Sets up Express backend
# Installs backend dependencies
# Copies built frontend
# Exposes port 8080
```

#### Key Environment Variables

| Variable | Value | Purpose |
|----------|-------|---------|
| `WORKDIR` | /app | Working directory inside container |
| `PORT` | 8080 | Listen port (Cloud Run requirement) |
| `NODE_ENV` | production | Set by deployment script |

### 3. .dockerignore
Located in `rcr-app/.dockerignore` - Excludes files from image

Current exclusions:
```
node_modules      # Don't include installed packages
dist              # Don't include build output
.git              # Don't include git history
.env              # Don't include environment files
```

**Tips:**
- Add large files here to reduce image size
- Never include sensitive data
- Examples: `.DS_Store`, `*.log`, `coverage/`

### 4. .env.example
Located in `rcr-app/.env.example` - Environment variable template

Use for:
- API configuration
- Database settings
- Application secrets (if needed)

**Important:** Never commit actual `.env` file to version control

## 🚀 Deployment Script Configuration

### PowerShell Script Options

```powershell
# Parameters
-ProjectId          # Your GCP Project ID (required)
-Region            # GCP region (default: asia-southeast1)
-ServiceName       # Cloud Run service name (default: rcr-app)
-Action            # deploy or help (default: deploy)
-Help              # Show help message
```

### Bash Script Options

```bash
# Options
-p, --project-id       # Your GCP Project ID (required)
-r, --region          # GCP region (default: asia-southeast1)
-s, --service-name    # Cloud Run service name (default: rcr-app)
-a, --action          # deploy or help (default: deploy)
-h, --help            # Show help message
```

### Hard-coded Settings in Scripts

These can be modified by editing the script files:

```bash
REPO_NAME="rcr-app-repo"              # Artifact Registry repo
SERVICE_ACCOUNT_NAME="rcr-app-service"  # Service account name
```

## 📊 Resource Configuration Guide

### CPU Allocation

| CPU | Use Case | Estimated Cost |
|-----|----------|-----------------|
| 1 | Small apps, low traffic | $0.00002417/second |
| 2 | Medium apps, moderate traffic | $0.00004834/second |

### Memory Allocation

| Memory | Recommended For |
|--------|-----------------|
| 256Mi | Static sites, minimal processing |
| 512Mi | React + Node.js apps (default) |
| 1Gi | Apps with heavy processing |
| 2Gi+ | Apps with intensive computations |

**Your Configuration:**
```yaml
CPU: 1 core
Memory: 512Mi
Total: ~$5-15/month with auto-scaling
```

### Concurrency Settings

| Level | Characteristics |
|-------|-----------------|
| 10 | Low concurrency, single-threaded tasks |
| 50 | Moderate concurrency (typical) |
| 80 | High concurrency (default for RCR) |
| 100+ | Very high concurrency |

**Calculation:**
```
Max concurrent requests = max_instances × concurrency
= 10 × 80 = 800 concurrent requests maximum
```

### Timeout Configuration

| Timeout | Use Case |
|---------|----------|
| 60s | API endpoints, quick operations |
| 300s | Image processing, file uploads |
| 3600s | Heavy computations (max) |

**Your Configuration:** 300 seconds (5 minutes)

## 🌍 Available Regions

| Region Code | Location | Tier |
|------------|----------|------|
| us-central1 | US | Standard |
| us-east1 | US East | Standard |
| europe-west1 | Belgium | Standard |
| asia-northeast1 | Tokyo | Standard |
| asia-southeast1 | Singapore | Standard ⭐ (default) |
| australia-southeast1 | Sydney | Standard |

**Note:** Some regions may have different pricing. Verify at [Cloud Run Pricing](https://cloud.google.com/run/pricing).

## 🔐 Service Account Permissions

Roles automatically granted to service account:

```bash
roles/run.deployer                # Deploy to Cloud Run
roles/artifactregistry.writer     # Push to Artifact Registry
roles/logging.logWriter           # Write logs
```

To add more roles manually:
```bash
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:rcr-app-service@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/DESIRED_ROLE"
```

## 📈 Monitoring & Logging Configuration

### Cloud Logging Settings

```yaml
logging: CLOUD_LOGGING_ONLY  # Send logs to Cloud Logging, not Cloud Build
```

### Available Log Levels

```bash
# View logs by level
ERROR    # Error messages
WARNING  # Warning messages
INFO     # Informational
DEBUG    # Debug information
```

### Access Logs

```bash
# Real-time logs
gcloud run services logs read rcr-app --region=asia-southeast1 --follow

# Historical logs
gcloud logging read "resource.type=cloud_run_revision" --limit=100
```

## 🔄 Build Machine Types

| Type | CPUs | Memory | Use Case |
|------|------|--------|----------|
| N1_STANDARD_1 | 1 | 3.75GB | Small builds |
| N1_HIGHCPU_8 | 8 | 7.2GB | Large/complex builds (default) |

**Current Setting:** `N1_HIGHCPU_8` (faster builds)

To change:
```yaml
options:
  machineType: 'N1_STANDARD_1'
```

## 🎛️ Advanced Configuration

### Environment Variables in Cloud Run

Set via deployment script:
```yaml
--set-env-vars=NODE_ENV=production
```

Add more via script or console:
```bash
gcloud run services update rcr-app \
  --region=asia-southeast1 \
  --set-env-vars=VAR1=value1,VAR2=value2
```

### Secrets Management

For sensitive data, use Cloud Secret Manager:
```bash
# Create a secret
echo -n "secret_value" | gcloud secrets create my-secret --data-file=-

# Grant access to service account
gcloud secrets add-iam-policy-binding my-secret \
  --member="serviceAccount:rcr-app-service@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Session Affinity

Currently enabled:
```yaml
--session-affinity  # Route requests from same session to same instance
```

Useful for:
- Session persistence
- In-memory caching
- Stateful operations

## 💾 Storage Configuration

### Persistent Storage Options

1. **Cloud Storage** (object storage)
2. **Cloud SQL** (database)
3. **Firestore** (NoSQL)
4. **Cloud Datastore** (NoSQL)

Connect from Cloud Run:
```bash
gcloud run services update rcr-app \
  --add-cloudsql-instances=INSTANCE_CONNECTION_NAME
```

## 🔗 DNS & Custom Domains

Current setup: Auto-generated URL
```
https://rcr-app-XXXXXX-REGION.a.run.app
```

To use custom domain:
```bash
gcloud run domain-mappings create \
  --service=rcr-app \
  --domain=yourdomain.com \
  --region=asia-southeast1
```

## 📋 Pre-Flight Checklist

Before deploying, verify:

- [ ] Backend listens on PORT 8080
- [ ] Dockerfile builds successfully locally
- [ ] .dockerignore excludes node_modules
- [ ] No hardcoded passwords in code
- [ ] Environment variables are externalized
- [ ] Vite build works: `npm run build`
- [ ] Backend dependencies in server/package.json

## 🐛 Common Configuration Issues

### Issue: Application crashes on startup
**Check:** Backend listening on PORT 8080
```javascript
// server/index.js
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
```

### Issue: Timeout errors
**Solution:** Increase timeout in cloudbuild.yaml
```yaml
_TIMEOUT: '600'  # Increase to 10 minutes
```

### Issue: Out of memory errors
**Solution:** Increase memory allocation
```yaml
_MEMORY: '1Gi'   # Increase to 1GB
```

### Issue: Build fails
**Check:** 
- Docker build works locally: `docker build .`
- All dependencies in package.json
- npm scripts defined

---

## 📚 Related Documentation

- [Cloud Run Configuration Guide](https://cloud.google.com/run/docs/configuring/services)
- [Artifact Registry Setup](https://cloud.google.com/artifact-registry/docs)
- [Cloud Build Configuration](https://cloud.google.com/build/docs/build-config-file-schema)
- [Dockerfile Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

**Last Updated:** June 2026  
**Version:** 1.0
