# Push RCR App to GitHub - Step-by-Step Guide

## 🚀 Quick Start (5 minutes)

### Step 1: Create GitHub Repository
1. Go to [GitHub.com](https://github.com)
2. Click **"+"** icon (top right) → **"New repository"**
3. **Repository name:** `rcr-app`
4. **Description:** RCR Application - React + Node.js
5. **Privacy:** Public (if you want GCP to access it)
6. **Do NOT** initialize with README (we have one)
7. Click **"Create repository"**

---

### Step 2: Copy Your Repository URL

After creating repo, GitHub shows you the URL:
```
https://github.com/YOUR_USERNAME/rcr-app.git
```

**Or find it:**
- Click **"<> Code"** button (green)
- Under "HTTPS", copy the URL

**Keep this URL handy!** You'll need it in Step 4.

---

### Step 3: Initialize Git in Your Project (PowerShell)

Open PowerShell and navigate to your project:

```powershell
# Navigate to your project
cd 'C:\Users\26005064\OneDrive - PTT Global Chemical Public Company Limited\DATA\Digital_IT\Code - Antigravity\RCR'

# Check if git is already initialized
git status

# If you see "fatal: not a git repository", run:
git init

# Configure git (first time only)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Verify config
git config --list
```

---

### Step 4: Add Remote Repository

```powershell
# Add GitHub as remote
git remote add origin https://github.com/YOUR_USERNAME/rcr-app.git

# Verify it's added
git remote -v
# Should show:
# origin  https://github.com/YOUR_USERNAME/rcr-app.git (fetch)
# origin  https://github.com/YOUR_USERNAME/rcr-app.git (push)
```

---

### Step 5: Create .gitignore (Important!)

Create file: `RCR/.gitignore`

```
# Dependencies
node_modules/
/.pnp
.pnp.js

# Build output
dist/
build/
*.tsbuildinfo

# Environment variables
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.npm

# Testing
coverage/

# Others
.firebase/
.deploypem
```

---

### Step 6: Add Files to Git

```powershell
# Add all files
git add .

# Or add specific folder
git add rcr-app/

# Check what will be added
git status
```

---

### Step 7: Create First Commit

```powershell
git commit -m "Initial commit: RCR app setup with Dockerfile and deployment configs"
```

---

### Step 8: Push to GitHub

```powershell
# First time - set upstream branch
git branch -M main
git push -u origin main

# After first push, just use:
# git push
```

**First push might ask for authentication:**
- If you see login prompt, enter your GitHub username/password
- Or use Personal Access Token if password auth is disabled

---

### Step 9: Verify on GitHub

1. Go to [GitHub.com](https://github.com)
2. Go to your repository
3. Verify all files are there ✅

---

## 🔐 Authentication Issues? (Common)

### Issue: GitHub Asks for Password

GitHub no longer accepts passwords for command line. Use instead:

#### Option A: Personal Access Token (Recommended)

1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Click **"Generate new token"**
3. Name: `RCR App Deployment`
4. Scopes: Select `repo` (full control of private repos)
5. Click **"Generate token"**
6. **Copy the token** (you won't see it again!)
7. When git asks for password, paste the token

#### Option B: SSH Key

```powershell
# Generate SSH key (if you don't have one)
ssh-keygen -t rsa -b 4096 -f "$env:USERPROFILE\.ssh\id_rsa"

# Add to GitHub:
# 1. Copy contents of $env:USERPROFILE\.ssh\id_rsa.pub
# 2. Go to GitHub → Settings → SSH and GPG keys
# 3. Click "New SSH key"
# 4. Paste your public key
# 5. Click "Add SSH key"

# Then use SSH URL instead of HTTPS:
git remote set-url origin git@github.com:YOUR_USERNAME/rcr-app.git
git push -u origin main
```

---

## 📋 Complete Step-by-Step Checklist

- [ ] Created GitHub account (if needed)
- [ ] Created new repository named `rcr-app`
- [ ] Copied repository URL
- [ ] Opened PowerShell in project directory
- [ ] Ran `git init`
- [ ] Configured git with name and email
- [ ] Added GitHub remote: `git remote add origin URL`
- [ ] Created `.gitignore` file
- [ ] Ran `git add .`
- [ ] Ran `git commit -m "message"`
- [ ] Ran `git push -u origin main`
- [ ] Verified files appear on GitHub

---

## 🆘 Troubleshooting

### Error: "fatal: not a git repository"
```powershell
# Solution: Initialize git
git init
```

### Error: "Authentication failed"
```powershell
# Solution: Use Personal Access Token instead of password
# See "Issue: GitHub Asks for Password" section above
```

### Error: "Remote already exists"
```powershell
# Solution: Remove existing remote
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/rcr-app.git
```

### Error: "Permission denied (publickey)"
```powershell
# Solution: Use HTTPS instead of SSH (easier)
git remote set-url origin https://github.com/YOUR_USERNAME/rcr-app.git
```

### Files not showing on GitHub
```powershell
# Check if push succeeded
git log

# Try pushing again
git push origin main
```

---

## 📁 What Gets Pushed

Your repo should include:

```
rcr-app/
├─ src/
├─ server/
├─ public/
├─ package.json
├─ Dockerfile
├─ cloudbuild.yaml
├─ vite.config.ts
└─ ...

.github/
├─ workflows/
│  └─ deploy-to-gcp.yml

CLOUD_ONLY_DEPLOYMENT.md
GCP_DEPLOYMENT_SETUP.md
... (all your docs)
```

**What should NOT be pushed:**
```
node_modules/        ← .gitignore handles this
dist/               ← .gitignore handles this
.env                ← .gitignore handles this
.env.local          ← .gitignore handles this
```

---

## ✅ After Pushing to GitHub

Now you can:

1. **Connect to GCP**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Cloud Build → Repositories → Connect Repository
   - Select your GitHub repo

2. **Deploy with GitHub Actions**
   - Workflow file is already created: `.github/workflows/deploy-to-gcp.yml`
   - Every push to `main` triggers automatic deployment

3. **Deploy with Cloud Build**
   - Create a trigger in Cloud Build
   - Set to deploy on push to main

---

## 💡 Pro Tips

### Useful Git Commands

```powershell
# Check status
git status

# View recent commits
git log

# See what changed
git diff

# Undo uncommitted changes
git checkout -- .

# Undo last commit (keep changes)
git reset --soft HEAD~1

# View all branches
git branch -a

# Pull latest from GitHub
git pull origin main

# Create new branch
git checkout -b feature/my-feature
```

### Keep Repo Clean

```powershell
# Before committing, verify files
git status

# Only add what you want
git add specific-file.js

# Or add whole directory
git add rcr-app/

# Never commit node_modules (use .gitignore)
# Never commit .env files (use .gitignore)
# Never commit build artifacts (use .gitignore)
```

### Push Updates After Initial Push

After first push, just do:

```powershell
# Make changes to files
# Edit your code

# Stage changes
git add .

# Commit
git commit -m "Description of changes"

# Push
git push
```

---

## 🎯 Next Steps After GitHub

1. **Verify files on GitHub**
2. **Check `.github/workflows/deploy-to-gcp.yml` exists**
3. **Go to [CHECK_GCP_GITHUB_INTEGRATION.md](CHECK_GCP_GITHUB_INTEGRATION.md) to connect GCP**
4. **Add GitHub Secrets** (for GitHub Actions)
5. **Push a test commit** to trigger auto-deployment

---

## 📞 Need Help?

### GitHub Help
- [GitHub Docs](https://docs.github.com/)
- [Git Documentation](https://git-scm.com/doc)

### Git Help in PowerShell
```powershell
git --help
git push --help
git commit --help
```

---

## ⏱️ Time Estimate

| Step | Time |
|------|------|
| Create GitHub repo | 2 min |
| Git initialization | 2 min |
| Add and commit files | 2 min |
| Push to GitHub | 2 min |
| **Total** | **~8 minutes** |

---

**Ready? Let's push your app to GitHub!** 🚀

Last Updated: June 2026
