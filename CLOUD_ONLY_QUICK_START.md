# ☁️ Cloud-Only Deployment - Quick Setup Guide

For users with company restrictions preventing local deployment.

## 🚀 Choose Your Method

### 1️⃣ **Cloud Shell** (Easiest - 5 minutes)
No setup, everything in browser. Best for quick deployments.

[👉 Go to Cloud Shell Method](CLOUD_ONLY_DEPLOYMENT.md#-method-1-google-cloud-shell-easiest---no-setup-required)

```bash
# In Cloud Shell, just paste:
git clone https://github.com/YOUR_USERNAME/rcr-app.git
cd rcr-app
gcloud builds submit --config=cloudbuild.yaml
```

---

### 2️⃣ **GitHub Actions** (Best - Automated)
Automatic deployment on every git push. No manual steps needed.

[👉 Go to GitHub Actions Setup](CLOUD_ONLY_DEPLOYMENT.md#-method-2-github-actions-automatic-deployment-on-git-push)

After setup, just do:
```bash
git push origin main
# App automatically deploys! ✨
```

---

### 3️⃣ **Cloud Build Trigger** (Flexible)
Deploy from Cloud Console with one click, or auto-deploy on push.

[👉 Go to Cloud Build Setup](CLOUD_ONLY_DEPLOYMENT.md#☁️-method-3-google-cloud-build-trigger-manual-from-console)

---

## ⚡ Quick Comparison

| Method | Setup | Deploy | Automatic | Best For |
|--------|-------|--------|-----------|----------|
| **Cloud Shell** | ⚡ 5 min | 10 min | ❌ Manual | Testing, quick deployments |
| **GitHub Actions** | ⚡⚡ 30 min | 10 min | ✅ On push | Production, continuous deployment |
| **Cloud Build** | ⚡⚡ 10 min | 10 min | ✅ Optional | Flexible, enterprise |

---

## 📋 Step-by-Step for GitHub Actions (Recommended)

### Step 1: Create Workflow File
In your GitHub repository, create folder structure:
```
.github/workflows/deploy-to-gcp.yml
```

The file is already prepared. Copy it to your repo.

### Step 2: Set Up GCP (Run in Cloud Shell)

```bash
# Copy-paste the commands from:
# CLOUD_ONLY_DEPLOYMENT.md → Method 2 → Step 3

# This creates the necessary GCP resources
```

### Step 3: Add GitHub Secrets
- Go to GitHub → Repository Settings → Secrets and variables → Actions
- Add:
  - `GCP_PROJECT_ID` = your project ID
  - `WIF_PROVIDER` = value from Cloud Shell output
  - `WIF_SERVICE_ACCOUNT` = value from Cloud Shell output

### Step 4: Deploy!
```bash
git push origin main
```

**That's it!** GitHub automatically deploys your app. 🎉

---

## ✅ Verification

### Check GitHub Actions (After First Deploy)
1. Go to GitHub repository
2. Click "Actions" tab
3. See your workflow running
4. Watch real-time logs

### Check Deployment in GCP
```bash
# In Cloud Shell, verify your app is running:
gcloud run services describe rcr-app \
  --region=asia-southeast1 \
  --format="value(status.url)"
```

---

## 🆘 Troubleshooting

### "Workflow fails to deploy"
Check the Actions tab → Click failed workflow → View logs

### "Cloud Shell command fails"
- Verify project ID: `gcloud config get-value project`
- Check APIs enabled: `gcloud services list`
- View full error: Look at full error message in Cloud Shell

### "GitHub Secrets not working"
- Verify secret names match exactly
- Secret values shouldn't have quotes
- Re-run workflow after adding secrets

---

## 📚 Full Documentation

For complete details and all methods:
👉 [CLOUD_ONLY_DEPLOYMENT.md](CLOUD_ONLY_DEPLOYMENT.md)

---

## 🎯 My Recommendation

**Use GitHub Actions** because:
- ✅ Fully automated (set it once, then forget it)
- ✅ Deploy with every git push
- ✅ No manual steps needed
- ✅ Clear logs and status
- ✅ Enterprise-grade security

---

## 🚀 Next Steps

1. **Choose GitHub Actions** (recommended)
2. **Create `.github/workflows/deploy-to-gcp.yml`** in your repo
3. **Run setup commands in Cloud Shell** (10 minutes, one-time)
4. **Add GitHub Secrets** (2 minutes)
5. **Push code to GitHub** → Automatic deployment! 🎉

---

**No local deployment needed anymore!** ☁️

Last Updated: June 2026
