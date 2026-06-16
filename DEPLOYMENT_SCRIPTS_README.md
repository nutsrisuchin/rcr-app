# RCR App - Deployment Scripts README

This directory contains automated deployment scripts for deploying the RCR App to Google Cloud Platform (GCP).

## 📁 Files

- **`deploy-to-gcp.ps1`** - PowerShell script for Windows systems
- **`deploy-to-gcp.sh`** - Bash script for macOS/Linux systems
- **`rcr-app/cloudbuild.yaml`** - GCP Cloud Build configuration
- **`rcr-app/Dockerfile`** - Multi-stage Docker build file
- **`rcr-app/.dockerignore`** - Docker build exclusions
- **`GCP_DEPLOYMENT_SETUP.md`** - Comprehensive setup guide
- **`DEPLOYMENT_QUICKSTART.md`** - Quick reference guide

## 🚀 Quick Start

### Windows (PowerShell)
```powershell
.\deploy-to-gcp.ps1 -ProjectId YOUR_PROJECT_ID
```

### macOS/Linux (Bash)
```bash
chmod +x deploy-to-gcp.sh
./deploy-to-gcp.sh -p YOUR_PROJECT_ID
```

## 📋 Prerequisites

Before running deployment scripts, ensure:

1. **Google Cloud Account** with billing enabled
2. **gcloud CLI installed** - [Install](https://cloud.google.com/sdk/docs/install)
3. **Docker installed** - [Install Docker](https://www.docker.com/products/docker-desktop)
4. **Authenticated** - Run `gcloud auth login`

## ✅ What Each Script Does

Both scripts automate the following steps:

1. ✅ Verify GCP authentication and project setup
2. ✅ Create Artifact Registry repository (if needed)
3. ✅ Create service account with required permissions
4. ✅ Grant IAM roles to service account
5. ✅ Build Docker image from Dockerfile
6. ✅ Push image to Artifact Registry
7. ✅ Deploy to Cloud Run
8. ✅ Display service URL

## 🔧 Script Options

### PowerShell (`deploy-to-gcp.ps1`)

```powershell
# Basic usage
.\deploy-to-gcp.ps1 -ProjectId my-project

# With custom region
.\deploy-to-gcp.ps1 -ProjectId my-project -Region us-central1

# With custom service name
.\deploy-to-gcp.ps1 -ProjectId my-project -ServiceName my-rcr-app

# Show help
.\deploy-to-gcp.ps1 -Help
```

### Bash (`deploy-to-gcp.sh`)

```bash
# Basic usage
./deploy-to-gcp.sh -p my-project

# With custom region
./deploy-to-gcp.sh -p my-project -r us-central1

# With custom service name
./deploy-to-gcp.sh -p my-project -s my-rcr-app

# Show help
./deploy-to-gcp.sh -h
```

## 📊 Deployment Configuration

Default settings can be customized:

### In cloudbuild.yaml:
```yaml
_REGION: 'asia-southeast1'      # Cloud Run region
_CPU: '1'                       # CPU allocation (1 or 2)
_MEMORY: '512Mi'                # Memory allocation
_MIN_INSTANCES: '0'             # Minimum instances (scale to zero)
_MAX_INSTANCES: '10'            # Maximum instances (cost control)
_CONCURRENCY: '80'              # Concurrent requests per instance
_TIMEOUT: '300'                 # Request timeout in seconds
```

### In deploy scripts:
Edit these variables in the script:
```powershell
# PowerShell
$Region = "asia-southeast1"
$ServiceName = "rcr-app"

# Bash
REGION="asia-southeast1"
SERVICE_NAME="rcr-app"
```

## 🐛 Troubleshooting

### Issue: "gcloud CLI not found"
```bash
# Install gcloud CLI
# Windows: Download from https://cloud.google.com/sdk/docs/install
# macOS: brew install --cask google-cloud-sdk
# Linux: Follow https://cloud.google.com/sdk/docs/install
```

### Issue: "Not authenticated"
```bash
gcloud auth login
```

### Issue: "Project not set"
```bash
gcloud config set project YOUR_PROJECT_ID
```

### Issue: "Docker push fails"
```bash
gcloud auth configure-docker asia-southeast1-docker.pkg.dev
```

### Issue: "Permission denied on deployment"
Ensure service account has required roles:
```bash
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:rcr-app-service@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.deployer"
```

## 📈 Monitoring Deployment

### View logs in real-time
```bash
gcloud run services logs read rcr-app --region=asia-southeast1 --follow
```

### Get service details
```bash
gcloud run services describe rcr-app --region=asia-southeast1
```

### View build history
```bash
gcloud builds list --limit=10
```

### Access Cloud Run Console
Visit: https://console.cloud.google.com/run

## 🔒 Security Considerations

1. **Service Account**: Created with minimal required permissions
2. **Unauthenticated Access**: Enabled for public access (modify if needed)
3. **Environment Variables**: Store sensitive data in Cloud Secret Manager
4. **.env Files**: Never commit .env files to version control

## 💰 Cost Optimization

Current configuration optimizes for cost:
- Min instances: 0 (scales down when idle)
- Max instances: 10 (prevents runaway costs)
- Memory: 512Mi (sufficient for most workloads)

### Tips to reduce costs:
1. Use min-instances: 0 (already configured)
2. Monitor metrics in Cloud Run Console
3. Delete unused services: `gcloud run services delete SERVICE_NAME`
4. Set appropriate max-instances limit

## 📚 Additional Resources

- **Deployment Guide**: [GCP_DEPLOYMENT_SETUP.md](GCP_DEPLOYMENT_SETUP.md)
- **Quick Start**: [DEPLOYMENT_QUICKSTART.md](DEPLOYMENT_QUICKSTART.md)
- **Cloud Run Docs**: https://cloud.google.com/run/docs
- **gcloud Reference**: https://cloud.google.com/sdk/gcloud/reference

## 🎯 Next Steps

After successful deployment:

1. **Test your application**
   ```bash
   SERVICE_URL=$(gcloud run services describe rcr-app \
     --region=asia-southeast1 \
     --format="value(status.url)")
   curl $SERVICE_URL
   ```

2. **Set up CI/CD** (optional)
   - Connect GitHub to Cloud Build
   - Automatic deployment on push

3. **Configure custom domain** (optional)
   ```bash
   gcloud run domain-mappings create \
     --service=rcr-app \
     --domain=yourdomain.com
   ```

4. **Set up monitoring** (optional)
   - Create alerts for errors
   - Monitor response times

## 📝 Customization

To customize the deployment:

1. **Edit cloudbuild.yaml** for Cloud Build configuration
2. **Edit Dockerfile** for container setup
3. **Edit .dockerignore** for excluded files
4. **Update scripts** for different regions/settings

## ⚡ Performance Tips

1. Use appropriate CPU/memory settings
2. Implement caching strategies
3. Optimize Docker image size
4. Use concurrency wisely

---

**Version**: 1.0  
**Last Updated**: June 2026  

For issues or questions, refer to [GCP_DEPLOYMENT_SETUP.md](GCP_DEPLOYMENT_SETUP.md#troubleshooting)
