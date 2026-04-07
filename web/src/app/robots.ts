import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/sitemap-build";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin", "/bn/admin"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
