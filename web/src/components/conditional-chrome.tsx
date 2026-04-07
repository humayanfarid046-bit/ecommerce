"use client";

import { usePathname } from "@/i18n/navigation";
import { AnnouncementBar } from "@/components/announcement-bar";
import { SeoHeadInjector } from "@/components/seo-head-injector";
import { SitePromoPopup } from "@/components/site-promo-popup";
import { WhatsAppChatWidget } from "@/components/whatsapp-chat-widget";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { HelpSupportFab } from "@/components/help-support-fab";

/**
 * Hides storefront header/footer on `/admin` routes so the admin shell is full-width.
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
  const pathname = usePathname();
  const isAdmin = pathname?.includes("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <SeoHeadInjector />
      <AnnouncementBar />
      {header}
      <main className="flex-1 bg-[#F9FAFB] pb-16 pt-0 dark:bg-slate-950 md:pb-6">
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
