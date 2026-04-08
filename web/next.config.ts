import path from "path";
import { fileURLToPath } from "url";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Monorepo root (parent of `web/`). Matches outputFileTracingRoot so Turbopack + tracing agree on Vercel. */
const monorepoRoot = path.resolve(__dirname, "..");

const nextConfig: NextConfig = {
  /** Self-hosted Docker: copy `.next/standalone` + static assets (see web/Dockerfile). */
  output: "standalone",
  outputFileTracingRoot: monorepoRoot,
  turbopack: {
    root: monorepoRoot,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
