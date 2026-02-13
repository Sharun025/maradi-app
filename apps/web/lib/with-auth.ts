/**
 * Auth middleware helpers for API routes
 */

import { NextRequest } from "next/server";
import { verifyAccessToken, type JwtPayload } from "@/lib/auth";
import { unauthorized, forbidden } from "./api-response";

/** Extract Bearer token from Authorization header or cookie */
function getToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return req.cookies.get("accessToken")?.value ?? null;
}

/**
 * Requires valid access token. Returns decoded payload or error response.
 */
export async function requireAuth(
  req: NextRequest
): Promise<{ error: Response } | { payload: JwtPayload }> {
  const token = getToken(req);
  if (!token) {
    return { error: unauthorized("Missing or invalid token") };
  }
  const payload = await verifyAccessToken(token);
  if (!payload) {
    return { error: unauthorized("Invalid or expired token") };
  }
  return { payload };
}

/**
 * Requires auth AND admin role.
 */
export async function requireAdmin(
  req: NextRequest
): Promise<{ error: Response } | { payload: JwtPayload }> {
  const result = await requireAuth(req);
  if ("error" in result) return result;
  if (result.payload.role !== "admin") {
    return { error: forbidden("Admin access required") };
  }
  return result;
}
