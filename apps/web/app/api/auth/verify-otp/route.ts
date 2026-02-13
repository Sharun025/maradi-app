import { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@repo/database";
import { ok, badRequest, unauthorized } from "@/lib/api-response";

const SET_PASSWORD_TOKEN_EXPIRY_HOURS = 24;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp } = body as { email?: string; otp?: string };

    if (!email || !otp) {
      return badRequest("Email and OTP are required");
    }

    const normalizedEmail = email.trim().toLowerCase();
    const otpTrimmed = otp.trim();

    const record = await prisma.otpVerification.findFirst({
      where: {
        email: normalizedEmail,
        otp: otpTrimmed,
        used: false,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return unauthorized("Invalid or expired OTP");
    }

    if (new Date() > record.expiresAt) {
      await prisma.otpVerification.update({
        where: { id: record.id },
        data: { used: true },
      });
      return unauthorized("OTP has expired");
    }

    await prisma.otpVerification.update({
      where: { id: record.id },
      data: { used: true },
    });

    // Create set-password token for use in set-password endpoint
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + SET_PASSWORD_TOKEN_EXPIRY_HOURS);

    await prisma.passwordResetToken.create({
      data: {
        token,
        email: normalizedEmail,
        expiresAt,
      },
    });

    return ok({
      verified: true,
      message: "OTP verified successfully",
      token,
      expiresIn: SET_PASSWORD_TOKEN_EXPIRY_HOURS * 3600,
    });
  } catch {
    return badRequest("Invalid request body");
  }
}
