import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

/** Directory containing this config (`web/`). */
const webRoot = path.dirname(fileURLToPath(import.meta.url));

/** Vercel: default `.next` layout; skip monorepo tracing roots (can confuse output paths if project root ≠ `web/`). */
const isVercel = Boolean(process.env.VERCEL);

const nextConfig: NextConfig = {
  /** Local/Docker: align tracing + Turbopack with `web/` as app root. */
  ...(isVercel
    ? {
        /** Monorepo: parent folder so tracing matches repo root (multiple lockfiles). Does not move `.next`. */
        outputFileTracingRoot: path.join(webRoot, ".."),
      }
    : {
        outputFileTracingRoot: webRoot,
        turbopack: { root: webRoot },
        output: "standalone" as const,
      }),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "api.qrserver.com", pathname: "/**" },
    ],
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
