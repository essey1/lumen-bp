import { NextResponse } from "next/server"
import { cleanupExpiredOTPsCron } from "@/lib/otp-cleanup"
import type { NextRequest } from "next/server"

/**
 * Cron endpoint to clean up expired OTPs
 * Protect this with a secret key from services like:
 * - Vercel Cron
 * - EasyCron
 * - Google Cloud Scheduler
 * 
 * Usage: GET /api/cron/cleanup-otps?key=YOUR_CRON_SECRET
 */

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  // Verify secret
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await cleanupExpiredOTPsCron()
    return NextResponse.json({
      success: true,
      message: "OTP cleanup completed",
      ...result
    })
  } catch (error) {
    console.error("Cron error:", error)
    return NextResponse.json(
      { error: "Cleanup failed" },
      { status: 500 }
    )
  }
}
