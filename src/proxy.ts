import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { defaultLocale, locales, type Locale } from "@/dictionaries";

const LOCALE_COOKIE = "NEXT_LOCALE";
const SESSION_COOKIE = "luna_session";
const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET!
);

function getLocaleFromAcceptLanguage(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;

  const preferred = acceptLanguage
    .split(",")
    .map((part) => part.split(";")[0].trim().toLowerCase());

  for (const lang of preferred) {
    const match = locales.find((locale) => lang === locale || lang.startsWith(`${locale}-`));
    if (match) return match;
  }

  return defaultLocale;
}

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, SECRET, { algorithms: ["HS256"] });
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin routes bypass locale prefix
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return NextResponse.next();
  }

  const pathnameHasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );

  if (!pathnameHasLocale) {
    const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
    const locale =
      cookieLocale && locales.includes(cookieLocale as Locale)
        ? (cookieLocale as Locale)
        : getLocaleFromAcceptLanguage(request.headers.get("accept-language"));

    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname}`;
    return NextResponse.redirect(url);
  }

  // Protect dashboard routes
  const isDashboard = locales.some(
    (locale) =>
      pathname === `/${locale}/dashboard` || pathname.startsWith(`/${locale}/dashboard/`)
  );

  if (isDashboard) {
    const authed = await isAuthenticated(request);
    if (!authed) {
      // Determine current locale from path
      const locale = locales.find(
        (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
      ) ?? defaultLocale;
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
