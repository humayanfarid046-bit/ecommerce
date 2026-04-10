"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { logWhatsAppClick } from "@/lib/support-review-storage";
import {
  fetchStorefrontContact,
  whatsappHref,
} from "@/lib/storefront-contact-client";

export function WhatsAppChatWidget() {
  const t = useTranslations("nav");
  const [href, setHref] = useState(
    "https://wa.me/?text=Hi%20%E2%80%94%20I%20need%20help%20with%20my%20order."
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const c = await fetchStorefrontContact();
      if (cancelled) return;
      setHref(whatsappHref(c, "Hi — I need help with my order."));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
