import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = ["/login", "/register"];
const memberRoutes = [
  "/dashboard",
  "/rewards",
  "/exchange",
  "/history",
  "/profile",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;
  const role = request.cookies.get("role")?.value;

  // Root → redirect based on auth status
  if (pathname === "/") {
    if (token) {
      return NextResponse.redirect(
        new URL(role === "ADMIN" ? "/admin" : "/dashboard", request.url)
      );
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Public routes — redirect authenticated users to dashboard
  if (publicRoutes.includes(pathname)) {
    if (token) {
      return NextResponse.redirect(
        new URL(role === "ADMIN" ? "/admin" : "/dashboard", request.url)
      );
    }
    return NextResponse.next();
  }

  // Admin routes — MEMBER role blocked
  if (pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Member routes — ADMIN role blocked
  const isMemberRoute = memberRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
  if (isMemberRoute) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (role !== "MEMBER") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
