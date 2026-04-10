/**
 * Deploy Firestore rules + indexes using a service account (same as Vercel).
 *
 * Loads web/.env and web/.env.local (Next.js-style: .env.local overrides .env).
 * Plain `node` does not read .env files — that is why deploy failed when the JSON
 * lived only in .env.local. Shell-set FIREBASE_SERVICE_ACCOUNT_JSON still wins.
 *
 * Fallback: GOOGLE_APPLICATION_CREDENTIALS → read JSON from that file path.
 *
 * Usage (from web/): npm run firebase:deploy:firestore
 */

const { writeFileSync, mkdtempSync, readFileSync, existsSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join, isAbsolute } = require("node:path");
const { spawnSync } = require("node:child_process");

const root = join(__dirname, "..");

/** Preserve credential if user exported it in the shell before npm run. */
const shellServiceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

try {
  const dotenv = require("dotenv");
  dotenv.config({ path: join(root, ".env") });
  dotenv.config({ path: join(root, ".env.local"), override: true });
} catch (e) {
  console.warn(
    "[deploy-firestore] dotenv:",
    e instanceof Error ? e.message : e
  );
}

if (shellServiceAccountJson && String(shellServiceAccountJson).trim()) {
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON = shellServiceAccountJson;
}

let json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!json || !String(json).trim()) {
  const pathCandidates = [
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
  ].filter(Boolean);
  for (const p of pathCandidates) {
    if (!p) continue;
    const resolved = isAbsolute(p) ? p : join(root, p);
    if (existsSync(resolved)) {
      try {
        json = readFileSync(resolved, "utf8");
        if (String(json).trim()) break;
      } catch {
        /* next */
      }
    }
  }
}

if (!json || !String(json).trim()) {
  console.error(
    "Missing service account credentials.\n\n" +
      "Fix one of:\n" +
      "  • Add FIREBASE_SERVICE_ACCOUNT_JSON to web/.env.local (same as Vercel), then run from web/.\n" +
      "  • Or PowerShell: $env:FIREBASE_SERVICE_ACCOUNT_JSON = Get-Content .\\path\\key.json -Raw\n" +
      "  • Or set FIREBASE_SERVICE_ACCOUNT_PATH or GOOGLE_APPLICATION_CREDENTIALS to the key file path.\n\n" +
      "Note: Next.js loads .env.local for `next dev`/`next build`, but this script needed dotenv — now fixed."
  );
  process.exit(1);
}

let project = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
if (!project) {
  const rcPath = join(root, ".firebaserc");
  if (existsSync(rcPath)) {
    try {
      const rc = JSON.parse(readFileSync(rcPath, "utf8"));
      project = rc.projects?.default;
    } catch {
      /* ignore */
    }
  }
}
if (!project) {
  console.error(
    "Set FIREBASE_PROJECT_ID or NEXT_PUBLIC_FIREBASE_PROJECT_ID, or add default in .firebaserc"
  );
  process.exit(1);
}

const dir = mkdtempSync(join(tmpdir(), "fb-deploy-"));
const credPath = join(dir, "sa.json");
writeFileSync(credPath, String(json).trim(), "utf8");

const env = { ...process.env, GOOGLE_APPLICATION_CREDENTIALS: credPath };
const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const r = spawnSync(
  npx,
  [
    "--yes",
    "firebase-tools@13.35.1",
    "deploy",
    "--only",
    "firestore,storage",
    "--project",
    project,
    "--non-interactive",
  ],
  { stdio: "inherit", env }
);
process.exit(r.status ?? 1);
