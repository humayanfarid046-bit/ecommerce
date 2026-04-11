import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { categories } from "@/lib/storefront-catalog";
import { Mail } from "lucide-react";
import {
  MastercardLogo,
  NetBankingLogo,
  PaytmLogo,
  PhonePeLogo,
  RuPayLogo,
  UpiLogo,
  VisaLogo,
} from "@/components/payment-partner-logos";
import { STORE_SHELL } from "@/lib/store-layout";

function SocialInstagram({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function SocialFacebook({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function SocialWhatsApp({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/** Max logo height 25px; grayscale until hover (premium, non-distracting). */
const PAY_LOGO =
  "h-[25px] max-h-[25px] w-auto max-w-[3.25rem] object-contain object-center";

function FooterPolicyLink({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className: string;
}) {
  const isExternal = /^https?:\/\//i.test(href);

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

export async function SiteFooter() {
  const t = await getTranslations("footer");
  const tc = await getTranslations("categories");
  const topCats = categories.slice(0, 6);
  const year = new Date().getFullYear();
  const privacyHref = process.env.NEXT_PUBLIC_PRIVACY_POLICY_URL || "/privacy";
  const termsHref = process.env.NEXT_PUBLIC_TERMS_POLICY_URL || "/terms";
  const refundHref = process.env.NEXT_PUBLIC_REFUND_POLICY_URL || "/shipping";

  const paymentMethods = [
    { id: "upi", node: <UpiLogo className={PAY_LOGO} /> },
    { id: "visa", node: <VisaLogo className={PAY_LOGO} /> },
    { id: "mc", node: <MastercardLogo className={PAY_LOGO} /> },
    { id: "rupay", node: <RuPayLogo className={PAY_LOGO} /> },
    { id: "phonepe", node: <PhonePeLogo className={PAY_LOGO} /> },
    { id: "paytm", node: <PaytmLogo className={PAY_LOGO} /> },
    { id: "netbank", node: <NetBankingLogo className={PAY_LOGO} /> },
  ] as const;

  const linkClass =
    "text-sm text-slate-600 transition-colors hover:text-[#2563eb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]/40 rounded-sm dark:text-slate-400 dark:hover:text-[#60a5fa]";

  return (
    <footer
      className="mt-auto border-t border-[#E5E7EB] bg-[#F5F7FA] text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
      style={{ lineHeight: 1.6 }}
    >
      <div className={STORE_SHELL}>
        <div className="grid grid-cols-1 gap-8 py-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10 lg:py-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("footerCompany")}
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
              {t("footerSellerLegalName")}
            </p>
            <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {t("footerRegisteredAddress")}
            </p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/search" className={linkClass}>
                  {t("search")}
                </Link>
              </li>
              <li>
                <Link href="/account/orders" className={linkClass}>
                  {t("orders")}
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className={linkClass}>
                  {t("wishlist")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("footerCustomerCare")}
            </p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/help" className={linkClass}>
                  {t("helpCenter")}
                </Link>
              </li>
              <li className="text-sm text-slate-600 dark:text-slate-400">
                {t("payments")}
              </li>
              <li className="text-sm text-slate-600 dark:text-slate-400">
                {t("returns")}
              </li>
              <li className="text-sm text-slate-600 dark:text-slate-400">
                {t("supportPhone")}
              </li>
              <li className="text-sm text-slate-600 dark:text-slate-400">
                {t("supportHours")}
              </li>
            </ul>
          </div>

          <div className="sm:col-span-2 lg:col-span-1">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("footerPolicies")}
            </p>
            <ul className="mt-3 space-y-2">
              <li>
                <FooterPolicyLink
                  href={privacyHref}
                  className={linkClass}
                  label={t("footerPrivacy")}
                />
              </li>
              <li>
                <FooterPolicyLink
                  href={termsHref}
                  className={linkClass}
                  label={t("footerTerms")}
                />
              </li>
              <li>
                <FooterPolicyLink
                  href={refundHref}
                  className={linkClass}
                  label={t("footerRefund")}
                />
              </li>
              <li>
                <Link href="/cookies" className={linkClass}>
                  {t("footerCookies")}
                </Link>
              </li>
            </ul>
            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("followUs")}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-[#E5E7EB] bg-white p-2 text-slate-600 transition hover:border-[#2563eb]/45 hover:text-[#2563eb] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-[#60a5fa]"
                aria-label="Instagram"
              >
                <SocialInstagram className="h-4 w-4" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-[#E5E7EB] bg-white p-2 text-slate-600 transition hover:border-[#2563eb]/45 hover:text-[#2563eb] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-[#60a5fa]"
                aria-label="Facebook"
              >
                <SocialFacebook className="h-4 w-4" />
              </a>
              <a
                href="https://wa.me/8800000000000"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-[#E5E7EB] bg-white p-2 text-slate-600 transition hover:border-[#2563eb]/45 hover:text-[#2563eb] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-[#60a5fa]"
                aria-label={t("socialWhatsApp")}
              >
                <SocialWhatsApp className="h-4 w-4" />
              </a>
              <a
                href="mailto:support@ajhlibascollection.com"
                className="rounded-full border border-[#E5E7EB] bg-white p-2 text-slate-600 transition hover:border-[#2563eb]/45 hover:text-[#2563eb] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-[#60a5fa]"
                aria-label={t("socialEmail")}
              >
                <Mail className="h-4 w-4" strokeWidth={1.75} />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-[#E5E7EB] py-4 dark:border-slate-700">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t("categoriesTitle")}
          </p>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {topCats.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/category/${c.slug}`}
                  className="text-sm text-slate-600 transition hover:text-[#2563eb] dark:text-slate-400 dark:hover:text-[#60a5fa]"
                >
                  {tc(c.slug)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-[#E5E7EB] py-4 dark:border-slate-700">
          <p className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
            {t("paymentPartners")}
          </p>
          <ul
            className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-3"
            aria-label={t("paymentPartners")}
          >
            {paymentMethods.map(({ id, node }) => (
              <li
                key={id}
                className="flex h-[25px] max-h-[25px] items-center justify-center grayscale transition-[filter] duration-200 hover:grayscale-0"
              >
                {node}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
            {t("razorpaySectionSubtitle")}
          </p>
          <p className="mx-auto mt-2 max-w-2xl text-center text-[11px] leading-relaxed text-slate-500 dark:text-slate-500">
            {t("razorpayProcessorDisclaimer")}
          </p>
          <a
            href="https://razorpay.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block text-center text-xs font-semibold text-[#2563eb] hover:underline dark:text-[#60a5fa]"
          >
            {t("razorpayLink")}
          </a>
          <p className="mt-2 text-center text-[11px] text-slate-500 dark:text-slate-500">
            {t("codCheckoutNote")}
          </p>
        </div>

        <p className="border-t border-[#E5E7EB] py-4 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
          {t("footerCopyright", { year })}
        </p>
      </div>
    </footer>
  );
}
