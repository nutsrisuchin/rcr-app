# RCR App — Cloud Shell Deployment Guide

## Prerequisites
- Access to GCP project `prj-gc-npr-temai-rtai-01`
- Cloud Shell open at https://shell.cloud.google.com

---

## Step 1 — Set the project

```bash
gcloud config set project prj-gc-npr-temai-rtai-01
```

---

## Step 2 — Clone the repository

```bash
git clone https://github.com/nutsrisuchin/rcr-app
cd rcr-app/rcr-app
```

---

## Step 3 — Configure Docker authentication

```bash
gcloud auth configure-docker asia-southeast1-docker.pkg.dev
```

---

## Step 4 — Create Artifact Registry repository
> **One-time only.** Skip this on future deployments.

```bash
gcloud artifacts repositories create rcr-app-repo \
  --repository-format=docker \
  --location=asia-southeast1 \
  --description="RCR App Docker images"
```

---

## Step 5 — Build the Docker image

```bash
docker build -t asia-southeast1-docker.pkg.dev/prj-gc-npr-temai-rtai-01/rcr-app-repo/rcr-app:latest .
```

> This takes ~2–3 minutes (builds React frontend + Express backend).

---

## Step 6 — Push image to Artifact Registry

```bash
docker push asia-southeast1-docker.pkg.dev/prj-gc-npr-temai-rtai-01/rcr-app-repo/rcr-app:latest
```

---

## Step 7 — Deploy to Cloud Run

```bash
gcloud run deploy rcr-app \
  --image=asia-southeast1-docker.pkg.dev/prj-gc-npr-temai-rtai-01/rcr-app-repo/rcr-app:latest \
  --region=asia-southeast1 \
  --platform=managed \
  --ingress=internal-and-cloud-load-balancing \
  --vpc-connector=svpc-gc-npr-temai-gcdev-1 \
  --vpc-egress=all-traffic \
  --memory=512Mi \
  --cpu=1 \
  --port=8080 \
  --set-env-vars=NODE_ENV=production
```

When prompted `Allow unauthenticated invocations? (y/N)` → type `y`

---

## Step 8 — Grant yourself invoker access
> **One-time only.** Skip this on future deployments.

```bash
gcloud run services add-iam-policy-binding rcr-app \
  --region=asia-southeast1 \
  --member="user:26005064@pttgcgroup.com" \
  --role="roles/run.invoker"
```

---

## Your App URL

```
https://rcr-app-977163887657.asia-southeast1.run.app
```

> Accessible only from the **PTTGC corporate network** due to org policy ingress restriction.

---

## Future Redeployments (after code changes)

Pull latest code, rebuild, push, and update the service:

```bash
cd ~/rcr-app
git pull origin main
cd rcr-app

docker build -t asia-southeast1-docker.pkg.dev/prj-gc-npr-temai-rtai-01/rcr-app-repo/rcr-app:latest .

docker push asia-southeast1-docker.pkg.dev/prj-gc-npr-temai-rtai-01/rcr-app-repo/rcr-app:latest

gcloud run services update rcr-app \
  --image=asia-southeast1-docker.pkg.dev/prj-gc-npr-temai-rtai-01/rcr-app-repo/rcr-app:latest \
  --region=asia-southeast1
```

---

## Known Limitations

| Issue | Status |
|-------|--------|
| App only accessible on PTTGC network | Org policy blocks public ingress (`all`) |
| Data resets on container restart | SQLite is ephemeral — connect Cloud SQL for persistence |
| Cloud Build trigger not working | Requires project owner to fix service account IAM |
