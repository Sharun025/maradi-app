import { NextRequest } from "next/server";
import { prisma } from "@repo/database";
import { verifyPassword, signAccessToken, signRefreshToken } from "@/lib/auth";
import { ok, badRequest, unauthorized } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return badRequest("Email and password are required");
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user) {
      return unauthorized("Invalid email or password");
    }

    if (user.status !== "active") {
      return unauthorized("Account is inactive or suspended");
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return unauthorized("Invalid email or password");
    }

    const payload = { userId: user.id, email: user.email, role: user.role };
    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(payload),
      signRefreshToken(payload),
    ]);

    return ok({
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 min in seconds
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        bpCode: user.bpCode,
        companyName: user.companyName,
        priceList: user.priceList,
      },
    });
  } catch {
    return badRequest("Invalid request body");
  }
}
