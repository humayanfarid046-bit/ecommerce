/**
 * Used only by GitHub Actions: write service account JSON to RUNNER_TEMP and verify project_id.
 */
const fs = require("fs");
const path = require("path");

const out = path.join(process.env.RUNNER_TEMP, "firebase-ci.json");
const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!raw || !String(raw).trim()) {
  console.error("::error::FIREBASE_SERVICE_ACCOUNT_JSON is empty");
  process.exit(1);
}
fs.writeFileSync(out, String(raw).trim());

const j = JSON.parse(fs.readFileSync(out, "utf8"));
const want = String(process.env.FIREBASE_PROJECT_ID || "").trim();
if (!j.project_id) {
  console.error("::error::JSON has no project_id");
  process.exit(1);
}
if (j.project_id !== want) {
  console.error(
    "::error::FIREBASE_PROJECT_ID is \"" +
      want +
      '" but JSON project_id is "' +
      j.project_id +
      '". Use the same Firebase project as the service account key.'
  );
  process.exit(1);
}
console.log("OK: credentials written; project_id matches:", want);
