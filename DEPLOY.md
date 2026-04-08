# Deployment guide

## Architecture

| Part | Stack | Suggested hosting |
|------|--------|-----------------|
| Storefront + App Router APIs (incl. Razorpay webhooks) | Next.js (`web/`) | **Vercel** (recommended) or Docker |
| Database | **Firestore** (Firebase project) | Same Firebase project everywhere |
| Optional REST API | Express (`server/`) | **Railway**, **Render**, **Fly.io**, or Docker (same VPS as `web` via Compose) |
| Secrets | Firebase, Razorpay, admin | Provider env vars (never commit `.env`) |

**Single reference for env layout:** repo root **[`.env.example`](./.env.example)** (how `web/`, `server/`, and Firebase fit together).

---

## 1. Deploy Next.js on Vercel (primary path)

This app is meant to run **entirely on Vercel** from the `web/` folder: UI, App Router, **Firestore**, and **Razorpay** API routes + webhooks live in the same deployment. The optional Express `server/` is only if you want a separate REST host.

**Monorepo rule:** the Vercel project **Root Directory** must be **`web`**. If the project root is the **repository** root, the Next.js output is `web/.next`, but Vercel looks for `.next` at the project root → **Routes Manifest Could Not Be Found**, wrong Lambdas, or *No Next.js version detected*. There is **no** repo-root `vercel.json` by design; configuration lives in [`web/vercel.json`](./web/vercel.json).

### One-time setup

