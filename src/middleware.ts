// src/middleware.ts
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: Request) {
  const url = new URL(req.url);
  const { pathname } = url;

  // Read JWT (works on Edge). Needs NEXTAUTH_SECRET in env.
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const isLoggedIn = !!token;
  const role = (token?.role as "ADMIN" | "MEMBER" | undefined) ?? undefined;

  // Protect /admin
  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      const to = new URL("/auth/login", url.origin);
      to.searchParams.set("callbackUrl", url.href);
      return NextResponse.redirect(to);
    }
    if (role !== "ADMIN") {
      // friendlier redirect for non-admins
      return NextResponse.redirect(new URL("/member", url.origin));
    }
  }

  // Protect /member
  if (pathname.startsWith("/member")) {
    if (!isLoggedIn) {
      const to = new URL("/auth/login", url.origin);
      to.searchParams.set("callbackUrl", url.href);
      return NextResponse.redirect(to);
    }
  }

  return NextResponse.next();
}

export const config = {
  // keep middleware narrow; do NOT include /auth/* or /api/auth/*
  matcher: [
    "/admin/:path*",
    "/member/:path*",
    //protect api
    "/api/admin/:path*",
    "/api/member/:path*",
  ],
};
