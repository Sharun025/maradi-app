/**
 * OTP generation and email delivery utilities
 */

import { Resend } from "resend";

const OTP_LENGTH = 6;
const OTP_MIN = 100000;
const OTP_MAX = 999999;

/**
 * Generate a 6-digit numeric OTP.
 */
export function generateOTP(): string {
  const otp = Math.floor(OTP_MIN + Math.random() * (OTP_MAX - OTP_MIN + 1));
  return otp.toString().padStart(OTP_LENGTH, "0");
}

/**
 * Send OTP via email using Resend.
 * Requires RESEND_API_KEY in environment.
 * @returns true if sent successfully, false on failure
 */
export async function sendOTP(email: string, otp: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail =
    process.env.RESEND_FROM_EMAIL ?? "noreply@maradi.app";
  const fromName = process.env.RESEND_FROM_NAME ?? "Maradi";

  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV] No RESEND_API_KEY - OTP for ${email}: ${otp}`);
      return true;
    }
    console.error("[auth] RESEND_API_KEY is not set");
    return false;
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: email,
      subject: "Your verification code",
      html: `
        <p>Your verification code is: <strong>${otp}</strong></p>
        <p>This code expires in 10 minutes. Do not share it with anyone.</p>
      `,
    });

    if (error) {
      console.error("[auth] Resend error:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[auth] Failed to send OTP:", err);
    return false;
  }
}
