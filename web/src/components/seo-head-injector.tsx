"use client";

import { useEffect, useState } from "react";
import { getCms } from "@/lib/cms-storage";

export function SeoHeadInjector() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const fn = () => setTick((x) => x + 1);
    window.addEventListener("lc-cms", fn);
    return () => window.removeEventListener("lc-cms", fn);
  }, []);

  useEffect(() => {
    void tick;
    const { seo } = getCms();
    if (seo.metaTitle.trim()) {
      document.title = seo.metaTitle.trim();
    }
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    if (seo.metaDesc.trim()) {
      meta.setAttribute("content", seo.metaDesc.trim());
    }
    let link = document.querySelector('link[rel="icon"]');
    if (seo.faviconUrl.trim()) {
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "icon");
        document.head.appendChild(link);
      }
      link.setAttribute("href", seo.faviconUrl.trim());
    }
    let og = document.querySelector('meta[property="og:image"]');
    if (seo.ogImageUrl.trim()) {
      if (!og) {
        og = document.createElement("meta");
        og.setAttribute("property", "og:image");
        document.head.appendChild(og);
      }
      og.setAttribute("content", seo.ogImageUrl.trim());
    }
  }, [tick]);

  return null;
}
