// =========================================================
// OTP Helper — HMAC-SHA256
// Generates and validates 6-digit OTPs for order pickup
//
// The OTP is stateless — it is never stored in the DB.
// It can always be reconstructed from the same inputs:
//   secretKey = OTP_SECRET + userId + orderId
//
// Generation flow (on payment confirmed):
//   HMAC-SHA256(OTP_SECRET, userId+orderId) → 6 digits → sent to customer
//
// Validation flow (on store marking order as completed):
//   Store sends OTP + orderId → Orders reconstructs and compares
// =========================================================

import { createHmac } from 'crypto';

const OTP_SECRET = process.env.OTP_SECRET;

// ---------------------------------------------------------
// Build the deterministic key for a given order
// ---------------------------------------------------------
function buildKey(userId: number, orderId: number): string {
  return `${userId}${orderId}`;
}

// ---------------------------------------------------------
// Generate a 6-digit OTP for an order
// ---------------------------------------------------------
export function generateOTP(userId: number, orderId: number): string {
  if (!OTP_SECRET) throw new Error('OTP_SECRET is not set');

  const hmac = createHmac('sha256', OTP_SECRET);
  hmac.update(buildKey(userId, orderId));
  const hash = hmac.digest('hex');

  // Take first 6 digits from the hex hash converted to a number
  // This ensures we always get exactly 6 digits
  const numeric = parseInt(hash.substring(0, 8), 16);
  return String(numeric % 1_000_000).padStart(6, '0');
}

// ---------------------------------------------------------
// Validate an OTP for a given order
// Reconstructs the expected OTP and compares
// ---------------------------------------------------------
export function validateOTP(
  otp: string,
  userId: number,
  orderId: number
): boolean {
  const expected = generateOTP(userId, orderId);
  return otp === expected;
}