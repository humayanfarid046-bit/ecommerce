# Production checklist (apply-ready)

এই ডকটি deploy করার আগে **env, Firestore রোল, ব্যাকআপ, webhook, health** একসাথে যাচাই করার জন্য। প্রযুক্তিগত বিবরণ ইংরেজিতে রাখা হয়েছে যাতে টিম/হোস্টিং ডকের সাথে মিলে।

---

## 0. Architecture snapshot

| Area | What runs where |
|------|-----------------|
| Storefront | Next.js `web/` (e.g. Vercel) |
| Optional REST API | Express `server/` (e.g. Railway/Docker) — `GET /health`, `/api/me` |
| Auth + DB | Firebase Auth + Firestore |
| Payments | Razorpay (Checkout + server routes under `web/src/app/api/razorpay/`) |

---

## 1. Environment variables

### 1.1 Next.js (`web/`) — Vercel / Docker

Copy from [`web/.env.example`](./web/.env.example) into the host’s env UI (never commit real secrets).

| Variable | Required for | Notes |
|----------|----------------|-------|
| `NEXT_PUBLIC_FIREBASE_*` (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId) | Sign-in, Firestore client | Production Firebase **Web app** config |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Checkout / wallet Razorpay UI | Use **Live** key ID for production |
| `RAZORPAY_KEY_SECRET` | `/api/razorpay/*` server routes | **Server-only**; never expose to browser |
| `RAZORPAY_WEBHOOK_SECRET` | `POST /api/razorpay/webhook` | Must match Razorpay Dashboard → Webhooks |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Firebase Admin in Next (order PATCH, lookup, token verify) | **Single-line JSON** string of the service account, or use host “secret file” pattern |
| `NEXT_PUBLIC_API_URL` | Account → “Backend API” card | e.g. `https://your-api.example.com` (no trailing slash) |
| `NEXT_PUBLIC_SITE_URL` | Sitemap / canonical-style URLs | Your public site origin, e.g. `https://www.yourdomain.com` |
| `NEXT_PUBLIC_ENABLE_DEMO_ADMIN_FEATURES` | Misleading **fake** admin buttons (courier/WhatsApp demo, bulk demo, “simulate campaign” stat bump) | **Omit or `false` in production** unless you want those buttons. Does **not** disable catalog, CMS, support, or coupons. |

Optional / legacy:

| Variable | Notes |
|----------|--------|
| `ADMIN_SESSION_TOKEN`, `ADMIN_PASSWORD` | Used by `POST /api/admin/auth` (legacy cookie login). Primary staff access is Firebase sign-in + `accessScope` in Firestore (see §2). |

**Generate safe values:**

- `RAZORPAY_WEBHOOK_SECRET`: long random string; paste the **same** value in Razorpay Dashboard.
- Service account JSON: Firebase Console → Project settings → Service accounts → Generate new private key (store in secrets manager, not git).

### 1.2 Express API (`server/`) — if you deploy it

Copy [`server/.env.example`](./server/.env.example) → `server/.env` on the host.

| Variable | Notes |
|----------|--------|
| `PORT` | Often injected by host (Railway/Render) |
| `CORS_ORIGIN` | Comma-separated **only** your real frontend origins (e.g. `https://your-app.vercel.app,https://www.yourdomain.com`) |
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` **or** `GOOGLE_APPLICATION_CREDENTIALS` | Same Firebase project as the web app |

---

## 2. Firestore roles (`accessScope`) — staff panel

Server-side checks read:

`users/{uid}/profile/account` → field **`accessScope`**

Allowed values (see `web/src/lib/panel-access.ts`):

| `accessScope` | Meaning |
|---------------|---------|
| `owner` | Full merchant console modules |
| `operations` | Orders, payments, support (not catalog-only areas) |
| `catalog` | Products, content, SEO (not orders) |
| missing / other | Treated as `none` → **no** console access |

**How to set (first owner):**

1. Firebase Console → Firestore → `users/{yourUid}/profile/account`
2. Add field `accessScope` (string) = `owner`

**Security warning (important):**

Current Firestore rules allow a signed-in user to **write their own** `profile/account` document. That means a technical user could try to set `accessScope` on themselves unless you harden rules or move role assignment to **Admin SDK only** (Cloud Function / backend). Before scaling to untrusted users:

- Restrict `accessScope` updates to a trusted backend or Cloud Function, **or**
- Use **Firebase Custom Claims** for staff roles and verify in rules/API.

---

## 3. Firebase: rules, indexes, deploy

1. **Rules:** `web/firestore.rules` — deploy after edits:

   ```bash
   cd web
   npx firebase deploy --only firestore:rules
   ```

2. **Indexes:** If queries fail in production with “index required”, deploy `firestore.indexes.json` (if present) or create the index from the error link in Console.

3. **Authorized domains:** Firebase Console → Authentication → Settings → Authorized domains — add your production domain(s) and Vercel URL if used.

---

## 4. Backup & restore

### 4.1 Firestore (Google-managed)

- **Scheduled exports** (recommended for production): use **Firestore managed export** to Cloud Storage (GCP) on a schedule; document bucket name and IAM.
- **Console:** Manual export options depend on your GCP setup; avoid relying only on the Firebase UI for large datasets.

### 4.2 What is *not* in Firestore today

Catalog, CMS, many admin demos use **browser `localStorage`**. That data is **not** backed up server-side. For a personal deploy, either:

- Accept that clearing browser data clears catalog/CMS, or  
- Plan a future migration to server-side product/CMS storage.

### 4.3 Razorpay / payments

- Reconciliation: use Razorpay Dashboard exports + your order IDs in Firestore.
- Webhook payload handling: verify `RAZORPAY_WEBHOOK_SECRET` and signature (already enforced when secret is set).

---

## 5. Webhooks (Razorpay)

1. Dashboard → **Webhooks** → Add URL:  
   `https://<your-domain>/api/razorpay/webhook`
