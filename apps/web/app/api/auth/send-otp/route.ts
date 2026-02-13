import { NextRequest } from "next/server";
import { prisma } from "@repo/database";
import { generateOTP, sendOTP } from "@/lib/auth";
import { ok, badRequest } from "@/lib/api-response";

const OTP_EXPIRY_MINUTES = 10;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body as { email?: string };

    if (!email || typeof email !== "string") {
      return badRequest("Email is required");
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Invalidate any existing OTPs for this email
    await prisma.otpVerification.updateMany({
      where: { email: normalizedEmail, used: false },
      data: { used: true },
    });

    const otp = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

    await prisma.otpVerification.create({
      data: {
        email: normalizedEmail,
        otp,
        expiresAt,
      },
    });

    const sent = await sendOTP(normalizedEmail, otp);
    if (!sent && process.env.NODE_ENV === "development") {
      console.log(`[DEV] OTP for ${normalizedEmail}: ${otp}`);
    }

    return ok({
      message: "OTP sent successfully",
      expiresIn: OTP_EXPIRY_MINUTES * 60,
    });
  } catch {
    return badRequest("Invalid request body");
  }
}
