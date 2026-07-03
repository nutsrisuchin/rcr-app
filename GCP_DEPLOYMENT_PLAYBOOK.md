# GCP Cloud Run Deployment Playbook (Reusable)

A step-by-step guide for deploying a containerized app to **GCP Cloud Run** via **Cloud Build**, based on the RCR project. Covers the full workflow used in the PTTGC `prj-gc-npr-temai-rtai-01` environment, including the org-policy gotchas that are easy to trip over.

> **Environment assumptions** (adjust per project):
> - Project: `prj-gc-npr-temai-rtai-01`
> - Region: `asia-southeast1`
> - Artifact Registry repo: `cloudrun-app`
> - VPC connector: `svpc-gc-npr-temai-gcdev-1`
> - Deploy runtime SA: `svca-gc-npr-hxai-run-web@prj-gc-npr-temai-rtai-01.iam.gserviceaccount.com`

---

## The Workflow at a Glance

```
1. Use the automated Cloud Build template  →  creates a new app + Cloud Run service
                                               (initially wired to a CSR repo + demo image)
2. Replace demo files with your app         →  Dockerfile + .dockerignore + cloudbuild.yaml
3. Switch the trigger's repo: CSR → GitHub  →  point it at your personal GitHub repo
4. Make the service public                  →  allUsers / roles/run.invoker
5. Lock the service name in cloudbuild.yaml →  so every build hits the SAME service
```

---

## Reusing This Playbook for a New App (same GCP project)

Most deployments are a **new app inside the existing project** (`prj-gc-npr-temai-rtai-01`), which already hosts ~30 services. Since Cloud Run service names are unique per project, the one real risk is a **name collision** that overwrites another app. Follow this to stay safe:

1. **List existing services first** — so you (and Claude) know what names are taken:
   ```bash
   gcloud run services list --region=asia-southeast1 \
     --project=prj-gc-npr-temai-rtai-01 \
     --format="table(metadata.name, status.url)"
   ```
