# How to Check GCP GitHub Integration & Connect Personal GitHub

## ✅ Quick Check - Can Your GCP Accept Personal GitHub?

### Method 1: Check in Cloud Console (Best Way)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **Cloud Build** → **Repositories**
3. Look for button: **"Connect Repository"**
4. Click it and see what options appear

**If you see GitHub option:** ✅ Your GCP accepts GitHub  
**If blocked:** ❌ Your company has restrictions

---

## 🔗 How to Connect Personal GitHub to GCP

### Step 1: Go to Cloud Build Repositories

```
Google Cloud Console
  ↓
Cloud Build (search for it)
  ↓
Repositories (left menu)
  ↓
"Connect Repository" button
```

### Step 2: Select GitHub

Click the **"Connect Repository"** button and choose:
- **Source Control System:** GitHub (or GitHub Enterprise)
- **Personal Account:** Select this option

### Step 3: Authenticate

You'll be redirected to GitHub to authorize GCP:
1. Sign in to your personal GitHub account
2. GitHub asks: "Authorize google-cloud-build?"
3. Click **"Authorize"**
4. Confirm your GitHub password (might ask again for security)

### Step 4: Select Repository

After authorization:
1. Choose your **Organization** (should show your personal account)
2. Select your **rcr-app repository**
3. Click **"Connect"**

### Step 5: Create Build Trigger (Optional)

After connecting, you can create a trigger to auto-deploy on push:
1. In Repositories tab, find your connected repo
2. Click **"Create Trigger"**
3. Configure:
   - **Name:** rcr-app-deploy
   - **Event:** Push to branch
   - **Branch:** main
   - **Build Config:** Cloud Build config file
   - **File location:** cloudbuild.yaml

---

## 🔍 Step-by-Step Visual Guide

### Screen 1: Cloud Build Menu
```
Google Cloud Console
├─ Navigation Menu
│  └─ Cloud Build
│     ├─ Dashboard
│     ├─ Builds
│     ├─ Repositories ← Click here
│     ├─ Triggers
│     └─ History
```

### Screen 2: Repositories Page
```
Repositories Page
├─ Your Project: [PROJECT_ID]
├─ [Connect Repository] button
├─ Existing repos (if any)
└─ No repos connected yet
```

### Screen 3: Authorization
```
GitHub Authorization
├─ "Authorize google-cloud-build?"
├─ Shows permissions GCP will use
├─ [Authorize] button ← Click this
└─ Redirects back to Cloud Console
```

### Screen 4: Repository Selection
```
Select Repository
├─ Organization: your-github-username
├─ Repository: rcr-app ← Select this
├─ Branch: main (default)
└─ [Connect] button
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: "GitHub Not Available"
**Symptom:** Can't find GitHub option when connecting  
**Cause:** Cloud Build API not enabled  
**Solution:**
```bash
# In Cloud Shell, enable it:
gcloud services enable cloudbuild.googleapis.com
```

### Issue 2: "Authorization Failed"
**Symptom:** GitHub authorization page shows error  
**Cause:** Browser cookies/session issue  
**Solution:**
- Clear browser cookies
- Logout from GitHub completely
- Try again in private/incognito window

### Issue 3: "Repository Not Visible"
**Symptom:** Your rcr-app repository doesn't appear in list  
**Cause:** Wrong GitHub account logged in  
**Solution:**
1. Check you're logged into correct GitHub account
2. In GitHub, verify rcr-app exists in your personal repos
3. Check repo is public or GCP has access
4. Try different browser or incognito window

### Issue 4: "Permission Denied"
**Symptom:** Can't connect repository  
**Cause:** GitHub access restrictions or GCP permissions  
**Solution:**
```bash
# Check your GCP permissions:
gcloud projects get-iam-policy $(gcloud config get-value project)

# You need roles like:
# - roles/cloudbuild.admin
# - roles/iam.serviceAccountUser
```

---

## 🔐 Permissions Required

Your GitHub account needs:
- ✅ Owner or Admin access to the repository
- ✅ Ability to create OAuth apps (usually personal accounts have this)

Your GCP account needs:
- ✅ `roles/cloudbuild.admin` (to create triggers)
- ✅ `roles/iam.serviceAccountUser` (to use service account)

Check your GCP permissions:
```bash
gcloud projects get-iam-policy YOUR_PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:YOUR_EMAIL"
```

---

## 🧪 Test Connection

After connecting, test it:

### In Cloud Console:
1. Go to **Repositories**
2. Find your connected repo
3. Click the three-dot menu
4. Select **"Create Trigger"**
5. Verify it works

### In Cloud Shell:
```bash
# List connected repositories
gcloud builds list

# View repository details
gcloud source repos describe rcr-app
```

---

## ✨ What Happens After Connecting

Once connected, you can:
- ✅ Create Cloud Build triggers
- ✅ Auto-deploy on git push
- ✅ Deploy specific branches/commits
- ✅ Manual deployment anytime
- ✅ See build history and logs

---

## 🚀 Next: Set Up Auto-Deploy

After connecting, to enable automatic deployment:

### Option A: Via Cloud Console (Point & Click)
1. Go to Repositories
2. Find your repo
3. Click "Create Trigger"
4. Set to trigger on push to `main`
5. Save trigger

### Option B: Via GitHub Actions (Recommended)
Use the workflow file `.github/workflows/deploy-to-gcp.yml` we created earlier

### Option C: Manual Deploy
Click "Run Trigger" anytime to deploy manually

---

## 📋 Complete Checklist

- [ ] Can access [Google Cloud Console](https://console.cloud.google.com)
- [ ] Cloud Build API enabled
- [ ] Can see "Connect Repository" button
- [ ] GitHub login credentials ready
- [ ] Personal GitHub account has rcr-app repo
- [ ] Cloud Build gets authorization in GitHub
- [ ] Repository successfully connected
- [ ] Can create build trigger (optional)

---

## 💡 Pro Tips

1. **Use OAuth Connection** (recommended)
   - More secure
   - Easier to manage
   - No personal tokens needed

2. **Keep GitHub Token Safe**
   - Never share tokens
   - Rotate regularly
   - Use OAuth when possible

3. **Test First**
   - After connecting, create a test trigger
   - Make small commit to main
   - Verify build runs successfully

4. **Monitor Builds**
   - Go to Cloud Build → Builds to see history
   - Check build logs for errors
   - View deployment status

---

## 🎯 Quick Decision Tree

**Is this a personal project?**
- YES → Use personal GitHub + personal GCP account
- NO → Use organization accounts

**Does company have GCP restrictions?**
- YES → Use Cloud Shell method (no connection needed)
- NO → Use GitHub integration

**Want automatic deployment?**
- YES → Connect GitHub + create trigger
- NO → Use manual cloud builds

---

## 📞 Getting Help

If something doesn't work:

1. **Check GCP Status:** [Google Cloud Status Dashboard](https://status.cloud.google.com/)
2. **View Build Logs:** Cloud Build → Builds → Click on your build
3. **GitHub Issues:** [GitHub Community Support](https://github.community/)
4. **GCP Support:** [Google Cloud Support](https://cloud.google.com/support)

---

## ✅ You're Ready!

After connecting personal GitHub to GCP, you can:
- ✅ Deploy with `git push`
- ✅ Auto-deploy on code changes
- ✅ Manage deployments from Cloud Console
- ✅ Use GitHub Actions for CI/CD
- ✅ Monitor builds and logs

---

**Last Updated:** June 2026
