/**
 * Monorepo: Vercel project root is the repo root, but `next build` runs in `web/`.
 * Copy Next.js output + static public assets to repo root so Vercel's Next.js
 * runtime finds `.next` / `public` (avoids "Output Directory public" / wrong preset).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`[sync-web-to-root] skip missing: ${src}`);
    return;
  }
  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(src, dest, { recursive: true });
}

copyDir(path.join(root, "web", ".next"), path.join(root, ".next"));
copyDir(path.join(root, "web", "public"), path.join(root, "public"));
console.log("[sync-web-to-root] copied web/.next → .next, web/public → public");
