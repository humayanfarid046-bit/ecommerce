"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import {
  findRedirectForPath,
  getSeoAnalytics,
} from "@/lib/seo-analytics-storage";

/**
 * Demo 301-style redirects from admin (client-side). Production: edge config / server redirects.
 */
export function ClientRedirectHandler() {
  const pathname = usePathname() ?? "";
  const router = useRouter();

  useEffect(() => {
    const target = findRedirectForPath(pathname, getSeoAnalytics().redirects);
    if (!target) return;
    router.replace(target);
  }, [pathname, router]);

  return null;
}
