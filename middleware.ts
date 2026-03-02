// middleware.ts – Route protection and RBAC enforcement
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequestWithAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;
    const role = token?.role as string | undefined;

    // ── Role → allowed prefixes ───────────────────────────────────
    const roleRoutes: Record<string, string[]> = {
      admin: ["/admin", "/notifications", "/settings"],
      doctor: ["/doctor", "/notifications", "/settings"],
      nurse: ["/nurse", "/notifications", "/settings"],
      receptionist: ["/receptionist", "/notifications", "/settings"],
    };

    // If they're on a role-specific path, enforce ownership
    const rolePrefixes = ["/admin", "/doctor", "/nurse", "/receptionist"];
    const matchedPrefix = rolePrefixes.find((p) => pathname.startsWith(p));

    if (matchedPrefix && role) {
      const allowed = roleRoutes[role] ?? [];
      const isAllowed = allowed.some((p) => pathname.startsWith(p));
      if (!isAllowed) {
        // Redirect to their own dashboard
        const dashboardUrl = new URL(`/${role}/dashboard`, req.url);
        return NextResponse.redirect(dashboardUrl);
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Only run middleware for authenticated users
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Public paths – allow without auth
        const publicPaths = [
          "/",
          "/admin/login",
          "/doctor/login",
          "/nurse/login",
          "/receptionist/login",
          "/api/auth",
          "/api/seed",
          "/_next",
          "/favicon.ico",
        ];

        if (publicPaths.some((p) => pathname.startsWith(p))) return true;

        // All other paths require auth
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
