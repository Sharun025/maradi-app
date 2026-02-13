import { NextRequest } from "next/server";
import { prisma } from "@repo/database";
import { hashPassword } from "@/lib/auth";
import { ok, badRequest, unauthorized } from "@/lib/api-response";

const TOKEN_EXPIRY_HOURS = 24;
const MIN_PASSWORD_LENGTH = 8;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password } = body as { token?: string; password?: string };

    if (!token || !password) {
      return badRequest("Token and password are required");
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return badRequest(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
      );
    }

    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token, used: false },
    });

    if (!resetRecord) {
      return unauthorized("Invalid or expired token");
    }

    if (new Date() > resetRecord.expiresAt) {
      await prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { used: true },
      });
      return unauthorized("Token has expired");
    }

    const hashedPassword = await hashPassword(password);

    const existingUser = await prisma.user.findUnique({
      where: { email: resetRecord.email },
    });

    await prisma.$transaction(async (tx) => {
      if (existingUser) {
        await tx.user.update({
          where: { email: resetRecord.email },
          data: { password: hashedPassword },
        });
      } else {
        // New user - create account (e.g. after signup OTP verification)
        await tx.user.create({
          data: {
            email: resetRecord.email,
            password: hashedPassword,
            role: "customer",
          },
        });
      }
      await tx.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { used: true },
      });
    });

    return ok({
      message: "Password set successfully",
    });
  } catch {
    return badRequest("Invalid request body");
  }
}
