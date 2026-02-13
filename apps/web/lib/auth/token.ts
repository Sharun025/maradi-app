/**
 * JWT token generation and verification utilities
 */

import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "default-secret-change-in-production"
);
const REFRESH_SECRET = new TextEncoder().encode(
  process.env.REFRESH_SECRET ?? "default-refresh-secret-change-in-production"
);
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  type: "access" | "refresh";
}

export interface DecodedPayload {
  userId: string;
  email: string;
  role: string;
  type: "access" | "refresh";
  iat?: number;
  exp?: number;
}

/**
 * Generate access JWT for a user.
 * @param userId - User ID
 * @param role - User role (e.g. admin, customer)
 * @param email - Optional email (defaults to empty string)
 */
export async function generateToken(
  userId: string,
  role: string,
  email = ""
): Promise<string> {
  return new SignJWT({ userId, email, role, type: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

/**
 * Verify JWT and return decoded payload, or null if invalid/expired.
 */
export async function verifyToken(
  token: string
): Promise<DecodedPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.type !== "access") return null;
    return payload as unknown as DecodedPayload;
  } catch {
    return null;
  }
}

/** Generate access token (legacy; uses full payload) */
export async function signAccessToken(
  payload: Omit<JwtPayload, "type">
): Promise<string> {
  return new SignJWT({ ...payload, type: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

/** Generate refresh token */
export async function signRefreshToken(
  payload: Omit<JwtPayload, "type">
): Promise<string> {
  return new SignJWT({ ...payload, type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(REFRESH_SECRET);
}

/** Verify access token (legacy) */
export async function verifyAccessToken(
  token: string
): Promise<JwtPayload | null> {
  return verifyToken(token) as Promise<JwtPayload | null>;
}

/** Verify refresh token */
export async function verifyRefreshToken(
  token: string
): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, REFRESH_SECRET);
    if (payload.type !== "refresh") return null;
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}
