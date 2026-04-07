"use client";

import { useEffect, useState } from "react";
import { getCms } from "@/lib/cms-storage";

export function AnnouncementBar() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const fn = () => setTick((x) => x + 1);
    window.addEventListener("lc-cms", fn);
    return () => window.removeEventListener("lc-cms", fn);
  }, []);

  void tick;
  const { announcement } = getCms();
  if (!announcement.active || !announcement.text.trim()) return null;

  const t = announcement.text;
  return (
    <div className="relative z-40 border-b border-[#0066ff]/20 bg-[#0066ff] text-white">
      <div className="overflow-hidden py-2">
        <div className="announce-marquee-track">
          <span className="px-8 text-xs font-bold md:text-sm">{t}</span>
          <span className="px-8 text-xs font-bold md:text-sm" aria-hidden>
            {t}
          </span>
        </div>
      </div>
    </div>
  );
}
