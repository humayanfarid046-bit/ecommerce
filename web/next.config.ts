import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

/** Directory containing this config (`web/`). Must match `turbopack.root` to avoid local/Turbopack warnings. */
const webRoot = path.dirname(fileURLToPath(import.meta.url));

/** Vercel serverless expects default `.next` layout; `standalone` breaks post-build (ENOENT routes-manifest-*.json). */
const isVercel = Boolean(process.env.VERCEL);

const nextConfig: NextConfig = {
  outputFileTracingRoot: webRoot,
  turbopack: {
    root: webRoot,
  },
  /** Docker / `node server.js` only — not used on Vercel (see web/Dockerfile). */
  ...(!isVercel ? { output: "standalone" as const } : {}),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
