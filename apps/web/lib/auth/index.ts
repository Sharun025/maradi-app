/**
 * Authentication utilities - JWT, passwords, OTP
 */

export {
  generateToken,
  verifyToken,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  type JwtPayload,
  type DecodedPayload,
} from "./token";

export { hashPassword, comparePassword } from "./password";

export { generateOTP, sendOTP } from "./otp";

// Legacy alias for comparePassword
export { comparePassword as verifyPassword } from "./password";
