/**
 * Next.js middleware: JWT validation, role-based route protection, token refresh
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "default-secret-change-in-production"
);
const REFRESH_SECRET = new TextEncoder().encode(
  process.env.REFRESH_SECRET ?? "default-refresh-secret-change-in-production"
);
const ACCESS_TOKEN_EXPIRY = "15m";

/** Routes that require authentication (path → allowed roles; empty = any) */
const PROTECTED_ROUTES: Record<string, string[]> = {
  "/dashboard": ["admin", "customer"],
  "/orders": ["admin", "customer"],
  "/cart": ["admin", "customer"],
  "/profile": ["admin", "customer"],
  "/admin": ["admin"],
};

/** Routes that are always public */
const PUBLIC_ROUTES = ["/", "/login", "/signup", "/api/auth"];

/** API routes use route-level auth (with-auth); middleware only validates pages */
const API_PATH_PREFIX = "/api";

/** Static assets and Next.js internals */
const SKIP_PATHS = [
  "/_next",
  "/favicon.ico",
  "/public",
  "/vercel.svg",
  "/turborepo",
  "/window.svg",
  "/globe.svg",
];

function getToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return req.cookies.get("accessToken")?.value ?? null;
}

function getRefreshToken(req: NextRequest): string | null {
  return req.cookies.get("refreshToken")?.value ?? null;
}

function isPublicPath(pathname: string): boolean {
  if (SKIP_PATHS.some((p) => pathname.startsWith(p))) return true;
  if (pathname.startsWith(API_PATH_PREFIX)) return true; // API routes use route-level auth
  if (PUBLIC_ROUTES.some((p) => pathname === p || pathname.startsWith(`${p}/`)))
    return true;
  return false;
}

function getRequiredRoles(pathname: string): string[] | null {
  for (const [route, roles] of Object.entries(PROTECTED_ROUTES)) {
    if (pathname === route || pathname.startsWith(`${route}/`)) {
      return roles;
    }
  }
  return null;
}

async function verifyAccessToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.type !== "access") return null;
    return payload as { userId: string; email: string; role: string };
  } catch {
    return null;
  }
}

async function verifyRefreshToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, REFRESH_SECRET);
    if (payload.type !== "refresh") return null;
    return payload as { userId: string; email: string; role: string };
  } catch {
    return null;
  }
}

async function createAccessToken(payload: {
  userId: string;
  email: string;
  role: string;
}): Promise<string> {
  return new SignJWT({ ...payload, type: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  let accessToken = getToken(req);
  let payload = accessToken ? await verifyAccessToken(accessToken) : null;

  // Token refresh: if access token invalid but refresh token present
  if (!payload) {
    const refreshToken = getRefreshToken(req);
    if (refreshToken) {
      const refreshPayload = await verifyRefreshToken(refreshToken);
      if (refreshPayload) {
        accessToken = await createAccessToken(refreshPayload);
        payload = refreshPayload;

        const response = NextResponse.next();
        response.cookies.set("accessToken", accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 15 * 60,
          path: "/",
        });
        return addUserHeaders(response, payload);
      }
    }

    // No valid token
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const requiredRoles = getRequiredRoles(pathname);
  if (requiredRoles && requiredRoles.length > 0) {
    if (!requiredRoles.includes(payload.role)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return addUserHeaders(NextResponse.next(), payload);
}

function addUserHeaders(
  response: NextResponse,
  payload: { userId: string; role: string }
) {
  response.headers.set("x-user-id", payload.userId);
  response.headers.set("x-user-role", payload.role);
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except static files
     */
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
