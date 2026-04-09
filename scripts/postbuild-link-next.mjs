import { existsSync, rmSync, symlinkSync, cpSync } from "node:fs";
import { resolve } from "node:path";

const rootNext = resolve(".next");
const webNext = resolve("web", ".next");

if (!existsSync(webNext)) {
  console.error("postbuild-link-next: web/.next not found");
  process.exit(1);
}

try {
  if (existsSync(rootNext)) {
    rmSync(rootNext, { recursive: true, force: true });
  }
  const type = process.platform === "win32" ? "junction" : "dir";
  symlinkSync(webNext, rootNext, type);
  console.log("postbuild-link-next: linked .next -> web/.next");
} catch (err) {
  // Fallback if symlink is restricted in the build environment.
  cpSync(webNext, rootNext, { recursive: true });
  console.log("postbuild-link-next: copied web/.next to .next");
  if (err instanceof Error) {
    console.warn(`postbuild-link-next: symlink failed: ${err.message}`);
  }
}
