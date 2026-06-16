#test

# 🚀 RCR App GCP Deployment - START HERE

## ⚡ 60-Second Quick Start

```powershell
# 1. Navigate to your project
cd C:\Users\26005064\OneDrive - PTT Global Chemical Public Company Limited\DATA\Digital_IT\Code - Antigravity\RCR

# 2. Deploy (replace with your GCP project ID)
.\deploy-to-gcp.ps1 -ProjectId my-gcp-project-id

# That's it! 🎉
```

**macOS/Linux?** Use instead:
```bash
chmod +x deploy-to-gcp.sh
./deploy-to-gcp.sh -p my-gcp-project-id
```

---

## ✅ Prerequisites Checklist

Before deploying, you need:

- [ ] **GCP Account** - [Create here](https://cloud.google.com)
- [ ] **gcloud CLI** - [Install](https://cloud.google.com/sdk/docs/install)
- [ ] **Docker** - [Install Docker Desktop](https://www.docker.com/products/docker-desktop)
- [ ] **Logged in to GCP** - Run `gcloud auth login`
- [ ] **Project ID** - Run `gcloud config set project YOUR_PROJECT_ID`

**Check your setup:**
```bash
gcloud --version     # Should show gcloud CLI version
docker --version    # Should show Docker version
gcloud auth list    # Should show you're logged in
```

---

## 📁 What's Included

| File | Purpose | Status |
|------|---------|--------|
| `deploy-to-gcp.ps1` | Windows deployment script | ✅ Ready |
| `deploy-to-gcp.sh` | macOS/Linux script | ✅ Ready |
| `rcr-app/cloudbuild.yaml` | GCP Cloud Build config | ✅ Ready |
| `rcr-app/Dockerfile` | Docker setup | ✅ Already exists |
| `rcr-app/.env.example` | Environment template | ✅ Ready |
| Documentation files | Guides & references | ✅ Ready |

---

## 🎯 4-Step Deployment Process

### Step 1: Authenticate with GCP
```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### Step 2: Run Deployment Script
```powershell
# Windows
.\deploy-to-gcp.ps1 -ProjectId YOUR_PROJECT_ID

# macOS/Linux  
./deploy-to-gcp.sh -p YOUR_PROJECT_ID
```

### Step 3: Wait for Completion
- Building Docker image... (2-3 min)
- Pushing to Artifact Registry... (1-2 min)
- Deploying to Cloud Run... (1-2 min)

### Step 4: Get Your URL
The script displays your live app URL:
```
✅ Service URL: https://rcr-app-xxxxx-asia-southeast1.a.run.app
```

---

## 📚 Documentation Files (In Order of Reading)

1. **🚀 You Are Here** - This file (quick start)
2. **📖 [DEPLOYMENT_QUICKSTART.md](DEPLOYMENT_QUICKSTART.md)** - 5-minute overview
3. **🔧 [DEPLOYMENT_CONFIG_REFERENCE.md](DEPLOYMENT_CONFIG_REFERENCE.md)** - Configuration options
4. **📋 [DEPLOYMENT_SCRIPTS_README.md](DEPLOYMENT_SCRIPTS_README.md)** - Scripts documentation
5. **🐛 [GCP_DEPLOYMENT_SETUP.md](GCP_DEPLOYMENT_SETUP.md)** - Complete setup guide with troubleshooting

---

## 🎨 Architecture Diagram

```
Your Code
    ↓
Docker Build (Local or Cloud)
    ↓
Artifact Registry (GCP)
    ↓
Cloud Run (GCP) ← Your App Lives Here!
    ↓
https://rcr-app-xxxxx.a.run.app
    ↓
Users Access Your App 🌐
```

---

## 💡 What the Script Does Automatically

✅ Verifies GCP setup  
✅ Creates Artifact Registry (Docker repo)  
✅ Creates service account (with right permissions)  
✅ Builds your Docker image  
✅ Pushes image to Artifact Registry  
✅ Deploys to Google Cloud Run  
✅ Shows you the live URL  

**Time to deploy:** 5-10 minutes first time, 3-5 minutes after

---

## 🔧 Common Customizations

### Use Different GCP Region

Edit `rcr-app/cloudbuild.yaml` line 1:
```yaml
_REGION: 'us-central1'  # Change from asia-southeast1
```

Available regions: `us-central1`, `europe-west1`, `asia-northeast1`, etc.

### Increase Resources

Edit `rcr-app/cloudbuild.yaml`:
```yaml
_CPU: '2'              # 2 cores instead of 1
_MEMORY: '1Gi'         # 1GB instead of 512MB
_MAX_INSTANCES: '20'   # 20 instead of 10
```

### Change Service Name

In deployment script:
```powershell
.\deploy-to-gcp.ps1 -ProjectId YOUR_PROJECT_ID -ServiceName my-app
```

---

## 🐛 Troubleshooting

### Error: "gcloud CLI not found"
→ [Install gcloud CLI](https://cloud.google.com/sdk/docs/install)

### Error: "Not authenticated"
→ Run: `gcloud auth login`

### Error: "Project not set"
→ Run: `gcloud config set project YOUR_PROJECT_ID`

### Error: "Docker push fails"
→ Run: `gcloud auth configure-docker asia-southeast1-docker.pkg.dev`

### Error: "Build fails"
→ Check logs: `gcloud builds log $(gcloud builds list --limit=1 --format='value(id)')`

**More help:** See [DEPLOYMENT_SCRIPTS_README.md](DEPLOYMENT_SCRIPTS_README.md#-troubleshooting)

---

## 📊 Deployment Checklist

Before you deploy, verify:

- [ ] GCP account created and project set
- [ ] gcloud CLI installed and authenticated
- [ ] Docker installed and running
- [ ] In correct directory: `/RCR`
- [ ] Have your GCP project ID ready
- [ ] Backend listens on PORT 8080
- [ ] All code committed to git (optional but recommended)

---

## 💰 Cost Estimate

| Item | Cost |
|------|------|
| Cloud Run (first 2M requests free) | $0.00002417/sec |
| Auto-scaling to zero when idle | ~50% savings |
| Storage (small, temporary) | ~$0.02-0.05/month |
| **Total Monthly** | **~$5-15 USD** |

*No charge when your app isn't being used!*

---

## 🎯 After Deployment

### Test Your App
```bash
# Get the URL
gcloud run services describe rcr-app \
  --region=asia-southeast1 \
  --format="value(status.url)"

# Open in browser or test with curl
curl https://rcr-app-xxxxx-asia-southeast1.a.run.app
```

### View Logs
```bash
gcloud run services logs read rcr-app \
  --region=asia-southeast1 \
  --follow
```

### Update Your App
1. Make code changes
2. Run deployment script again
3. New version is live in 3-5 minutes

### Roll Back to Previous Version
Cloud Run keeps previous revisions. In the Cloud Run console, select a previous revision.

---

## 🔐 Security Notes

✅ Service account created with minimal permissions  
✅ Docker image doesn't store secrets  
✅ Environment variables used for configuration  

⚠️ Remember:
- Don't commit `.env` files to git
- Use Cloud Secret Manager for sensitive data
- Review logs regularly for errors

---

## 📞 Quick Help

```bash
# Get help with any gcloud command
gcloud <COMMAND> --help

# List your Cloud Run services
gcloud run services list

# Describe your deployed service
gcloud run services describe rcr-app --region=asia-southeast1

# Delete your service (WARNING!)
gcloud run services delete rcr-app --region=asia-southeast1

# View all deployment history
gcloud builds list
```

---

## 🚀 Ready to Deploy?

**Choose your OS and run:**

**Windows (PowerShell):**
```powershell
cd 'C:\Users\26005064\OneDrive - PTT Global Chemical Public Company Limited\DATA\Digital_IT\Code - Antigravity\RCR'
.\deploy-to-gcp.ps1 -ProjectId YOUR_PROJECT_ID
```

**macOS/Linux (Terminal):**
```bash
cd /path/to/RCR
chmod +x deploy-to-gcp.sh
./deploy-to-gcp.sh -p YOUR_PROJECT_ID
```

---

## 📖 Need More Help?

| Topic | Document |
|-------|----------|
| Quick overview | [DEPLOYMENT_QUICKSTART.md](DEPLOYMENT_QUICKSTART.md) |
| How things work | [DEPLOYMENT_CONFIG_REFERENCE.md](DEPLOYMENT_CONFIG_REFERENCE.md) |
| Troubleshooting | [DEPLOYMENT_SCRIPTS_README.md](DEPLOYMENT_SCRIPTS_README.md) |
| Complete guide | [GCP_DEPLOYMENT_SETUP.md](GCP_DEPLOYMENT_SETUP.md) |
| Full summary | [DEPLOYMENT_SOLUTION_SUMMARY.md](DEPLOYMENT_SOLUTION_SUMMARY.md) |

---

## 🎉 You've Got This!

Everything is ready to go. The deployment script handles all the complex GCP setup automatically. You just need to:

1. ✅ Make sure you're authenticated (`gcloud auth login`)
2. ✅ Run the deployment script with your project ID
3. ✅ Wait 5-10 minutes
4. ✅ Your app is live! 🚀

**Questions?** Check the relevant documentation file above.

---

**Last Updated:** June 2026  
**Status:** ✅ Production Ready  
**Difficulty:** ⭐ Easy (script handles everything)

Good luck! 🚀
