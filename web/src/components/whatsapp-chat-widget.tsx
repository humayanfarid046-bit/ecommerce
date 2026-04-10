"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { getSupportState, logWhatsAppClick } from "@/lib/support-review-storage";

export function WhatsAppChatWidget() {
  const t = useTranslations("nav");
  const [num, setNum] = useState("919876543210");

  useEffect(() => {
    const sync = () => setNum(getSupportState().chatConfig.whatsappE164);
    sync();
    window.addEventListener("lc-support", sync);
    return () => window.removeEventListener("lc-support", sync);
  }, []);

  const href = `https://wa.me/${num.replace(/\D/g, "")}?text=${encodeURIComponent("Hi — I need help with my order.")}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        try {
          logWhatsAppClick(typeof window !== "undefined" ? window.location.pathname : "");
        } catch {
          /* ignore */
        }
      }}
      className="fixed bottom-[4.75rem] right-4 z-[53] hidden h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 hover:shadow-xl md:bottom-8 md:right-8 md:flex md:h-14 md:w-14"
      aria-label={t("whatsappChat")}
      title={t("whatsappChat")}
    >
      <MessageCircle className="h-7 w-7" strokeWidth={2.2} />
    </a>
  );
}