2. Set **`RAZORPAY_WEBHOOK_SECRET`** in Vercel to the **same** secret shown in Razorpay.
3. Subscribe to events you need (e.g. `payment.captured`, `payment.failed`, `refund.processed`).
4. After deploy, use Razorpay “Send test webhook” or a small live test payment in **Test mode** first, then **Live**.

**Note:** If `RAZORPAY_WEBHOOK_SECRET` is set, requests **without** a valid `x-razorpay-signature` are rejected (see `web/src/app/api/razorpay/webhook/route.ts`).

---

## 6. Health checks (smoke tests)

Run these **after** each production deploy.

### 6.1 Next.js site

| Check | Pass criteria |
|-------|----------------|
| Home loads | `200`, no console errors for Firebase config |
| `/login` | Page loads; Firebase sign-in works |
| `/admin` | Redirects or shows console only for users with `accessScope` (see §2) |

### 6.2 Express API (if used)

```bash
curl -sS https://YOUR_API_HOST/health
```

Expect JSON like `{ "ok": true, "service": "ecom-api" }`.

### 6.3 In-app “Backend API” card

With `NEXT_PUBLIC_API_URL` set and user signed in: **Account → Settings** should show API health / session (uses Firebase ID token).

### 6.4 Firestore order tools (optional)

Requires `FIREBASE_SERVICE_ACCOUNT_JSON` on the Next server:

- Staff user signed in → Orders → save tracking with resolved customer UID → should succeed without `503`.

### 6.5 Payments (staging first)

- Use Razorpay **Test** keys on a staging URL before switching Live keys on production.

---

## 7. Operational safety (this repo)

| Topic | Recommendation |
|-------|----------------|
| Misleading demo buttons | Keep **`NEXT_PUBLIC_ENABLE_DEMO_ADMIN_FEATURES` unset** in production if you want to hide fake courier/WhatsApp/bulk/campaign-sim actions (see `web/src/lib/deploy-safety.ts`). Real catalog/CMS still work. |
| Secrets rotation | Rotate Razorpay keys and webhook secret if leaked; update Vercel env and redeploy. |
| HTTPS | Use host TLS (Vercel/Railway default); never ship production over plain HTTP. |

---

## 8. Quick “go / no-go” before launch

- [ ] All `NEXT_PUBLIC_*` and server secrets set on the hosting provider  
- [ ] Firebase authorized domains include production hostname  
- [ ] Firestore rules deployed; at least one staff user has `accessScope: owner` (and you understand §2 security note)  
- [ ] Razorpay Live keys + webhook URL + `RAZORPAY_WEBHOOK_SECRET` aligned  
- [ ] `CORS_ORIGIN` on Express API lists only real front-end URLs  
- [ ] `/health` OK on API; homepage and login OK on web  
- [ ] Backup strategy for Firestore chosen (export schedule or manual process documented)  
- [ ] `NEXT_PUBLIC_ENABLE_DEMO_ADMIN_FEATURES` **unset** unless you need fake demo buttons (courier/bulk/campaign sim) on production  

---

## Related docs

- [DEPLOY.md](./DEPLOY.md) — Vercel root `web/`, Docker, CI pointer  
- [README.md](./README.md) — local dev and monorepo layout  
