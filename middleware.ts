import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname === "/" || req.nextUrl.pathname === "/dashboard") {
    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET as string,
      secureCookie: process.env.NODE_ENV === "production" ? true : false,
      cookieName:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.session-token"
          : "authjs.session-token",
    });

    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (token?.role === "USER") {
      return NextResponse.next();
    }

    if (token?.role === "ADMIN") {
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
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
