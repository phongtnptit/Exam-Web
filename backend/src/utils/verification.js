import crypto from "node:crypto";

// Ma xac minh 6 so: chi luu SHA-256 cua ma trong DB, khong luu ma goc.
export const CODE_TTL_MINUTES = Number(
  process.env.VERIFICATION_CODE_EXPIRES_MINUTES || 15
);
export const RESEND_COOLDOWN_SECONDS = 60;

export function generateVerificationCode() {
  return String(crypto.randomInt(100000, 1000000));
}

export function hashVerificationCode(code) {
  return crypto.createHash("sha256").update(String(code)).digest("hex");
}

export function verificationExpiryDate() {
  return new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);
}
