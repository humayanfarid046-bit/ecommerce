# Ecommerce monorepo

- **`web/`** — Next.js storefront (frontend), App Router, i18n, Firebase Auth/Firestore, Razorpay API routes.
- **`server/`** — Express API (optional): health check, Firebase ID token verification, CORS for cross-origin calls.
- **`functions/`** — Optional Firebase Cloud Functions (placeholder).

**Data & payments:** Firestore is the main database (via Firebase client + Admin on the server). Razorpay webhooks and order APIs live under `web/src/app/api/` (same deploy as the storefront on Vercel).

**One-page stack map:** see **[`.env.example`](./.env.example)** at the repo root (where to put secrets, how pieces connect).

**Structure + Firestore paths / GitHub auto-deploy:** **[docs/PROJECT_STRUCTURE.md](./docs/PROJECT_STRUCTURE.md)**.

### Vercel (important)

Create the project from this repo, then **Settings → General → Root Directory** = **`web`**. Leave **Output Directory** empty. Do **not** point Build at the repo root only — the Next.js app lives in `web/`, so routes manifest and `.next` must be relative to **`web`**. Full steps: **[DEPLOY.md](./DEPLOY.md)**.

## Prerequisites

- Node.js 18+
- npm

## Install

From the repo root (`E COMMERC`):

```bash
npm install
npm run install:all
```

Or install each package:

```bash
cd web && npm install && cd ../server && npm install
```

## Environment

### Frontend (`web/.env.local`)

Copy [`web/.env.example`](./web/.env.example) to `web/.env.local` and fill:

- Firebase web keys (`NEXT_PUBLIC_FIREBASE_*`)
- **`NEXT_PUBLIC_API_URL=http://localhost:4000`** when the Express API runs locally
- Razorpay, admin secrets as documented in the example file

### Backend (`server/.env`)

Copy `server/.env.example` to `server/.env` and set **Firebase Admin** (same project as the web app):

- Either `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (service account), or  
- `GOOGLE_APPLICATION_CREDENTIALS` pointing to a JSON file path

Without Admin, `/health` still works; `/api/me` and other protected routes return **503**.

## Run locally

**Storefront only** (most common — from repo root):

```bash
npm run dev
```

Next.js listens on **http://127.0.0.1:3000** (also works as `http://localhost:3000`). Prefer opening **`/en`** or **`/bn`** (e.g. `http://127.0.0.1:3000/en`). Do not paste Bangla punctuation into the address bar.

**Frontend + Express API** together:

```bash
npm run dev:stack
```

This starts Next.js on port **3000** and the API on **http://localhost:4000**.

Run services separately:

```bash
npm run dev:web
npm run dev:api
```

## Verify backend from the app

1. Set `NEXT_PUBLIC_API_URL` in `web/.env.local`.
2. Sign in with Firebase.
3. Open **Account → Settings**: the **Backend API** card shows health and session check.

## Build (production)

```bash
npm run build
```

Only builds the Next.js app; deploy the API separately (Node host, or container) with `server/.env` set.

## Deploy (production)

**Vercel (recommended):** import the repo with **Root Directory = `web`**, then add env vars from `web/.env.example`. Step-by-step: **[DEPLOY.md](./DEPLOY.md)** (section *Deploy Next.js on Vercel*).

See **[DEPLOY.md](./DEPLOY.md)** for Docker / optional Express API, and **[PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)** for go-live checks.

- **CI:** GitHub Actions builds `web` on push/PR (`.github/workflows/ci.yml`).

### Run everything on one VPS (Docker)

From repo root:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Or use npm: `npm run docker:up` / `npm run docker:down`. Storefront: port **3000**, API health: **4000/health**.

### Run everything on one VPS (PM2, no Docker)

After `npm run build` in `web/` and `server/.env` configured:

```bash
npm i -g pm2
pm2 start ecosystem.config.cjs
```

### Smoke test (local dev)

With `npm run dev` running:

```bash
npm run stack:health
```
