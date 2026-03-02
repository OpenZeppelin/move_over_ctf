import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { VALID_LOCALES } from "@/i18n/locales";
import { LOCALE_COOKIE } from "@/config";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];

  if (VALID_LOCALES.includes(first as (typeof VALID_LOCALES)[number])) {
    return NextResponse.next();
  }

  let locale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (!locale || !VALID_LOCALES.includes(locale as (typeof VALID_LOCALES)[number])) {
    locale = "en";
  }

  const newPath = `/${locale}${pathname === "/" ? "" : pathname}`;
  const res = NextResponse.redirect(new URL(newPath, request.url));
  return res;
}

export const config = {
  matcher: ["/", "/levels", "/levels/(.+)"],
};
