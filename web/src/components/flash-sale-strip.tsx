"use client";

import { useEffect, useState } from "react";
import { getCms } from "@/lib/cms-storage";
import { Zap } from "lucide-react";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function FlashSaleStrip() {
  const [tick, setTick] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const fn = () => setTick((x) => x + 1);
    window.addEventListener("lc-cms", fn);
    return () => window.removeEventListener("lc-cms", fn);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  void tick;
  const { flashSale } = getCms();
  if (!flashSale.enabled) return null;

  const end = new Date(flashSale.endAt).getTime();
  const left = Math.max(0, end - now);
  if (!Number.isFinite(end) || left <= 0) return null;

  const s = Math.floor(left / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;

  return (
    <div className="border-b border-[#ff6b00]/30 bg-gradient-to-r from-[#ff6b00] to-amber-500 py-2 text-center text-xs font-extrabold text-white shadow-sm md:text-sm">
      <span className="inline-flex items-center justify-center gap-2">
        <Zap className="h-4 w-4 shrink-0" aria-hidden />
        <span>{flashSale.label}</span>
        <span className="font-mono tabular-nums">
          {pad(h)}:{pad(m)}:{pad(sec)}
        </span>
      </span>
    </div>
  );
}
