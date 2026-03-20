// src/middleware.ts
import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = getSessionCookie(request);

  const isAuth =
    pathname.startsWith("/login") || pathname.startsWith("/register");
  const isDashboard = pathname.startsWith("/dashboard");
  const isAccount = pathname.startsWith("/account");

  if (!session) {
    if (isDashboard || isAccount) {
      const url = new URL("/login", request.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (isAuth) return NextResponse.redirect(new URL("/dashboard", request.url));

  const res = NextResponse.next();
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images).*)"],
};
