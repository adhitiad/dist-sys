// src/proxy.ts (Next.js 16 middleware)
import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

// Routes yang tidak memerlukan autentikasi
const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/_next",
  "/favicon.ico",
  "/images",
];

// Dashboard routes yang memerlukan autentikasi
const DASHBOARD_ROUTES = [
  "/dashboard",
  "/warehouses",
  "/products",
  "/orders",
  "/stock-transfers",
  "/suppliers",
  "/purchase-orders",
  "/reports",
  "/users",
  "/settings",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = getSessionCookie(request);

  // Skip public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if accessing dashboard routes
  const isDashboardRoute = DASHBOARD_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Redirect to login if not authenticated
  if (!session) {
    if (isDashboardRoute) {
      const url = new URL("/login", request.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    // API routes return 401
    if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth")) {
      return NextResponse.json(
        { success: false, error: "Sesi tidak valid. Silakan login kembali." },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // Redirect authenticated users away from auth pages
  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Add security headers
  const res = NextResponse.next();
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  return res;
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|images).*)"],
};
