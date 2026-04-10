import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const p = request.nextUrl.pathname;
  const isDeliveryRoute =
    p === "/delivery/dashboard" ||
    /^\/(en|bn)\/delivery\/dashboard\/?$/.test(p);
  if (isDeliveryRoute) {
    const role = (request.cookies.get("lc_role")?.value ?? "").toUpperCase();
    if (role !== "DELIVERY_PARTNER" && role !== "ADMIN") {
      const locale = p.startsWith("/bn") ? "bn" : "en";
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }
  }
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
