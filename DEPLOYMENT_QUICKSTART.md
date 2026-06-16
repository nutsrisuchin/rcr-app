# RCR App - GCP Deployment Quick Start

## 🚀 5-Minute Quick Start

### Step 1: Prepare GCP Account (One-time setup)
```bash
# Set your project ID
export PROJECT_ID="your-project-id"

# Authenticate
gcloud auth login

# Set default project
gcloud config set project $PROJECT_ID

# Enable APIs
gcloud services enable compute.googleapis.com run.googleapis.com artifactregistry.googleapis.com
```

### Step 2: Run Deployment Script

**Windows (PowerShell):**
```powershell
cd C:\path\to\RCR
.\deploy-to-gcp.ps1 -ProjectId YOUR_PROJECT_ID
```

**macOS/Linux (Bash):**
```bash
cd /path/to/RCR
chmod +x deploy-to-gcp.sh
./deploy-to-gcp.sh -p YOUR_PROJECT_ID
```

### Step 3: Get Your App URL
```bash
gcloud run services describe rcr-app \
  --region=asia-southeast1 \
  --format="value(status.url)"
```

That's it! 🎉

---

## ✅ Pre-Deployment Checklist

- [ ] Google Cloud Account created
- [ ] Billing enabled on GCP
- [ ] gcloud CLI installed (`gcloud --version`)
- [ ] Docker installed (`docker --version`)
- [ ] Authenticated with GCP (`gcloud auth login`)
- [ ] Project ID determined
- [ ] `.env.example` reviewed and .env prepared (if needed)
- [ ] Dockerfile reviewed
- [ ] Backend server listens on PORT 8080

---

## 📋 Deployment Configuration

Default settings (customize as needed):

| Setting | Value | Notes |
|---------|-------|-------|
| Region | asia-southeast1 | Change in script if needed |
| Service Name | rcr-app | Cloud Run service name |
| CPU | 1 | Suitable for most workloads |
| Memory | 512Mi | Increase if needed |
| Min Instances | 0 | Scales to zero when idle |
| Max Instances | 10 | Prevents runaway costs |
| Concurrency | 80 | Concurrent requests per instance |

---

## 🔧 Customizing the Deployment

### Change Region
Edit the script and change:
```
_REGION: 'asia-southeast1'  → _REGION: 'us-central1'
```

### Increase Resources
Edit cloudbuild.yaml:
```yaml
_CPU: '2'            # Increase CPU
_MEMORY: '1Gi'       # Increase memory to 1GB
_MAX_INSTANCES: '20' # Allow more concurrent instances
```

---

## 📊 View Deployment Status

```bash
# Describe the service
gcloud run services describe rcr-app --region=asia-southeast1

# View real-time logs
gcloud run services logs read rcr-app --region=asia-southeast1 --follow

# View metrics
gcloud run services logs read rcr-app --region=asia-southeast1 --limit=100

# List all your services
gcloud run services list
```

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Project not set | `gcloud config set project PROJECT_ID` |
| Docker push fails | `gcloud auth configure-docker asia-southeast1-docker.pkg.dev` |
| Service not found | Check service created: `gcloud run services list` |
| Build fails | Check logs: `gcloud builds log $(gcloud builds list --limit=1 --format='value(id)')` |
| Timeout errors | Increase timeout in script or cloudbuild.yaml |

---

## 📚 Full Documentation

See [GCP_DEPLOYMENT_SETUP.md](GCP_DEPLOYMENT_SETUP.md) for:
- Detailed setup instructions
- Cloud Build integration
- Cost optimization tips
- Monitoring and logging
- Custom domains
- CI/CD pipeline setup

---

## 💡 Key Files

- **[deploy-to-gcp.ps1](deploy-to-gcp.ps1)** - Windows deployment script
- **[deploy-to-gcp.sh](deploy-to-gcp.sh)** - macOS/Linux deployment script
- **[rcr-app/cloudbuild.yaml](rcr-app/cloudbuild.yaml)** - Cloud Build configuration
- **[rcr-app/Dockerfile](rcr-app/Dockerfile)** - Docker image definition
- **[rcr-app/.env.example](rcr-app/.env.example)** - Environment variables template

---

## 🎯 What the Scripts Do Automatically

✅ Check GCP prerequisites  
✅ Create Artifact Registry (if needed)  
✅ Create service account (if needed)  
✅ Grant necessary permissions  
✅ Build Docker image  
✅ Push to Artifact Registry  
✅ Deploy to Cloud Run  
✅ Display service URL  

---

## 🔐 Security Notes

1. **Service Account:** Created with minimal required permissions
2. **Unauthenticated Access:** Enabled by default (change with `--no-allow-unauthenticated`)
3. **Environment Variables:** Use .env for sensitive data (not in image)
4. **Secrets:** For sensitive data, use Cloud Secret Manager

---

## 📞 Support & Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Troubleshooting Guide](GCP_DEPLOYMENT_SETUP.md#troubleshooting)
- [gcloud CLI Reference](https://cloud.google.com/sdk/gcloud/reference)

---

**Happy Deploying! 🚀**
