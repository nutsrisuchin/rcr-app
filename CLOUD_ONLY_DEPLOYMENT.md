# RCR App - Cloud-Only Deployment (No Local Requirements)

If company restrictions prevent you from running commands locally, you can deploy entirely from the cloud using these methods.

## 🌐 Method 1: Google Cloud Shell (Easiest - No Setup Required)

### What You Need
- Google Cloud account
- Browser access to [Cloud Console](https://console.cloud.google.com)
- Nothing else! ✨

### Step-by-Step

#### 1. Open Cloud Shell
- Go to [Google Cloud Console](https://console.cloud.google.com)
- Click the **>_** icon in the top-right (Cloud Shell)
- A terminal opens in your browser

#### 2. Clone Your Repository
```bash
# In Cloud Shell, clone your repo
git clone https://github.com/YOUR_USERNAME/rcr-app.git
cd rcr-app
```

#### 3. Enable Required APIs
```bash
gcloud services enable compute.googleapis.com run.googleapis.com \
  artifactregistry.googleapis.com cloudbuild.googleapis.com
```

#### 4. Create Artifact Registry
```bash
gcloud artifacts repositories create rcr-app-repo \
  --repository-format=docker \
  --location=asia-southeast1
```

#### 5. Create Service Account
```bash
# Create service account
gcloud iam service-accounts create rcr-app-service

# Grant roles
gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
  --member="serviceAccount:rcr-app-service@$(gcloud config get-value project).iam.gserviceaccount.com" \
  --role="roles/run.deployer"

gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
  --member="serviceAccount:rcr-app-service@$(gcloud config get-value project).iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"
```

#### 6. Run the Deployment
```bash
# In Cloud Shell, navigate to rcr-app directory
cd rcr-app

# Submit build using cloudbuild.yaml
gcloud builds submit --config=cloudbuild.yaml
```

#### 7. Monitor Deployment
The build will show in real-time in Cloud Shell. Wait for completion (5-10 minutes).

#### 8. Get Your App URL
```bash
gcloud run services describe rcr-app \
  --region=asia-southeast1 \
  --format="value(status.url)"
```

---

## 🔄 Method 2: GitHub Actions (Automatic Deployment on Git Push)

### What You Need
- GitHub account
- Repository push access
- Nothing to run locally!

### Setup Instructions

#### 1. Create GitHub Actions Workflow File

In your repository, create `.github/workflows/deploy-to-gcp.yml`:

```yaml
name: Deploy to Google Cloud Run

on:
  push:
    branches:
      - main
      - develop

env:
  PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  RUN_REGION: asia-southeast1
  SERVICE_NAME: rcr-app
  ARTIFACT_REPO: rcr-app-repo

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    permissions:
      contents: read
      id-token: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
          service_account: ${{ secrets.WIF_SERVICE_ACCOUNT }}

      - name: Set up Google Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Configure Docker for Artifact Registry
        run: |
          gcloud auth configure-docker ${{ env.RUN_REGION }}-docker.pkg.dev

      - name: Build Docker image
        run: |
          docker build -t \
            ${{ env.RUN_REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.ARTIFACT_REPO }}/${{ env.SERVICE_NAME }}:${{ github.sha }} \
            -t ${{ env.RUN_REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.ARTIFACT_REPO }}/${{ env.SERVICE_NAME }}:latest \
            .

      - name: Push Docker image
        run: |
          docker push ${{ env.RUN_REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.ARTIFACT_REPO }}/${{ env.SERVICE_NAME }}:${{ github.sha }}
          docker push ${{ env.RUN_REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.ARTIFACT_REPO }}/${{ env.SERVICE_NAME }}:latest

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy ${{ env.SERVICE_NAME }} \
            --image=${{ env.RUN_REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.ARTIFACT_REPO }}/${{ env.SERVICE_NAME }}:${{ github.sha }} \
            --region=${{ env.RUN_REGION }} \
            --platform=managed \
            --cpu=1 \
            --memory=512Mi \
            --concurrency=80 \
            --timeout=300 \
            --min-instances=0 \
            --max-instances=10 \
            --allow-unauthenticated \
            --execution-environment=gen2 \
            --quiet

      - name: Get service URL
        run: |
          gcloud run services describe ${{ env.SERVICE_NAME }} \
            --region=${{ env.RUN_REGION }} \
            --format="value(status.url)"
```

#### 2. Set Up GitHub Secrets

Go to your GitHub repository:
1. Settings → Secrets and variables → Actions
2. Add these secrets:
   - `GCP_PROJECT_ID` - Your GCP project ID
   - `WIF_PROVIDER` - Workload Identity Provider (see below)
   - `WIF_SERVICE_ACCOUNT` - Service account email (see below)

#### 3. Set Up Workload Identity Federation (One-time Setup)

Run these in Google Cloud Shell:

```bash
# Set variables
export PROJECT_ID=$(gcloud config get-value project)
export GITHUB_REPO="YOUR_GITHUB_USERNAME/YOUR_REPO_NAME"

# Enable required API
gcloud services enable iamcredentials.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com
gcloud services enable sts.googleapis.com

# Create service account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions"

# Grant roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

# Create Workload Identity Pool
gcloud iam workload-identity-pools create github \
  --project=$PROJECT_ID \
  --location=global \
  --display-name="GitHub"

# Get Pool Resource Name
export WIP_RESOURCE=$(gcloud iam workload-identity-pools describe github \
  --project=$PROJECT_ID \
  --location=global \
  --format='value(name)')

# Create Workload Identity Provider
gcloud iam workload-identity-pools providers create-oidc github-provider \
  --project=$PROJECT_ID \
  --location=global \
  --workload-identity-pool=github \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,assertion.aud=assertion.aud,assertion.repository=$GITHUB_REPO" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-condition="assertion.aud == 'sts.amazonaws.com'"

# Get Provider Resource Name
export WIP_PROVIDER=$(gcloud iam workload-identity-pools providers describe github-provider \
  --project=$PROJECT_ID \
  --location=global \
  --workload-identity-pool=github \
  --format='value(name)')

# Create Service Account Key Binding
gcloud iam service-accounts add-iam-policy-binding github-actions@$PROJECT_ID.iam.gserviceaccount.com \
  --project=$PROJECT_ID \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/$PROJECT_ID/locations/global/workloadIdentityPools/github/attribute.repository/$GITHUB_REPO"

# Print values for GitHub Secrets
echo "WIF_PROVIDER: $WIP_PROVIDER"
echo "WIF_SERVICE_ACCOUNT: github-actions@$PROJECT_ID.iam.gserviceaccount.com"
```

Copy the output values and add them to GitHub Secrets.

#### 4. Deploy via Git Push

```bash
# Make changes locally or via GitHub UI
git add .
git commit -m "Deploy update"
git push origin main
```

GitHub Actions will automatically:
1. ✅ Build your Docker image
2. ✅ Push to Artifact Registry
3. ✅ Deploy to Cloud Run

---

## ☁️ Method 3: Google Cloud Build Trigger (Manual from Console)

### What You Need
- GitHub repository connected to GCP
- Nothing to run locally!

### Setup Steps

#### 1. Connect GitHub Repository
- Go to [Cloud Console](https://console.cloud.google.com)
- Navigate to Cloud Build → Repositories
- Click "Connect Repository"
- Authenticate with GitHub and select your repository

#### 2. Create Build Trigger
- In Cloud Build, go to Triggers
- Click "Create Trigger"
- Configure:
  - **Name:** rcr-app-deploy
  - **Event:** Push to a branch
  - **Branch:** main
  - **Build Configuration:** Cloud Build configuration file
  - **Location:** cloudbuild.yaml

#### 3. Deploy on Git Push
Every time you push to `main` branch:
1. Cloud Build automatically triggers
2. Builds and deploys your app
3. No local commands needed!

#### 4. Manual Trigger (Optional)
If you need to deploy without pushing code:
- Go to Cloud Build → Dashboard
- Find your build trigger
- Click "Run Trigger"
- Build starts immediately

---

## 📱 Method 4: Cloud Console UI (Point and Click)

### Completely No-Code Approach

#### Using gcloud in Cloud Shell
1. Open [Google Cloud Console](https://console.cloud.google.com)
2. Open Cloud Shell (>_ icon)
3. Paste these commands one by one:

```bash
# Set project
gcloud config set project YOUR_PROJECT_ID

# Enable APIs
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com

# Create repository
gcloud artifacts repositories create rcr-app-repo \
  --repository-format=docker \
  --location=asia-southeast1

# Clone repo
git clone https://github.com/YOUR_USERNAME/rcr-app.git
cd rcr-app

# Submit build
gcloud builds submit --config=cloudbuild.yaml
```

---

## 🔄 Updating Your App (After Initial Deployment)

### Using GitHub Actions
```bash
git add .
git commit -m "Update my app"
git push origin main
# Automatically deploys!
```

### Using Cloud Shell
```bash
cd rcr-app
git pull origin main
gcloud builds submit --config=cloudbuild.yaml
```

### Using Cloud Build Trigger
```bash
git push origin main
# Automatically triggers deployment!
```

---

## 🔐 Security Best Practices

### For GitHub Actions
- ✅ Use Workload Identity (no long-lived credentials)
- ✅ Limit service account permissions
- ✅ Store only secrets in GitHub Secrets
- ✅ Review Actions logs for security

### For Cloud Shell
- ✅ Cloud Shell is isolated per user
- ✅ 5-minute idle timeout
- ✅ Credentials not stored locally
- ✅ All operations logged

### For Cloud Build
- ✅ Separate service account
- ✅ Limited IAM roles
- ✅ Build logs stored in Cloud Logging
- ✅ No credentials in code

---

## 📊 Comparison of Methods

| Method | Setup Time | Deploy Time | Manual Steps | Best For |
|--------|-----------|-----------|-------------|----------|
| Cloud Shell | 5 min | 10 min | Manual each time | One-off deployments |
| GitHub Actions | 30 min | 10 min | Automatic on push | Continuous deployment |
| Cloud Build Trigger | 10 min | 10 min | Manual or auto | Flexible deployment |
| Cloud Console | 1 min | 10 min | Point and click | Testing |

---

## 🚀 Recommended Approach

For company restrictions:
1. **Best:** GitHub Actions (fully automated)
2. **Good:** Cloud Build Trigger (flexible)
3. **Easiest:** Cloud Shell (no setup)

---

## ✅ Implementation Checklist

### GitHub Actions Setup
- [ ] Create `.github/workflows/deploy-to-gcp.yml`
- [ ] Set up Workload Identity Federation
- [ ] Add GitHub Secrets
- [ ] Test with git push

### Cloud Build Trigger Setup
- [ ] Connect GitHub repository
- [ ] Create build trigger
- [ ] Set to trigger on push
- [ ] Test deployment

### Cloud Shell Setup
- [ ] Test clone repo
- [ ] Enable APIs
- [ ] Create Artifact Registry
- [ ] Run `gcloud builds submit`

---

## 📞 Support & Help

### Cloud Shell Issues
- Check quota limits: `gcloud compute project-info describe`
- View logs: `gcloud builds log [BUILD_ID]`
- [Cloud Shell Documentation](https://cloud.google.com/shell/docs)

### GitHub Actions Issues
- Check workflow runs: GitHub → Actions tab
- View logs: Click on failed workflow
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

### Cloud Build Issues
- View builds: [Cloud Build Dashboard](https://console.cloud.google.com/cloud-build/dashboard)
- Check logs: Click on build
- [Cloud Build Documentation](https://cloud.google.com/build/docs)

---

## 💡 Next Steps

1. **Choose a method** based on your needs
2. **Follow the setup instructions**
3. **Test the deployment**
4. **Monitor from Cloud Console**

---

**Last Updated:** June 2026  
**Status:** ✅ Production Ready