2. **Pick a unique `_SERVICE_NAME`** that does not appear in that list. Prefer the service the automated template just created for *this* app (it's unique and already public/grandfathered).
3. **Set it in `cloudbuild.yaml`** under `substitutions: _SERVICE_NAME:`. This is the single value that determines which service every build updates — never leave it as `${REPO_NAME}`.
4. **Sanity-check before the first build:** confirm `_SERVICE_NAME` matches the service whose URL you intend to open, and that no other trigger deploys to that same name.

> Claude can edit `cloudbuild.yaml` / `Dockerfile` / `.dockerignore` for you (including setting `_SERVICE_NAME`), but cannot run `gcloud` against your project — you run the listed commands in Cloud Shell and paste the output back.

---

## Step 1 — Start from the automated Cloud Build template

Use the GCP-provided "new Cloud Run app" template/trigger. This creates:
- A **Cloud Run service** (running a placeholder/demo image, e.g. `pttgc-genai-streamlit`)
- A **Cloud Source Repository (CSR)** clone of a starter template
- A **Cloud Build trigger** pointed at that CSR

> ⚠️ **Critical gotcha — note the service name now.** The template names the service, and that name is what your public URL becomes (`https://<SERVICE>-<PROJECTNUM>.<region>.run.app`). Whatever this service is called is the service you must keep deploying to. Write it down.

---

## Step 2 — Files your repo needs

Three files drive the build. Place the **Dockerfile** and **.dockerignore** next to your app code; place **cloudbuild.yaml** where the trigger expects it (usually repo root).

### 2a. `Dockerfile` (multi-stage: frontend build + backend runtime)

Example for a React/Vite frontend + Node/Express backend:

```dockerfile
# Stage 1: Build the frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build          # outputs to /app/dist

# Stage 2: Backend runtime
FROM node:20-alpine
WORKDIR /app

# Build tools — REQUIRED if any dependency is a native module (e.g. sqlite3, bcrypt)
RUN apk add --no-cache python3 make g++

WORKDIR /app/server
# Copy source FIRST, then install — never copy a host-built node_modules over a fresh install
COPY server/ .
RUN rm -rf node_modules && npm install

# Bring in the built frontend
COPY --from=frontend-build /app/dist /app/dist

# Cloud Run injects PORT; the app must listen on it
ENV PORT=8080
EXPOSE 8080
CMD ["node", "index.js"]
```

**Hard-won rules baked in above:**
- **Native modules need a toolchain.** `apk add --no-cache python3 make g++` lets `npm install` compile native `.node` binaries for Alpine. Skip this and the container crashes at startup with `ERR_DLOPEN_FAILED`.
- **Never let a host `node_modules` survive into the image.** Order matters: `COPY` source, then `rm -rf node_modules && npm install`. A Windows/macOS-built binary copied into a Linux image fails with `Exec format error`.
- **Listen on `process.env.PORT` (default 8080).** Cloud Run sets `PORT`; if the app binds a fixed port, the startup probe fails ("container failed to start and listen on port").

### 2b. `.dockerignore`

```
**/node_modules
**/dist
.git
**/.env
```

> Use `**/node_modules`, not bare `node_modules`. Bare only matches the top level and will miss nested folders like `server/node_modules` — exactly what causes the `Exec format error` above.

### 2c. `cloudbuild.yaml` (build → push → deploy)

```yaml
steps:
  # Step 1: Build the image (context = subfolder holding the Dockerfile)
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - '${_REGION}-docker.pkg.dev/${PROJECT_ID}/${_ARTIFACT_REGISTRY_REPO}/${REPO_NAME}:${SHORT_SHA}'
      - '-t'
      - '${_REGION}-docker.pkg.dev/${PROJECT_ID}/${_ARTIFACT_REGISTRY_REPO}/${REPO_NAME}:latest'
      - './rcr-app'          # ← build context; change to '.' if Dockerfile is at repo root
    id: 'build-image'

  # Step 2: Push to Artifact Registry
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - '${_REGION}-docker.pkg.dev/${PROJECT_ID}/${_ARTIFACT_REGISTRY_REPO}/${REPO_NAME}:${SHORT_SHA}'
    waitFor: ['build-image']
    id: 'push-image'

  # Step 3: Deploy to Cloud Run
  - name: 'google/cloud-sdk'
    entrypoint: 'gcloud'
    args:
      - 'run'
      - 'deploy'
      - '${_SERVICE_NAME}'   # ← FIXED name, NOT ${REPO_NAME} (see Step 5)
      - '--image=${_REGION}-docker.pkg.dev/${PROJECT_ID}/${_ARTIFACT_REGISTRY_REPO}/${REPO_NAME}:${SHORT_SHA}'
      - '--region=${_REGION}'
      - '--platform=managed'
      - '--ingress=internal-and-cloud-load-balancing'   # required by org policy
      - '--vpc-connector=${_VPC_CONNECTOR}'             # required by org policy
      - '--vpc-egress=all-traffic'                      # required by org policy
      - '--cpu=${_CPU}'
      - '--memory=${_MEMORY}'
      - '--concurrency=${_CONCURRENCY}'
      - '--timeout=${_TIMEOUT}'
      - '--min-instances=${_MIN_INSTANCES}'
      - '--max-instances=${_MAX_INSTANCES}'
      - '--service-account=${_SERVICE_ACCOUNT_NAME}'
      - '--session-affinity'
      - '--execution-environment=gen2'
      - '--set-env-vars=NODE_ENV=production'
      # NOTE: do NOT add --allow-unauthenticated (see Step 4)
    waitFor: ['push-image']
    id: 'deploy-cloudrun'

images:
  - '${_REGION}-docker.pkg.dev/${PROJECT_ID}/${_ARTIFACT_REGISTRY_REPO}/${REPO_NAME}:${SHORT_SHA}'
  - '${_REGION}-docker.pkg.dev/${PROJECT_ID}/${_ARTIFACT_REGISTRY_REPO}/${REPO_NAME}:latest'

substitutions:
  _REGION: 'asia-southeast1'
  _ARTIFACT_REGISTRY_REPO: 'cloudrun-app'
  _SERVICE_NAME: 'rcr-github'        # ← the ONE service you keep deploying to
  _SERVICE_ACCOUNT_NAME: 'svca-gc-npr-hxai-run-web@prj-gc-npr-temai-rtai-01.iam.gserviceaccount.com'
  _VPC_CONNECTOR: 'svpc-gc-npr-temai-gcdev-1'
  _CPU: '1'
  _MEMORY: '512Mi'
  _CONCURRENCY: '80'
  _TIMEOUT: '300'
  _MIN_INSTANCES: '0'
  _MAX_INSTANCES: '1'

options:
  logging: CLOUD_LOGGING_ONLY
  machineType: 'N1_HIGHCPU_8'
```

**Substitution notes:**
- `${PROJECT_ID}`, `${REPO_NAME}`, `${SHORT_SHA}` are **built-in** (auto-provided by Cloud Build). `${REPO_NAME}` = the connected repo's name.
- Anything starting with `_` is a **user substitution** you define under `substitutions:` (or in the trigger UI).
- The build context (`./rcr-app`) must point at the folder that actually contains the `Dockerfile`. Wrong path → `unable to prepare context: path "..." not found`.

---

## Step 3 — Switch the trigger's repo from CSR to your GitHub

The template starts wired to a **Cloud Source Repository**. To use your personal GitHub instead:

1. Push your code (with the three files above) to your GitHub repo.
2. GCP Console → **Cloud Build → Triggers → [your trigger] → Edit**.
3. Under **Source**, connect/select your **GitHub** repository (GitHub App connection) and set the branch (e.g. `^main$`).
4. Confirm **Configuration → Cloud Build configuration file location** points at your `cloudbuild.yaml` (usually `/cloudbuild.yaml` at repo root — NOT a subfolder).
5. (Optional) Set the **Service account** for the build. `None` uses the legacy Cloud Build SA, which can set IAM bindings; a user-managed SA may lack that permission.
6. Save → **Run** the trigger (or push a commit).

> ⚠️ The config file location and the Dockerfile build context are two different paths. The trigger reads `cloudbuild.yaml` from the location in (4); inside it, the `docker build` context (Step 2c) must point at the Dockerfile's folder.

---

## Step 4 — Make the service publicly accessible (allUsers)

Cloud Run defaults to **"Require authentication."** To make it public you grant `allUsers` the `roles/run.invoker` role. **In this org, that is gated by policy** — read carefully:

### Try it (works only if the org policy permits, or the binding is grandfathered):
```bash
gcloud run services add-iam-policy-binding <SERVICE_NAME> \
  --region=asia-southeast1 \
  --member="allUsers" \
  --role="roles/run.invoker" \
  --project=prj-gc-npr-temai-rtai-01
```

### If it fails with:
```
FAILED_PRECONDITION: One or more users named in the policy do not belong to a permitted customer, perhaps due to an organization policy.
```
…then the org policy **`constraints/iam.allowedPolicyMemberDomains`** (Domain Restricted Sharing) is blocking `allUsers`. Check it:
```bash
gcloud org-policies describe iam.allowedPolicyMemberDomains \
  --project=prj-gc-npr-temai-rtai-01 --effective
```
If `allowedValues` lists only a Workspace customer ID (e.g. `C02g1pzm3`), public `allUsers` is blocked for any **new** binding.

### What this means and how to win:
- **Services that are already public are "grandfathered"** — their `allUsers` binding was created before the policy was enforced. The policy blocks *new* additions but does **not** strip *existing* ones.
- **Deploying a new revision does NOT reset a service's IAM policy.** So if you deploy your app onto a service that is *already public*, it stays public.
- ✅ **Therefore: start from the template-created service that is already public, and keep deploying into it.** Verify with:
  ```bash
  gcloud run services get-iam-policy <SERVICE_NAME> \
    --region=asia-southeast1 --project=prj-gc-npr-temai-rtai-01
  ```
  If you see `members: - allUsers / role: roles/run.invoker`, you're set.
- ❗ **Do NOT put `--allow-unauthenticated` in `cloudbuild.yaml`.** On a policy-restricted project it triggers a blocked IAM write and a noisy `Setting IAM policy failed` warning on every build. Omitting it means the deploy never touches IAM, preserving the grandfathered `allUsers` binding.
- ❌ **Do NOT remove `allUsers` from a grandfathered service to "test" re-adding it** — you won't be able to add it back, and you'll lose public access permanently.

### If you genuinely need public access on a NEW service:
The policy-compliant path is an **External HTTPS Load Balancer → Serverless NEG → IAP** (Identity-Aware Proxy authenticates `@yourdomain` users in-browser). Otherwise, ask an **org admin** to relax/exempt the policy.

---

## Step 5 — Lock the service name (avoid service sprawl)

**The #1 mistake:** naming the deploy target with the built-in `${REPO_NAME}`. That resolves to your *repo's name*, so changing repos/triggers spawns a **brand-new service each time** (e.g. `rcr`, `rcr-app`, `rcr-github`) — and you end up staring at a URL your pipeline never deploys to.

**Fix:** hard-code a fixed `_SERVICE_NAME` substitution and deploy to `${_SERVICE_NAME}` (as in Step 2c). Then **every** build updates the same service and the same URL.

> If you omit the service name entirely in `gcloud run deploy`: in Cloud Build (non-interactive) it **fails** ("argument [SERVICE]: Must be specified"); interactively it prompts and defaults to the **image** name's last segment — never the URL/repo you expect. Always specify it.

---

## Verification & Debugging

**Confirm which service runs what (ends confusion fast):**
```bash
gcloud run services list \
  --region=asia-southeast1 --project=prj-gc-npr-temai-rtai-01 \
  --format="table(metadata.name, status.url, status.latestReadyRevisionName, spec.template.spec.containers[0].image)"
```

**Read container crash logs (when a revision fails to start):**
```bash
gcloud logging read \
  'resource.type="cloud_run_revision" AND resource.labels.service_name="<SERVICE>" AND resource.labels.revision_name="<REVISION>"' \
  --project=prj-gc-npr-temai-rtai-01 --limit=50 --format="value(textPayload)" --freshness=1h
```

### Common errors → causes

| Symptom | Cause | Fix |
|---|---|---|
| `unable to prepare context: path "..." not found` | `docker build` context points at a non-existent folder | Point context at the Dockerfile's folder |
| `[UNRESOLVED_ENTRY] Cannot resolve entry module index.html` | Vite entry missing | Ensure `index.html` is at the frontend project root |
| `ERR_DLOPEN_FAILED ... Exec format error` | Host-built native `node_modules` copied into image | `.dockerignore` `**/node_modules`; `rm -rf node_modules && npm install` after COPY |
| `container failed to start and listen on PORT=8080` | App not listening on `process.env.PORT`, or native dep crash at require | Listen on `PORT`; add `apk add python3 make g++`; check logs |
| `Setting IAM policy failed ... allUsers` | Org policy blocks public binding | Deploy into a grandfathered-public service; drop `--allow-unauthenticated` |
| URL shows old/demo app | Build deploys to a different service than the URL you open | Lock `_SERVICE_NAME`; verify with `services list` |

---

## Cleanup — remove orphaned services

After consolidating onto one service, delete the strays so you don't pay for or get confused by duplicates:
```bash
gcloud run services delete <ORPHAN_SERVICE> \
  --region=asia-southeast1 --project=prj-gc-npr-temai-rtai-01
```

---

## Data Persistence Reminder

If the app uses **SQLite** on the container filesystem, **data resets on every restart/redeploy** (ephemeral). For persistence, use **Cloud SQL (PostgreSQL)**:
- App should switch DB backend via a `DATABASE_URL` env var.
- Cloud Run → Cloud SQL connects over a **Unix socket** (`/cloudsql/<conn-name>`), which does **not** use SSL — disable SSL in the client when the connection string contains `/cloudsql/`.
- Deploy with `--add-cloudsql-instances=<PROJECT>:<REGION>:<INSTANCE>` and set `DATABASE_URL=postgresql://USER:PASS@/DB?host=/cloudsql/<conn-name>`.
- The Cloud Run runtime SA needs `roles/cloudsql.client`.
