# RCR App — Overview

A web app used at PTTGC plants (branded "GC RCR Portal") to create, track, and approve **RCR** (Repair/Weld QC) requests for piping repairs — the paperwork that documents material verification, welding, NDT (non-destructive testing), PWHT (post-weld heat treatment), and pressure testing for a pipe repair, so it can be traced back to the right piping-class standard and signed off by an approver.

## What the app does

1. **Dashboard** (`src/components/Dashboard.tsx`) — shows total requests, active plants, pending-approval count, and a pie chart of requests by plant.
2. **New/Edit Request form** (`src/components/RcrForm.tsx`) — the core workflow:
   - Engineer picks a **Plant**, **Piping Class**, and **AR2 Line Class**.
   - The form looks these up in a pre-built reference dataset (`src/data.json`, curated from the `GC6/Standard RCR/RCR-STD-*.xlsx` and `RCR Index` spreadsheets) and **auto-fills** material, P-No., NDT requirements (RT/UT/MPI/DPI/HT/PMI), PWHT need, rating, design temp/pressure, and test pressure.
   - A built-in rule engine (`getPwhtWarning`) flags when PWHT is mandatory based on P-No. and thickness (e.g. P-No. 1 over 19 mm, P91 always, etc.) per welding-code practice.
   - A fixed **6-section QA/QC checklist** (`src/checklistData.ts`) — document/material verification, before/during/after welding, pressure test, final completion — each item tracked by QC hold-point (H/W), inspector role, yes/NA, and remarks.
   - The relevant **WPS (Welding Procedure Specification) PDF** is selected from `src/wps_files.json` and referenced by filename only (the PDF itself isn't parsed).
   - Supports **print-to-PDF** of the completed, approved form (`?print=true` opens a print-formatted view).
3. **Manage Requests** (`src/components/ManageRequests.tsx`) — list, edit, delete, and **approve** requests (approver name is captured and timestamped).
4. **Backend API** (`server/index.js`) — a small Express REST API (`GET/POST/PUT/DELETE /api/requests`) backed by `server/db.js`.

## Architecture

```
Browser (React SPA)  ──Axios──▶  Express API  ──▶  Firestore (collection "requests")
      │
      └─ static files served by the same Express server in production
```

- **Frontend**: React 19 + TypeScript, Vite build, React Router (client-side routes: `/`, `/forms/new`, `/forms/edit/:id`, `/forms`), Recharts for the dashboard chart, Lucide for icons, plain CSS (`glass`-morphism cards, print stylesheet via `hide-on-print`).
- **Backend**: Express 5, CORS, body-parser; a thin data-access module (`db.js`) is the only place that talks to the database — routes stay database-agnostic.
- **Database**: Google Cloud Firestore (migrated from SQLite → planned Postgres → Firestore; see `implementation_plan.md` for the abandoned Postgres path). Auth to Firestore uses Cloud Run's runtime service account (Application Default Credentials) — no key file in the image.
- **Deployment**: Docker multi-stage build → Google Cloud Run (`asia-southeast1`), image pushed to Artifact Registry, deployed via `cloudbuild.yaml` / manual Cloud Shell steps (see `DEPLOYMENT_GUIDE.md`, `GCP_DEPLOYMENT_PLAYBOOK.md`).

## Techniques & principles used

- **Data-driven auto-fill / lookup tables instead of hard-coded branching** — `data.json` encodes plant → piping-class → AR2-class → process-detail mappings, so adding a new piping class is a data change, not a code change.
- **Declarative checklist schema** — `CHECKLIST_ITEMS` is a typed array of item definitions (id, category, label, input type, default QC/inspector, optional `bindTo`) that drives both the rendered form and the initial-state generator (`getInitialChecklistState`), rather than 30 hand-written form fields.
- **Thin backend, database abstraction layer** — `server/index.js` never touches Firestore directly; `db.js` exposes `getAllRequests/getRequest/createRequest/updateRequest/approveRequest/deleteRequest`. This is the same seam that previously let the app swap SQLite ↔ Postgres ↔ Firestore without touching route handlers.
- **Field allow-listing on write** (`pickFields` in `db.js`) — only known fields are persisted, so stray client fields can't pollute documents (defense against overposting).
- **Server-authoritative status transitions** — `status`, `approver_name`, and `approved_date` are only ever set by the `/approve` endpoint, not accepted verbatim from the edit form.
- **SPA + single static-file server** — Vite build output (`dist/`) is served by the same Express app, with a catch-all route returning `index.html` for client-side routing; avoids a separate static host.
- **Environment-based config, not code branching** — `import.meta.env.DEV` picks `localhost:3001` vs relative `/api`; `FIRESTORE_DATABASE_ID` picks the Firestore database; both let the same build run in dev and prod.
- **Print as a first-class view** rather than a separate PDF-generation library — a `print=true` query param plus print CSS turns the same form into a printable approval record.
- **Containerized, stateless backend** so it fits Cloud Run's request-scoped compute model — all state lives in Firestore, not on local disk (an explicit fix for the earlier SQLite-on-ephemeral-storage problem).

## Ways to improve

- **No authentication/authorization** — anyone with network access can create, edit, delete, or approve requests; "approver name" is a free-text `window.prompt()`, not tied to an identity. Add real auth (e.g. Google Identity-Aware Proxy or Firebase Auth) and check role before allowing approve/delete.
- **No server-side validation** — the API trusts whatever the client sends (beyond field allow-listing); a malformed or missing required field (plant, piping class) isn't rejected. Add schema validation (e.g. zod) in `server/index.js`.
- **No automated tests** — `server/package.json`'s test script is a stub, and there's no frontend test suite. At minimum, add API integration tests against a Firestore emulator and a few component tests for the PWHT/auto-fill logic, since that's the part most likely to silently produce a wrong QC outcome.
- **Business rules only live in the frontend** — `getPwhtWarning` and the checklist defaults are TypeScript in `RcrForm.tsx`; a non-browser client (or a tampered request) can bypass them. Consider re-deriving/verifying critical safety fields (PWHT requirement) server-side before saving.
- **`any[]` typed API responses** (`useState<any[]>` in Dashboard/ManageRequests) — define shared TypeScript types for the request document (mirroring `FIELDS` in `db.js`) and share them between client and server, or generate from a single schema.
- **No optimistic concurrency / audit trail** — concurrent edits can silently overwrite each other, and there's no history of who changed what when (only `created_at`/`updated_at`). Consider a subcollection of change events, or Firestore document versioning.
- **No pagination** on `getAllRequests` — `orderBy('created_at').get()` fetches the whole collection; fine at low volume, but will need `limit()`/cursor pagination as usage grows across plants.
- **No file attachments** — WPS PDFs and NDT/RT reports are referenced by filename only, not uploaded/stored; wiring in Cloud Storage would let inspectors attach the actual radiograph/report per request.
- **CI/CD is partially broken** — per project history, the Cloud Build trigger needs an IAM grant (`iam.serviceAccountUser`) the team doesn't currently have, so deploys are manual via Cloud Shell. Fixing the trigger (or moving to GitHub Actions with Workload Identity Federation) would remove a manual, error-prone step.
- **Public access is fragile** — the app is only reachable because one Cloud Run service has a grandfathered public IAM binding predating an org policy; a proper fix is a Load Balancer + IAP (or getting the org policy relaxed) instead of relying on a binding that can't be recreated if it's ever lost.
- **UX polish** — replace `window.confirm`/`window.prompt`/`alert` (ManageRequests) with proper modal dialogs and toast notifications; add loading/error states instead of `console.error` on fetch failure.
- **Accessibility** — the checklist and dashboard use a lot of inline styles and icon-only buttons (e.g. edit/delete/approve icons) with only `title` attributes; add proper `aria-label`s and keyboard navigation checks.
