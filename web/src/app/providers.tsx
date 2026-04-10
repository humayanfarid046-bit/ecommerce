"use client";

import { AuthProvider } from "@/context/auth-context";
import { ThemeProvider } from "@/context/theme-context";
import { AddressesProvider } from "@/context/addresses-context";
import { WishlistProvider } from "@/context/wishlist-context";
import { NotificationsProvider } from "@/context/notifications-context";
import { RecentProvider } from "@/context/recent-context";
import { CompareProvider } from "@/context/compare-context";
import { CartProvider } from "@/context/cart-context";
import { SupportChat } from "@/components/support-chat";
import { AbandonedCheckoutReminder } from "@/components/abandoned-checkout-reminder";
import { CartFlightProvider } from "@/context/cart-flight-context";
import { CompareBar } from "@/components/compare-bar";
import { EngagementHub } from "@/components/engagement-hub";
import { AnalyticsPixels } from "@/components/analytics-pixels";
import { ClientRedirectHandler } from "@/components/client-redirect-handler";
import { MobileDrawerProvider } from "@/context/mobile-drawer-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <CartFlightProvider>
        <AuthProvider>
          <MobileDrawerProvider>
            <AddressesProvider>
              <WishlistProvider>
                <NotificationsProvider>
                  <RecentProvider>
                    <CompareProvider>
                      <CartProvider>
                        <ClientRedirectHandler />
                        <AnalyticsPixels />
                        {children}
                        <AbandonedCheckoutReminder />
                        <SupportChat />
                        <CompareBar />
                        <EngagementHub />
                      </CartProvider>
                    </CompareProvider>
                  </RecentProvider>
                </NotificationsProvider>
              </WishlistProvider>
            </AddressesProvider>
          </MobileDrawerProvider>
        </AuthProvider>
      </CartFlightProvider>
    </ThemeProvider>
  );
}
