/**
 * Deploy Firestore rules + indexes using FIREBASE_SERVICE_ACCOUNT_JSON from the environment
 * (same value as Vercel — paste into the shell or load from a JSON file).
 *
 * Usage (PowerShell, from web/):
 *   $env:FIREBASE_SERVICE_ACCOUNT_JSON = Get-Content C:\path\service-account.json -Raw
 *   $env:FIREBASE_PROJECT_ID = "your-project-id"   # optional if .firebaserc has default
 *   npm run firebase:deploy:firestore
 */

const { writeFileSync, mkdtempSync, readFileSync, existsSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const { spawnSync } = require("node:child_process");

const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!json || !String(json).trim()) {
  console.error(
    "Missing FIREBASE_SERVICE_ACCOUNT_JSON.\n" +
      "Example (PowerShell): $env:FIREBASE_SERVICE_ACCOUNT_JSON = Get-Content .\\sa.json -Raw\n" +
      "Then: npm run firebase:deploy:firestore"
  );
  process.exit(1);
}

let project = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
if (!project) {
  const rcPath = join(__dirname, "..", ".firebaserc");
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
  console.error("Set FIREBASE_PROJECT_ID or NEXT_PUBLIC_FIREBASE_PROJECT_ID, or add default in .firebaserc");
  process.exit(1);
}

const dir = mkdtempSync(join(tmpdir(), "fb-deploy-"));
const credPath = join(dir, "sa.json");
writeFileSync(credPath, String(json).trim(), "utf8");

const env = { ...process.env, GOOGLE_APPLICATION_CREDENTIALS: credPath };
const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const r = spawnSync(
  npx,
  ["--yes", "firebase-tools@latest", "deploy", "--only", "firestore", "--project", project, "--non-interactive"],
  { stdio: "inherit", env }
);
process.exit(r.status ?? 1);