1. Push the repo to **GitHub** (or GitLab / Bitbucket supported by Vercel).
2. [Vercel](https://vercel.com) → **Add New Project** → import the repo.
3. **Settings → General → Root Directory:** **`web`** → Save.
4. **Build & Development Settings:** **Framework Preset** = Next.js (auto). **Build Command** = `npm run build` (default). **Install Command** = `npm ci` (from [`web/vercel.json`](./web/vercel.json)). **Output Directory:** leave **empty**. **Do not** override Build with `npm run build --prefix web` (that is only for CLI builds from the repo root; with Root Directory `web` it would look for `web/web/`).
5. **Node.js:** `web/.nvmrc` pins **20** (matches `package.json` `engines`).

Local monorepo build from repo root: `npm run build` runs `npm ci --prefix web && npm run build --prefix web` (see root [`package.json`](./package.json)).

### Troubleshooting: “Routes Manifest Could Not Be Found”

1. **Root Directory** must be **`web`**, not the repo root. Redeploy after saving.
2. Clear **Output Directory** in project settings (must be empty for Next.js unless you changed `distDir` in `next.config`).
3. Remove any **Build Command** override that builds only from the monorepo root without `cd web`.

### Environment variables (Vercel → Project → Settings → Environment Variables)

Copy names from [`web/.env.example`](./web/.env.example). Minimum for a working store + payments:

| Variable | Environment | Notes |
|----------|-------------|--------|
| `NEXT_PUBLIC_FIREBASE_*` (all 6) | Production (and Preview if you test there) | Production Firebase **Web** app |
| `NEXT_PUBLIC_SITE_URL` | Production | `https://your-project.vercel.app` or custom domain (update after first deploy) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Production | Razorpay **Live** key id for go-live |
| `RAZORPAY_KEY_SECRET` | Production only | Server-only; never `NEXT_PUBLIC_*` |
| `RAZORPAY_WEBHOOK_SECRET` | Production | Same secret as Razorpay webhook config |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Production | Single-line JSON — needed for server-side Firestore admin routes |
| `NEXT_PUBLIC_PRIVACY_POLICY_URL` etc. | Production | Optional; external policy URLs for Razorpay |
| `NEXT_PUBLIC_API_URL` | Production | **Leave empty** if you only use Next.js APIs on Vercel. Set only if you also host the Express API elsewhere |

Optional: `ADMIN_PASSWORD`, `ADMIN_SESSION_TOKEN`, `NEXT_PUBLIC_ENABLE_DEMO_ADMIN_FEATURES` — see `web/.env.example`.

### After deploy

1. Set **`NEXT_PUBLIC_SITE_URL`** to your live URL and **Redeploy** (so sitemap and absolute links are correct).
2. **Firebase Console** → Authentication → **Authorized domains** → add your Vercel host and custom domain.
3. **Razorpay Dashboard** → Webhooks → URL: `https://<your-domain>/api/razorpay/webhook` (path must match your app; verify in repo under `web/src/app/api/razorpay/`).
4. If you use the separate Express API, set **`CORS_ORIGIN`** there to your Vercel URL.
5. **Firestore (rules + indexes):** From `web/`, run `npx firebase deploy --only firestore` (requires `web/.firebaserc` and `firebase login`), **or** push changes to `web/firestore.rules` / `web/firestore.indexes.json` on `main`/`master` with GitHub Secrets **`FIREBASE_PROJECT_ID`** and **`FIREBASE_SERVICE_ACCOUNT_JSON`** so [`.github/workflows/firestore-deploy.yml`](./.github/workflows/firestore-deploy.yml) can deploy automatically.
6. **Server-side Firestore:** Set **`FIREBASE_SERVICE_ACCOUNT_JSON`** on Vercel (same JSON as the Firebase service account). Without it, admin APIs that use the Admin SDK will not read/write Firestore (often `503`).

### Vercel project config in repo

- [`web/vercel.json`](./web/vercel.json) — `npm ci`, **region `bom1` (Mumbai)**. Edit `regions` if you want another region.

---

## 2. Deploy Express API

### Option A — Docker (any cloud / VPS)

From repo root:

```bash
docker build -t ecom-api ./server
docker run -p 4000:4000 --env-file server/.env ecom-api
```

`server/.env` must include Firebase Admin (`FIREBASE_*` or `GOOGLE_APPLICATION_CREDENTIALS`) and:

```env
PORT=4000
NODE_ENV=production
CORS_ORIGIN=https://your-app.vercel.app,https://www.yourdomain.com
```

### Option B — Railway / Render

- **Root directory / build:** `server`
- **Start command:** `npm start` or `node src/index.js`
- **Port:** set from `PORT` (Render/Railway inject this).

---

## 3. Connect frontend to API

In Vercel env:

```env
NEXT_PUBLIC_API_URL=https://your-api.up.railway.app
```

Redeploy the Next.js app after changing this.

---

## 4. Full stack with Docker Compose (VPS)

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Uncomment and set `env_file` paths in `docker-compose.prod.yml`, or pass env via your host.

---

## 5. GitHub Actions CI

`.github/workflows/ci.yml` builds `web` on push/PR.  
To build with real Firebase keys, add repository **Secrets** and extend the workflow `env` block (see `ci.yml` comments).

### Firestore rules & indexes (automatic sync)

When you push changes to **`web/firestore.rules`** or **`web/firestore.indexes.json`** on `main`/`master`, **`.github/workflows/firestore-deploy.yml`** runs and deploys them to Firebase — if you configure:

| Secret | Value |
|--------|--------|
| `FIREBASE_PROJECT_ID` | Same as your Firebase project id |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Full JSON of a service account with permission to deploy Firestore (Project → IAM or use the same JSON as Vercel’s `FIREBASE_SERVICE_ACCOUNT_JSON` if it has the right roles) |

If these secrets are **missing**, the workflow **skips** (does not fail) so forks and early setups still work.

Project layout and when to edit rules vs indexes: **[docs/PROJECT_STRUCTURE.md](./docs/PROJECT_STRUCTURE.md)**.

---

## 6. Checklist before go-live

Use the full apply-ready checklist (env, Firestore `accessScope`, backup, webhooks, health checks, security notes):

**[PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)**

Short version:

- [ ] Production Firebase project + Auth authorized domains  
- [ ] Razorpay **Live** keys + webhook URL on your domain + `RAZORPAY_WEBHOOK_SECRET`  
- [ ] `CORS_ORIGIN` includes only your real site URLs (Express API)  
- [ ] `FIREBASE_SERVICE_ACCOUNT_JSON` on Vercel if you use server-side Firestore admin routes  
- [ ] Staff `accessScope` set in Firestore (`owner` / `operations` / `catalog`) — see checklist §2  
- [ ] `NEXT_PUBLIC_ENABLE_DEMO_ADMIN_FEATURES` **unset** unless you need misleading demo buttons on production (catalog/CMS work without it)  
- [ ] HTTPS everywhere (Vercel/Railway provide TLS)
