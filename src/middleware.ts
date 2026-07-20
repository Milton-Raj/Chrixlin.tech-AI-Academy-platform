import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const ADMIN_COOKIE = "chx_admin_token";

async function isAuthenticated(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!token || !process.env.JWT_SECRET) return false;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
    return Boolean(payload.adminId);
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin pages (except the login screen)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!(await isAuthenticated(req))) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  // Admin APIs (except login)
  if (pathname.startsWith("/api/admin") && pathname !== "/api/admin/login") {
    if (!(await isAuthenticated(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Already signed in? Skip the login screen.
  if (pathname === "/admin/login" && (await isAuthenticated(req))) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
