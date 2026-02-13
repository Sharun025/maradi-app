import { NextRequest } from "next/server";
import { prisma } from "@repo/database";
import { signAccessToken, verifyRefreshToken } from "@/lib/auth";
import { ok, badRequest, unauthorized } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    let refreshToken: string | null = null;

    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      refreshToken = authHeader.slice(7);
    }

    if (!refreshToken) {
      const body = await req.json().catch(() => ({}));
      refreshToken = (body as { refreshToken?: string })?.refreshToken ?? null;
    }

    if (!refreshToken) {
      return badRequest("Refresh token is required");
    }

    const payload = await verifyRefreshToken(refreshToken);
    if (!payload) {
      return unauthorized("Invalid or expired refresh token");
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || user.status !== "active") {
      return unauthorized("User not found or inactive");
    }

    const accessToken = await signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return ok({
      accessToken,
      expiresIn: 900,
    });
  } catch {
    return badRequest("Invalid request body");
  }
}
