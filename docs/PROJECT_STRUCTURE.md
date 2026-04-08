# Project structure — কোথায় কী হয়

Monorepo root (`E COMMERC`):

| Path | ভূমিকা |
|------|--------|
| **`web/`** | **মূল প্রোডাক্ট** — Next.js স্টোরফ্রন্ট, App Router, **Firestore ক্লায়েন্ট**, চেকআউট, **Razorpay API routes** (`/api/razorpay/*`), অ্যাডমিন। **Vercel এ এখান থেকেই deploy।** |
| **`server/`** | ঐচ্ছিক Express API — আলাদা হোস্টে চালালে `NEXT_PUBLIC_API_URL` দিয়ে যুক্ত করো। স্টোর চালাতে বাধ্যতামূলক নয়। |
| **`legal-pages/`** | স্ট্যাটিক policy HTML (Netlify ইত্যাদিতে হোস্ট করতে পারো)। |
| **`docs/`** | এই ফাইলসহ অপারেশন নোট। |

## ডাটাবেস (Firestore)

- **কোথায়:** একই Firebase প্রোজেক্ট — ব্রাউজারে **ক্লায়েন্ট SDK** (`web/src/lib/*-firestore.ts`) + সার্ভারে **Admin SDK** (`web/src/lib/firebase-admin.ts`, API routes)।
- **পাথ লেআউট** এক সূত্রে: `web/src/lib/firebase/collections.ts` — **`web/firestore.rules` এর সাথে মিল রাখতে হবে।**

### ক্লায়েন্ট-সাইড (লগইন ইউজার)

`users/{uid}/orders/{orderId}` — অর্ডার  
`users/{uid}/profile/{account|addresses|cart|compare|paymentHistory|recentlyViewed|wishlist}`  
`users/{uid}/wallet/snapshot` — ওয়ালেট  

### অ্যাডমিন / সার্ভার

`FIREBASE_SERVICE_ACCOUNT_JSON` থাকলে Admin rules বাইপাস করে অর্ডার PATCH, `collectionGroup("orders")` lookup ইত্যাদি।

### প্রোডাক্ট ক্যাটালগ (অ্যাডমিন উইজার্ড / বাল্ক ইমপোর্ট)

- **লোকাল:** ব্রাউজার **`localStorage`** (`lc_store_catalog_v1`)।
- **শেয়ার্ড (সব ইউজার):** অ্যাডমিন প্রোডাক্ট সেভ করলে **`POST /api/admin/catalog`** ফায়ারস্টোর `publicCatalog/manifest` এ মেটাডেটা লিখে (বড় `data:` ইমেজ স্ট্রিপ) — স্টোর **`GET /api/catalog`** দিয়ে মার্জ করে। নতুন **`web/firestore.rules`** এ `publicCatalog` পাথের রিড পাবলিক — **পুশের পর `firebase deploy --only firestore:rules`** করতে হবে।
- পূর্ণ রেজোলিউশন ছবি সব ডিভাইসে একই রাখতে পরে **CDN URL** বা স্টোরেজ আপলোড যোগ করা যায়।

## কখন কী করবে

| কাজ | কোথায় |
|-----|--------|
| নতুন Firestore কুয়েরি (where + orderBy একসাথে) | `web/firestore.indexes.json` + deploy |
| কোন পাথে রিড/রাইট allowed | `web/firestore.rules` + deploy |
| কোডে নতুন `profile/` ডক আইডি | `collections.ts` + `firestore.rules` (`allowedProfileDoc`) |
| GitHub push এ rules/indexes auto sync | `.github/workflows/firestore-deploy.yml` + GitHub **Secrets** (নিচে) |

## GitHub থেকে automatic Firestore sync

1. Repo → **Settings → Secrets and variables → Actions → New repository secret**
2. **`FIREBASE_PROJECT_ID`** — Firebase প্রোজেক্ট আইডি  
3. **`FIREBASE_SERVICE_ACCOUNT_JSON`** — সার্ভিস অ্যাকাউন্ট JSON পুরোটা (এক লাইনে বা মাল্টিলাইন)

`main`/`master` এ `web/firestore.rules` বা `web/firestore.indexes.json` পরিবর্তন push করলে workflow চালু হবে। Secret না থাকলে job **skip** (error দেবে না)।

লোকাল deploy: `cd web && npx firebase deploy --only firestore` (`.firebaserc` লাগবে)।
