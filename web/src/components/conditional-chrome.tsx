"use client";

import { usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { AnnouncementBar } from "@/components/announcement-bar";
import { SeoHeadInjector } from "@/components/seo-head-injector";
import { SitePromoPopup } from "@/components/site-promo-popup";
import { WhatsAppChatWidget } from "@/components/whatsapp-chat-widget";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { HelpSupportFab } from "@/components/help-support-fab";

/**
 * Hides storefront header/footer on `/admin` and `/delivery/*` so admin / delivery partner
 * UIs are not wrapped in the shopper shell (cart, account, bottom nav, promo FABs).
 * Header/footer are passed from the server layout so server-only components (e.g. SiteFooter
 * with getTranslations) are not imported into this client module.
 */
export function ConditionalChrome({
  children,
  header,
  trustBar,
  footer,
}: {
  children: React.ReactNode;
  header: React.ReactNode;
  /** Shown above footer on storefront (e.g. safe payments strip). */
  trustBar?: React.ReactNode;
  footer: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const isAdmin = pathname.includes("/admin");
  /** Default locale may omit prefix (`/delivery/...`); others use `/bn/delivery/...`. */
  const isDeliveryPartnerShell =
    pathname.startsWith("/delivery") ||
    routing.locales.some((loc) => pathname.startsWith(`/${loc}/delivery`));

  if (isAdmin || isDeliveryPartnerShell) {
    return <>{children}</>;
  }

  return (
    <>
      <SeoHeadInjector />
      <AnnouncementBar />
      {header}
      <main className="min-w-0 w-full max-w-full flex-1 overflow-x-hidden bg-[#F9FAFB] pb-16 pt-0 dark:bg-slate-950 md:pb-6">
        {children}
      </main>
      <MobileBottomNav />
      {trustBar}
      {footer}
      <SitePromoPopup />
      <HelpSupportFab />
      <WhatsAppChatWidget />
    </>
  );
}
