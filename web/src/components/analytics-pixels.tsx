"use client";

import { useEffect, useState } from "react";
import { getSeoAnalytics } from "@/lib/seo-analytics-storage";

/**
 * Injects Facebook Pixel + GTM when IDs are set in admin SEO storage.
 */
export function AnalyticsPixels() {
  const [fb, setFb] = useState("");
  const [gtm, setGtm] = useState("");

  useEffect(() => {
    const sync = () => {
      const s = getSeoAnalytics();
      setFb(s.facebookPixelId.trim());
      setGtm(s.gtmContainerId.trim());
    };
    sync();
    window.addEventListener("lc-seo-analytics", sync);
    return () => window.removeEventListener("lc-seo-analytics", sync);
  }, []);

  useEffect(() => {
    const id = fb.replace(/\D/g, "");
    if (!id || document.getElementById("fb-pixel-demo")) return;
    const s = document.createElement("script");
    s.id = "fb-pixel-demo";
    s.async = true;
    s.src = "https://connect.facebook.net/en_US/fbevents.js";
    s.onload = () => {
      window.setTimeout(() => {
        const w = window as unknown as { fbq?: (...a: unknown[]) => void };
        if (typeof w.fbq === "function") {
          w.fbq("init", id);
          w.fbq("track", "PageView");
        }
      }, 0);
    };
    document.head.appendChild(s);
  }, [fb]);

  useEffect(() => {
    const gtmId = gtm.trim();
    if (!gtmId.startsWith("GTM-") || document.getElementById("gtm-demo")) return;
    const s = document.createElement("script");
    s.id = "gtm-demo";
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`;
    document.head.appendChild(s);
  }, [gtm]);

  return null;
}
