import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import type { Locale } from "next-intl";
import { routing } from "@/i18n/routing";
import Script from "next/script";
import { Providers } from "@/app/providers";
import { ConditionalChrome } from "@/components/conditional-chrome";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TrustBar } from "@/components/trust-bar";
import { absoluteUrl, getSiteUrl } from "@/lib/sitemap-build";

const fontSans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "metadata",
  });
  const base = getSiteUrl();
  const canonical = absoluteUrl(base, locale, "/");
  const brand = "Libas Collection";
  return {
    metadataBase: new URL(base),
    title: {
      default: t("title"),
      template: `%s | ${brand}`,
    },
    description: t("description"),
    alternates: {
      canonical,
      languages: Object.fromEntries(
        routing.locales.map((loc) => [
          loc,
          absoluteUrl(base, loc, "/"),
        ]) as [string, string][]
      ),
    },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: brand,
      title: t("title"),
      description: t("description"),
      locale: locale === "bn" ? "bn_BD" : "en_IN",
      alternateLocale: routing.locales.filter((l) => l !== locale),
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
    },
    robots: { index: true, follow: true },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${fontSans.variable} ${fontSans.className} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background transition-colors duration-200">
        <Script
          id="libas-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=localStorage.getItem('libas_theme_mode');var d=m==='dark';document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){}})();`,
          }}
        />
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <ConditionalChrome
              header={<SiteHeader />}
              trustBar={<TrustBar />}
              footer={<SiteFooter />}
            >
              {children}
            </ConditionalChrome>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
