import { hash, compare } from "bcryptjs"

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function hashOTP(code: string): Promise<string> {
  return hash(code, 10)
}

export async function verifyOTP(code: string, hashedCode: string): Promise<boolean> {
  return compare(code, hashedCode)
}

export function getOTPExpiry(): Date {
  return new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
}

export function isResendAllowed(lastResendAt: Date | null): boolean {
  if (!lastResendAt) return true
  const cooldown = 60 * 1000 // 1 minute cooldown
  return Date.now() - lastResendAt.getTime() > cooldown
}
