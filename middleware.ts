import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

async function getAuthToken(req: NextRequest) {
  return getToken({
    req,
    secret: process.env.AUTH_SECRET as string,
    secureCookie: process.env.NODE_ENV === "production" ? true : false,
    cookieName:
      process.env.NODE_ENV === "production"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
  });
}

export default async function middleware(req: NextRequest) {
  // Handle /create-password route
  if (req.nextUrl.pathname === "/create-password") {
    const token = await getAuthToken(req);

    // Not logged in -> redirect to home
    if (!token) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // User already has password -> redirect to dashboard
    if (token.hasPassword) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  }

  // Handle /dashboard route
  if (req.nextUrl.pathname === "/dashboard") {
    const token = await getAuthToken(req);

    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Social login user without password -> redirect to create-password
    // hasSocialAccount !== false handles: true (social user) and undefined (old tokens)
    if (!token.hasPassword && token.hasSocialAccount !== false) {
      return NextResponse.redirect(new URL("/create-password", req.url));
    }

    if (token?.role === "USER") {
      return NextResponse.next();
    }

    if (token?.role === "ADMIN" || token?.role === "SUB_ADMIN") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
